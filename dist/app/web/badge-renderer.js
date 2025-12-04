/**
 * ClaimLens Go - Badge Renderer
 * CSP-safe badge rendering with accessibility
 */
export class BadgeRenderer {
    badges = new Map();
    tooltips = new Map();
    /**
     * Apply badges to page elements
     */
    applyBadges(badges) {
        badges.forEach(badge => {
            try {
                const element = document.querySelector(badge.dom_selector);
                if (element) {
                    this.renderBadge(element, badge);
                }
            }
            catch (error) {
                console.error('[BadgeRenderer] Failed to apply badge:', error);
            }
        });
    }
    /**
     * Render a single badge on an element
     */
    renderBadge(element, badge) {
        // Create badge element
        const badgeEl = this.createBadgeElement(badge);
        // Position badge relative to element
        this.positionBadge(element, badgeEl);
        // Add to DOM
        element.style.position = element.style.position || 'relative';
        element.appendChild(badgeEl);
        // Store reference
        this.badges.set(badge.item_id, badgeEl);
        // Set up tooltip
        this.setupTooltip(badgeEl, badge);
    }
    /**
     * Create CSP-safe badge element (no inline scripts)
     */
    createBadgeElement(badge) {
        const badgeEl = document.createElement('div');
        badgeEl.className = `claimlens-badge claimlens-badge-${badge.kind}`;
        badgeEl.setAttribute('data-badge-id', badge.item_id);
        badgeEl.setAttribute('role', 'status');
        badgeEl.setAttribute('aria-label', `${badge.kind}: ${badge.label}`);
        badgeEl.setAttribute('tabindex', '0');
        // Add label text
        const labelEl = document.createElement('span');
        labelEl.className = 'claimlens-badge-label';
        labelEl.textContent = badge.label;
        badgeEl.appendChild(labelEl);
        // Apply styles based on kind (using design tokens)
        this.applyBadgeStyles(badgeEl, badge.kind);
        return badgeEl;
    }
    /**
     * Apply styles with design tokens (Amber warn, Red danger, Emerald ok)
     */
    applyBadgeStyles(element, kind) {
        const baseStyles = `
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.2;
      cursor: pointer;
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;
        const kindStyles = {
            allergen: 'background-color: #EF4444; color: #FFFFFF;', // Red danger
            warning: 'background-color: #F59E0B; color: #0B1220;', // Amber warn
            info: 'background-color: #14B8A6; color: #FFFFFF;', // Teal
            ok: 'background-color: #10B981; color: #FFFFFF;' // Emerald ok
        };
        element.style.cssText = baseStyles + kindStyles[kind];
        // Add focus ring (≥2px for accessibility)
        element.addEventListener('focus', () => {
            element.style.outline = '2px solid #4F46E5';
            element.style.outlineOffset = '2px';
        });
        element.addEventListener('blur', () => {
            element.style.outline = 'none';
        });
    }
    /**
     * Position badge without breaking page layout
     */
    positionBadge(parent, badge) {
        // Ensure parent has position context
        const parentPosition = window.getComputedStyle(parent).position;
        if (parentPosition === 'static') {
            parent.style.position = 'relative';
        }
        // Badge is positioned absolutely within parent
        badge.style.position = 'absolute';
        badge.style.top = '8px';
        badge.style.right = '8px';
    }
    /**
     * Set up tooltip on badge click (≤50ms)
     */
    setupTooltip(badgeEl, badge) {
        const showTooltip = () => {
            const start = performance.now();
            // Remove existing tooltip if any
            this.hideTooltip(badge.item_id);
            // Create tooltip
            const tooltip = this.createTooltip(badge);
            // Position tooltip
            this.positionTooltip(badgeEl, tooltip);
            // Add to DOM
            document.body.appendChild(tooltip);
            // Store reference
            this.tooltips.set(badge.item_id, tooltip);
            const duration = performance.now() - start;
            console.log(`[BadgeRenderer] Tooltip shown in ${duration.toFixed(2)}ms`);
        };
        const hideTooltip = () => {
            this.hideTooltip(badge.item_id);
        };
        // Click handler
        badgeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            showTooltip();
        });
        // Keyboard handler (Enter key)
        badgeEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                showTooltip();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                hideTooltip();
            }
        });
        // Close tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.tooltips.has(badge.item_id))
                return;
            const currentTooltip = this.tooltips.get(badge.item_id);
            if (currentTooltip && !currentTooltip.contains(e.target) && !badgeEl.contains(e.target)) {
                hideTooltip();
            }
        });
    }
    /**
     * Create tooltip element
     */
    createTooltip(badge) {
        const tooltip = document.createElement('div');
        tooltip.className = 'claimlens-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.setAttribute('aria-live', 'polite');
        // Explanation text
        const explanation = document.createElement('p');
        explanation.className = 'claimlens-tooltip-explanation';
        explanation.textContent = badge.explanation;
        tooltip.appendChild(explanation);
        // Source link (if available)
        if (badge.source) {
            const source = document.createElement('a');
            source.className = 'claimlens-tooltip-source';
            source.href = badge.source;
            source.target = '_blank';
            source.rel = 'noopener noreferrer';
            source.textContent = 'Learn more';
            source.setAttribute('aria-label', `Learn more about ${badge.label}`);
            tooltip.appendChild(source);
        }
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'claimlens-tooltip-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close tooltip');
        closeBtn.addEventListener('click', () => {
            this.hideTooltip(badge.item_id);
        });
        tooltip.appendChild(closeBtn);
        // Apply styles
        this.applyTooltipStyles(tooltip);
        return tooltip;
    }
    /**
     * Apply tooltip styles
     */
    applyTooltipStyles(tooltip) {
        tooltip.style.cssText = `
      position: fixed;
      background-color: #0B1220;
      color: #F8FAFC;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
      z-index: 10000;
      font-size: 14px;
      line-height: 1.5;
    `;
        // Style explanation
        const explanation = tooltip.querySelector('.claimlens-tooltip-explanation');
        if (explanation) {
            explanation.style.cssText = `
        margin: 0 0 8px 0;
        color: #F8FAFC;
      `;
        }
        // Style source link
        const source = tooltip.querySelector('.claimlens-tooltip-source');
        if (source) {
            source.style.cssText = `
        display: inline-block;
        color: #14B8A6;
        text-decoration: underline;
        font-size: 12px;
        margin-top: 4px;
      `;
        }
        // Style close button
        const closeBtn = tooltip.querySelector('.claimlens-tooltip-close');
        if (closeBtn) {
            closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: #F8FAFC;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        line-height: 1;
      `;
            // Focus ring
            closeBtn.addEventListener('focus', () => {
                closeBtn.style.outline = '2px solid #4F46E5';
                closeBtn.style.outlineOffset = '2px';
            });
            closeBtn.addEventListener('blur', () => {
                closeBtn.style.outline = 'none';
            });
        }
    }
    /**
     * Position tooltip near badge
     */
    positionTooltip(badgeEl, tooltip) {
        const badgeRect = badgeEl.getBoundingClientRect();
        // Position below badge by default
        let top = badgeRect.bottom + 8;
        let left = badgeRect.left;
        // Adjust if tooltip would go off screen
        const tooltipRect = tooltip.getBoundingClientRect();
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 16;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = badgeRect.top - tooltipRect.height - 8;
        }
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }
    /**
     * Hide tooltip
     */
    hideTooltip(itemId) {
        const tooltip = this.tooltips.get(itemId);
        if (tooltip) {
            tooltip.remove();
            this.tooltips.delete(itemId);
        }
    }
    /**
     * Clear all badges
     */
    clearBadges() {
        this.badges.forEach(badge => badge.remove());
        this.badges.clear();
        this.tooltips.forEach(tooltip => tooltip.remove());
        this.tooltips.clear();
    }
}
