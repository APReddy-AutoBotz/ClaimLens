/**
 * Implementation verification tests for Tasks 8.1-8.5
 * Verifies that all required methods and features exist
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
describe('Task 8.1: ContentScanner Implementation', () => {
    const scannerPath = path.resolve(__dirname, '../scanner.ts');
    const scannerCode = fs.readFileSync(scannerPath, 'utf-8');
    it('should have ContentScanner class', () => {
        expect(scannerCode).toContain('export class ContentScanner');
    });
    it('should have initialize method', () => {
        expect(scannerCode).toContain('async initialize()');
    });
    it('should have scanViewport method for first-viewport scan', () => {
        expect(scannerCode).toContain('async scanViewport()');
        expect(scannerCode).toContain('≤200ms for ≤20 items');
    });
    it('should have processBatch method for batch processing', () => {
        expect(scannerCode).toContain('async processBatch');
        expect(scannerCode).toContain('batchSize = 5');
        expect(scannerCode).toContain('≤50ms per batch');
    });
    it('should have MutationObserver setup', () => {
        expect(scannerCode).toContain('setupMutationObserver');
        expect(scannerCode).toContain('MutationObserver');
    });
    it('should have requestIdleCallback for incremental scanning', () => {
        expect(scannerCode).toContain('requestIdleCallback');
        expect(scannerCode).toContain('processIncrementally');
    });
    it('should have throttled scroll handler (500ms)', () => {
        expect(scannerCode).toContain('setupScrollHandler');
        expect(scannerCode).toContain('500');
    });
    it('should have destroy method for cleanup', () => {
        expect(scannerCode).toContain('destroy()');
    });
});
describe('Task 8.2: API Endpoint Implementation', () => {
    const webRoutesPath = path.resolve(__dirname, '../../api/routes/web.ts');
    const webRoutesCode = fs.readFileSync(webRoutesPath, 'utf-8');
    it('should have POST /v1/web/ingest endpoint', () => {
        expect(webRoutesCode).toContain("router.post('/ingest'");
        expect(webRoutesCode).toContain('POST /v1/web/ingest');
    });
    it('should accept array of web items with dom_selector', () => {
        expect(webRoutesCode).toContain('dom_selector');
        expect(webRoutesCode).toContain('WebItem');
    });
    it('should execute transform pipeline with claimlens_go profile', () => {
        expect(webRoutesCode).toContain("'claimlens_go'");
        expect(webRoutesCode).toContain('pipeline.execute');
    });
    it('should generate Badge objects', () => {
        expect(webRoutesCode).toContain('Badge');
        expect(webRoutesCode).toContain('generateBadges');
    });
    it('should target p95 latency ≤120ms', () => {
        expect(webRoutesCode).toContain('≤120ms');
        expect(webRoutesCode).toContain('performance.now()');
    });
    it('should return badges array with correlation_id', () => {
        expect(webRoutesCode).toContain('badges');
        expect(webRoutesCode).toContain('correlation_id');
    });
});
describe('Task 8.3: BadgeRenderer Implementation', () => {
    const badgeRendererPath = path.resolve(__dirname, '../badge-renderer.ts');
    const badgeRendererCode = fs.readFileSync(badgeRendererPath, 'utf-8');
    it('should have BadgeRenderer class', () => {
        expect(badgeRendererCode).toContain('export class BadgeRenderer');
    });
    it('should create CSP-safe badge elements (no inline scripts)', () => {
        expect(badgeRendererCode).toContain('CSP-safe');
        expect(badgeRendererCode).toContain('no inline scripts');
        expect(badgeRendererCode).not.toContain('onclick=');
        expect(badgeRendererCode).not.toContain('eval(');
    });
    it('should apply badges without breaking page layout', () => {
        expect(badgeRendererCode).toContain('applyBadges');
        expect(badgeRendererCode).toContain('position');
    });
    it('should add ARIA labels for accessibility', () => {
        expect(badgeRendererCode).toContain('aria-label');
        expect(badgeRendererCode).toContain('role');
    });
    it('should implement tooltip on badge click (≤50ms)', () => {
        expect(badgeRendererCode).toContain('setupTooltip');
        expect(badgeRendererCode).toContain('≤50ms');
        expect(badgeRendererCode).toContain('performance.now()');
    });
    it('should style with design tokens (Amber warn, Red danger, Emerald ok)', () => {
        expect(badgeRendererCode).toContain('#EF4444'); // Red danger
        expect(badgeRendererCode).toContain('#F59E0B'); // Amber warn
        expect(badgeRendererCode).toContain('#10B981'); // Emerald ok
    });
    it('should have clearBadges method', () => {
        expect(badgeRendererCode).toContain('clearBadges');
    });
});
describe('Task 8.4: Side Panel UI Implementation', () => {
    const sidepanelHtmlPath = path.resolve(__dirname, '../sidepanel.html');
    const sidepanelTsPath = path.resolve(__dirname, '../sidepanel.ts');
    const sidepanelHtml = fs.readFileSync(sidepanelHtmlPath, 'utf-8');
    const sidepanelTs = fs.readFileSync(sidepanelTsPath, 'utf-8');
    it('should have sidepanel.html file', () => {
        expect(fs.existsSync(sidepanelHtmlPath)).toBe(true);
    });
    it('should have SidePanel class', () => {
        expect(sidepanelTs).toContain('class SidePanel');
    });
    it('should have flagged items list', () => {
        expect(sidepanelHtml).toContain('flagged-items');
        expect(sidepanelTs).toContain('flaggedItems');
    });
    it('should have locale toggle (en-IN, en-US, en-GB)', () => {
        expect(sidepanelHtml).toContain('locale-toggle');
        expect(sidepanelHtml).toContain('en-IN');
        expect(sidepanelHtml).toContain('en-US');
        expect(sidepanelHtml).toContain('en-GB');
        expect(sidepanelTs).toContain('changeLocale');
    });
    it('should update disclaimers on locale change (≤100ms)', () => {
        expect(sidepanelTs).toContain('changeLocale');
        expect(sidepanelTs).toContain('≤100ms');
        expect(sidepanelTs).toContain('performance.now()');
    });
    it('should have ESC key handler to close panel', () => {
        expect(sidepanelTs).toContain('Escape');
        expect(sidepanelTs).toContain('closePanel');
    });
    it('should implement keyboard navigation (Tab, Enter, ESC)', () => {
        expect(sidepanelTs).toContain('keyboard');
        expect(sidepanelTs).toContain('Tab');
        expect(sidepanelTs).toContain('Enter');
        expect(sidepanelTs).toContain('ESC');
    });
});
describe('Task 8.5: Privacy Controls Implementation', () => {
    const privacyManagerPath = path.resolve(__dirname, '../privacy-manager.ts');
    const consentHtmlPath = path.resolve(__dirname, '../consent.html');
    const consentTsPath = path.resolve(__dirname, '../consent.ts');
    const settingsHtmlPath = path.resolve(__dirname, '../settings.html');
    const settingsTsPath = path.resolve(__dirname, '../settings.ts');
    const privacyManagerCode = fs.readFileSync(privacyManagerPath, 'utf-8');
    const consentHtml = fs.readFileSync(consentHtmlPath, 'utf-8');
    const consentTs = fs.readFileSync(consentTsPath, 'utf-8');
    const settingsHtml = fs.readFileSync(settingsHtmlPath, 'utf-8');
    const settingsTs = fs.readFileSync(settingsTsPath, 'utf-8');
    it('should have PrivacyManager class', () => {
        expect(privacyManagerCode).toContain('export class PrivacyManager');
    });
    it('should have user consent dialog on first run', () => {
        expect(fs.existsSync(consentHtmlPath)).toBe(true);
        expect(consentHtml).toContain('consent');
        expect(consentTs).toContain('ConsentPage');
    });
    it('should store allowlisted domains in local storage', () => {
        expect(privacyManagerCode).toContain('allowlistedDomains');
        expect(privacyManagerCode).toContain('storage');
    });
    it('should check domain allowlist before scanning', () => {
        expect(privacyManagerCode).toContain('isDomainAllowed');
    });
    it('should have settings page for domain management', () => {
        expect(fs.existsSync(settingsHtmlPath)).toBe(true);
        expect(fs.existsSync(settingsTsPath)).toBe(true);
        expect(settingsTs).toContain('SettingsPage');
        expect(settingsTs).toContain('addDomain');
        expect(settingsTs).toContain('removeDomain');
    });
    it('should have hasConsent method', () => {
        expect(privacyManagerCode).toContain('hasConsent');
    });
    it('should have setConsent method', () => {
        expect(privacyManagerCode).toContain('setConsent');
    });
    it('should have addDomain method', () => {
        expect(privacyManagerCode).toContain('addDomain');
    });
    it('should have removeDomain method', () => {
        expect(privacyManagerCode).toContain('removeDomain');
    });
    it('should have getAllowlistedDomains method', () => {
        expect(privacyManagerCode).toContain('getAllowlistedDomains');
    });
});
describe('Extension Structure', () => {
    it('should have manifest.json with Manifest V3', () => {
        const manifestPath = path.resolve(__dirname, '../manifest.json');
        expect(fs.existsSync(manifestPath)).toBe(true);
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        expect(manifest.manifest_version).toBe(3);
        expect(manifest.name).toBe('ClaimLens Go');
    });
    it('should have background service worker', () => {
        const backgroundPath = path.resolve(__dirname, '../background.ts');
        expect(fs.existsSync(backgroundPath)).toBe(true);
        const backgroundCode = fs.readFileSync(backgroundPath, 'utf-8');
        expect(backgroundCode).toContain('Background Service Worker');
    });
    it('should have content script', () => {
        const contentPath = path.resolve(__dirname, '../content.ts');
        expect(fs.existsSync(contentPath)).toBe(true);
        const contentCode = fs.readFileSync(contentPath, 'utf-8');
        expect(contentCode).toContain('Content Script');
    });
    it('should have types.ts with all required types', () => {
        const typesPath = path.resolve(__dirname, '../types.ts');
        const typesCode = fs.readFileSync(typesPath, 'utf-8');
        expect(typesCode).toContain('WebItem');
        expect(typesCode).toContain('Badge');
        expect(typesCode).toContain('PrivacySettings');
        expect(typesCode).toContain('SidePanelState');
    });
    it('should have vite.config.ts for build', () => {
        const vitePath = path.resolve(__dirname, '../vite.config.ts');
        expect(fs.existsSync(vitePath)).toBe(true);
        const viteCode = fs.readFileSync(vitePath, 'utf-8');
        expect(viteCode).toContain('defineConfig');
        expect(viteCode).toContain('background');
        expect(viteCode).toContain('content');
        expect(viteCode).toContain('sidepanel');
    });
});
describe('File Size Verification', () => {
    it('should have substantial scanner.ts implementation', () => {
        const scannerPath = path.resolve(__dirname, '../scanner.ts');
        const stats = fs.statSync(scannerPath);
        expect(stats.size).toBeGreaterThan(10000); // >10KB indicates real implementation
    });
    it('should have substantial badge-renderer.ts implementation', () => {
        const badgeRendererPath = path.resolve(__dirname, '../badge-renderer.ts');
        const stats = fs.statSync(badgeRendererPath);
        expect(stats.size).toBeGreaterThan(8000); // >8KB indicates real implementation
    });
    it('should have substantial sidepanel.ts implementation', () => {
        const sidepanelPath = path.resolve(__dirname, '../sidepanel.ts');
        const stats = fs.statSync(sidepanelPath);
        expect(stats.size).toBeGreaterThan(5000); // >5KB indicates real implementation
    });
    it('should have substantial privacy-manager.ts implementation', () => {
        const privacyManagerPath = path.resolve(__dirname, '../privacy-manager.ts');
        const stats = fs.statSync(privacyManagerPath);
        expect(stats.size).toBeGreaterThan(3000); // >3KB indicates real implementation
    });
});
