import { describe, it, expect } from 'vitest';
import { redactPii } from '../redact.pii.js';
describe('redactPii', () => {
    it('should pass through text without PII', () => {
        const result = redactPii('Delicious food delivery available in Mumbai');
        expect(result.text).toBe('Delicious food delivery available in Mumbai');
        expect(result.counts).toEqual({ email: 0, phone: 0, pincode: 0 });
    });
    it('should redact email addresses', () => {
        const testCases = [
            'Contact us at support@claimlens.com for help',
            'Email: user.name+tag@example.co.in',
            'Send feedback to test123@domain.org'
        ];
        testCases.forEach(text => {
            const result = redactPii(text);
            expect(result.text).toContain('[EMAIL_REDACTED]');
            expect(result.text).not.toMatch(/@/);
            expect(result.counts.email).toBe(1);
        });
    });
    it('should redact Indian phone numbers', () => {
        const testCases = [
            'Call us at +91 9876543210',
            'Phone: +91-8765432109',
            'Contact 7654321098 for orders',
            'WhatsApp: 9123456789'
        ];
        testCases.forEach(text => {
            const result = redactPii(text);
            expect(result.text).toContain('[PHONE_REDACTED]');
            expect(result.counts.phone).toBe(1);
        });
    });
    it('should NOT redact invalid phone numbers', () => {
        const invalidCases = [
            'Call 1234567890', // Doesn't start with 6-9
            'Phone: 12345' // Too short
        ];
        invalidCases.forEach(text => {
            const result = redactPii(text);
            expect(result.text).toBe(text); // Unchanged
            expect(result.counts.phone).toBe(0);
        });
        // Note: 11-digit numbers starting with 9 will partially match (first 10 digits)
        // This is expected behavior for the conservative regex
    });
    it('should redact pincodes in context', () => {
        const testCases = [
            'Delivery to pincode 400001',
            'Pin code: 110001',
            'Postal code 560001 area',
            'ZIP CODE 400070'
        ];
        testCases.forEach(text => {
            const result = redactPii(text);
            expect(result.text).toContain('[PINCODE_REDACTED]');
            expect(result.text).not.toMatch(/\d{6}/);
            expect(result.counts.pincode).toBe(1);
        });
    });
    it('should NOT redact standalone 6-digit numbers', () => {
        const result = redactPii('Order number 123456 is ready');
        expect(result.text).toBe('Order number 123456 is ready');
        expect(result.counts.pincode).toBe(0);
    });
    it('should handle multiple PII types in same text', () => {
        const text = 'Contact john@example.com or call +91 9876543210. Delivery to pin code 400001.';
        const result = redactPii(text);
        expect(result.text).toContain('[EMAIL_REDACTED]');
        expect(result.text).toContain('[PHONE_REDACTED]');
        expect(result.text).toContain('[PINCODE_REDACTED]');
        expect(result.counts).toEqual({ email: 1, phone: 1, pincode: 1 });
    });
    it('should handle empty or invalid input', () => {
        const emptyResult = redactPii('');
        expect(emptyResult).toEqual({
            text: '',
            counts: { email: 0, phone: 0, pincode: 0 }
        });
        const nullResult = redactPii(null);
        expect(nullResult.text).toBe('');
        expect(nullResult.counts).toEqual({ email: 0, phone: 0, pincode: 0 });
    });
    it('should preserve text formatting and spacing', () => {
        const text = '  Contact: user@test.com  \n  Phone: +91 9876543210  ';
        const result = redactPii(text);
        expect(result.text).toMatch(/^\s+Contact: \[EMAIL_REDACTED\]\s+\n\s+Phone: \[PHONE_REDACTED\]\s+$/);
    });
    it('should normalize Unicode text with NFC before processing', () => {
        // Test with decomposed Unicode (NFD) - café as cafe\u0301
        // Using phone number to test normalization since email regex is ASCII-focused
        const nfdText = 'Cafe\u0301 delivery: +91 9876543210';
        const result = redactPii(nfdText);
        // Should normalize to NFC form and still redact phone
        expect(result.text).not.toContain('\u0301'); // Decomposed form should be normalized
        expect(result.text).toContain('[PHONE_REDACTED]');
        expect(result.counts.phone).toBe(1);
    });
});
describe('redactPiiTransform (pipeline interface)', () => {
    it('should return TransformResult with flags when PII is redacted', async () => {
        const { redactPiiTransform } = await import('../redact.pii.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = redactPiiTransform('Contact user@test.com or +91 9876543210', context);
        expect(result.text).toContain('[EMAIL_REDACTED]');
        expect(result.text).toContain('[PHONE_REDACTED]');
        expect(result.modified).toBe(true);
        expect(result.flags).toHaveLength(1);
        expect(result.flags[0].kind).toBe('ok');
        expect(result.flags[0].label).toBe('PII Protected');
        expect(result.metadata?.redaction_counts).toEqual({ email: 1, phone: 1, pincode: 0 });
    });
    it('should return unmodified result when no PII detected', async () => {
        const { redactPiiTransform } = await import('../redact.pii.js');
        const context = {
            locale: 'en-IN',
            tenant: 'test-tenant',
            correlationId: 'test-123'
        };
        const result = redactPiiTransform('Delicious food delivery', context);
        expect(result.text).toBe('Delicious food delivery');
        expect(result.modified).toBe(false);
        expect(result.flags).toHaveLength(0);
    });
});
