# V1 verification — 3 October 2026 (India)

## Passed

- `npm run verify`: syntax/JSON/manifest/permission/telemetry checks, all 12 logic tests, deterministic extension and website packaging.
- `tests/browser.mjs`: 17 workflow checks in Chromium 153 with Playwright. Website/demo/FAQ/download/clipboard, 360px layout, privacy navigation, preferences, light/dark appearance, timer start/clear, reset dialog focus/Escape/confirmation, failed-save rollback, native select keyboard behavior, local Direct DOM fixtures, dynamic composer hiding, mode/off restoration and SPA redirect.
- axe-core WCAG A/AA checks: zero violations for the website, privacy page and settings fixture.
- `audit_project.py --mode strict`: zero findings.
- Google DESIGN.md lint: zero errors. Documentary tokens retain nonblocking orphan-token warnings for theme variants.
- ZIP integrity checked with Python's standard zipfile module.

## Evidence boundaries

Browser UI controls ran with mocked extension APIs; background behavior ran against mock Chrome APIs. The Direct tests used fictional, synthetic HTML. The available headless Chromium binary does not support loading the actual extension service worker. Automated checks therefore do not verify actual installation, Chrome DNR enforcement or a logged-in live Instagram account. The route rules were checked against JS policy, while SPA redirects and DOM behavior were exercised in the browser fixtures.

The agent-browser helper was attempted but could not start its daemon in this environment; direct Playwright verification used an available Chromium binary instead. A narrow-screen headline overflow discovered by browser checks was fixed. No unresolved browser script errors remain in the verified flows.

Run `docs/ACCEPTANCE.md` on real desktop Chrome/Edge before a wider release. Read + React is explicitly a focus aid and can need maintenance after Instagram changes its layout.

## Reproduce browser checks

The app itself has no runtime dependencies. Optional browser tooling can be installed separately:

```sh
npm install --no-save playwright axe-core
npx playwright install chromium
AXE_MODULE=axe-core node tests/browser.mjs
```

On Windows PowerShell, use `$env:AXE_MODULE='axe-core'` before running `node tests/browser.mjs`. Optional `BROWSER_EXECUTABLE` and JSON `BROWSER_ARGS` select an installed browser binary. Browser fixtures never require or transmit Instagram credentials.

## Repository polish checks

- All source formatting passes Prettier. JavaScript changes outside packaging/testing are formatting only.
- Fresh runs still pass 12 logic tests, 17 browser workflows and zero reported axe violations.
- Package checks independently decode ZIP entries and verify CRCs, referenced extension files, current bytes, archive privacy exclusions and hosted download links.
- CI/preview-release YAML parses successfully; actions are pinned to verified commit SHAs, with default read-only contents access.
- GitHub Actions execution is pending publication; a configured workflow is not evidence of a green remote run.
- README screenshots show a fictional website demo and settings with mocked extension APIs. No real account data is present.
