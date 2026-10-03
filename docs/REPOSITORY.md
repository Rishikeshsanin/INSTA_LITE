# Repository maintenance

## Suggested About settings

Description:

> Instagram, without the scroll. An inbox-focused Chrome/Edge extension with local settings, focus timer and distraction blocking.

Topics:

`instagram`, `chrome-extension`, `edge-extension`, `manifest-v3`, `digital-wellbeing`, `focus`, `privacy`, `javascript`, `open-source`

Keep the homepage empty until a publicly accessible companion website is available. The existing owner-only site is not a public demo. Do not advertise a Chrome Web Store or Edge Add-ons listing until one actually exists.

## CI

`ci.yml` checks formatting, syntax, policy tests and archives on Node 22/24. A separate Chromium job exercises the website and synthetic Instagram fixtures with axe checks. Third-party actions are pinned to commit SHAs. General CI has read-only repository permissions.

The workflows are configured locally. A green GitHub run must be observed after publication before claiming GitHub CI passed. Browser fixtures do not establish logged-in account compatibility.

## Preview release

After publishing and observing CI, the `v1.0.0` tag starts the preview release workflow. It reruns checks and attaches the extension, source and website ZIPs to a **prerelease**. Only that job has write access to repository contents.

Do not describe the preview as production-ready or store-approved. Complete live-account acceptance before a wider release. For a future version, update the manifest, package metadata, build/download filenames, release notes and tag trigger together.

## Public source hygiene

The source packager uses an allowlist and excludes `.git`, `.openai`, local environments, dependencies, deployment output and transient artifacts. Generated public downloads and documented fictional screenshots are safe to include. Never publish real account screenshots, cookies, credentials or private conversations.
