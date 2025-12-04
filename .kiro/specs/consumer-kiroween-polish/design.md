# Design Document: Consumer Kiroween Polish

## Overview

This design document outlines the "Kiroween-grade" polish pass for ClaimLens Go, transforming the consumer experience into a premium, proof-first food claim verification app with a distinctive "Haunted Lens" aesthetic.

## Architecture

The polish pass enhances the existing React/Vite consumer app (`app/consumer/`) without architectural changes. All modifications are UI/UX focused:

```
app/consumer/
├── src/
│   ├── design-tokens.css      # Enhanced with Kiroween tokens
│   ├── kiroween-theme.css     # NEW: Haunted Lens theme styles
│   ├── pages/
│   │   ├── Home.tsx           # Landing page enhancements
│   │   ├── ScanHub.tsx        # Scan flow improvements
│   │   ├── Results.tsx        # Evidence drawer + verdict polish
│   │   ├── History.tsx        # Filter enhancements
│   │   └── Settings.tsx       # New toggles
│   └── components/
│       ├── EvidenceDrawer.tsx # NEW: Receipts reimagined
│       ├── VerdictBanner.tsx  # NEW: Spooky verdict display
│       ├── ScanProgress.tsx   # NEW: Spectral scan animation
│       ├── ProofCard.tsx      # NEW: Shareable image generator
│       └── WhatWeCheck.tsx    # NEW: Expectations callout
```

## Components and Interfaces

### Design Tokens - Kiroween Enhancement

```css
/* Kiroween Color Palette */
--kw-spectral-teal: #14B8A6;      /* Primary actions - food-safe */
--kw-spectral-mint: #2DD4BF;      /* Hover states */
--kw-ember-orange: #F59E0B;       /* Warnings */
--kw-ember-glow: #FBBF24;         /* Warning hover */
--kw-violet-policy: #8B5CF6;      /* Policy/admin accents */
--kw-violet-light: #A78BFA;       /* Violet hover */
--kw-fog-start: rgba(11, 18, 32, 0);
--kw-fog-end: rgba(11, 18, 32, 0.8);
--kw-grain-opacity: 0.03;
--kw-glow-teal: 0 0 20px rgba(20, 184, 166, 0.3);
--kw-glow-ember: 0 0 20px rgba(245, 158, 11, 0.3);
```

### VerdictBanner Component

```typescript
interface VerdictBannerProps {
  verdict: 'allow' | 'modify' | 'avoid';
  score: number;
  reason: string;
}

// Verdict microcopy mapping
const VERDICT_COPY = {
  allow: "Marked safe… for now.",
  modify: "Proceed with caution.",
  avoid: "Do not invite this into your body."
};
```

### EvidenceDrawer Component

```typescript
interface EvidenceDrawerProps {
  correlationId: string;
  rules: RuleFired[];
  matchedText: MatchedSnippet[];
  policyRefs: PolicyReference[];
  transformChain?: TransformStep[];
  proMode?: boolean;
}

interface RuleFired {
  id: string;
  name: string;
  description: string;  // Plain English
  severity: 'info' | 'warn' | 'danger';
}

interface MatchedSnippet {
  text: string;
  highlight: [number, number];  // Start, end indices
  rule: string;
}
```

### ScanProgress Component

```typescript
interface ScanProgressProps {
  stage: 'idle' | 'extract' | 'checks' | 'verdict' | 'complete' | 'error';
  error?: string;
}

// Stage labels
const STAGE_LABELS = {
  idle: 'Ready to scan',
  extract: 'Extracting content...',
  checks: 'Running policy checks...',
  verdict: 'Calculating verdict...',
  complete: 'Analysis complete',
  error: 'Something went wrong'
};
```

## Data Models

### Enhanced Scan Result

```typescript
interface KiroweenScanResult {
  product_info: ProductInfo;
  trust_score: number;  // 0-100, always displayed
  verdict: {
    label: 'allow' | 'modify' | 'avoid';
    microcopy: string;  // Kiroween-flavored
    explanation: string;
  };
  issues: GroupedIssues;
  breakdown: ScoreBreakdown;
  evidence: EvidencePackage;
  alternatives?: SaferAlternative[];
}

interface GroupedIssues {
  banned_claims: Issue[];
  allergens: Issue[];
  missing_disclaimers: Issue[];
  weasel_words: Issue[];
  recall_signals: Issue[];
}

interface EvidencePackage {
  rules_fired: RuleFired[];
  matched_text: MatchedSnippet[];
  policy_refs: PolicyReference[];
  transform_chain: TransformStep[];
  total_checks: number;
  duration_ms: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Trust Score Range Validity
*For any* scan result, the Trust Score SHALL be a number between 0 and 100 inclusive
**Validates: Requirements 4.1**

### Property 2: Verdict Consistency
*For any* Trust Score, the verdict label SHALL be deterministically derived: score >= 70 → allow, 40-69 → modify, < 40 → avoid
**Validates: Requirements 4.2**

### Property 3: Verdict Microcopy Mapping
*For any* verdict label, the corresponding Kiroween microcopy SHALL be displayed exactly as specified
**Validates: Requirements 4.3, 4.4, 4.5**

### Property 4: Issue Grouping Completeness
*For any* set of detected issues, all issues SHALL be categorized into exactly one of the five groups
**Validates: Requirements 5.1**

### Property 5: Evidence Drawer Content
*For any* expanded evidence drawer, all three required sections (rules, matched text, policy refs) SHALL be present
**Validates: Requirements 6.2, 6.3, 6.4**

### Property 6: Accessibility Focus Visibility
*For any* focused interactive element, a visible focus indicator SHALL be displayed
**Validates: Requirements 10.1**

### Property 7: Reduced Motion Respect
*For any* animation, when prefers-reduced-motion is set, the animation duration SHALL be effectively zero
**Validates: Requirements 10.2**

## Error Handling

### Scan Error States

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| Invalid URL | "That URL doesn't look right. Try pasting a product page link." | Show URL input |
| Blocked Domain | "We can't access that site. Try a screenshot instead." | Suggest screenshot |
| Unreadable Screenshot | "Couldn't read that image. Try a clearer photo or paste text." | Show alternatives |
| Network Error | "Connection issue. Your scan will resume when you're back online." | Queue for retry |
| Analysis Timeout | "Taking longer than expected. We'll notify you when ready." | Background process |

### Graceful Degradation

- If evidence data is incomplete, show available data with "Some details unavailable"
- If alternatives API fails, hide section rather than show error
- If share fails, fall back to clipboard copy

## Testing Strategy

### Unit Tests
- VerdictBanner renders correct microcopy for each verdict
- EvidenceDrawer groups issues correctly
- ScanProgress shows correct stage labels
- Trust Score display clamps to 0-100 range

### Property-Based Tests (fast-check)
- Trust Score → Verdict mapping is deterministic
- Issue grouping covers all issue types
- Focus indicators present on all interactive elements

### Accessibility Tests
- Color contrast meets WCAG AA (4.5:1 minimum)
- Focus order is logical
- Screen reader announcements are meaningful
- Reduced motion is respected

### Visual Regression Tests
- Kiroween theme renders consistently
- Verdict banners display correct colors
- Evidence drawer animations work

## UI Copy Guidelines

### Tone
- **Spooky but classy**: Subtle Halloween flavor, never cheap or gimmicky
- **Proof-first**: Always lead with evidence, not claims
- **Non-alarmist**: Factual, not fear-mongering
- **Compliance language**: "policy violation" not "dangerous"

### Key Microcopy

| Context | Copy |
|---------|------|
| Receipts header | "No tricks. Just proof." |
| Allow verdict | "Marked safe… for now." |
| Modify verdict | "Proceed with caution." |
| Avoid verdict | "Do not invite this into your body." |
| Privacy note | "Processed locally by default. Saved only if you choose." |
| Alternatives disclaimer | "Suggestions may not match all preferences… Always check labels." |

### What We Don't Say
- ❌ "This product is dangerous"
- ❌ "Medical advice"
- ❌ "Guaranteed safe"
- ❌ "Lab tested"
- ✅ "Policy violation detected"
- ✅ "Based on claim policy + allergen profile"
- ✅ "Evidence-based scoring"
