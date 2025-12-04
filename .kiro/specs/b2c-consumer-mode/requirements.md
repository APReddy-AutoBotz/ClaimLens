# Requirements Document — B2C Consumer Mode

## Introduction

ClaimLens B2C Consumer Mode is a standalone consumer-facing application that empowers individuals to make informed food choices by scanning and analyzing food products, menus, and claims. This mode complements the existing B2B MenuShield by providing direct-to-consumer trust scoring, allergen detection, and safer alternative suggestions.

## Glossary

- **Scan Hub**: Standalone web application where consumers can scan food items via URL, screenshot, barcode, or text
- **Trust Score**: 0-100 numerical score indicating food item safety and claim accuracy
- **Verdict**: Consumer-friendly classification (Allow, Caution, Avoid) based on trust score
- **Safer Swaps**: Alternative product suggestions with better trust scores
- **Allergen Profile**: User-configured list of allergens and dietary restrictions
- **Scan History**: Optional record of previous scans (client-side or opt-in server-side)
- **PWA**: Progressive Web App - installable, offline-capable web application
- **Consumer Scan**: B2C-specific analysis optimized for individual decision-making

## Requirements

### Requirement 1: B2C Scan Hub Interface

**User Story:** As a health-conscious consumer, I want a simple interface to scan food items so that I can quickly assess their safety.

#### Acceptance Criteria

1. THE Scan Hub SHALL provide four input methods: URL, Screenshot upload, Barcode scan, and Text paste
2. WHEN a user selects URL input, THE Scan Hub SHALL accept any valid HTTP/HTTPS URL and extract food content
3. WHEN a user uploads a screenshot, THE Scan Hub SHALL process the image in-memory without server storage
4. WHEN a user scans a barcode, THE Scan Hub SHALL use device camera to capture barcode and lookup product data
5. WHEN a user pastes text, THE Scan Hub SHALL accept up to 10KB of text content for analysis
6. THE Scan Hub SHALL display a loading indicator during analysis with estimated time remaining
7. THE Scan Hub SHALL complete initial UI render within 1 second on 3G connection
8. THE Scan Hub SHALL be accessible at /scan route
9. THE Scan Hub SHALL work on mobile devices (iOS Safari, Android Chrome) and desktop browsers
10. THE Scan Hub SHALL maintain WCAG AA accessibility standards

### Requirement 2: Trust Score Calculation

**User Story:** As a consumer, I want a simple numerical score so that I can quickly understand if a food item is safe.

#### Acceptance Criteria

1. THE System SHALL calculate trust score as a pure function with deterministic output
2. THE System SHALL start with base score of 100 points
3. WHEN a banned health claim is detected, THE System SHALL deduct 40 points per claim
4. WHEN a product recall is found, THE System SHALL deduct 30 points
5. WHEN user-configured allergens are detected, THE System SHALL deduct 20 points per allergen
6. WHEN weasel words are detected, THE System SHALL deduct 10-20 points based on density (>20% density = 20 points, 10-20% = 15 points, 5-10% = 10 points)
7. WHEN no issues are found, THE System SHALL add 10 bonus points (max score 110)
8. THE System SHALL clamp final score to range 0-110
9. THE System SHALL calculate score within 50 milliseconds
10. THE System SHALL log score calculation breakdown for debugging

### Requirement 3: Verdict Classification

**User Story:** As a consumer, I want clear guidance (Allow/Caution/Avoid) so that I can make quick decisions.

#### Acceptance Criteria

1. WHEN trust score is 80-110, THE System SHALL assign verdict "Allow" with green color (#10B981)
2. WHEN trust score is 50-79, THE System SHALL assign verdict "Caution" with amber color (#F59E0B)
3. WHEN trust score is 0-49, THE System SHALL assign verdict "Avoid" with red color (#EF4444)
4. THE System SHALL display verdict prominently with icon and color
5. THE System SHALL provide one-sentence explanation for the verdict
6. THE verdict SHALL be displayed within 100 milliseconds of score calculation

### Requirement 4: Scan Results Display

**User Story:** As a consumer, I want detailed results with reasons so that I understand why a score was assigned.

#### Acceptance Criteria

1. THE Results page SHALL display trust score as large prominent number (48px font)
2. THE Results page SHALL display verdict with color-coded badge
3. THE Results page SHALL list all detected issues with icons and explanations
4. THE Results page SHALL show allergen warnings if user has allergen profile configured
5. THE Results page SHALL display locale-appropriate disclaimers based on detected claims
6. THE Results page SHALL provide source links for each flag (FSSAI, FDA, FSA guidelines)
7. THE Results page SHALL show "Why" drawer with detailed scoring breakdown
8. THE Results page SHALL render within 200 milliseconds after analysis completes
9. THE Results page SHALL be shareable via URL with encoded scan data
10. THE Results page SHALL work offline if previously cached

### Requirement 5: Safer Swaps Suggestions

**User Story:** As a consumer, I want alternative product suggestions so that I can find safer options.

#### Acceptance Criteria

1. WHEN trust score is below 80, THE System SHALL suggest up to 3 safer alternatives
2. THE System SHALL generate suggestions based on similar product category
3. THE System SHALL only suggest products with trust score at least 20 points higher
4. THE System SHALL display suggestion with product name, trust score, and key differences
5. THE System SHALL provide "View Details" link for each suggestion
6. WHERE no safer alternatives exist, THE System SHALL display "No alternatives found" message
7. THE System SHALL use mock data for suggestions in initial release
8. THE System SHALL calculate suggestions within 100 milliseconds
9. THE suggestions SHALL be displayed in order of trust score (highest first)
10. THE System SHALL track suggestion click-through rate for analytics

### Requirement 6: Allergen Profile Management

**User Story:** As a consumer with allergies, I want to configure my allergen profile so that scans are personalized to my needs.

#### Acceptance Criteria

1. THE System SHALL provide allergen profile configuration at /settings route
2. THE System SHALL display all common allergens as toggles (Peanuts, Tree Nuts, Milk, Eggs, Fish, Shellfish, Soy, Wheat, Sesame)
3. WHEN a user toggles an allergen, THE System SHALL save preference to localStorage immediately
4. THE System SHALL allow adding custom allergens via text input
5. THE System SHALL display allergen profile status on Scan Hub (e.g., "3 allergens configured")
6. WHEN allergen profile is configured, THE System SHALL highlight matching allergens in red on results
7. THE System SHALL provide "Clear all" button to reset allergen profile
8. THE System SHALL export allergen profile as JSON for backup
9. THE System SHALL import allergen profile from JSON file
10. THE System SHALL NOT transmit allergen profile to server unless user explicitly opts in

### Requirement 7: Scan History

**User Story:** As a consumer, I want to see my previous scans so that I can compare products over time.

#### Acceptance Criteria

1. THE System SHALL provide scan history at /history route
2. THE System SHALL store scan history in localStorage by default (client-side only)
3. THE System SHALL display up to 50 most recent scans in history
4. THE System SHALL show scan thumbnail, product name, trust score, verdict, and timestamp
5. WHEN a user clicks a history item, THE System SHALL navigate to results page with cached data
6. THE System SHALL provide "Clear history" button with confirmation dialog
7. THE System SHALL allow filtering history by verdict (All, Allow, Caution, Avoid)
8. THE System SHALL allow searching history by product name
9. THE System SHALL provide opt-in toggle for server-side history sync
10. WHEN server-side sync is enabled, THE System SHALL require user authentication

### Requirement 8: PWA Features

**User Story:** As a mobile user, I want to install ClaimLens as an app so that I can access it quickly.

#### Acceptance Criteria

1. THE System SHALL provide valid manifest.json with app metadata
2. THE manifest SHALL include app name "ClaimLens Go", short_name "ClaimLens"
3. THE manifest SHALL include icons in sizes 192x192 and 512x512 (PNG format)
4. THE manifest SHALL set display mode to "standalone"
5. THE manifest SHALL set theme_color to #0B1220 (Ink) and background_color to #0F1628 (Surface)
6. THE System SHALL register a service worker for offline functionality
7. THE service worker SHALL cache Scan Hub, Results page, and Settings page for offline access
8. THE service worker SHALL cache design-tokens.css and critical assets
9. WHEN offline, THE System SHALL display banner "Offline mode - Some features unavailable"
10. THE System SHALL prompt user to install app after 3 successful scans

### Requirement 9: POST /v1/consumer/scan API Endpoint

**User Story:** As a developer, I want a dedicated B2C API endpoint so that consumer scans are optimized differently than B2B.

#### Acceptance Criteria

1. THE API SHALL accept POST requests at /v1/consumer/scan
2. THE API SHALL accept JSON payload with fields: input_type (url|screenshot|text|barcode), input_data, locale, allergen_profile (optional)
3. WHEN input_type is "screenshot", THE API SHALL accept base64-encoded image data
4. WHEN input_type is "barcode", THE API SHALL accept barcode number and lookup product database
5. THE API SHALL return JSON response with trust_score, verdict, badges, reasons, disclaimers, sources, suggestions
6. THE API SHALL complete processing within 2 seconds at p95 latency
7. THE API SHALL apply consumer-specific transform profile "claimlens_consumer"
8. THE API SHALL NOT store scan data unless user explicitly opts in
9. THE API SHALL require X-Correlation-ID header for request tracing
10. THE API SHALL support Idempotency-Key header for duplicate prevention

### Requirement 10: Consumer-Specific Transform Profile

**User Story:** As a system architect, I want a separate transform profile for consumers so that B2C analysis is optimized for individual decision-making.

#### Acceptance Criteria

1. THE System SHALL define "claimlens_consumer" profile in policies.yaml
2. THE profile SHALL include transforms: detect.allergens, rewrite.disclaimer, detect.recalls, calculate.trust_score, suggest.alternatives
3. THE profile SHALL set latency_budget_ms to 1500 (more lenient than B2B)
4. THE profile SHALL prioritize allergen detection over claim rewriting
5. THE profile SHALL include weasel word detection transform
6. THE profile SHALL skip PII redaction (not applicable for consumer scans)
7. THE profile SHALL apply locale-specific disclaimer templates
8. THE profile SHALL generate consumer-friendly language (avoid technical jargon)
9. THE profile SHALL include trust score calculation as final transform
10. THE profile SHALL be versioned independently from B2B profiles

### Requirement 11: Barcode Lookup Integration

**User Story:** As a consumer, I want to scan product barcodes so that I can quickly analyze packaged foods.

#### Acceptance Criteria

1. THE System SHALL integrate with Open Food Facts API for barcode lookup
2. WHEN a barcode is scanned, THE System SHALL query Open Food Facts API with barcode number
3. WHEN product is found, THE System SHALL extract product name, ingredients, nutrition facts, and allergens
4. WHEN product is not found, THE System SHALL display "Product not found - Try manual input"
5. THE System SHALL cache barcode lookup results for 7 days
6. THE System SHALL handle API rate limits gracefully (max 100 requests/minute)
7. THE System SHALL timeout barcode lookup after 3 seconds
8. THE System SHALL fall back to manual input if barcode lookup fails
9. THE System SHALL display product image from Open Food Facts if available
10. THE System SHALL attribute data source to Open Food Facts with link

### Requirement 12: Screenshot OCR Processing

**User Story:** As a consumer, I want to upload menu screenshots so that I can analyze restaurant menus.

#### Acceptance Criteria

1. THE System SHALL accept image uploads in JPEG, PNG, WebP formats up to 5MB
2. THE System SHALL resize images to max 1920x1080 before processing
3. THE System SHALL use MCP ocr.label service for text extraction
4. WHEN OCR service is unavailable, THE System SHALL display "Image analysis unavailable - Try text input"
5. THE System SHALL extract text from image within 3 seconds
6. THE System SHALL highlight detected text regions on image preview
7. THE System SHALL allow user to edit extracted text before analysis
8. THE System SHALL process image in-memory without server storage
9. THE System SHALL delete image data after analysis completes
10. THE System SHALL support multi-language OCR (English, Hindi, Tamil)

### Requirement 13: Mobile-First Responsive Design

**User Story:** As a mobile user, I want the interface optimized for my phone so that I can scan on-the-go.

#### Acceptance Criteria

1. THE Scan Hub SHALL use mobile-first responsive design with breakpoints at 640px, 768px, 1024px
2. THE Scan Hub SHALL display single-column layout on mobile (<640px)
3. THE Scan Hub SHALL use large touch targets (minimum 44x44px) for all interactive elements
4. THE Scan Hub SHALL use bottom sheet pattern for modals on mobile
5. THE Scan Hub SHALL support swipe gestures for navigation (swipe right to go back)
6. THE Scan Hub SHALL use native camera API for barcode scanning on mobile
7. THE Scan Hub SHALL optimize images for mobile bandwidth (WebP format, lazy loading)
8. THE Scan Hub SHALL use system fonts for faster loading on mobile
9. THE Scan Hub SHALL test on iPhone SE (375px width) and Pixel 5 (393px width)
10. THE Scan Hub SHALL achieve Lighthouse mobile score >90

### Requirement 14: Internationalization for Consumers

**User Story:** As a non-English speaking consumer, I want the interface in my language so that I can understand results.

#### Acceptance Criteria

1. THE System SHALL support UI languages: English (en), Hindi (hi), Tamil (ta)
2. THE System SHALL detect browser language and set default locale
3. THE System SHALL provide language selector in settings
4. THE System SHALL translate all UI text (buttons, labels, messages) to selected language
5. THE System SHALL keep technical terms (trust score, verdict) in English with translations in parentheses
6. THE System SHALL apply locale-specific number formatting (Indian: 1,00,000 vs Western: 100,000)
7. THE System SHALL use locale-appropriate date formats
8. THE System SHALL translate allergen names to selected language
9. THE System SHALL keep source links and disclaimers in original language with translation note
10. THE System SHALL store language preference in localStorage

### Requirement 15: Privacy-First Design

**User Story:** As a privacy-conscious consumer, I want my data to stay on my device so that my food choices remain private.

#### Acceptance Criteria

1. THE System SHALL process all scans client-side when possible (text, cached barcodes)
2. THE System SHALL display privacy notice on first use explaining data handling
3. THE System SHALL NOT transmit allergen profile to server unless explicitly opted in
4. THE System SHALL NOT store scan history on server unless explicitly opted in
5. THE System SHALL provide "Delete all data" button in settings
6. THE System SHALL use HTTPS for all API requests
7. THE System SHALL NOT use third-party analytics or tracking by default
8. THE System SHALL provide opt-in toggle for anonymous usage analytics
9. THE System SHALL display privacy policy link in footer
10. THE System SHALL comply with GDPR right to erasure (delete account and all data)

### Requirement 16: Performance Budgets

**User Story:** As a user on slow connection, I want fast load times so that I can scan quickly.

#### Acceptance Criteria

1. THE Scan Hub SHALL load initial HTML within 1 second on 3G connection
2. THE Scan Hub SHALL achieve First Contentful Paint (FCP) within 1.5 seconds
3. THE Scan Hub SHALL achieve Largest Contentful Paint (LCP) within 2.5 seconds
4. THE Scan Hub SHALL achieve Time to Interactive (TTI) within 3 seconds
5. THE Scan Hub SHALL have total JavaScript bundle size <200KB (gzipped)
6. THE Scan Hub SHALL have total CSS size <50KB (gzipped)
7. THE Scan Hub SHALL lazy load non-critical components (history, settings)
8. THE Scan Hub SHALL use code splitting for route-based chunks
9. THE Scan Hub SHALL achieve Lighthouse performance score >90
10. THE Scan Hub SHALL enforce performance budgets in CI pipeline

### Requirement 17: Offline Functionality

**User Story:** As a user in areas with poor connectivity, I want basic functionality offline so that I can still scan cached items.

#### Acceptance Criteria

1. THE System SHALL cache Scan Hub UI for offline access
2. THE System SHALL cache previously scanned items for offline viewing
3. THE System SHALL cache allergen profile for offline use
4. THE System SHALL display offline banner when network is unavailable
5. WHEN offline, THE System SHALL allow viewing scan history
6. WHEN offline, THE System SHALL allow viewing and editing allergen profile
7. WHEN offline, THE System SHALL queue new scans for processing when online
8. THE System SHALL sync queued scans automatically when connection restored
9. THE System SHALL display sync status indicator
10. THE System SHALL handle offline/online transitions gracefully without data loss

### Requirement 18: Accessibility for Consumers

**User Story:** As a visually impaired consumer, I want screen reader support so that I can use ClaimLens independently.

#### Acceptance Criteria

1. THE Scan Hub SHALL provide ARIA labels for all interactive elements
2. THE Scan Hub SHALL announce trust score and verdict to screen readers
3. THE Scan Hub SHALL provide keyboard shortcuts for common actions (S for scan, H for history)
4. THE Scan Hub SHALL support high contrast mode
5. THE Scan Hub SHALL allow text scaling up to 200% without breaking layout
6. THE Scan Hub SHALL provide skip links to main content
7. THE Scan Hub SHALL use semantic HTML (header, nav, main, footer)
8. THE Scan Hub SHALL test with NVDA (Windows) and VoiceOver (iOS/macOS)
9. THE Scan Hub SHALL achieve WCAG AA compliance (4.5:1 contrast minimum)
10. THE Scan Hub SHALL provide alternative text for all images and icons

### Requirement 19: Error Handling and Feedback

**User Story:** As a consumer, I want clear error messages so that I know what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN API request fails, THE System SHALL display user-friendly error message (not technical details)
2. WHEN barcode not found, THE System SHALL suggest manual text input
3. WHEN OCR fails, THE System SHALL suggest text input or URL
4. WHEN network is slow, THE System SHALL display progress indicator with estimated time
5. WHEN rate limit is hit, THE System SHALL display "Too many requests - Try again in X seconds"
6. WHEN invalid input is provided, THE System SHALL highlight field and show validation message
7. THE System SHALL provide "Report issue" button on error screens
8. THE System SHALL log errors to console for debugging (development mode only)
9. THE System SHALL display toast notifications for success actions (scan saved, profile updated)
10. THE System SHALL auto-dismiss success toasts after 3 seconds

### Requirement 20: Analytics and Metrics

**User Story:** As a product manager, I want usage analytics so that I can understand how consumers use ClaimLens.

#### Acceptance Criteria

1. THE System SHALL track scan count per input method (URL, screenshot, barcode, text)
2. THE System SHALL track average trust score across all scans
3. THE System SHALL track verdict distribution (Allow %, Caution %, Avoid %)
4. THE System SHALL track allergen profile adoption rate
5. THE System SHALL track PWA install rate
6. THE System SHALL track scan history usage
7. THE System SHALL track safer swaps click-through rate
8. THE System SHALL track error rate by error type
9. THE System SHALL track performance metrics (FCP, LCP, TTI)
10. THE System SHALL send analytics only if user opts in (privacy-first)

---

## Non-Functional Requirements

### Performance
- Scan Hub initial load: <1s on 3G
- Trust score calculation: <50ms
- API response time: <2s at p95
- Offline cache size: <10MB

### Scalability
- Support 10,000 concurrent users
- Handle 100 scans per second
- Cache 1 million barcode lookups

### Security
- HTTPS only
- No server-side storage by default
- CSP headers enforced
- Input sanitization on all fields

### Accessibility
- WCAG AA compliance
- Screen reader tested
- Keyboard navigable
- High contrast mode

### Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

---

## Success Metrics

### Adoption
- 10,000 active users in first month
- 50% PWA install rate
- 30% return user rate

### Engagement
- Average 5 scans per user per week
- 40% allergen profile configuration rate
- 20% scan history usage rate

### Quality
- Average trust score: 75
- 60% Allow verdicts
- 30% Caution verdicts
- 10% Avoid verdicts

### Performance
- 95% of scans complete in <2s
- 99% uptime
- <1% error rate

---

## Dependencies

### External Services
- Open Food Facts API (barcode lookup)
- MCP ocr.label service (screenshot OCR)
- MCP recall.lookup service (product recalls)

### Internal Services
- ClaimLens transform pipeline
- Rule packs (banned claims, allergens, disclaimers)
- Policy engine

### Browser APIs
- Camera API (barcode scanning)
- Service Worker API (offline functionality)
- LocalStorage API (client-side data)
- Geolocation API (optional, for locale detection)

---

## Out of Scope

- Social features (sharing, comments, ratings)
- User accounts and authentication (Phase 1)
- Real-time product database (using Open Food Facts)
- Nutrition tracking and meal planning
- Integration with fitness apps
- Paid premium features
- White-label customization
