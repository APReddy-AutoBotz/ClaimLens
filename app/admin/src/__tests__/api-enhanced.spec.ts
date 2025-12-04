import { describe, it, expect } from 'vitest';
import type { EnhancedDashboardMetrics, FilterState } from '../types';

describe('Enhanced Dashboard Types', () => {
  it('should have correct structure for EnhancedDashboardMetrics', () => {
    const mockMetrics: EnhancedDashboardMetrics = {
      // Base metrics
      total_audits: 100,
      flagged_items: 20,
      avg_processing_time: 150,
      degraded_services: [],
      recent_audits: [],
      
      // Enhanced metrics
      publish_readiness: {
        status: 'needs_review',
        drivers: [
          { label: '3 items need review', count: 3, type: 'warning' }
        ]
      },
      
      compliance_risk: {
        level: 'medium',
        score: 45,
        drivers: [
          { type: 'Banned claims', count: 12 }
        ]
      },
      
      slo_health: {
        p95_latency_ms: 245,
        latency_budget_ms: 300,
        error_rate: 0.002,
        circuit_breaker_state: 'closed'
      },
      
      top_violations: {
        banned_claims: 15,
        allergens: 8,
        recalls: 2,
        pii: 1
      },
      
      sparkline_data: {
        publish_readiness: [1, 2, 3, 2, 1, 2, 3],
        compliance_risk: [40, 42, 45, 43, 44, 45, 45],
        slo_latency: [230, 240, 245, 250, 245, 240, 245],
        total_violations: [20, 22, 25, 23, 24, 26, 26]
      },
      
      policy_pack_version: 'v2.1.0',
      last_updated: new Date().toISOString()
    };
    
    expect(mockMetrics.publish_readiness.status).toBe('needs_review');
    expect(mockMetrics.compliance_risk.level).toBe('medium');
    expect(mockMetrics.slo_health.circuit_breaker_state).toBe('closed');
    expect(mockMetrics.sparkline_data.publish_readiness).toHaveLength(7);
  });
  
  it('should have correct structure for FilterState', () => {
    const filters: FilterState = {
      timeRange: '7d',
      policyProfile: 'menushield_in',
      tenant: 'tenant_1'
    };
    
    expect(filters.timeRange).toBe('7d');
    expect(filters.policyProfile).toBe('menushield_in');
    expect(filters.tenant).toBe('tenant_1');
  });
  
  it('should support sparkline data with 7 points', () => {
    const sparklineData = {
      publish_readiness: [1, 2, 3, 4, 5, 6, 7],
      compliance_risk: [10, 20, 30, 40, 50, 60, 70],
      slo_latency: [100, 150, 200, 250, 200, 150, 100],
      total_violations: [5, 10, 15, 20, 15, 10, 5]
    };
    
    expect(sparklineData.publish_readiness).toHaveLength(7);
    expect(sparklineData.compliance_risk).toHaveLength(7);
    expect(sparklineData.slo_latency).toHaveLength(7);
    expect(sparklineData.total_violations).toHaveLength(7);
  });
});
