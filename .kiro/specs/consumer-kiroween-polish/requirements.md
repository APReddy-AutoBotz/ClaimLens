# Requirements Document

## Introduction

This specification defines the "Kiroween-grade" consumer UI/UX polish pass for ClaimLens Go, the B2C food claim verification app. The goal is to elevate the consumer experience to top-prize hackathon quality with a "Haunted Lens" theme that feels premium, spooky-but-classy, and highly credible through proof-first design.

**Important Product Truth**: ClaimLens evaluates claims, allergens, disclaimers, and recall indicators against policies/packs and user allergen profiles. It is NOT a lab adulteration detector. It provides "policy + evidence checks" and shows receipts. All UI copy must use compliance/safety language, not medical diagnosis language.

## Glossary

- **Trust Score**: A 0-100 numerical rating indicating policy compliance confidence
- **Verdict**: The final recommendation (Allow/Modify/Avoid) based on Trust Score
- **Receipts**: Evidence trail showing which rules fired, matched text, and policy references
- **Evidence Drawer**: Expandable panel showing detailed proof of analysis
- **Haunted Lens Theme**: Dark, premium aesthetic with spectral teal/mint, ember orange, and violet accents
- **Policy Pack**: Collection of rules used to evaluate food claims
- **Transform Chain**: Sequence of analysis steps applied to scanned content

## Requirements

### Requirement 1: Visual Theme - Haunted Lens Premium

**User Story:** As a consumer, I want the app to feel premium and trustworthy with a distinctive dark theme, so that I feel confident in the analysis results.

#### Acceptance Criteria

1. WHILE the app is displayed THEN the system SHALL use a dark foundation (#0B1220) with glassmorphism effects
2. WHEN primary actions are rendered THEN the system SHALL use spectral teal/mint (#14B8A6) as the primary accent color
3. WHEN warnings are displayed THEN the system SHALL use ember orange (#F59E0B) for warning states
4. WHEN policy/admin elements are shown THEN the system SHALL use violet (#8B5CF6) as the accent color
5. WHEN the background is rendered THEN the system SHALL include subtle grain texture and soft fog gradients
6. WHEN interactive elements receive focus THEN the system SHALL display visible focus rings meeting WCAG AA contrast requirements

### Requirement 2: Landing Page Enhancement

**User Story:** As a first-time visitor, I want to immediately understand what ClaimLens does and doesn't do, so that I have accurate expectations.

#### Acceptance Criteria

1. WHEN the landing page loads THEN the system SHALL display "Proof-first checks for risky food claims, allergens, and missing disclaimers — with receipts" as the primary message
2. WHEN the landing page loads THEN the system SHALL display "Start Scanning" as the primary CTA button
3. WHEN the landing page loads THEN the system SHALL display "Try Demo" as the secondary CTA button
4. WHEN the landing page loads THEN the system SHALL display trust anchors: "Processed locally by default", "No account required", "Receipts included"
5. WHEN the landing page loads THEN the system SHALL display a "What we check / What we don't" microcallout section
6. WHEN the "How it works" section is displayed THEN the system SHALL show three steps: Scan → Analyze → Decide with refined visuals

### Requirement 3: Scan Page Flow Enhancement

**User Story:** As a user scanning a product, I want a frictionless and cinematic scanning experience with clear progress feedback, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN the scan page loads THEN the system SHALL display a central dropzone/input area that adapts to the selected scan method
2. WHEN a scan is in progress THEN the system SHALL display progress steps: Extract → Checks → Verdict
3. WHEN a scan encounters an error THEN the system SHALL display specific error messages for: invalid URL, blocked domains, unreadable screenshot, and other failures
4. WHEN the scan page loads THEN the system SHALL display "Processed locally by default. Saved only if you choose."
5. WHEN barcode scanning is selected THEN the system SHALL request camera permission with clear UX and provide fallback options
6. WHEN the spectral scan animation plays THEN the system SHALL respect prefers-reduced-motion settings

### Requirement 4: Results Page - Trust Score Display

**User Story:** As a user viewing results, I want to see a clear, consistent Trust Score with detailed breakdown, so that I understand the analysis.

#### Acceptance Criteria

1. WHEN results are displayed THEN the system SHALL show Trust Score as a number 0-100 with clear "Trust Score" label
2. WHEN results are displayed THEN the system SHALL show a verdict banner with Allow/Modify/Avoid and a one-line reason
3. WHEN the verdict is "Allow" THEN the system SHALL display "Marked safe… for now." as the verdict microcopy
4. WHEN the verdict is "Modify" THEN the system SHALL display "Proceed with caution." as the verdict microcopy
5. WHEN the verdict is "Avoid" THEN the system SHALL display "Do not invite this into your body." as the verdict microcopy
6. WHEN score breakdown is displayed THEN the system SHALL explain point changes (Base score + adjustments)

### Requirement 5: Results Page - Detected Issues

**User Story:** As a user viewing results, I want issues grouped by type with clear explanations, so that I understand what was found.

#### Acceptance Criteria

1. WHEN issues are displayed THEN the system SHALL group them by type: Banned Claims, Allergens, Missing Disclaimers, Weasel Words, Recall Signals
2. WHEN an issue is displayed THEN the system SHALL show: what was detected, why it matters, severity level
3. WHEN an issue has a source THEN the system SHALL display a "View source" link that highlights the matched snippet
4. WHEN user allergens are detected THEN the system SHALL display a prominent allergen alert banner
5. WHEN no issues are found THEN the system SHALL display a positive confirmation message

### Requirement 6: Results Page - Evidence Drawer (Receipts)

**User Story:** As a user who wants proof, I want to see detailed evidence of the analysis, so that I can verify the findings.

#### Acceptance Criteria

1. WHEN the receipts section is displayed THEN the system SHALL show "No tricks. Just proof." as the header
2. WHEN receipts are expanded THEN the system SHALL show which rules fired with plain English descriptions
3. WHEN receipts are expanded THEN the system SHALL show the exact matched text with highlighting
4. WHEN receipts are expanded THEN the system SHALL show pack/policy references in non-legal plain English
5. WHEN "Pro mode" is enabled THEN the system SHALL show transform chain steps with durations
6. WHEN receipts are collapsed THEN the system SHALL show a summary count of checks performed

### Requirement 7: Results Page - Safer Alternatives

**User Story:** As a user who found issues, I want to see safer product alternatives, so that I can make better choices.

#### Acceptance Criteria

1. WHEN alternatives are displayed THEN the system SHALL show the safety note: "Suggestions may not match all preferences… Always check labels."
2. WHEN alternatives are displayed THEN the system SHALL provide personalization toggles: "Respect my allergens", "Vegetarian/Vegan/No added sugar"
3. WHEN an alternative is shown THEN the system SHALL explain why it's better with "key differences" and "what changed score"
4. WHEN no alternatives are available THEN the system SHALL display a helpful message explaining why

### Requirement 8: Share Functionality - Proof Card

**User Story:** As a user who wants to share results, I want to generate a shareable proof card, so that I can inform others.

#### Acceptance Criteria

1. WHEN share is triggered THEN the system SHALL generate a lightweight "Proof Card" image
2. WHEN the proof card is generated THEN the system SHALL include: verdict, score, top 2 reasons, QR code to receipts
3. WHEN native share is available THEN the system SHALL use the Web Share API
4. WHEN native share is unavailable THEN the system SHALL copy the share URL to clipboard

### Requirement 9: History and Settings Enhancement

**User Story:** As a returning user, I want to manage my scan history and preferences, so that I can personalize my experience.

#### Acceptance Criteria

1. WHEN history page loads THEN the system SHALL allow filtering by verdict, category, and date
2. WHEN a history item is displayed THEN the system SHALL provide a quick re-scan action
3. WHEN settings page loads THEN the system SHALL display allergen profile configuration
4. WHEN settings page loads THEN the system SHALL display locale/jurisdiction selection
5. WHEN settings page loads THEN the system SHALL display privacy-save toggle
6. WHEN settings page loads THEN the system SHALL display reduced motion toggle

### Requirement 10: Accessibility and Performance

**User Story:** As a user with accessibility needs, I want the app to be fully accessible and performant, so that I can use it effectively.

#### Acceptance Criteria

1. WHEN any interactive element is focused THEN the system SHALL display a visible focus indicator meeting WCAG AA requirements
2. WHEN animations are displayed THEN the system SHALL respect prefers-reduced-motion settings
3. WHEN the app loads THEN the system SHALL meet performance budgets for mobile devices
4. WHEN color is used to convey information THEN the system SHALL provide additional non-color indicators
5. WHEN text is displayed THEN the system SHALL maintain minimum 4.5:1 contrast ratio for body text
