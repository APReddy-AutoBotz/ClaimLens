/**
 * Trust Score Calculator for B2C Consumer Mode
 * Local copy for standalone deployment
 */

export interface TrustScoreInput {
  bannedClaimsCount: number;
  hasRecall: boolean;
  userAllergensCount: number;
  weaselWordDensity: number;
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

export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult {
  const baseScore = 90;
  
  // Cap banned claims deduction at 50 points max (prevents instant zero)
  const bannedClaimsDeduction = Math.min(input.bannedClaimsCount * 15, 50);
  const recallDeduction = input.hasRecall ? 25 : 0;
  const allergenDeduction = Math.min(input.userAllergensCount * 10, 30);
  
  let weaselWordDeduction = 0;
  if (input.weaselWordDensity > 0.20) {
    weaselWordDeduction = 15;
  } else if (input.weaselWordDensity >= 0.10) {
    weaselWordDeduction = 12;
  } else if (input.weaselWordDensity >= 0.05) {
    weaselWordDeduction = 8;
  }
  
  const hasNoIssues = 
    input.bannedClaimsCount === 0 &&
    !input.hasRecall &&
    input.userAllergensCount === 0 &&
    input.weaselWordDensity < 0.05;
  
  const cleanBonus = hasNoIssues ? 10 : 0;
  
  const rawScore = baseScore 
    - bannedClaimsDeduction 
    - recallDeduction 
    - allergenDeduction 
    - weaselWordDeduction 
    + cleanBonus;
  
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
