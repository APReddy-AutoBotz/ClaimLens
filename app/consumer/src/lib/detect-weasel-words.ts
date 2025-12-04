/**
 * Weasel Word Detector for B2C Consumer Mode
 * Local copy for standalone deployment
 */

const WEASEL_WORDS = [
  'may', 'might', 'could', 'help', 'helps', 'support', 'supports',
  'promote', 'promotes', 'boost', 'boosts', 'enhance', 'enhances',
  'improve', 'improves', 'up to', 'as much as', 'virtually',
  'act', 'acts', 'work', 'works', 'refresh', 'refreshes',
  'revitalize', 'revitalizes', 'strengthen', 'strengthens',
  'fight', 'fights', 'combat', 'combats', 'tackle', 'tackles',
  'natural', 'pure', 'wholesome', 'goodness',
];

export interface WeaselWordResult {
  weaselWords: string[];
  density: number;
  totalWords: number;
  weaselWordCount: number;
}

export function detectWeaselWords(text: string): WeaselWordResult {
  if (!text || typeof text !== 'string') {
    return { weaselWords: [], density: 0, totalWords: 0, weaselWordCount: 0 };
  }

  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords === 0) {
    return { weaselWords: [], density: 0, totalWords: 0, weaselWordCount: 0 };
  }

  const detectedWeaselWords = new Set<string>();
  let weaselWordCount = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:()]/g, '');
    if (WEASEL_WORDS.includes(cleanWord)) {
      detectedWeaselWords.add(cleanWord);
      weaselWordCount++;
    }
  }

  const textForPhrases = normalizedText.replace(/[.,!?;:()]/g, '');
  for (const phrase of WEASEL_WORDS) {
    if (phrase.includes(' ') && textForPhrases.includes(phrase)) {
      detectedWeaselWords.add(phrase);
      weaselWordCount += phrase.split(' ').length;
    }
  }

  return {
    weaselWords: Array.from(detectedWeaselWords),
    density: weaselWordCount / totalWords,
    totalWords,
    weaselWordCount,
  };
}
