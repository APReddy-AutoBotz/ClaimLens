# Trust Score System Usage

## Overview

The trust score system calculates a 0-110 score for food products based on detected issues and provides consumer-friendly verdicts.

## Core Functions

### `calculateTrustScore(input: TrustScoreInput): TrustScoreResult`

Calculates trust score based on detected issues.

**Input:**
```typescript
{
  bannedClaimsCount: number;      // Number of banned health claims
  hasRecall: boolean;             // Product has active recall
  userAllergensCount: number;     // Number of user's allergens detected
  weaselWordDensity: number;      // 0-1 (percentage as decimal)
}
```

**Output:**
```typescript
{
  score: number;                  // Final score (0-110)
  breakdown: {
    baseScore: 100,
    bannedClaimsDeduction: number,
    recallDeduction: number,
    allergenDeduction: number,
    weaselWordDeduction: number,
    cleanBonus: number,
    finalScore: number
  }
}
```

**Scoring Rules:**
- Base score: 100
- Banned claims: -40 per claim
- Recalls: -30
- User allergens: -20 per allergen
- Weasel words: -10 to -20 based on density
  - >20% density: -20 points
  - 10-20% density: -15 points
  - 5-10% density: -10 points
  - <5% density: no deduction
- Clean bonus: +10 if no issues (max score 110)

### `getVerdict(score: number): Verdict`

Maps trust score to consumer-friendly verdict.

**Output:**
```typescript
{
  label: 'allow' | 'caution' | 'avoid';
  color: string;                  // Hex color code
  icon: string;                   // Unicode icon
  explanation: string;            // Consumer-friendly explanation
}
```

**Verdict Mapping:**
- 80-110: Allow (green #10B981)
- 50-79: Caution (amber #F59E0B)
- 0-49: Avoid (red #EF4444)

## Usage Example

```typescript
import { calculateTrustScore, getVerdict } from '@claimlens/core/trust-score';

// Calculate score
const result = calculateTrustScore({
  bannedClaimsCount: 1,
  hasRecall: false,
  userAllergensCount: 0,
  weaselWordDensity: 0.08,
});

console.log(result.score); // 50
console.log(result.breakdown);

// Get verdict
const verdict = getVerdict(result.score);
console.log(verdict.label); // "caution"
console.log(verdict.explanation); // "This product has some concerns..."
```

## React Component

### `VerdictBadge`

Displays verdict as a color-coded badge.

```tsx
import { VerdictBadge } from '@claimlens/consumer/components/VerdictBadge';
import { getVerdict } from '@claimlens/core/trust-score';

function Results({ score }: { score: number }) {
  const verdict = getVerdict(score);
  
  return (
    <div>
      <h1>Trust Score: {score}</h1>
      <VerdictBadge verdict={verdict} />
      <p>{verdict.explanation}</p>
    </div>
  );
}
```

## Performance

- `calculateTrustScore()`: <50ms (pure function)
- `getVerdict()`: <1ms (simple mapping)

## Accessibility

- VerdictBadge has `role="status"` for screen readers
- Icons are marked `aria-hidden="true"`
- WCAG AA compliant contrast ratios (≥4.5:1)
- Keyboard navigable with visible focus indicators
