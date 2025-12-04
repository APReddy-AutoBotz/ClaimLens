/**
 * Tests for Policy Loader
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PolicyLoader, PolicyCache } from '../policy-loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
const TEST_DIR = join(process.cwd(), 'test-temp');
const TEST_POLICY_PATH = join(TEST_DIR, 'test-policy.yaml');
const TEST_PACKS_DIR = join(TEST_DIR, 'packs');
describe('PolicyCache', () => {
    let cache;
    beforeEach(() => {
        cache = new PolicyCache();
    });
    it('should store and retrieve policy', () => {
        const policy = {
            version: '1.0.0',
            profiles: {}
        };
        cache.set('test', policy, 60000);
        const retrieved = cache.get('test');
        expect(retrieved).toEqual(policy);
    });
    it('should return null for expired policy', async () => {
        const policy = {
            version: '1.0.0',
            profiles: {}
        };
        cache.set('test', policy, 10); // 10ms TTL
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 20));
        const retrieved = cache.get('test');
        expect(retrieved).toBeNull();
    });
    it('should invalidate specific key', () => {
        const policy = {
            version: '1.0.0',
            profiles: {}
        };
        cache.set('test', policy, 60000);
        cache.invalidate('test');
        const retrieved = cache.get('test');
        expect(retrieved).toBeNull();
    });
    it('should clear all cached policies', () => {
        const policy1 = { version: '1.0.0', profiles: {} };
        const policy2 = { version: '2.0.0', profiles: {} };
        cache.set('test1', policy1, 60000);
        cache.set('test2', policy2, 60000);
        cache.clear();
        expect(cache.get('test1')).toBeNull();
        expect(cache.get('test2')).toBeNull();
    });
});
describe('PolicyLoader', () => {
    beforeEach(() => {
        // Create test directory
        try {
            mkdirSync(TEST_DIR, { recursive: true });
            mkdirSync(TEST_PACKS_DIR, { recursive: true });
        }
        catch (e) {
            // Directory might already exist
        }
    });
    afterEach(() => {
        // Clean up test directory
        try {
            rmSync(TEST_DIR, { recursive: true, force: true });
        }
        catch (e) {
            // Ignore cleanup errors
        }
    });
    it('should load valid policy', () => {
        const policyContent = `
version: 1.0.0
profiles:
  test:
    name: Test Profile
    routes:
      - path: /test
        transforms:
          - transform1
        latency_budget_ms: 100
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        const policy = loader.loadPolicy();
        expect(policy.version).toBe('1.0.0');
        expect(policy.profiles.test).toBeDefined();
        expect(policy.profiles.test.routes).toHaveLength(1);
        expect(policy.profiles.test.routes[0].path).toBe('/test');
    });
    it('should validate semantic version format', () => {
        const policyContent = `
version: invalid-version
profiles:
  test:
    routes: []
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        expect(() => loader.loadPolicy()).toThrow('Invalid semantic version');
    });
    it('should require version field', () => {
        const policyContent = `
profiles:
  test:
    routes: []
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        expect(() => loader.loadPolicy()).toThrow('Policy must have a version string');
    });
    it('should require profiles field', () => {
        const policyContent = `
version: 1.0.0
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        expect(() => loader.loadPolicy()).toThrow('Policy must have profiles object');
    });
    it('should cache policy', () => {
        const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms: []
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR,
            cacheTTL: 60000
        });
        const policy1 = loader.loadPolicy();
        const policy2 = loader.loadPolicy(); // Should use cache
        expect(policy1).toBe(policy2); // Same object reference
    });
    it('should reload policy when cache disabled', () => {
        const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms: []
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        const policy1 = loader.loadPolicy();
        const policy2 = loader.loadPolicy(false); // Bypass cache
        expect(policy1).not.toBe(policy2); // Different object references
    });
    it('should load YAML rule pack', () => {
        const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms: []
`;
        const rulePackContent = `
version: 1.0.0
rules:
  - name: rule1
    pattern: test
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        writeFileSync(join(TEST_PACKS_DIR, 'test.yaml'), rulePackContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        const rulePack = loader.loadRulePack('test.yaml');
        expect(rulePack.name).toBe('test.yaml');
        expect(rulePack.version).toBe('1.0.0');
        expect(rulePack.content.rules).toHaveLength(1);
        expect(rulePack.signature).toBeDefined();
    });
    it('should calculate SHA-256 signature for rule packs', () => {
        const policyContent = `
version: 1.0.0
profiles:
  test:
    routes: []
`;
        const rulePackContent = 'test content';
        writeFileSync(TEST_POLICY_PATH, policyContent);
        writeFileSync(join(TEST_PACKS_DIR, 'test.txt'), rulePackContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        const rulePack = loader.loadRulePack('test.txt');
        expect(rulePack.signature).toBe('6ae8a75555209fd6c44157c0aed8016e763ff435a19cf186f76863140143ff72');
    });
    it('should reload policy', () => {
        const policyContent = `
version: 1.0.0
profiles:
  test:
    routes: []
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        loader.loadPolicy(); // Load and cache
        const reloaded = loader.reloadPolicy(); // Force reload
        expect(reloaded.version).toBe('1.0.0');
    });
    it('should get all loaded rule packs', () => {
        const policyContent = `
version: 1.0.0
profiles:
  test:
    routes: []
`;
        writeFileSync(TEST_POLICY_PATH, policyContent);
        writeFileSync(join(TEST_PACKS_DIR, 'pack1.yaml'), 'version: 1.0.0');
        writeFileSync(join(TEST_PACKS_DIR, 'pack2.yaml'), 'version: 2.0.0');
        const loader = new PolicyLoader({
            policyPath: TEST_POLICY_PATH,
            rulePacksDir: TEST_PACKS_DIR
        });
        loader.loadRulePack('pack1.yaml');
        loader.loadRulePack('pack2.yaml');
        const allPacks = loader.getAllRulePacks();
        expect(allPacks).toHaveLength(2);
        expect(allPacks.map(p => p.name)).toContain('pack1.yaml');
        expect(allPacks.map(p => p.name)).toContain('pack2.yaml');
    });
});
