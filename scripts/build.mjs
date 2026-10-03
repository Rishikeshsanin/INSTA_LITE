import { readFile, writeFile, mkdir, readdir, copyFile, cp, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync, deflateRawSync } from 'node:zlib';
const root = path.resolve(import.meta.dirname, '..');
const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type),
    header = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  header.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([header, name, data, crc]);
}
function icon(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = x / size,
        py = y / size,
        index = y * (size * 4 + 1) + 1 + x * 4;
      const corner = Math.hypot(
        Math.max(0.18 - px, 0, px - 0.82),
        Math.max(0.18 - py, 0, py - 0.82),
      );
      const inside = corner <= 0.18;
      const white =
        (px >= 0.33 && px <= 0.45 && py >= 0.44 && py <= 0.76) ||
        Math.hypot(px - 0.39, py - 0.29) < 0.07 ||
        Math.hypot(px - 0.65, py - 0.71) < 0.075;
      raw[index] = white ? 255 : 101;
      raw[index + 1] = white ? 255 : 81;
      raw[index + 2] = white ? 255 : 207;
      raw[index + 3] = inside ? 255 : 0;
    }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
async function files(dir, prefix = '', omitSource = false) {
  let result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isSymbolicLink())
      throw new Error(`Refusing to package symlink: ${path.join(dir, e.name)}`);
    if (
      e.name.startsWith('.env') ||
      ['.git', 'node_modules', 'artifacts', 'dist', '.sites-runtime', '.openai'].includes(e.name) ||
      (omitSource && e.name === 'INSTA_LITE-source-v1.0.0.zip')
    )
      continue;
    if (e.isDirectory())
      result.push(...(await files(path.join(dir, e.name), prefix + e.name + '/', omitSource)));
    else result.push({ name: prefix + e.name, data: await readFile(path.join(dir, e.name)) });
  }
  return result.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
function zip(entries) {
  const parts = [],
    central = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name),
      data = deflateRawSync(entry.data),
      crc = crc32(entry.data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50);
    h.writeUInt16LE(20, 4);
    h.writeUInt16LE(0x800, 6);
    h.writeUInt16LE(8, 8);
    h.writeUInt16LE(0x5d43, 12);
    h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(data.length, 18);
    h.writeUInt32LE(entry.data.length, 22);
    h.writeUInt16LE(name.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50);
    c.writeUInt16LE(20, 4);
    c.writeUInt16LE(20, 6);
    c.writeUInt16LE(0x800, 8);
    c.writeUInt16LE(8, 10);
    c.writeUInt16LE(0x5d43, 14);
    c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(data.length, 20);
    c.writeUInt32LE(entry.data.length, 24);
    c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE(offset, 42);
    parts.push(h, name, data);
    central.push(c, name);
    offset += h.length + name.length + data.length;
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}
await mkdir(path.join(root, 'extension/icons'), { recursive: true });
await mkdir(path.join(root, 'website/downloads'), { recursive: true });
for (const size of [16, 32, 48, 128])
  await writeFile(path.join(root, `extension/icons/icon${size}.png`), icon(size));
await copyFile(path.join(root, 'extension/icons/icon128.png'), path.join(root, 'website/icon.png'));
await copyFile(path.join(root, 'extension/ui.css'), path.join(root, 'website/tokens.css'));
const extensionZip = zip(await files(path.join(root, 'extension')));
await writeFile(path.join(root, 'website/downloads/INSTA_LITE-extension-v1.0.0.zip'), extensionZip);
await mkdir(path.join(root, 'artifacts'), { recursive: true });
await writeFile(path.join(root, 'artifacts/INSTA_LITE-extension-v1.0.0.zip'), extensionZip);
const sourceEntries = [];
const publicPaths = [
  'extension',
  'website',
  'scripts',
  'tests',
  'docs',
  '.github',
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CHANGELOG.md',
  'DESIGN.md',
  'PRODUCT.md',
  'UX-CONTRACT.md',
  'package.json',
  'package-lock.json',
  'premium-ui.json',
  'vercel.json',
  '.gitignore',
  '.prettierignore',
  '.prettierrc.json',
];
for (const name of publicPaths) {
  try {
    const info = await lstat(path.join(root, name));
    if (info.isSymbolicLink()) throw new Error(`Refusing source root symlink: ${name}`);
    if (info.isDirectory())
      sourceEntries.push(...(await files(path.join(root, name), name + '/', true)));
    else sourceEntries.push({ name, data: await readFile(path.join(root, name)) });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
sourceEntries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
const sourceZip = zip(sourceEntries);
await writeFile(path.join(root, 'artifacts/INSTA_LITE-source-v1.0.0.zip'), sourceZip);
await writeFile(path.join(root, 'website/downloads/INSTA_LITE-source-v1.0.0.zip'), sourceZip);
await writeFile(
  path.join(root, 'artifacts/INSTA_LITE-website-v1.0.0.zip'),
  zip(await files(path.join(root, 'website'))),
);
console.log(
  `Built extension (${extensionZip.length} bytes), website and deterministic installation ZIPs.`,
);

await rm(path.join(root, 'dist'), { recursive: true, force: true });
await cp(path.join(root, 'website'), path.join(root, 'dist'), { recursive: true });
