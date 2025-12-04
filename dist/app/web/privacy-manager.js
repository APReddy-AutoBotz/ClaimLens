/**
 * ClaimLens Go - Privacy Manager
 * Handles user consent and domain allowlisting
 */
const STORAGE_KEY = 'claimlens_privacy_settings';
export class PrivacyManager {
    settings = null;
    constructor() {
        this.loadSettings();
    }
    /**
     * Load privacy settings from storage
     */
    async loadSettings() {
        if (typeof chrome === 'undefined' || !chrome.storage) {
            this.settings = this.getDefaultSettings();
            return;
        }
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY);
            this.settings = result[STORAGE_KEY] || this.getDefaultSettings();
        }
        catch (error) {
            console.error('[PrivacyManager] Failed to load settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }
    /**
     * Get default privacy settings
     */
    getDefaultSettings() {
        return {
            consentGiven: false,
            allowlistedDomains: [],
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * Check if user has given consent
     */
    async hasConsent() {
        if (!this.settings) {
            await this.loadSettings();
        }
        return this.settings?.consentGiven || false;
    }
    /**
     * Set user consent
     */
    async setConsent(consent) {
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
    async isDomainAllowed(domain) {
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
    async addDomain(domain) {
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
    async removeDomain(domain) {
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
    async getAllowlistedDomains() {
        if (!this.settings) {
            await this.loadSettings();
        }
        return this.settings?.allowlistedDomains || [];
    }
    /**
     * Save settings to storage
     */
    async saveSettings() {
        if (typeof chrome === 'undefined' || !chrome.storage)
            return;
        try {
            await chrome.storage.local.set({ [STORAGE_KEY]: this.settings });
        }
        catch (error) {
            console.error('[PrivacyManager] Failed to save settings:', error);
        }
    }
    /**
     * Clear all privacy settings
     */
    async clearSettings() {
        this.settings = this.getDefaultSettings();
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.remove(STORAGE_KEY);
        }
    }
}
