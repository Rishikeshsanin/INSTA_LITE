(() => {
  const P = globalThis.InstaLite;
  let settings = P.DEFAULTS,
    ready = false,
    lastPath = '',
    scheduled = false,
    root,
    lastActivity = Date.now(),
    lastTick = Date.now();
  const html = document.documentElement;
  if (!P.allowedPath(location.pathname)) html.classList.add('il-route-guard');
  const send = (message) => chrome.runtime.sendMessage(message).catch(() => null);
  function redirect() {
    html.classList.add('il-route-guard');
    location.replace(P.REDIRECT);
  }
  function mark(element, kind) {
    if (element && !element.closest('#instalite-root')) element.setAttribute(`data-il-${kind}`, '');
  }
  function isSearch(element) {
    return (
      element.matches('input[type="search"], [role="searchbox"]') ||
      !!element.closest('[role="search"]') ||
      /search|rechercher|buscar|suche|cerca|pesquisar/i.test(
        [element.getAttribute('placeholder'), element.getAttribute('aria-label')].join(' '),
      )
    );
  }
  function composer(element) {
    if (isSearch(element)) return null;
    // A text editor in Direct is treated as a composer; search inputs remain usable.
    if (
      element.matches('[contenteditable="true"],textarea,[role="textbox"]') ||
      (element.matches('input') &&
        /message|reply|write/i.test(
          [element.getAttribute('placeholder'), element.getAttribute('aria-label')].join(' '),
        ))
    )
      return element.closest('form') || element.parentElement;
    return null;
  }
  function refresh() {
    scheduled = false;
    if (!ready) return;
    const direct = location.pathname.startsWith('/direct/');
    if (settings.enabled && !P.allowedPath(location.pathname)) {
      redirect();
      return;
    }
    html.classList.remove('il-route-guard');
    html.classList.toggle('il-focus', settings.enabled && direct);
    html.classList.toggle('il-react', settings.enabled && direct && settings.mode === 'react');
    html.classList.toggle('il-hide-shared', settings.enabled && direct && settings.hideShared);
    if (!settings.enabled || !direct) {
      root?.remove();
      root = null;
      return;
    }
    for (const anchor of document.querySelectorAll('a[href]')) {
      let url;
      try {
        url = new URL(anchor.getAttribute('href'), location.href);
      } catch {
        continue;
      }
      if (!P.instagramURL(url.href)) continue;
      if (!P.allowedPath(url.pathname)) {
        if (anchor.closest('nav,[role="navigation"]') || anchor.querySelector('svg'))
          mark(anchor, 'hidden');
        if (/^\/(p|reel|reels|stories)\//.test(url.pathname)) mark(anchor, 'shared');
      }
    }
    // Remove labels left after navigation links, plus Notes in the inbox.
    for (const el of document.querySelectorAll('[aria-label]')) {
      if (
        /^(Home|Reels|Explore|Create|Notifications|Your story|Stories|Leave a note|Add a note)$/i.test(
          el.getAttribute('aria-label') || '',
        )
      )
        mark(el.closest('a,button,[role="button"]') || el, 'hidden');
    }
    document
      .querySelectorAll('[data-il-composer]')
      .forEach((el) => el.removeAttribute('data-il-composer'));
    for (const editor of document.querySelectorAll(
      '[contenteditable="true"],textarea,[role="textbox"],input[type="text"],input:not([type])',
    ))
      mark(composer(editor), 'composer');
    if (!root && document.body) mount();
    if (root)
      root.shadowRoot.querySelector('.mode').textContent =
        settings.mode === 'react' ? 'Read + React' : 'Full messaging';
    if (lastPath !== location.pathname) {
      lastPath = location.pathname;
      lastActivity = Date.now();
    }
  }
  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(refresh);
    }
  }
  function mount() {
    root = document.createElement('div');
    root.id = 'instalite-root';
    const shadow = root.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<style>:host{font-family:system-ui,sans-serif;color:#242138}.pill{display:flex;align-items:center;gap:9px;background:#f4f5fa;border:1px solid #cfcade;border-radius:14px;padding:9px 12px;font-size:12px;box-shadow:0 3px 15px #24213818}.dot{width:7px;height:7px;border-radius:50%;background:#6551cf}button{border:0;background:transparent;color:#6551cf;font:inherit;font-weight:650;cursor:pointer;padding:6px}button:hover{background:#e5e0f7;border-radius:7px}button:focus-visible{outline:2px solid #6551cf;outline-offset:2px}.done{display:none;margin-top:6px;font-size:12px;padding:12px;background:#f4f5fa;border:1px solid #cfcade;border-radius:12px}.done.visible{display:block}</style><div class="pill"><span class="dot"></span><span>INSTA_LITE · <span class="mode"></span></span><button type="button" title="Open INSTA_LITE settings">Settings</button></div><div class="done" role="status">Focus session complete. Take a screen break.</div>';
    shadow.querySelector('button').addEventListener('click', () => send({ type: 'openOptions' }));
    document.body.append(root);
    chrome.storage.local
      .get('timer')
      .then((s) => updateTimer(s.timer))
      .catch(() => {});
  }
  function updateTimer(timer) {
    root?.shadowRoot.querySelector('.done').classList.toggle('visible', !!timer?.completed);
  }
  function restrict(event) {
    if (
      !ready ||
      !settings.enabled ||
      settings.mode !== 'react' ||
      !location.pathname.startsWith('/direct/')
    )
      return;
    const el = event.target instanceof Element ? event.target : null;
    if (!el || el.closest('#instalite-root')) return;
    const editor = el.closest(
      '[contenteditable="true"],textarea,[role="textbox"],input[type="text"],input:not([type])',
    );
    const button = el.closest('button,[role="button"]');
    const label = button
      ? [
          button.getAttribute('aria-label'),
          button.getAttribute('title'),
          button.textContent,
          button.querySelector('[aria-label]')?.getAttribute('aria-label'),
        ]
          .join(' ')
          .trim()
      : '';
    if (
      (editor && !!composer(editor)) ||
      (button &&
        /^(send|send message|send photo|send video|voice message|record voice|add photos|add photo|choose file|upload|attach)(\s|$)/i.test(
          label,
        ))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
  document.addEventListener(
    'click',
    (event) => {
      if (!ready || !settings.enabled) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor) return;
      let url;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      if (P.instagramURL(url.href) && !P.allowedPath(url.pathname)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        redirect();
      }
    },
    true,
  );
  ['click', 'keydown', 'beforeinput', 'paste', 'drop'].forEach((type) =>
    document.addEventListener(type, restrict, true),
  );
  ['pointerdown', 'keydown', 'scroll'].forEach((type) =>
    document.addEventListener(type, () => (lastActivity = Date.now()), {
      passive: true,
      capture: true,
    }),
  );
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
  const observer = new MutationObserver((records) => {
    if (records.some((r) => r.type === 'childList' || r.target.id !== 'instalite-root')) schedule();
  });
  observer.observe(html, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['href', 'contenteditable', 'aria-label', 'role'],
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.preferences) {
      settings = P.preferences(changes.preferences.newValue);
      schedule();
    }
    if (changes.timer) updateTimer(changes.timer.newValue);
  });
  chrome.storage.local
    .get('preferences')
    .then((s) => {
      settings = P.preferences(s.preferences);
      ready = true;
      const u = new URL(location.href);
      if (u.searchParams.has('instalite_redirect')) {
        if (settings.enabled) send({ type: 'blocked' });
        u.searchParams.delete('instalite_redirect');
        history.replaceState(history.state, '', u.href);
      }
      refresh();
    })
    .catch(() => {
      ready = true;
      refresh();
    });
  setInterval(() => {
    if (location.pathname !== lastPath) schedule();
    const now = Date.now(),
      elapsed = Math.min(15, (now - lastTick) / 1000);
    lastTick = now;
    if (
      ready &&
      settings.enabled &&
      location.pathname.startsWith('/direct/') &&
      document.visibilityState === 'visible' &&
      document.hasFocus() &&
      now - lastActivity < 60000
    )
      send({ type: 'heartbeat', seconds: elapsed });
  }, 15000);
  // Faster URL guard for Instagram's history-based navigation, without patching its JS.
  setInterval(() => {
    if (ready && settings.enabled && !P.allowedPath(location.pathname)) redirect();
  }, 300);
})();
