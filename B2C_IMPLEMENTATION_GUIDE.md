# B2C Consumer Mode — Implementation Guide

## 🎯 What This Is

This guide covers the **NEW B2C Consumer Mode features** that need to be implemented. These are **NOT yet built** and represent a significant extension to the existing ClaimLens system.

---

## 📊 Current Status

### ✅ What EXISTS (Already Built)
- B2B MenuShield (Admin Console, API, transforms)
- Browser Extension (basic overlay)
- Transform pipeline
- Rule packs and policies
- MCP services
- Security and observability infrastructure

### ❌ What's MISSING (To Be Built)
- **B2C Scan Hub** - Consumer-facing web app
- **Trust Score Calculator** - 0-100 scoring algorithm
- **Verdict System** - Allow/Caution/Avoid classification
- **Safer Swaps** - Alternative suggestions
- **Allergen Profile UI** - Personalization
- **Scan History** - Client-side storage
- **PWA Features** - Installable app, offline mode
- **POST /v1/consumer/scan** - New API endpoint
- **Barcode Integration** - Open Food Facts API
- **Screenshot OCR** - Image processing

---

## 📁 New Spec Location

All B2C Consumer Mode specs are in:
```
.kiro/specs/b2c-consumer-mode/
├── requirements.md      # 20 detailed requirements
├── SPEC_SUMMARY.md      # Quick reference
└── tasks.md             # 26 implementation tasks
```

---

## 🎨 Design System (Already Documented)

### Colors
```css
/* Base */
--color-ink: #0B1220;        /* Background */
--color-surface: #0F1628;    /* Cards */
--color-cloud: #F8FAFC;      /* Text */

/* Brand */
--color-indigo: #4F46E5;     /* Primary */
--color-teal: #14B8A6;       /* Focus */

/* Semantic */
--color-emerald: #10B981;    /* Allow ✅ */
--color-amber: #F59E0B;      /* Caution ⚠️ */
--color-red: #EF4444;        /* Avoid 🚫 */

/* B2C Accents (use sparingly) */
--color-mango: #FBBF24;
--color-leaf: #22C55E;
--color-berry: #8B5CF6;
--color-sky: #38BDF8;
--color-cream: #FEF9C3;
```

### Glass Effect
```css
.glass-surface {
  background: rgba(15, 22, 40, 0.55);
  backdrop-filter: blur(14px);
  border-radius: 16px;
  border: 1px solid rgba(248, 250, 252, 0.1);
}
```

---

## 🔢 Trust Score Algorithm

```typescript
function calculateTrustScore(item: MenuItem, allergenProfile: string[]): number {
  let score = 100;
  
  // Deductions
  score -= bannedClaims.length * 40;      // -40 per banned claim
  score -= recalls.length * 30;           // -30 per recall
  score -= userAllergens.length * 20;     // -20 per user allergen
  score -= weaselWordPenalty;             // -10 to -20 based on density
  
  // Bonus
  if (noIssuesFound) score += 10;         // +10 clean bonus
  
  // Clamp
  return Math.max(0, Math.min(110, score));
}

// Verdict Mapping
function getVerdict(score: number): Verdict {
  if (score >= 80) return { label: 'Allow', color: '#10B981' };
  if (score >= 50) return { label: 'Caution', color: '#F59E0B' };
  return { label: 'Avoid', color: '#EF4444' };
}
```

---

## 🏗️ File Structure (To Be Created)

```
app/consumer/                    # NEW directory
├── src/
│   ├── pages/
│   │   ├── ScanHub.tsx         # 4 input methods
│   │   ├── Results.tsx         # Trust score display
│   │   ├── History.tsx         # Scan history
│   │   └── Settings.tsx        # Allergen profile
│   ├── components/
│   │   ├── InputSelector.tsx
│   │   ├── TrustScoreDisplay.tsx
│   │   ├── VerdictBadge.tsx
│   │   ├── IssuesList.tsx
│   │   ├── WhyDrawer.tsx
│   │   ├── SaferSwaps.tsx
│   │   └── AllergenToggle.tsx
│   ├── hooks/
│   │   ├── useScan.ts
│   │   ├── useAllergenProfile.ts
│   │   └── useScanHistory.ts
│   └── utils/
│       ├── trust-score.ts
│       ├── barcode-scanner.ts
│       └── image-processor.ts
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   └── icons/
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
└── consumer.ts                  # NEW endpoint

.kiro/specs/policies.yaml        # UPDATE (add consumer profile)
```

---

## 🚀 Quick Start

### 1. Create Consumer App

```bash
# Create new directory
mkdir -p app/consumer

# Initialize Vite + React + TypeScript
cd app/consumer
pnpm create vite . --template react-ts

# Install dependencies
pnpm install
pnpm add react-router-dom zxing-js workbox-window

# Start development server
pnpm dev  # http://localhost:3002
```

### 2. Implement Core Features

Follow tasks in order:
1. **Week 1**: Scan Hub + Trust Score + Results Display
2. **Week 2**: Allergen Profile + History + Safer Swaps + Barcode
3. **Week 3**: PWA + Offline + Mobile Optimization
4. **Week 4**: Integration + Testing + Documentation

### 3. Test

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Lighthouse audit
lighthouse http://localhost:3002 --view

# Accessibility
# Run axe DevTools in browser
```

---

## 📋 Implementation Checklist

### Phase 1: Core (Week 1)
- [ ] Create app/consumer/ structure
- [ ] Implement Scan Hub with 4 input methods
- [ ] Create trust score calculator
- [ ] Implement verdict classification
- [ ] Create POST /v1/consumer/scan API
- [ ] Build Results display page

### Phase 2: Personalization (Week 2)
- [ ] Implement Allergen Profile UI
- [ ] Integrate allergen profile with scanning
- [ ] Implement Scan History
- [ ] Create Safer Swaps suggestions
- [ ] Integrate barcode scanning

### Phase 3: PWA (Week 3)
- [ ] Create PWA manifest
- [ ] Implement service worker
- [ ] Add background sync
- [ ] Mobile optimizations
- [ ] Accessibility testing

### Phase 4: Integration (Week 4)
- [ ] Create consumer transform profile
- [ ] Implement weasel word detection
- [ ] Screenshot OCR integration
- [ ] Performance optimization
- [ ] E2E testing
- [ ] Documentation

---

## 🎯 Success Criteria

### Functional
- ✅ All 4 input methods work (URL, Screenshot, Barcode, Text)
- ✅ Trust score calculates correctly (0-110 range)
- ✅ Verdict displays with correct colors
- ✅ Allergen profile saves to localStorage
- ✅ Scan history stores 50 items
- ✅ PWA installs on mobile
- ✅ Offline mode works

### Performance
- ✅ Scan Hub loads in <1s on 3G
- ✅ Trust score calculates in <50ms
- ✅ API responds in <2s at p95
- ✅ Lighthouse score >90
- ✅ Bundle size <200KB gzipped

### Accessibility
- ✅ WCAG AA compliant (4.5:1 contrast)
- ✅ Screen reader tested (NVDA, VoiceOver)
- ✅ Keyboard navigable (Tab, Enter, ESC)
- ✅ Touch targets ≥44px
- ✅ Focus indicators visible (2px Teal)

---

## 📚 Documentation References

### Specs
- **Requirements**: `.kiro/specs/b2c-consumer-mode/requirements.md`
- **Summary**: `.kiro/specs/b2c-consumer-mode/SPEC_SUMMARY.md`
- **Tasks**: `.kiro/specs/b2c-consumer-mode/tasks.md`

### Design
- **Design System**: `docs/DESIGN_SYSTEM.md`
- **UX Spec**: `docs/UX_SPEC.md`
- **Motion & A11y**: `docs/MOTION_A11Y.md`

### Technical
- **Security**: `docs/SECURITY_PRIVACY.md`
- **API Spec**: `docs/API_SPEC.md`
- **Observability**: `docs/OBSERVABILITY.md`
- **CI/CD**: `docs/CI_CD.md`

### Operations
- **Runbook**: `docs/RUNBOOK.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

---

## 🔗 API Endpoint Spec

### POST /v1/consumer/scan

**Request:**
```json
{
  "input_type": "url|screenshot|text|barcode",
  "input_data": "...",
  "locale": "en-IN",
  "allergen_profile": ["peanuts", "milk"]
}
```

**Response:**
```json
{
  "trust_score": 65,
  "verdict": {
    "label": "caution",
    "color": "#F59E0B",
    "explanation": "This item has some concerns worth reviewing"
  },
  "badges": [
    {
      "kind": "claim_warning",
      "label": "Health Claim",
      "explanation": "Contains unverified health claims",
      "source": "https://fssai.gov.in/claims-guidelines"
    },
    {
      "kind": "allergen",
      "label": "Contains: Peanuts",
      "explanation": "This item contains peanuts which may cause allergic reactions"
    }
  ],
  "reasons": [
    {
      "transform": "detect.allergens",
      "why": "Contains allergen: peanuts",
      "source": "packs/allergens.in.yaml"
    }
  ],
  "suggestions": [
    {
      "name": "Almond Butter Bowl",
      "trust_score": 85,
      "differences": "No peanuts, verified claims"
    }
  ],
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 💡 Key Decisions

### Why Separate from Existing Extension?
- Different user persona (individual vs. business)
- Different UX (simple scan vs. overlay)
- Different features (trust score vs. compliance)
- Can share backend infrastructure

### Why Client-Side Storage?
- Privacy-first approach
- Faster performance
- Works offline
- No server costs for storage

### Why PWA Instead of Native App?
- Cross-platform (iOS + Android)
- No app store approval
- Instant updates
- Smaller download size

### Why Open Food Facts?
- Free and open database
- Good coverage
- Active community
- API available

---

## 🎬 Demo Script (3 minutes)

### Minute 1: Scan Flow
1. Open Scan Hub
2. Choose Screenshot input
3. Upload menu image
4. Show loading indicator
5. Display results with trust score

### Minute 2: Personalization
1. Configure allergen profile (add peanuts)
2. Scan item with peanuts
3. Show personalized warning
4. View scan history
5. See safer swaps

### Minute 3: PWA & Offline
1. Install PWA on mobile
2. Go offline
3. View scan history
4. Queue new scan
5. Go online and sync

---

## ❓ FAQ

**Q: Do I need to rebuild the existing system?**
A: No! B2C Consumer Mode is a new addition that uses existing infrastructure.

**Q: Can I reuse existing components?**
A: Yes! Reuse design tokens, API infrastructure, transform pipeline, and rule packs.

**Q: How long will this take?**
A: Estimated 4 weeks for 1 developer following the task list.

**Q: What if I get stuck?**
A: Refer to `docs/TROUBLESHOOTING.md` and existing code in `app/admin/` for patterns.

**Q: Do I need to implement all features?**
A: Core features (Scan Hub, Trust Score, Results) are required. Others can be phased.

---

## 🚦 Ready to Start?

1. **Read**: `.kiro/specs/b2c-consumer-mode/requirements.md`
2. **Review**: `.kiro/specs/b2c-consumer-mode/SPEC_SUMMARY.md`
3. **Follow**: `.kiro/specs/b2c-consumer-mode/tasks.md`
4. **Build**: Start with Task 1.1!

---

**Status**: ✅ Spec Complete, Ready for Implementation
**Effort**: 4 weeks (1 developer)
**Priority**: High (completes dual-mode vision)
