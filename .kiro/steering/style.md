# Steering — ClaimLens Tone, Accessibility, Logs, Commits

- Never fabricate nutrition; only normalize units or attach disclaimers.
- Tone: factual, non‑alarmist; always show one‑line “why” with a source link.
- Accessibility: WCAG AA (≥ 4.5:1). Keyboard focus rings visible. ESC closes tooltips and drawers.
- Logs (JSON): `ts, profile, route, transform, decision, reason, duration_ms`.
- Commit style: `type(scope): summary – refs #id`.

## Steering Compliance Checks
- [ ] “why” line present for each user‑visible warning
- [ ] Source link present when available
- [ ] Contrast ≥ 4.5:1 confirmed
- [ ] Keyboard‑navigable interactions confirmed
