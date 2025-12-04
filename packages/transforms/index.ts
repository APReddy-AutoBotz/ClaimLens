/**
 * ClaimLens Transforms Package
 * Exports all available transforms
 */

export { redactPii, redactPiiTransform } from './redact.pii.js';
export type { RedactionResult } from './redact.pii.js';

export { rewriteDisclaimer, rewriteDisclaimerTransform } from './rewrite.disclaimer.js';
export type { DisclaimerResult, ClaimCategory } from './rewrite.disclaimer.js';

export { detectAllergens, detectAllergensTransform } from './detect.allergens.js';
export type { AllergenResult } from './detect.allergens.js';

export { normalizeNutrition, normalizeNutritionTransform } from './normalize.nutrition.js';
export type { NutritionData, NormalizedNutrition, NormalizationResult } from './normalize.nutrition.js';

export { detectWeaselWords, detectWeaselWordsTransform, calculateDeduction } from './detect.weasel_words.js';
export type { WeaselWordResult } from './detect.weasel_words.js';

export { detectRecalls, detectRecallsTransform } from './detect.recalls.js';
export type { RecallResult } from './detect.recalls.js';

export { calculateTrustScoreTransform } from './calculate.trust_score.js';
