# ClaimLens Dual-Mode Spec Bundle — Summary

## Overview

This document summarizes the comprehensive spec bundle created for ClaimLens dual-mode (B2B MenuShield + B2C Consumer Mode) system.

---

## DIFF SUMMARY

### Files Created (13 new documentation files)

1. **docs/SECURITY_PRIVACY.md** - Comprehensive security guide
   - CSP policies, SSRF defense, domain allowlist
   - PII encryption at rest, rule pack signatures
   - Webhook HMAC, secrets rotation procedures

2. **docs/OBSERVABILITY.md** - Complete observability stack
   - OpenTelemetry integration, distributed tracing
   - Prometheus metrics, structured logging
   - Error budget tracking, SLO monitoring

3. **docs/DESIGN_SYSTEM.md** - Full design system documentation
   - Dark-first glassmorph aesthetic
   - Color tokens, typography, spacing
   - Component patterns, accessibility rules

4. **docs/UX_SPEC.md** - Detailed UX specifications
   - Information architecture for B2B and B2C
   - User flows (Menu Validation, Safe Ordering, Scan Hub)
   - Screen designs, interaction patterns

5. **docs/MOTION_A11Y.md** - Animation and accessibility guide
   - Motion principles (120-180ms timing)
   - Focus indicators (2px Teal)
   - Reduced motion/transparency fallbacks

6. **docs/CLAIMS_LOCALE_RULES.md** - Claim classification system
   - Claim categories (health, nutrition, marketing)
   - Regulator templates (FSSAI, FDA, FSA)
   - Unit normalization, trust score calculation

7. **docs/DEGRADED_MODE.md** - Degraded mode operations
   - Service classification matrix
   - Circuit breaker implementation
   - Fallback strategies, UI banners

8. **docs/WEBHOOKS.md** - Webhook integration guide
   - Event types, payload structures
   - HMAC signature verification
   - Retry policy, delivery dashboard

9. **docs/CI_CD.md** - CI/CD pipeline documentation
   - GitHub Actions workflow
   - Quality gates (coverage, budgets, signatures)
   - Deployment strategy, rollback procedures

10. **docs/RUNBOOK.md** - Operations runbook
    - Health checks, incident response
    - Common incidents, scaling procedures
    - Backup/restore, data retention

11. **docs/TROUBLESHOOTING.md** - Troubleshooting guide
    - Development environment issues
    - Testing, API, database problems
    - Performance debugging, CI/CD issues

12. **docs/STORYBOOK_NOTES.md** - Storybook documentation
    - Component stories, design system docs
    - Accessibility testing, interaction tests
    - Deployment, best practices

13. **app/web/design-tokens.css** - Design tokens CSS file
    - Complete color palette (Ink, Surface, Cloud, Indigo, Teal, etc.)
    - Typography scale, spacing, shadows
    - Glass utilities, accessibility helpers

### Files Preserved (No Changes)

- ✅ `.kiro/specs/claimlens-system/requirements.md` - Already comprehensive (28 requirements)
- ✅ `.kiro/specs/claimlens-system/design.md` - Already detailed
- ✅ `.kiro/specs/claimlens-system/tasks.md` - Already complete
- ✅ `docs/PRD.md` - Already covers dual-mode personas
- ✅ `docs/NFR.md` - Already has SLOs and budgets
- ✅ `docs/GLOSSARY.md` - Already comprehensive
- ✅ `docs/API_SPEC.md` - Already has B2B and B2C endpoints
- ✅ All `.kiro/` directories (specs, steering, hooks, registry)

---

## FILE TREE

```
claimlens/
├── .kiro/
│   ├── specs/
│   │   ├── claimlens-system/
│   │   │   ├── requirements.md ✅ (preserved)
│   │   │   ├── design.md ✅ (preserved)
│   │   │   └── tasks.md ✅ (preserved)
│   │   ├── degraded-mode-matrix.yaml ✅ (preserved)
│   │   └── policies.yaml ✅ (preserved)
│   ├── steering/
│   │   └── style.md ✅ (preserved)
│   └── hooks/ ✅ (preserved)
│
├── docs/
│   ├── PRD.md ✅ (preserved)
│   ├── NFR.md ✅ (preserved)
│   ├── GLOSSARY.md ✅ (preserved)
│   ├── API_SPEC.md ✅ (preserved)
│   ├── SECURITY_PRIVACY.md ⭐ NEW
│   ├── OBSERVABILITY.md ⭐ NEW
│   ├── DESIGN_SYSTEM.md ⭐ NEW
│   ├── UX_SPEC.md ⭐ NEW
│   ├── MOTION_A11Y.md ⭐ NEW
│   ├── CLAIMS_LOCALE_RULES.md ⭐ NEW
│   ├── DEGRADED_MODE.md ⭐ NEW
│   ├── WEBHOOKS.md ⭐ NEW
│   ├── CI_CD.md ⭐ NEW
│   ├── RUNBOOK.md ⭐ NEW
│   ├── TROUBLESHOOTING.md ⭐ NEW
│   └── STORYBOOK_NOTES.md ⭐ NEW
│
├── app/
│   ├── web/
│   │   └── design-tokens.css ⭐ NEW
│   ├── admin/ ✅ (preserved)
│   └── api/ ✅ (preserved)
│
└── packages/ ✅ (preserved)
```

---

## RUN COMMANDS

### Development

```powershell
# Windows PowerShell

# Install dependencies
pnpm install

# Start development servers
pnpm dev                          # All services
pnpm dev:api                      # API only
pnpm dev:admin                    # Admin Console only
pnpm dev:web                      # Browser Extension only

# Start MCP mock services
pnpm mcp:dev

# Start Storybook
pnpm storybook
```

```bash
# macOS/Linux

# Install dependencies
pnpm install

# Start development servers
pnpm dev                          # All services
pnpm dev:api                      # API only
pnpm dev:admin                    # Admin Console only
pnpm dev:web                      # Browser Extension only

# Start MCP mock services
pnpm mcp:dev

# Start Storybook
pnpm storybook
```

### Testing

```powershell
# Windows PowerShell

# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit                    # Unit tests (Node)
pnpm test:browser                 # Browser tests (jsdom)
pnpm test:integration             # Integration tests
pnpm test:e2e                     # E2E tests (Playwright)

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test packages/transforms/__tests__/rewrite.disclaimer.spec.ts
```

```bash
# macOS/Linux

# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit                    # Unit tests (Node)
pnpm test:browser                 # Browser tests (jsdom)
pnpm test:integration             # Integration tests
pnpm test:e2e                     # E2E tests (Playwright)

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test packages/transforms/__tests__/rewrite.disclaimer.spec.ts
```

### Quality Gates

```powershell
# Windows PowerShell

# Check coverage threshold
pnpm check:coverage

# Validate schemas
pnpm validate:schemas

# Verify rule pack signatures
pnpm verify:signatures

# Check latency budgets
pnpm check:budgets

# Verify documentation completeness
pnpm check:docs

# Run all quality gates
pnpm hooks:precommit
```

```bash
# macOS/Linux

# Check coverage threshold
pnpm check:coverage

# Validate schemas
pnpm validate:schemas

# Verify rule pack signatures
pnpm verify:signatures

# Check latency budgets
pnpm check:budgets

# Verify documentation completeness
pnpm check:docs

# Run all quality gates
pnpm hooks:precommit
```

### Build

```powershell
# Windows PowerShell

# Build all packages
pnpm build

# Build specific packages
pnpm build:transforms
pnpm build:api
pnpm build:admin
pnpm build:web

# Build Storybook
pnpm build-storybook
```

```bash
# macOS/Linux

# Build all packages
pnpm build

# Build specific packages
pnpm build:transforms
pnpm build:api
pnpm build:admin
pnpm build:web

# Build Storybook
pnpm build-storybook
```

### Documentation

```powershell
# Windows PowerShell

# Serve documentation locally
pnpm docs:serve                   # Starts local server on http://localhost:8080

# Generate API documentation
pnpm docs:api

# Validate OpenAPI spec
npx @redocly/cli lint docs/openapi.yaml
```

```bash
# macOS/Linux

# Serve documentation locally
pnpm docs:serve                   # Starts local server on http://localhost:8080

# Generate API documentation
pnpm docs:api

# Validate OpenAPI spec
npx @redocly/cli lint docs/openapi.yaml
```

### Demo Mode

```powershell
# Windows PowerShell

# Toggle degraded mode (for demo)
$env:DEGRADED_MODE="true"
pnpm dev

# Simulate MCP service failure
$env:MCP_OCR_DISABLED="true"
pnpm dev

# Enable debug logging
$env:LOG_LEVEL="debug"
pnpm dev
```

```bash
# macOS/Linux

# Toggle degraded mode (for demo)
export DEGRADED_MODE=true
pnpm dev

# Simulate MCP service failure
export MCP_OCR_DISABLED=true
pnpm dev

# Enable debug logging
export LOG_LEVEL=debug
pnpm dev
```

---

## KEY FEATURES DOCUMENTED

### B2C Consumer Mode
- ✅ Scan Hub (URL/Screenshot/Text/Barcode input)
- ✅ Trust Score calculation (0-100)
- ✅ Verdict system (Allow/Caution/Avoid)
- ✅ Allergen Profile (client-side storage)
- ✅ PWA support (installable, offline shell)
- ✅ Extension overlay (progressive scan, ≤200ms viewport)

### B2B MenuShield
- ✅ Dashboard (KPIs, "Sins of the Menu", degraded banner)
- ✅ Review Queue (bulk actions, before/after slider)
- ✅ Profiles & Routes (drag-and-drop, Augment-Lite gate)
- ✅ Rule Packs (versioned diffs, test against fixtures)
- ✅ Fixtures Runner (p50/p95 metrics, audit packs)
- ✅ Audit Explorer (JSONL/Markdown export)

### Cross-Cutting
- ✅ Multi-tenant & RBAC (Admin/Editor/Viewer)
- ✅ Security (CSP, SSRF, signed rule-packs, webhook HMAC)
- ✅ Privacy (PII redaction, encryption at rest, consent)
- ✅ Observability (OTel traces, Prometheus, error budgets)
- ✅ Performance (route budgets, progressive overlay)

---

## ACCEPTANCE CRITERIA HIGHLIGHTS

### Performance
- Overlay first-viewport: ≤200ms for ≤20 items ✅
- API p95 latency: ≤150ms (/menu/feed) ✅
- Main thread blocking: ≤50ms per batch ✅

### Accessibility
- WCAG AA contrast: ≥4.5:1 ✅
- Focus indicators: 2px Teal ✅
- Keyboard navigation: Tab, Enter, ESC ✅
- Reduced motion support ✅

### Security
- Idempotency-Key: 24h deduplication ✅
- Rule pack signatures: SHA-256 verified ✅
- Webhook HMAC: Constant-time comparison ✅
- PII encryption: AES-256 at rest ✅

### Quality
- Test coverage: ≥80% ✅
- Latency budgets: CI-enforced ✅
- Documentation: Complete for all transforms ✅

---

## DEMO CHECKPOINTS

### Week 1 Demo
- Role-aware routing working
- B2C Scan Hub functional
- Review Queue displaying items

### Week 2 Demo
- Allergen Profile saving preferences
- Why drawer showing sources
- Rule Packs with version diffs

### Week 3 Demo
- Augment-Lite 4C gate working
- Degraded mode simulation
- PWA installable

### Week 4 Demo
- Full accessibility compliance
- Storybook deployed
- 3-minute feature walkthrough

---

## OPEN QUESTIONS & RECOMMENDATIONS

### 1. B2C Scan History Storage
**Question:** Should scan history be stored server-side or client-side only?

**Recommendation:** Client-side by default (localStorage), opt-in for server-side with explicit consent. This maintains privacy-first approach.

### 2. Trust Score Weights
**Question:** Are the trust score weights optimal?
- Banned claim (high): -40
- Recall: -30
- Allergen: -20
- Weasel words: -10 to -20

**Recommendation:** Start with these values, A/B test with real users, adjust based on feedback.

### 3. Degraded Mode UI
**Question:** Should degraded mode banner be dismissible?

**Recommendation:** Yes, but show again on page refresh. Store dismissal in session storage, not localStorage.

### 4. Webhook Retry Policy
**Question:** Is 5 retry attempts sufficient?

**Recommendation:** Yes for most cases. Provide manual retry button in dashboard for failed webhooks.

### 5. Storybook Deployment
**Question:** Should Storybook be public or private?

**Recommendation:** Public for open-source projects, private (behind auth) for enterprise. Use Chromatic for visual regression testing.

---

## NEXT STEPS

1. **Review this spec bundle** - Ensure all requirements are captured
2. **Approve design decisions** - Confirm color palette, UX flows
3. **Begin implementation** - Start with Phase 1 tasks from tasks.md
4. **Set up CI/CD** - Configure GitHub Actions with quality gates
5. **Deploy Storybook** - Set up component documentation site

---

## NOTES

- All existing spec work preserved (requirements, design, tasks)
- No breaking changes to current implementation
- Documentation extends and complements existing specs
- Ready for immediate implementation
- Estimated timeline: 30 days (4 weeks) as per tasks.md

---

## REFERENCES

- [Requirements](.kiro/specs/claimlens-system/requirements.md)
- [Design](.kiro/specs/claimlens-system/design.md)
- [Tasks](.kiro/specs/claimlens-system/tasks.md)
- [PRD](docs/PRD.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [UX Spec](docs/UX_SPEC.md)
- [Security & Privacy](docs/SECURITY_PRIVACY.md)
- [Observability](docs/OBSERVABILITY.md)

---

**Created:** November 2, 2025
**Status:** Ready for Review
**Version:** 1.0.0
