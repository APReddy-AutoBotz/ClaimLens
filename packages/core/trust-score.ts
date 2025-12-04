/**
 * Trust Score Calculator for B2C Consumer Mode
 * 
 * Calculates a 0-100 trust score based on detected issues:
 * - Base score: 90
 * - Banned claims: -30 per claim
 * - Recalls: -25
 * - User allergens: -15 per allergen
 * - Weasel words: -10 to -15 based on density
 * - Clean bonus: +10 if no issues
 */

export interface TrustScoreInput {
  bannedClaimsCount: number;
  hasRecall: boolean;
  userAllergensCount: number;
  weaselWordDensity: number; // 0-1 (percentage as decimal)
}

export interface TrustScoreBreakdown {
  baseScore: number;
  bannedClaimsDeduction: number;
  recallDeduction: number;
  allergenDeduction: number;
  weaselWordDeduction: number;
  cleanBonus: number;
  finalScore: number;
}

export interface TrustScoreResult {
  score: number;
  breakdown: TrustScoreBreakdown;
}

/**
 * Calculate trust score based on detected issues
 * Pure function with deterministic output
 */
export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult {
  const baseScore = 90;
  
  // Calculate deductions
  const bannedClaimsDeduction = input.bannedClaimsCount * 30;
  const recallDeduction = input.hasRecall ? 25 : 0;
  const allergenDeduction = input.userAllergensCount * 15;
  
  // Weasel word deduction based on density
  let weaselWordDeduction = 0;
  if (input.weaselWordDensity > 0.20) {
    weaselWordDeduction = 15;
  } else if (input.weaselWordDensity >= 0.10) {
    weaselWordDeduction = 12;
  } else if (input.weaselWordDensity >= 0.05) {
    weaselWordDeduction = 8;
  }
  
  // Calculate if clean (no issues)
  // Weasel words below 5% density don't count as an issue
  const hasNoIssues = 
    input.bannedClaimsCount === 0 &&
    !input.hasRecall &&
    input.userAllergensCount === 0 &&
    input.weaselWordDensity < 0.05;
  
  const cleanBonus = hasNoIssues ? 10 : 0;
  
  // Calculate final score
  const rawScore = baseScore 
    - bannedClaimsDeduction 
    - recallDeduction 
    - allergenDeduction 
    - weaselWordDeduction 
    + cleanBonus;
  
  // Clamp to 0-100 range
  const finalScore = Math.max(0, Math.min(100, rawScore));
  
  return {
    score: finalScore,
    breakdown: {
      baseScore,
      bannedClaimsDeduction,
      recallDeduction,
      allergenDeduction,
      weaselWordDeduction,
      cleanBonus,
      finalScore,
    },
  };
}

export interface Verdict {
  label: 'allow' | 'caution' | 'avoid';
  color: string;
  icon: string;
  explanation: string;
}

/**
 * Get verdict classification based on trust score
 */
export function getVerdict(score: number): Verdict {
  if (score >= 80) {
    return {
      label: 'allow',
      color: '#10B981',
      icon: '✓',
      explanation: 'This product meets safety standards with minimal concerns.',
    };
  }
  
  if (score >= 50) {
    return {
      label: 'caution',
      color: '#F59E0B',
      icon: '⚠',
      explanation: 'This product has some concerns. Review the details before deciding.',
    };
  }
  
  return {
    label: 'avoid',
    color: '#EF4444',
    icon: '✕',
    explanation: 'This product has significant safety or accuracy concerns.',
  };
}
