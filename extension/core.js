/* Shared, dependency-free policy. Never reads Instagram messages or credentials. */
(() => {
  const DEFAULTS = Object.freeze({
    enabled: true,
    mode: 'react',
    hideShared: true,
    theme: 'system',
  });
  const INBOX = 'https://www.instagram.com/direct/inbox/';
  const REDIRECT = INBOX + '?instalite_redirect=1';
  function allowedPath(path) {
    return /^\/(direct(?:\/|$)|accounts(?:\/|$)|challenge(?:\/|$)|checkpoint(?:\/|$)|two_factor(?:\/|$)|oauth(?:\/|$)|web\/login(?:\/|$)|privacy(?:\/|$)|legal(?:\/|$)|terms(?:\/|$)|data\/privacy(?:\/|$))/.test(
      path,
    );
  }
  function instagramURL(input) {
    try {
      const u = new URL(input);
      return u.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(u.hostname);
    } catch {
      return false;
    }
  }
  function preferences(input = {}) {
    return {
      enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULTS.enabled,
      mode: ['react', 'full'].includes(input.mode) ? input.mode : DEFAULTS.mode,
      hideShared: typeof input.hideShared === 'boolean' ? input.hideShared : DEFAULTS.hideShared,
      theme: ['system', 'light', 'dark'].includes(input.theme) ? input.theme : DEFAULTS.theme,
    };
  }
  function dayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function pruneStats(stats, now = new Date()) {
    const first = new Date(now);
    first.setDate(first.getDate() - 29);
    const cutoff = dayKey(first);
    return Object.fromEntries(
      Object.entries(stats || {}).filter(
        ([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key >= cutoff && key <= dayKey(now),
      ),
    );
  }
  function addStat(stats, field, value, now = new Date()) {
    const copy = pruneStats(stats, now);
    const key = dayKey(now);
    const old = copy[key] || {};
    const row = { blocked: Number(old.blocked) || 0, seconds: Number(old.seconds) || 0 };
    row[field] = Math.max(0, row[field] + value);
    copy[key] = row;
    return copy;
  }
  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  globalThis.InstaLite = Object.freeze({
    DEFAULTS,
    INBOX,
    REDIRECT,
    allowedPath,
    instagramURL,
    preferences,
    dayKey,
    pruneStats,
    addStat,
    formatTime,
  });
})();
