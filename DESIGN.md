---
name: Tico e Tica Estoque (web)
description: A perfumery's stock read like a romaneio printout - banded rows, one pink highlighter, state in form.
colors:
  tico-green: "#239e4b"
  tico-green-deep: "#147a37"
  tica-pink: "#dd6383"
  tica-pink-deep: "#ba4566"
  sheet: "#f7f9f7"
  paper: "#ffffff"
  ink: "#17201b"
  muted: "#5f6762"
  muted-light: "#6f7872"
  hairline: "#e7ebe8"
  band: "#eaf7ee"
  expiring-ink: "#8a5a12"
  danger: "#c95b55"
  sheet-dark: "#0f1411"
  paper-dark: "#171e19"
  ink-dark: "#eaf0ec"
  muted-dark: "#a3aea7"
  hairline-dark: "#27312b"
  band-dark: "#1a2a20"
typography:
  title:
    fontFamily: "DM Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  figure:
    fontFamily: "DM Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    fontFeature: "tnum"
  column-head:
    fontFamily: "DM Mono, ui-monospace, monospace"
    fontSize: "11px"
    letterSpacing: "0.04em"
  stamp:
    fontFamily: "DM Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.05em"
rounded:
  stamp: "3px"
  md: "6px"
  pill: "999px"
spacing:
  row-y: "12px"
  row-x: "20px"
  gap: "16px"
  page-x: "36px"
  head-mb: "24px"
components:
  button-primary:
    backgroundColor: "{colors.tico-green-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#0f6a2e"
  button-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
  button-quiet-hover:
    backgroundColor: "{colors.sheet}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  sheet:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.md}"
  listing-row:
    padding: "12px 20px"
    typography: "{typography.body}"
  listing-row-banded:
    backgroundColor: "{colors.band}"
  stamp:
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  rail-tab-active:
    backgroundColor: "{colors.tico-green-deep}"
    textColor: "{colors.paper}"
    height: "44px"
---

# Design System: Tico e Tica Estoque (web)

## Overview

**Creative North Star: "The Romaneio Printout"**

The signed-in web app is a stock sheet, not a dashboard. The page is a pale green-grey sheet; content sits on white paper with a single hairline; lists run in bands of three rows so the eye keeps its line, the way a printed packing list is ruled. Pink appears as a highlighter stroke behind the name of a row that needs the team, and nowhere else as a signal. The owner and a small team read it standing up, often on a phone-width window, so the one measure of success is trusting the number.

Density is working, not airy: 13px body, 12px row padding, 20px gutters. Everything that is data (codes, SKUs, column heads, every figure) is set in DM Mono with tabular numerals, so nothing decorative looks like data. Depth is hairlines and tone; there are no cards inside cards, no icon tiles, no gradients, no glass.

The palette (green #239e4b, pink #dd6383, derived dark theme) and the login screens (including Playfair Display) are pinned by the brand and are not part of this system's freedom.

**Key Characteristics:**
- Listagem Zebrada: green band on rows 1-3, plain on 4-6, repeating.
- Pink highlighter behind a name, never pink text.
- State in form as well as hue: full bar, dashed, struck, doubled.
- One sans family plus mono for data; no eyebrows in the interior.
- Rail of index tabs that opens over the page without pushing it.

## Colors

A pale green-grey sheet with white paper, one deep green for action, one pink for attention, and pastel-free status inks.

### Primary
- **Tico Green** (#239e4b): the brand green. Used as solid fill for the full stock bar, the focus ring, text selection, caret and input focus border. Not used as a background behind white text (contrast too low).
- **Tico Green Deep** (#147a37): every button fill and the open rail tab or tab underline, where white text must hold AA. Hover goes to #0f6a2e.

### Secondary
- **Tica Pink** (#dd6383): appears only as the highlighter wash (38% alpha light, #e8738f at 34% dark) behind a name, and as the avatar disc in the rail.
- **Tica Pink Deep** (#ba4566): the "low" ink for stamps and dashed marks (dark theme lifts to #f08aa3).

### Neutral
- **Sheet** (#f7f9f7; dark #0f1411): page background and quiet-button hover.
- **Paper** (#ffffff; dark #171e19): the sheet, inputs, rail, top-bar search.
- **Ink** (#17201b; dark #eaf0ec): text and figures.
- **Muted** (#5f6762; dark #a3aea7): secondary text, darkened so it holds AA on the green band.
- **Muted Light** (#6f7872; dark #7d8a82): column heads, placeholders, struck-out mark.
- **Hairline** (#e7ebe8; dark #27312b): every border and divider.
- **Band** (#eaf7ee; dark #1a2a20): the tint on rows 1-3 of each group of six.
- **Expiring Ink** (#8a5a12; dark #e8b869) and **OK Ink** (#147a37; dark #7fd49a): stamp inks for vencendo and em estoque.
- **Danger** (#c95b55): destructive buttons and error text only.

### Named Rules
**The Highlighter Rule.** Pink is a stroke behind a name, on the lower 40% of the line, for a row that needs the team. It is never a text colour and never a fill for a button.
**The Deep Green Rule.** Solid green behind white text uses #147a37, not #239e4b.
**The Two Themes Rule.** Surfaces, text, hairlines, band and status inks follow `--color-*` variables; green and pink brand values stay fixed in both themes.

## Typography

**Display Font:** none in the interior (Playfair Display Variable survives only on login)
**Body Font:** DM Sans Variable (with ui-sans-serif, system-ui)
**Label/Mono Font:** DM Mono (with ui-monospace)

**Character:** one quiet sans for reading, one mono for anything the user will compare or copy. The pairing makes numbers look like printed figures.

### Hierarchy
- **Title** (600, 22px, 1.25, -0.01em): the page head h1, one per screen.
- **Body** (400, 13px): rows, fields, buttons (500 weight), tabs.
- **Label** (500, 12px, muted): field labels, page meta line, account name.
- **Figure** (DM Mono, 13px, tabular): quantities, prices, SKUs; totals line figures at 15px semibold.
- **Column head** (DM Mono, 11px, 0.04em, uppercase, muted-light): listing heads.
- **Stamp** (DM Mono 500, 10px, 0.05em, uppercase): status text.

### Named Rules
**The Figure Rule.** Every number a person might compare is DM Mono with tabular numerals, and money goes through `utils/money.js` (pt-BR).
**The One Family Rule.** No second sans, no serif inside the signed-in app.

## Layout

A fixed 64px rail on the left at `lg` and up; content is offset `pl-16`, so the rail opening to 232px overlays the page. Below `lg` the rail is replaced by a sticky header with a menu button and a 248px drawer. A sticky 56px top bar (desktop only) holds search, notifications and the primary action. Page content is padded 36px horizontally on desktop, 20px inside sheets, and capped around 1180px on the dashboard and lists. Page head sits 24px above content. Rows use 12px vertical and 16px grid gaps; column grids are declared per list with `minmax(0, ...)` tracks and a fixed 96px trailing column where needed. Reading text is capped near 62ch.

## Elevation & Depth

Flat. Depth is a hairline border plus tone: paper over sheet, band over paper. The only shadow is the rail's soft side shadow (`8px 0 24px -12px rgba(23,32,27,.22)`) while it is open over the page, a response to hover or focus. Row hover is a 5% ink wash.

### Named Rules
**The One Sheet Rule.** A sheet is never nested inside a sheet.

## Shapes

Small, ruled corners: 6px on sheets, buttons, inputs; 3px on stamps with a 1.5px border; full circle only for the user avatar and scrollbar thumb. Stock marks are 26x8px slivers with 1px corners. Borders are 1px hairlines; the tab underline is 2px.

## Components

### Buttons
- **Shape:** 6px radius, 36px high, 13px medium text, 14px side padding.
- **Primary:** Deep Green fill, white text; hover #0f6a2e.
- **Quiet:** paper fill, hairline border, ink text; hover to sheet.
- **Danger:** outlined in danger at 50%, 10% wash on hover.
- **Disabled:** 50% opacity. Press feedback `scale(0.97)` where `.pressable` is used.

### Inputs / Fields
- 40px high, 6px radius, paper fill, hairline border, 13px text; focus swaps the border to green (plus the 2px global focus ring on keyboard focus). Labels sit above at 12px medium muted.

### Listing (signature)
Column head in mono caps over rows. Rows 1-3 of every six take the band tint. Clickable rows get the ink wash on hover. A row that needs attention puts the name inside the highlighter stroke inline. Entrance on Painel is a 320ms row-in with a 30ms stagger; reduced motion removes it.

### Stamp and Stock mark
Status is a bordered uppercase mono stamp in one ink (ok, warn, low, off). Next to it the stock mark carries the same state in shape: solid bar = em estoque, dashed = baixo, a single strike = sem estoque, double rules = vencendo. The text label always travels with the mark.

### Navigation
Rail of index tabs, 44px each, icon at 22px inset, label revealed on hover or focus-within; the open tab is filled Deep Green, attached to the rail edge. Every link carries a `title`. Account block and "Sair da conta" sit at the foot. Tabs inside pages use a 2px underline in Deep Green with muted inactive text.

### Top bar
Search field (up to 420px) with a "/" key hint that focuses it from anywhere and feeds the Estoque list's busca; a bell; then "Novo produto" for ADMIN and MANAGER.

### Page head
Title left, one meta line under it, actions right, wrapping on narrow widths. No eyebrow.

## Do's and Don'ts

### Do:
- **Do** band lists in threes with `--color-band`, and put figures in DM Mono tabular.
- **Do** show stock state as shape plus label plus ink, never hue alone.
- **Do** use #147a37 behind white text; keep the focus ring 2px #239e4b.
- **Do** keep copy in pt-BR and the same words as the phone app.
- **Do** honor `prefers-reduced-motion` on every animation (rise, page-in, row-in, flap, toggle).
- **Do** show empty states plainly; stock starts being entered this week.

### Don't:
- **Don't** colour text pink, or fill a button with pink.
- **Don't** nest sheets, add icon tiles, gradients (the highlighter wash and stock-out strike are the only ones), or glass.
- **Don't** put Playfair Display or a second sans in the interior.
- **Don't** build the generic left menu, four KPI cards and plain white table.
- **Don't** invent data the API lacks; hide the control instead.

## Honest deviations and open items

- The web has no stock-entry or movement screen; entry happens in the phone app, so list rows offer view and edit only.
- Reports "Vencimentos" and "Lucro" are not available yet.
- Pinned and unchanged: the brand palette and LoginPage.jsx.
- The brief named the dark band #17301f; the build ships #1a2a20, which is recorded here.
- Verified live at 1440 and 390 in the light theme; dark was spot-checked only.
