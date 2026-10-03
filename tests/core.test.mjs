import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../extension/core.js';
const P = globalThis.InstaLite;
test('Direct and authentication paths are allowed; distractors and ambiguous prefixes blocked', () => {
  for (const p of [
    '/direct/inbox/',
    '/direct/t/123/',
    '/direct/new/',
    '/accounts/login/',
    '/accounts/password/reset/',
    '/challenge/abc/',
    '/checkpoint/',
    '/two_factor/',
    '/oauth/authorize',
    '/privacy/',
    '/web/login/',
    '/data/privacy/',
  ])
    assert.ok(P.allowedPath(p), p);
  for (const p of [
    '/',
    '/reels/',
    '/reel/abc/',
    '/p/abc/',
    '/explore/',
    '/stories/abc/',
    '/someone/',
    '/directly/',
    '/accounts-lookalike/',
  ])
    assert.ok(!P.allowedPath(p), p);
});
test('Instagram origin checks reject lookalikes, cleartext and malformed URLs', () => {
  for (const u of ['https://instagram.com/', 'https://www.instagram.com/direct/inbox/'])
    assert.ok(P.instagramURL(u));
  for (const u of [
    'http://instagram.com/',
    'https://instagram.com.evil.com/',
    'https://evil.com/instagram.com',
    'garbage',
    'https://help.instagram.com/',
  ])
    assert.ok(!P.instagramURL(u));
});
test('defaults and normalization never accept invalid modes or truthy strings', () => {
  assert.equal(P.preferences().mode, 'react');
  assert.equal(P.preferences({ enabled: 'false' }).enabled, true);
  assert.equal(P.preferences({ mode: 'private-api' }).mode, 'react');
  assert.equal(P.preferences({ theme: 'broken' }).theme, 'system');
  assert.equal(P.preferences({ enabled: false, mode: 'full' }).enabled, false);
});
test('prunes to 30 local calendar days and increments without mutating original', () => {
  const now = new Date(2026, 9, 3, 12);
  const original = {
    '2026-09-03': { blocked: 4 },
    '2026-09-04': { blocked: 2 },
    '2026-10-03': { seconds: 30 },
    '2026-10-04': { blocked: 9 },
    bad: { blocked: 99 },
  };
  const s = P.addStat(original, 'blocked', 1, now);
  assert.equal(s['2026-09-03'], undefined);
  assert.equal(s['2026-09-04'].blocked, 2);
  assert.equal(s['2026-10-03'].blocked, 1);
  assert.equal(s['2026-10-03'].seconds, 30);
  assert.equal(original['2026-10-03'].blocked, undefined);
  assert.equal(s['2026-10-04'], undefined);
  assert.equal(P.formatTime(65), '1:05');
});
test('browser rules and JS policy agree on representative navigation URLs', () => {
  const rules = JSON.parse(fs.readFileSync(new URL('../extension/rules.json', import.meta.url)));
  for (const p of [
    '/',
    '/direct',
    '/direct/inbox/',
    '/reels/',
    '/p/x/',
    '/accounts/login/',
    '/challenge/a/',
    '/checkpoint/',
    '/web/login/',
    '/data/privacy/',
    '/accountsmalicious/',
  ]) {
    const match = rules
      .filter((r) => new RegExp(r.condition.regexFilter).test('https://www.instagram.com' + p))
      .sort((a, b) => b.priority - a.priority)[0];
    assert.equal(match.action.type === 'allow', P.allowedPath(p), p);
  }
});
