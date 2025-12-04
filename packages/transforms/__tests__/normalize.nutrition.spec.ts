import { describe, it, expect } from 'vitest';
import { normalizeNutrition } from '../normalize.nutrition.js';

describe('normalizeNutrition', () => {
  it('should pass through already normalized data', () => {
    const nutrition = {
      calories: 250,
      sugar_g: 10,
      sodium_mg: 150
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-IN');
    
    expect(result.normalized.calories_per_100g).toBe(1046); // Converted to kJ
    expect(result.normalized.sugar_g_per_100g).toBe(10);
    expect(result.normalized.sodium_mg_per_100g).toBe(150);
  });

  it('should convert per-serving to per-100g', () => {
    const nutrition = {
      calories: 150,
      sugar_g: 6,
      sodium_mg: 90
    };
    
    const result = normalizeNutrition(nutrition, 60, 'en-IN');
    
    expect(result.normalized.calories_per_100g).toBe(1046); // (150/60)*100 = 250, then to kJ
    expect(result.normalized.sugar_g_per_100g).toBe(10); // (6/60)*100
    expect(result.normalized.sodium_mg_per_100g).toBe(150); // (90/60)*100
    expect(result.modified).toBe(true);
    expect(result.conversions.length).toBeGreaterThan(0);
  });

  it('should parse string values', () => {
    const nutrition = {
      calories: '250kcal',
      sugar_g: '10g',
      sodium_mg: '150mg'
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-IN');
    
    expect(result.normalized.calories_per_100g).toBe(1046);
    expect(result.normalized.sugar_g_per_100g).toBe(10);
    expect(result.normalized.sodium_mg_per_100g).toBe(150);
  });

  it('should handle missing values gracefully', () => {
    const nutrition = {
      calories: 250
      // sugar_g and sodium_mg missing
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-IN');
    
    expect(result.normalized.calories_per_100g).toBe(1046);
    expect(result.normalized.sugar_g_per_100g).toBeUndefined();
    expect(result.normalized.sodium_mg_per_100g).toBeUndefined();
  });

  it('should handle malformed data gracefully', () => {
    const nutrition = {
      calories: 'invalid',
      sugar_g: undefined,
      sodium_mg: undefined
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-IN');
    
    expect(result.normalized.calories_per_100g).toBeUndefined();
    expect(result.normalized.sugar_g_per_100g).toBeUndefined();
    expect(result.normalized.sodium_mg_per_100g).toBeUndefined();
  });

  it('should convert to kcal for en-US locale', () => {
    const nutrition = {
      calories: 250,
      sugar_g: 10
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-US');
    
    expect(result.normalized.calories_per_100g).toBe(250); // Stays in kcal
  });

  it('should convert to kJ for en-IN locale', () => {
    const nutrition = {
      calories: 250
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-IN');
    
    expect(result.normalized.calories_per_100g).toBe(1046); // 250 * 4.184
  });

  it('should convert to kJ for en-GB locale', () => {
    const nutrition = {
      calories: 250
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-GB');
    
    expect(result.normalized.calories_per_100g).toBe(1046); // 250 * 4.184
  });

  it('should convert weight to oz for en-US locale', () => {
    const nutrition = {
      sugar_g: 28.35 // Approximately 1 oz
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-US');
    
    expect(result.normalized.sugar_g_per_100g).toBeCloseTo(1, 1);
  });

  it('should preserve other nutrition fields', () => {
    const nutrition = {
      calories: 250,
      protein_g: 5,
      fiber_g: 3,
      custom_field: 'value'
    };
    
    const result = normalizeNutrition(nutrition, 100, 'en-IN');
    
    expect(result.normalized.protein_g).toBe(5);
    expect(result.normalized.fiber_g).toBe(3);
    expect(result.normalized.custom_field).toBe('value');
  });

  it('should handle empty or invalid input', () => {
    expect(normalizeNutrition(undefined)).toEqual({
      normalized: {},
      modified: false,
      conversions: []
    });
    
    expect(normalizeNutrition(null as any)).toEqual({
      normalized: {},
      modified: false,
      conversions: []
    });
  });
});

describe('normalizeNutritionTransform (pipeline interface)', () => {
  it('should normalize nutrition data with serving size', async () => {
    const { normalizeNutritionTransform } = await import('../normalize.nutrition.js');
    const context = {
      locale: 'en-IN',
      tenant: 'test-tenant',
      correlationId: 'test-123'
    };
    
    const input = JSON.stringify({
      nutrition: {
        calories: 150,
        sugar_g: 6,
        sodium_mg: 90
      },
      serving_size_g: 60
    });
    
    const result = normalizeNutritionTransform(input, context);
    
    expect(result.modified).toBe(true);
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.flags[0].label).toBe('Nutrition normalized');
    
    const normalized = JSON.parse(result.text);
    expect(normalized.calories_per_100g).toBe(1046);
    expect(normalized.sugar_g_per_100g).toBe(10);
  });

  it('should handle en-US locale with kcal and oz', async () => {
    const { normalizeNutritionTransform } = await import('../normalize.nutrition.js');
    const context = {
      locale: 'en-US',
      tenant: 'test-tenant',
      correlationId: 'test-123'
    };
    
    const input = JSON.stringify({
      nutrition: {
        calories: 250,
        sugar_g: 28.35
      }
    });
    
    const result = normalizeNutritionTransform(input, context);
    
    const normalized = JSON.parse(result.text);
    expect(normalized.calories_per_100g).toBe(250); // Stays in kcal
    expect(normalized.sugar_g_per_100g).toBeCloseTo(1, 1); // Converted to oz
  });

  it('should handle invalid JSON gracefully', async () => {
    const { normalizeNutritionTransform } = await import('../normalize.nutrition.js');
    const context = {
      locale: 'en-IN',
      tenant: 'test-tenant',
      correlationId: 'test-123'
    };
    
    const result = normalizeNutritionTransform('invalid json', context);
    
    expect(result.modified).toBe(false);
    expect(result.metadata?.error).toBe('Failed to parse nutrition data');
  });

  it('should convert units even for already per-100g data', async () => {
    const { normalizeNutritionTransform } = await import('../normalize.nutrition.js');
    const context = {
      locale: 'en-US',
      tenant: 'test-tenant',
      correlationId: 'test-123'
    };
    
    const input = JSON.stringify({
      nutrition: {
        calories: 250,
        sugar_g: 10,
        sodium_mg: 150
      },
      serving_size_g: 100
    });
    
    const result = normalizeNutritionTransform(input, context);
    
    // Should be modified due to unit conversion (g to oz)
    expect(result.modified).toBe(true);
    
    const normalized = JSON.parse(result.text);
    expect(normalized.calories_per_100g).toBe(250); // Stays in kcal for en-US
    expect(normalized.sugar_g_per_100g).toBeCloseTo(0.35, 1); // 10g converted to oz
  });
});
