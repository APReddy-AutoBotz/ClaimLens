import { describe, it, expect } from 'vitest';
import { rewriteDisclaimer } from '../rewrite.disclaimer.js';
describe('rewriteDisclaimer', () => {
    it('should pass through text without banned claims', () => {
        const result = rewriteDisclaimer('Delicious organic smoothie with fresh fruits');
        expect(result.text).toBe('Delicious organic smoothie with fresh fruits');
        expect(result.appended).toBe(false);
    });
    it('should append disclaimer for banned claims', () => {
        const result = rewriteDisclaimer('Amazing superfood smoothie for detox');
        expect(result.text).toContain('This claim has not been evaluated by FSSAI');
        expect(result.appended).toBe(true);
        expect(result.text).toMatch(/\(.*\)$/); // Ends with disclaimer in parentheses
    });
    it('should handle case-insensitive matching', () => {
        const testCases = [
            'SUPERFOOD blend',
            'Superfood Blend',
            'superfood blend',
            'SuperFood blend'
        ];
        testCases.forEach(text => {
            const result = rewriteDisclaimer(text);
            expect(result.appended).toBe(true);
            expect(result.text).toContain('FSSAI');
        });
    });
    it('should preserve original spacing and formatting', () => {
        const originalText = '  Miracle cure smoothie  ';
        const result = rewriteDisclaimer(originalText);
        expect(result.text.startsWith('  Miracle cure smoothie  ')).toBe(true);
        expect(result.text).toContain('(This claim has not been evaluated');
        expect(result.appended).toBe(true);
    });
    it('should handle different locales', () => {
        const text = 'Superfood energy drink';
        const enIN = rewriteDisclaimer(text, 'en-IN');
        expect(enIN.text).toContain('FSSAI');
        const enUS = rewriteDisclaimer(text, 'en-US');
        expect(enUS.text).toContain('FDA');
        const enGB = rewriteDisclaimer(text, 'en-GB');
        expect(enGB.text).toContain('FSA');
    });
    it('should fallback to en-IN for unknown locales', () => {
        const result = rewriteDisclaimer('Detox smoothie', 'fr-FR');
        expect(result.text).toContain('FSSAI');
        expect(result.appended).toBe(true);
    });
    it('should handle empty or invalid input', () => {
        expect(rewriteDisclaimer('')).toEqual({ text: '', appended: false });
        expect(rewriteDisclaimer(null)).toEqual({ text: '', appended: false });
        expect(rewriteDisclaimer(undefined)).toEqual({ text: '', appended: false });
    });
    it('should detect multiple banned claims', () => {
        const result = rewriteDisclaimer('Miracle superfood detox cure');
        expect(result.appended).toBe(true);
        expect(result.text).toContain('FSSAI');
        expect(result.detectedClaims).toBeDefined();
        expect(result.detectedClaims.length).toBeGreaterThan(0);
    });
    it('should classify health claims correctly', () => {
        const result = rewriteDisclaimer('This cure will heal you');
        expect(result.category).toBe('health');
        expect(result.text).toContain('diagnose, treat, cure or prevent');
    });
    it('should classify nutrition claims correctly', () => {
        const result = rewriteDisclaimer('Amazing superfood with zero chemicals');
        expect(result.category).toBe('nutrition');
        expect(result.text).toContain('Nutritional claims');
    });
    it('should classify marketing claims correctly', () => {
        const result = rewriteDisclaimer('Guaranteed results with this product');
        expect(result.category).toBe('marketing');
        expect(result.text).toContain('marketing claim');
    });
    it('should use category-specific disclaimers for different locales', () => {
        const healthText = 'Miracle cure';
        const nutritionText = 'Superfood blend';
        // Health claim - en-IN
        const healthIN = rewriteDisclaimer(healthText, 'en-IN');
        expect(healthIN.text).toContain('FSSAI');
        expect(healthIN.text).toContain('diagnose, treat, cure');
        // Health claim - en-US
        const healthUS = rewriteDisclaimer(healthText, 'en-US');
        expect(healthUS.text).toContain('FDA');
        expect(healthUS.text).toContain('diagnose, treat, cure');
        // Nutrition claim - en-IN
        const nutritionIN = rewriteDisclaimer(nutritionText, 'en-IN');
        expect(nutritionIN.text).toContain('Nutritional claims');
        expect(nutritionIN.text).toContain('FSSAI');
    });
});
describe('rewriteDisclaimerTransform (pipeline interface)', () => {
    it('should return TransformResult with flags when disclaimer is added', async () => {
        const { rewriteDisclaimerTransform } = await import('../rewrite.disclaimer.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = rewriteDisclaimerTransform('Amazing superfood detox', context);
        expect(result.modified).toBe(true);
        expect(result.flags).toHaveLength(1);
        expect(result.flags[0].kind).toBe('warn');
        expect(result.flags[0].label).toBe('Disclaimer added');
        expect(result.metadata?.category).toBeDefined();
        expect(result.metadata?.detected_claims).toBeDefined();
    });
    it('should return unmodified result when no banned claims detected', async () => {
        const { rewriteDisclaimerTransform } = await import('../rewrite.disclaimer.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = rewriteDisclaimerTransform('Delicious organic smoothie', context);
        expect(result.modified).toBe(false);
        expect(result.flags).toHaveLength(0);
    });
});
