# B2C Consumer Mode — Comprehensive Spec Summary

## Overview

This spec defines the **NEW B2C Consumer Mode features** that need to be implemented. These features are **NOT yet built** and extend the existing ClaimLens system.

---

## What's NEW (To Be Implemented)

### 1. **B2C Scan Hub** (NEW)
- **Location**: `app/consumer/` (new directory)
- **Route**: `/scan`
- **Features**:
  - 4 input methods: URL, Screenshot, Barcode, Text
  - Mobile-first responsive design
  - Camera integration for barcode scanning
  - Image upload with preview
  - Real-time validation

### 2. **Trust Score Calculator** (NEW)
- **Location**: `packages/core/trust-score.ts` (new file)
- **Algorithm**:
  ```
  Base: 100 points
  - Banned claim (high): -40 per claim
  - Recall: -30
  - User allergen: -20 per allergen
  - Weasel words: -10 to -20 (density-based)
  + Clean bonus: +10
  = Final score (clamped 0-110)
  ```
- **Verdict Mapping**:
  - 80-110: Allow (green)
  - 50-79: Caution (amber)
  - 0-49: Avoid (red)

### 3. **Results Display** (NEW)
- **Location**: `app/consumer/pages/Results.tsx` (new file)
- **Features**:
  - Large trust score display (48px)
  - Color-coded verdict badge
  - Issue list with icons
  - "Why" drawer with score breakdown
  - Source links
  - Share functionality

### 4. **Safer Swaps** (NEW)
- **Location**: `packages/core/safer-swaps.ts` (new file)
- **Features**:
  - Suggest 3 alternatives
  - Must be 20+ points higher
  - Similar product category
  - Mock data initially
  - Click tracking

### 5. **Allergen Profile UI** (NEW)
- **Location**: `app/consumer/pages/Settings.tsx` (new file)
- **Features**:
  - Toggle switches for common allergens
  - Custom allergen input
  - Export/import JSON
  - localStorage persistence
  - Opt-in server sync

### 6. **Scan History** (NEW)
- **Location**: `app/consumer/pages/History.tsx` (new file)
- **Features**:
  - List of 50 recent scans
  - Filter by verdict
  - Search by name
  - Clear history
  - localStorage by default
  - Opt-in server sync

### 7. **PWA Features** (NEW)
- **Location**: `app/consumer/manifest.json` + service worker
- **Features**:
  - Installable app
  - Offline cache
  - Background sync
  - App icons (192x192, 512x512)
  - Standalone display mode

### 8. **POST /v1/consumer/scan API** (NEW)
- **Location**: `app/api/routes/consumer.ts` (new file)
- **Endpoint**: `POST /v1/consumer/scan`
- **Payload**:
  ```json
  {
    "input_type": "url|screenshot|text|barcode",
    "input_data": "...",
    "locale": "en-IN",
    "allergen_profile": ["peanuts", "milk"]
  }
  ```
- **Response**:
  ```json
  {
    "trust_score": 65,
    "verdict": "caution",
    "badges": [...],
    "reasons": [...],
    "suggestions": [...]
  }
  ```

### 9. **Consumer Transform Profile** (NEW)
- **Location**: `.kiro/specs/policies.yaml` (update)
- **Profile**: `claimlens_consumer`
- **Transforms**:
  1. detect.allergens
  2. detect.recalls
  3. detect.weasel_words (NEW)
  4. rewrite.disclaimer
  5. calculate.trust_score (NEW)
  6. suggest.alternatives (NEW)

### 10. **Barcode Integration** (NEW)
- **Service**: Open Food Facts API
- **Features**:
  - Barcode lookup
  - Product data extraction
  - 7-day cache
  - Rate limit handling
  - Fallback to manual input

---

## Design System (Already Documented)

All design specifications are in `docs/DESIGN_SYSTEM.md`:

### Colors
- **Ink**: #0B1220 (background)
- **Surface**: #0F1628 (cards)
- **Cloud**: #F8FAFC (text)
- **Indigo**: #4F46E5 (primary)
- **Teal**: #14B8A6 (focus)
- **Emerald**: #10B981 (Allow)
- **Amber**: #F59E0B (Caution)
- **Red**: #EF4444 (Avoid)

### B2C Accents (use sparingly)
- **Mango**: #FBBF24
- **Leaf**: #22C55E
- **Berry**: #8B5CF6
- **Sky**: #38BDF8
- **Cream**: #FEF9C3

### Glass Effect
```css
background: rgba(15, 22, 40, 0.55);
backdrop-filter: blur(14px);
border-radius: 16px;
border: 1px solid rgba(248, 250, 252, 0.1);
```

---

## UX Flows (Already Documented)

All UX specifications are in `docs/UX_SPEC.md`:

### B2C Scan Flow
```
1. Land on Scan Hub (/scan)
   ↓
2. Choose Input Method
   ├─ URL → Paste URL → Scan
   ├─ Screenshot → Upload Image → Scan
   ├─ Barcode → Open Camera → Scan
   └─ Text → Paste Text → Scan
   ↓
3. Processing (loading indicator)
   ↓
4. Results Page
   ├─ Trust Score (large)
   ├─ Verdict Badge
   ├─ Issues List
   ├─ Why Drawer
   └─ Safer Swaps
   ↓
5. Actions
   ├─ Save to History
   ├─ Share Results
   └─ Scan Another
```

---

## File Structure (To Be Created)

```
app/consumer/                    # NEW directory
├── src/
│   ├── pages/
│   │   ├── ScanHub.tsx         # NEW
│   │   ├── Results.tsx         # NEW
│   │   ├── History.tsx         # NEW
│   │   └── Settings.tsx        # NEW
│   ├── components/
│   │   ├── InputSelector.tsx   # NEW
│   │   ├── TrustScoreDisplay.tsx # NEW
│   │   ├── VerdictBadge.tsx    # NEW
│   │   ├── IssuesList.tsx      # NEW
│   │   ├── WhyDrawer.tsx       # NEW
│   │   ├── SaferSwaps.tsx      # NEW
│   │   └── AllergenToggle.tsx  # NEW
│   ├── hooks/
│   │   ├── useScan.ts          # NEW
│   │   ├── useAllergenProfile.ts # NEW
│   │   └── useScanHistory.ts   # NEW
│   ├── utils/
│   │   ├── trust-score.ts      # NEW
│   │   ├── barcode-scanner.ts  # NEW
│   │   └── image-processor.ts  # NEW
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── public/
│   ├── manifest.json            # NEW
│   ├── sw.js                    # NEW (service worker)
│   └── icons/                   # NEW
│       ├── icon-192.png
│       └── icon-512.png
├── index.html
├── vite.config.ts
└── package.json

packages/core/
├── trust-score.ts               # NEW
├── safer-swaps.ts               # NEW
└── weasel-words.ts              # NEW

app/api/routes/
└── consumer.ts                  # NEW

.kiro/specs/
└── policies.yaml                # UPDATE (add claimlens_consumer profile)
```

---

## Implementation Priority

### Phase 1: Core Scanning (Week 1)
1. Create `app/consumer/` directory structure
2. Implement Scan Hub UI with 4 input methods
3. Create POST /v1/consumer/scan API endpoint
4. Implement trust score calculator
5. Create Results display page

### Phase 2: Personalization (Week 2)
6. Implement Allergen Profile UI
7. Implement Scan History
8. Add Safer Swaps suggestions
9. Integrate barcode scanning

### Phase 3: PWA & Polish (Week 3)
10. Add PWA manifest and service worker
11. Implement offline functionality
12. Add mobile optimizations
13. Accessibility testing

### Phase 4: Integration (Week 4)
14. Connect to existing transform pipeline
15. Add consumer transform profile
16. Performance optimization
17. End-to-end testing

---

## Dependencies on Existing System

### Uses Existing:
- ✅ Transform pipeline (`packages/transforms/`)
- ✅ Rule packs (`packs/`)
- ✅ MCP services (`servers/`)
- ✅ Design tokens (`app/web/design-tokens.css`)
- ✅ API infrastructure (`app/api/`)

### Creates New:
- ❌ Consumer UI (`app/consumer/`)
- ❌ Trust score algorithm
- ❌ Consumer API endpoint
- ❌ PWA features
- ❌ Barcode integration

---

## Success Criteria

### Functional
- [ ] All 4 input methods work
- [ ] Trust score calculates correctly
- [ ] Verdict displays with correct colors
- [ ] Allergen profile saves to localStorage
- [ ] Scan history stores 50 items
- [ ] PWA installs on mobile
- [ ] Offline mode works

### Performance
- [ ] Scan Hub loads in <1s on 3G
- [ ] Trust score calculates in <50ms
- [ ] API responds in <2s at p95
- [ ] Lighthouse score >90

### Accessibility
- [ ] WCAG AA compliant (4.5:1 contrast)
- [ ] Screen reader tested
- [ ] Keyboard navigable
- [ ] Touch targets ≥44px

---

## References

- **Requirements**: `.kiro/specs/b2c-consumer-mode/requirements.md`
- **Design System**: `docs/DESIGN_SYSTEM.md`
- **UX Spec**: `docs/UX_SPEC.md`
- **Motion & A11y**: `docs/MOTION_A11Y.md`
- **Security**: `docs/SECURITY_PRIVACY.md`
- **API Spec**: `docs/API_SPEC.md`

---

**Status**: Ready for implementation
**Estimated Effort**: 4 weeks (1 developer)
**Dependencies**: None (uses existing infrastructure)
