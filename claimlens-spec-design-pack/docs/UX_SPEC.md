
# ClaimLens — UX Spec (Admin + Overlay)

## Design Principles
- Assistive, not alarmist; neutral copy with “why” and source links.
- Dark-first (“Kiroween chic”), subtle neon accents; strict readability.
- A11y AA: 4.5:1 contrast, keyboard focus/escape everywhere.
- Speed: perceived < 100ms for UI actions.

## Screens
1) **Dashboard** — KPI cards, recent audits table, degraded-mode banner.
2) **Profiles & Routes** — drag transform order; thresholds; preview; Augment‑Lite modal on risky edits.
3) **Rule Packs** — phrase/allergen/disclaimer editors; versioning + diff; test against fixture.
4) **Fixtures Runner** — run chain; see flags + perf + link to audit.
5) **Audit Viewer** — before/after; reasons; perf; download JSONL/MD.
6) **Overlay (ClaimLens Go)** — inline badges + side panel with tooltips and locale toggle.

## Components
Buttons (primary/ghost/danger), cards (16px radius), badges (warn/danger/ok), tables with sticky headers.

## Micro‑Interactions
Badge pulse (120ms), diff pill on save, mandatory “Explain why” for high‑risk policy edits, Tab/Esc keyboard patterns.

## Empty States
“No audits yet” page with single CTA to run fixtures.
