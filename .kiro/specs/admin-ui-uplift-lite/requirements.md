# Requirements Document: Admin UI Uplift (Lite)

## Introduction

This spec defines a focused upgrade of the ClaimLens Admin (B2B) dashboard from a basic metrics view to a "Decision Cockpit" that enables operators to quickly assess system health, identify risks, and take action. The scope is intentionally limited to high-impact changes that maximize demo value for Kiroween judging.

## Glossary

- **Decision Cockpit**: An at-a-glance operational dashboard showing SLO health, compliance risks, and actionable items
- **Action Queue**: Enhanced audit table with filtering, severity indicators, and quick actions
- **Augment-Lite**: A policy change request flow requiring Context, Constraints, and Critique before submission
- **Sparkline**: A tiny inline chart showing 7-day trend data
- **Filter Bar**: Top-level controls for time range, policy profile, and tenant selection
- **Degraded Mode**: System state where one or more MCP services are unavailable, triggering fallback behavior

## Requirements

### Requirement 1: Filter Bar

**User Story:** As an operator, I want to filter dashboard data by time range and policy profile, so that I can focus on relevant metrics for my current investigation.

#### Acceptance Criteria

1.1. WHEN the dashboard loads THEN the Filter Bar SHALL display at the top with Time Range (24h/7d/30d), Policy Profile selector, and optional Tenant selector

1.2. WHEN a user changes the time range THEN the dashboard SHALL refresh all metrics and sparklines for the selected period

1.3. WHEN degraded mode is active THEN the Filter Bar SHALL display a "Degraded Mode" badge with affected services

1.4. WHEN the dashboard loads THEN the Filter Bar SHALL show the current Policy Pack Version and Last Updated timestamp

1.5. WHEN filter controls receive focus THEN the system SHALL provide visible focus indicators meeting WCAG AA standards

### Requirement 2: SLO + Risk Cards

**User Story:** As an operator, I want to see publish readiness, compliance risk, SLO health, and top violations at a glance, so that I can quickly identify what needs attention.

#### Acceptance Criteria

2.1. WHEN the dashboard displays THEN the system SHALL show four cards: Publish Readiness, Compliance Risk, SLO Health, and Top Violations Today

2.2. WHEN displaying Publish Readiness THEN the system SHALL show status (Ready/Needs Review/Block) with 2-3 driver chips explaining the status

2.3. WHEN displaying Compliance Risk THEN the system SHALL show risk level (Low/Med/High) with top risk drivers

2.4. WHEN displaying SLO Health THEN the system SHALL show p95 latency vs budget, error rate percentage, and circuit breaker state

2.5. WHEN displaying Top Violations THEN the system SHALL show counts by violation type (Banned Claims, Allergens, Recalls, PII)

2.6. WHEN each card renders THEN the system SHALL include a 7-day sparkline showing the trend for the primary metric

2.7. WHEN sparklines render THEN the system SHALL use lightweight SVG without heavy chart libraries

### Requirement 3: Action Queue Table

**User Story:** As an operator, I want to see audit records with severity, tags, and quick actions, so that I can efficiently triage and investigate issues.

#### Acceptance Criteria

3.1. WHEN the Action Queue displays THEN the system SHALL show columns for Severity, Trigger Tags, Policy Profile, Pack Version, Route, Operator, Timestamp, Item Name, Verdict, and Latency

3.2. WHEN displaying Trigger Tags THEN the system SHALL render clickable chips for Banned Claim, Allergen, Recall, and PII

3.3. WHEN a user clicks a tag chip THEN the system SHALL filter the table to show only audits with that tag

3.4. WHEN displaying row actions THEN the system SHALL provide "View Receipts" and "Preview Rewrite" buttons

3.5. WHEN a user clicks "View Receipts" THEN the system SHALL open a drawer showing the audit trail with transform execution details

3.6. WHEN a user clicks "Preview Rewrite" THEN the system SHALL display before/after content comparison

3.7. WHEN the table has multiple rows THEN the system SHALL support bulk selection with a "Bulk Export" action

3.8. WHEN interactive elements receive focus THEN the system SHALL display visible focus indicators with minimum 44px touch targets

### Requirement 4: Augment-Lite Policy Change Flow

**User Story:** As an operator, I want to request policy changes with proper justification, so that changes are documented and reviewed before implementation.

#### Acceptance Criteria

4.1. WHEN a user initiates a policy change THEN the system SHALL display a "Request Policy Change" modal

4.2. WHEN the modal opens THEN the system SHALL require three mandatory fields: Context, Constraints, and Critique

4.3. WHEN all three fields are filled THEN the system SHALL enable the "Submit" button

4.4. WHEN a user submits the request THEN the system SHALL generate a change preview showing affected rules and risk impact

4.5. WHEN displaying the impact preview THEN the system SHALL compute risk from existing policy data or use mocked risk levels

4.6. WHEN a change is submitted THEN the system SHALL record the request in the audit trail with timestamp and operator

4.7. WHEN form fields receive focus THEN the system SHALL provide visible focus indicators and validation feedback

### Requirement 5: Visual Polish and Accessibility

**User Story:** As an operator, I want a premium, accessible interface, so that I can work efficiently regardless of my abilities or preferences.

#### Acceptance Criteria

5.1. WHEN any interactive element receives focus THEN the system SHALL display a visible focus indicator with minimum 2px outline and 4.5:1 contrast ratio

5.2. WHEN displaying text THEN the system SHALL maintain minimum 4.5:1 contrast ratio for normal text and 3:1 for large text

5.3. WHEN rendering interactive targets THEN the system SHALL ensure minimum 44x44px touch target size

5.4. WHEN the dashboard loads THEN the system SHALL use the existing dark-mode design tokens with glassmorphism effects

5.5. WHEN animations occur THEN the system SHALL respect prefers-reduced-motion user preferences

5.6. WHEN displaying data THEN the system SHALL use clear typography hierarchy with appropriate spacing for at-a-glance readability

### Requirement 6: Performance and Data

**User Story:** As an operator, I want the dashboard to load quickly and use existing data contracts, so that the system remains fast and maintainable.

#### Acceptance Criteria

6.1. WHEN the dashboard loads THEN the system SHALL use existing API endpoints without breaking changes

6.2. WHEN new data fields are needed THEN the system SHALL add minimal mocks to the existing API layer

6.3. WHEN rendering sparklines THEN the system SHALL use lightweight SVG without adding heavy chart libraries

6.4. WHEN the dashboard updates THEN the system SHALL maintain sub-200ms render time for metric cards

6.5. WHEN displaying loading states THEN the system SHALL show skeleton loaders that match the final content layout

## Out of Scope

- Full alerts panel (deferred to future iteration)
- Real-time WebSocket updates (using 30s polling)
- Advanced filtering (date ranges, multi-select)
- Export to PDF/Excel (only JSON export)
- Mobile responsive design (desktop-first)
- Multi-language support

## Success Criteria

- Dashboard loads in <2 seconds
- All WCAG AA accessibility checks pass
- Existing tests continue to pass
- New UI behaviors have test coverage
- Demo can be narrated in <3 minutes
- Kiroween vibe is subtle and professional

