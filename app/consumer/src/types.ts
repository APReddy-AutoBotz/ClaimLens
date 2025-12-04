/**
 * Shared type definitions for ClaimLens Consumer App
 */

import type { TrustScoreBreakdown } from '../../../packages/core/trust-score';

/**
 * Product identity information captured during scanning
 */
export interface ProductIdentity {
  /** Product name (e.g., "Organic Almond Milk") */
  name: string;
  /** Optional brand name (e.g., "Silk") */
  brand?: string;
  /** Optional product category (e.g., "Dairy Alternative") */
  category?: string;
  /** Method used to scan the product */
  sourceType: 'url' | 'screenshot' | 'barcode' | 'text';
  /** Optional source label (e.g., "amazon.com" or "UPC 123456") */
  sourceLabel?: string;
}

/**
 * Scan result structure returned from the API
 */
export interface ScanResult {
  /** Product identity information */
  productIdentity: ProductIdentity;
  /** Optional detailed product information from API */
  product_info?: {
    product_name: string;
    brand?: string;
    category?: string;
    claims?: string[];
    scanned_text_preview?: string;
  };
  /** Trust score (0-100) */
  trust_score: number;
  /** Verdict information */
  verdict: {
    label: 'allow' | 'caution' | 'avoid';
    color: string;
    icon: string;
    explanation: string;
  };
  /** Issue badges detected */
  badges: Array<{
    kind: 'ok' | 'warn' | 'danger';
    label: string;
    explanation: string;
    source?: string;
  }>;
  /** Reasons for the verdict */
  reasons: Array<{
    transform: string;
    why: string;
    source?: string;
  }>;
  /** Optional trust score breakdown */
  breakdown?: TrustScoreBreakdown;
  /** Optional user allergens detected */
  user_allergens_detected?: string[];
  /** Optional correlation ID for tracking */
  correlation_id?: string;
  /** Optional suggestions */
  suggestions?: unknown;
}
