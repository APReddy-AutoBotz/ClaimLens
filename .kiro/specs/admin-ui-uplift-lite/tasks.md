# Implementation Plan: Admin UI Uplift (Lite)

## Task List

- [x] 1. Set up enhanced data types and API mocks






  - Create enhanced TypeScript interfaces for new dashboard metrics
  - Add mock data generation for sparklines, SLO health, compliance risk
  - Update API layer to return enhanced metrics
  - _Requirements: 6.1, 6.2_

- [x] 2. Create Sparkline component







  - Implement lightweight SVG sparkline with 7 data points
  - Add smooth curve rendering using quadratic bezier
  - Include gradient fill and stroke
  - Add accessibility label with trend description
  - _Requirements: 2.6, 2.7_

- [x] 2.1 Write unit tests for Sparkline








  - Test data normalization
  - Test SVG path generation
  - Test accessibility labels
  - _Requirements: 2.6, 2.7_

- [x] 3. Create FilterBar component




  - Implement time range selector (24h/7d/30d)
  - Implement policy profile selector
  - Add optional tenant selector
  - Display policy pack version and last updated
  - Show degraded mode badge when applicable
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 3.1 Write unit tests for FilterBar





  - Test time range selection
  - Test profile selection
  - Test degraded mode badge display
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 4. Create Decision Cockpit cards




  - Create base CockpitCard component with shared structure
  - Implement PublishReadinessCard with status and drivers
  - Implement ComplianceRiskCard with risk level and drivers
  - Implement SLOHealthCard with latency, error rate, circuit breaker
  - Implement TopViolationsCard with violation counts
  - Integrate Sparkline into each card
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4.1 Write unit tests for Cockpit cards





  - Test status rendering
  - Test driver chips display
  - Test sparkline integration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Enhance Action Queue table




  - Add Severity column with icon indicators
  - Add Tag Chips column with clickable filters
  - Add Policy Profile, Pack Version, Route, Operator columns
  - Implement tag filtering logic
  - Add row actions: View Receipts, Preview Rewrite
  - Add bulk selection and bulk export
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5.1 Write unit tests for Action Queue






  - Test tag filtering
  - Test bulk selection
  - Test row action buttons
  - _Requirements: 3.2, 3.3, 3.7_

- [x] 6. Create Policy Change Modal




  - Implement modal with three required fields: Context, Constraints, Critique
  - Add character counters and validation
  - Implement impact preview panel
  - Add submit button with validation state
  - Record change request in audit trail
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_


- [x] 6.1 Write unit tests for Policy Change Modal





  - Test form validation
  - Test character counting
  - Test submit button enable/disable
  - _Requirements: 4.2, 4.3, 4.7_

- [x] 7. Update Dashboard page




  - Replace KPI cards with Decision Cockpit
  - Add FilterBar at top
  - Replace Recent Audits with Action Queue
  - Wire up filter state management
  - Implement data fetching with filters
  - Add loading and error states
  - _Requirements: 1.2, 6.1, 6.4_

- [x] 7.1 Write integration tests for Dashboard





  - Test filter changes trigger data refresh
  - Test loading states
  - Test error states
  - _Requirements: 1.2, 6.4_

- [x] 8. Apply visual polish and accessibility




  - Update design tokens if needed
  - Ensure all focus indicators are visible (2px teal, 2px offset)
  - Verify text contrast meets WCAG AA (4.5:1)
  - Ensure touch targets are minimum 44x44px
  - Add prefers-reduced-motion support
  - Improve typography hierarchy and spacing
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 8.1 Run accessibility tests





  - Test keyboard navigation
  - Test screen reader announcements
  - Test focus indicators
  - Test color contrast
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 9. Add Receipts drawer component




  - Create drawer component for audit trail display
  - Show transform execution details
  - Display before/after content
  - Add close button and ESC key support
  - _Requirements: 3.5_

- [x] 10. Add Preview Rewrite modal






  - Create modal for before/after comparison
  - Display original and modified content side-by-side
  - Highlight changes
  - Add close button
  - _Requirements: 3.6_

- [x] 11. Final checkpoint - Ensure all tests pass




  - Run full test suite
  - Fix any failing tests
  - Verify no regressions in existing functionality
  - _Requirements: All_

## Implementation Notes

### Execution Order
1. Start with data types and mocks (Task 1)
2. Build reusable components (Tasks 2-3)
3. Build feature components (Tasks 4-6)
4. Integrate into Dashboard (Task 7)
5. Polish and accessibility (Task 8)
6. Add supporting features (Tasks 9-10)
7. Final testing (Task 11)

### Testing Strategy
- Unit tests for individual components
- Integration tests for Dashboard page
- Accessibility tests for all interactive elements
- Visual regression tests (manual review)

### Performance Targets
- Dashboard load: <2 seconds
- Filter change: <500ms
- Sparkline render: <50ms
- Table filter: <100ms (client-side)

### Accessibility Targets
- WCAG AA compliance
- Keyboard navigation for all features
- Screen reader support
- Visible focus indicators
- Minimum 44x44px touch targets

### Mock Data Strategy
- Generate realistic sparkline data (7 points)
- Use existing audit records with enhanced fields
- Compute risk scores from existing data where possible
- Mock only what's strictly necessary

### Before vs After Checklist

**Before (Current State)**:
- [ ] Basic KPI cards (Total Audits, Flagged Items, Avg Time, Status)
- [ ] Simple Recent Audits table (Timestamp, Name, Verdict, Latency, Actions)
- [ ] No filtering capabilities
- [ ] No trend visualization
- [ ] No risk assessment
- [ ] No policy change workflow
- [ ] Basic styling

**After (Decision Cockpit)**:
- [ ] Filter Bar with Time Range, Policy Profile, Tenant, Pack Version, Degraded Mode badge
- [ ] Decision Cockpit with 4 cards: Publish Readiness, Compliance Risk, SLO Health, Top Violations
- [ ] 7-day sparklines on all cards
- [ ] Action Queue with Severity, Tags, Profile, Pack Version, Route, Operator
- [ ] Clickable tag filters
- [ ] Row actions: View Receipts, Preview Rewrite
- [ ] Bulk selection and export
- [ ] Augment-Lite Policy Change modal with Context/Constraints/Critique
- [ ] Impact preview for policy changes
- [ ] Premium glassmorphism styling
- [ ] Full WCAG AA accessibility
- [ ] Subtle Kiroween vibe in microcopy

### Demo Narration (3 minutes)

**Minute 1: Decision Cockpit**
- "The dashboard is now a Decision Cockpit. At a glance, I see Publish Readiness is 'Needs Review' with 3 items flagged."
- "Compliance Risk is Medium with 12 banned claims as the top driver."
- "SLO Health shows p95 latency at 245ms, well within our 300ms budget."
- "Each card has a 7-day sparkline showing trends - violations are decreasing."

**Minute 2: Action Queue**
- "The Action Queue replaces the basic audit table. I can filter by tags - let me click 'Banned Claim'."
- "Now I see only audits with banned claims. Each row shows severity, policy profile, pack version."
- "I can click 'View Receipts' to see the full audit trail, or 'Preview Rewrite' to see what changed."
- "Bulk selection lets me export multiple audits for offline analysis."

**Minute 3: Augment-Lite**
- "When I need to change a policy, I click 'Request Policy Change'."
- "The Augment-Lite flow requires Context, Constraints, and Critique - forcing me to think through the change."
- "As I type, I see an impact preview showing affected rules and risk level."
- "When I submit, it's logged in the audit trail with full justification."

