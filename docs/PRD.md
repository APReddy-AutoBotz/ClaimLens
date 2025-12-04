# Product Requirements Document — ClaimLens

## 1. Goals

ClaimLens prevents misleading food claims and allergen incidents through automated content analysis and correction.

**Primary Goals:**
- Detect and flag misleading nutritional claims before publication
- Highlight allergens and cross-contamination risks
- Normalize nutrition data across locales and units
- Insert legally compliant disclaimers per jurisdiction

## 2. Personas

**B2B (MenuShield):**
- Cloud kitchen operators publishing menus
- Food marketplace compliance teams
- Restaurant chain content managers

**B2C (ClaimLens Go):**
- Health-conscious consumers browsing food sites
- Users with dietary restrictions or allergies
- Parents checking children's meal options

## 3. User Stories

### 3.1 B2B Pre-Publish Gate (MenuShield)

**Story:** As a cloud kitchen operator, I want to validate my menu before publishing so that I avoid regulatory issues and customer complaints.

**Acceptance Criteria:**
1. System SHALL flag items containing banned claims (e.g., "superfood", "detox")
2. System SHALL highlight allergens present in ingredients
3. System SHALL normalize nutrition units (per 100g standard)
4. System SHALL suggest locale-appropriate disclaimers
5. System SHALL provide audit trail with reasoning for each flag

### 3.2 B2C Content Overlay (ClaimLens Go)

**Story:** As a consumer with allergies, I want real-time warnings on food websites so that I can make safe ordering decisions.

**Acceptance Criteria:**
1. Browser extension SHALL overlay warnings on detected allergens
2. Extension SHALL show "why" explanations with source links
3. Extension SHALL maintain WCAG AA accessibility standards
4. Extension SHALL work without breaking existing site functionality
5. Extension SHALL respect user privacy (no data collection)

## 4. Happy Paths

### 4.1 MenuShield Flow
1. Kitchen uploads menu JSON via API
2. System processes each item through transform pipeline
3. Flags returned with specific reasons and suggested fixes
4. Kitchen reviews and applies corrections
5. Clean menu approved for publication

### 4.2 ClaimLens Go Flow
1. User visits food delivery site
2. Extension scans page content
3. Allergen badges appear on relevant items
4. User clicks badge for detailed explanation
5. User makes informed ordering decision

## 5. Sad Paths

### 5.1 False Positives
- System flags legitimate health claims
- **Mitigation:** Conservative ruleset with manual override capability

### 5.2 Performance Degradation
- API response times exceed 150ms p95
- **Mitigation:** Circuit breakers and graceful degradation

### 5.3 Localization Gaps
- Missing translations for disclaimers
- **Mitigation:** Fallback to English with locale indicator

## 6. Out of Scope (OOS)

- Real-time nutrition calculation from recipes
- Integration with POS systems
- Medical advice or diagnosis
- Regulatory compliance certification

## 7. Enterprise Features (In Scope)

### 7.1 Multi-Tenancy
- Tenant isolation for data, logs, audits, and configurations
- Role-based access control (Admin, Editor, Viewer)
- Per-tenant webhook configuration and data export

### 7.2 Policy Governance
- Semantic versioning for policies
- Staged rollout with automatic rollback
- SHA-256 signed rule packs with verification

### 7.3 Privacy Controls
- Configurable data retention (90-365 days)
- PII encryption at rest
- User consent and domain allowlisting for browser extension

### 7.4 Commercial Integration
- NDJSON export endpoint for cleaned menu data
- Webhook notifications for publish-gate verdicts
- Correlation IDs for request tracing