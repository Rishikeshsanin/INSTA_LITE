# Contributing

INSTA_LITE keeps Instagram messages usable without recreational browsing. Changes should preserve that purpose and the narrow permission model.

## Run locally

Use Node.js 22 or 24 and npm.

```sh
npm ci
npm run verify
npm run dev
```

The companion website opens at `http://localhost:4173`. Load `extension/` through your browser's **Load unpacked** control. After extension changes, reload its card and refresh Instagram tabs.

## Before a pull request

```sh
npm run format
npm run format:check
npm run verify
npx playwright install chromium
```

For browser and accessibility checks on macOS/Linux:

```sh
AXE_MODULE=axe-core npm run test:browser
```

For Windows PowerShell:

```powershell
$env:AXE_MODULE = 'axe-core'
npm run test:browser
```

Browser tests use fictional Instagram DOM fixtures and mocked extension APIs. They do not log in to Instagram. For selectors, routing or native messaging controls, also complete the relevant [real-account checklist](docs/ACCEPTANCE.md). Report browser version, interface language and pass/fail results without account data.

## Project conventions

- `extension/core.js` owns defaults, route policy and counters.
- `extension/ui.css` owns shared visual tokens. `website/tokens.css` is generated; do not edit it directly.
- Run `npm run build` after changing extension files so the downloadable ZIP stays current.
- Never collect credentials, store conversations, call private Instagram APIs, or broaden host permissions without a documented product decision.
- Match JavaScript route guards and `extension/rules.json`; preserve login, two-factor and recovery paths.
- Use semantic HTML, visible keyboard focus and reduced-motion support.
- Keep documentation and verification claims tied to observed behavior.
- Describe bugs before proposing unrelated refactors. Keep PRs focused.

## Generated files

Icons, `website/tokens.css`, and `website/downloads/*.zip` are generated from source and intentionally included for direct installation and static hosting. `artifacts/`, `dist/` and `node_modules/` remain ignored. Browser reports in `docs/` are baseline evidence; CI uploads fresh reports separately.

## Reporting problems

Use the bug form and include your browser/version, Instagram language, mode and reproduction steps. Do not post passwords, cookies, tokens or private messages. See [SECURITY.md](SECURITY.md) for sensitive reports.

Contributions are provided under the repository's MIT license. Please treat collaborators respectfully and explain decisions with evidence.
