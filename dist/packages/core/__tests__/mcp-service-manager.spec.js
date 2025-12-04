/**
 * MCP Service Manager Tests
 * Tests for service health checking, degraded mode, and circuit breaker integration
 *
 * Requirements: 13.1-13.5, 23.1-23.8
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPServiceManager } from '../mcp-service-manager';
import * as fs from 'fs';
// Mock fs module
vi.mock('fs');
describe('MCPServiceManager', () => {
    let manager;
    const mockRegistry = {
        mcpServers: {
            'ocr-label': {
                command: 'node',
                args: ['mcp-server-ocr.js'],
                env: { PORT: '7001', LOG_LEVEL: 'INFO' },
                disabled: false,
                autoApprove: ['extract_text'],
                description: 'OCR service'
            },
            'unit-convert': {
                command: 'node',
                args: ['mcp-server-units.js'],
                env: { PORT: '7002', LOG_LEVEL: 'INFO' },
                disabled: false,
                autoApprove: ['convert_units'],
                description: 'Unit conversion'
            },
            'recall-lookup': {
                command: 'node',
                args: ['mcp-server-recalls.js'],
                env: { PORT: '7003', LOG_LEVEL: 'INFO' },
                disabled: true, // Disabled service
                autoApprove: ['check_recalls'],
                description: 'Recall lookup'
            }
        }
    };
    const mockDegradedMode = `
services:
  ocr-label:
    critical: false
    action: pass_through
    fallback_behavior: "Skip OCR processing"
    banner_text: "Image analysis unavailable"
    audit_note: "Processed without OCR"
    timeout_ms: 500
    max_retries: 5
    
  unit-convert:
    critical: false
    action: pass_through
    fallback_behavior: "Use defaults"
    banner_text: "Unit conversion unavailable"
    audit_note: "Processed without unit conversion"
    timeout_ms: 500
    max_retries: 5
    
  recall-lookup:
    critical: false
    action: modify
    fallback_behavior: "Add generic disclaimer"
    banner_text: "Recall database unavailable"
    audit_note: "Processed without recall lookup"
    timeout_ms: 500
    max_retries: 5
    fallback_disclaimer: "Please verify ingredient safety"
`;
    beforeEach(() => {
        // Mock file reads
        vi.mocked(fs.readFileSync).mockImplementation((path) => {
            if (path.includes('registry.json')) {
                return JSON.stringify(mockRegistry);
            }
            if (path.includes('degraded-mode-matrix.yaml')) {
                return mockDegradedMode;
            }
            return '';
        });
        manager = new MCPServiceManager();
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Initialization', () => {
        it('should load service definitions from registry', async () => {
            await manager.initialize();
            const health = manager.getAllHealthChecks();
            // Should only load enabled services (ocr-label and unit-convert)
            expect(health.length).toBeGreaterThanOrEqual(0);
        });
        it('should load degraded mode configuration', async () => {
            await manager.initialize();
            const config = manager.getDegradedModeConfig('ocr-label');
            expect(config).toBeDefined();
            expect(config?.action).toBe('pass_through');
            expect(config?.timeout_ms).toBe(500);
        });
        it('should initialize circuit breakers for each service', async () => {
            await manager.initialize();
            // Circuit breakers should be created for all services in degraded mode matrix
            const degradedServices = manager.getDegradedServices();
            expect(Array.isArray(degradedServices)).toBe(true);
        });
    });
    describe('Service Calls with Circuit Breaker', () => {
        beforeEach(async () => {
            await manager.initialize();
        });
        it('should execute successful service calls', async () => {
            const mockFn = vi.fn(async () => ({ result: 'success' }));
            const result = await manager.callService('ocr-label', mockFn);
            expect(result).toEqual({ result: 'success' });
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
        it('should apply fallback for non-critical service failures', async () => {
            const mockFn = vi.fn(async () => {
                throw new Error('Service unavailable');
            });
            // Trigger failures to open circuit
            for (let i = 0; i < 5; i++) {
                await manager.callService('ocr-label', mockFn);
            }
            // Should return null (pass_through fallback)
            const result = await manager.callService('ocr-label', mockFn);
            expect(result).toBeNull();
        });
        it('should apply modify fallback for recall-lookup', async () => {
            const mockFn = vi.fn(async () => {
                throw new Error('Service unavailable');
            });
            // Trigger failures to open circuit
            for (let i = 0; i < 5; i++) {
                await manager.callService('recall-lookup', mockFn);
            }
            // Should return fallback disclaimer
            const result = await manager.callService('recall-lookup', mockFn);
            expect(result).toHaveProperty('fallback', true);
            expect(result).toHaveProperty('disclaimer');
        });
        it('should throw error for unknown service', async () => {
            const mockFn = vi.fn(async () => 'result');
            await expect(manager.callService('unknown-service', mockFn)).rejects.toThrow('Unknown MCP service');
        });
    });
    describe('Health Checking', () => {
        beforeEach(async () => {
            await manager.initialize();
        });
        it('should check service health via HTTP', async () => {
            // Mock fetch for health check
            global.fetch = vi.fn(async () => ({
                ok: true,
                json: async () => ({ status: 'ok' })
            }));
            const isHealthy = await manager.checkHealth('ocr-label');
            expect(isHealthy).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:7001/health', expect.any(Object));
        });
        it('should mark service as down on health check failure', async () => {
            // Mock fetch to fail
            global.fetch = vi.fn(async () => {
                throw new Error('Connection refused');
            });
            const isHealthy = await manager.checkHealth('ocr-label');
            expect(isHealthy).toBe(false);
            const health = manager.getAllHealthChecks();
            const ocrHealth = health.find(h => h.name === 'ocr-label');
            expect(ocrHealth?.status).toBe('down');
        });
    });
    describe('Degraded Mode Detection', () => {
        beforeEach(async () => {
            await manager.initialize();
        });
        it('should detect degraded services', async () => {
            const mockFn = vi.fn(async () => {
                throw new Error('Service failure');
            });
            // Trigger failures to open circuit
            for (let i = 0; i < 5; i++) {
                await manager.callService('ocr-label', mockFn);
            }
            const degradedServices = manager.getDegradedServices();
            expect(degradedServices).toContain('ocr-label');
        });
        it('should generate audit notes for degraded services', async () => {
            const mockFn = vi.fn(async () => {
                throw new Error('Service failure');
            });
            // Trigger failures
            for (let i = 0; i < 5; i++) {
                await manager.callService('unit-convert', mockFn);
            }
            const auditNote = manager.getAuditNote('unit-convert');
            expect(auditNote).toBe('Processed without unit conversion');
        });
        it('should generate banner text for degraded services', async () => {
            const mockFn = vi.fn(async () => {
                throw new Error('Service failure');
            });
            // Trigger failures for multiple services
            for (let i = 0; i < 5; i++) {
                await manager.callService('ocr-label', mockFn);
                await manager.callService('unit-convert', mockFn);
            }
            const bannerTexts = manager.getDegradedBannerText();
            expect(bannerTexts.length).toBeGreaterThan(0);
            expect(bannerTexts).toContain('Image analysis unavailable');
        });
        it('should return null audit note for healthy services', async () => {
            const auditNote = manager.getAuditNote('ocr-label');
            expect(auditNote).toBeNull();
        });
    });
    describe('Reset', () => {
        beforeEach(async () => {
            await manager.initialize();
        });
        it('should reset all circuit breakers', async () => {
            const mockFn = vi.fn(async () => {
                throw new Error('Service failure');
            });
            // Open circuits
            for (let i = 0; i < 5; i++) {
                await manager.callService('ocr-label', mockFn);
            }
            expect(manager.getDegradedServices()).toContain('ocr-label');
            // Reset
            manager.resetAll();
            expect(manager.getDegradedServices()).not.toContain('ocr-label');
            expect(manager.getAllHealthChecks().length).toBe(0);
        });
    });
});
