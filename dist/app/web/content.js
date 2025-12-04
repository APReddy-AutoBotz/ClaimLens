/**
 * ClaimLens Go - Content Script
 * Scans page content and applies badges
 */
import { ContentScanner } from './scanner';
import { BadgeRenderer } from './badge-renderer';
import { PrivacyManager } from './privacy-manager';
let scanner = null;
let renderer = null;
let privacyManager = null;
/**
 * Initialize extension on page load
 */
async function initialize() {
    try {
        // Initialize privacy manager
        privacyManager = new PrivacyManager();
        // Check if domain is allowed
        const isAllowed = await privacyManager.isDomainAllowed(window.location.hostname);
        if (!isAllowed) {
            console.log('[ClaimLens Go] Domain not in allowlist, skipping scan');
            return;
        }
        // Initialize scanner and renderer
        scanner = new ContentScanner();
        renderer = new BadgeRenderer();
        // Start scanning
        await scanner.initialize();
        console.log('[ClaimLens Go] Initialized successfully');
    }
    catch (error) {
        console.error('[ClaimLens Go] Initialization failed:', error);
    }
}
/**
 * Listen for messages from background script
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'APPLY_BADGES') {
            if (renderer) {
                renderer.applyBadges(message.badges);
                sendResponse({ success: true });
            }
            else {
                sendResponse({ success: false, error: 'Renderer not initialized' });
            }
            return false;
        }
        if (message.type === 'CLEAR_BADGES') {
            if (renderer) {
                renderer.clearBadges();
                sendResponse({ success: true });
            }
            else {
                sendResponse({ success: false, error: 'Renderer not initialized' });
            }
            return false;
        }
    });
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
}
else {
    initialize();
}
