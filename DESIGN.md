---
version: alpha
name: INSTA_LITE
description: A quieter desktop Instagram inbox, expressed as a friendly correspondence tool.
colors:
  primary: '#6551cf'
  background: '#f4f5fa'
  surface: '#ffffff'
  ink: '#242138'
  muted: '#625e74'
  wash: '#eeeafa'
  border: '#d9d5e5'
  success: '#286b54'
  danger: '#b13d50'
  thumb: '#aaa1c5'
  dark-background: '#181622'
  dark-surface: '#252132'
  dark-ink: '#f4f1ff'
  dark-muted: '#bcb5ce'
  dark-primary: '#b4a5ff'
  dark-wash: '#342d4f'
  dark-border: '#4b435e'
  dark-success: '#8dd5b6'
  dark-danger: '#ff9cb0'
  dark-thumb: '#766d8c'
typography:
  sans:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
  display:
    fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'
  mono:
    fontFamily: 'ui-monospace, monospace'
rounded:
  DEFAULT: '16px'
  control: '12px'
  demo: '22px'
spacing:
  page-max: '1192px'
  page-padding: '32px'
  section-gap: '110px'
components:
  button:
    rounded: '12px'
  panel:
    rounded: '16px'
  dialog:
    rounded: '16px'
---

# INSTA_LITE Design System

## Overview

The reference is a personal correspondence desk: quiet paper, a small inbox, a handwritten reminder to leave. Audience: desktop Instagram users who want messages without recreational browsing, based on the user's project brief. English UI; no Japan-specific market or data flows. Landing is a brand surface; popup and settings are product surfaces. The signature is the violet stroke crossing out “scroll”, next to a gently tilted inbox demo. Control panels keep familiar native controls. Avoid social-network gradients, attention-grabbing motion and gamified claims of saved time.

Runtime source of truth is extension/ui.css. It implements this contract; scripts/build.mjs copies it to website/tokens.css. Website styles adapt the same light tokens with a fixed light theme. Dark variants affect extension controls only. Instagram's own styles remain its property. Decorative avatar colors and handwriting are website-only illustration roles.

## Colors

Lilac primary, pale gray paper and dark violet text. Muted text stays readable against white and paper. Success is green; destructive clear action is red with an explicit label. Every state has a text or native input cue as well as color. Dark mode uses the documented dark variants with the same hierarchy. Forced colors use system scrollbars and visible outlines.

## Typography

Rounded local display font for large headlines and the logo, system sans for controls and prose, monospace for timestamps and small utility labels. No external font requests. The handwriting uses local Comic Sans MS / Segoe Print with a generic cursive fallback. Body line height is 1.55 in controls and 1.65 on the website. UI uses sentence case and direct verbs.

## Layout

Landing uses a two-column headline/inbox composition, a compact boundary strip and a two-column installation guide. At 760px it becomes one column; at 390px the primary download fills the width. Popup is 380px wide; settings max width is 740px, single column below 580px. Daily history has its own bounded scroll container; settings page scrolls normally. No more than 30 data rows. Buttons, feedback and demo status reserve their space.

## Elevation & Depth

Borders and background tones provide hierarchy. Only the illustrative inbox and injected focus pill have soft shadows. Static cards are flat. Modal backdrop belongs to the native dialog with browser focus containment.

## Shapes

16px panels, 12px controls, 22px demo. The small icon uses a rounded square. Avatars are circles; reaction buttons are pills. Data rows are straight and readable.

## Components

Native checkbox, radio group, select and dialog supply keyboard behavior. Both selects intentionally use platform popup appearance. Buttons use hover, pressed, focus-visible and disabled states. Status text lives in one shared aria-live region. Settings auto-save with controls disabled during persistence and rollback on error. Clear statistics opens a dialog initially focused on Keep statistics, with Escape cancellation and focus restoration. Website details use native disclosure and demo uses real buttons with pressed states.

Global scrollbars inherit thumb/background tokens; hover uses muted and active uses primary, with forced-colors reset. Loading occupies the normal heading and help geometry. No skeleton is needed. Motion is limited to a 160ms CTA hover and respects reduced motion. Native Instagram reactions are not simulated by the extension. Website demo messages are explicitly fictional. Counters are real redirects and observed active seconds, not saved-time estimates.

## Do's and Don'ts

- Do keep login on Instagram and label the website demo.
- Do derive shared control styles from extension/ui.css.
- Don't claim account compatibility was tested without real-account evidence.
- Don't add feed content, fake productivity statistics or external tracking.
