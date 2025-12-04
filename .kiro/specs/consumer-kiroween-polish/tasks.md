# Implementation Plan

## Priority Order
1. Results page receipts/evidence UX (highest demo impact)
2. Scan flow enhancements
3. Landing page polish
4. History/Settings improvements

---

- [x] 1. Kiroween Design Tokens & Theme Foundation





  - [x] 1.1 Enhance design-tokens.css with Kiroween color palette

    - Add spectral teal/mint, ember orange, violet policy colors
    - Add glow effects and fog gradient variables
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create kiroween-theme.css with premium effects

    - Implement subtle grain texture overlay
    - Add soft fog gradients
    - Ensure prefers-reduced-motion support
    - _Requirements: 1.5, 3.6_
  - [x] 1.3 Write property test for color contrast compliance







    - **Property 6: Accessibility Focus Visibility**
    - **Validates: Requirements 10.1**

---

- [x] 2. Results Page - Evidence Drawer (Receipts) - PRIORITY






  - [x] 2.1 Create EvidenceDrawer component

    - Header: "No tricks. Just proof."
    - Collapsible sections for rules, matched text, policy refs
    - Summary count when collapsed
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [x] 2.2 Implement matched text highlighting

    - Show exact matched snippets with highlight
    - Link to "View source" functionality
    - _Requirements: 5.3, 6.3_

  - [x] 2.3 Add Pro Mode toggle for transform chain



    - Show transform steps with durations
    - Default to collapsed/hidden
    - _Requirements: 6.5_
  - [x] 2.4 Write property test for evidence drawer content



    - **Property 5: Evidence Drawer Content**
    - **Validates: Requirements 6.2, 6.3, 6.4**

---

- [x] 3. Results Page - Verdict Banner Enhancement





  - [x] 3.1 Create VerdictBanner component with Kiroween microcopy


    - Allow: "Marked safe… for now."
    - Modify: "Proceed with caution."
    - Avoid: "Do not invite this into your body."
    - _Requirements: 4.3, 4.4, 4.5_
  - [x] 3.2 Enhance Trust Score display


    - Always show 0-100 with clear label
    - Add score breakdown explanation
    - _Requirements: 4.1, 4.6_
  - [x] 3.3 Write property test for verdict consistency



    - **Property 2: Verdict Consistency**
    - **Validates: Requirements 4.2**
  - [x] 3.4 Write property test for verdict microcopy mapping



    - **Property 3: Verdict Microcopy Mapping**
    - **Validates: Requirements 4.3, 4.4, 4.5**

---

- [x] 4. Results Page - Issues Grouping





  - [x] 4.1 Refactor IssuesList to group by type


    - Groups: Banned Claims, Allergens, Missing Disclaimers, Weasel Words, Recall Signals
    - Each group collapsible with count badge
    - _Requirements: 5.1_
  - [x] 4.2 Enhance issue display with severity and explanation

    - Show: what detected, why it matters, severity
    - Add "View source" link with snippet highlight
    - _Requirements: 5.2, 5.3_
  - [x] 4.3 Add allergen alert banner


    - Prominent display when user allergens detected
    - Link to edit allergen profile
    - _Requirements: 5.4_
  - [x] 4.4 Write property test for issue grouping completeness



    - **Property 4: Issue Grouping Completeness**
    - **Validates: Requirements 5.1**

---

- [x] 5. Checkpoint - Results Page Complete





  - Ensure all tests pass, ask the user if questions arise.

---

- [x] 6. Scan Page - Flow Enhancement






  - [x] 6.1 Create ScanProgress component

    - Stages: Extract → Checks → Verdict
    - Spectral scan animation (respects reduced motion)
    - _Requirements: 3.2, 3.6_

  - [x] 6.2 Enhance central dropzone/input area

    - Adaptive to selected scan method
    - Clear visual hierarchy
    - _Requirements: 3.1_

  - [x] 6.3 Implement error states

    - Invalid URL, blocked domains, unreadable screenshot
    - Helpful recovery suggestions

    - _Requirements: 3.3_

  - [x] 6.4 Add camera permission UX for barcode





    - Clear permission request

    - Fallback options if denied
    - _Requirements: 3.5_
  - [x] 6.5 Write property test for reduced motion respect


    - **Property 7: Reduced Motion Respect**
    - **Validates: Requirements 10.2**

---

- [x] 7. Landing Page - Polish





  - [x] 7.1 Add "What we check / What we don't" microcallout


    - Clear expectations setting
    - Compliance language, not medical
    - _Requirements: 2.5_
  - [x] 7.2 Enhance trust anchors display


    - "Processed locally by default"
    - "No account required"
    - "Receipts included"
    - _Requirements: 2.4_
  - [x] 7.3 Refine "How it works" visuals


    - Scan → Analyze → Decide with Kiroween styling
    - _Requirements: 2.6_
  - [x] 7.4 Write unit tests for landing page components




---

- [x] 8. Safer Alternatives Enhancement





  - [x] 8.1 Add safety disclaimer


    - "Suggestions may not match all preferences… Always check labels."
    - _Requirements: 7.1_
  - [x] 8.2 Add personalization toggles


    - "Respect my allergens"
    - "Vegetarian/Vegan/No added sugar" (optional)
    - _Requirements: 7.2_
  - [x] 8.3 Enhance alternative cards


    - Show "key differences" and "what changed score"
    - _Requirements: 7.3_

---

- [x] 9. Share - Proof Card






  - [x] 9.1 Create ProofCard component

    - Lightweight shareable image
    - Verdict, score, top 2 reasons, QR to receipts
    - _Requirements: 8.1, 8.2_
  - [x] 9.2 Implement share functionality


    - Web Share API with clipboard fallback
    - _Requirements: 8.3, 8.4_

---

- [x] 10. Checkpoint - Core Features Complete





  - Ensure all tests pass, ask the user if questions arise.

---

- [x] 11. History Page Enhancement





  - [x] 11.1 Add filter controls


    - Filter by verdict, category, date
    - _Requirements: 9.1_
  - [x] 11.2 Add quick re-scan action


    - One-tap to re-scan from history
    - _Requirements: 9.2_

---

- [x] 12. Settings Page Enhancement





  - [x] 12.1 Enhance allergen profile section


    - Clear toggle interface
    - _Requirements: 9.3_
  - [x] 12.2 Add locale/jurisdiction selector


    - Affects which policy packs apply
    - _Requirements: 9.4_
  - [x] 12.3 Add privacy and motion toggles


    - Privacy-save toggle
    - Reduced motion toggle
    - _Requirements: 9.5, 9.6_

---

- [x] 13. Accessibility Polish





  - [x] 13.1 Audit and fix focus indicators


    - All interactive elements have visible focus
    - _Requirements: 10.1_
  - [x] 13.2 Verify color contrast


    - Minimum 4.5:1 for body text
    - Non-color indicators for status
    - _Requirements: 10.4, 10.5_
  - [x] 13.3 Test reduced motion support


    - All animations respect preference
    - _Requirements: 10.2_
  - [x] 13.4 Write accessibility test suite




---

- [x] 14. Final Checkpoint - All Tests Pass





  - Ensure all tests pass, ask the user if questions arise.

---

- [ ] 15. Steering Documentation
  - [ ] 15.1 Create consumer-ui-kiroween.md steering file
    - Tone guidelines
    - Theme specifications
    - Copy standards
