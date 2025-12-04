const CACHE_KEY_PREFIX = 'off_barcode_';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const RATE_LIMIT_DELAY_MS = 600; // 100 requests/minute = 600ms between requests
let lastRequestTime = 0;
async function rateLimitedFetch(url) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
    return fetch(url);
}
function getCachedProduct(barcode) {
    try {
        const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${barcode}`);
        if (!cached)
            return null;
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age > CACHE_DURATION_MS) {
            localStorage.removeItem(`${CACHE_KEY_PREFIX}${barcode}`);
            return null;
        }
        return data;
    }
    catch {
        return null;
    }
}
function cacheProduct(barcode, data) {
    try {
        localStorage.setItem(`${CACHE_KEY_PREFIX}${barcode}`, JSON.stringify({
            data,
            timestamp: Date.now(),
        }));
    }
    catch (error) {
        console.warn('Failed to cache product data:', error);
    }
}
export async function lookupBarcode(barcode) {
    // Check cache first
    const cached = getCachedProduct(barcode);
    if (cached) {
        return cached;
    }
    try {
        // Fetch from Open Food Facts API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await rateLimitedFetch(`${API_BASE_URL}/product/${barcode}.json`);
        clearTimeout(timeoutId);
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            }
            throw new Error(`API request failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.status !== 1 || !data.product) {
            return null; // Product not found
        }
        const product = data.product;
        const productData = {
            name: product.product_name || 'Unknown Product',
            ingredients: product.ingredients_text,
            allergens: product.allergens_tags?.map(tag => tag.replace('en:', '').replace(/-/g, ' ')) || [],
            nutrition: product.nutriments ? {
                energy: product.nutriments['energy-kcal_100g']?.toString(),
                fat: product.nutriments.fat_100g?.toString(),
                carbohydrates: product.nutriments.carbohydrates_100g?.toString(),
                protein: product.nutriments.proteins_100g?.toString(),
                salt: product.nutriments.salt_100g?.toString(),
            } : undefined,
            imageUrl: product.image_url,
        };
        // Cache the result
        cacheProduct(barcode, productData);
        return productData;
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw error;
    }
}
