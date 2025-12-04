
# ClaimLens — Enterprise Features & Acceptance

## P0 — MVP Gate (MenuShield)
- Banned Claims Detection — AC: flags and reason; suggests disclaimer or block.
- Allergen Highlight — AC: badges from packs; visible in overlay & audit.
- Disclaimers (Locale) — AC: correct copy per locale; switchable.
- PII Redaction — AC: masks email/phone/pincode; counts reported.
- Audit Pack — AC: JSONL + MD with before/after, reasons, perf, hash + ts.

## P1 — Admin Console
- Profiles & Routes Editor — AC: drag order, thresholds, preview, writes to spec.
- Augment‑Lite Gate — AC: 4C + “Explain why” required for risky edits; logged.
- Rule Packs Editor — AC: versioning, diff, test against fixture.
- Fixtures Runner — AC: shows flags, perf, audit link.

## P2 — Overlay (ClaimLens Go)
- Inline Badges + Side Panel — AC: renders on site fixtures; tooltips; locale toggle.

## P3 — Ops & Security
- Degraded Mode — AC: banner + audit note when non‑critical MCP down.
- RBAC (Basic) — AC: Admin (edit), Viewer (read).

## A11y
- AC: Keyboard reachable; focus visible; contrast AA.

## Perf
- AC: p95 synthetic route latency ≤ budgets.
