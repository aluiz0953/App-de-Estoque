---
version: 1
slug: "frontend-web"
primary_target: "frontend/web"
related_targets: ["frontend/mobile"]
---

# Surface brief: Tico e Tica estoque (web + Android app), signed-in interior

Mode: Operate. Scope: every signed-in screen of the web app and the Android app. Login screens and the green/pink palette are pinned and stay as they are.

Audience and job: the owner and a small team of a perfumery that resells Natura, O Boticário and Jequiti. They receive romaneios, check validity, move stock with a reason, register customer orders and read brand magazines, standing up, often on the phone. Success is trusting the number on screen. Constraints: pt-BR copy, same words on web and app, no invented data (stock starts being entered this week, so empty states are the normal first state), permissions and offline sync untouched.

Unresolved: whether the web sidebar keeps a hover-expand behavior (the user admired an Instagram CSS sidebar but could not show it).

## Direction contract

THESIS: The stock read like a romaneio printout. Rows come in bands of three so the eye never loses its line, and a pink highlighter appears only on what needs the team. Refuses: left menu + four KPI cards + plain white table.

OWN-WORLD: Sheet #f7f9f7 (dark #0f1411), band tint #eaf7ee (dark #17301f), ink #17201b, hairlines #e7ebe8. Green #239e4b only for the primary action and the open tab; pink #dd6383 only as a highlighter stroke behind the name of a row that needs attention, never as text. One family, DM Sans, with DM Mono for codes, column heads and every figure, tabular numerals. Playfair Display survives only on the login screens. State is form, not just hue: full bar = ok, dashed = low, struck = out, doubled = expiring. No cards inside cards, no icon tiles, no gradients, no glass.

STORY: Open the app and know in one look what needs you, then find any product by scanning down a banded list, then act (receive, withdraw, order) without leaving the list. The reader believes the number because nothing decorative looks like data.

FIRST VIEWPORT: A 64px rail of index tabs on the left (icon plus label that opens on hover/focus, the open tab filled green and attached to the page edge). Top bar: search with "/" shortcut and "Novo produto". Page head: title left, "Atualizado agora" right. Directly below, one totals line (produtos, valor, baixo, vencendo) as ruled figures, then the list "Precisa de você" with pink-highlighted rows first, then the Movimentações chart in the same palette. Primary action sits top right.

FORM: Listagem Zebrada, candidate 4 of 7, seed 373499f1. Raises: state in form, not just hue (from the emission-line rail); in Revistas the focused cover grows and the shelf dims (from the catalog wall).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
