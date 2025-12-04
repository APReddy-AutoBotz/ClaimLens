import { describe, it, expect } from 'vitest';
import { detectAllergens } from '../detect.allergens.js';
describe('detectAllergens', () => {
    it('should detect no allergens in safe ingredients', () => {
        const ingredients = ['water', 'salt', 'sugar', 'rice'];
        const result = detectAllergens(ingredients);
        expect(result.allergens).toEqual([]);
        expect(result.crossContaminationRisk).toBe(false);
    });
    it('should detect single allergen', () => {
        const ingredients = ['flour', 'water', 'wheat', 'salt'];
        const result = detectAllergens(ingredients);
        expect(result.allergens).toContain('wheat');
        expect(result.crossContaminationRisk).toBe(false);
    });
    it('should detect multiple allergens', () => {
        const ingredients = ['milk', 'eggs', 'wheat flour', 'butter'];
        const result = detectAllergens(ingredients);
        expect(result.allergens).toContain('milk');
        expect(result.allergens).toContain('eggs');
        expect(result.allergens).toContain('wheat');
    });
    it('should handle case-insensitive matching', () => {
        const testCases = [
            ['PEANUTS', 'salt'],
            ['Peanuts', 'water'],
            ['peanuts', 'sugar'],
            ['Peanut butter', 'bread']
        ];
        testCases.forEach(ingredients => {
            const result = detectAllergens(ingredients);
            expect(result.allergens).toContain('peanuts');
        });
    });
    it('should detect allergens in compound ingredients', () => {
        const ingredients = ['peanut butter', 'almond milk', 'soy sauce'];
        const result = detectAllergens(ingredients);
        expect(result.allergens).toContain('peanuts');
        expect(result.allergens).toContain('soy');
    });
    it('should detect cross-contamination warnings', () => {
        const testCases = [
            ['flour', 'may contain traces of nuts'],
            ['sugar', 'processed in facility with peanuts'],
            ['rice', 'manufactured in shared equipment with milk'],
            ['salt', 'may contain traces of shellfish']
        ];
        testCases.forEach(ingredients => {
            const result = detectAllergens(ingredients);
            expect(result.crossContaminationRisk).toBe(true);
        });
    });
    it('should handle empty or invalid input', () => {
        expect(detectAllergens([])).toEqual({ allergens: [], crossContaminationRisk: false });
        expect(detectAllergens(null)).toEqual({ allergens: [], crossContaminationRisk: false });
        expect(detectAllergens(undefined)).toEqual({ allergens: [], crossContaminationRisk: false });
    });
    it('should not duplicate allergens', () => {
        const ingredients = ['milk', 'whole milk', 'skim milk', 'milk powder'];
        const result = detectAllergens(ingredients);
        // Should only list 'milk' once
        const milkCount = result.allergens.filter(a => a === 'milk').length;
        expect(milkCount).toBe(1);
    });
});
describe('detectAllergensTransform (pipeline interface)', () => {
    it('should generate badges for detected allergens', async () => {
        const { detectAllergensTransform } = await import('../detect.allergens.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = detectAllergensTransform('["milk", "eggs", "wheat flour"]', context);
        expect(result.modified).toBe(false); // Detection doesn't modify
        expect(result.flags.length).toBeGreaterThan(0);
        expect(result.flags.some(f => f.label.includes('milk'))).toBe(true);
        expect(result.flags.some(f => f.label.includes('eggs'))).toBe(true);
        expect(result.flags.some(f => f.label.includes('wheat'))).toBe(true);
    });
    it('should handle comma-separated string input', async () => {
        const { detectAllergensTransform } = await import('../detect.allergens.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = detectAllergensTransform('peanuts, salt, sugar', context);
        expect(result.flags.some(f => f.label.includes('peanuts'))).toBe(true);
    });
    it('should add cross-contamination flag when detected', async () => {
        const { detectAllergensTransform } = await import('../detect.allergens.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = detectAllergensTransform('["flour", "may contain traces of nuts"]', context);
        expect(result.flags.some(f => f.label === 'Cross-contamination risk')).toBe(true);
    });
    it('should return no flags for safe ingredients', async () => {
        const { detectAllergensTransform } = await import('../detect.allergens.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = detectAllergensTransform('["water", "salt", "sugar"]', context);
        expect(result.flags).toHaveLength(0);
        expect(result.modified).toBe(false);
    });
});
