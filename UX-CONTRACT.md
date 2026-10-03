# INSTA_LITE UX contract

Business context: PRODUCT.md owns the route policy, local data scope and focus-aid limitation. DESIGN.md owns visual tokens. Only the extension controls can read or mutate app settings. Instagram content scripts may submit bounded counters and open settings.

| Capability     | Canonical owner               | Source of truth              | Allowed variants               | Verification               |
| -------------- | ----------------------------- | ---------------------------- | ------------------------------ | -------------------------- |
| Form           | ui.js                         | PRODUCT.md local preferences | popup / options                | browser workflow           |
| Select/Listbox | native HTML select            | DESIGN.md                    | duration / appearance          | keyboard, opened popup     |
| Scrollbar      | ui.css                        | DESIGN.md                    | website light / controls theme | browser computed style     |
| Toast          | notice() in ui.js             | this contract                | success / error                | persistence failure test   |
| Dialog         | native dialog in options.html | this contract                | clear statistics only          | focus, Escape, restoration |

Preferences auto-save with pending controls disabled. Success announces saved locally. Failure restores the last accepted state and gives a retry instruction. Popup and options use the same implementation and labels. Blocker changes browser rules and DOM behavior together. Turning off clears augmentation without logging out. Appearance never changes Instagram's theme.

Timer persists an absolute deadline. Popup closing does not cancel it. Alarms mark completion; reopening shows complete, and native inbox gets a reminder. Clear timer removes the alarm without changing preferences. Timer never locks navigation.

Counters display dates in local browser time. History renders at most 30 rows in its own scroller and a labelled empty row when absent. Reset is destructive for local counters and requires an explicit dialog; cancellation preserves all state. No sensitive search queries are stored. Instagram owns its search.

Website demo controls only change fictional content in memory; never persist demo reactions or imply live connectivity. FAQ uses native disclosure. Clipboard failure gives the exact address to copy manually. Downloads link directly to the built ZIP.

Desktop Chrome/Edge 120+, English UI. Website responsive down to 360px. Native keyboard controls, accessible names, visible focus, reduced-motion behavior and forced-colors outlines. Local actions work offline; Instagram messaging needs network. Settings storage failure leaves a persistent inline status, with no external network dependency.
