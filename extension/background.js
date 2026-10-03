import './core.js';
const P = globalThis.InstaLite;
let queue = Promise.resolve();
const recentBlocks = new Map();
function serial(work) {
  const next = queue.then(work);
  queue = next.catch(() => {});
  return next;
}
async function state() {
  const s = await chrome.storage.local.get(['preferences', 'stats', 'timer']);
  return {
    preferences: P.preferences(s.preferences),
    stats: P.pruneStats(s.stats),
    timer: s.timer || null,
  };
}
async function rules(enabled) {
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    enabled ? { enableRulesetIds: ['focus_routes'] } : { disableRulesetIds: ['focus_routes'] },
  );
}
async function badge(timer) {
  const remaining = timer?.endsAt ? Math.ceil((timer.endsAt - Date.now()) / 60000) : 0;
  await chrome.action.setBadgeBackgroundColor({ color: '#6551cf' });
  await chrome.action.setBadgeText({
    text: timer?.completed ? '✓' : remaining > 0 ? String(remaining) : '',
  });
}
async function setup() {
  const s = await state();
  await rules(s.preferences.enabled);
  await chrome.storage.local.set({ preferences: s.preferences, stats: s.stats });
  if (s.timer?.endsAt && !s.timer.completed) {
    if (s.timer.endsAt <= Date.now()) await finishTimer();
    else await chrome.alarms.create('focus-end', { when: s.timer.endsAt });
  }
  await chrome.alarms.create('badge-refresh', { periodInMinutes: 1 });
  await badge((await state()).timer);
}
async function finishTimer() {
  const s = await state();
  if (!s.timer || s.timer.completed) return;
  const timer = { ...s.timer, completed: true };
  await chrome.storage.local.set({ timer });
  await badge(timer);
}
async function handle(msg, sender) {
  if (!msg || typeof msg.type !== 'string') throw new Error('Invalid request.');
  const extension =
    sender.id === chrome.runtime.id && sender.url?.startsWith(chrome.runtime.getURL(''));
  const instagram =
    sender.id === chrome.runtime.id && sender.tab && P.instagramURL(sender.url || '');
  if (['heartbeat', 'blocked'].includes(msg.type)) {
    if (!instagram) throw new Error('Instagram tab required.');
    const s = await state();
    if (!s.preferences.enabled) return { ok: true };
    if (msg.type === 'blocked') {
      const tabId = sender.tab.id;
      const last = recentBlocks.get(tabId) || 0;
      if (Date.now() - last < 2000) return { ok: true };
      recentBlocks.set(tabId, Date.now());
      await chrome.storage.local.set({ stats: P.addStat(s.stats, 'blocked', 1) });
    } else if (sender.tab.active && new URL(sender.url).pathname.startsWith('/direct/')) {
      const seconds = Math.min(15, Math.max(0, Number(msg.seconds) || 0));
      await chrome.storage.local.set({ stats: P.addStat(s.stats, 'seconds', seconds) });
    }
    return { ok: true };
  }
  if (msg.type === 'openOptions' && instagram) {
    await chrome.runtime.openOptionsPage();
    return { ok: true };
  }
  if (!extension) throw new Error('Open the INSTA_LITE controls to change settings.');
  if (msg.type === 'getState') return { ok: true, ...(await state()) };
  if (msg.type === 'setPreferences') {
    const current = await state();
    const preferences = P.preferences({ ...current.preferences, ...msg.preferences });
    await rules(preferences.enabled);
    await chrome.storage.local.set({ preferences });
    return { ok: true, ...(await state()) };
  }
  if (msg.type === 'startTimer') {
    if (![15, 25, 45].includes(msg.minutes)) throw new Error('Choose 15, 25 or 45 minutes.');
    const timer = {
      minutes: msg.minutes,
      endsAt: Date.now() + msg.minutes * 60000,
      completed: false,
    };
    await chrome.storage.local.set({ timer });
    await chrome.alarms.create('focus-end', { when: timer.endsAt });
    await badge(timer);
    return { ok: true, ...(await state()) };
  }
  if (msg.type === 'clearTimer') {
    await chrome.alarms.clear('focus-end');
    await chrome.storage.local.remove('timer');
    await badge(null);
    return { ok: true, ...(await state()) };
  }
  if (msg.type === 'resetStats') {
    await chrome.storage.local.set({ stats: {} });
    return { ok: true, ...(await state()) };
  }
  throw new Error('Unknown request.');
}
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  serial(() => handle(msg, sender))
    .then(respond)
    .catch((error) => respond({ ok: false, error: error.message }));
  return true;
});
chrome.runtime.onInstalled.addListener(() => serial(setup).catch(console.error));
chrome.runtime.onStartup.addListener(() => serial(setup).catch(console.error));
chrome.alarms.onAlarm.addListener((alarm) =>
  serial(async () => {
    if (alarm.name === 'focus-end') await finishTimer();
    else if (alarm.name === 'badge-refresh') {
      const s = await state();
      await chrome.storage.local.set({ stats: s.stats });
      await badge(s.timer);
    }
  }).catch(console.error),
);
chrome.tabs.onRemoved.addListener((id) => recentBlocks.delete(id));
