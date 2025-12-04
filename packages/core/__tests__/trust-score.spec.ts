/**
 * Tests for Trust Score Calculator
 */

import { describe, it, expect } from 'vitest';
import { calculateTrustScore, getVerdict } from '../trust-score.js';
import type { TrustScoreInput } from '../trust-score.js';

describe('calculateTrustScore', () => {
  it('should return perfect score with clean bonus for no issues', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(100);
    expect(result.breakdown.baseScore).toBe(90);
    expect(result.breakdown.cleanBonus).toBe(10);
    expect(result.breakdown.bannedClaimsDeduction).toBe(0);
    expect(result.breakdown.recallDeduction).toBe(0);
    expect(result.breakdown.allergenDeduction).toBe(0);
    expect(result.breakdown.weaselWordDeduction).toBe(0);
  });

  it('should deduct 30 points per banned claim', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 2,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(30); // 90 - 60 = 30
    expect(result.breakdown.bannedClaimsDeduction).toBe(60);
    expect(result.breakdown.cleanBonus).toBe(0);
  });

  it('should deduct 25 points for recall', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: true,
      userAllergensCount: 0,
      weaselWordDensity: 0,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(65); // 90 - 25 = 65
    expect(result.breakdown.recallDeduction).toBe(25);
    expect(result.breakdown.cleanBonus).toBe(0);
  });

  it('should deduct 15 points per user allergen', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 3,
      weaselWordDensity: 0,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(45); // 90 - 45 = 45
    expect(result.breakdown.allergenDeduction).toBe(45);
    expect(result.breakdown.cleanBonus).toBe(0);
  });

  it('should deduct 15 points for weasel word density >20%', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0.25,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(75); // 90 - 15 = 75
    expect(result.breakdown.weaselWordDeduction).toBe(15);
    expect(result.breakdown.cleanBonus).toBe(0);
  });

  it('should deduct 12 points for weasel word density 10-20%', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0.15,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(78); // 90 - 12 = 78
    expect(result.breakdown.weaselWordDeduction).toBe(12);
  });

  it('should deduct 8 points for weasel word density 5-10%', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0.07,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(82); // 90 - 8 = 82
    expect(result.breakdown.weaselWordDeduction).toBe(8);
  });

  it('should not deduct for weasel word density <5%', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0.03,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(100); // 90 + 10 = 100
    expect(result.breakdown.weaselWordDeduction).toBe(0);
    expect(result.breakdown.cleanBonus).toBe(10);
  });

  it('should handle multiple issues combined', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 1,
      hasRecall: true,
      userAllergensCount: 2,
      weaselWordDensity: 0.12,
    };
    
    const result = calculateTrustScore(input);
    
    // 90 - 30 - 25 - 30 - 12 = -7, clamped to 0
    expect(result.score).toBe(0);
    expect(result.breakdown.bannedClaimsDeduction).toBe(30);
    expect(result.breakdown.recallDeduction).toBe(25);
    expect(result.breakdown.allergenDeduction).toBe(30);
    expect(result.breakdown.weaselWordDeduction).toBe(12);
    expect(result.breakdown.cleanBonus).toBe(0);
  });

  it('should clamp negative scores to 0', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 5,
      hasRecall: true,
      userAllergensCount: 3,
      weaselWordDensity: 0.25,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBe(0);
    expect(result.breakdown.finalScore).toBe(0);
  });

  it('should clamp scores above 100 to 100', () => {
    // This shouldn't happen with current logic, but test the clamp
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should be deterministic (same input = same output)', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 1,
      hasRecall: true,
      userAllergensCount: 1,
      weaselWordDensity: 0.08,
    };
    
    const result1 = calculateTrustScore(input);
    const result2 = calculateTrustScore(input);
    
    expect(result1.score).toBe(result2.score);
    expect(result1.breakdown).toEqual(result2.breakdown);
  });

  it('should handle edge case: exactly 20% weasel word density', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0.20,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.breakdown.weaselWordDeduction).toBe(12);
  });

  it('should handle edge case: exactly 10% weasel word density', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0.10,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.breakdown.weaselWordDeduction).toBe(12);
  });

  it('should handle edge case: exactly 5% weasel word density', () => {
    const input: TrustScoreInput = {
      bannedClaimsCount: 0,
      hasRecall: false,
      userAllergensCount: 0,
      weaselWordDensity: 0.05,
    };
    
    const result = calculateTrustScore(input);
    
    expect(result.breakdown.weaselWordDeduction).toBe(8);
  });
});

describe('getVerdict', () => {
  it('should return "allow" verdict for score 80-100', () => {
    const verdict80 = getVerdict(80);
    const verdict95 = getVerdict(95);
    const verdict100 = getVerdict(100);
    
    expect(verdict80.label).toBe('allow');
    expect(verdict80.color).toBe('#10B981');
    expect(verdict80.icon).toBe('✓');
    expect(verdict80.explanation).toContain('safety standards');
    
    expect(verdict95.label).toBe('allow');
    expect(verdict100.label).toBe('allow');
  });

  it('should return "caution" verdict for score 50-79', () => {
    const verdict50 = getVerdict(50);
    const verdict65 = getVerdict(65);
    const verdict79 = getVerdict(79);
    
    expect(verdict50.label).toBe('caution');
    expect(verdict50.color).toBe('#F59E0B');
    expect(verdict50.icon).toBe('⚠');
    expect(verdict50.explanation).toContain('some concerns');
    
    expect(verdict65.label).toBe('caution');
    expect(verdict79.label).toBe('caution');
  });

  it('should return "avoid" verdict for score 0-49', () => {
    const verdict0 = getVerdict(0);
    const verdict25 = getVerdict(25);
    const verdict49 = getVerdict(49);
    
    expect(verdict0.label).toBe('avoid');
    expect(verdict0.color).toBe('#EF4444');
    expect(verdict0.icon).toBe('✕');
    expect(verdict0.explanation).toContain('significant');
    
    expect(verdict25.label).toBe('avoid');
    expect(verdict49.label).toBe('avoid');
  });

  it('should have consumer-friendly explanations', () => {
    const allowVerdict = getVerdict(90);
    const cautionVerdict = getVerdict(60);
    const avoidVerdict = getVerdict(30);
    
    // Check that explanations are not overly technical
    expect(allowVerdict.explanation).not.toContain('algorithm');
    expect(cautionVerdict.explanation).not.toContain('threshold');
    expect(avoidVerdict.explanation).not.toContain('score');
  });

  it('should return verdict with all required fields', () => {
    const verdict = getVerdict(75);
    
    expect(verdict).toHaveProperty('label');
    expect(verdict).toHaveProperty('color');
    expect(verdict).toHaveProperty('icon');
    expect(verdict).toHaveProperty('explanation');
  });
});
