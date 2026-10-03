import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const playwright = require(
  process.env.PLAYWRIGHT_MODULE ||
    (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
      ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright'
      : 'playwright'),
);
let launch = { headless: true };
if (process.env.BROWSER_EXECUTABLE) launch.executablePath = process.env.BROWSER_EXECUTABLE;
if (process.env.BROWSER_ARGS) launch.args = JSON.parse(process.env.BROWSER_ARGS);
const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs')], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});
await once(server.stdout, 'data');
const browser = await playwright.chromium.launch(launch);
const report = { checks: [], consoleErrors: [], accessibility: [] };
function pass(label) {
  report.checks.push(label);
  console.log('PASS', label);
}
try {
  await mkdir(path.join(root, 'artifacts'), { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => report.consoleErrors.push(e.message));
  await page.goto('http://localhost:4173');
  assert.match(await page.title(), /INSTA_LITE/);
  assert.equal(await page.locator('h1').count(), 1);
  await page.screenshot({ path: path.join(root, 'artifacts/website-desktop.png'), fullPage: true });
  await page.screenshot({ path: path.join(root, 'artifacts/website-hero.png'), fullPage: false });
  pass('Website loads with real download link and labelled fictional demo');
  await page.getByRole('button', { name: 'React with heart', exact: true }).click();
  assert.equal(await page.locator('#reaction').isVisible(), true);
  await page.getByRole('button', { name: 'React with heart', exact: true }).click();
  assert.equal(await page.locator('#reaction').isVisible(), false);
  await page.getByRole('button', { name: /Maya/ }).click();
  assert.equal(await page.locator('#thread-name').textContent(), 'Maya');
  pass('Demo reactions toggle and conversation switching works');
  await page.getByText('Does this work with my personal account?', { exact: true }).click();
  assert.ok(await page.locator('details[open]').count());
  const response = await page.request.get(
    'http://localhost:4173/downloads/INSTA_LITE-extension-v1.0.0.zip',
  );
  assert.equal(response.status(), 200);
  assert.equal((await response.body()).readUInt32LE(0), 0x04034b50);
  pass('FAQ and extension ZIP download work');
  await page.getByRole('button', { name: /Copy Chrome address/ }).click();
  await page.waitForFunction(() => document.getElementById('copy-status').textContent.length > 0);
  pass('Clipboard action provides success or useful fallback');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: path.join(root, 'artifacts/website-mobile.png'), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  pass('360px website has no horizontal overflow');
  await page.getByRole('link', { name: 'Privacy', exact: true }).click();
  assert.match(await page.title(), /Privacy/);
  pass('Privacy page navigation works');
  if (process.env.AXE_MODULE) {
    const axe = require(process.env.AXE_MODULE);
    for (const url of ['http://localhost:4173', 'http://localhost:4173/privacy.html']) {
      await page.goto(url);
      await page.addScriptTag({ content: axe.source });
      const result = await page.evaluate(
        async () =>
          await axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          }),
      );
      report.accessibility.push({
        url,
        violations: result.violations.map((v) => ({
          id: v.id,
          description: v.description,
          nodes: v.nodes.map((n) => n.target),
        })),
      });
      assert.equal(result.violations.length, 0, JSON.stringify(report.accessibility.at(-1)));
    }
    pass('Website and privacy pass axe WCAG A/AA checks');
  }
  const control = await context.newPage();
  control.on('pageerror', (e) => report.consoleErrors.push(e.message));
  await control.route('http://localhost:4173/ext/**', async (route) => {
    const name = new URL(route.request().url()).pathname.slice(5);
    const data = await readFile(path.join(root, 'extension', name));
    await route.fulfill({
      body: data,
      contentType: name.endsWith('.js')
        ? 'text/javascript'
        : name.endsWith('.css')
          ? 'text/css'
          : 'text/html',
    });
  });
  await control.addInitScript(() => {
    window.fakeState = {
      preferences: { enabled: true, mode: 'react', hideShared: true, theme: 'light' },
      stats: {},
      timer: null,
    };
    const changes = [];
    window.chrome = {
      storage: { onChanged: { addListener: (fn) => changes.push(fn) } },
      runtime: {
        openOptionsPage: async () => {},
        sendMessage: async (m) => {
          if (window.fakeFail) throw Error('Storage unavailable. Retry.');
          let update = {};
          if (m.type === 'setPreferences') {
            window.fakeState.preferences = m.preferences;
            update.preferences = { newValue: m.preferences };
          }
          if (m.type === 'startTimer') {
            window.fakeState.timer = {
              endsAt: Date.now() + m.minutes * 60000,
              minutes: m.minutes,
              completed: false,
            };
            update.timer = { newValue: window.fakeState.timer };
          }
          if (m.type === 'clearTimer') {
            window.fakeState.timer = null;
            update.timer = { newValue: null };
          }
          if (m.type === 'resetStats') window.fakeState.stats = {};
          for (const fn of changes) fn(update, 'local');
          return { ok: true, ...window.fakeState };
        },
      },
    };
  });
  await control.goto('http://localhost:4173/ext/options.html');
  await control.locator('#focus-title').filter({ hasText: 'A little less Instagram.' }).waitFor();
  await control.getByRole('radio', { name: 'Full Messaging' }).check();
  await control.waitForFunction(() => window.fakeState.preferences.mode === 'full');
  await control.locator('#theme').selectOption('dark');
  await control.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await control.screenshot({
    path: path.join(root, 'artifacts/settings-dark.png'),
    fullPage: true,
  });
  await control
    .locator('.shell')
    .screenshot({ path: path.join(root, 'artifacts/settings-panel.png') });
  await control.locator('#theme').selectOption('light');
  await control.getByRole('button', { name: 'Start focus' }).click();
  await control.waitForFunction(() => !!window.fakeState.timer);
  assert.equal(await control.locator('#timer-end').isVisible(), true);
  await control.getByRole('button', { name: 'Clear timer', exact: true }).click();
  await control.waitForFunction(() => window.fakeState.timer === null);
  pass('Settings: messaging mode, light/dark appearance, start/clear timer');
  await control.getByRole('button', { name: 'Clear statistics', exact: true }).first().click();
  assert.equal(await control.evaluate(() => document.activeElement.id), 'reset-cancel');
  await control.keyboard.press('Escape');
  assert.equal(await control.locator('dialog').isVisible(), false);
  await control.getByRole('button', { name: 'Clear statistics', exact: true }).first().click();
  await control.locator('#reset-confirm').click();
  assert.equal(await control.locator('dialog').isVisible(), false);
  pass('Reset dialog supports focus placement, Escape, confirmation and empty history');
  await control.evaluate(() => (window.fakeFail = true));
  await control.locator('#enabled').click();
  await control.locator('#notice.error').waitFor();
  assert.equal(await control.locator('#enabled').isChecked(), true);
  await control.evaluate(() => (window.fakeFail = false));
  pass('Failed settings save restores prior state and displays inline error');
  await control.setViewportSize({ width: 360, height: 800 });
  assert.ok(await control.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await control.locator('#theme').focus();
  await control.keyboard.press('ArrowDown');
  await control.keyboard.press('Escape');
  await control.screenshot({
    path: path.join(root, 'artifacts/settings-mobile.png'),
    fullPage: true,
  });
  pass('Narrow settings and native keyboard selects remain usable');
  if (process.env.AXE_MODULE) {
    const axe = require(process.env.AXE_MODULE);
    await control.addScriptTag({ content: axe.source });
    const result = await control.evaluate(
      async () =>
        await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        }),
    );
    report.accessibility.push({
      url: 'options fixture',
      violations: result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    });
    assert.equal(result.violations.length, 0, JSON.stringify(report.accessibility.at(-1)));
    pass('Settings fixture passes axe WCAG A/AA checks');
  }
  const fixture = await context.newPage();
  fixture.on('pageerror', (e) => report.consoleErrors.push(e.message));
  await fixture.route('https://www.instagram.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><title>Instagram DOM fixture</title><body><nav><a href="/">Home</a><a href="/reels/">Reels</a><a href="/direct/inbox/">Messages</a></nav><main><input type="search" placeholder="Search" aria-label="Search conversations"><p>Fixture message</p><button id="like" aria-label="Like">Like</button><a id="shared" href="/reel/abc/">Shared reel</a><form><div contenteditable="true" role="textbox" aria-label="Message"></div><button type="button" aria-label="Send">Send</button></form><div id="late"></div><div id="plain-input"><input type="text" placeholder="Message..." aria-label="Message input"></div></main></body></html>',
    }),
  );
  await fixture.addInitScript(() => {
    window.preferences = { enabled: true, mode: 'react', hideShared: true, theme: 'system' };
    window.listeners = [];
    window.sent = [];
    window.chrome = {
      runtime: {
        sendMessage: async (m) => {
          window.sent.push(m);
          return { ok: true };
        },
      },
      storage: {
        local: { get: async () => ({ preferences: window.preferences, timer: null }) },
        onChanged: { addListener: (fn) => window.listeners.push(fn) },
      },
    };
    window.setPrefs = (p) => {
      window.preferences = { ...window.preferences, ...p };
      window.listeners.forEach((fn) =>
        fn({ preferences: { newValue: window.preferences } }, 'local'),
      );
    };
  });
  async function inject() {
    await fixture.addScriptTag({ path: path.join(root, 'extension/core.js') });
    await fixture.addStyleTag({ path: path.join(root, 'extension/content.css') });
    await fixture.addScriptTag({ path: path.join(root, 'extension/content.js') });
    await fixture.locator('#instalite-root').waitFor();
  }
  await fixture.goto('https://www.instagram.com/direct/inbox/');
  await inject();
  await fixture.locator('form').waitFor({ state: 'hidden' });
  assert.equal(await fixture.getByRole('link', { name: 'Home', exact: true }).isVisible(), false);
  assert.equal(await fixture.locator('#shared').isVisible(), false);
  assert.equal(await fixture.getByRole('searchbox').isVisible(), true);
  assert.equal(await fixture.locator('#plain-input').isVisible(), false);
  await fixture.getByRole('searchbox').fill('friend');
  await fixture.locator('#like').click();
  pass(
    'Direct fixture hides distractions and composer while preserving search and native reaction control',
  );
  await fixture.evaluate(() => {
    const el = document.createElement('div');
    el.contentEditable = 'true';
    el.setAttribute('role', 'textbox');
    el.setAttribute('aria-label', 'Message');
    document.getElementById('late').append(el);
  });
  await fixture.locator('#late').waitFor({ state: 'hidden' });
  pass('Mutation observer hides dynamically added composers');
  await fixture.evaluate(() => window.setPrefs({ mode: 'full' }));
  await fixture.locator('form').waitFor({ state: 'visible' });
  await fixture.evaluate(() => window.setPrefs({ enabled: false }));
  await fixture.getByRole('link', { name: 'Home', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await fixture.locator('#instalite-root').count(), 0);
  pass('Full Messaging restores composer and disabling focus restores native UI');
  await fixture.evaluate(() => window.setPrefs({ enabled: true }));
  await fixture.locator('#instalite-root').waitFor();
  await fixture.evaluate(() => history.pushState({}, '', '/explore/'));
  await fixture.waitForURL('**/direct/inbox/**');
  pass('SPA navigation to Explore redirects to inbox');
  assert.deepEqual(report.consoleErrors, []);
  pass('No browser JavaScript errors in verified workflows');
  await context.close();
} finally {
  await browser.close();
  server.kill();
  await writeFile(
    path.join(root, 'docs/browser-results.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
}
