# Kiro Prompts — ClaimLens

Use these in order.

## A) MASTER BRIEF → PRD/NFR/RISKS/GLOSSARY/STORYBOARD
(creates docs/*.md)
```
You are my Spec Engineer. Generate the core product docs for “ClaimLens”.

Scope:
- ClaimLens MenuShield (B2B pre‑publish gate) + ClaimLens Go (B2C overlay).
- Detect misleading claims, highlight allergens, normalize nutrition, insert locale‑correct disclaimers, redact PII.
- Deterministic MVP: rules/regex + parsing; LLMs gated; en‑IN first; i18n‑ready.
- Non‑functional: WCAG AA, JSON logs with reasons, latency p95 ≤150ms per route.

Deliverables:
- docs/PRD.md, docs/NFR.md, docs/RISKS.md, docs/GLOSSARY.md, docs/DEMO_STORYBOARD.md
(Plain English, numbered, acceptance criteria per doc.)
```

## B) POLICY DSL SPEC → /.kiro/specs/policies.yaml
```
Synthesize a complete Spec for the Policy DSL.
Profiles: menusheild_in (B2B), claimlens_go (B2C).
Include routes, transform order, fixtures, latency budgets, thresholds (sugar 22g/100g, sodium 600mg).
Log fields: ts, profile, route, transform, decision, reason, duration_ms.
Add concise example inputs/outputs per route.
```

## C) STEERING → /.kiro/steering/style.md
```
Update tone, a11y, logs, commit rules; add “Steering Compliance Checks” list.
```

## D) HOOKS → /.kiro/hooks/*.sh + /scripts/*.mjs
```
Write precommit_contracts.sh, pr_verify.sh, release_gate.sh
and scripts: run-fixtures.mjs, run-perf.mjs, check-budgets.mjs, check-docs.mjs
They must run on Node 20 + pnpm and fail on violations.
```

## E) MCP → /.kiro/mcp/registry.json + docs/MCP_NOTES.md
```
Register ocr.label, unit.convert, recall.lookup, alt.suggester stubs with localhost servers and produce short notes.
```

## F) VIBE CODING (leaf transforms + tests)
```
Create packages/transforms/rewrite.disclaimer.ts (+ tests) and redact.pii.ts (+ tests).
Follow Steering. Keep functions pure.
```
