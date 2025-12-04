/**
 * Tests for Weasel Word Detection Transform
 */
import { describe, it, expect } from 'vitest';
import { detectWeaselWords, detectWeaselWordsTransform, calculateDeduction, } from '../detect.weasel_words.js';
describe('detectWeaselWords', () => {
    it('should detect single weasel words', () => {
        const text = 'This product may help support your health';
        const result = detectWeaselWords(text);
        expect(result.weaselWords).toContain('may');
        expect(result.weaselWords).toContain('help');
        expect(result.weaselWords).toContain('support');
        expect(result.weaselWordCount).toBe(3);
    });
    it('should detect multi-word weasel phrases', () => {
        const text = 'Contains up to 50% more vitamins';
        const result = detectWeaselWords(text);
        expect(result.weaselWords).toContain('up to');
        expect(result.weaselWordCount).toBeGreaterThan(0);
    });
    it('should calculate density correctly', () => {
        const text = 'may help'; // 2 weasel words out of 2 total
        const result = detectWeaselWords(text);
        expect(result.totalWords).toBe(2);
        expect(result.weaselWordCount).toBe(2);
        expect(result.density).toBe(1.0);
    });
    it('should handle text with no weasel words', () => {
        const text = 'Contains 100mg vitamin C per serving';
        const result = detectWeaselWords(text);
        expect(result.weaselWords).toHaveLength(0);
        expect(result.density).toBe(0);
    });
    it('should handle empty text', () => {
        const result = detectWeaselWords('');
        expect(result.weaselWords).toHaveLength(0);
        expect(result.density).toBe(0);
        expect(result.totalWords).toBe(0);
    });
    it('should handle text with punctuation', () => {
        const text = 'May help! Supports health.';
        const result = detectWeaselWords(text);
        expect(result.weaselWords).toContain('may');
        expect(result.weaselWords).toContain('supports');
    });
    it('should be case-insensitive', () => {
        const text = 'MAY HELP SUPPORT';
        const result = detectWeaselWords(text);
        expect(result.weaselWords).toContain('may');
        expect(result.weaselWords).toContain('help');
        expect(result.weaselWords).toContain('support');
    });
});
describe('calculateDeduction', () => {
    it('should deduct 20 points for >20% density', () => {
        expect(calculateDeduction(0.25)).toBe(20);
        expect(calculateDeduction(0.21)).toBe(20);
    });
    it('should deduct 15 points for 10-20% density', () => {
        expect(calculateDeduction(0.20)).toBe(15);
        expect(calculateDeduction(0.15)).toBe(15);
        expect(calculateDeduction(0.10)).toBe(15);
    });
    it('should deduct 10 points for 5-10% density', () => {
        expect(calculateDeduction(0.09)).toBe(10);
        expect(calculateDeduction(0.05)).toBe(10);
    });
    it('should deduct 0 points for <5% density', () => {
        expect(calculateDeduction(0.04)).toBe(0);
        expect(calculateDeduction(0.01)).toBe(0);
        expect(calculateDeduction(0)).toBe(0);
    });
});
describe('detectWeaselWordsTransform', () => {
    const context = {
        locale: 'en',
        tenant: 'test',
        correlationId: 'test-123',
    };
    it('should return flags for high density (>20%)', () => {
        const text = 'may help support'; // 3 weasel words out of 3 = 100%
        const result = detectWeaselWordsTransform(text, context);
        expect(result.flags).toHaveLength(1);
        expect(result.flags[0].kind).toBe('danger');
        expect(result.flags[0].label).toBe('Vague marketing language');
        expect(result.modified).toBe(false);
    });
    it('should return flags for medium density (10-20%)', () => {
        const text = 'This product may help you feel better every single day now'; // 2/11 = 18%
        const result = detectWeaselWordsTransform(text, context);
        expect(result.flags).toHaveLength(1);
        expect(result.flags[0].kind).toBe('warn');
    });
    it('should return flags for low density (5-10%)', () => {
        const text = 'This product contains vitamins and minerals that may support health'; // 1/11 = 9%
        const result = detectWeaselWordsTransform(text, context);
        expect(result.flags).toHaveLength(1);
        expect(result.flags[0].kind).toBe('warn');
    });
    it('should not flag for very low density (<5%)', () => {
        const text = 'Contains 100mg vitamin C, 50mg vitamin E, and 20mg zinc per serving'; // 0/13 = 0%
        const result = detectWeaselWordsTransform(text, context);
        expect(result.flags).toHaveLength(0);
    });
    it('should include metadata with weasel word details', () => {
        const text = 'may help support';
        const result = detectWeaselWordsTransform(text, context);
        expect(result.metadata).toBeDefined();
        expect(result.metadata?.weasel_words).toContain('may');
        expect(result.metadata?.density).toBeGreaterThan(0);
        expect(result.metadata?.deduction).toBe(20);
    });
    it('should not modify the input text', () => {
        const text = 'may help support';
        const result = detectWeaselWordsTransform(text, context);
        expect(result.text).toBe(text);
        expect(result.modified).toBe(false);
    });
    it('should include source link in flags', () => {
        const text = 'may help support';
        const result = detectWeaselWordsTransform(text, context);
        expect(result.flags[0].source).toBe('https://claimlens.dev/docs/weasel-words');
    });
    it('should show up to 3 example weasel words in explanation', () => {
        const text = 'may help support boost enhance';
        const result = detectWeaselWordsTransform(text, context);
        // Should show first 3 weasel words
        const explanation = result.flags[0].explanation;
        expect(explanation).toContain('may');
        expect(explanation).toContain('help');
        expect(explanation).toContain('support');
        // Should not show 4th and 5th
        expect(result.metadata?.weasel_words).toContain('boost');
        expect(result.metadata?.weasel_words).toContain('enhance');
    });
});
