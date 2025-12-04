/**
 * Tests for Safer Swaps Module
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateSuggestions, trackSuggestionClick, getSuggestionAnalytics } from '../safer-swaps';
describe('generateSuggestions', () => {
    it('should return empty array for scores >= 80', () => {
        const suggestions = generateSuggestions(85);
        expect(suggestions).toEqual([]);
    });
    it('should return suggestions for scores < 80', () => {
        const suggestions = generateSuggestions(50);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.length).toBeLessThanOrEqual(3);
    });
    it('should only return products with at least 20 points higher score', () => {
        const currentScore = 60;
        const suggestions = generateSuggestions(currentScore);
        suggestions.forEach((suggestion) => {
            expect(suggestion.trustScore).toBeGreaterThanOrEqual(currentScore + 20);
        });
    });
    it('should sort suggestions by trust score (highest first)', () => {
        const suggestions = generateSuggestions(50);
        for (let i = 0; i < suggestions.length - 1; i++) {
            expect(suggestions[i].trustScore).toBeGreaterThanOrEqual(suggestions[i + 1].trustScore);
        }
    });
    it('should return maximum 3 suggestions', () => {
        const suggestions = generateSuggestions(0);
        expect(suggestions.length).toBeLessThanOrEqual(3);
    });
    it('should include required fields in suggestions', () => {
        const suggestions = generateSuggestions(50);
        suggestions.forEach((suggestion) => {
            expect(suggestion).toHaveProperty('id');
            expect(suggestion).toHaveProperty('name');
            expect(suggestion).toHaveProperty('trustScore');
            expect(suggestion).toHaveProperty('verdict');
            expect(suggestion).toHaveProperty('keyDifferences');
            expect(Array.isArray(suggestion.keyDifferences)).toBe(true);
        });
    });
});
describe('trackSuggestionClick', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it('should track click for suggestion', () => {
        trackSuggestionClick('prod_001');
        const analytics = getSuggestionAnalytics();
        expect(analytics['prod_001']).toBe(1);
    });
    it('should increment click count for multiple clicks', () => {
        trackSuggestionClick('prod_001');
        trackSuggestionClick('prod_001');
        trackSuggestionClick('prod_001');
        const analytics = getSuggestionAnalytics();
        expect(analytics['prod_001']).toBe(3);
    });
    it('should track clicks for multiple suggestions', () => {
        trackSuggestionClick('prod_001');
        trackSuggestionClick('prod_002');
        trackSuggestionClick('prod_001');
        const analytics = getSuggestionAnalytics();
        expect(analytics['prod_001']).toBe(2);
        expect(analytics['prod_002']).toBe(1);
    });
    it('should handle localStorage errors gracefully', () => {
        // Temporarily break localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
            throw new Error('Storage quota exceeded');
        };
        // Should not throw
        expect(() => trackSuggestionClick('prod_001')).not.toThrow();
        // Restore
        localStorage.setItem = originalSetItem;
    });
});
describe('getSuggestionAnalytics', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it('should return empty object when no clicks tracked', () => {
        const analytics = getSuggestionAnalytics();
        expect(analytics).toEqual({});
    });
    it('should return click counts for tracked suggestions', () => {
        trackSuggestionClick('prod_001');
        trackSuggestionClick('prod_002');
        const analytics = getSuggestionAnalytics();
        expect(Object.keys(analytics).length).toBe(2);
        expect(analytics['prod_001']).toBe(1);
        expect(analytics['prod_002']).toBe(1);
    });
    it('should handle localStorage errors gracefully', () => {
        // Temporarily break localStorage
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = () => {
            throw new Error('Storage access denied');
        };
        // Should return empty object instead of throwing
        const analytics = getSuggestionAnalytics();
        expect(analytics).toEqual({});
        // Restore
        localStorage.getItem = originalGetItem;
    });
    it('should handle corrupted localStorage data', () => {
        // Set invalid JSON
        localStorage.setItem('claimlens_suggestion_clicks', 'invalid json {');
        // Should return empty object instead of throwing
        const analytics = getSuggestionAnalytics();
        expect(analytics).toEqual({});
    });
});
