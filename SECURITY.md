# Security and privacy

INSTA_LITE v1 is a manually installed preview. It is a focus aid, not a security boundary or a promise that every Instagram layout is blocked.

## Design boundaries

- Login happens on Instagram. The extension does not collect passwords or request cookies permission.
- Local preferences, timer deadlines and activity counters are the only persisted data.
- Message bodies and conversation exports are not copied into storage, logs, analytics or requests.
- Host access is limited to the two Instagram HTTPS origins.
- There is no extension backend, account service or remote code loading.
- Instagram retains its own data practices. The extension does not remove Instagram's tracking.

See the [permission map](docs/ARCHITECTURE.md#permissions) and [privacy page](website/privacy.html).

## Reporting a vulnerability

Do **not** post credentials, session cookies, tokens, private messages or account exports in a public issue.

If GitHub's **Security → Advisories → Report a vulnerability** control is available, use that private channel. This repository does not claim that private reporting is enabled. If it is unavailable, use a public issue only for a sanitized, non-sensitive description and request a private reporting channel before sharing exploit details.

Reproduce issues with fictional accounts/data when possible. Include affected version, browser, a high-level impact description and safe reproduction steps. No response time or bounty is promised.

For ordinary selector/layout bugs, use the compatibility bug form and redact screenshots. Turn off or remove the extension if it interferes with login or account recovery.
