/**
 * ClaimLens Weasel Word Detector
 * Detects vague marketing language that lacks scientific backing
 */

import type { TransformContext, TransformResult, Flag } from '@claimlens/core';

/**
 * List of weasel words commonly used in food marketing
 * These words make claims sound scientific without providing evidence
 */
const WEASEL_WORDS = [
  'may',
  'might',
  'could',
  'help',
  'helps',
  'support',
  'supports',
  'promote',
  'promotes',
  'boost',
  'boosts',
  'enhance',
  'enhances',
  'improve',
  'improves',
  'up to',
  'as much as',
  'virtually',
  'act',
  'acts',
  'work',
  'works',
  'refresh',
  'refreshes',
  'revitalize',
  'revitalizes',
  'strengthen',
  'strengthens',
  'fight',
  'fights',
  'combat',
  'combats',
  'tackle',
  'tackles',
  'natural',
  'pure',
  'wholesome',
  'goodness',
];

export interface WeaselWordResult {
  weaselWords: string[];
  density: number;
  totalWords: number;
  weaselWordCount: number;
}

/**
 * Detect weasel words in text and calculate density
 * @param text - Input text to analyze
 * @returns Object with detected weasel words and density metrics
 */
export function detectWeaselWords(text: string): WeaselWordResult {
  if (!text || typeof text !== 'string') {
    return {
      weaselWords: [],
      density: 0,
      totalWords: 0,
      weaselWordCount: 0,
    };
  }

  // Normalize text to lowercase and split into words
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      weaselWords: [],
      density: 0,
      totalWords: 0,
      weaselWordCount: 0,
    };
  }

  const detectedWeaselWords = new Set<string>();
  let weaselWordCount = 0;

  // Check for single-word weasel words
  for (const word of words) {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[.,!?;:()]/g, '');
    if (WEASEL_WORDS.includes(cleanWord)) {
      detectedWeaselWords.add(cleanWord);
      weaselWordCount++;
    }
  }

  // Check for multi-word phrases
  const textForPhrases = normalizedText.replace(/[.,!?;:()]/g, '');
  for (const phrase of WEASEL_WORDS) {
    if (phrase.includes(' ') && textForPhrases.includes(phrase)) {
      detectedWeaselWords.add(phrase);
      // Count phrase occurrences
      const phraseWords = phrase.split(' ').length;
      weaselWordCount += phraseWords;
    }
  }

  const density = weaselWordCount / totalWords;

  return {
    weaselWords: Array.from(detectedWeaselWords),
    density,
    totalWords,
    weaselWordCount,
  };
}

/**
 * Calculate point deduction based on weasel word density
 * @param density - Weasel word density (0-1)
 * @returns Point deduction amount
 */
export function calculateDeduction(density: number): number {
  if (density > 0.20) {
    return 20;
  } else if (density >= 0.10) {
    return 15;
  } else if (density >= 0.05) {
    return 10;
  }
  return 0;
}

/**
 * Transform pipeline interface for weasel word detection
 * @param input - Text to analyze
 * @param context - Transform context
 * @returns Transform result with weasel word flags
 */
export function detectWeaselWordsTransform(
  input: string,
  context: TransformContext
): TransformResult {
  const result = detectWeaselWords(input);
  const flags: Flag[] = [];

  const deduction = calculateDeduction(result.density);

  // Only flag if density is significant (>= 5%)
  if (result.density >= 0.05) {
    const densityPercent = (result.density * 100).toFixed(1);

    flags.push({
      kind: result.density > 0.20 ? 'danger' : 'warn',
      label: 'Vague marketing language',
      explanation: `Contains ${result.weaselWordCount} vague terms (${densityPercent}% density) like "${result.weaselWords.slice(0, 3).join('", "')}" that lack scientific backing`,
      source: 'https://claimlens.dev/docs/weasel-words',
    });
  }

  return {
    text: input,
    modified: false,
    flags,
    metadata: {
      weasel_words: result.weaselWords,
      density: result.density,
      total_words: result.totalWords,
      weasel_word_count: result.weaselWordCount,
      deduction,
    },
  };
}
