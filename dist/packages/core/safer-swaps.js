/**
 * Safer Swaps - Alternative Product Suggestions
 *
 * Generates safer alternative product suggestions based on trust scores.
 * Uses mock data for initial release.
 */
// Mock product database for suggestions
const MOCK_PRODUCTS = [
    {
        id: 'prod_001',
        name: 'Organic Whole Wheat Bread',
        trustScore: 95,
        verdict: 'allow',
        keyDifferences: ['No preservatives', 'Organic ingredients', 'Whole grain'],
        thumbnail: undefined,
    },
    {
        id: 'prod_002',
        name: 'Natural Almond Butter',
        trustScore: 98,
        verdict: 'allow',
        keyDifferences: ['100% almonds', 'No added sugar', 'No palm oil'],
        thumbnail: undefined,
    },
    {
        id: 'prod_003',
        name: 'Greek Yogurt Plain',
        trustScore: 92,
        verdict: 'allow',
        keyDifferences: ['High protein', 'No artificial sweeteners', 'Live cultures'],
        thumbnail: undefined,
    },
    {
        id: 'prod_004',
        name: 'Organic Oat Milk',
        trustScore: 88,
        verdict: 'allow',
        keyDifferences: ['Plant-based', 'Fortified with vitamins', 'No added sugar'],
        thumbnail: undefined,
    },
    {
        id: 'prod_005',
        name: 'Whole Grain Crackers',
        trustScore: 85,
        verdict: 'allow',
        keyDifferences: ['Whole grains', 'Low sodium', 'No artificial flavors'],
        thumbnail: undefined,
    },
    {
        id: 'prod_006',
        name: 'Dark Chocolate 70%',
        trustScore: 82,
        verdict: 'allow',
        keyDifferences: ['High cocoa content', 'Low sugar', 'Antioxidants'],
        thumbnail: undefined,
    },
    {
        id: 'prod_007',
        name: 'Quinoa Pasta',
        trustScore: 90,
        verdict: 'allow',
        keyDifferences: ['Gluten-free', 'High protein', 'Complete amino acids'],
        thumbnail: undefined,
    },
    {
        id: 'prod_008',
        name: 'Coconut Water Natural',
        trustScore: 87,
        verdict: 'allow',
        keyDifferences: ['No added sugar', 'Natural electrolytes', 'Low calorie'],
        thumbnail: undefined,
    },
];
const MIN_SCORE_DIFFERENCE = 20;
const MAX_SUGGESTIONS = 3;
const SUGGESTION_THRESHOLD = 80;
/**
 * Generate safer alternative product suggestions
 *
 * @param currentScore - Trust score of the current product
 * @param category - Product category (optional, for future filtering)
 * @returns Array of safer alternative suggestions
 */
export function generateSuggestions(currentScore, _category) {
    // Don't show suggestions for products that already score well
    if (currentScore >= SUGGESTION_THRESHOLD) {
        return [];
    }
    // Filter products that are at least MIN_SCORE_DIFFERENCE points higher
    const eligibleProducts = MOCK_PRODUCTS.filter((product) => product.trustScore >= currentScore + MIN_SCORE_DIFFERENCE);
    // Sort by trust score (highest first)
    const sortedProducts = eligibleProducts.sort((a, b) => b.trustScore - a.trustScore);
    // Return top MAX_SUGGESTIONS
    return sortedProducts.slice(0, MAX_SUGGESTIONS);
}
/**
 * Track click-through rate for suggestions
 * Stores analytics in localStorage
 */
export function trackSuggestionClick(suggestionId) {
    try {
        const storageKey = 'claimlens_suggestion_clicks';
        const stored = localStorage.getItem(storageKey);
        const clicks = stored ? JSON.parse(stored) : {};
        clicks[suggestionId] = (clicks[suggestionId] || 0) + 1;
        localStorage.setItem(storageKey, JSON.stringify(clicks));
    }
    catch (error) {
        console.error('Failed to track suggestion click:', error);
    }
}
/**
 * Get click-through analytics
 * Returns click counts for all suggestions
 */
export function getSuggestionAnalytics() {
    try {
        const storageKey = 'claimlens_suggestion_clicks';
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : {};
    }
    catch (error) {
        console.error('Failed to get suggestion analytics:', error);
        return {};
    }
}
