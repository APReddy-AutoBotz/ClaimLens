/**
 * ClaimLens MenuItem Normalization
 * Normalizes ingredients field to consistent array format
 */

import type { MenuItem, NormalizedMenuItem } from './types.js';

/**
 * Normalizes ingredients from string | string[] | undefined to string[]
 * 
 * Handles:
 * - String input: splits by comma, semicolon, or newline
 * - Array input: returns as-is
 * - Undefined/null: returns empty array
 * 
 * @param input - Ingredients in any supported format
 * @returns Normalized array of ingredient strings
 * 
 * @example
 * normalizeIngredients("flour, sugar, eggs") // ["flour", "sugar", "eggs"]
 * normalizeIngredients(["flour", "sugar"]) // ["flour", "sugar"]
 * normalizeIngredients(undefined) // []
 */
export function normalizeIngredients(
  input: string | string[] | undefined
): string[] {
  // Handle undefined/null
  if (!input) {
    return [];
  }

  // Handle array input - pass through
  if (Array.isArray(input)) {
    return input;
  }

  // Handle string input - split by comma, semicolon, or newline
  if (typeof input === 'string') {
    return input
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Fallback for unexpected types
  return [];
}

/**
 * Normalizes a MenuItem to ensure ingredients is always an array
 * 
 * @param item - MenuItem with potentially unnormalized ingredients
 * @returns NormalizedMenuItem with ingredients as string[]
 * 
 * @example
 * const item = { id: "1", name: "Cake", ingredients: "flour, sugar" };
 * const normalized = normalizeMenuItem(item);
 * // normalized.ingredients === ["flour", "sugar"]
 */
export function normalizeMenuItem(item: MenuItem): NormalizedMenuItem {
  return {
    ...item,
    ingredients: normalizeIngredients(item.ingredients)
  };
}
