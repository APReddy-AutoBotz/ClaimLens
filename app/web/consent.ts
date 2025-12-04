/**
 * ClaimLens Go - Consent Page Script
 * Handles user consent for privacy controls
 */

import { PrivacyManager } from './privacy-manager';

class ConsentPage {
  private privacyManager: PrivacyManager;
  private consentCheckbox: HTMLInputElement | null = null;
  private acceptBtn: HTMLButtonElement | null = null;
  private declineBtn: HTMLButtonElement | null = null;
  
  constructor() {
    this.privacyManager = new PrivacyManager();
    this.initialize();
  }
  
  /**
   * Initialize consent page
   */
  private initialize(): void {
    // Get elements
    this.consentCheckbox = document.getElementById('consentCheckbox') as HTMLInputElement;
    this.acceptBtn = document.getElementById('acceptBtn') as HTMLButtonElement;
    this.declineBtn = document.getElementById('declineBtn') as HTMLButtonElement;
    
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
  private updateAcceptButton(): void {
    if (this.acceptBtn && this.consentCheckbox) {
      this.acceptBtn.disabled = !this.consentCheckbox.checked;
    }
  }
  
  /**
   * Handle accept button click
   */
  private async handleAccept(): Promise<void> {
    try {
      // Save consent
      await this.privacyManager.setConsent(true);
      
      // Show success message
      this.showSuccess();
      
      // Close tab after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error) {
      console.error('[ConsentPage] Failed to save consent:', error);
      alert('Failed to save consent. Please try again.');
    }
  }
  
  /**
   * Handle decline button click
   */
  private async handleDecline(): Promise<void> {
    try {
      // Clear consent
      await this.privacyManager.setConsent(false);
      
      // Close tab
      window.close();
    } catch (error) {
      console.error('[ConsentPage] Failed to decline consent:', error);
      window.close();
    }
  }
  
  /**
   * Show success message
   */
  private showSuccess(): void {
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
  private setupKeyboardHandlers(): void {
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
} else {
  new ConsentPage();
}

export {};
