/**
 * ClaimLens Go - Side Panel Script
 * Displays flagged items with locale switching
 */
class SidePanel {
    state = {
        locale: 'en-IN',
        flaggedItems: [],
        isOpen: true
    };
    constructor() {
        this.initialize();
    }
    /**
     * Initialize side panel
     */
    initialize() {
        // Set up locale toggle
        this.setupLocaleToggle();
        // Set up ESC key handler
        this.setupKeyboardHandlers();
        // Load flagged items
        this.loadFlaggedItems();
        // Listen for updates from content script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message) => {
                if (message.type === 'UPDATE_FLAGGED_ITEMS') {
                    this.updateFlaggedItems(message.badges);
                }
            });
        }
    }
    /**
     * Set up locale toggle buttons
     */
    setupLocaleToggle() {
        const buttons = document.querySelectorAll('.locale-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const locale = button.dataset.locale;
                if (locale) {
                    this.changeLocale(locale);
                }
            });
            // Keyboard navigation
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });
    }
    /**
     * Change locale and update disclaimers (≤100ms)
     */
    async changeLocale(locale) {
        const start = performance.now();
        // Update state
        this.state.locale = locale;
        // Update UI
        this.updateLocaleButtons(locale);
        // Reload items with new locale
        await this.reloadWithLocale(locale);
        const duration = performance.now() - start;
        console.log(`[SidePanel] Locale changed in ${duration.toFixed(2)}ms`);
    }
    /**
     * Update locale button states
     */
    updateLocaleButtons(activeLocale) {
        const buttons = document.querySelectorAll('.locale-btn');
        buttons.forEach(button => {
            const isActive = button.dataset.locale === activeLocale;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', isActive.toString());
        });
    }
    /**
     * Reload items with new locale
     */
    async reloadWithLocale(locale) {
        if (typeof chrome === 'undefined' || !chrome.tabs)
            return;
        // Send message to content script to reload with new locale
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'RELOAD_WITH_LOCALE',
                locale
            });
        }
    }
    /**
     * Set up keyboard handlers (Tab, Enter, ESC)
     */
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // ESC key closes panel
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closePanel();
            }
        });
        // Ensure Tab navigation works properly
        const focusableElements = document.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            // Focus first element on load
            focusableElements[0].focus();
        }
    }
    /**
     * Close side panel
     */
    closePanel() {
        window.close();
    }
    /**
     * Load flagged items from storage
     */
    async loadFlaggedItems() {
        if (typeof chrome === 'undefined' || !chrome.storage)
            return;
        try {
            const result = await chrome.storage.local.get('flagged_items');
            const badges = result.flagged_items || [];
            this.updateFlaggedItems(badges);
        }
        catch (error) {
            console.error('[SidePanel] Failed to load flagged items:', error);
        }
    }
    /**
     * Update flagged items display
     */
    updateFlaggedItems(badges) {
        this.state.flaggedItems = badges;
        this.renderFlaggedItems();
    }
    /**
     * Render flagged items list
     */
    renderFlaggedItems() {
        const container = document.getElementById('flaggedItems');
        if (!container)
            return;
        // Clear existing content
        container.innerHTML = '';
        // Show empty state if no items
        if (this.state.flaggedItems.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✓</div>
          <div class="empty-state-text">No flagged items on this page</div>
        </div>
      `;
            return;
        }
        // Render each item
        this.state.flaggedItems.forEach(badge => {
            const card = this.createItemCard(badge);
            container.appendChild(card);
        });
    }
    /**
     * Create item card element
     */
    createItemCard(badge) {
        const card = document.createElement('div');
        card.className = `item-card ${badge.kind}`;
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `${badge.kind}: ${badge.label}`);
        // Item name (extracted from item_id or use label)
        const name = document.createElement('div');
        name.className = 'item-name';
        name.textContent = badge.item_id.replace(/^item-/, '').replace(/-/g, ' ');
        card.appendChild(name);
        // Badge
        const badgeEl = document.createElement('div');
        badgeEl.className = `item-badge ${badge.kind}`;
        badgeEl.textContent = badge.label;
        card.appendChild(badgeEl);
        // Explanation
        const explanation = document.createElement('div');
        explanation.className = 'item-explanation';
        explanation.textContent = badge.explanation;
        card.appendChild(explanation);
        // Source link (if available)
        if (badge.source) {
            const source = document.createElement('div');
            source.className = 'item-source';
            const link = document.createElement('a');
            link.href = badge.source;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Learn more';
            link.setAttribute('aria-label', `Learn more about ${badge.label}`);
            source.appendChild(link);
            card.appendChild(source);
        }
        return card;
    }
}
// Initialize side panel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SidePanel());
}
else {
    new SidePanel();
}
export {};
