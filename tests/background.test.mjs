import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
function harness(seed = {}) {
  const data = structuredClone(seed),
    events = {},
    alarms = new Map();
  let disabled = false,
    badge = '';
  const event = (name) => ({ addListener: (fn) => (events[name] = fn) });
  const chrome = {
    runtime: {
      id: 'test-id',
      getURL: (p) => 'chrome-extension://test-id/' + p,
      openOptionsPage: async () => {},
      onMessage: event('message'),
      onInstalled: event('install'),
      onStartup: event('startup'),
    },
    tabs: { onRemoved: event('removed') },
    storage: {
      local: {
        get: async (keys) =>
          Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((k) => [k, data[k]])),
        set: async (o) => Object.assign(data, structuredClone(o)),
        remove: async (k) => {
          delete data[k];
        },
      },
    },
    declarativeNetRequest: {
      updateEnabledRulesets: async (o) => {
        disabled = !!o.disableRulesetIds;
      },
    },
    action: {
      setBadgeText: async (o) => {
        badge = o.text;
      },
      setBadgeBackgroundColor: async () => {},
    },
    alarms: {
      create: async (name, o) => alarms.set(name, o),
      clear: async (name) => alarms.delete(name),
      onAlarm: event('alarm'),
    },
  };
  const context = vm.createContext({ chrome, console, Date, URL, Map, Promise });
  vm.runInContext(
    fs.readFileSync(new URL('../extension/core.js', import.meta.url), 'utf8'),
    context,
  );
  vm.runInContext(
    fs
      .readFileSync(new URL('../extension/background.js', import.meta.url), 'utf8')
      .replace("import './core.js';", ''),
    context,
  );
  const extension = { id: 'test-id', url: 'chrome-extension://test-id/popup.html' };
  const instagram = {
    id: 'test-id',
    url: 'https://www.instagram.com/direct/inbox/',
    tab: { id: 1, active: true },
  };
  const send = (msg, sender = extension) =>
    new Promise((resolve) => events.message(msg, sender, resolve));
  return {
    data,
    events,
    alarms,
    send,
    extension,
    instagram,
    disabled: () => disabled,
    badge: () => badge,
  };
}
test('page senders cannot access preferences, reset counters or create timers', async () => {
  const h = harness();
  for (const type of ['getState', 'setPreferences', 'resetStats', 'startTimer'])
    assert.equal((await h.send({ type, minutes: 25 }, h.instagram)).ok, false);
  assert.equal(
    (
      await h.send(
        { type: 'heartbeat', seconds: 15 },
        { id: 'test-id', url: 'https://evil.com', tab: { active: true } },
      )
    ).ok,
    false,
  );
});
test('settings update rules and normalized storage together', async () => {
  const h = harness();
  assert.equal(
    (await h.send({ type: 'setPreferences', preferences: { enabled: false, mode: 'full' } })).ok,
    true,
  );
  assert.equal(h.disabled(), true);
  assert.equal(h.data.preferences.mode, 'full');
  await h.send({ type: 'setPreferences', preferences: { enabled: true } });
  assert.equal(h.disabled(), false);
});
test('serialized concurrent heartbeats retain increments and clamp seconds', async () => {
  const h = harness();
  await Promise.all(
    Array.from({ length: 8 }, () => h.send({ type: 'heartbeat', seconds: 100 }, h.instagram)),
  );
  const today = Object.values(h.data.stats)[0];
  assert.equal(today.seconds, 120);
  await h.send(
    { type: 'heartbeat', seconds: 15 },
    { ...h.instagram, tab: { id: 2, active: false } },
  );
  assert.equal(Object.values(h.data.stats)[0].seconds, 120);
});
test('blocked visits are deduplicated per tab and do not count while focus is off', async () => {
  const h = harness();
  await h.send({ type: 'blocked' }, h.instagram);
  await h.send({ type: 'blocked' }, h.instagram);
  assert.equal(Object.values(h.data.stats)[0].blocked, 1);
  await h.send({ type: 'setPreferences', preferences: { enabled: false } });
  await h.send({ type: 'blocked' }, { ...h.instagram, tab: { id: 2, active: true } });
  assert.equal(Object.values(h.data.stats)[0].blocked, 1);
});
test('timer validates duration, persists deadline, completes and clears alarms', async () => {
  const h = harness();
  assert.equal((await h.send({ type: 'startTimer', minutes: 999 })).ok, false);
  await h.send({ type: 'startTimer', minutes: 25 });
  assert.equal(h.data.timer.minutes, 25);
  assert.ok(h.alarms.has('focus-end'));
  assert.equal(h.badge(), '25');
  h.events.alarm({ name: 'focus-end' });
  await h.send({ type: 'getState' });
  assert.equal(h.data.timer.completed, true);
  assert.equal(h.badge(), '✓');
  await h.send({ type: 'clearTimer' });
  assert.equal(h.data.timer, undefined);
  assert.equal(h.alarms.has('focus-end'), false);
});
test('reset statistics preserves preferences and timer', async () => {
  const h = harness();
  await h.send({ type: 'startTimer', minutes: 15 });
  await h.send({ type: 'setPreferences', preferences: { mode: 'full' } });
  await h.send({ type: 'heartbeat', seconds: 15 }, h.instagram);
  await h.send({ type: 'resetStats' });
  assert.deepEqual(h.data.stats, {});
  assert.equal(h.data.preferences.mode, 'full');
  assert.equal(h.data.timer.minutes, 15);
});

test('options page remains authorized when Chrome supplies tab metadata', async () => {
  const h = harness();
  const s = await h.send(
    { type: 'getState' },
    {
      ...h.extension,
      url: 'chrome-extension://test-id/options.html',
      tab: { id: 10, active: true },
    },
  );
  assert.equal(s.ok, true);
});
