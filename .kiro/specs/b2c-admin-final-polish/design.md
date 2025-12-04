# Design Document: B2C & Admin Final Polish

## Overview

This design document outlines targeted enhancements to complete the ClaimLens B2C consumer app and Admin dashboard. These are surgical improvements that address specific UX gaps: real product name display throughout the consumer app, enhanced visual depth with premium effects, and robust demo data for the admin dashboard.

## Architecture

No architectural changes. All modifications are UI/UX enhancements to existing components:

### B2C Consumer App
```
app/consumer/
├── src/
│   ├── kiroween-theme.css        # Enhanced glass depth + ghost light
│   ├── pages/
│   │   ├── History.tsx            # Show real product names
│   │   └── Results.tsx            # Add Product Header
│   ├── components/
│   │   ├── ProductHeader.tsx      # NEW: Product name display
│   │   └── HistoryCard.tsx        # Enhanced with product identity
│   └── hooks/
│       └── useScanHistory.ts      # Support rename action
```

### Admin Dashboard
```
app/admin/
├── src/
│   ├── api.ts                     # Enhanced demo data generation
│   ├── pages/
│   │   ├── Dashboard.tsx          # Never blank, better filters
│   │   ├── AuditViewer.tsx        # Add empty states
│   │   ├── ProfilesEditor.tsx     # Add empty states
│   │   └── RulePacksEditor.tsx    # Add empty states
│   └── components/
│       ├── FilterBar.tsx          # Multiple filter options
│       ├── EmptyState.tsx         # NEW: Consistent empty states
│       └── ErrorBoundary.tsx      # Enhanced route-level errors
```

## Components and Interfaces

### ProductIdentity Interface

```typescript
interface ProductIdentity {
  name: string;                    // Required: "Organic Almond Milk"
  brand?: string;                  // Optional: "Silk"
  category?: string;               // Optional: "Dairy Alternative"
  sourceType: 'url' | 'screenshot' | 'barcode' | 'text';
  sourceLabel?: string;            // Optional: "amazon.com" or "UPC 123456"
}
```

### Enhanced ScanResult

```typescript
interface ScanResult {
  // ... existing fields
  productIdentity: ProductIdentity;  // NEW: Always present
  timestamp: number;
  correlationId: string;
}
```

### ProductHeader Component

```typescript
interface ProductHeaderProps {
  productIdentity: ProductIdentity;
  onRename?: (newName: string) => void;  // Optional rename callback
}

// Renders:
// - Large product name
// - Small brand/category (if available)
// - Source chip with icon (url/screenshot/barcode/text)
// - Rename button (if onRename provided)
```

### Enhanced FilterBar Data

```typescript
interface FilterOptions {
  tenants: string[];               // ["tenant_1", "tenant_2", "tenant_3"]
  profiles: string[];              // ["Default", "Strict", "Permissive"]
  timeRanges: string[];            // ["24h", "7d", "30d"]
}

interface DemoAuditItem {
  id: string;
  productName: string;             // Real product name
  verdict: 'allow' | 'modify' | 'avoid';
  severity: 'low' | 'medium' | 'high';
  tags: string[];
  profile: string;
  tenant: string;
  timestamp: number;
}
```

### EmptyState Component

```typescript
interface EmptyStateProps {
  icon?: string;                   // Optional icon name
  title: string;                   // "No data yet"
  description?: string;            // Optional explanation
  ctaLabel?: string;               // "Run Demo Audit"
  onCtaClick?: () => void;         // CTA action
}
```

## Data Models

### Demo Product Names

Realistic product names for demo scans:

```typescript
const DEMO_PRODUCTS = [
  { name: "Organic Almond Milk", brand: "Silk", category: "Dairy Alternative" },
  { name: "Grass-Fed Beef Jerky", brand: "Epic", category: "Snacks" },
  { name: "Gluten-Free Pasta", brand: "Barilla", category: "Pasta" },
  { name: "Cold Brew Coffee", brand: "Stumptown", category: "Beverages" },
  { name: "Probiotic Yogurt", brand: "Chobani", category: "Dairy" },
  { name: "Protein Bar", brand: "RXBAR", category: "Snacks" },
  { name: "Kombucha", brand: "GT's", category: "Beverages" },
  { name: "Coconut Water", brand: "Vita Coco", category: "Beverages" }
];
```

### Demo Audit Items

```typescript
const DEMO_AUDIT_ITEMS: DemoAuditItem[] = [
  {
    id: "audit_001",
    productName: "Organic Almond Milk",
    verdict: "allow",
    severity: "low",
    tags: ["Allergen"],
    profile: "Default",
    tenant: "tenant_1",
    timestamp: Date.now() - 3600000
  },
  {
    id: "audit_002",
    productName: "Grass-Fed Beef Jerky",
    verdict: "modify",
    severity: "medium",
    tags: ["Banned Claim", "Missing Disclaimer"],
    profile: "Strict",
    tenant: "tenant_2",
    timestamp: Date.now() - 7200000
  },
  {
    id: "audit_003",
    productName: "Gluten-Free Pasta",
    verdict: "avoid",
    severity: "high",
    tags: ["Banned Claim", "Recall"],
    profile: "Permissive",
    tenant: "tenant_3",
    timestamp: Date.now() - 10800000
  }
  // ... more items for variety
];
```

## Visual Design Enhancements

### Glass Depth Enhancement

```css
/* Strengthened glass surface */
.glass-surface {
  background: rgba(15, 22, 40, 0.65);  /* Increased from 0.55 */
  backdrop-filter: blur(16px);          /* Increased from 12px */
  border: 1px solid rgba(248, 250, 252, 0.12);  /* Increased from 0.1 */
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(248, 250, 252, 0.05);  /* Inner highlight */
}
```

### Ghost Light Accent

```css
/* Subtle glow on interactive elements */
.ghost-light-teal {
  box-shadow: 0 0 16px rgba(20, 184, 166, 0.2);
}

.ghost-light-violet {
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.2);
}

/* On hover */
.ghost-light-teal:hover {
  box-shadow: 0 0 24px rgba(20, 184, 166, 0.3);
}
```

### Mist Gradient Background

```css
/* Very subtle, non-distracting */
.mist-gradient {
  background: radial-gradient(
    ellipse at 50% 20%,
    rgba(20, 184, 166, 0.03) 0%,
    rgba(11, 18, 32, 0) 50%
  );
}

/* Disabled for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .mist-gradient {
    background: none;
  }
}
```

### Ember Accent (Warnings Only)

```css
/* Only for Avoid/Caution states */
.ember-accent {
  border-left: 3px solid var(--kw-ember-orange);
  background: rgba(245, 158, 11, 0.05);
}

.ember-glow {
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.15);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Product Identity Presence
*For any* scan result, the productIdentity object SHALL be present with at minimum a name and sourceType
**Validates: Requirements 1.1**

### Property 2: Product Name Display Consistency
*For any* scan result displayed in History or Results, the product name shown SHALL match the productIdentity.name field
**Validates: Requirements 1.2, 1.3**

### Property 3: Unknown Item Fallback
*For any* scan result with missing or empty product name, the display SHALL show "Unknown Item" with a Rename action
**Validates: Requirements 1.4**

### Property 4: Demo Product Name Validity
*For any* demo scan generated, the product name SHALL be a non-placeholder meaningful string
**Validates: Requirements 1.6**

### Property 5: Filter Options Multiplicity
*For any* admin dashboard in demo mode, tenant and profile filters SHALL have at least 3 options each
**Validates: Requirements 3.1, 3.2**

### Property 6: Page Non-Blankness
*For any* admin page load, the page SHALL render either data rows OR an empty state with title and description
**Validates: Requirements 3.4**

### Property 7: Verdict Variety in Demo
*For any* populated Action Queue in demo mode, the items SHALL include at least one of each verdict type (allow, modify, avoid)
**Validates: Requirements 3.7**

### Property 8: Contrast Preservation
*For any* visual enhancement applied, the resulting contrast ratio SHALL meet or exceed WCAG AA requirements (4.5:1 for text)
**Validates: Requirements 2.5**

## Error Handling

### B2C Error States

| Scenario | Handling |
|----------|----------|
| Missing product name | Display "Unknown Item" + Rename button |
| Rename fails | Show toast: "Couldn't rename. Try again." |
| Invalid product identity | Use fallback: { name: "Unknown Item", sourceType: "text" } |

### Admin Error States

| Scenario | Handling |
|----------|----------|
| Route-level error | Show ErrorBoundary with "Return to Dashboard" |
| Empty data | Show EmptyState with "Run Demo Audit" CTA |
| Filter returns no results | Show "No items match filters" with "Clear Filters" |
| Demo data generation fails | Fall back to minimal single-item demo |

## Testing Strategy

### Unit Tests
- ProductHeader renders product name, brand, category correctly
- ProductHeader shows "Unknown Item" when name is missing
- EmptyState renders with CTA button
- FilterBar populates with multiple options
- Demo data generator creates varied verdicts

### Property-Based Tests (fast-check)
- Product identity always has name and sourceType
- Product names in History/Results match scan result data
- Demo products never use placeholder text
- Filter options always have 3+ items
- Action Queue always has verdict variety

### Visual Tests
- Glass depth enhancement maintains contrast
- Ghost light glow is subtle and non-distracting
- Mist gradient doesn't interfere with readability
- Ember accent only appears on warnings

### Accessibility Tests
- All visual enhancements maintain WCAG AA contrast
- Focus indicators remain visible with new effects
- Reduced motion disables mist gradient and glows

## Implementation Notes

### B2C Product Names

1. **Capture at scan time**: When creating scan result, extract product name from:
   - URL: Use page title or meta tags
   - Screenshot: Use OCR to find product name
   - Barcode: Use Open Food Facts API product name
   - Text: Use first line or user-provided name

2. **Fallback strategy**: If extraction fails, use "Unknown Item" but allow rename

3. **Storage**: Store productIdentity in localStorage with scan history

### Admin Demo Data

1. **Seed on mount**: Generate demo data when Dashboard mounts in demo mode

2. **Client-side filtering**: Filter demo items by selected tenant/profile without API calls

3. **Persistent across session**: Store demo data in sessionStorage to maintain consistency

4. **Variety guarantee**: Ensure at least one item of each verdict type in initial seed

### Visual Enhancements

1. **Progressive enhancement**: Apply effects only if browser supports backdrop-filter

2. **Performance**: Use CSS transforms and opacity for animations (GPU-accelerated)

3. **Reduced motion**: Disable all glows, gradients, and animations when preference is set

4. **Contrast testing**: Automated tests verify all color combinations meet WCAG AA

## Migration Strategy

### B2C Changes
- Existing scan results without productIdentity: Add migration to populate from available data
- History items: Add "Unknown Item" for legacy scans without names
- No breaking changes to API contracts

### Admin Changes
- Existing components: Enhance with empty states, no removal of functionality
- Demo mode: Additive only, doesn't affect real data mode
- Filter bar: Backwards compatible with single-option filters

## Success Criteria

- ✅ History page shows real product names for all scans
- ✅ Results page has Product Header with name/brand/source
- ✅ Admin dropdowns have 3+ options in demo mode
- ✅ No admin pages render blank (all have empty states)
- ✅ Action Queue has varied verdicts (allow/modify/avoid)
- ✅ Glass depth is visibly enhanced but maintains contrast
- ✅ Ghost light effects are subtle and professional
- ✅ All WCAG AA accessibility checks pass
- ✅ Reduced motion preference is respected
