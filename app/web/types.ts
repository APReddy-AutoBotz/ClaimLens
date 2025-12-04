/**
 * ClaimLens Go - Type Definitions
 */

/**
 * Web item extracted from page content
 */
export interface WebItem {
  id: string;
  name: string;
  description?: string;
  ingredients?: string[];
  nutrition?: Record<string, any>;
  dom_selector: string;
  metadata?: Record<string, any>;
}

/**
 * Badge to be displayed on content
 */
export interface Badge {
  item_id: string;
  kind: 'allergen' | 'warning' | 'info' | 'ok';
  label: string;
  explanation: string;
  source?: string;
  dom_selector: string;
}

/**
 * API response for web/ingest endpoint
 */
export interface IngestResponse {
  badges: Badge[];
  correlation_id: string;
}

/**
 * Privacy settings stored in local storage
 */
export interface PrivacySettings {
  consentGiven: boolean;
  allowlistedDomains: string[];
  lastUpdated: string;
}

/**
 * Side panel state
 */
export interface SidePanelState {
  locale: 'en-IN' | 'en-US' | 'en-GB';
  flaggedItems: Badge[];
  isOpen: boolean;
}

/**
 * Scan result from content scanner
 */
export interface ScanResult {
  items: WebItem[];
  scannedCount: number;
  duration: number;
}
