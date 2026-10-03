import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');

// Read package bytes independently through the ZIP directory, then verify each decoded entry.
function readZip(bytes) {
  const end = bytes.length - 22;
  assert.equal(bytes.readUInt32LE(end), 0x06054b50, 'ZIP end record missing');
  assert.equal(bytes.readUInt16LE(end + 4), 0, 'Multi-disk archives are not supported');
  assert.equal(bytes.readUInt16LE(end + 20), 0, 'Unexpected ZIP comment');
  const count = bytes.readUInt16LE(end + 10);
  let position = bytes.readUInt32LE(end + 16);
  const entries = new Map();
  for (let index = 0; index < count; index++) {
    assert.equal(bytes.readUInt32LE(position), 0x02014b50, 'ZIP directory entry missing');
    const method = bytes.readUInt16LE(position + 10);
    const checksum = bytes.readUInt32LE(position + 16);
    const compressedLength = bytes.readUInt32LE(position + 20);
    const expectedLength = bytes.readUInt32LE(position + 24);
    const nameLength = bytes.readUInt16LE(position + 28);
    const extraLength = bytes.readUInt16LE(position + 30);
    const commentLength = bytes.readUInt16LE(position + 32);
    const offset = bytes.readUInt32LE(position + 42);
    const name = bytes.subarray(position + 46, position + 46 + nameLength).toString('utf8');
    assert.ok(
      !name.startsWith('/') && !name.includes('\\') && !name.split('/').includes('..'),
      name,
    );
    assert.ok(!entries.has(name), `Duplicate package entry: ${name}`);
    assert.equal(bytes.readUInt32LE(offset), 0x04034b50);
    const start = offset + 30 + bytes.readUInt16LE(offset + 26) + bytes.readUInt16LE(offset + 28);
    assert.equal(method, 8, 'Expected DEFLATE entry');
    const decoded = inflateRawSync(bytes.subarray(start, start + compressedLength));
    assert.equal(decoded.length, expectedLength, name);
    let crc = 0xffffffff;
    for (const byte of decoded) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    assert.equal((crc ^ 0xffffffff) >>> 0, checksum, `CRC mismatch: ${name}`);
    entries.set(name, decoded);
    position += 46 + nameLength + extraLength + commentLength;
  }
  assert.equal(position, end, 'Unexpected trailing directory bytes');
  return entries;
}

const manifest = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
const version = manifest.version;
const extensionPath = `INSTA_LITE-extension-v${version}.zip`;
const sourcePath = `INSTA_LITE-source-v${version}.zip`;
const websitePath = `INSTA_LITE-website-v${version}.zip`;
const extensionBytes = await readFile(path.join(root, 'artifacts', extensionPath));
const extension = readZip(extensionBytes);
assert.ok(extension.has('manifest.json') && extension.has('INSTALL.txt'));
assert.equal(JSON.parse(extension.get('manifest.json').toString()).version, version);
async function compareExtension(folder, prefix = '') {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) await compareExtension(path.join(folder, entry.name), name + '/');
    else assert.deepEqual(extension.get(name), await readFile(path.join(folder, entry.name)), name);
  }
}
await compareExtension(path.join(root, 'extension'));
assert.deepEqual(
  extensionBytes,
  await readFile(path.join(root, 'website/downloads', extensionPath)),
);
const source = readZip(await readFile(path.join(root, 'artifacts', sourcePath)));
for (const name of source.keys()) {
  assert.ok(
    !name
      .split('/')
      .some(
        (part) =>
          ['.git', '.openai', 'node_modules', 'artifacts', 'dist', '.sites-runtime'].includes(
            part,
          ) || part.startsWith('.env'),
      ),
    `Private/transient file in source archive: ${name}`,
  );
  assert.ok(!name.endsWith(sourcePath), 'Source archive must not include itself');
}
for (const name of [
  'README.md',
  'LICENSE',
  'package.json',
  'package-lock.json',
  '.github/workflows/ci.yml',
  'extension/manifest.json',
  'scripts/build.mjs',
]) {
  assert.deepEqual(
    source.get(name),
    await readFile(path.join(root, name)),
    `Source archive missing/stale: ${name}`,
  );
}
const website = readZip(await readFile(path.join(root, 'artifacts', websitePath)));
assert.ok(website.has('index.html') && website.has('privacy.html'));
assert.deepEqual(website.get(`downloads/${extensionPath}`), extensionBytes);
assert.deepEqual(
  website.get(`downloads/${sourcePath}`),
  await readFile(path.join(root, 'artifacts', sourcePath)),
);
for (const html of ['index.html', 'privacy.html']) {
  const text = website.get(html).toString();
  for (const match of text.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const ref = match[1].split('#')[0].split('?')[0];
    if (!/^(?:https?:|data:|mailto:)/.test(ref))
      assert.ok(website.has(ref), `Broken packaged link: ${html} → ${ref}`);
  }
}
console.log(
  `ZIP integrity, current extension bytes, source privacy exclusions and website downloads passed (${extension.size}/${source.size}/${website.size} entries).`,
);
