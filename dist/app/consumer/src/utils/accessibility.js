/**
 * Accessibility utilities for keyboard navigation and screen reader support
 */
/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(element) {
    const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const handleKeyDown = (e) => {
        if (e.key !== 'Tab')
            return;
        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        }
        else {
            // Tab
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    };
    element.addEventListener('keydown', handleKeyDown);
    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
}
/**
 * Handle ESC key to close modals/drawers
 */
export function handleEscapeKey(callback) {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            callback();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}
/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}
/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
    const getLuminance = (color) => {
        // Simple RGB extraction (assumes hex format)
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        const [rs, gs, bs] = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
/**
 * Check if contrast meets WCAG AA standards (4.5:1)
 */
export function meetsWCAGAA(foreground, background) {
    return getContrastRatio(foreground, background) >= 4.5;
}
