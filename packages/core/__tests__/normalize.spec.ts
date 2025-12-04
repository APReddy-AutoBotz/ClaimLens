/**
 * Tests for MenuItem normalization
 */

import { describe, it, expect } from 'vitest';
import { normalizeIngredients, normalizeMenuItem } from '../normalize.js';
import type { MenuItem } from '../types.js';

describe('normalizeIngredients', () => {
  it('should split string by comma', () => {
    const result = normalizeIngredients('flour, sugar, eggs');
    expect(result).toEqual(['flour', 'sugar', 'eggs']);
  });

  it('should split string by semicolon', () => {
    const result = normalizeIngredients('flour; sugar; eggs');
    expect(result).toEqual(['flour', 'sugar', 'eggs']);
  });

  it('should split string by newline', () => {
    const result = normalizeIngredients('flour\nsugar\neggs');
    expect(result).toEqual(['flour', 'sugar', 'eggs']);
  });

  it('should handle mixed delimiters', () => {
    const result = normalizeIngredients('flour, sugar; eggs\nsalt');
    expect(result).toEqual(['flour', 'sugar', 'eggs', 'salt']);
  });

  it('should trim whitespace from each ingredient', () => {
    const result = normalizeIngredients('  flour  ,  sugar  ,  eggs  ');
    expect(result).toEqual(['flour', 'sugar', 'eggs']);
  });

  it('should filter out empty strings', () => {
    const result = normalizeIngredients('flour,,,sugar,,eggs');
    expect(result).toEqual(['flour', 'sugar', 'eggs']);
  });

  it('should pass through array unchanged', () => {
    const input = ['flour', 'sugar', 'eggs'];
    const result = normalizeIngredients(input);
    expect(result).toEqual(['flour', 'sugar', 'eggs']);
  });

  it('should return empty array for undefined', () => {
    const result = normalizeIngredients(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const result = normalizeIngredients('');
    expect(result).toEqual([]);
  });

  it('should handle single ingredient string', () => {
    const result = normalizeIngredients('flour');
    expect(result).toEqual(['flour']);
  });
});

describe('normalizeMenuItem', () => {
  it('should normalize string ingredients to array', () => {
    const item: MenuItem = {
      id: '1',
      name: 'Chocolate Cake',
      ingredients: 'flour, sugar, cocoa'
    };
    
    const normalized = normalizeMenuItem(item);
    
    expect(normalized.ingredients).toEqual(['flour', 'sugar', 'cocoa']);
    expect(normalized.id).toBe('1');
    expect(normalized.name).toBe('Chocolate Cake');
  });

  it('should preserve array ingredients', () => {
    const item: MenuItem = {
      id: '2',
      name: 'Vanilla Cake',
      ingredients: ['flour', 'sugar', 'vanilla']
    };
    
    const normalized = normalizeMenuItem(item);
    
    expect(normalized.ingredients).toEqual(['flour', 'sugar', 'vanilla']);
  });

  it('should handle undefined ingredients', () => {
    const item: MenuItem = {
      id: '3',
      name: 'Mystery Item'
    };
    
    const normalized = normalizeMenuItem(item);
    
    expect(normalized.ingredients).toEqual([]);
  });

  it('should preserve other fields', () => {
    const item: MenuItem = {
      id: '4',
      name: 'Protein Bar',
      description: 'High protein snack',
      ingredients: 'oats, protein powder',
      nutrition: {
        calories: 200,
        sugar_g: 5
      },
      metadata: {
        brand: 'FitFood'
      }
    };
    
    const normalized = normalizeMenuItem(item);
    
    expect(normalized.description).toBe('High protein snack');
    expect(normalized.nutrition).toEqual({ calories: 200, sugar_g: 5 });
    expect(normalized.metadata).toEqual({ brand: 'FitFood' });
  });
});
