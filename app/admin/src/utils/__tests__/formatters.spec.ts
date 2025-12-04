import { describe, it, expect } from 'vitest';
import {
  formatMs,
  formatScore,
  formatPercent,
  formatLatencyComparison,
  formatRiskLevel,
  formatCount
} from '../formatters';

describe('formatMs', () => {
  it('formats valid millisecond values', () => {
    expect(formatMs(245)).toBe('245ms');
    expect(formatMs(0)).toBe('0ms');
    expect(formatMs(1234.56)).toBe('1235ms'); // rounds
  });

  it('returns fallback for null/undefined/NaN', () => {
    expect(formatMs(null)).toBe('—');
    expect(formatMs(undefined)).toBe('—');
    expect(formatMs(NaN)).toBe('—');
  });

  it('supports custom fallback', () => {
    expect(formatMs(null, 'N/A')).toBe('N/A');
  });
});

describe('formatScore', () => {
  it('formats valid score values', () => {
    expect(formatScore(75)).toBe('75/100');
    expect(formatScore(0)).toBe('0/100');
    expect(formatScore(100)).toBe('100/100');
    expect(formatScore(45.7)).toBe('46/100'); // rounds
  });

  it('returns fallback for null/undefined/NaN', () => {
    expect(formatScore(null)).toBe('—');
    expect(formatScore(undefined)).toBe('—');
    expect(formatScore(NaN)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats valid percentage values', () => {
    expect(formatPercent(0.25)).toBe('25.00%');
    expect(formatPercent(0.002)).toBe('0.20%');
    expect(formatPercent(1)).toBe('100.00%');
  });

  it('respects decimal places', () => {
    expect(formatPercent(0.25, 0)).toBe('25%');
    expect(formatPercent(0.25, 1)).toBe('25.0%');
  });

  it('returns fallback for null/undefined/NaN', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
  });
});

describe('formatLatencyComparison', () => {
  it('formats valid latency comparison', () => {
    expect(formatLatencyComparison(245, 300)).toBe('245ms / 300ms');
  });

  it('handles missing p95 with fallback', () => {
    expect(formatLatencyComparison(null, 300)).toBe('— / 300ms');
    expect(formatLatencyComparison(undefined, 300)).toBe('— / 300ms');
  });

  it('handles missing budget with fallback', () => {
    expect(formatLatencyComparison(245, null)).toBe('245ms / —');
  });

  it('handles both missing', () => {
    expect(formatLatencyComparison(null, null)).toBe('— / —');
  });
});

describe('formatRiskLevel', () => {
  it('formats valid risk levels', () => {
    expect(formatRiskLevel('low', 25)).toBe('Low Risk');
    expect(formatRiskLevel('medium', 50)).toBe('Medium Risk');
    expect(formatRiskLevel('high', 85)).toBe('High Risk');
  });

  it('returns "Unknown Risk" when score is missing', () => {
    expect(formatRiskLevel('low', null)).toBe('Unknown Risk');
    expect(formatRiskLevel('medium', undefined)).toBe('Unknown Risk');
    expect(formatRiskLevel('high', NaN)).toBe('Unknown Risk');
  });

  it('returns "No Data" when score is 0 and level is missing', () => {
    expect(formatRiskLevel(null, 0)).toBe('No Data');
    expect(formatRiskLevel(undefined, 0)).toBe('No Data');
  });

  it('returns "Unknown Risk" when level is missing but score exists', () => {
    expect(formatRiskLevel(null, 50)).toBe('Unknown Risk');
  });
});

describe('formatCount', () => {
  it('formats valid count values', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(5)).toBe('5');
    expect(formatCount(1234)).toBe('1234');
  });

  it('returns fallback for null/undefined/NaN', () => {
    expect(formatCount(null)).toBe('0');
    expect(formatCount(undefined)).toBe('0');
    expect(formatCount(NaN)).toBe('0');
  });

  it('supports custom fallback', () => {
    expect(formatCount(null, '—')).toBe('—');
  });
});
