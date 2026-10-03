import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) => !['.git', 'node_modules', 'artifacts', 'dist', '.sites-runtime'].includes(e.name),
    )
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const all = walk(root).filter((f) => !f.includes('/.git/') && !f.includes('/artifacts/'));
for (const file of all.filter((f) => /\.(js|mjs)$/.test(f))) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}
for (const file of all.filter((f) => f.endsWith('.json')))
  JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json')));
assert.deepEqual(manifest.permissions, ['storage', 'declarativeNetRequest', 'alarms']);
for (const file of [
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_page,
  ...manifest.content_scripts[0].js,
  ...manifest.content_scripts[0].css,
  ...manifest.declarative_net_request.rule_resources.map((r) => r.path),
])
  assert.ok(fs.existsSync(path.join(root, 'extension', file)), file);
for (const file of all.filter((f) => /\.(html|css|js)$/.test(f) && !f.includes('/tests/'))) {
  const s = fs.readFileSync(file, 'utf8');
  assert.ok(!/\b(?:alert|confirm|prompt)\s*\(/.test(s), `native dialog in ${file}`);
  if (file.endsWith('.js'))
    assert.ok(
      !/\bfetch\s*\(|XMLHttpRequest|sendBeacon/.test(s),
      `unexpected networking in ${file}`,
    );
}
console.log(
  'JavaScript syntax, JSON, manifest references, narrow permissions and no telemetry checks passed.',
);
