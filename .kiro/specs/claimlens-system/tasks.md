# Implementation Plan — ClaimLens System

## Overview

This implementation plan breaks down the ClaimLens system into discrete, manageable coding tasks. Each task builds incrementally on previous work and references specific requirements from the requirements document.

**Execution Strategy:**
- Tasks marked with `*` are optional (testing, documentation enhancements)
- Core implementation tasks must be completed in order
- Each task should be completable in 2-4 hours
- All tasks include specific requirements references

---

## Phase 1: Core Transform Pipeline (Week 1)

- [x] 1. Set up project structure and core interfaces





  - Create TypeScript interfaces for MenuItem, Verdict, Reason, Change, AuditRecord
  - Define TransformFunction, TransformContext, TransformResult interfaces
  - Set up module structure: packages/transforms/, app/api/, app/web/
  - Configure TypeScript with strict mode and path aliases
  - _Requirements: 1.1, 1.4_

- [x] 1.1 Implement MenuItem normalization helper


  - Create `normalizeIngredients()` function accepting string | string[]
  - Add unit tests for string splitting (comma, semicolon, newline)
  - Add unit tests for array pass-through
  - Add unit tests for empty/undefined handling
  - _Requirements: 1.1_

- [x] 1.2 Create Transform Pipeline Engine


  - Implement TransformPipeline class with loadPolicy(), registerTransform(), execute()
  - Add policy loader with YAML parsing
  - Add transform registry with discovery from packages/transforms/
  - Add execution coordinator running transforms in sequence
  - Add error handling for transform timeouts and exceptions
  - _Requirements: 1.1, 1.5, 5.1_

- [x] 1.3 Implement Policy Loader with versioning


  - Parse policies.yaml with semantic version extraction
  - Validate policy structure against JSON schema
  - Load and cache rule packs from packs/ directory
  - Implement SHA-256 signature verification for rule packs
  - Add hot-reload capability with TTL-based cache invalidation
  - _Requirements: 20.1, 20.2, 20.6, 20.7_

- [x] 1.4 Write integration tests for transform pipeline






  - Test policy loading and caching
  - Test transform registration and discovery
  - Test pipeline execution with multiple transforms
  - Test error handling and degraded mode
  - _Requirements: 1.1, 1.5_

---

## Phase 2: Core Transforms Implementation (Week 1-2)

- [x] 2. Implement rewrite.disclaimer transform




  - Port existing rewrite.disclaimer.ts to use normalized ingredients
  - Add claim category classification (health, nutrition, marketing)
  - Map categories to regulator templates (FSSAI/FDA/FSA) per locale
  - Add unit normalization rules (kcal/kJ, g/oz)
  - Update tests for new claim classification
  - _Requirements: 2.1, 2.2, 2.3, 2.7_

- [x] 2.1 Implement redact.pii transform


  - Port existing redact.pii.ts to pipeline interface
  - Ensure Unicode NFC normalization before processing
  - Add PII encryption at rest capability
  - Update tests for normalized input
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 18.1_

- [x] 2.2 Implement detect.allergens transform


  - Load allergen database from packs/allergens.in.yaml
  - Scan normalized ingredients array for allergen matches
  - Generate allergen badges with specific allergen names
  - Add cross-contamination risk detection
  - Write unit tests with edge cases
  - _Requirements: 1.3_

- [x] 2.3 Implement normalize.nutrition transform


  - Parse nutrition values (string or number)
  - Convert per-serving to per-100g with documented rules
  - Apply locale-specific unit conversions (kcal/kJ, g/oz)
  - Handle missing or malformed nutrition data gracefully
  - Write unit tests for all conversion scenarios
  - _Requirements: 2.7, 16.3_

- [x] 2.4 Write transform integration tests





  - Test full chain: detect → block → rewrite → redact
  - Test against fixtures/menu/edge-cases.json
  - Validate expected flags and modifications
  - Measure and assert performance within budgets
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

---

## Phase 3: API Gateway and MenuShield API (Week 2)

- [x] 3. Implement API Gateway layer




  - Set up Express/Fastify server with TypeScript
  - Add Bearer token authentication middleware
  - Add tenant resolution from API key
  - Add correlation ID generation and propagation
  - Add rate limiting (100 req/min per key, 10 req/s per IP)
  - _Requirements: 18.2, 18.4, 25.7, 25.8_

- [x] 3.1 Implement idempotency handling


  - Create IdempotencyManager class with Redis backend
  - Add Idempotency-Key header parsing
  - Implement 24-hour TTL for idempotency records
  - Add response caching and replay logic
  - Write unit tests for deduplication scenarios
  - _Requirements: 25.7_

- [x] 3.2 Implement POST /v1/menu/feed endpoint


  - Accept single MenuItem or array of items
  - Normalize ingredients before processing
  - Execute transform pipeline with menushield_in profile
  - Generate Verdict with changes and reasons
  - Return verdicts array with correlation_id
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3.3 Implement POST /v1/menu/validate endpoint

  - Accept single item for quick validation
  - Use subset of transforms for faster processing
  - Target p95 latency ≤100ms
  - Return single Verdict with audit_id
  - _Requirements: 1.1, 1.4, 5.6_

- [x] 3.4 Implement error handling and responses


  - Create Error response model with machine-readable codes
  - Add 400/401/403/429/500 error handlers
  - Echo correlation ID in all error responses
  - Add Retry-After header for 429 responses
  - Never expose internal details in 5xx errors
  - _Requirements: 25.2, 25.3, 25.4, 25.5, 25.6_

- [x] 3.5 Write API endpoint tests







  - Test authentication and authorization
  - Test rate limiting enforcement
  - Test idempotency key handling
  - Test error responses and status codes
  - Test correlation ID propagation
  - _Requirements: 18.2, 18.4, 25.1-25.6_

---

## Phase 4: Audit Trail and Export (Week 2-3)

- [x] 4. Implement audit record generation





  - Create AuditRecord model with all required fields
  - Generate unique audit_id for each request
  - Capture before/after content snapshots
  - Record transform execution times and decisions
  - Include degraded mode status and affected services
  - _Requirements: 4.1, 4.3, 4.4, 13.5_

- [x] 4.1 Implement audit storage


  - Set up TimescaleDB for time-series audit data
  - Create partitioned tables by month
  - Implement automatic partition creation
  - Add indexes for tenant_id, ts, correlation_id, item_id
  - Configure retention policy per tenant (90-365 days)
  - _Requirements: 4.5, 22.6, 22.7_


- [x] 4.2 Implement audit pack generator

  - Port existing generate-audit-pack.mjs to TypeScript
  - Generate JSONL format (one record per line)
  - Generate Markdown summary with before/after diffs
  - Include performance metrics and flag summaries
  - Save to dist/audit-packs/ with unique audit_id
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 4.3 Implement GET /v1/export/menu.ndjson endpoint


  - Query cleaned items scoped to requesting tenant
  - Implement cursor-based pagination
  - Encode/decode cursors with base64
  - Return NDJSON format (newline-delimited JSON)
  - Add X-Next-Cursor and X-Total-Count headers
  - Enforce rate limit: 10 requests/hour
  - _Requirements: 27.1, 27.2, 27.3_


- [x] 4.4 Write audit and export tests


  - Test audit record generation completeness
  - Test audit storage and retrieval
  - Test pagination cursor encoding/decoding
  - Test NDJSON format compliance
  - Test tenant isolation in exports
  - _Requirements: 4.1-4.5, 27.1-27.3_

---

## Phase 5: Multi-Tenancy and RBAC (Week 3)

- [x] 5. Implement tenant data model





  - Create Tenant, ApiKey, User models
  - Add tenant_id foreign keys to all data tables
  - Implement row-level security policies in PostgreSQL
  - Add tenant configuration (retention, webhooks, locales)
  - _Requirements: 21.1, 21.2_

- [x] 5.1 Implement RBAC system


  - Define Role enum (Admin, Editor, Viewer)
  - Create Permission model with resource and actions
  - Implement ROLE_PERMISSIONS mapping
  - Add checkPermission() middleware function
  - Enforce permissions at API gateway level
  - _Requirements: 21.3, 21.4_


- [x] 5.2 Implement user authentication

  - Add JWT token generation and validation
  - Implement multi-factor authentication for Admin role
  - Add session management with 8-hour expiry
  - Add password hashing with bcrypt
  - _Requirements: 21.7, 21.8_

- [x] 5.3 Implement change audit logging


  - Log all configuration changes with user, timestamp, delta
  - Store in policy_change_log table
  - Provide CSV export endpoint for audit trail
  - Include Augment-Lite 4C fields in logs
  - _Requirements: 21.5, 21.6_

- [x] 5.4 Write multi-tenancy tests



  - Test tenant data isolation
  - Test cross-tenant access prevention
  - Test role permission enforcement
  - Test session expiry
  - Test audit trail completeness
  - _Requirements: 21.1-21.8_

---

## Phase 6: MCP Services and Degraded Mode (Week 3-4)

- [x] 6. Implement MCP Service Manager





  - Create MCPServiceManager class
  - Load service definitions from .kiro/mcp/registry.json
  - Implement service health checking
  - Add degraded mode detection and tracking
  - _Requirements: 13.1, 13.2, 23.1_

- [x] 6.1 Implement Circuit Breaker pattern


  - Create CircuitBreaker class with CLOSED/OPEN/HALF_OPEN states
  - Add failure threshold (5 failures) and success threshold (2 successes)
  - Implement timeout handling (500ms default)
  - Add reset timeout (30s) for half-open probing
  - Enforce max inflight requests (10 per service)
  - _Requirements: 13.4, 23.1-23.5_

- [x] 6.2 Implement degraded mode fallbacks


  - Load degraded-mode-matrix.yaml configuration
  - Implement pass_through action (skip transform)
  - Implement modify action (add generic disclaimer)
  - Add fallback logic per service (ocr, unit, recall, alt)
  - Include degraded mode notes in audit records
  - _Requirements: 23.2, 23.3, 23.4, 23.5, 23.7_


- [x] 6.3 Port existing MCP mock servers

  - Update servers/ocr-label.mjs with health endpoint
  - Update servers/unit-convert.mjs with health endpoint
  - Update servers/recall-lookup.mjs with health endpoint
  - Update servers/alt-suggester.mjs with health endpoint
  - Add circuit breaker integration
  - _Requirements: 13.1, 13.2, 13.3_


- [x] 6.4 Write MCP and degraded mode tests


  - Test circuit breaker state transitions
  - Test timeout and retry logic
  - Test degraded mode fallback behaviors
  - Test health check endpoints
  - Test audit note generation
  - _Requirements: 13.1-13.5, 23.1-23.8_

---

## Phase 7: Admin Console Backend (Week 4)

- [x] 7. Implement Admin Console API endpoints





  - GET /v1/admin/dashboard - KPI metrics
  - GET /v1/admin/profiles - List profiles and routes
  - PUT /v1/admin/profiles/:id - Update profile configuration
  - GET /v1/admin/rule-packs - List rule packs with versions
  - PUT /v1/admin/rule-packs/:name - Update rule pack
  - POST /v1/admin/fixtures/run - Execute fixture tests
  - GET /v1/admin/audits/:id - Retrieve audit details
  - _Requirements: 6.1, 6.2, 7.1, 7.2, 8.1, 9.1, 10.1_

- [x] 7.1 Implement Augment-Lite validation


  - Create AugmentLiteGate class
  - Load RISK_PROFILES configuration
  - Validate 4C fields (min 20 chars each)
  - Enforce autonomy slider caps per risk level
  - Route high-risk changes to approval workflow
  - _Requirements: 7.4, 7.5_


- [x] 7.2 Implement policy versioning

  - Parse semantic version from policy files
  - Increment version on changes (MAJOR.MINOR.PATCH)
  - Generate diff between versions
  - Store version history (365 days minimum)
  - _Requirements: 20.1, 20.8, 20.9_

- [x] 7.3 Implement staged rollout


  - Add traffic splitting logic (10% → 50% → 100%)
  - Monitor error rate during rollout
  - Implement automatic rollback on 5% error threshold
  - Log rollout progress and decisions
  - _Requirements: 20.4, 20.5_

- [x] 7.4 Write Admin Console API tests




  - Test dashboard metrics calculation
  - Test profile update with Augment-Lite validation
  - Test rule pack versioning and diff generation
  - Test staged rollout and rollback logic
  - Test permission enforcement per role
  - _Requirements: 6.1-6.5, 7.1-7.5, 8.1-8.5_

---

## Phase 8: ClaimLens Go Browser Extension (Week 4-5)

- [x] 8. Set up browser extension structure (Manifest V3)




  - Create manifest.json with required permissions
  - Set up content script for page scanning
  - Set up background service worker
  - Set up side panel UI
  - Configure build process (Webpack/Vite)
  - _Requirements: 11.1, 11.10, 12.1_

- [x] 8.1 Implement progressive content scanner

  - Create ContentScanner class
  - Implement first-viewport scan (≤200ms for ≤20 items)
  - Set up MutationObserver for dynamic content
  - Implement requestIdleCallback for incremental scanning
  - Add batch processing (5 items, ≤50ms per batch)
  - Add throttled scroll handler (500ms) for infinite scroll
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.8_

- [x] 8.2 Implement POST /v1/web/ingest endpoint


  - Accept array of web items with dom_selector
  - Execute transform pipeline with claimlens_go profile
  - Generate Badge objects (kind, label, explanation, source)
  - Target p95 latency ≤120ms
  - Return badges array with correlation_id
  - _Requirements: 11.5, 11.6, 11.7_


- [x] 8.3 Implement badge rendering

  - Create CSP-safe badge elements (no inline scripts)
  - Apply badges without breaking page layout
  - Add ARIA labels for accessibility
  - Implement tooltip on badge click (≤50ms)
  - Style with design tokens (Amber warn, Red danger, Emerald ok)
  - _Requirements: 11.5, 11.6, 11.7, 24.1, 24.7_



- [x] 8.4 Implement side panel UI

  - Create side panel with flagged items list
  - Add locale toggle (en-IN, en-US, en-GB)
  - Update disclaimers on locale change (≤100ms)
  - Add ESC key handler to close panel
  - Implement keyboard navigation (Tab, Enter, ESC)

  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_



- [x] 8.5 Implement privacy controls


  - Add user consent dialog on first run
  - Store allowlisted domains in local storage
  - Check domain allowlist before scanning
  - Add settings page for domain management
  - _Requirements: 11.10, 22.1, 22.2_

- [x] 8.6 Write Playwright E2E tests





  - Test viewport scan timing (≤200ms)
  - Test main thread blocking (≤50ms)
  - Test infinite scroll support
  - Test WCAG AA contrast ratios (≥4.5:1)
  - Test keyboard navigation
  - Test badge rendering and tooltips
  - _Requirements: 11.1-11.10, 15.1-15.5_

---

## Phase 9: Observability and Monitoring (Week 5)

- [x] 9. Implement structured logging





  - Create Logger class with JSON output
  - Add log fields: ts, tenant, request_id, route, transform, decision, reason, duration_ms
  - Implement PII redaction in logs
  - Add log sampling at high QPS (>1000 req/s, 10% sample)
  - _Requirements: 5.10, 17.1, 17.2, 17.3_

- [x] 9.1 Implement Prometheus metrics


  - Add metrics: requests_total, requests_failed, transforms_executed
  - Add histograms: request_duration_ms, transform_duration_ms
  - Add gauges: active_requests, degraded_services
  - Expose /metrics endpoint
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9.2 Implement SLO tracking


  - Create SLOTracker class
  - Define SLOs per route (availability, latency p95)
  - Calculate error budget remaining
  - Trigger alerts at 50% and 80% consumed
  - _Requirements: 5.6, 5.7, 5.8_

- [x] 9.3 Implement correlation ID propagation

  - Generate UUID for X-Correlation-ID if not provided
  - Propagate through all service calls
  - Include in all log entries
  - Echo in all API responses
  - Embed in audit records
  - _Requirements: 17.5, 25.7, 25.8_

- [x] 9.4 Write observability tests







  - Test log structure and PII redaction
  - Test metrics collection and export
  - Test SLO calculation and alerting
  - Test correlation ID propagation
  - _Requirements: 5.1-5.10, 17.1-17.5_

---

## Phase 10: Webhooks and Integrations (Week 5-6)

- [x] 10. Implement webhook configuration




  - Add webhook_url and webhook_secret to TenantConfig
  - Create POST /v1/webhooks/config endpoint
  - Validate webhook URL (HTTPS required)
  - Store webhook configuration per tenant
  - _Requirements: 27.4, 27.9_

- [x] 10.1 Implement webhook delivery


  - Generate webhook payload on verdict.generated event
  - Calculate HMAC-SHA256 signature
  - POST payload to configured webhook URL
  - Implement exponential backoff retry (1s, 2s, 4s, 8s, 16s)
  - Mark as failed after 5 attempts
  - _Requirements: 27.5, 27.6, 27.7_

- [x] 10.2 Implement webhook delivery dashboard


  - Track delivery success rate per tenant
  - Show recent failures with retry count
  - Provide manual retry capability
  - Display webhook configuration status
  - _Requirements: 27.8_

- [x] 10.3 Write webhook tests



  - Test HMAC signature generation and verification
  - Test retry logic with exponential backoff
  - Test failure threshold (5 attempts)
  - Test delivery status tracking
  - _Requirements: 27.4-27.9_

---

## Phase 11: Security Hardening (Week 6)

- [x] 11. Implement input sanitization




  - Add Unicode NFC normalization for all text inputs
  - Implement HTML sanitization for overlay content (CSP-safe)
  - Remove script tags, event handlers, javascript: URLs
  - Validate and limit input lengths (10KB max per field)
  - _Requirements: 18.1, 18.2_

- [x] 11.1 Implement SSRF defense


  - Create MCP URL validator with host allowlist
  - Block private IP ranges (except localhost in dev)
  - Enforce HTTPS for production MCP calls
  - Add timeout and size limits on MCP responses
  - _Requirements: 18.3_

- [x] 11.2 Implement secrets management


  - Generate per-tenant encryption keys (AES-256)
  - Encrypt PII at rest in database
  - Store webhook secrets securely
  - Implement key rotation policy
  - Document rotation procedures
  - _Requirements: 22.3_

- [x] 11.3 Implement rate limiting


  - Add Redis-based rate limiter
  - Enforce 100 req/min per API key
  - Enforce 10 req/s burst per IP
  - Return 429 with Retry-After header
  - _Requirements: 18.4, 25.5_

- [x] 11.4 Write security tests



  - Test input sanitization edge cases
  - Test SSRF prevention
  - Test rate limiting enforcement
  - Test PII encryption at rest
  - Test webhook signature verification
  - _Requirements: 18.1-18.10_

---

## Phase 12: CI/CD Pipeline (Week 6)

- [x] 12. Implement CI pipeline gates




  - Add JSON schema validation for policies and rule packs
  - Add SHA-256 signature verification for rule packs
  - Add fixture regression suite runner
  - Add latency budget enforcement check
  - Add test coverage check (≥80% for transforms)
  - Add transform documentation check (test file + README)
  - Add SAST security scanning
  - _Requirements: 26.1-26.8_

- [x] 12.1 Create GitHub Actions workflow


  - Set up test job (unit + integration)
  - Set up fixture job (regression suite)
  - Set up performance job (latency budgets)
  - Set up security job (SAST scanning)
  - Set up documentation job (completeness check)
  - Block merge on any failure
  - _Requirements: 26.1-26.8_

- [x] 12.2 Update hook scripts


  - Ensure hooks call CI validation scripts
  - Add pre-commit hook for local validation
  - Add pre-push hook for full test suite
  - Document hook installation in README
  - _Requirements: 14.1-14.5_

- [x] 12.3 Write CI/CD tests



  - Test schema validation catches invalid policies
  - Test signature verification catches tampered packs
  - Test fixture regression detects changes
  - Test budget enforcement fails on violations
  - _Requirements: 26.1-26.8_

---

## Phase 13: Admin Console Frontend (Week 7-8)

- [-] 13. Set up Admin Console frontend (React + Vite)


  - Initialize Vite project with TypeScript
  - Set up React Router for navigation
  - Import design tokens from design-tokens.css
  - Import component styles from components.css
  - Configure dark theme as default
  - _Requirements: 24.1_

- [x] 13.1 Implement Dashboard page


  - Create KPI cards (audits processed, flagged items, avg time)
  - Create recent audits table with sorting
  - Add degraded mode banner (conditional rendering)
  - Implement 30-second auto-refresh
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13.2 Implement Profiles & Routes editor


  - List all profiles with expandable routes
  - Add drag-and-drop for transform reordering
  - Add input fields for threshold editing
  - Trigger Augment-Lite modal on risky edits
  - Show diff preview before save
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13.3 Implement Augment-Lite modal


  - Create modal with 4C fields (Context, Constraints, Self-Critique, Confirm)
  - Add character count (min 20 per field)
  - Add autonomy slider with risk-based cap
  - Show risk level indicator
  - Validate all fields before allowing save
  - _Requirements: 7.4, 7.5_

- [x] 13.4 Implement Rule Packs editor


  - List all rule packs with version numbers
  - Add text editor for pack content
  - Show diff view between versions
  - Add "Test against fixtures" button
  - Show test results before allowing save
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13.5 Implement Fixtures Runner page


  - List available fixtures with checkboxes
  - Add "Run Selected" button
  - Show progress indicator during execution
  - Display results table (flags, warnings, errors)
  - Show p50/p95 latency metrics
  - Link to generated audit pack
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13.6 Implement Audit Viewer page



  - Load audit record by audit_id
  - Show before/after content side-by-side
  - Highlight differences
  - Display reasons with transform names and sources
  - Show performance metrics (total + per-transform)
  - Add download buttons (JSONL, Markdown)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 13.7 Implement accessibility features

  - Add keyboard navigation (Tab, Enter, ESC)
  - Add visible focus indicators (≥2px)
  - Add ARIA labels for all interactive elements
  - Ensure 4.5:1 contrast ratios
  - Test with screen reader
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 24.2, 24.3_


- [x] 13.8 Write Admin Console frontend tests



  - Test dashboard rendering and auto-refresh
  - Test profile editor drag-and-drop
  - Test Augment-Lite modal validation
  - Test rule pack diff view
  - Test fixtures runner execution
  - Test audit viewer display
  - Test keyboard navigation
  - _Requirements: 6.1-6.5, 7.1-7.5, 8.1-8.5, 9.1-9.5, 10.1-10.5, 15.1-15.5_

---

## Phase 14: Documentation and Deployment (Week 8)

- [ ] 14. Update documentation
  - Update README.md with setup instructions
  - Document API endpoints with examples
  - Document webhook integration
  - Document degraded mode policies
  - Document CI/CD pipeline
  - Add troubleshooting guide
  - _Requirements: 19.5, 28.5_

- [ ] 14.1 Create deployment documentation
  - Document Docker Compose setup
  - Document environment variables
  - Document database migrations
  - Document backup and restore procedures
  - Document monitoring setup
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5_

- [ ] 14.2 Create operations runbook
  - Document common issues and solutions
  - Document rollback procedures
  - Document scaling guidelines
  - Document security incident response
  - Document data retention and purge procedures
  - _Requirements: 22.7, 22.8, 28.3_

- [ ] 14.3 Create video tutorials

  - Record Admin Console walkthrough
  - Record ClaimLens Go installation and usage
  - Record policy editing with Augment-Lite
  - Record webhook configuration
  - _Requirements: 19.5_

---

## Validation Checklist

After completing all tasks, run the following validation:

```bash
# 1. Install dependencies
pnpm install

# 2. Run all tests
pnpm test                          # Unit tests (≥80% coverage)
pnpm test:fixtures                 # Fixture regression
pnpm test:perf                     # Performance measurement
pnpm check:budgets                 # Latency budget enforcement

# 3. Run CI gates
pnpm hooks:precommit               # Pre-commit validation
pnpm hooks:prverify                # PR verification
pnpm hooks:release                 # Release gate

# 4. Validate OpenAPI spec
npx @redocly/cli lint docs/openapi.yaml

# 5. Run E2E tests
npx playwright test

# 6. Start services
pnpm mcp:dev                       # MCP mock services
docker compose up                  # Full stack

# 7. Manual testing
# - Test Admin Console in browser
# - Test ClaimLens Go extension on fixture sites
# - Test API endpoints with Postman/curl
# - Test webhook delivery
# - Test degraded mode scenarios
```

---

## Notes

- All tasks reference specific requirements for traceability
- Optional tasks (marked with `*`) can be deferred but are recommended
- Each phase builds on previous phases - maintain order
- Estimated timeline: 8 weeks for full implementation
- Team size: 2-3 developers recommended
- Code review required before merging each phase
