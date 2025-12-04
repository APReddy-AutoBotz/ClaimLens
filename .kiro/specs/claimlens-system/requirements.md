# Requirements Document — ClaimLens System

## Introduction

ClaimLens is a food content validation and compliance system that prevents misleading claims and allergen incidents through automated analysis. The system consists of two primary products: ClaimLens MenuShield (B2B pre-publish gate) and ClaimLens Go (B2C browser overlay), supported by an Admin Console for policy management and an extensible transform pipeline.

## Glossary

- **System**: The ClaimLens platform including MenuShield API, ClaimLens Go extension, Admin Console, and transform pipeline
- **ClaimLens MenuShield**: B2B pre-publish gate service for cloud kitchens and food marketplaces
- **ClaimLens Go**: B2C browser extension providing real-time content overlay on food delivery websites
- **Transform**: A pure function that analyzes or modifies food content (e.g., rewrite.disclaimer, redact.pii)
- **Profile**: A configuration preset defining which transforms to apply (menushield_in, claimlens_go)
- **Route**: An API endpoint that processes specific content analysis requests
- **Audit Pack**: A generated report containing before/after content, flags, reasons, and performance metrics
- **Verdict**: The system decision (allow, modify, block) with associated reasons and changes
- **Badge**: A visual indicator overlaid on content showing allergens, warnings, or compliance status
- **Augment-Lite**: A policy editing interface with built-in critique and validation gates
- **MCP Service**: External service providing specialized capabilities (OCR, unit conversion, recalls, alternatives)
- **Degraded Mode**: System state when non-critical external services are unavailable
- **Policy DSL**: Domain-specific language for defining content analysis rules in policies.yaml
- **Rule Pack**: Versioned collection of rules (banned claims, allergens, disclaimers) with SHA-256 signatures
- **Tenant**: Isolated organizational unit with separate data, logs, audits, and configurations
- **Correlation ID**: Unique identifier linking API requests, logs, and audit records
- **Error Budget**: Allowed percentage of failed requests before triggering alerts or rollbacks
- **Claim Category**: Classification of marketing claims (health, nutrition, marketing) mapped to regulatory templates
- **FSSAI**: Food Safety and Standards Authority of India
- **FDA**: Food and Drug Administration (United States)
- **FSA**: Food Standards Agency (United Kingdom)
- **WCAG AA**: Web Content Accessibility Guidelines Level AA (4.5:1 contrast ratio minimum)
- **CSP**: Content Security Policy for browser security
- **SSRF**: Server-Side Request Forgery attack vector
- **NDJSON**: Newline-Delimited JSON format for streaming data

## Requirements

### Requirement 1: Content Analysis and Validation

**User Story:** As a cloud kitchen operator, I want to validate my menu content before publishing so that I avoid regulatory issues and customer complaints.

#### Acceptance Criteria

1. WHEN the System receives a menu item via POST /v1/menu/feed, THE System SHALL apply all transforms defined in the menushield_in profile
2. WHEN a transform detects a banned claim, THE System SHALL flag the content with the specific phrase and suggest a compliant alternative
3. WHEN a transform detects an allergen in ingredients, THE System SHALL add an allergen badge with the specific allergen name
4. WHEN content analysis completes, THE System SHALL return a Verdict containing the decision (allow, modify, block), all changes, reasons with sources, and a unique audit_id
5. THE System SHALL complete content analysis within 150 milliseconds at p95 latency for the /menu/feed route

### Requirement 2: Disclaimer Management and Claim Classification

**User Story:** As a compliance officer, I want locale-appropriate disclaimers automatically added to health claims so that we meet regional regulatory requirements.

#### Acceptance Criteria

1. WHEN the System detects a banned claim phrase in content, THE System SHALL classify it into a claim category (health, nutrition, marketing)
2. WHEN the System classifies a claim, THE System SHALL map the claim category to the correct regulator template (FSSAI, FDA, FSA) based on the specified locale
3. WHERE the locale is en-IN, THE System SHALL use the FSSAI disclaimer template for the detected claim category
4. WHERE the locale is en-US, THE System SHALL use the FDA disclaimer template for the detected claim category
5. WHERE the locale is en-GB, THE System SHALL use the FSA disclaimer template for the detected claim category
6. WHERE the locale is not recognized, THE System SHALL fall back to en-IN with generic disclaimer and log the unknown locale
7. THE System SHALL normalize nutrition units per locale (kcal/kJ for energy, g/oz for weight) with explicit conversion rules documented
8. WHEN the System appends a disclaimer, THE System SHALL preserve original text spacing and formatting

### Requirement 3: PII Protection

**User Story:** As a data privacy officer, I want personally identifiable information automatically redacted from content and logs so that we comply with privacy regulations.

#### Acceptance Criteria

1. THE System SHALL detect and redact email addresses using a conservative pattern matching algorithm
2. THE System SHALL detect and redact Indian phone numbers in formats including +91 prefix and 10-digit numbers starting with 6-9
3. WHEN the System detects the context words "pin code", "pincode", "postal code", or "zip code" followed by 6 digits, THE System SHALL redact the 6-digit number
4. WHEN the System redacts PII, THE System SHALL replace each instance with a labeled placeholder ([EMAIL_REDACTED], [PHONE_REDACTED], [PINCODE_REDACTED])
5. WHEN the System completes PII redaction, THE System SHALL return counts of each PII type detected

### Requirement 4: Audit Trail Generation

**User Story:** As a quality assurance manager, I want detailed audit reports of all content modifications so that I can review decisions and demonstrate compliance.

#### Acceptance Criteria

1. WHEN the System processes content, THE System SHALL generate an audit record containing timestamp, profile, route, item_id, transforms applied, verdict, and latency_ms
2. THE System SHALL save audit records in both JSONL format (one record per line) and Markdown format (human-readable summary)
3. THE System SHALL include before and after content snapshots in audit records
4. THE System SHALL include all reasons with transform names and source citations in audit records
5. THE System SHALL make audit records retrievable via unique audit_id for 90 days minimum

### Requirement 5: Performance Monitoring and SLOs

**User Story:** As a DevOps engineer, I want real-time performance metrics and latency budget enforcement so that I can maintain system SLOs.

#### Acceptance Criteria

1. THE System SHALL measure each transform execution time using high-resolution timing (nanosecond precision)
2. THE System SHALL calculate p50 and p95 latency percentiles for each transform
3. THE System SHALL save performance results to dist/perf-results.json after each measurement run
4. WHEN checking latency budgets, THE System SHALL parse policies.yaml and compare actual p95 values against defined latency_budget_ms thresholds
5. IF any route exceeds its latency budget, THEN THE System SHALL fail the budget check with exit code 1
6. THE System SHALL define route SLOs including availability target (99.5%), latency p95 target (150ms for /menu/feed, 100ms for /menu/validate, 120ms for /web/ingest, 80ms for /web/overlay)
7. THE System SHALL implement error budget policy allowing 0.5% failed requests per 30-day window before triggering alerts
8. THE System SHALL define alert thresholds at 50% error budget consumed (warning) and 80% error budget consumed (critical)
9. THE System SHALL enable log sampling when QPS exceeds 1000 requests per second, sampling at 10% rate
10. THE System SHALL include structured log fields: {ts, tenant, request_id, profile, route, transform, decision, reason, duration_ms}

### Requirement 6: Admin Console - Dashboard

**User Story:** As an administrator, I want a dashboard showing system health and recent activity so that I can monitor operations at a glance.

#### Acceptance Criteria

1. THE Admin Console SHALL display KPI cards showing total audits processed, flagged items count, and average processing time
2. THE Admin Console SHALL display a table of recent audits with columns for timestamp, item name, verdict, and audit_id link
3. WHEN a non-critical MCP service is unavailable, THE Admin Console SHALL display a degraded mode banner at the top of the dashboard
4. THE Admin Console SHALL refresh dashboard data every 30 seconds without full page reload
5. THE Admin Console SHALL maintain WCAG AA contrast ratios (minimum 4.5:1) for all text and interactive elements

### Requirement 7: Admin Console - Profile and Route Editor

**User Story:** As a policy manager, I want to configure transform pipelines and thresholds through a visual interface so that I can adjust policies without editing YAML files.

#### Acceptance Criteria

1. THE Admin Console SHALL display all profiles with their associated routes in an editable list
2. THE Admin Console SHALL allow drag-and-drop reordering of transforms within a route
3. THE Admin Console SHALL provide input fields for editing threshold values (sugar_g_per_100g_red, sodium_mg_red, latency_budget_ms)
4. WHEN a user attempts a high-risk policy edit (changing transform order or critical thresholds), THE Admin Console SHALL display an Augment-Lite modal requiring a written explanation
5. WHEN a user saves profile changes, THE Admin Console SHALL write the updated configuration to .kiro/specs/policies.yaml

### Requirement 8: Admin Console - Rule Packs Editor

**User Story:** As a content policy specialist, I want to edit banned claims, allergens, and disclaimers with version control so that I can maintain compliance rules safely.

#### Acceptance Criteria

1. THE Admin Console SHALL display all rule packs (banned claims, allergens, disclaimers) in editable text areas
2. THE Admin Console SHALL maintain version history for each rule pack with timestamps and user attribution
3. THE Admin Console SHALL provide a diff view showing changes between rule pack versions
4. THE Admin Console SHALL allow testing rule pack changes against fixture data before saving
5. WHEN rule pack tests fail, THE Admin Console SHALL prevent saving and display specific failure reasons

### Requirement 9: Admin Console - Fixtures Runner

**User Story:** As a QA tester, I want to run transform pipelines against test fixtures so that I can validate policy changes before deployment.

#### Acceptance Criteria

1. THE Admin Console SHALL display all available menu and site fixtures in a selectable list
2. WHEN a user selects fixtures and clicks "Run", THE Admin Console SHALL execute the transform pipeline and display results within 5 seconds
3. THE Admin Console SHALL display flags, warnings, and errors for each processed fixture item
4. THE Admin Console SHALL display p50 and p95 latency metrics for the fixture run
5. THE Admin Console SHALL provide a link to the generated audit pack for detailed review

### Requirement 10: Admin Console - Audit Viewer

**User Story:** As a compliance auditor, I want to view detailed audit reports with before/after comparisons so that I can verify system decisions.

#### Acceptance Criteria

1. WHEN a user navigates to /audits/:id, THE Admin Console SHALL load and display the audit record matching the audit_id
2. THE Admin Console SHALL display before and after content side-by-side with differences highlighted
3. THE Admin Console SHALL display all reasons with transform names, explanations, and source links
4. THE Admin Console SHALL display performance metrics including total latency and per-transform timing
5. THE Admin Console SHALL provide download buttons for JSONL and Markdown formats of the audit report

### Requirement 11: Browser Extension - Content Overlay Performance

**User Story:** As a consumer with food allergies, I want real-time warnings overlaid on food delivery websites so that I can make safe ordering decisions.

#### Acceptance Criteria

1. WHEN the ClaimLens Go extension loads on a food delivery website, THE extension SHALL complete first-viewport scan within 200 milliseconds for up to 20 menu items
2. WHEN the page contains more than 20 items, THE extension SHALL proceed with full-page scan incrementally using MutationObserver
3. THE extension SHALL not block the main thread for more than 50 milliseconds during any single processing cycle
4. WHERE available, THE extension SHALL use requestIdleCallback for non-critical processing tasks
5. WHEN the extension detects allergens in menu item content, THE extension SHALL overlay a badge on the item with the allergen name
6. WHEN the extension detects banned claims in menu item content, THE extension SHALL overlay a warning badge on the item
7. WHEN a user clicks a badge, THE extension SHALL display a tooltip with explanation text and source link within 50 milliseconds
8. THE extension SHALL support infinite scroll by detecting new items progressively and applying badges as they appear
9. THE extension SHALL not break existing website functionality or layout
10. THE extension SHALL operate only on user-consented and allowlisted domains

### Requirement 12: Browser Extension - Side Panel

**User Story:** As a health-conscious consumer, I want a side panel showing detailed information about flagged items so that I can understand warnings without cluttering the page.

#### Acceptance Criteria

1. WHEN a user clicks the ClaimLens Go extension icon, THE extension SHALL open a side panel overlaying the right side of the page
2. THE side panel SHALL display a list of all flagged items on the current page with their flags and reasons
3. THE side panel SHALL provide a locale toggle allowing users to switch between en-IN, en-US, and en-GB
4. WHEN a user changes locale, THE side panel SHALL update all disclaimer text within 100 milliseconds
5. WHEN a user presses ESC key, THE side panel SHALL close

### Requirement 13: MCP Service Integration

**User Story:** As a system architect, I want to integrate external services for OCR, unit conversion, recalls, and alternatives so that the system can handle diverse content types.

#### Acceptance Criteria

1. THE System SHALL connect to MCP services defined in .kiro/mcp/registry.json on startup
2. WHEN an MCP service is unavailable, THE System SHALL log the failure and continue processing with local fallbacks
3. THE System SHALL provide health check endpoints for all MCP services at /health
4. THE System SHALL timeout MCP service calls after 500 milliseconds and fall back to local processing
5. WHEN operating in degraded mode, THE System SHALL include a note in audit records indicating which services were unavailable

### Requirement 14: Cross-Platform Hook Execution

**User Story:** As a developer on Windows, I want to run governance hooks without requiring WSL or Git Bash so that I can validate changes before committing.

#### Acceptance Criteria

1. THE System SHALL provide PowerShell scripts (.ps1) for all governance hooks in .kiro/hooks/
2. THE System SHALL provide Node.js wrapper scripts (.mjs) for all governance hooks in scripts/
3. THE System SHALL provide Bash scripts (.sh) for all governance hooks in .kiro/hooks/
4. WHEN a hook fails, THE System SHALL exit with non-zero exit code and display specific failure reasons
5. THE System SHALL document all three execution methods (PowerShell, Node.js, Bash) in README.md

### Requirement 15: Accessibility Compliance

**User Story:** As a user with visual impairments, I want keyboard-navigable interfaces with screen reader support so that I can use ClaimLens products independently.

#### Acceptance Criteria

1. THE Admin Console SHALL make all interactive elements reachable via Tab key navigation
2. THE Admin Console SHALL display visible focus indicators on all focusable elements with minimum 2px outline
3. THE Admin Console SHALL close all modals and tooltips when user presses ESC key
4. THE Admin Console SHALL maintain color contrast ratios of at least 4.5:1 for all text against backgrounds
5. THE ClaimLens Go extension SHALL provide ARIA labels for all badges and interactive overlay elements

### Requirement 16: Internationalization Support

**User Story:** As a product manager expanding to new markets, I want locale-aware content processing so that we can support multiple regions with appropriate regulations.

#### Acceptance Criteria

1. THE System SHALL accept a locale parameter (en-IN, en-US, en-GB) with all API requests
2. THE System SHALL select disclaimer templates based on the provided locale
3. THE System SHALL format numbers and units according to locale conventions
4. THE System SHALL support Unicode text processing for all transforms
5. WHERE locale-specific data is unavailable, THE System SHALL fall back to en-IN defaults

### Requirement 17: Observability and Logging

**User Story:** As a site reliability engineer, I want structured JSON logs with decision reasoning so that I can debug issues and analyze system behavior.

#### Acceptance Criteria

1. THE System SHALL log all transform decisions in JSON format with fields: ts, profile, route, transform, decision, reason, duration_ms
2. THE System SHALL not log any PII in decision logs
3. THE System SHALL retain decision logs for 24 hours minimum
4. THE System SHALL provide log aggregation endpoints for monitoring tools
5. THE System SHALL include correlation IDs linking logs to audit records

### Requirement 18: Security and Rate Limiting

**User Story:** As a security engineer, I want input validation and rate limiting so that the system is protected from abuse and injection attacks.

#### Acceptance Criteria

1. THE System SHALL normalize all text inputs using Unicode NFC normalization before processing through transforms
2. THE System SHALL sanitize HTML content for overlays to be CSP-friendly (no inline scripts, no eval)
3. THE System SHALL defend against SSRF attacks by validating and restricting MCP service URLs to allowlisted hosts
4. THE System SHALL enforce rate limiting of 100 requests per minute per API key with per-IP burst control allowing 10 requests per second
5. THE System SHALL reject requests with payloads exceeding 1MB
6. THE System SHALL validate all JSON inputs against defined schemas (MenuItem, Verdict, AuditRecord, Badge) before processing
7. THE System SHALL not execute any code contained in user-provided content
8. THE System SHALL verify rule pack SHA-256 signatures before loading in production environments
9. THE System SHALL require rule pack signature verification to pass in CI pipeline before merge
10. THE System SHALL log all security violations with severity level and client identifier for audit purposes

### Requirement 19: Documentation Completeness

**User Story:** As a new developer joining the team, I want comprehensive documentation for all transforms so that I can understand and extend the system.

#### Acceptance Criteria

1. THE System SHALL require a test file for every transform in packages/transforms/
2. THE System SHALL require a README mention for every transform
3. WHEN running the release gate hook, THE System SHALL fail if any transform lacks tests or documentation
4. THE System SHALL provide inline code comments explaining transform logic and edge cases
5. THE System SHALL maintain up-to-date API documentation in docs/API_SPEC.md

### Requirement 20: Policy DSL Governance

**User Story:** As a policy administrator, I want versioned and validated policy changes with safe rollout mechanisms so that I can update rules without causing system disruptions.

#### Acceptance Criteria

1. THE System SHALL version all policy files using semantic versioning (MAJOR.MINOR.PATCH format)
2. THE System SHALL validate policy files against JSON schema before saving changes
3. WHEN a user requests a policy change, THE System SHALL provide a dry-run preview showing diffs against selected fixtures before applying
4. THE System SHALL support staged rollout of policy changes at 10%, 50%, and 100% traffic levels
5. WHEN error rate exceeds 5% threshold during staged rollout, THE System SHALL automatically rollback to previous policy version
6. THE System SHALL sign all rule packs with SHA-256 checksums
7. THE System SHALL verify rule pack checksums on load and reject unsigned or tampered packs
8. THE System SHALL log all policy changes with version number, timestamp, user, and change delta
9. THE System SHALL maintain policy version history for minimum 365 days

### Requirement 21: Multi-Tenant Isolation and RBAC

**User Story:** As an enterprise administrator, I want tenant isolation and role-based access control so that multiple organizations can use the system securely.

#### Acceptance Criteria

1. THE System SHALL isolate tenant data including menu items, logs, audits, and configurations in separate namespaces
2. THE System SHALL prevent cross-tenant data access through API, database queries, and file system operations
3. THE System SHALL support three roles: Admin (full access), Editor (packs and policies only), Viewer (read-only access)
4. THE System SHALL enforce role permissions at API gateway level before processing requests
5. THE System SHALL log every configuration change with user identifier, timestamp, and change delta
6. THE System SHALL provide exportable audit trail in CSV format per tenant with all user actions
7. THE System SHALL require multi-factor authentication for Admin role users
8. THE System SHALL automatically expire user sessions after 8 hours of inactivity

### Requirement 22: Privacy Controls and Data Retention

**User Story:** As a privacy officer, I want granular privacy controls and configurable retention so that we comply with data protection regulations.

#### Acceptance Criteria

1. THE ClaimLens Go extension SHALL require explicit user consent before operating on any website
2. THE ClaimLens Go extension SHALL operate only on user-configured allowlisted domains
3. THE System SHALL encrypt PII at rest using AES-256 encryption
4. THE System SHALL redact PII from audit records by default for B2C (ClaimLens Go) operations
5. THE System SHALL disable secure re-identification of redacted PII for B2C operations
6. THE System SHALL allow tenant-configurable retention periods with default 90 days and maximum 365 days
7. THE System SHALL provide automated purge job running daily to delete expired audit records
8. THE System SHALL document purge job schedule, retention policies, and recovery procedures in operations manual
9. THE System SHALL provide data export functionality allowing tenants to download all their data before purge

### Requirement 23: Degraded Mode Policy Matrix

**User Story:** As a reliability engineer, I want explicit degraded mode policies for each service so that the system behaves predictably during outages.

#### Acceptance Criteria

1. THE System SHALL classify each MCP service as Critical or Non-critical in degraded mode policy matrix
2. THE System SHALL mark ocr.label as Non-critical with action: pass-through (skip OCR, use text-only analysis)
3. THE System SHALL mark unit.convert as Non-critical with action: pass-through (use default per-100g assumptions)
4. THE System SHALL mark recall.lookup as Non-critical with action: modify (add generic safety disclaimer)
5. THE System SHALL mark alt.suggester as Non-critical with action: pass-through (flag without suggesting alternatives)
6. WHEN operating in degraded mode, THE Admin Console SHALL display banner with template: "Service [name] unavailable. [Action description]. Audits will note degraded operation."
7. WHEN operating in degraded mode, THE System SHALL include audit note template: "Processed in degraded mode: [service] unavailable, applied [action]"
8. THE System SHALL document degraded mode policies in .kiro/specs/degraded-mode-matrix.yaml

### Requirement 24: Design System Constraints

**User Story:** As a UI developer, I want a consistent design system with accessibility built-in so that I can build compliant interfaces efficiently.

#### Acceptance Criteria

1. THE Admin Console SHALL use design tokens: Indigo #4F46E5, Teal #14B8A6, Amber #F59E0B, Red #EF4444, Emerald #10B981, Ink #0B1220, Cloud #F8FAFC
2. THE Admin Console SHALL enforce WCAG AA contrast ratio of 4.5:1 for all text and interactive elements
3. THE Admin Console SHALL display visible focus rings of minimum 2px width on all focusable elements
4. THE Admin Console SHALL close all modals and tooltips when user presses ESC key
5. THE Admin Console SHALL limit all motion animations to maximum 180 milliseconds duration
6. THE Admin Console SHALL style KPI cards with 16px border radius and consistent padding
7. THE Admin Console SHALL style badges with color-coded backgrounds (warn: Amber, danger: Red, ok: Emerald)
8. THE Admin Console SHALL style tables with sticky headers and alternating row backgrounds for readability
9. THE System SHALL provide visual accessibility checklist in docs/DESIGN_SYSTEM.md documenting token usage and component patterns

### Requirement 25: API Schema Validation and Error Handling

**User Story:** As an API consumer, I want consistent error responses and schema validation so that I can handle failures gracefully.

#### Acceptance Criteria

1. THE System SHALL validate all API requests against JSON schemas for MenuItem, Verdict, AuditRecord, and Badge types
2. THE System SHALL return HTTP 400 Bad Request with machine-readable error code when schema validation fails
3. THE System SHALL return HTTP 401 Unauthorized when API key is missing or invalid
4. THE System SHALL return HTTP 403 Forbidden when user lacks required role permissions
5. THE System SHALL return HTTP 429 Too Many Requests when rate limit is exceeded with Retry-After header
6. THE System SHALL return HTTP 5xx errors with correlation ID and generic error message (no internal details exposed)
7. THE System SHALL require correlation ID header (X-Correlation-ID) on all API requests
8. THE System SHALL echo correlation ID in all API responses and embed in audit records
9. THE System SHALL document error model with status codes, error codes, and example responses in docs/API_SPEC.md

### Requirement 26: CI/CD Pipeline Gates

**User Story:** As a release manager, I want automated quality gates in CI/CD so that only validated changes reach production.

#### Acceptance Criteria

1. THE CI pipeline SHALL validate policy and rule pack files against JSON schemas before allowing merge
2. THE CI pipeline SHALL verify rule pack SHA-256 signatures before allowing merge
3. THE CI pipeline SHALL run fixture regression suite and fail build if any fixture results change unexpectedly
4. THE CI pipeline SHALL enforce latency budget checks and fail build if any route exceeds p95 threshold
5. THE CI pipeline SHALL block merge if any new transform lacks corresponding test file in packages/transforms/__tests__/
6. THE CI pipeline SHALL block merge if any new transform lacks README.md mention
7. THE CI pipeline SHALL run security scanning (SAST) on all code changes
8. THE CI pipeline SHALL require minimum 80% code coverage for new transform code

### Requirement 27: Commercial Features - Export and Webhooks

**User Story:** As an enterprise customer, I want to export cleaned data and receive webhook notifications so that I can integrate ClaimLens with my systems.

#### Acceptance Criteria

1. THE System SHALL provide GET /v1/export/menu.ndjson endpoint returning cleaned menu items in newline-delimited JSON format
2. THE System SHALL scope /v1/export/menu.ndjson responses to requesting tenant only
3. THE System SHALL support pagination for export endpoint with cursor-based navigation
4. THE System SHALL provide webhook configuration per tenant for publish-gate verdicts
5. WHEN a verdict is generated, THE System SHALL POST webhook payload containing verdict (allow/modify/block), item_id, reasons, and audit_id
6. THE System SHALL implement webhook retry logic with exponential backoff (1s, 2s, 4s, 8s, 16s maximum)
7. THE System SHALL mark webhook as failed after 5 retry attempts and log failure for manual review
8. THE System SHALL provide webhook delivery status dashboard showing success rate and recent failures
9. THE System SHALL allow webhook URL configuration with HTTPS requirement and signature verification

### Requirement 28: Deployment and Operations

**User Story:** As a DevOps engineer, I want containerized services and health checks so that I can deploy and monitor ClaimLens reliably.

#### Acceptance Criteria

1. THE System SHALL provide Docker Compose configuration for all MCP services
2. THE System SHALL provide health check endpoints returning 200 OK when services are operational
3. THE System SHALL gracefully handle shutdown signals (SIGTERM, SIGINT) and complete in-flight requests
4. THE System SHALL expose Prometheus-compatible metrics endpoints for monitoring
5. THE System SHALL document deployment procedures in README.md with environment-specific configurations
