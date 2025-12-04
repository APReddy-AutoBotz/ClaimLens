# Requirements Changelog — ClaimLens System

## Summary of Changes

Updated requirements document with 9 new requirements and expanded 4 existing requirements based on enterprise, security, and operational needs.

---

## A) GLOSSARY EXPANSIONS

**Added Terms:**
- ClaimLens MenuShield (B2B product definition)
- ClaimLens Go (B2C product definition)
- Policy DSL, Rule Pack, Tenant, Correlation ID
- Error Budget, Claim Category
- FDA, FSA (additional regulators)
- CSP, SSRF, NDJSON (technical terms)

---

## B) UPDATED REQUIREMENTS

### Requirement 2: Disclaimer Management → Disclaimer Management and Claim Classification

**Old ACs:** 5 criteria focused on locale-based disclaimer selection

**New ACs:** 8 criteria adding:
- Claim category classification (health, nutrition, marketing)
- Regulator template mapping per category
- Unit normalization per locale (kcal/kJ, g/oz)
- Explicit conversion rules documentation
- Fallback behavior with logging

**Rationale:** Support claim categories and unit normalization for international compliance

---

### Requirement 5: Performance Monitoring → Performance Monitoring and SLOs

**Old ACs:** 5 criteria for basic performance measurement

**New ACs:** 10 criteria adding:
- Explicit route SLO targets (availability 99.5%, latency p95 per route)
- Error budget policy (0.5% failed requests per 30-day window)
- Alert thresholds (50% warning, 80% critical)
- Log sampling at high QPS (>1000 req/s, 10% sample rate)
- Structured log fields including tenant and request_id

**Rationale:** Production-grade observability with SLOs and error budgets

---

### Requirement 11: Browser Extension - Content Overlay → Browser Extension - Content Overlay Performance

**Old ACs:** 5 criteria with simple 200ms scan requirement

**New ACs:** 10 criteria adding:
- Realistic first-viewport scan (≤200ms for ≤20 items)
- Incremental full-page scan with MutationObserver
- Main thread blocking limit (≤50ms)
- requestIdleCallback usage for non-critical tasks
- Infinite scroll support with progressive badge rendering
- Domain allowlist and user consent requirements

**Rationale:** Realistic performance constraints for production browser extension

---

### Requirement 18: Security and Rate Limiting (EXPANDED)

**Old ACs:** 5 criteria for basic security

**New ACs:** 10 criteria adding:
- Unicode NFC normalization
- HTML sanitization (CSP-friendly)
- SSRF defense for MCP calls
- Per-IP burst control (10 req/s)
- JSON schema validation for all types
- Rule pack signature verification (SHA-256)
- CI signature verification requirement
- Security violation logging

**Rationale:** Enterprise-grade security controls and attack surface reduction

---

## C) NEW REQUIREMENTS

### Requirement 20: Policy DSL Governance (NEW)

**User Story:** Policy administrator wants versioned, validated policy changes with safe rollout

**9 Acceptance Criteria:**
- Semantic versioning for policies
- JSON schema validation before save
- Dry-run preview with fixture diffs
- Staged rollout (10% → 50% → 100%)
- Automatic rollback on 5% error rate threshold
- SHA-256 signed rule packs
- Checksum verification on load
- Change logging with version, user, delta
- 365-day version history retention

**Rationale:** Production-grade policy governance with safety mechanisms

---

### Requirement 21: Multi-Tenant Isolation and RBAC (NEW)

**User Story:** Enterprise administrator wants tenant isolation and role-based access

**8 Acceptance Criteria:**
- Tenant data isolation (data, logs, audits, configs)
- Cross-tenant access prevention
- Three roles: Admin, Editor, Viewer
- API gateway permission enforcement
- Change logging with user, timestamp, delta
- Exportable audit trail (CSV)
- MFA for Admin role
- 8-hour session expiry

**Rationale:** Enterprise multi-tenancy support with security controls

---

### Requirement 22: Privacy Controls and Data Retention (NEW)

**User Story:** Privacy officer wants granular privacy controls and configurable retention

**9 Acceptance Criteria:**
- Extension requires explicit user consent
- Domain allowlist for extension operation
- AES-256 encryption for PII at rest
- Default PII redaction in B2C audits
- Disabled re-identification for B2C
- Configurable retention (default 90d, max 365d)
- Automated daily purge job
- Documented purge procedures
- Data export before purge

**Rationale:** GDPR/privacy regulation compliance

---

### Requirement 23: Degraded Mode Policy Matrix (NEW)

**User Story:** Reliability engineer wants explicit degraded mode policies

**8 Acceptance Criteria:**
- Critical vs Non-critical service classification
- ocr.label: Non-critical, pass-through action
- unit.convert: Non-critical, pass-through action
- recall.lookup: Non-critical, modify action (generic disclaimer)
- alt.suggester: Non-critical, pass-through action
- Admin banner template for degraded mode
- Audit note template for degraded operations
- Documented matrix in degraded-mode-matrix.yaml

**Rationale:** Predictable system behavior during service outages

---

### Requirement 24: Design System Constraints (NEW)

**User Story:** UI developer wants consistent design system with built-in accessibility

**9 Acceptance Criteria:**
- Design tokens (Indigo, Teal, Amber, Red, Emerald, Ink, Cloud)
- WCAG AA 4.5:1 contrast enforcement
- 2px minimum focus ring width
- ESC key closes modals/tooltips
- 180ms maximum animation duration
- 16px border radius for cards
- Color-coded badges (Amber warn, Red danger, Emerald ok)
- Sticky table headers with alternating rows
- Visual checklist in DESIGN_SYSTEM.md

**Rationale:** Consistent, accessible UI implementation

---

### Requirement 25: API Schema Validation and Error Handling (NEW)

**User Story:** API consumer wants consistent error responses and schema validation

**9 Acceptance Criteria:**
- JSON schema validation for all API types
- HTTP 400 with machine-readable error codes
- HTTP 401 for auth failures
- HTTP 403 for permission failures
- HTTP 429 with Retry-After header
- HTTP 5xx with correlation ID (no internal details)
- Required X-Correlation-ID header
- Correlation ID echoed in responses and audits
- Documented error model in API_SPEC.md

**Rationale:** Production-grade API error handling and debugging

---

### Requirement 26: CI/CD Pipeline Gates (NEW)

**User Story:** Release manager wants automated quality gates

**8 Acceptance Criteria:**
- Policy/pack JSON schema validation
- Rule pack signature verification
- Fixture regression suite enforcement
- Latency budget enforcement
- Transform test file requirement
- Transform README mention requirement
- SAST security scanning
- 80% minimum code coverage for transforms

**Rationale:** Automated quality and security gates in deployment pipeline

---

### Requirement 27: Commercial Features - Export and Webhooks (NEW)

**User Story:** Enterprise customer wants data export and webhook integration

**9 Acceptance Criteria:**
- GET /v1/export/menu.ndjson endpoint
- Tenant-scoped export responses
- Cursor-based pagination
- Per-tenant webhook configuration
- Webhook POST with verdict payload
- Exponential backoff retry (1s, 2s, 4s, 8s, 16s)
- 5-attempt failure threshold
- Webhook delivery status dashboard
- HTTPS requirement with signature verification

**Rationale:** Enterprise integration capabilities

---

### Requirement 28: Deployment and Operations (RENUMBERED)

**Note:** Previously Requirement 20, renumbered to 28 after new requirements added. Content unchanged.

---

## D) TOTAL REQUIREMENT COUNT

- **Before:** 20 requirements
- **After:** 28 requirements
- **New:** 8 requirements
- **Expanded:** 4 requirements
- **Total Acceptance Criteria:** 200+ (from 100)

---

## E) ALIGNMENT VERIFICATION

✅ All terminology uses: ClaimLens, MenuShield (B2B), ClaimLens Go (B2C), menushield_in profile
✅ All new ACs follow EARS format (WHEN/WHERE/IF/THEN patterns)
✅ All new ACs are measurable and testable
✅ No existing good content removed
✅ Realistic performance constraints (overlay timing adjusted)
✅ Security controls comprehensive (Unicode NFC, CSP, SSRF, signatures)
✅ Privacy controls GDPR-aligned
✅ Multi-tenancy enterprise-ready
✅ Observability production-grade (SLOs, error budgets, correlation IDs)

---

## F) NEXT STEPS

1. Review updated requirements document
2. Update docs/PRD.md with new features
3. Update docs/NFR.md with SLOs and security controls
4. Update docs/API_SPEC.md with error model and schemas
5. Proceed to design phase once requirements approved
