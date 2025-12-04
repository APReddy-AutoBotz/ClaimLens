/**
 * ClaimLens Go - Consent Page Script
 * Handles user consent for privacy controls
 */
import { PrivacyManager } from './privacy-manager';
class ConsentPage {
    privacyManager;
    consentCheckbox = null;
    acceptBtn = null;
    declineBtn = null;
    constructor() {
        this.privacyManager = new PrivacyManager();
        this.initialize();
    }
    /**
     * Initialize consent page
     */
    initialize() {
        // Get elements
        this.consentCheckbox = document.getElementById('consentCheckbox');
        this.acceptBtn = document.getElementById('acceptBtn');
        this.declineBtn = document.getElementById('declineBtn');
        if (!this.consentCheckbox || !this.acceptBtn || !this.declineBtn) {
            console.error('[ConsentPage] Required elements not found');
            return;
        }
        // Set up event listeners
        this.consentCheckbox.addEventListener('change', () => {
            this.updateAcceptButton();
        });
        this.acceptBtn.addEventListener('click', () => {
            this.handleAccept();
        });
        this.declineBtn.addEventListener('click', () => {
            this.handleDecline();
        });
        // Keyboard navigation
        this.setupKeyboardHandlers();
    }
    /**
     * Update accept button state based on checkbox
     */
    updateAcceptButton() {
        if (this.acceptBtn && this.consentCheckbox) {
            this.acceptBtn.disabled = !this.consentCheckbox.checked;
        }
    }
    /**
     * Handle accept button click
     */
    async handleAccept() {
        try {
            // Save consent
            await this.privacyManager.setConsent(true);
            // Show success message
            this.showSuccess();
            // Close tab after 2 seconds
            setTimeout(() => {
                window.close();
            }, 2000);
        }
        catch (error) {
            console.error('[ConsentPage] Failed to save consent:', error);
            alert('Failed to save consent. Please try again.');
        }
    }
    /**
     * Handle decline button click
     */
    async handleDecline() {
        try {
            // Clear consent
            await this.privacyManager.setConsent(false);
            // Close tab
            window.close();
        }
        catch (error) {
            console.error('[ConsentPage] Failed to decline consent:', error);
            window.close();
        }
    }
    /**
     * Show success message
     */
    showSuccess() {
        const form = document.getElementById('consentForm');
        const success = document.getElementById('successMessage');
        if (form && success) {
            form.style.display = 'none';
            success.classList.add('show');
        }
    }
    /**
     * Set up keyboard handlers
     */
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // Enter on checkbox toggles it
            if (e.key === 'Enter' && document.activeElement === this.consentCheckbox) {
                e.preventDefault();
                if (this.consentCheckbox) {
                    this.consentCheckbox.checked = !this.consentCheckbox.checked;
                    this.updateAcceptButton();
                }
            }
        });
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ConsentPage());
}
else {
    new ConsentPage();
}
