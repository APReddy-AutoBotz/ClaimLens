# Claims & Locale Rules — ClaimLens

## Overview

ClaimLens classifies marketing claims and applies locale-appropriate regulatory disclaimers. All rules are deterministic and testable.

---

## 1. Claim Classification

### Claim Categories

```typescript
enum ClaimCategory {
  HEALTH = 'health',           // Disease prevention, treatment
  NUTRITION = 'nutrition',     // Nutrient content, benefits
  MARKETING = 'marketing'      // General marketing terms
}
```

### Classification Rules

```yaml
health_claims:
  - pattern: "prevent|cure|treat|heal|remedy"
    category: health
    severity: high
    examples:
      - "prevents cancer"
      - "cures diabetes"
      - "treats heart disease"
  
  - pattern: "boost immunity|strengthen immune|immune support"
    category: health
    severity: medium
    examples:
      - "boosts immunity"
      - "strengthens immune system"
  
  - pattern: "detox|cleanse|purify"
    category: health
    severity: medium
    examples:
      - "detox juice"
      - "body cleanse"

nutrition_claims:
  - pattern: "superfood|power food|miracle"
    category: nutrition
    severity: high
    examples:
      - "superfood bowl"
      - "miracle ingredient"
  
  - pattern: "high in|rich in|excellent source|good source"
    category: nutrition
    severity: low
    requires_verification: true
    examples:
      - "high in protein"
      - "rich in vitamins"
  
  - pattern: "low fat|fat free|sugar free|zero calories"
    category: nutrition
    severity: low
    requires_verification: true
    examples:
      - "low fat yogurt"
      - "sugar free dessert"

marketing_claims:
  - pattern: "natural|organic|pure|fresh"
    category: marketing
    severity: low
    requires_certification: true
    examples:
      - "100% natural"
      - "organic ingredients"
  
  - pattern: "authentic|traditional|homemade"
    category: marketing
    severity: low
    examples:
      - "authentic recipe"
      - "homemade taste"
```

---

## 2. Regulator Templates

### FSSAI (India) - en-IN

```yaml
locale: en-IN
regulator: FSSAI
authority_url: https://fssai.gov.in/claims-guidelines

templates:
  health:
    disclaimer: "This claim has not been evaluated by FSSAI. This product is not intended to diagnose, treat, cure, or prevent any disease."
    placement: after_claim
    required: true
  
  nutrition:
    disclaimer: "Nutritional claims are based on standard serving sizes. Individual results may vary."
    placement: after_claim
    required: false
    threshold:
      high_severity: true
  
  marketing:
    disclaimer: "Claims subject to verification."
    placement: footer
    required: false

banned_terms:
  - "superfood"
  - "miracle"
  - "cure"
  - "prevent disease"
  - "anti-cancer"
  - "anti-diabetic"

allowed_with_proof:
  - "high in protein" # requires ≥12g per 100g
  - "rich in fiber" # requires ≥6g per 100g
  - "low fat" # requires ≤3g per 100g
  - "sugar free" # requires ≤0.5g per 100g
```

### FDA (United States) - en-US

```yaml
locale: en-US
regulator: FDA
authority_url: https://www.fda.gov/food/food-labeling-nutrition

templates:
  health:
    disclaimer: "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."
    placement: after_claim
    required: true
  
  nutrition:
    disclaimer: "Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs."
    placement: after_claim
    required: true
  
  marketing:
    disclaimer: "Marketing claims are based on manufacturer representations."
    placement: footer
    required: false

banned_terms:
  - "cure"
  - "treat"
  - "prevent disease"
  - "FDA approved" # unless actually approved

allowed_with_proof:
  - "high in protein" # requires ≥10g per serving
  - "good source of fiber" # requires ≥2.5g per serving
  - "low fat" # requires ≤3g per serving
  - "fat free" # requires <0.5g per serving
```

### FSA (United Kingdom) - en-GB

```yaml
locale: en-GB
regulator: FSA
authority_url: https://www.food.gov.uk/business-guidance

templates:
  health:
    disclaimer: "This claim has not been authorised by the European Food Safety Authority (EFSA). This product is not intended to diagnose, treat, cure, or prevent any disease."
    placement: after_claim
    required: true
  
  nutrition:
    disclaimer: "Nutritional information is based on typical values per 100g/100ml."
    placement: after_claim
    required: true
  
  marketing:
    disclaimer: "Claims are subject to verification."
    placement: footer
    required: false

banned_terms:
  - "superfood"
  - "cure"
  - "prevent disease"
  - "slimming" # unless approved

allowed_with_proof:
  - "high protein" # requires ≥20% energy from protein
  - "source of fibre" # requires ≥3g per 100g
  - "low fat" # requires ≤3g per 100g
  - "fat free" # requires ≤0.5g per 100g
```

---

## 3. Unit Normalization Rules

### Energy

```typescript
interface EnergyConversion {
  from: 'kcal' | 'kJ' | 'cal';
  to: 'kcal' | 'kJ';
  factor: number;
}

const ENERGY_CONVERSIONS: EnergyConversion[] = [
  { from: 'kcal', to: 'kJ', factor: 4.184 },
  { from: 'kJ', to: 'kcal', factor: 0.239 },
  { from: 'cal', to: 'kcal', factor: 0.001 }
];

function normalizeEnergy(value: number, from: string, locale: string): string {
  const targetUnit = locale === 'en-US' ? 'kcal' : 'kJ';
  
  if (from === targetUnit) {
    return `${value}${targetUnit}`;
  }
  
  const conversion = ENERGY_CONVERSIONS.find(
    c => c.from === from && c.to === targetUnit
  );
  
  if (!conversion) {
    throw new Error(`No conversion from ${from} to ${targetUnit}`);
  }
  
  const converted = Math.round(value * conversion.factor);
  return `${converted}${targetUnit}`;
}

// Examples
normalizeEnergy(250, 'kcal', 'en-IN'); // "1046kJ"
normalizeEnergy(1046, 'kJ', 'en-US'); // "250kcal"
```

### Weight

```typescript
interface WeightConversion {
  from: 'g' | 'mg' | 'oz' | 'lb';
  to: 'g' | 'oz';
  factor: number;
}

const WEIGHT_CONVERSIONS: WeightConversion[] = [
  { from: 'g', to: 'oz', factor: 0.035274 },
  { from: 'oz', to: 'g', factor: 28.3495 },
  { from: 'mg', to: 'g', factor: 0.001 },
  { from: 'lb', to: 'g', factor: 453.592 }
];

function normalizeWeight(value: number, from: string, locale: string): string {
  const targetUnit = locale === 'en-US' ? 'oz' : 'g';
  
  if (from === targetUnit) {
    return `${value}${targetUnit}`;
  }
  
  const conversion = WEIGHT_CONVERSIONS.find(
    c => c.from === from && c.to === targetUnit
  );
  
  if (!conversion) {
    throw new Error(`No conversion from ${from} to ${targetUnit}`);
  }
  
  const converted = (value * conversion.factor).toFixed(1);
  return `${converted}${targetUnit}`;
}

// Examples
normalizeWeight(100, 'g', 'en-US'); // "3.5oz"
normalizeWeight(3.5, 'oz', 'en-IN'); // "99.2g"
```

### Per-Serving to Per-100g

```typescript
function normalizeToStandard(
  value: number,
  servingSize: number,
  servingUnit: 'g' | 'ml'
): number {
  // Convert to per-100g/100ml
  return (value / servingSize) * 100;
}

// Example
const sugarPerServing = 28; // grams
const servingSize = 250; // grams
const sugarPer100g = normalizeToStandard(sugarPerServing, servingSize, 'g');
// Result: 11.2g per 100g
```

---

## 4. Locale Fallback Strategy

```typescript
const LOCALE_FALLBACK_CHAIN: Record<string, string[]> = {
  'en-IN': ['en-IN', 'en-GB', 'en-US'],
  'en-US': ['en-US', 'en-GB', 'en-IN'],
  'en-GB': ['en-GB', 'en-IN', 'en-US'],
  'hi-IN': ['hi-IN', 'en-IN'],
  'ta-IN': ['ta-IN', 'en-IN']
};

function getDisclaimer(
  claimCategory: ClaimCategory,
  locale: string
): string {
  const fallbackChain = LOCALE_FALLBACK_CHAIN[locale] || ['en-IN'];
  
  for (const fallbackLocale of fallbackChain) {
    const template = REGULATOR_TEMPLATES[fallbackLocale];
    if (template && template[claimCategory]) {
      return template[claimCategory].disclaimer;
    }
  }
  
  // Ultimate fallback
  return "This claim has not been evaluated by regulatory authorities.";
}
```

---

## 5. Claim Detection Algorithm

```typescript
interface ClaimMatch {
  phrase: string;
  category: ClaimCategory;
  severity: 'low' | 'medium' | 'high';
  position: { start: number; end: number };
  requiresProof: boolean;
}

function detectClaims(text: string): ClaimMatch[] {
  const matches: ClaimMatch[] = [];
  const normalizedText = text.toLowerCase();
  
  // Load claim patterns from packs/banned.claims.in.yaml
  const patterns = loadClaimPatterns();
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.pattern, 'gi');
    let match;
    
    while ((match = regex.exec(normalizedText)) !== null) {
      matches.push({
        phrase: match[0],
        category: pattern.category,
        severity: pattern.severity,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        requiresProof: pattern.requires_verification || false
      });
    }
  }
  
  return matches;
}

// Example
const text = "Our superfood bowl boosts immunity and prevents disease";
const claims = detectClaims(text);
// Result:
// [
//   { phrase: "superfood", category: "nutrition", severity: "high", ... },
//   { phrase: "boosts immunity", category: "health", severity: "medium", ... },
//   { phrase: "prevents disease", category: "health", severity: "high", ... }
// ]
```

---

## 6. Disclaimer Insertion

```typescript
function insertDisclaimer(
  text: string,
  claim: ClaimMatch,
  locale: string
): string {
  const disclaimer = getDisclaimer(claim.category, locale);
  const template = REGULATOR_TEMPLATES[locale][claim.category];
  
  if (template.placement === 'after_claim') {
    // Insert immediately after the claim
    const before = text.substring(0, claim.position.end);
    const after = text.substring(claim.position.end);
    return `${before} (${disclaimer})${after}`;
  } else if (template.placement === 'footer') {
    // Append to end of text
    return `${text}\n\n${disclaimer}`;
  }
  
  return text;
}

// Example
const text = "Our superfood bowl is packed with nutrients";
const claim = { phrase: "superfood", category: "nutrition", ... };
const result = insertDisclaimer(text, claim, 'en-IN');
// Result: "Our superfood bowl (This claim has not been evaluated by FSSAI) is packed with nutrients"
```

---

## 7. Nutrition Threshold Verification

```typescript
interface NutritionThresholds {
  locale: string;
  claims: Record<string, { min?: number; max?: number; unit: string }>;
}

const NUTRITION_THRESHOLDS: Record<string, NutritionThresholds> = {
  'en-IN': {
    locale: 'en-IN',
    claims: {
      'high in protein': { min: 12, unit: 'g per 100g' },
      'rich in fiber': { min: 6, unit: 'g per 100g' },
      'low fat': { max: 3, unit: 'g per 100g' },
      'sugar free': { max: 0.5, unit: 'g per 100g' }
    }
  },
  'en-US': {
    locale: 'en-US',
    claims: {
      'high in protein': { min: 10, unit: 'g per serving' },
      'good source of fiber': { min: 2.5, unit: 'g per serving' },
      'low fat': { max: 3, unit: 'g per serving' },
      'fat free': { max: 0.5, unit: 'g per serving' }
    }
  }
};

function verifyNutritionClaim(
  claim: string,
  actualValue: number,
  locale: string
): { valid: boolean; reason?: string } {
  const thresholds = NUTRITION_THRESHOLDS[locale];
  const threshold = thresholds.claims[claim.toLowerCase()];
  
  if (!threshold) {
    return { valid: false, reason: 'Unknown claim' };
  }
  
  if (threshold.min !== undefined && actualValue < threshold.min) {
    return {
      valid: false,
      reason: `Requires minimum ${threshold.min}${threshold.unit}, found ${actualValue}${threshold.unit}`
    };
  }
  
  if (threshold.max !== undefined && actualValue > threshold.max) {
    return {
      valid: false,
      reason: `Requires maximum ${threshold.max}${threshold.unit}, found ${actualValue}${threshold.unit}`
    };
  }
  
  return { valid: true };
}

// Example
verifyNutritionClaim('high in protein', 8, 'en-IN');
// Result: { valid: false, reason: "Requires minimum 12g per 100g, found 8g per 100g" }
```

---

## 8. Weasel Word Detection

```typescript
const WEASEL_WORDS = [
  'may', 'might', 'could', 'possibly', 'potentially',
  'some', 'many', 'most', 'often', 'generally',
  'up to', 'as much as', 'helps', 'supports'
];

function detectWeaselWords(text: string): {
  count: number;
  density: number;
  words: string[];
} {
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/);
  const foundWeaselWords: string[] = [];
  
  for (const word of words) {
    if (WEASEL_WORDS.includes(word)) {
      foundWeaselWords.push(word);
    }
  }
  
  const density = foundWeaselWords.length / words.length;
  
  return {
    count: foundWeaselWords.length,
    density,
    words: foundWeaselWords
  };
}

// Example
const text = "May help support immunity and could potentially boost energy";
const result = detectWeaselWords(text);
// Result: { count: 4, density: 0.4, words: ["may", "help", "support", "could", "potentially"] }
```

---

## 9. Trust Score Calculation (B2C)

```typescript
function calculateTrustScore(item: MenuItem): number {
  let score = 100;
  
  // Deduct for banned claims
  const bannedClaims = detectClaims(item.name + ' ' + item.description);
  score -= bannedClaims.filter(c => c.severity === 'high').length * 40;
  score -= bannedClaims.filter(c => c.severity === 'medium').length * 20;
  score -= bannedClaims.filter(c => c.severity === 'low').length * 10;
  
  // Deduct for recalls
  const recalls = checkRecalls(item);
  score -= recalls.length * 30;
  
  // Deduct for allergens (if user has profile)
  const allergens = detectAllergens(item);
  score -= allergens.length * 20;
  
  // Deduct for weasel words
  const weaselWords = detectWeaselWords(item.name + ' ' + item.description);
  score -= Math.floor(weaselWords.density * 20);
  
  // Bonus for clean items
  if (score === 100) {
    score += 10; // Bonus for perfect score
  }
  
  // Clamp to 0-100
  return Math.max(0, Math.min(110, score));
}

// Map score to verdict
function getVerdict(score: number): 'allow' | 'caution' | 'avoid' {
  if (score >= 80) return 'allow';
  if (score >= 50) return 'caution';
  return 'avoid';
}

// Example
const item = {
  name: "Superfood Detox Bowl",
  description: "May help boost immunity",
  ingredients: ["quinoa", "kale", "peanuts"]
};
const score = calculateTrustScore(item); // 30 (100 - 40 - 20 - 10)
const verdict = getVerdict(score); // "avoid"
```

---

## 10. Testing & Validation

### Claim Detection Tests

```typescript
describe('Claim Detection', () => {
  test('detects banned health claims', () => {
    const text = "Prevents cancer and cures diabetes";
    const claims = detectClaims(text);
    
    expect(claims).toHaveLength(2);
    expect(claims[0].category).toBe('health');
    expect(claims[0].severity).toBe('high');
  });
  
  test('detects nutrition claims', () => {
    const text = "Superfood bowl rich in protein";
    const claims = detectClaims(text);
    
    expect(claims).toContainEqual(
      expect.objectContaining({
        phrase: 'superfood',
        category: 'nutrition'
      })
    );
  });
});
```

### Disclaimer Insertion Tests

```typescript
describe('Disclaimer Insertion', () => {
  test('inserts FSSAI disclaimer for en-IN', () => {
    const text = "Superfood bowl";
    const claim = { phrase: "superfood", category: "nutrition", position: { start: 0, end: 9 } };
    const result = insertDisclaimer(text, claim, 'en-IN');
    
    expect(result).toContain('FSSAI');
  });
  
  test('inserts FDA disclaimer for en-US', () => {
    const text = "Boosts immunity";
    const claim = { phrase: "boosts immunity", category: "health", position: { start: 0, end: 15 } };
    const result = insertDisclaimer(text, claim, 'en-US');
    
    expect(result).toContain('FDA');
  });
});
```

---

## 11. References

- [FSSAI Claims Guidelines](https://fssai.gov.in/claims-guidelines)
- [FDA Food Labeling](https://www.fda.gov/food/food-labeling-nutrition)
- [FSA Business Guidance](https://www.food.gov.uk/business-guidance)
- [EFSA Health Claims](https://www.efsa.europa.eu/en/topics/topic/health-claims)
