# Requirements Document

## Introduction

This specification defines targeted enhancements to complete the ClaimLens B2C consumer app and Admin dashboard for Kiroween judging. These are final polish items that address specific UX gaps not covered in previous specs: real product name display, premium visual depth, and robust demo data.

## Glossary

- **Product Identity**: Structured information about a scanned item including name, brand, category, and source type
- **Source Type**: The method used to scan (url, screenshot, barcode, text)
- **Demo Mode**: Client-side simulation mode with believable seed data
- **Glass Depth**: Visual layering effect using glassmorphism with consistent borders and shadows
- **Ghost Light**: Subtle accent glow effect using teal/violet colors
- **Mist Gradient**: Very light, non-distracting background gradient effect

## Requirements

### Requirement 1: Real Product Names in B2C

**User Story:** As a consumer viewing my scan history or results, I want to see the actual product name I scanned, so that I can quickly identify items.

#### Acceptance Criteria

1. WHEN a scan result is created THEN the system SHALL capture a productIdentity object with name, brand, category, sourceType, and sourceLabel
2. WHEN the History page displays scan items THEN the system SHALL show the product name instead of "Scanned Product"
3. WHEN the Results page displays analysis THEN the system SHALL show a Product Header with product name, brand/category, and source chip
4. WHEN a product name is missing THEN the system SHALL display "Unknown Item" with a Rename action
5. WHEN a user renames a history item THEN the system SHALL update only the client-side history entry
6. WHEN demo scans are generated THEN the system SHALL populate meaningful product names not placeholders

### Requirement 2: Premium Visual Depth in B2C

**User Story:** As a consumer using the app, I want a polished, premium feel with subtle atmospheric effects, so that the app feels trustworthy and high-quality.

#### Acceptance Criteria

1. WHEN glass surfaces are rendered THEN the system SHALL use consistent border alpha and shadow stacking for depth
2. WHEN interactive elements are displayed THEN the system SHALL apply subtle ghost-light accent glow in teal or violet
3. WHEN the background is rendered THEN the system SHALL include an optional faint mist gradient that is non-distracting
4. WHEN warnings are displayed THEN the system SHALL use restrained ember accent only for Avoid/Caution states
5. WHEN any visual effects are applied THEN the system SHALL maintain WCAG AA contrast ratios
6. WHEN animations or effects are displayed THEN the system SHALL respect prefers-reduced-motion settings

### Requirement 3: Robust Demo Data in Admin

**User Story:** As an admin user in demo mode, I want dropdowns with multiple realistic options and pages that never render blank, so that I can explore all features.

#### Acceptance Criteria

1. WHEN the admin dashboard loads in demo mode THEN the system SHALL seed multiple tenant options: tenant_1, tenant_2, tenant_3
2. WHEN the admin dashboard loads in demo mode THEN the system SHALL seed multiple policy profile options: Default, Strict, Permissive
3. WHEN a filter is selected THEN the system SHALL update the Action Queue with client-side filtering
4. WHEN any admin page loads THEN the system SHALL display a title, one-line description, and either demo rows OR an empty state
5. WHEN an empty state is displayed THEN the system SHALL show "No data yet" with a CTA button
6. WHEN "Run Demo Audit" is triggered THEN the system SHALL populate the Action Queue with named items and varied verdicts
7. WHEN the Action Queue is populated THEN the system SHALL include items with allow, modify, and avoid verdicts for visual variety

### Requirement 4: Error Boundaries in Admin

**User Story:** As an admin user, I want pages to gracefully handle errors and never show blank screens, so that I can always navigate and recover.

#### Acceptance Criteria

1. WHEN a route-level error occurs THEN the system SHALL display an error boundary with a helpful message
2. WHEN an error boundary is displayed THEN the system SHALL provide a "Return to Dashboard" action
3. WHEN a page has no data THEN the system SHALL display an empty state instead of a blank screen
4. WHEN an empty state is displayed THEN the system SHALL include a relevant CTA to populate data
