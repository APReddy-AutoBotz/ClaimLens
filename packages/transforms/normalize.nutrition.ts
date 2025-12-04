/**
 * ClaimLens Nutrition Normalizer
 * Converts nutrition values to standardized per-100g format with locale-specific units
 */

import type { TransformContext, TransformResult } from '@claimlens/core';

export interface NutritionData {
  calories?: string | number;
  sugar_g?: string | number;
  sodium_mg?: string | number;
  [key: string]: any;
}

export interface NormalizedNutrition {
  calories_per_100g?: number;
  sugar_g_per_100g?: number;
  sodium_mg_per_100g?: number;
  [key: string]: any;
}

export interface NormalizationResult {
  normalized: NormalizedNutrition;
  modified: boolean;
  conversions: string[];
}

/**
 * Parse nutrition value from string or number
 * @param value - Value to parse (e.g., "250", "250kcal", 250)
 * @returns Numeric value or null if invalid
 */
function parseNutritionValue(value: string | number | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  // Extract numeric value from string (e.g., "250kcal" -> 250)
  const match = String(value).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

/**
 * Convert calories based on locale
 * @param calories - Calorie value
 * @param locale - Target locale
 * @returns Converted value and unit
 */
function convertCalories(calories: number, locale: string): { value: number; unit: string } {
  // en-IN and en-GB use kJ, en-US uses kcal
  if (locale === 'en-US') {
    return { value: calories, unit: 'kcal' };
  } else {
    // Convert kcal to kJ (1 kcal = 4.184 kJ)
    return { value: Math.round(calories * 4.184), unit: 'kJ' };
  }
}

/**
 * Convert weight based on locale
 * @param grams - Weight in grams
 * @param locale - Target locale
 * @returns Converted value and unit
 */
function convertWeight(grams: number, locale: string): { value: number; unit: string } {
  // en-US uses oz, others use g
  if (locale === 'en-US') {
    // Convert g to oz (1 oz = 28.3495 g)
    return { value: Math.round((grams / 28.3495) * 100) / 100, unit: 'oz' };
  } else {
    return { value: grams, unit: 'g' };
  }
}

/**
 * Normalize nutrition data to per-100g format
 * @param nutrition - Raw nutrition data
 * @param servingSize - Serving size in grams (optional)
 * @param locale - Target locale for unit conversion
 * @returns Normalized nutrition data with conversion notes
 */
export function normalizeNutrition(
  nutrition: NutritionData | undefined,
  servingSize?: number,
  locale: string = 'en-IN'
): NormalizationResult {
  if (!nutrition || typeof nutrition !== 'object') {
    return {
      normalized: {},
      modified: false,
      conversions: []
    };
  }
  
  const normalized: NormalizedNutrition = {};
  const conversions: string[] = [];
  let modified = false;
  
  // Parse calories
  const calories = parseNutritionValue(nutrition.calories);
  if (calories !== null) {
    let caloriesPer100g = calories;
    
    // Convert per-serving to per-100g if serving size provided
    if (servingSize && servingSize !== 100) {
      caloriesPer100g = Math.round((calories / servingSize) * 100);
      conversions.push(`Converted calories from per-${servingSize}g to per-100g`);
      modified = true;
    }
    
    // Apply locale-specific unit conversion
    const converted = convertCalories(caloriesPer100g, locale);
    normalized.calories_per_100g = converted.value;
    
    if (locale !== 'en-US') {
      conversions.push(`Converted calories to ${converted.unit}`);
      modified = true;
    }
  }
  
  // Parse sugar
  const sugar = parseNutritionValue(nutrition.sugar_g);
  if (sugar !== null) {
    let sugarPer100g = sugar;
    
    // Convert per-serving to per-100g if serving size provided
    if (servingSize && servingSize !== 100) {
      sugarPer100g = Math.round((sugar / servingSize) * 100 * 10) / 10;
      conversions.push(`Converted sugar from per-${servingSize}g to per-100g`);
      modified = true;
    }
    
    // Apply locale-specific unit conversion
    const converted = convertWeight(sugarPer100g, locale);
    normalized.sugar_g_per_100g = converted.value;
    
    if (locale === 'en-US') {
      conversions.push(`Converted sugar to ${converted.unit}`);
      modified = true;
    }
  }
  
  // Parse sodium
  const sodium = parseNutritionValue(nutrition.sodium_mg);
  if (sodium !== null) {
    let sodiumPer100g = sodium;
    
    // Convert per-serving to per-100g if serving size provided
    if (servingSize && servingSize !== 100) {
      sodiumPer100g = Math.round((sodium / servingSize) * 100);
      conversions.push(`Converted sodium from per-${servingSize}g to per-100g`);
      modified = true;
    }
    
    normalized.sodium_mg_per_100g = sodiumPer100g;
  }
  
  // Copy other fields as-is
  for (const key in nutrition) {
    if (!['calories', 'sugar_g', 'sodium_mg'].includes(key)) {
      normalized[key] = nutrition[key];
    }
  }
  
  return {
    normalized,
    modified,
    conversions
  };
}

/**
 * Transform pipeline interface for nutrition normalization
 * @param input - JSON string of nutrition data
 * @param context - Transform context with locale
 * @returns Transform result with normalized nutrition
 */
export function normalizeNutritionTransform(
  input: string,
  context: TransformContext
): TransformResult {
  let nutrition: NutritionData;
  let servingSize: number | undefined;
  
  try {
    const parsed = JSON.parse(input);
    nutrition = parsed.nutrition || parsed;
    servingSize = parsed.serving_size_g;
  } catch {
    // If parsing fails, return original input
    return {
      text: input,
      modified: false,
      flags: [],
      metadata: { error: 'Failed to parse nutrition data' }
    };
  }
  
  const result = normalizeNutrition(nutrition, servingSize, context.locale);
  
  const flags = [];
  if (result.modified && result.conversions.length > 0) {
    flags.push({
      kind: 'ok' as const,
      label: 'Nutrition normalized',
      explanation: result.conversions.join('; '),
      source: 'https://claimlens.dev/docs/nutrition'
    });
  }
  
  return {
    text: JSON.stringify(result.normalized),
    modified: result.modified,
    flags,
    metadata: {
      conversions: result.conversions,
      locale: context.locale
    }
  };
}
