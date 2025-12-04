# Implementation Tasks — B2C Consumer Mode

## Overview

This task list covers the implementation of NEW B2C Consumer Mode features. These tasks are separate from the existing ClaimLens system and focus on consumer-facing functionality.

**Execution Strategy:**
- Each task is 2-4 hours of work
- Tasks build incrementally
- Test after each task
- Mobile-first approach

---

## Phase 1: Core Scanning Infrastructure (Week 1)

- [x] 1. Set up consumer app foundation and scanning UI




  - [x] 1.1 Set up Consumer App Structure


    - Create `app/consumer/` directory
    - Initialize Vite + React + TypeScript project
    - Configure `vite.config.ts` with path aliases
    - Set up React Router with routes: /scan, /results, /history, /settings
    - Import `design-tokens.css` from `app/web/`
    - Create base layout component with header and navigation
    - Configure TypeScript with strict mode
    - Add `package.json` with dependencies: react, react-router-dom, zxing
    - _Acceptance: App runs on `http://localhost:3002`, all routes render placeholder pages, design tokens applied, TypeScript compiles_
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Implement Scan Hub UI


    - Create `ScanHub.tsx` page component
    - Implement 4 input method selector (URL, Screenshot, Barcode, Text)
    - Create `InputSelector.tsx` component with icon buttons
    - Add URL input field with validation
    - Add file upload for screenshots (accept: image/*)
    - Add textarea for text input (max 10KB)
    - Add barcode button (placeholder for now)
    - Style with glass effect and mobile-first responsive design
    - Add "Scan" button (disabled until input provided)
    - Implement input validation with error messages
    - _Acceptance: All 4 input methods display, URL validation works, file upload shows preview, mobile layout <640px, touch targets ≥44px_
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Implement trust scoring and verdict system



  - [x] 2.1 Create Trust Score Calculator


    - Create `packages/core/trust-score.ts`
    - Implement `calculateTrustScore()` function
    - Add scoring logic: base 100, deduct for issues, add clean bonus
    - Implement banned claim detection (-40 per claim)
    - Implement recall detection (-30)
    - Implement allergen detection (-20 per allergen)
    - Implement weasel word detection (-10 to -20 based on density)
    - Add clean bonus (+10 if no issues)
    - Clamp score to 0-110 range
    - Return score breakdown for debugging
    - _Acceptance: Function is pure, calculates in <50ms, returns score and breakdown, all edge cases handled, unit tests with 100% coverage_
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.2 Implement Verdict Classification


    - Create `getVerdict()` function in `trust-score.ts`
    - Map score 80-110 → "allow" (green #10B981)
    - Map score 50-79 → "caution" (amber #F59E0B)
    - Map score 0-49 → "avoid" (red #EF4444)
    - Return verdict object with: label, color, icon, explanation
    - Add verdict explanations (consumer-friendly)
    - Create `VerdictBadge.tsx` component
    - Style badge with color-coded background and icon
    - _Acceptance: Verdict maps correctly for all score ranges, badge displays with correct colors, explanations are consumer-friendly, component is accessible_
    - _Requirements: 2.1, 2.2_

- [x] 3. Build consumer scan API and results display



  - [x] 3.1 Create POST /v1/consumer/scan API Endpoint


    - Create `app/api/routes/consumer.ts`
    - Implement POST /v1/consumer/scan endpoint
    - Accept JSON payload: input_type, input_data, locale, allergen_profile
    - Validate input (max 10KB for text, valid URL format)
    - For text input: pass directly to transform pipeline
    - For URL input: fetch content and extract text
    - Apply "claimlens_consumer" transform profile
    - Calculate trust score from transform results
    - Generate verdict from trust score
    - Return response: trust_score, verdict, badges, reasons, suggestions
    - _Acceptance: Endpoint accepts all input types, validates correctly, returns proper error responses, includes X-Correlation-ID, completes in <2s at p95, unit tests for all input types_
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  - [x] 3.2 Implement Results Display Page


    - Create `Results.tsx` page component
    - Create `TrustScoreDisplay.tsx` component (large 48px number)
    - Display verdict badge prominently
    - Create `IssuesList.tsx` component
    - Display each issue with icon, title, explanation
    - Add source links for each issue
    - Create `WhyDrawer.tsx` component (collapsible)
    - Show score breakdown in Why drawer
    - Add "Scan Another" button
    - Make results shareable via URL with encoded data
    - _Acceptance: Trust score displays prominently, verdict badge shows correct color, all issues listed with explanations, Why drawer expands/collapses, page renders in <200ms, mobile responsive, accessible_
    - _Requirements: 2.1, 2.2, 2.3, 3.1_

---

## Phase 2: Personalization Features (Week 2)

- [x] 4. Implement allergen profile management




  - [x] 4.1 Implement Allergen Profile UI


    - Create `Settings.tsx` page component
    - Create `AllergenToggle.tsx` component
    - Display common allergens as toggle switches (Peanuts, Tree Nuts, Milk, Eggs, Fish, Shellfish, Soy, Wheat, Sesame)
    - Add custom allergen input field
    - Implement localStorage persistence
    - Add "Clear all" button with confirmation
    - Add export profile button (downloads JSON)
    - Add import profile button (uploads JSON)
    - Display allergen count on Scan Hub
    - Create `useAllergenProfile()` hook
    - _Acceptance: Toggles save immediately to localStorage, custom allergens can be added/removed, export/import works, profile persists across sessions, mobile-friendly layout_
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Integrate Allergen Profile with Scanning

    - Update `useScan()` hook to include allergen profile
    - Pass allergen_profile to API in scan request
    - Highlight user allergens in red on results
    - Add allergen warning banner if user allergens detected
    - Deduct 20 points per user allergen in trust score
    - Show "Based on your allergen profile" note
    - Add "Edit profile" link from results page
    - Test with various allergen combinations
    - _Acceptance: User allergens highlighted in results, trust score reflects user allergens, warning banner displays correctly, profile can be edited from results_
    - _Requirements: 3.1, 3.2, 2.2_

- [x] 5. Build scan history and safer swaps features







  - [x] 5.1 Implement Scan History

    - Create `History.tsx` page component
    - Create `useScanHistory()` hook
    - Store scans in localStorage (max 50 items)
    - Display scan list with: thumbnail, name, score, verdict, timestamp
    - Implement filter by verdict (All, Allow, Caution, Avoid)
    - Implement search by product name
    - Add "Clear history" button with confirmation
    - Click item to view cached results
    - Show empty state when no history
    - Add "Save to history" toggle on results page
    - _Acceptance: History stores 50 most recent scans, filter and search work correctly, clicking item loads cached results, clear history works with confirmation, empty state displays_

    - _Requirements: 4.1, 4.2_
  - [x] 5.2 Implement Safer Swaps

    - Create `packages/core/safer-swaps.ts`
    - Implement `generateSuggestions()` function
    - Use mock data for suggestions (3 alternatives)
    - Filter suggestions: must be 20+ points higher
    - Sort by trust score (highest first)
    - Create `SaferSwaps.tsx` component
    - Display suggestions with: name, trust score, key differences
    - Add "View Details" button (navigates to results)
    - Show "No alternatives found" if score >80
    - Track click-through rate in localStorage
    - _Acceptance: Suggestions only show when score <80, all suggestions are 20+ points higher, sorted by trust score, click tracking works, component is accessible_
    - _Requirements: 5.1, 5.2_

- [x] 6. Implement barcode scanning capability



  - [x] 6.1 Implement Barcode Scanning


    - Install ZXing library for barcode detection
    - Create `barcode-scanner.ts` utility
    - Implement camera access using getUserMedia API
    - Create barcode scanner UI overlay
    - Detect barcode from camera feed
    - Integrate Open Food Facts API
    - Implement barcode lookup with 7-day cache
    - Extract product data: name, ingredients, nutrition, allergens
    - Handle "product not found" gracefully
    - Add fallback to manual input
    - _Acceptance: Camera opens on mobile devices, barcode detected accurately, Open Food Facts API integration works, cache reduces API calls, fallback to manual input works, handles rate limits gracefully_
    - _Requirements: 1.1, 1.2, 1.3_

---

## Phase 3: PWA & Offline (Week 3)

- [x] 7. Create PWA foundation with offline support





  - [x] 7.1 Create PWA Manifest

    - Create `app/consumer/public/manifest.json`
    - Set app name: "ClaimLens Go"
    - Set short_name: "ClaimLens"
    - Set description: "Scan food items for safety and claims"
    - Set theme_color: #0B1220 (Ink)
    - Set background_color: #0F1628 (Surface)
    - Set display: "standalone"
    - Set start_url: "/scan"
    - Create app icons: 192x192 and 512x512 PNG
    - Add icons to manifest
    - Link manifest in index.html
    - _Acceptance: Manifest validates (Chrome DevTools), icons display correctly, app installable on mobile, standalone mode works_
    - _Requirements: 6.1, 6.2_
  - [x] 7.2 Implement Service Worker


    - Create `app/consumer/public/sw.js`
    - Use Workbox for service worker generation
    - Cache Scan Hub, Results, History, Settings pages
    - Cache design-tokens.css and critical assets
    - Implement cache-first strategy for static assets
    - Implement network-first strategy for API calls
    - Add offline fallback page
    - Register service worker in main.tsx
    - Handle service worker updates
    - _Acceptance: Service worker registers successfully, pages load offline, assets cached correctly, offline fallback displays, updates apply smoothly_
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.3 Implement Background Sync

    - Add background sync for queued scans
    - Queue scans when offline
    - Show "Queued for sync" indicator
    - Sync automatically when online
    - Display sync status
    - Handle sync failures
    - Retry failed syncs
    - Update UI after successful sync
    - _Acceptance: Scans queue when offline, auto-sync when online, status indicator works, failed syncs retry, UI updates correctly_
    - _Requirements: 6.3_

- [x] 8. Optimize mobile performance and accessibility






  - [x] 8.1 Mobile Optimizations

    - Optimize images (WebP format, lazy loading)
    - Implement code splitting for routes
    - Add loading skeletons for async content
    - Optimize bundle size (<200KB gzipped)
    - Add touch gestures (swipe to go back)
    - Optimize for iPhone SE (375px) and Pixel 5 (393px)
    - Test on real devices (iOS Safari, Android Chrome)
    - Run Lighthouse audit (target >90)
    - _Acceptance: Bundle size <200KB gzipped, Lighthouse score >90, works on iPhone SE and Pixel 5, touch gestures work, images lazy load_
    - _Requirements: 7.1, 7.2_

  - [x] 8.2 Accessibility Testing

    - Test with NVDA screen reader (Windows)
    - Test with VoiceOver (iOS/macOS)
    - Verify all interactive elements have ARIA labels
    - Test keyboard navigation (Tab, Enter, ESC)
    - Verify focus indicators visible (2px Teal)
    - Test with high contrast mode
    - Test text scaling up to 200%
    - Run axe DevTools audit
    - Fix all WCAG AA violations
    - Document accessibility features
    - _Acceptance: WCAG AA compliant (4.5:1 contrast), screen reader announces all content, keyboard navigable, focus indicators visible, axe audit passes, high contrast mode works_
    - _Requirements: 7.3, 7.4_

---

## Phase 4: Integration & Polish (Week 4)

- [x] 9. Integrate transform pipeline and weasel word detection



  - [x] 9.1 Create Consumer Transform Profile


    - Update `.kiro/specs/policies.yaml`
    - Add "claimlens_consumer" profile
    - Include transforms: detect.allergens, detect.recalls, detect.weasel_words (create new), rewrite.disclaimer, calculate.trust_score (integrate)
    - Set latency_budget_ms: 1500
    - Configure consumer-friendly language
    - Test profile with fixtures
    - Verify all transforms execute correctly
    - _Acceptance: Profile defined in policies.yaml, all transforms execute in order, latency budget met, consumer-friendly output, fixture tests pass_
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 9.2 Implement Weasel Word Detection


    - Create `packages/transforms/detect.weasel_words.ts`
    - Define weasel word list: may, might, could, helps, supports, up to, etc.
    - Implement density calculation (weasel words / total words)
    - Deduct points based on density: >20%: -20 points, 10-20%: -15 points, 5-10%: -10 points
    - Return flag with weasel words found
    - Add unit tests
    - Integrate with consumer profile
    - _Acceptance: Detects all weasel words, density calculated correctly, points deducted appropriately, unit tests pass, integrated with profile_
    - _Requirements: 2.3_

- [x] 10. Implement screenshot OCR and performance optimization



  - [x] 10.1 Screenshot OCR Integration


    - Update consumer API to handle screenshot input
    - Resize images to max 1920x1080
    - Call MCP ocr.label service
    - Extract text from image
    - Handle OCR failures gracefully
    - Show extracted text preview
    - Allow user to edit extracted text
    - Process in-memory (no server storage)
    - Delete image data after processing
    - Add loading indicator during OCR
    - _Acceptance: Screenshots processed correctly, text extracted accurately, user can edit extracted text, no server storage, graceful failure handling, loading indicator displays_
    - _Requirements: 1.1, 1.2_

  - [x] 10.2 Performance Optimization

    - Run performance profiling
    - Optimize trust score calculation
    - Reduce API response time
    - Optimize React re-renders
    - Implement request caching
    - Add request deduplication
    - Optimize image loading
    - Reduce JavaScript bundle size
    - Run Lighthouse audit
    - Fix performance issues
    - _Acceptance: Trust score calculates in <50ms, API responds in <2s at p95, FCP <1.5s, LCP <2.5s, TTI <3s, Lighthouse performance >90, no unnecessary re-renders_
    - _Requirements: 7.1, 7.2_

- [x] 11. Complete testing and documentation






  - [x] 11.1 End-to-End Testing


    - Write Playwright E2E tests for scan flow
    - Test URL input → results
    - Test screenshot upload → results
    - Test text input → results
    - Test barcode scan → results
    - Test allergen profile configuration
    - Test scan history
    - Test offline functionality
    - Test PWA install
    - Run all E2E tests in CI
    - _Acceptance: All E2E tests pass, coverage for all user flows, tests run in CI, no flaky tests, mobile tests included_
    - _Requirements: All requirements_

  - [x] 11.2 Documentation

    - Update README.md with B2C setup instructions
    - Document trust score algorithm
    - Document API endpoint
    - Create user guide for consumers
    - Document PWA installation
    - Add troubleshooting guide
    - Create demo video (3 minutes)
    - Document deployment process
    - _Acceptance: README updated, all features documented, user guide complete, demo video recorded, deployment documented_
    - _Requirements: All requirements_

---

## Validation Checklist

```bash
# 1. Install dependencies
cd app/consumer
pnpm install

# 2. Run development server
pnpm dev  # http://localhost:3002

# 3. Run tests
pnpm test
pnpm test:e2e

# 4. Build for production
pnpm build

# 5. Run Lighthouse audit
lighthouse http://localhost:3002 --view

# 6. Test PWA
# Open on mobile device
# Install app
# Test offline mode

# 7. Test accessibility
# Run axe DevTools
# Test with screen reader
# Test keyboard navigation
```

---

## Success Metrics

- [ ] All 4 input methods work
- [ ] Trust score calculates correctly
- [ ] Verdict displays with correct colors
- [ ] Allergen profile saves and persists
- [ ] Scan history stores 50 items
- [ ] PWA installs on mobile
- [ ] Offline mode works
- [ ] Lighthouse score >90
- [ ] WCAG AA compliant
- [ ] E2E tests pass

---

**Estimated Timeline**: 4 weeks (1 developer)
**Total Tasks**: 26 tasks
**Average Task Duration**: 2-4 hours
