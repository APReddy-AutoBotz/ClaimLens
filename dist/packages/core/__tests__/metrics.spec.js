/**
 * Tests for Metrics
 * Requirements: 5.1, 5.2, 5.3
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Counter, Histogram, Gauge, MetricsRegistry, metrics } from '../metrics';
describe('Counter (Req 5.1)', () => {
    let counter;
    beforeEach(() => {
        counter = new Counter({
            name: 'test_counter',
            help: 'Test counter',
            labelNames: ['tenant', 'route'],
        });
    });
    it('should increment counter by 1', () => {
        counter.inc({ tenant: 'test', route: '/test' });
        expect(counter.get({ tenant: 'test', route: '/test' })).toBe(1);
    });
    it('should increment counter by specified value', () => {
        counter.inc({ tenant: 'test', route: '/test' }, 5);
        expect(counter.get({ tenant: 'test', route: '/test' })).toBe(5);
        counter.inc({ tenant: 'test', route: '/test' }, 3);
        expect(counter.get({ tenant: 'test', route: '/test' })).toBe(8);
    });
    it('should track separate values for different label combinations', () => {
        counter.inc({ tenant: 'tenant1', route: '/route1' }, 5);
        counter.inc({ tenant: 'tenant2', route: '/route2' }, 10);
        expect(counter.get({ tenant: 'tenant1', route: '/route1' })).toBe(5);
        expect(counter.get({ tenant: 'tenant2', route: '/route2' })).toBe(10);
    });
    it('should return 0 for uninitialized label combinations', () => {
        expect(counter.get({ tenant: 'unknown', route: '/unknown' })).toBe(0);
    });
    it('should reset counter', () => {
        counter.inc({ tenant: 'test', route: '/test' }, 10);
        counter.reset();
        expect(counter.get({ tenant: 'test', route: '/test' })).toBe(0);
    });
    it('should export in Prometheus format', () => {
        counter.inc({ tenant: 'test', route: '/test' }, 10);
        const exported = counter.export();
        expect(exported).toContain('# HELP test_counter Test counter');
        expect(exported).toContain('# TYPE test_counter counter');
        expect(exported).toContain('test_counter{route="/test",tenant="test"} 10');
    });
    it('should sort labels alphabetically in export', () => {
        counter.inc({ route: '/test', tenant: 'test' }, 5);
        const exported = counter.export();
        // Labels should be sorted: route, tenant
        expect(exported).toContain('route="/test",tenant="test"');
    });
});
describe('Histogram (Req 5.2)', () => {
    let histogram;
    beforeEach(() => {
        histogram = new Histogram({
            name: 'test_histogram',
            help: 'Test histogram',
            labelNames: ['tenant', 'route'],
            buckets: [10, 50, 100, 200],
        });
    });
    it('should observe values', () => {
        histogram.observe({ tenant: 'test', route: '/test' }, 25);
        histogram.observe({ tenant: 'test', route: '/test' }, 75);
        histogram.observe({ tenant: 'test', route: '/test' }, 150);
        const avg = histogram.getAverage({ tenant: 'test', route: '/test' });
        expect(avg).toBeCloseTo(83.33, 1);
    });
    it('should calculate p50 percentile', () => {
        for (let i = 1; i <= 100; i++) {
            histogram.observe({ tenant: 'test', route: '/test' }, i);
        }
        const p50 = histogram.getPercentile({ tenant: 'test', route: '/test' }, 0.5);
        expect(p50).toBeGreaterThan(0);
        expect(p50).toBeLessThanOrEqual(100);
    });
    it('should calculate p95 percentile', () => {
        for (let i = 1; i <= 100; i++) {
            histogram.observe({ tenant: 'test', route: '/test' }, i);
        }
        const p95 = histogram.getPercentile({ tenant: 'test', route: '/test' }, 0.95);
        const p50 = histogram.getPercentile({ tenant: 'test', route: '/test' }, 0.5);
        expect(p95).toBeGreaterThan(p50);
    });
    it('should track latency distribution', () => {
        // Simulate request latencies
        const latencies = [15, 25, 35, 45, 55, 65, 75, 85, 95, 105];
        for (const latency of latencies) {
            histogram.observe({ tenant: 'test', route: '/v1/menu/feed' }, latency);
        }
        const avg = histogram.getAverage({ tenant: 'test', route: '/v1/menu/feed' });
        expect(avg).toBe(60); // Average of 15-105
    });
    it('should use default buckets if not specified', () => {
        const defaultHistogram = new Histogram({
            name: 'default_histogram',
            help: 'Default histogram',
        });
        defaultHistogram.observe({}, 150);
        const exported = defaultHistogram.export();
        // Should contain default buckets
        expect(exported).toContain('le="10"');
        expect(exported).toContain('le="100"');
        expect(exported).toContain('le="1000"');
    });
    it('should reset histogram', () => {
        histogram.observe({ tenant: 'test', route: '/test' }, 50);
        histogram.reset();
        const avg = histogram.getAverage({ tenant: 'test', route: '/test' });
        expect(avg).toBe(0);
    });
    it('should export in Prometheus format', () => {
        histogram.observe({ tenant: 'test', route: '/test' }, 25);
        histogram.observe({ tenant: 'test', route: '/test' }, 75);
        const exported = histogram.export();
        expect(exported).toContain('# HELP test_histogram Test histogram');
        expect(exported).toContain('# TYPE test_histogram histogram');
        expect(exported).toContain('test_histogram_bucket');
        expect(exported).toContain('test_histogram_sum');
        expect(exported).toContain('test_histogram_count');
        expect(exported).toContain('le="+Inf"');
    });
    it('should track bucket counts correctly', () => {
        histogram.observe({ tenant: 'test', route: '/test' }, 5); // <= 10
        histogram.observe({ tenant: 'test', route: '/test' }, 25); // <= 50
        histogram.observe({ tenant: 'test', route: '/test' }, 75); // <= 100
        histogram.observe({ tenant: 'test', route: '/test' }, 150); // <= 200
        const exported = histogram.export();
        // Bucket counts are cumulative
        expect(exported).toMatch(/le="10".*1/); // 1 value <= 10
        expect(exported).toMatch(/le="50".*2/); // 2 values <= 50
        expect(exported).toMatch(/le="100".*3/); // 3 values <= 100
        expect(exported).toMatch(/le="200".*4/); // 4 values <= 200
    });
});
describe('Gauge (Req 5.3)', () => {
    let gauge;
    beforeEach(() => {
        gauge = new Gauge({
            name: 'test_gauge',
            help: 'Test gauge',
            labelNames: ['tenant'],
        });
    });
    it('should set gauge value', () => {
        gauge.set({ tenant: 'test' }, 42);
        expect(gauge.get({ tenant: 'test' })).toBe(42);
    });
    it('should increment gauge', () => {
        gauge.set({ tenant: 'test' }, 10);
        gauge.inc({ tenant: 'test' }, 5);
        expect(gauge.get({ tenant: 'test' })).toBe(15);
    });
    it('should decrement gauge', () => {
        gauge.set({ tenant: 'test' }, 10);
        gauge.dec({ tenant: 'test' }, 3);
        expect(gauge.get({ tenant: 'test' })).toBe(7);
    });
    it('should track active requests', () => {
        gauge.inc({ tenant: 'test' }); // Request started
        gauge.inc({ tenant: 'test' }); // Another request started
        expect(gauge.get({ tenant: 'test' })).toBe(2);
        gauge.dec({ tenant: 'test' }); // Request completed
        expect(gauge.get({ tenant: 'test' })).toBe(1);
    });
    it('should track degraded services', () => {
        gauge.set({ tenant: 'test' }, 0); // All services healthy
        expect(gauge.get({ tenant: 'test' })).toBe(0);
        gauge.set({ tenant: 'test' }, 2); // 2 services degraded
        expect(gauge.get({ tenant: 'test' })).toBe(2);
    });
    it('should reset gauge', () => {
        gauge.set({ tenant: 'test' }, 42);
        gauge.reset();
        expect(gauge.get({ tenant: 'test' })).toBe(0);
    });
    it('should export in Prometheus format', () => {
        gauge.set({ tenant: 'test' }, 42);
        const exported = gauge.export();
        expect(exported).toContain('# HELP test_gauge Test gauge');
        expect(exported).toContain('# TYPE test_gauge gauge');
        expect(exported).toContain('test_gauge{tenant="test"} 42');
    });
});
describe('MetricsRegistry', () => {
    let registry;
    beforeEach(() => {
        registry = new MetricsRegistry();
    });
    it('should register and retrieve metrics', () => {
        const counter = new Counter({
            name: 'test_counter',
            help: 'Test counter',
        });
        registry.register(counter);
        const retrieved = registry.get('test_counter');
        expect(retrieved).toBe(counter);
    });
    it('should prevent duplicate metric registration', () => {
        const counter1 = new Counter({
            name: 'test_counter',
            help: 'Test counter',
        });
        const counter2 = new Counter({
            name: 'test_counter',
            help: 'Duplicate counter',
        });
        registry.register(counter1);
        expect(() => registry.register(counter2)).toThrow('already registered');
    });
    it('should export all metrics in Prometheus format', () => {
        const counter = new Counter({
            name: 'test_counter',
            help: 'Test counter',
        });
        counter.inc({}, 5);
        const gauge = new Gauge({
            name: 'test_gauge',
            help: 'Test gauge',
        });
        gauge.set({}, 10);
        registry.register(counter);
        registry.register(gauge);
        const exported = registry.export();
        expect(exported).toContain('test_counter');
        expect(exported).toContain('test_gauge');
        expect(exported).toContain('# TYPE test_counter counter');
        expect(exported).toContain('# TYPE test_gauge gauge');
    });
    it('should reset all metrics', () => {
        const counter = new Counter({
            name: 'test_counter',
            help: 'Test counter',
        });
        counter.inc({}, 5);
        const gauge = new Gauge({
            name: 'test_gauge',
            help: 'Test gauge',
        });
        gauge.set({}, 10);
        registry.register(counter);
        registry.register(gauge);
        registry.reset();
        expect(counter.get({})).toBe(0);
        expect(gauge.get({})).toBe(0);
    });
});
describe('ClaimLens Metrics (Req 5.1, 5.2, 5.3)', () => {
    beforeEach(() => {
        // Reset all metrics before each test
        metrics.requests_total.reset();
        metrics.requests_failed.reset();
        metrics.transforms_executed.reset();
        metrics.request_duration_ms.reset();
        metrics.transform_duration_ms.reset();
        metrics.active_requests.reset();
        metrics.degraded_services.reset();
    });
    it('should track total requests', () => {
        metrics.requests_total.inc({
            tenant: 'test',
            route: '/v1/menu/feed',
            status: '200'
        });
        expect(metrics.requests_total.get({
            tenant: 'test',
            route: '/v1/menu/feed',
            status: '200'
        })).toBe(1);
    });
    it('should track failed requests', () => {
        metrics.requests_failed.inc({
            tenant: 'test',
            route: '/v1/menu/feed',
            error_code: 'TRANSFORM_ERROR'
        });
        expect(metrics.requests_failed.get({
            tenant: 'test',
            route: '/v1/menu/feed',
            error_code: 'TRANSFORM_ERROR'
        })).toBe(1);
    });
    it('should track transform executions', () => {
        metrics.transforms_executed.inc({
            tenant: 'test',
            profile: 'menushield_in',
            transform: 'redact.pii',
            decision: 'modify'
        });
        expect(metrics.transforms_executed.get({
            tenant: 'test',
            profile: 'menushield_in',
            transform: 'redact.pii',
            decision: 'modify'
        })).toBe(1);
    });
    it('should track request duration', () => {
        metrics.request_duration_ms.observe({
            tenant: 'test',
            route: '/v1/menu/feed'
        }, 125);
        const avg = metrics.request_duration_ms.getAverage({
            tenant: 'test',
            route: '/v1/menu/feed'
        });
        expect(avg).toBe(125);
    });
    it('should track transform duration', () => {
        metrics.transform_duration_ms.observe({
            tenant: 'test',
            profile: 'menushield_in',
            transform: 'redact.pii'
        }, 15);
        const avg = metrics.transform_duration_ms.getAverage({
            tenant: 'test',
            profile: 'menushield_in',
            transform: 'redact.pii'
        });
        expect(avg).toBe(15);
    });
    it('should track active requests', () => {
        metrics.active_requests.inc({ tenant: 'test', route: '/v1/menu/feed' });
        expect(metrics.active_requests.get({ tenant: 'test', route: '/v1/menu/feed' })).toBe(1);
        metrics.active_requests.dec({ tenant: 'test', route: '/v1/menu/feed' });
        expect(metrics.active_requests.get({ tenant: 'test', route: '/v1/menu/feed' })).toBe(0);
    });
    it('should track degraded services', () => {
        metrics.degraded_services.set({ tenant: 'test' }, 2);
        expect(metrics.degraded_services.get({ tenant: 'test' })).toBe(2);
    });
});
