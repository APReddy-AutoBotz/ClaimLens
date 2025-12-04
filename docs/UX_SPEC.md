# UX Specification — ClaimLens

## Overview

ClaimLens serves two distinct user groups with tailored experiences: B2B publishers (MenuShield) and B2C consumers (ClaimLens Go).

---

## 1. Information Architecture

### B2B (MenuShield Admin Console)

```
ClaimLens Admin Console
├── Dashboard
│   ├── KPI Cards (Audits, Flags, Latency)
│   ├── Recent Audits Table
│   └── Degraded Mode Banner (conditional)
│
├── Review Queue
│   ├── Bulk Actions (Allow/Modify/Block)
│   ├── Before/After Slider
│   ├── "Why" Chips with Sources
│   └── Export Cleaned NDJSON
│
├── Profiles & Routes
│   ├── Profile List
│   ├── Transform Pipeline Editor (drag-and-drop)
│   ├── Latency Budgets
│   ├── Preview on Fixtures
│   └── Augment-Lite Gate (risky edits)
│
├── Rule Packs
│   ├── Banned Claims Editor
│   ├── Allergens Database
│   ├── Disclaimers per Locale
│   ├── Version History & Diffs
│   └── Test Against Fixtures
│
├── Fixtures Runner
│   ├── Select Fixtures (menu/sites)
│   ├── Run Button
│   ├── Results Table (flags, warnings, errors)
│   ├── p50/p95 Latency Metrics
│   └── Link to Audit Pack
│
└── Audits
    ├── Search & Filters
    ├── Audit Detail View
    ├── Before/After Comparison
    ├── Reasons with Sources
    ├── Performance Metrics
    └── Download (JSONL/Markdown)
```

### B2C (ClaimLens Go Extension)

```
ClaimLens Go
├── Content Overlay (on food delivery sites)
│   ├── Allergen Badges
│   ├── Claim Warning Badges
│   ├── Tooltips (on click)
│   └── Progressive Scan (viewport-first)
│
├── Side Panel (extension icon click)
│   ├── Flagged Items List
│   ├── Locale Toggle (en-IN/en-US/en-GB)
│   ├── Allergen Profile Settings
│   ├── Scan History (opt-in)
│   └── Domain Allowlist Management
│
├── Scan Hub (standalone page)
│   ├── Input Methods (URL/Screenshot/Text/Barcode)
│   ├── Trust Score (0-100)
│   ├── Verdict (Allow/Caution/Avoid)
│   ├── Badges (claim_warning/allergen/pii)
│   ├── Reasons with Sources
│   └── Safer Swaps (suggestions)
│
└── Settings
    ├── Allergen Profile (toggles)
    ├── Diet Preferences
    ├── Consent Management
    ├── Domain Allowlist
    └── Data Export/Delete
```

---

## 2. User Flows

### B2B Flow: Menu Validation

```
1. Upload Menu
   ↓
2. System Processes (menushield_in profile)
   ↓
3. Review Queue
   ├── Item 1: ⚠️ Modify (banned claim detected)
   ├── Item 2: ✅ Allow (clean)
   └── Item 3: 🚫 Block (allergen mismatch)
   ↓
4. Bulk Actions
   ├── Select items
   ├── Apply suggested disclaimers
   └── Export cleaned NDJSON
   ↓
5. Publish
```

**Key Interactions:**
- Drag to reorder transforms
- Click "why" chip → see source link
- Slider to compare before/after
- One-click "Apply all suggestions"

### B2C Flow: Safe Ordering

```
1. Visit Food Delivery Site (e.g., Swiggy)
   ↓
2. Extension Scans Viewport (≤200ms)
   ↓
3. Badges Appear on Items
   ├── 🥜 Allergen: Peanuts
   ├── ⚠️ Claim Warning
   └── ✅ Safe
   ↓
4. Click Badge → Tooltip
   ├── "Contains peanuts which may cause allergic reactions"
   ├── Source: packs/allergens.in.yaml
   └── [View Details]
   ↓
5. Click Extension Icon → Side Panel
   ├── All flagged items on page
   ├── Change locale
   └── View scan history
```

**Key Interactions:**
- Hover badge → preview
- Click badge → full explanation
- ESC → close tooltip/panel
- Scroll → progressive scan (infinite scroll support)

### B2C Flow: Scan Hub (Standalone)

```
1. Open ClaimLens Go App
   ↓
2. Choose Input Method
   ├── Paste URL
   ├── Upload Screenshot
   ├── Paste Text
   └── Scan Barcode
   ↓
3. System Analyzes
   ↓
4. Results Screen
   ├── Trust Score: 65/100
   ├── Verdict: ⚠️ Caution
   ├── Badges:
   │   ├── Claim Warning: "Superfood"
   │   └── Allergen: Peanuts
   ├── Reasons:
   │   ├── "Detected banned claim: superfood"
   │   └── "Contains allergen: peanuts"
   └── Safer Swaps:
       ├── "Nutrient-rich Bowl" (similar, safer)
       └── "Quinoa Power Bowl" (no peanuts)
   ↓
5. Actions
   ├── Save to History (opt-in)
   ├── Share Results
   └── Report Issue
```

---

## 3. Screen Designs

### B2B: Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ ClaimLens Admin Console                    [User Menu] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⚠️ System Operating in Degraded Mode                   │
│ Service ocr.label unavailable. Using text-only...      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│ │ 12,543   │  │ 1,234    │  │ 145ms    │             │
│ │ Audits   │  │ Flagged  │  │ Avg Time │             │
│ │ ↑ 12%    │  │ ↓ 8%     │  │ ↑ 5ms    │             │
│ └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│ Recent Audits                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Time     │ Item Name        │ Verdict │ Audit ID│   │
│ ├─────────────────────────────────────────────────┤   │
│ │ 10:30 AM │ Superfood Bowl   │ Modify  │ #12543 │   │
│ │ 10:28 AM │ Green Smoothie   │ Allow   │ #12542 │   │
│ │ 10:25 AM │ Detox Juice      │ Block   │ #12541 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### B2B: Review Queue

```
┌─────────────────────────────────────────────────────────┐
│ Review Queue                    [Export NDJSON] [Bulk] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☐ Superfood Power Bowl                    ⚠️ Modify   │
│   ┌─────────────────────────────────────────────────┐ │
│   │ Before                │ After                   │ │
│   ├───────────────────────┼─────────────────────────┤ │
│   │ Superfood Power Bowl  │ Nutrient-rich Power     │ │
│   │                       │ Bowl (This claim has    │ │
│   │                       │ not been evaluated by   │ │
│   │                       │ FSSAI)                  │ │
│   └─────────────────────────────────────────────────┘ │
│   Why: [Banned claim: superfood] [Source: FSSAI]     │
│   [Apply Suggestion] [Edit Manually] [Skip]          │
│                                                         │
│ ☐ Green Smoothie                          ✅ Allow    │
│   No issues detected                                   │
│                                                         │
│ ☐ Miracle Detox Juice                     🚫 Block   │
│   Why: [Multiple banned claims] [Missing allergen]   │
│   [View Details] [Override]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### B2C: Content Overlay

```
┌─────────────────────────────────────────────────────────┐
│ Swiggy - Order Food Online                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────┐  ┌─────────────────────┐  │
│ │ Superfood Power Bowl    │  │ Green Smoothie      │  │
│ │ ₹299                    │  │ ₹199                │  │
│ │ [⚠️ Claim Warning]      │  │ [✅ Safe]           │  │
│ │ [🥜 Allergen: Peanuts]  │  │                     │  │
│ └─────────────────────────┘  └─────────────────────┘  │
│                                                         │
│ ┌─────────────────────────┐  ┌─────────────────────┐  │
│ │ Detox Juice             │  │ Protein Shake       │  │
│ │ ₹149                    │  │ ₹249                │  │
│ │ [⚠️ Claim Warning]      │  │ [✅ Safe]           │  │
│ └─────────────────────────┘  └─────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### B2C: Scan Hub

```
┌─────────────────────────────────────────────────────────┐
│ ClaimLens Go - Scan Food                    [Settings] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ How would you like to scan?                            │
│                                                         │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│ │ 🔗 URL   │  │ 📷 Photo │  │ 📝 Text  │  │ 📊 Bar │ │
│ └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Paste URL or upload image...                    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Scan Now]                                             │
│                                                         │
│ Recent Scans (opt-in)                                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Superfood Bowl - ⚠️ Caution - 2 hours ago       │   │
│ │ Green Smoothie - ✅ Safe - 1 day ago            │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### B2C: Results Screen

```
┌─────────────────────────────────────────────────────────┐
│ ← Back                                      [Share] [⋮] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Superfood Power Bowl                                   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │         Trust Score                             │   │
│ │                                                 │   │
│ │            65/100                               │   │
│ │         ⚠️ Caution                              │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Issues Found                                           │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ⚠️ Claim Warning                                │   │
│ │ Contains unverified health claims. This claim   │   │
│ │ has not been evaluated by FSSAI.                │   │
│ │ Source: FSSAI Guidelines                        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🥜 Allergen: Peanuts                            │   │
│ │ This item contains peanuts which may cause      │   │
│ │ allergic reactions.                             │   │
│ │ Source: packs/allergens.in.yaml                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Safer Alternatives                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Nutrient-rich Bowl                              │   │
│ │ Similar taste, compliant claims                 │   │
│ │ [View Details]                                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Interaction Patterns

### Drag-and-Drop (Transform Reordering)

```typescript
// Visual feedback during drag
.transform-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.transform-item.drag-over {
  border-top: 2px solid var(--color-teal);
}

// Haptic feedback (if supported)
if ('vibrate' in navigator) {
  navigator.vibrate(10); // 10ms vibration on drop
}
```

### Before/After Slider

```html
<div class="comparison-slider">
  <div class="comparison-slider__before">
    <p>Superfood Power Bowl</p>
  </div>
  <div class="comparison-slider__after">
    <p>Nutrient-rich Power Bowl (This claim has not been evaluated by FSSAI)</p>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    value="50"
    class="comparison-slider__handle"
    aria-label="Slide to compare before and after"
  />
</div>
```

### "Why" Chips

```html
<div class="reason-chips">
  <button class="chip chip--warning" aria-describedby="reason-1">
    Banned claim: superfood
  </button>
  <div id="reason-1" role="tooltip" class="chip-tooltip">
    <p>The term "superfood" is not recognized by FSSAI and may mislead consumers.</p>
    <a href="https://fssai.gov.in/claims-guidelines" target="_blank">
      View FSSAI Guidelines →
    </a>
  </div>
</div>
```

### Progressive Scan Indicator

```html
<div class="scan-progress" role="status" aria-live="polite">
  <div class="scan-progress__bar" style="width: 60%"></div>
  <span class="sr-only">Scanning: 12 of 20 items processed</span>
  <span aria-hidden="true">12/20 items</span>
</div>
```

---

## 5. Empty States

### No Audits Yet

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    📊                                   │
│                                                         │
│           No audits yet                                │
│                                                         │
│   Upload your first menu to get started                │
│                                                         │
│   [Upload Menu JSON]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### No Flags Found

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ✅                                   │
│                                                         │
│           All clear!                                   │
│                                                         │
│   No issues found in this scan                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Loading States

### Skeleton Screens

```html
<div class="kpi-card skeleton">
  <div class="skeleton-text skeleton-text--sm"></div>
  <div class="skeleton-text skeleton-text--lg"></div>
  <div class="skeleton-text skeleton-text--xs"></div>
</div>

<style>
.skeleton {
  animation: shimmer 1.5s infinite;
  background: linear-gradient(
    90deg,
    rgba(248, 250, 252, 0.05) 0%,
    rgba(248, 250, 252, 0.1) 50%,
    rgba(248, 250, 252, 0.05) 100%
  );
  background-size: 200% 100%;
}

.skeleton-text {
  height: 1em;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.skeleton-text--sm { width: 40%; }
.skeleton-text--lg { width: 80%; }
.skeleton-text--xs { width: 30%; }
</style>
```

### Spinner

```html
<div class="spinner" role="status" aria-label="Loading">
  <svg viewBox="0 0 50 50">
    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" />
  </svg>
  <span class="sr-only">Loading...</span>
</div>

<style>
.spinner svg {
  animation: rotate 1s linear infinite;
}

.spinner circle {
  stroke-dasharray: 1, 150;
  stroke-dashoffset: 0;
  animation: dash 1.5s ease-in-out infinite;
  stroke-linecap: round;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
```

---

## 7. Error States

### API Error

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ⚠️                                   │
│                                                         │
│           Something went wrong                         │
│                                                         │
│   We couldn't process your request. Please try again. │
│                                                         │
│   [Try Again]  [Contact Support]                      │
│                                                         │
│   Error ID: 550e8400-e29b-41d4-a716-446655440000      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Validation Error

```html
<div class="form-group">
  <label for="menu-name">Menu Name</label>
  <input
    id="menu-name"
    type="text"
    class="input input--error"
    aria-invalid="true"
    aria-describedby="menu-name-error"
  />
  <span id="menu-name-error" class="error-message" role="alert">
    Menu name is required
  </span>
</div>
```

---

## 8. Success States

### Confirmation Toast

```html
<div class="toast toast--success" role="status" aria-live="polite">
  <svg class="toast__icon">✓</svg>
  <span>Changes saved successfully</span>
  <button class="toast__close" aria-label="Close">×</button>
</div>

<style>
.toast {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  animation: slideUp 180ms ease-out;
  box-shadow: var(--shadow-lg);
}

.toast--success {
  border-left: 4px solid var(--color-emerald);
}
</style>
```

---

## 9. Responsive Breakpoints

### Mobile (< 640px)

- Stack KPI cards vertically
- Hide secondary columns in tables
- Collapse side panel to full-screen overlay
- Increase touch targets to 48×48px

### Tablet (640px - 1024px)

- 2-column KPI grid
- Show essential table columns
- Side panel as drawer (50% width)

### Desktop (> 1024px)

- 3-column KPI grid
- Full table with all columns
- Side panel as overlay (400px fixed width)

---

## 10. Micro-Interactions

### Button Press

```css
.btn:active {
  transform: scale(0.98);
}
```

### Card Hover

```css
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Badge Pulse (New Item)

```css
.badge--new {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

---

## 11. Accessibility Annotations

Every screen must include:

```html
<!-- Page title -->
<title>Dashboard - ClaimLens Admin Console</title>

<!-- Skip link -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Main landmark -->
<main id="main-content" tabindex="-1">
  <!-- Content -->
</main>

<!-- ARIA live region for announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Dynamic announcements -->
</div>
```

---

## 12. References

- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Components](https://inclusive-components.design/)
