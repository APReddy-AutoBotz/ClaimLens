/**
 * ClaimLens Go - Privacy Manager
 * Handles user consent and domain allowlisting
 */

import type { PrivacySettings } from './types';

const STORAGE_KEY = 'claimlens_privacy_settings';

export class PrivacyManager {
  private settings: PrivacySettings | null = null;
  
  constructor() {
    this.loadSettings();
  }
  
  /**
   * Load privacy settings from storage
   */
  private async loadSettings(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      this.settings = this.getDefaultSettings();
      return;
    }
    
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      this.settings = result[STORAGE_KEY] || this.getDefaultSettings();
    } catch (error) {
      console.error('[PrivacyManager] Failed to load settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }
  
  /**
   * Get default privacy settings
   */
  private getDefaultSettings(): PrivacySettings {
    return {
      consentGiven: false,
      allowlistedDomains: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Check if user has given consent
   */
  async hasConsent(): Promise<boolean> {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings?.consentGiven || false;
  }
  
  /**
   * Set user consent
   */
  async setConsent(consent: boolean): Promise<void> {
    if (!this.settings) {
      await this.loadSettings();
    }
    
    if (this.settings) {
      this.settings.consentGiven = consent;
      this.settings.lastUpdated = new Date().toISOString();
      await this.saveSettings();
    }
  }
  
  /**
   * Check if domain is in allowlist
   */
  async isDomainAllowed(domain: string): Promise<boolean> {
    // First check consent
    const hasConsent = await this.hasConsent();
    if (!hasConsent) {
      return false;
    }
    
    if (!this.settings) {
      await this.loadSettings();
    }
    
    // Check if domain is in allowlist
    return this.settings?.allowlistedDomains.includes(domain) || false;
  }
  
  /**
   * Add domain to allowlist
   */
  async addDomain(domain: string): Promise<void> {
    if (!this.settings) {
      await this.loadSettings();
    }
    
    if (this.settings && !this.settings.allowlistedDomains.includes(domain)) {
      this.settings.allowlistedDomains.push(domain);
      this.settings.lastUpdated = new Date().toISOString();
      await this.saveSettings();
    }
  }
  
  /**
   * Remove domain from allowlist
   */
  async removeDomain(domain: string): Promise<void> {
    if (!this.settings) {
      await this.loadSettings();
    }
    
    if (this.settings) {
      this.settings.allowlistedDomains = this.settings.allowlistedDomains.filter(d => d !== domain);
      this.settings.lastUpdated = new Date().toISOString();
      await this.saveSettings();
    }
  }
  
  /**
   * Get all allowlisted domains
   */
  async getAllowlistedDomains(): Promise<string[]> {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings?.allowlistedDomains || [];
  }
  
  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: this.settings });
    } catch (error) {
      console.error('[PrivacyManager] Failed to save settings:', error);
    }
  }
  
  /**
   * Clear all privacy settings
   */
  async clearSettings(): Promise<void> {
    this.settings = this.getDefaultSettings();
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(STORAGE_KEY);
    }
  }
}
