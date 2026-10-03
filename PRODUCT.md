# Product and architecture

User brief: “Instagram, without the scroll.” Build the consumer browser extension described in the preceding conversation, plus a companion website.

V1 supports desktop Chrome/Edge, Manifest V3. Users log in only on Instagram. No standalone OAuth app, private API, account backend or credential collection. The extension keeps native DM reading/reactions and optionally full messaging. Focus mode blocks every non-allowlisted Instagram main-frame route. Direct, authentication, recovery and essential privacy/legal routes are allowed. Turning the blocker off restores normal browsing. Local settings, a persistent timer and 30 days of activity counters are the only stored state.

Read + React defaults on. Composer hiding is a DOM-based convenience and must be described as a focus aid, not a guarantee or account security boundary. Shared post/reel links are hidden by default; native inline media may remain. Messages and credentials are never copied into storage, logging, or requests.

## Owners

- core.js: defaults, route policy, origin validation and counters.
- rules.json: browser-level main-frame redirects; policy parity test.
- background.js: serialized storage writes, sender validation, ruleset setting and alarms.
- content.js/content.css: isolated native-page augmentation and SPA navigation guard.
- ui.js/ui.css: popup/settings and persistence feedback.
- website/: fictional interactive demo, installation, privacy and download.

No messaging actions are performed by our JavaScript. Instagram handles the user's explicit reactions/replies. No timed sends or background messaging. Disable-send controls are local UI restrictions.
