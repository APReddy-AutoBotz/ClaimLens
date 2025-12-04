import { describe, it, expect } from 'vitest';
import { generateDisplayName } from '../displayName';

describe('generateDisplayName', () => {
  it('should use API product name when available', () => {
    const result = generateDisplayName({
      method: 'url',
      urlInput: 'https://example.com/product/123',
      apiProductName: 'Organic Almond Milk',
    });
    expect(result).toBe('Organic Almond Milk');
  });

  it('should extract name from URL path', () => {
    const result = generateDisplayName({
      method: 'url',
      urlInput: 'https://example.com/products/organic-almond-milk',
    });
    expect(result).toBe('Organic Almond Milk');
  });

  it('should use domain for simple URLs', () => {
    const result = generateDisplayName({
      method: 'url',
      urlInput: 'https://example.com',
    });
    expect(result).toBe('Product from example.com');
  });

  it('should extract name from text first line', () => {
    const result = generateDisplayName({
      method: 'text',
      textInput: 'Immunity Booster Juice\nIngredients: Water, Sugar...',
    });
    expect(result).toBe('Immunity Booster Juice');
  });

  it('should truncate long text names', () => {
    const longText = 'A'.repeat(60);
    const result = generateDisplayName({
      method: 'text',
      textInput: longText,
    });
    expect(result).toHaveLength(50);
    expect(result).toContain('...');
  });

  it('should format barcode with code', () => {
    const result = generateDisplayName({
      method: 'barcode',
      barcodeCode: '1234567890',
    });
    expect(result).toBe('Barcode 1234567890');
  });

  it('should use extracted text for screenshots', () => {
    const result = generateDisplayName({
      method: 'screenshot',
      extractedText: 'Product Name from OCR\nMore text...',
    });
    expect(result).toBe('Product Name from OCR');
  });

  it('should fallback to method-specific defaults', () => {
    expect(generateDisplayName({ method: 'url' })).toBe('Web Product');
    expect(generateDisplayName({ method: 'text' })).toBe('Text Scan');
    expect(generateDisplayName({ method: 'screenshot' })).toBe('Screenshot Scan');
    expect(generateDisplayName({ method: 'barcode' })).toBe('Barcode Scan');
  });
});
