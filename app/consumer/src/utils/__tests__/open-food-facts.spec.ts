import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lookupBarcode } from '../open-food-facts';

describe('Open Food Facts Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return null for product not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    });

    const result = await lookupBarcode('0000000000000');
    expect(result).toBeNull();
  });

  it('should return product data for valid barcode', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Test Product',
          ingredients_text: 'Water, Sugar',
          allergens_tags: ['en:milk', 'en:soy'],
          nutriments: {
            'energy-kcal_100g': 100,
            fat_100g: 5,
            carbohydrates_100g: 10,
            proteins_100g: 3,
            salt_100g: 0.5,
          },
          image_url: 'https://example.com/image.jpg',
        },
      }),
    });

    const result = await lookupBarcode('1234567890123');
    
    expect(result).toEqual({
      name: 'Test Product',
      ingredients: 'Water, Sugar',
      allergens: ['milk', 'soy'],
      nutrition: {
        energy: '100',
        fat: '5',
        carbohydrates: '10',
        protein: '3',
        salt: '0.5',
      },
      imageUrl: 'https://example.com/image.jpg',
    });
  });

  it('should cache product data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Cached Product',
        },
      }),
    });
    global.fetch = mockFetch;

    // First call
    await lookupBarcode('1234567890123');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await lookupBarcode('1234567890123');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(lookupBarcode('1234567890123')).rejects.toThrow();
  });

  it('should handle rate limiting', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(lookupBarcode('1234567890123')).rejects.toThrow('Rate limit exceeded');
  });
});
