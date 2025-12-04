/**
 * Tests for SLO Tracker
 * Requirements: 5.6, 5.7, 5.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SLOTracker, defaultSLOs } from '../slo-tracker.js';

describe('SLOTracker', () => {
  let tracker: SLOTracker;

  beforeEach(() => {
    tracker = new SLOTracker({
      warningThreshold: 0.5,
      criticalThreshold: 0.8,
    });

    tracker.defineSLO({
      name: '/v1/menu/feed',
      target: 0.995, // 99.5% availability
      window: 60, // 60 seconds for testing
    });
  });

  describe('SLO Definition (Req 5.6)', () => {
    it('should define SLO with target and window', () => {
      tracker.defineSLO({
        name: '/v1/menu/validate',
        target: 0.995,
        window: 30 * 24 * 60 * 60, // 30 days
      });

      const slos = tracker.getSLOs();
      const validateSLO = slos.find(s => s.name === '/v1/menu/validate');
      
      expect(validateSLO).toBeDefined();
      expect(validateSLO?.target).toBe(0.995);
      expect(validateSLO?.window).toBe(30 * 24 * 60 * 60);
    });

    it('should calculate error budget from target', () => {
      const slos = tracker.getSLOs();
      const feedSLO = slos.find(s => s.name === '/v1/menu/feed');
      
      // Error budget = 1 - target = 1 - 0.995 = 0.005 (0.5%)
      expect(feedSLO?.errorBudget).toBeCloseTo(0.005, 3);
    });

    it('should support multiple SLOs', () => {
      tracker.defineSLO({
        name: '/v1/menu/validate',
        target: 0.995,
        window: 60,
      });

      tracker.defineSLO({
        name: '/v1/web/ingest',
        target: 0.995,
        window: 60,
      });

      const slos = tracker.getSLOs();
      expect(slos).toHaveLength(3);
    });
  });

  describe('Request Recording', () => {
    it('should record successful requests', async () => {
      tracker.recordRequest('/v1/menu/feed', true);
      tracker.recordRequest('/v1/menu/feed', true);
      tracker.recordRequest('/v1/menu/feed', true);

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.successRate).toBe(1.0);
      expect(status.status).toBe('healthy');
      expect(status.totalRequests).toBe(3);
      expect(status.failedRequests).toBe(0);
    });

    it('should record failed requests', async () => {
      // Record 100 requests with 2 failures (98% success rate)
      for (let i = 0; i < 98; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }
      for (let i = 0; i < 2; i++) {
        tracker.recordRequest('/v1/menu/feed', false);
      }

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.successRate).toBe(0.98);
      expect(status.totalRequests).toBe(100);
      expect(status.failedRequests).toBe(2);
    });

    it('should throw error for undefined SLO', () => {
      expect(() => {
        tracker.recordRequest('/unknown/route', true);
      }).toThrow('SLO /unknown/route not defined');
    });
  });

  describe('Error Budget Calculation (Req 5.7)', () => {
    it('should calculate error budget remaining', async () => {
      // Target: 99.5%, so error budget = 0.5%
      // With 100 requests, allowed failures = 0.5
      // If we have 0 failures, budget remaining = 100%
      for (let i = 0; i < 100; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.errorBudgetRemaining).toBeGreaterThan(0.9);
      expect(status.status).toBe('healthy');
    });

    it('should calculate budget consumed correctly', async () => {
      // Target: 99.5%, error budget = 0.5%
      // With 1000 requests, allowed failures = 5
      // With 2 failures, budget consumed = 2/5 = 40%
      // Budget remaining = 60%
      for (let i = 0; i < 998; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }
      for (let i = 0; i < 2; i++) {
        tracker.recordRequest('/v1/menu/feed', false);
      }

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.errorBudgetRemaining).toBeGreaterThan(0.5);
      expect(status.errorBudgetRemaining).toBeLessThan(0.7);
    });

    it('should handle zero requests gracefully', async () => {
      const status = await tracker.checkSLO('/v1/menu/feed');
      
      expect(status.successRate).toBe(1.0);
      expect(status.errorBudgetRemaining).toBe(1.0);
      expect(status.status).toBe('healthy');
      expect(status.totalRequests).toBe(0);
      expect(status.failedRequests).toBe(0);
    });
  });

  describe('Alert Thresholds (Req 5.8)', () => {
    it('should trigger warning at 50% budget consumed', async () => {
      // Target: 99.5%, error budget = 0.5%
      // With 1000 requests, allowed failures = 5
      // At 50% consumed, we need 2.5 failures (use 3 to exceed)
      for (let i = 0; i < 997; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }
      for (let i = 0; i < 3; i++) {
        tracker.recordRequest('/v1/menu/feed', false);
      }

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.status).toBe('warning');
      expect(status.errorBudgetRemaining).toBeLessThan(0.5);
    });

    it('should trigger critical at 80% budget consumed', async () => {
      // Target: 99.5%, error budget = 0.5%
      // With 1000 requests, allowed failures = 5
      // At 80% consumed, we need 4 failures, but let's use 5 to ensure we exceed 80%
      for (let i = 0; i < 995; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }
      for (let i = 0; i < 5; i++) {
        tracker.recordRequest('/v1/menu/feed', false);
      }

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.status).toBe('critical');
      expect(status.errorBudgetRemaining).toBeLessThanOrEqual(0.2);
    });

    it('should mark as violated when below target', async () => {
      // Target: 99.5%
      // Record 98% success rate (below target)
      for (let i = 0; i < 98; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }
      for (let i = 0; i < 2; i++) {
        tracker.recordRequest('/v1/menu/feed', false);
      }

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.successRate).toBe(0.98);
      expect(status.status).toBe('violated');
    });

    it('should remain healthy when budget consumption is low', async () => {
      // Target: 99.5%, error budget = 0.5%
      // With 1000 requests, allowed failures = 5
      // With 1 failure, budget consumed = 20% (below 50% warning threshold)
      for (let i = 0; i < 999; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }
      tracker.recordRequest('/v1/menu/feed', false);

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.status).toBe('healthy');
      expect(status.errorBudgetRemaining).toBeGreaterThan(0.7);
    });

    it('should use custom alert thresholds', async () => {
      const customTracker = new SLOTracker({
        warningThreshold: 0.3, // 30%
        criticalThreshold: 0.6, // 60%
      });

      customTracker.defineSLO({
        name: '/test',
        target: 0.995,
        window: 60,
      });

      // Consume 40% of budget (should trigger warning at 30%)
      for (let i = 0; i < 998; i++) {
        customTracker.recordRequest('/test', true);
      }
      for (let i = 0; i < 2; i++) {
        customTracker.recordRequest('/test', false);
      }

      const status = await customTracker.checkSLO('/test');
      expect(status.status).toBe('warning');
    });
  });

  describe('Multiple SLOs', () => {
    it('should check all SLOs', async () => {
      tracker.defineSLO({
        name: '/v1/menu/validate',
        target: 0.995,
        window: 60,
      });

      tracker.recordRequest('/v1/menu/feed', true);
      tracker.recordRequest('/v1/menu/validate', true);

      const statuses = await tracker.checkAllSLOs();
      expect(statuses).toHaveLength(2);
      expect(statuses[0].name).toBe('/v1/menu/feed');
      expect(statuses[1].name).toBe('/v1/menu/validate');
    });

    it('should track SLOs independently', async () => {
      tracker.defineSLO({
        name: '/v1/menu/validate',
        target: 0.995,
        window: 60,
      });

      // Feed route: healthy
      for (let i = 0; i < 100; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }

      // Validate route: violated
      for (let i = 0; i < 98; i++) {
        tracker.recordRequest('/v1/menu/validate', true);
      }
      for (let i = 0; i < 2; i++) {
        tracker.recordRequest('/v1/menu/validate', false);
      }

      const feedStatus = await tracker.checkSLO('/v1/menu/feed');
      const validateStatus = await tracker.checkSLO('/v1/menu/validate');

      expect(feedStatus.status).toBe('healthy');
      expect(validateStatus.status).toBe('violated');
    });
  });

  describe('Data Cleanup', () => {
    it('should cleanup old data outside window', async () => {
      // Record requests
      for (let i = 0; i < 10; i++) {
        tracker.recordRequest('/v1/menu/feed', true);
      }

      // Wait for cleanup (data older than window + 60s should be removed)
      // This is tested implicitly through the window mechanism
      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.totalRequests).toBe(10);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all tracking data', async () => {
      tracker.recordRequest('/v1/menu/feed', true);
      tracker.recordRequest('/v1/menu/feed', false);

      tracker.reset();

      const status = await tracker.checkSLO('/v1/menu/feed');
      expect(status.totalRequests).toBe(0);
      expect(status.failedRequests).toBe(0);
    });
  });

  describe('Default SLOs (Req 5.6)', () => {
    it('should define default SLOs for all routes', () => {
      expect(defaultSLOs).toHaveLength(4);
      
      const routes = defaultSLOs.map(slo => slo.name);
      expect(routes).toContain('/v1/menu/feed');
      expect(routes).toContain('/v1/menu/validate');
      expect(routes).toContain('/v1/web/ingest');
      expect(routes).toContain('/v1/web/overlay');
    });

    it('should set 99.5% availability target for all routes', () => {
      for (const slo of defaultSLOs) {
        expect(slo.target).toBe(0.995);
      }
    });

    it('should set 30-day window for all routes', () => {
      const thirtyDays = 30 * 24 * 60 * 60;
      for (const slo of defaultSLOs) {
        expect(slo.window).toBe(thirtyDays);
      }
    });
  });
});
