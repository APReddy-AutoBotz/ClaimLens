/**
 * Safe formatting utilities for dashboard metrics
 * Ensures no null/undefined/NaN values are rendered in the UI
 */

/**
 * Format milliseconds with safe fallback
 * @param value - The millisecond value to format
 * @param fallback - The fallback string (default: "—")
 * @returns Formatted string like "245ms" or fallback
 */
export function formatMs(value: number | null | undefined, fallback: string = '—'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return `${Math.round(value)}ms`;
}

/**
 * Format a score out of 100 with safe fallback
 * @param value - The score value (0-100)
 * @param fallback - The fallback string (default: "—")
 * @returns Formatted string like "75/100" or fallback
 */
export function formatScore(value: number | null | undefined, fallback: string = '—'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return `${Math.round(value)}/100`;
}

/**
 * Format percentage with safe fallback
 * @param value - The decimal value (0-1)
 * @param decimals - Number of decimal places (default: 2)
 * @param fallback - The fallback string (default: "—")
 * @returns Formatted string like "0.25%" or fallback
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 2,
  fallback: string = '—'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format latency comparison (p95 vs budget)
 * @param p95 - The p95 latency value
 * @param budget - The latency budget
 * @returns Formatted string like "245ms / 300ms" or "— / 300ms"
 */
export function formatLatencyComparison(
  p95: number | null | undefined,
  budget: number | null | undefined
): string {
  const p95Str = formatMs(p95);
  const budgetStr = formatMs(budget, '—');
  return `${p95Str} / ${budgetStr}`;
}

/**
 * Determine risk level label with safe fallback
 * @param level - The risk level
 * @param score - The risk score (used to verify data exists)
 * @returns Human-readable risk level
 */
export function formatRiskLevel(
  level: 'low' | 'medium' | 'high' | null | undefined,
  score: number | null | undefined
): string {
  // If score is missing or invalid, treat as unknown
  if (score === null || score === undefined || isNaN(score)) {
    return 'Unknown Risk';
  }
  
  // If score is 0 and level is not explicitly set, might be no data
  if (score === 0 && !level) {
    return 'No Data';
  }
  
  const levelMap = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk'
  };
  
  return level ? levelMap[level] : 'Unknown Risk';
}

/**
 * Format a count value with safe fallback
 * @param value - The count value
 * @param fallback - The fallback string (default: "0")
 * @returns Formatted count string
 */
export function formatCount(value: number | null | undefined, fallback: string = '0'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value.toString();
}
