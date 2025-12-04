/**
 * Integration Tests for Transform Pipeline
 * Tests policy loading, caching, transform registration, pipeline execution,
 * error handling, and degraded mode scenarios
 *
 * Requirements: 1.1, 1.5
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TransformPipeline } from '../pipeline.js';
import { PolicyLoader } from '../policy-loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
const TEST_DIR = join(process.cwd(), 'test-integration-temp');
const TEST_POLICY_PATH = join(TEST_DIR, 'policies.yaml');
const TEST_PACKS_DIR = join(TEST_DIR, 'packs');
describe('Transform Pipeline Integration Tests', () => {
    beforeEach(() => {
        // Create test directories
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
    describe('Policy Loading and Caching', () => {
        it('should load policy from file and cache it', () => {
            const policyContent = `
version: 1.2.0
profiles:
  test_profile:
    name: Test Profile
    routes:
      - path: /test
        transforms:
          - transform1
          - transform2
        latency_budget_ms: 150
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR,
                cacheTTL: 60000
            });
            // First load
            const policy1 = loader.loadPolicy();
            expect(policy1.version).toBe('1.2.0');
            expect(policy1.profiles.test_profile).toBeDefined();
            expect(policy1.profiles.test_profile.routes[0].transforms).toHaveLength(2);
            // Second load should use cache (same object reference)
            const policy2 = loader.loadPolicy();
            expect(policy1).toBe(policy2);
        });
        it('should reload policy when cache is invalidated', () => {
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
            const policy2 = loader.reloadPolicy(); // Force reload
            expect(policy1).not.toBe(policy2); // Different object references
            expect(policy1.version).toBe(policy2.version);
        });
        it('should expire cached policy after TTL', async () => {
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
                cacheTTL: 50 // 50ms TTL
            });
            loader.loadPolicy(); // Load and cache
            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 60));
            // Should reload from file
            const policy = loader.loadPolicy();
            expect(policy.version).toBe('1.0.0');
        });
        it('should load and cache rule packs', () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes: []
`;
            const rulePackContent = `
version: 1.0.0
rules:
  - name: test_rule
    pattern: "banned phrase"
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            writeFileSync(join(TEST_PACKS_DIR, 'test-rules.yaml'), rulePackContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const rulePack = loader.loadRulePack('test-rules.yaml');
            expect(rulePack.name).toBe('test-rules.yaml');
            expect(rulePack.version).toBe('1.0.0');
            expect(rulePack.content.rules).toHaveLength(1);
            expect(rulePack.signature).toBeDefined();
            // Second load should return cached pack
            const rulePack2 = loader.loadRulePack('test-rules.yaml');
            expect(rulePack).toBe(rulePack2);
        });
    });
    describe('Transform Registration and Discovery', () => {
        it('should register multiple transforms and discover them', () => {
            const pipeline = new TransformPipeline();
            const transform1 = (input) => ({
                text: input,
                modified: false,
                flags: []
            });
            const transform2 = (input) => ({
                text: input,
                modified: false,
                flags: []
            });
            const transform3 = (input) => ({
                text: input,
                modified: false,
                flags: []
            });
            pipeline.registerTransform('redact.pii', transform1);
            pipeline.registerTransform('detect.allergens', transform2);
            pipeline.registerTransform('rewrite.disclaimer', transform3);
            const registry = pipeline.getRegistry();
            const transformList = registry.list();
            expect(transformList).toContain('redact.pii');
            expect(transformList).toContain('detect.allergens');
            expect(transformList).toContain('rewrite.disclaimer');
            expect(transformList).toHaveLength(3);
        });
        it('should allow overwriting registered transforms', async () => {
            const pipeline = new TransformPipeline();
            const transform1 = (input) => ({
                text: input + ' [V1]',
                modified: true,
                flags: []
            });
            const transform2 = (input) => ({
                text: input + ' [V2]',
                modified: true,
                flags: []
            });
            pipeline.registerTransform('test.transform', transform1);
            pipeline.registerTransform('test.transform', transform2); // Overwrite
            const registry = pipeline.getRegistry();
            const transform = registry.get('test.transform');
            const result = await Promise.resolve(transform('test', {
                locale: 'en-IN',
                tenant: 'test',
                correlationId: 'test'
            }));
            expect(result.text).toBe('test [V2]');
        });
    });
    describe('Pipeline Execution with Multiple Transforms', () => {
        it('should execute transforms in sequence as defined in policy', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms:
          - step1
          - step2
          - step3
        latency_budget_ms: 200
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            // Register transforms that append markers
            const step1 = (input) => ({
                text: input + ' [STEP1]',
                modified: true,
                flags: []
            });
            const step2 = (input) => ({
                text: input + ' [STEP2]',
                modified: true,
                flags: []
            });
            const step3 = (input) => ({
                text: input + ' [STEP3]',
                modified: true,
                flags: []
            });
            pipeline.registerTransform('step1', step1);
            pipeline.registerTransform('step2', step2);
            pipeline.registerTransform('step3', step3);
            const item = {
                id: '1',
                name: 'Test Item',
                description: 'Original',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test-seq-123'
            };
            const verdict = await pipeline.execute(item, 'test', context);
            expect(verdict.verdict).toBe('modify');
            expect(verdict.changes).toHaveLength(3);
            expect(verdict.changes[2].after).toBe('Original [STEP1] [STEP2] [STEP3]');
            expect(verdict.correlation_id).toBe('test-seq-123');
        });
        it('should collect flags and reasons from all transforms', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms:
          - flag1
          - flag2
        latency_budget_ms: 150
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            const flag1 = (input) => ({
                text: input,
                modified: false,
                flags: [
                    {
                        kind: 'warn',
                        label: 'Warning 1',
                        explanation: 'First warning detected',
                        source: 'https://example.com/rule1'
                    }
                ]
            });
            const flag2 = (input) => ({
                text: input,
                modified: false,
                flags: [
                    {
                        kind: 'danger',
                        label: 'Danger',
                        explanation: 'Critical issue found',
                        source: 'https://example.com/rule2'
                    }
                ]
            });
            pipeline.registerTransform('flag1', flag1);
            pipeline.registerTransform('flag2', flag2);
            const item = {
                id: '1',
                name: 'Test',
                description: 'Test content',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test-flags'
            };
            const verdict = await pipeline.execute(item, 'test', context);
            expect(verdict.reasons).toHaveLength(2);
            expect(verdict.reasons[0].transform).toBe('flag1');
            expect(verdict.reasons[0].why).toBe('First warning detected');
            expect(verdict.reasons[0].source).toBe('https://example.com/rule1');
            expect(verdict.reasons[1].transform).toBe('flag2');
            expect(verdict.reasons[1].why).toBe('Critical issue found');
        });
        it('should handle transforms with no modifications', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms:
          - passthrough1
          - passthrough2
        latency_budget_ms: 100
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            const passthrough = (input) => ({
                text: input,
                modified: false,
                flags: []
            });
            pipeline.registerTransform('passthrough1', passthrough);
            pipeline.registerTransform('passthrough2', passthrough);
            const item = {
                id: '1',
                name: 'Test',
                description: 'Unchanged',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test-pass'
            };
            const verdict = await pipeline.execute(item, 'test', context);
            expect(verdict.verdict).toBe('allow');
            expect(verdict.changes).toHaveLength(0);
            expect(verdict.reasons).toHaveLength(0);
        });
    });
    describe('Error Handling and Degraded Mode', () => {
        it('should continue pipeline execution when a transform fails', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms:
          - working1
          - failing
          - working2
        latency_budget_ms: 150
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            const working = (input) => ({
                text: input + ' [OK]',
                modified: true,
                flags: []
            });
            const failing = () => {
                throw new Error('Transform crashed');
            };
            pipeline.registerTransform('working1', working);
            pipeline.registerTransform('failing', failing);
            pipeline.registerTransform('working2', working);
            const item = {
                id: '1',
                name: 'Test',
                description: 'Start',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test-error'
            };
            const verdict = await pipeline.execute(item, 'test', context);
            // Should have executed working1 and working2
            expect(verdict.changes.length).toBeGreaterThan(0);
            expect(verdict.changes[1].after).toBe('Start [OK] [OK]');
            // Should have error reason from failing transform
            expect(verdict.reasons.some(r => r.transform === 'failing' && r.why.includes('Transform crashed'))).toBe(true);
        });
        it('should skip unregistered transforms and continue', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms:
          - registered1
          - unregistered
          - registered2
        latency_budget_ms: 150
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            const registered = (input) => ({
                text: input + ' [REG]',
                modified: true,
                flags: []
            });
            pipeline.registerTransform('registered1', registered);
            pipeline.registerTransform('registered2', registered);
            // Note: 'unregistered' is NOT registered
            const item = {
                id: '1',
                name: 'Test',
                description: 'Start',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test-skip'
            };
            const verdict = await pipeline.execute(item, 'test', context);
            // Should execute only registered transforms
            expect(verdict.verdict).toBe('modify');
            expect(verdict.changes).toHaveLength(2);
            expect(verdict.changes[1].after).toBe('Start [REG] [REG]');
        });
        it('should handle transform timeout gracefully', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms:
          - slow
          - fast
        latency_budget_ms: 50
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            const slowTransform = async (input) => {
                await new Promise(resolve => setTimeout(resolve, 100)); // Exceeds budget
                return {
                    text: input + ' [SLOW]',
                    modified: true,
                    flags: []
                };
            };
            const fastTransform = (input) => ({
                text: input + ' [FAST]',
                modified: true,
                flags: []
            });
            pipeline.registerTransform('slow', slowTransform);
            pipeline.registerTransform('fast', fastTransform);
            const item = {
                id: '1',
                name: 'Test',
                description: 'Start',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test-timeout'
            };
            const verdict = await pipeline.execute(item, 'test', context);
            // Should have timeout error for slow transform
            expect(verdict.reasons.some(r => r.transform === 'slow' && r.why.includes('timeout'))).toBe(true);
            // Fast transform should still execute
            expect(verdict.changes.some(c => c.after.includes('[FAST]'))).toBe(true);
        });
        it('should handle async transforms correctly', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms:
          - async1
          - async2
        latency_budget_ms: 200
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            const async1 = async (input) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return {
                    text: input + ' [ASYNC1]',
                    modified: true,
                    flags: []
                };
            };
            const async2 = async (input) => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return {
                    text: input + ' [ASYNC2]',
                    modified: true,
                    flags: []
                };
            };
            pipeline.registerTransform('async1', async1);
            pipeline.registerTransform('async2', async2);
            const item = {
                id: '1',
                name: 'Test',
                description: 'Start',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test-async'
            };
            const verdict = await pipeline.execute(item, 'test', context);
            expect(verdict.verdict).toBe('modify');
            expect(verdict.changes[1].after).toBe('Start [ASYNC1] [ASYNC2]');
        });
        it('should generate unique audit IDs for each execution', async () => {
            const policyContent = `
version: 1.0.0
profiles:
  test:
    routes:
      - path: /test
        transforms: []
        latency_budget_ms: 100
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            const item = {
                id: '1',
                name: 'Test',
                ingredients: []
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-tenant',
                correlationId: 'test'
            };
            const verdict1 = await pipeline.execute(item, 'test', context);
            const verdict2 = await pipeline.execute(item, 'test', context);
            expect(verdict1.audit_id).toBeDefined();
            expect(verdict2.audit_id).toBeDefined();
            expect(verdict1.audit_id).not.toBe(verdict2.audit_id);
        });
    });
    describe('End-to-End Integration', () => {
        it('should load policy, register transforms, and execute full pipeline', async () => {
            const policyContent = `
version: 1.5.0
profiles:
  menushield_test:
    name: MenuShield Test
    routes:
      - path: /v1/menu/feed
        transforms:
          - redact.pii
          - detect.allergens
          - rewrite.disclaimer
        latency_budget_ms: 150
`;
            writeFileSync(TEST_POLICY_PATH, policyContent);
            const loader = new PolicyLoader({
                policyPath: TEST_POLICY_PATH,
                rulePacksDir: TEST_PACKS_DIR
            });
            const policy = loader.loadPolicy();
            const pipeline = new TransformPipeline();
            pipeline.loadPolicy(policy);
            // Register mock transforms
            const redactPii = (input) => {
                const redacted = input.replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
                return {
                    text: redacted,
                    modified: redacted !== input,
                    flags: redacted !== input ? [{
                            kind: 'ok',
                            label: 'PII Redacted',
                            explanation: 'Email addresses removed for privacy',
                            source: 'https://example.com/privacy'
                        }] : []
                };
            };
            const detectAllergens = (input) => {
                const hasAllergen = /peanut|milk|egg/i.test(input);
                return {
                    text: input,
                    modified: false,
                    flags: hasAllergen ? [{
                            kind: 'warn',
                            label: 'Allergen Detected',
                            explanation: 'Contains common allergens',
                            source: 'https://example.com/allergens'
                        }] : []
                };
            };
            const rewriteDisclaimer = (input) => {
                const hasClaim = /healthy|natural|organic/i.test(input);
                if (hasClaim) {
                    return {
                        text: input + ' [Disclaimer: Claims not verified by regulatory authority]',
                        modified: true,
                        flags: [{
                                kind: 'warn',
                                label: 'Disclaimer Added',
                                explanation: 'Health claim requires disclaimer',
                                source: 'https://example.com/regulations'
                            }]
                    };
                }
                return {
                    text: input,
                    modified: false,
                    flags: []
                };
            };
            pipeline.registerTransform('redact.pii', redactPii);
            pipeline.registerTransform('detect.allergens', detectAllergens);
            pipeline.registerTransform('rewrite.disclaimer', rewriteDisclaimer);
            const item = {
                id: 'item-123',
                name: 'Healthy Peanut Butter',
                description: 'Natural peanut butter. Contact: info@example.com',
                ingredients: ['peanuts', 'salt']
            };
            const context = {
                locale: 'en-IN',
                tenant: 'test-kitchen',
                correlationId: 'e2e-test-001'
            };
            const verdict = await pipeline.execute(item, 'menushield_test', context);
            // Verify verdict
            expect(verdict.verdict).toBe('modify');
            expect(verdict.correlation_id).toBe('e2e-test-001');
            expect(verdict.audit_id).toBeDefined();
            // Verify PII was redacted
            expect(verdict.changes.some(c => c.after.includes('[EMAIL_REDACTED]'))).toBe(true);
            // Verify allergen was detected
            expect(verdict.reasons.some(r => r.why.includes('allergens'))).toBe(true);
            // Verify disclaimer was added
            expect(verdict.changes.some(c => c.after.includes('Disclaimer'))).toBe(true);
            // Verify all transforms executed
            expect(verdict.reasons.length).toBeGreaterThanOrEqual(3);
        });
    });
});
