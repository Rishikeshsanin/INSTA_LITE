# Real-account acceptance checklist

Complete these on desktop Chrome or Edge with your own Instagram account. Don't share credentials, cookies or message contents. Automated tests cover fixtures; these steps verify the current native interface.

1. Install unpacked, open Messages, and confirm Instagram login and two-factor/recovery work normally.
2. Refresh an already-open Instagram tab. Confirm the extension's small focus pill appears only in Direct, and no composer is visible in Read + React.
3. Open a conversation; read recent messages, search conversations, double-click a message to like it, open its reaction picker and add/remove a reaction. Confirm each reaches Instagram normally.
4. Try typing/pasting/dropping into a composer or activating a send/attachment button in Read + React. It should be hidden/blocked. If any new-message route remains, switch modes or disable the extension and report the layout without private content.
5. Switch Full Messaging and verify composer, attachments and replies are restored. Switch back and verify they disappear.
6. Visit `/`, `/reels/`, `/explore/`, a post, a story and a profile. Each should redirect to `/direct/inbox/`. Test links, back/forward navigation and a fresh address-bar visit.
7. Check shared post/reel links and Notes in your actual inbox. The destination blocker must work; inline hiding may depend on markup. Regular DM images and videos may remain.
8. Turn the blocker off. Confirm the normal feed and composers return without logging out. Turn it on and refresh once if needed.
9. Start a timer, close the popup, reopen it and verify the same deadline. After it ends, confirm badge/inbox reminder. Clear it.
10. Use the visible active inbox for at least 15 seconds. Confirm local minutes/counters update. Background/idle tabs should not accrue active time.
11. Open settings, change theme, try keyboard controls, cancel Clear statistics with Escape, then confirm reset. Preferences and timer should remain.
12. Repeat on Edge and on any Instagram language/layout you plan to support. Record browser version, date and pass/fail only.

Before a store release: publish the hosted privacy policy, prepare store screenshots, review current store policies, and complete store review. Don't claim store availability until approval.
