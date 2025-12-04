/**
 * ClaimLens Allergen Detector
 * Scans ingredients for common allergens and generates badges
 */

import type { TransformContext, TransformResult, Flag } from '@claimlens/core';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

let allergenDatabase: string[] | null = null;

/**
 * Load allergen database from packs/allergens.in.yaml
 */
function loadAllergenDatabase(): string[] {
  if (allergenDatabase) {
    return allergenDatabase;
  }
  
  try {
    const packPath = join(process.cwd(), 'packs', 'allergens.in.yaml');
    const content = readFileSync(packPath, 'utf-8');
    allergenDatabase = parse(content) as string[];
    return allergenDatabase;
  } catch (error) {
    console.warn('Failed to load allergen database:', error);
    return [];
  }
}

export interface AllergenResult {
  allergens: string[];
  crossContaminationRisk: boolean;
}

/**
 * Detect allergens in ingredients list
 * @param ingredients - Array of ingredient strings
 * @returns Object with detected allergens and cross-contamination risk
 */
export function detectAllergens(ingredients: string[]): AllergenResult {
  if (!ingredients || !Array.isArray(ingredients)) {
    return { allergens: [], crossContaminationRisk: false };
  }
  
  const allergenDb = loadAllergenDatabase();
  const detectedAllergens = new Set<string>();
  let crossContaminationRisk = false;
  
  // Normalize ingredients to lowercase for matching
  const normalizedIngredients = ingredients.map(ing => ing.toLowerCase());
  
  // Check each ingredient against allergen database
  for (const ingredient of normalizedIngredients) {
    for (const allergen of allergenDb) {
      const allergenLower = allergen.toLowerCase();
      
      // Check for exact match or singular/plural variations
      if (ingredient.includes(allergenLower)) {
        detectedAllergens.add(allergen);
      } else {
        // Handle singular form (e.g., "peanut" matches "peanuts")
        const singularForm = allergenLower.endsWith('s') 
          ? allergenLower.slice(0, -1) 
          : allergenLower;
        
        if (ingredient.includes(singularForm)) {
          detectedAllergens.add(allergen);
        }
      }
    }
    
    // Check for cross-contamination warnings
    if (ingredient.includes('may contain') || 
        ingredient.includes('processed in') ||
        ingredient.includes('manufactured in') ||
        ingredient.includes('traces of')) {
      crossContaminationRisk = true;
    }
  }
  
  return {
    allergens: Array.from(detectedAllergens),
    crossContaminationRisk
  };
}

/**
 * Transform pipeline interface for allergen detection
 * @param input - Comma-separated ingredients string or JSON array
 * @param context - Transform context
 * @returns Transform result with allergen badges
 */
export function detectAllergensTransform(
  input: string,
  context: TransformContext
): TransformResult {
  // Parse input - could be comma-separated string or JSON array
  let ingredients: string[];
  
  try {
    // Try parsing as JSON array first
    ingredients = JSON.parse(input);
  } catch {
    // Fall back to comma-separated string
    ingredients = input.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  const result = detectAllergens(ingredients);
  const flags: Flag[] = [];
  
  // Generate allergen badges
  for (const allergen of result.allergens) {
    flags.push({
      kind: 'warn',
      label: `Contains ${allergen}`,
      explanation: `This item contains ${allergen}, a common allergen`,
      source: 'https://claimlens.dev/docs/allergens'
    });
  }
  
  // Add cross-contamination warning if detected
  if (result.crossContaminationRisk) {
    flags.push({
      kind: 'warn',
      label: 'Cross-contamination risk',
      explanation: 'This item may have been processed in a facility that handles allergens',
      source: 'https://claimlens.dev/docs/allergens'
    });
  }
  
  return {
    text: input, // Return original input unchanged
    modified: false, // Detection doesn't modify content
    flags,
    metadata: {
      detected_allergens: result.allergens,
      cross_contamination_risk: result.crossContaminationRisk
    }
  };
}
