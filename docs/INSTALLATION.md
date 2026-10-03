# Install INSTA_LITE

For desktop Chrome or Edge. The extension runs inside Instagram's website; the companion website is a guide/demo and does not display your account's messages.

## First installation

1. [Download the extension ZIP](https://raw.githubusercontent.com/Rishikeshsanin/INSTA_LITE/main/website/downloads/INSTA_LITE-extension-v1.0.0.zip).
2. On Windows, right-click it and choose **Extract All**. Keep the extracted folder in a permanent location, such as `Documents/INSTA_LITE`.
3. Paste `chrome://extensions` or `edge://extensions` into the browser address bar.
4. Enable **Developer mode**.
5. Click **Load unpacked** and choose the folder that directly contains `manifest.json`.
6. Pin INSTA_LITE from the browser's extensions menu.
7. Click INSTA_LITE → **Open Messages**. Sign in directly on Instagram if needed.
8. Refresh any Instagram tabs that were open before installation.

Do not move/delete the loaded folder. This version is manually installed; it has no automatic store updates.

## Controls

| Control                       | Behavior                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Distraction blocker           | Redirects feed, Reels, Explore, stories, posts and profile detours to Direct.                  |
| Read + React                  | Hides recognized composers and blocks common send controls. Native reactions remain available. |
| Full Messaging                | Restores normal messaging controls. Distracting routes still stay blocked.                     |
| Hide shared post & reel links | Hides recognized shared-content links; does not remove every possible inline preview.          |
| Focus timer                   | A 15/25/45-minute reminder; it does not lock you out.                                          |
| Appearance                    | Changes extension controls only. Instagram keeps its own theme.                                |
| Clear statistics              | Deletes local counters after confirmation; preserves preferences and timer.                    |

Read + React is a focus aid, not a security boundary. Complete the [live-account checks](ACCEPTANCE.md) for your actual Instagram layout.

## Update

Extract the new extension package and replace files in the **same folder** you originally loaded. Click **Reload** on the INSTA_LITE extension card, then refresh Instagram tabs. Keep the same loaded folder if you want to retain local settings and counters.

## Troubleshooting

| Symptom                          | What to try                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| “Manifest file is missing”       | Select the folder containing `manifest.json`, not its parent or the ZIP.                                       |
| Inbox unchanged                  | Reload the extension card, refresh Instagram, and confirm the blocker is on.                                   |
| Composer remains visible         | Instagram may have changed its layout. Report browser/version and interface language without private messages. |
| Reactions or search stop working | Switch to Full Messaging, refresh, and report the affected control.                                            |
| Login/recovery is interrupted    | Turn the blocker off or disable INSTA_LITE temporarily; report the generic route type only.                    |
| Shared media still appears       | The destination route stays blocked, but native inline previews/attachments can vary.                          |
| Timer seems missing              | Reopen the popup. If extension storage was cleared or the extension removed, local state is gone.              |
| Mobile Instagram is unchanged    | Expected: this release only modifies the desktop website.                                                      |

## Disable or remove

Turn off **Distraction blocker** for normal Instagram browsing. To remove it completely, open your browser's extension settings and choose **Remove**. Removal deletes the extension's local data; it does not delete your Instagram account or conversations.
