/**
 * ClaimLens Go Web Extension
 * Entry point for browser extension
 */

export { ContentScanner } from './scanner';
export { BadgeRenderer } from './badge-renderer';
export { PrivacyManager } from './privacy-manager';
export type { WebItem, Badge, IngestResponse, PrivacySettings, SidePanelState, ScanResult } from './types';
