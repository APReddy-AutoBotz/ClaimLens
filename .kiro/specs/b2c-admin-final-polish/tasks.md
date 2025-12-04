# Implementation Plan

## Priority Order
1. B2C Product Names (highest user impact)
2. Admin Demo Data & Empty States (critical for demo)
3. B2C Visual Polish (final touches)

---

- [x] 1. B2C: Product Identity Foundation






  - [x] 1.1 Add ProductIdentity interface to types

    - Define interface with name, brand, category, sourceType, sourceLabel
    - Update ScanResult interface to include productIdentity
    - _Requirements: 1.1_

  - [x] 1.2 Update scan result generation to include product names


    - Modify demo scan data to use realistic product names
    - Ensure all scan methods (URL, screenshot, barcode, text) capture names
    - Add fallback to "Unknown Item" when name unavailable
    - _Requirements: 1.6_


  - [x] 1.3 Write property test for product identity presence

    - **Property 1: Product Identity Presence**
    - **Validates: Requirements 1.1**

---

- [x] 2. B2C: Product Header Component






  - [x] 2.1 Create ProductHeader component


    - Display large product name
    - Show small brand/category (if available)
    - Add source chip with icon (url/screenshot/barcode/text)
    - Include optional Rename button
    - _Requirements: 1.3_

  - [x] 2.2 Integrate ProductHeader into Results page


    - Add ProductHeader above Trust Score display
    - Pass productIdentity from scan result
    - _Requirements: 1.3_

  - [x] 2.3 Write unit tests for ProductHeader component


    - Test rendering with full product identity
    - Test rendering with minimal data
    - Test "Unknown Item" fallback
    - Test Rename button functionality

---

- [-] 3. B2C: History Page Product Names




  - [x] 3.1 Update History page to display product names


    - Replace "Scanned Product" with productIdentity.name
    - Show source type icon chip
    - Add score, verdict, and timestamp
    - _Requirements: 1.2_

  - [x] 3.2 Add Rename functionality to history items


    - Show Rename button for "Unknown Item" entries
    - Update client-side history entry on rename
    - Persist renamed items to localStorage
    - _Requirements: 1.4, 1.5_

  - [x] 3.3 Write property test for product name display consistency






    - **Property 2: Product Name Display Consistency**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 3.4 Write property test for unknown item fallback





    - **Property 3: Unknown Item Fallback**
    - **Validates: Requirements 1.4**

---

- [x] 4. Checkpoint - B2C Product Names Complete




  - Ensure all tests pass, ask the user if questions arise.

---

- [x] 5. Admin: Enhanced Demo Data Generation






  - [x] 5.1 Create demo product names array

    - Add 8-10 realistic product names with brands and categories
    - Ensure variety across food categories
    - _Requirements: 1.6_

  - [x] 5.2 Enhance demo audit items generation


    - Create DemoAuditItem interface
    - Generate items with varied verdicts (allow, modify, avoid)
    - Include multiple tenants (tenant_1, tenant_2, tenant_3)
    - Include multiple profiles (Default, Strict, Permissive)
    - Add realistic tags and severity levels
    - _Requirements: 3.1, 3.2, 3.6, 3.7_


  - [x] 5.3 Update FilterBar with multiple options

    - Populate tenant dropdown with 3 options
    - Populate profile dropdown with 3 options
    - Implement client-side filtering when selections change
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.4 Write property test for filter options multiplicity


    - **Property 5: Filter Options Multiplicity**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 5.5 Write property test for verdict variety in demo


    - **Property 7: Verdict Variety in Demo**
    - **Validates: Requirements 3.7**

---

- [x] 6. Admin: Empty States and Error Boundaries






  - [x] 6.1 Create EmptyState component


    - Display icon, title, description
    - Include optional CTA button
    - Style with Kiroween theme
    - _Requirements: 3.4, 3.5_


  - [x] 6.2 Enhance ErrorBoundary component

    - Add route-level error handling
    - Display helpful error message
    - Include "Return to Dashboard" action
    - _Requirements: 4.1, 4.2_


  - [x] 6.3 Add empty states to all admin pages

    - Dashboard: "No data yet" with "Run Demo Audit"
    - AuditViewer: "No audits found" with filter clear
    - ProfilesEditor: "No profiles configured" with "Add Profile"
    - RulePacksEditor: "No rule packs loaded" with "Load Defaults"
    - _Requirements: 3.4, 3.5, 4.3, 4.4_


  - [x] 6.4 Write property test for page non-blankness

    - **Property 6: Page Non-Blankness**
    - **Validates: Requirements 3.4**


  - [x] 6.5 Write unit tests for EmptyState component

    - Test rendering with CTA
    - Test rendering without CTA
    - Test CTA click handler

---

- [x] 7. Checkpoint - Admin Demo Data Complete




  - Ensure all tests pass, ask the user if questions arise.

---

- [x] 8. B2C: Visual Polish - Glass Depth








  - [x] 8.1 Enhance glass surface styling

    - Increase background alpha from 0.55 to 0.65
    - Increase backdrop-filter blur from 12px to 16px
    - Strengthen border alpha from 0.1 to 0.12
    - Add inner highlight with inset box-shadow


    - _Requirements: 2.1_

  - [x] 8.2 Apply enhanced glass to all card components

    - Update Results page cards
    - Update History page cards
    - Update Settings page cards
    - Ensure consistent depth across app
    - _Requirements: 2.1_

  - [x] 8.3 Write property test for contrast preservation


    - **Property 8: Contrast Preservation**
    - **Validates: Requirements 2.5**

---

- [x] 9. B2C: Visual Polish - Ghost Light & Mist






  - [x] 9.1 Add ghost-light accent classes

    - Create .ghost-light-teal with subtle glow
    - Create .ghost-light-violet with subtle glow
    - Add hover state enhancements
    - _Requirements: 2.2_


  - [x] 9.2 Apply ghost-light to interactive elements

    - Primary buttons get teal ghost-light
    - Policy/admin elements get violet ghost-light
    - Ensure effects are subtle and professional
    - _Requirements: 2.2_


  - [x] 9.3 Add optional mist gradient background

    - Create .mist-gradient class with radial gradient
    - Apply to page backgrounds
    - Ensure non-distracting (very low opacity)
    - Disable for prefers-reduced-motion
    - _Requirements: 2.3, 2.6_


  - [x] 9.4 Refine ember accent for warnings

    - Apply only to Avoid/Caution states
    - Use restrained border and background
    - Add subtle ember glow
    - _Requirements: 2.4_


  - [x] 9.5 Write visual accessibility tests


    - Test all enhancements maintain WCAG AA contrast
    - Test reduced motion disables effects
    - Test focus indicators remain visible

---

- [x] 10. Final Checkpoint - All Tests Pass





  - Ensure all tests pass, ask the user if questions arise.

---

- [x] 11. Documentation and Screenshots





  - [x] 11.1 Document changes in POLISH_SUMMARY.md

    - List all files changed
    - Describe B2C product name enhancements
    - Describe Admin demo data improvements
    - Describe visual polish changes
    
  - [x] 11.2 Create screenshots checklist


    - History page with real product names
    - Results page with Product Header
    - Admin filters showing multiple values
    - Admin pages with empty states (not blank)
    - Action Queue with varied verdicts
