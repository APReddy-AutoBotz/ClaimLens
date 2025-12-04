# Trust Score Algorithm

## Overview

The Trust Score is a 0-110 numerical score that indicates the safety and claim accuracy of a food product. It's designed to be simple, transparent, and consumer-friendly.

## Algorithm

### Base Score
- Start with **100 points**

### Deductions

#### 1. Banned Health Claims (-40 points each)
Detects marketing claims that are not scientifically substantiated or are prohibited by regulatory bodies (FSSAI, FDA, FSA).

**Examples:**
- "Superfood"
- "Detox"
- "Miracle cure"
- "Boosts immunity"
- "Burns fat"

**Why -40 points?**
These claims are misleading and potentially harmful. They represent the most serious violations.

**Source:** FSSAI Food Safety Standards, FDA Health Claims Regulations

#### 2. Product Recalls (-30 points)
Detects if the product has been recalled by regulatory authorities.

**Why -30 points?**
Recalls indicate serious safety issues that could harm consumers.

**Source:** MCP recall.lookup service

#### 3. User Allergens (-20 points each)
Detects allergens that match the user's configured allergen profile.

**Why -20 points per allergen?**
Allergens can cause severe reactions in sensitive individuals. This is personalized to each user.

**Common allergens:**
- Peanuts
- Tree Nuts
- Milk
- Eggs
- Fish
- Shellfish
- Soy
- Wheat
- Sesame

#### 4. Weasel Words (-10 to -20 points)
Detects vague marketing language that lacks specificity.

**Examples:**
- "May help"
- "Could support"
- "Up to"
- "As much as"
- "Helps"
- "Supports"

**Scoring:**
- **>20% density**: -20 points (excessive vague claims)
- **10-20% density**: -15 points (moderate vague claims)
- **5-10% density**: -10 points (some vague claims)

**Why variable deduction?**
The density of weasel words indicates how misleading the marketing is.

### Bonus

#### Clean Bonus (+10 points)
If **no issues** are detected, add 10 bonus points.

**Why +10 points?**
Rewards products with clean, honest marketing.

### Final Score
- Clamp to **0-110 range**
- Scores above 100 indicate exceptionally clean products

## Verdict Classification

### Allow (80-110) - Green
- **Color:** #10B981 (Green)
- **Icon:** ✓
- **Explanation:** "This product appears safe with minimal concerns"

### Caution (50-79) - Amber
- **Color:** #F59E0B (Amber)
- **Icon:** ⚠
- **Explanation:** "This product has some concerns worth reviewing"

### Avoid (0-49) - Red
- **Color:** #EF4444 (Red)
- **Icon:** ✕
- **Explanation:** "This product has significant concerns"

## Examples

### Example 1: Clean Product
**Input:** "Organic whole wheat flour. Ingredients: 100% whole wheat."

**Calculation:**
- Base: 100
- Banned claims: 0
- Recalls: 0
- User allergens: 0 (assuming no wheat allergy)
- Weasel words: 0
- Clean bonus: +10

**Final Score:** 110
**Verdict:** Allow (Green)

### Example 2: Product with Weasel Words
**Input:** "Natural energy drink. May help boost energy. Could support focus."

**Calculation:**
- Base: 100
- Banned claims: 0
- Recalls: 0
- User allergens: 0
- Weasel words: -15 (moderate density)
- Clean bonus: 0

**Final Score:** 85
**Verdict:** Allow (Green)

### Example 3: Product with Banned Claims
**Input:** "Superfood smoothie with detox properties. Boosts immunity naturally."

**Calculation:**
- Base: 100
- Banned claims: -80 (2 claims: "superfood", "detox")
- Recalls: 0
- User allergens: 0
- Weasel words: 0
- Clean bonus: 0

**Final Score:** 20
**Verdict:** Avoid (Red)

### Example 4: Product with User Allergen
**Input:** "Peanut butter cookies. Contains peanuts, wheat, and milk."

**Calculation (user allergic to peanuts and milk):**
- Base: 100
- Banned claims: 0
- Recalls: 0
- User allergens: -40 (2 allergens: peanuts, milk)
- Weasel words: 0
- Clean bonus: 0

**Final Score:** 60
**Verdict:** Caution (Amber)

## Performance

- **Calculation time:** <50ms (pure function)
- **Deterministic:** Same input always produces same output
- **Transparent:** Full breakdown available in "Why" drawer

## Implementation

See `packages/core/trust-score.ts` for the implementation.

## Testing

See `packages/core/__tests__/trust-score.spec.ts` for comprehensive test coverage.

## Future Enhancements

- Nutrition score integration
- Ingredient quality scoring
- Environmental impact scoring
- Ethical sourcing scoring
