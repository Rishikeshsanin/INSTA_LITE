const P = globalThis.InstaLite;
const $ = (id) => document.getElementById(id);
let current = null,
  updating = false;
async function request(type, extra = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...extra });
  if (!response?.ok)
    throw new Error(
      response?.error || 'Could not reach the extension. Reload this page and retry.',
    );
  return response;
}
function notice(message, error = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('error', error);
}
function paint(s) {
  current = s;
  document.documentElement.dataset.theme = s.preferences.theme;
  $('enabled').checked = s.preferences.enabled;
  $('focus-title').textContent = s.preferences.enabled
    ? 'A little less Instagram.'
    : 'Focus is off.';
  $('focus-help').textContent = s.preferences.enabled
    ? 'Your inbox stays. The scrolling stops.'
    : 'Instagram opens normally until you turn focus on.';
  document
    .querySelectorAll('[name=mode]')
    .forEach((input) => (input.checked = input.value === s.preferences.mode));
  $('hide-shared').checked = s.preferences.hideShared;
  $('theme').value = s.preferences.theme;
  const today = s.stats[P.dayKey()] || {};
  $('blocked').textContent = String(today.blocked || 0);
  $('minutes').textContent = String(Math.floor((today.seconds || 0) / 60));
  if ($('history')) {
    const body = $('history');
    body.replaceChildren();
    const entries = Object.entries(s.stats).sort(([a], [b]) => b.localeCompare(a));
    if (!entries.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3;
      td.textContent = 'No activity yet. Open Messages to get started.';
      tr.append(td);
      body.append(tr);
    }
    for (const [day, stats] of entries) {
      const tr = document.createElement('tr');
      for (const value of [
        day,
        stats.blocked || 0,
        `${Math.floor((stats.seconds || 0) / 60)} min`,
      ]) {
        const td = document.createElement('td');
        td.textContent = String(value);
        tr.append(td);
      }
      body.append(tr);
    }
  }
  clock();
}
function clock() {
  const timer = current?.timer;
  const remaining = timer?.endsAt ? Math.max(0, (timer.endsAt - Date.now()) / 1000) : 0;
  $('clock').textContent = timer
    ? timer.completed || remaining === 0
      ? 'Complete'
      : P.formatTime(remaining)
    : 'Ready when you are';
  $('clock').style.fontSize = timer && !timer.completed && remaining > 0 ? '32px' : '18px';
  $('timer-end').hidden = !timer;
  $('timer-start').hidden = !!timer;
  $('duration').hidden = !!timer;
}
async function action(fn) {
  if (updating) return;
  updating = true;
  document.querySelectorAll('button,input,select').forEach((el) => (el.disabled = true));
  try {
    paint(await fn());
    notice('Saved on this device.');
  } catch (error) {
    notice(error.message, true);
    if (current) paint(current);
  } finally {
    updating = false;
    document.querySelectorAll('button,input,select').forEach((el) => (el.disabled = false));
  }
}
async function savePreferences() {
  const preferences = {
    enabled: $('enabled').checked,
    mode: document.querySelector('[name=mode]:checked').value,
    hideShared: $('hide-shared').checked,
    theme: $('theme').value,
  };
  return request('setPreferences', { preferences });
}
$('enabled').addEventListener('change', () => action(savePreferences));
document
  .querySelectorAll('[name=mode]')
  .forEach((el) => el.addEventListener('change', () => action(savePreferences)));
$('hide-shared').addEventListener('change', () => action(savePreferences));
$('theme').addEventListener('change', () => action(savePreferences));
$('timer-start').addEventListener('click', () =>
  action(() => request('startTimer', { minutes: Number($('duration').value) })),
);
$('timer-end').addEventListener('click', () => action(() => request('clearTimer')));
$('settings')?.addEventListener('click', () => chrome.runtime.openOptionsPage());
const dialog = $('reset-dialog');
let resetTrigger;
$('reset')?.addEventListener('click', () => {
  resetTrigger = document.activeElement;
  dialog.showModal();
  $('reset-cancel').focus();
});
function closeDialog() {
  dialog.close();
  resetTrigger?.focus();
}
$('reset-cancel')?.addEventListener('click', closeDialog);
dialog?.addEventListener('cancel', () => resetTrigger?.focus());
$('reset-confirm')?.addEventListener('click', () => {
  closeDialog();
  action(() => request('resetStats'));
});
chrome.storage.onChanged.addListener((_, area) => {
  if (area === 'local' && !updating)
    request('getState')
      .then(paint)
      .catch((error) => notice(error.message, true));
});
request('getState')
  .then((s) => {
    paint(s);
    document.querySelectorAll('button,input,select').forEach((el) => (el.disabled = false));
  })
  .catch((error) => {
    notice(error.message, true);
    $('focus-title').textContent = 'Controls unavailable';
    $('focus-help').textContent = 'Reload this page to reconnect to the extension.';
  });
setInterval(clock, 1000);
