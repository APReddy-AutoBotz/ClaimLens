/**
 * Input Sanitizer Tests
 * Requirements: 18.1, 18.2
 */
import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeHTML, validateInputLength, sanitizeMenuItem, } from '../input-sanitizer';
describe('Input Sanitizer', () => {
    describe('sanitizeText', () => {
        it('should normalize Unicode to NFC', () => {
            // Combining characters
            const input = 'café'; // e + combining acute accent
            const result = sanitizeText(input);
            expect(result).toBe('café'); // NFC normalized
        });
        it('should remove control characters', () => {
            const input = 'Hello\x00\x01\x02World\x1F';
            const result = sanitizeText(input);
            expect(result).toBe('HelloWorld');
        });
        it('should preserve newlines and tabs', () => {
            const input = 'Line 1\nLine 2\tTabbed';
            const result = sanitizeText(input);
            expect(result).toBe('Line 1\nLine 2\tTabbed');
        });
        it('should enforce length limit', () => {
            const input = 'a'.repeat(15000);
            const result = sanitizeText(input, 10000);
            expect(result.length).toBe(10000);
        });
        it('should handle empty input', () => {
            expect(sanitizeText('')).toBe('');
            expect(sanitizeText(null)).toBe('');
            expect(sanitizeText(undefined)).toBe('');
        });
        it('should handle non-string input', () => {
            expect(sanitizeText(123)).toBe('');
            expect(sanitizeText({})).toBe('');
        });
    });
    describe('sanitizeHTML', () => {
        it('should remove script tags', () => {
            const input = '<div>Safe</div><script>alert("xss")</script><p>More</p>';
            const result = sanitizeHTML(input);
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('alert');
            expect(result).toContain('<div>Safe</div>');
        });
        it('should remove event handlers', () => {
            const input = '<button onclick="alert(1)">Click</button>';
            const result = sanitizeHTML(input);
            expect(result).not.toContain('onclick');
            expect(result).toContain('<button');
        });
        it('should remove javascript: URLs', () => {
            const input = '<a href="javascript:alert(1)">Link</a>';
            const result = sanitizeHTML(input);
            expect(result).not.toContain('javascript:');
        });
        it('should remove data: URLs', () => {
            const input = '<img src="data:text/html,<script>alert(1)</script>">';
            const result = sanitizeHTML(input);
            expect(result).not.toContain('data:');
        });
        it('should remove style expressions', () => {
            const input = '<div style="width: expression(alert(1))">Test</div>';
            const result = sanitizeHTML(input);
            expect(result).not.toContain('expression');
        });
        it('should handle multiple event handlers', () => {
            const input = '<div onload="bad()" onclick="worse()" onmouseover="worst()">Test</div>';
            const result = sanitizeHTML(input);
            expect(result).not.toContain('onload');
            expect(result).not.toContain('onclick');
            expect(result).not.toContain('onmouseover');
        });
        it('should handle empty input', () => {
            expect(sanitizeHTML('')).toBe('');
            expect(sanitizeHTML(null)).toBe('');
        });
    });
    describe('validateInputLength', () => {
        it('should accept valid input', () => {
            const data = {
                name: 'Test Item',
                description: 'A short description',
            };
            const result = validateInputLength(data);
            expect(result.valid).toBe(true);
        });
        it('should reject oversized string fields', () => {
            const data = {
                name: 'a'.repeat(15000),
            };
            const result = validateInputLength(data, 10000);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('name');
        });
        it('should check nested objects', () => {
            const data = {
                nutrition: {
                    label: 'b'.repeat(15000),
                },
            };
            const result = validateInputLength(data, 10000);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('label');
        });
        it('should check array elements', () => {
            const data = {
                ingredients: ['salt', 'c'.repeat(15000), 'pepper'],
            };
            const result = validateInputLength(data, 10000);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('ingredients');
        });
        it('should handle nested arrays', () => {
            const data = {
                items: [
                    { name: 'Item 1' },
                    { name: 'd'.repeat(15000) },
                ],
            };
            const result = validateInputLength(data, 10000);
            expect(result.valid).toBe(false);
        });
    });
    describe('sanitizeMenuItem', () => {
        it('should sanitize all string fields', () => {
            const item = {
                id: 'item-\x00123',
                name: 'Test\x01Item',
                description: 'Description\x1F',
                ingredients: ['salt\x00', 'pepper\x01'],
            };
            const result = sanitizeMenuItem(item);
            expect(result.id).toBe('item-123');
            expect(result.name).toBe('TestItem');
            expect(result.description).toBe('Description');
            expect(result.ingredients).toEqual(['salt', 'pepper']);
        });
        it('should handle string ingredients', () => {
            const item = {
                id: 'item-1',
                name: 'Test',
                ingredients: 'salt, pepper, garlic',
            };
            const result = sanitizeMenuItem(item);
            expect(result.ingredients).toBe('salt, pepper, garlic');
        });
        it('should sanitize nutrition values', () => {
            const item = {
                id: 'item-1',
                name: 'Test',
                nutrition: {
                    calories: '250\x00kcal',
                    protein: '10g',
                },
            };
            const result = sanitizeMenuItem(item);
            expect(result.nutrition.calories).toBe('250kcal');
        });
    });
});
