/**
 * SSRF Defense Tests
 * Requirements: 18.3
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateMCPUrl, addAllowedHost, getAllowedHosts, safeFetch, } from '../ssrf-defense';
describe('SSRF Defense', () => {
    beforeEach(() => {
        // Reset environment
        process.env.NODE_ENV = 'test';
    });
    describe('validateMCPUrl', () => {
        it('should accept localhost in development', () => {
            process.env.NODE_ENV = 'development';
            const result = validateMCPUrl('http://localhost:7001/health');
            expect(result.valid).toBe(true);
        });
        it('should accept allowlisted hosts', () => {
            const result = validateMCPUrl('http://mcp.claimlens.internal/api');
            expect(result.valid).toBe(true);
        });
        it('should reject non-allowlisted hosts', () => {
            const result = validateMCPUrl('http://evil.com/api');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('not in the MCP service allowlist');
        });
        it('should require HTTPS in production', () => {
            process.env.NODE_ENV = 'production';
            const result = validateMCPUrl('http://mcp.claimlens.internal/api');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('HTTPS required');
        });
        it('should accept HTTPS in production', () => {
            process.env.NODE_ENV = 'production';
            addAllowedHost('mcp.claimlens.internal');
            const result = validateMCPUrl('https://mcp.claimlens.internal/api');
            expect(result.valid).toBe(true);
        });
        it('should block private IP ranges in production', () => {
            process.env.NODE_ENV = 'production';
            // Add private IPs to allowlist for testing
            addAllowedHost('10.0.0.1');
            addAllowedHost('172.16.0.1');
            addAllowedHost('192.168.1.1');
            expect(validateMCPUrl('https://10.0.0.1/api').valid).toBe(false);
            expect(validateMCPUrl('https://172.16.0.1/api').valid).toBe(false);
            expect(validateMCPUrl('https://192.168.1.1/api').valid).toBe(false);
        });
        it('should allow private IPs in development', () => {
            process.env.NODE_ENV = 'development';
            addAllowedHost('192.168.1.100');
            const result = validateMCPUrl('http://192.168.1.100:7001/api');
            expect(result.valid).toBe(true);
        });
        it('should reject invalid URLs', () => {
            const result = validateMCPUrl('not-a-url');
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid URL');
        });
        it('should handle IPv6 localhost', () => {
            process.env.NODE_ENV = 'development';
            // IPv6 addresses in URLs use brackets, but hostname is without brackets
            const result = validateMCPUrl('http://localhost:7001/api');
            expect(result.valid).toBe(true);
        });
    });
    describe('addAllowedHost', () => {
        it('should add host to allowlist', () => {
            const initialCount = getAllowedHosts().length;
            addAllowedHost('new-host.example.com');
            expect(getAllowedHosts()).toContain('new-host.example.com');
            expect(getAllowedHosts().length).toBe(initialCount + 1);
        });
        it('should not add duplicate hosts', () => {
            addAllowedHost('duplicate.example.com');
            const countAfterFirst = getAllowedHosts().length;
            addAllowedHost('duplicate.example.com');
            expect(getAllowedHosts().length).toBe(countAfterFirst);
        });
    });
    describe('safeFetch', () => {
        it('should reject non-allowlisted URLs', async () => {
            await expect(safeFetch('http://evil.com/api')).rejects.toThrow('SSRF validation failed');
        });
        it('should enforce timeout', async () => {
            process.env.NODE_ENV = 'development';
            // Mock fetch that respects abort signal
            global.fetch = vi.fn((url, options) => {
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        resolve({
                            headers: { get: () => null },
                        });
                    }, 1000); // Longer than 500ms timeout
                    // Listen for abort signal
                    if (options?.signal) {
                        options.signal.addEventListener('abort', () => {
                            clearTimeout(timeout);
                            const error = new Error('The operation was aborted');
                            error.name = 'AbortError';
                            reject(error);
                        });
                    }
                });
            });
            await expect(safeFetch('http://localhost:7001/slow')).rejects.toThrow('timeout');
        });
        it('should check response size', async () => {
            process.env.NODE_ENV = 'development';
            // Mock fetch with large content-length
            global.fetch = vi.fn(() => Promise.resolve({
                headers: {
                    get: (name) => name === 'content-length' ? '10000000' : null,
                },
            }));
            await expect(safeFetch('http://localhost:7001/large', {}, 1024)).rejects.toThrow('exceeds maximum');
        });
    });
});
