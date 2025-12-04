/**
 * Safer Swaps - Alternative Product Suggestions
 * Local copy for standalone deployment
 */

export interface SaferSwapSuggestion {
  id: string;
  name: string;
  trustScore: number;
  verdict: 'allow' | 'caution' | 'avoid';
  keyDifferences: string[];
  thumbnail?: string;
}

const MOCK_PRODUCTS: SaferSwapSuggestion[] = [
  {
    id: 'prod_001',
    name: 'Organic Whole Wheat Bread',
    trustScore: 95,
    verdict: 'allow',
    keyDifferences: ['No preservatives', 'Organic ingredients', 'Whole grain'],
  },
  {
    id: 'prod_002',
    name: 'Natural Almond Butter',
    trustScore: 98,
    verdict: 'allow',
    keyDifferences: ['100% almonds', 'No added sugar', 'No palm oil'],
  },
  {
    id: 'prod_003',
    name: 'Greek Yogurt Plain',
    trustScore: 92,
    verdict: 'allow',
    keyDifferences: ['High protein', 'No artificial sweeteners', 'Live cultures'],
  },
  {
    id: 'prod_004',
    name: 'Organic Oat Milk',
    trustScore: 88,
    verdict: 'allow',
    keyDifferences: ['Plant-based', 'Fortified with vitamins', 'No added sugar'],
  },
  {
    id: 'prod_005',
    name: 'Whole Grain Crackers',
    trustScore: 85,
    verdict: 'allow',
    keyDifferences: ['Whole grains', 'Low sodium', 'No artificial flavors'],
  },
];

const MIN_SCORE_DIFFERENCE = 20;
const MAX_SUGGESTIONS = 3;
const SUGGESTION_THRESHOLD = 80;

export function generateSuggestions(
  currentScore: number,
  _category?: string
): SaferSwapSuggestion[] {
  if (currentScore >= SUGGESTION_THRESHOLD) {
    return [];
  }

  const eligibleProducts = MOCK_PRODUCTS.filter(
    (product) => product.trustScore >= currentScore + MIN_SCORE_DIFFERENCE
  );

  const sortedProducts = eligibleProducts.sort(
    (a, b) => b.trustScore - a.trustScore
  );

  return sortedProducts.slice(0, MAX_SUGGESTIONS);
}

export function trackSuggestionClick(suggestionId: string): void {
  try {
    const storageKey = 'claimlens_suggestion_clicks';
    const stored = localStorage.getItem(storageKey);
    const clicks = stored ? JSON.parse(stored) : {};
    clicks[suggestionId] = (clicks[suggestionId] || 0) + 1;
    localStorage.setItem(storageKey, JSON.stringify(clicks));
  } catch (error) {
    console.error('Failed to track suggestion click:', error);
  }
}
