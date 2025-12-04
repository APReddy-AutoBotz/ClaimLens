/**
 * ClaimLens Go - Settings Page Script
 * Manages domain allowlist and privacy settings
 */
import { PrivacyManager } from './privacy-manager';
class SettingsPage {
    privacyManager;
    domainInput = null;
    addBtn = null;
    constructor() {
        this.privacyManager = new PrivacyManager();
        this.initialize();
    }
    /**
     * Initialize settings page
     */
    async initialize() {
        // Get elements
        this.domainInput = document.getElementById('domainInput');
        this.addBtn = document.getElementById('addBtn');
        if (!this.domainInput || !this.addBtn) {
            console.error('[SettingsPage] Required elements not found');
            return;
        }
        // Set up event listeners
        this.addBtn.addEventListener('click', () => {
            this.handleAddDomain();
        });
        this.domainInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAddDomain();
            }
        });
        // Load initial data
        await this.loadConsentStatus();
        await this.loadDomains();
    }
    /**
     * Load and display consent status
     */
    async loadConsentStatus() {
        const statusEl = document.getElementById('consentStatus');
        if (!statusEl)
            return;
        const hasConsent = await this.privacyManager.hasConsent();
        if (hasConsent) {
            statusEl.className = 'consent-status granted';
            statusEl.innerHTML = `
        <div class="status-icon">✓</div>
        <div class="status-text">Consent granted - ClaimLens Go is active</div>
        <button class="revoke-btn" id="revokeBtn">Revoke Consent</button>
      `;
            const revokeBtn = document.getElementById('revokeBtn');
            if (revokeBtn) {
                revokeBtn.addEventListener('click', () => {
                    this.handleRevokeConsent();
                });
            }
        }
        else {
            statusEl.className = 'consent-status denied';
            statusEl.innerHTML = `
        <div class="status-icon">✗</div>
        <div class="status-text">Consent not granted - ClaimLens Go is inactive</div>
      `;
        }
    }
    /**
     * Load and display allowlisted domains
     */
    async loadDomains() {
        const listEl = document.getElementById('domainList');
        if (!listEl)
            return;
        const domains = await this.privacyManager.getAllowlistedDomains();
        if (domains.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No domains added yet</div>';
            return;
        }
        listEl.innerHTML = '';
        domains.forEach(domain => {
            const item = this.createDomainItem(domain);
            listEl.appendChild(item);
        });
    }
    /**
     * Create domain list item
     */
    createDomainItem(domain) {
        const item = document.createElement('div');
        item.className = 'domain-item';
        const name = document.createElement('div');
        name.className = 'domain-name';
        name.textContent = domain;
        item.appendChild(name);
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.setAttribute('aria-label', `Remove ${domain}`);
        removeBtn.addEventListener('click', () => {
            this.handleRemoveDomain(domain);
        });
        item.appendChild(removeBtn);
        return item;
    }
    /**
     * Handle add domain button click
     */
    async handleAddDomain() {
        if (!this.domainInput)
            return;
        const domain = this.domainInput.value.trim();
        if (!domain) {
            alert('Please enter a domain');
            return;
        }
        // Validate domain format
        if (!this.isValidDomain(domain)) {
            alert('Please enter a valid domain (e.g., example.com)');
            return;
        }
        try {
            await this.privacyManager.addDomain(domain);
            this.domainInput.value = '';
            await this.loadDomains();
        }
        catch (error) {
            console.error('[SettingsPage] Failed to add domain:', error);
            alert('Failed to add domain. Please try again.');
        }
    }
    /**
     * Handle remove domain button click
     */
    async handleRemoveDomain(domain) {
        if (!confirm(`Remove ${domain} from allowlist?`)) {
            return;
        }
        try {
            await this.privacyManager.removeDomain(domain);
            await this.loadDomains();
        }
        catch (error) {
            console.error('[SettingsPage] Failed to remove domain:', error);
            alert('Failed to remove domain. Please try again.');
        }
    }
    /**
     * Handle revoke consent button click
     */
    async handleRevokeConsent() {
        if (!confirm('Are you sure you want to revoke consent? ClaimLens Go will stop working.')) {
            return;
        }
        try {
            await this.privacyManager.setConsent(false);
            await this.loadConsentStatus();
        }
        catch (error) {
            console.error('[SettingsPage] Failed to revoke consent:', error);
            alert('Failed to revoke consent. Please try again.');
        }
    }
    /**
     * Validate domain format
     */
    isValidDomain(domain) {
        // Basic domain validation
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        return domainRegex.test(domain);
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SettingsPage());
}
else {
    new SettingsPage();
}
