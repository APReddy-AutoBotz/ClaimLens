import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import FilterBar from '../components/FilterBar';

/**
 * Feature: b2c-admin-final-polish, Property 5: Filter Options Multiplicity
 * Validates: Requirements 3.1, 3.2
 * 
 * For any admin dashboard in demo mode, tenant and profile filters SHALL have at least 3 options each
 */
describe('FilterBar - Property 5: Filter Options Multiplicity', () => {
  it('property: tenant filter always has at least 3 options when provided', () => {
    fc.assert(
      fc.property(
        // Generate arrays of at least 3 tenant strings
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 3, maxLength: 10 }).map(arr => 
          // Ensure uniqueness
          Array.from(new Set(arr))
        ).filter(arr => arr.length >= 3),
        (tenants) => {
          const { container, unmount } = render(
            <FilterBar
              timeRange="7d"
              onTimeRangeChange={() => {}}
              policyProfile="Default"
              onPolicyProfileChange={() => {}}
              degradedMode={false}
              degradedServices={[]}
              policyPackVersion="v2.1.0"
              lastUpdated={new Date().toISOString()}
              availableTenants={tenants}
              onTenantChange={() => {}}
            />
          );

          try {
            const tenantSelect = container.querySelector('select[id="tenant"]') as HTMLSelectElement;
            expect(tenantSelect).toBeTruthy();
            
            const options = Array.from(tenantSelect.options);
            
            // Filter out the "All Tenants" option
            const tenantOptions = options.filter(opt => opt.value !== '');
            
            // Property: tenant filter has at least 3 options
            expect(tenantOptions.length).toBeGreaterThanOrEqual(3);
            
            // Verify all provided tenants are present
            expect(tenantOptions.length).toBe(tenants.length);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: profile filter always has at least 3 options when provided', () => {
    fc.assert(
      fc.property(
        // Generate arrays of at least 3 profile strings
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 3, maxLength: 10 }).map(arr => 
          // Ensure uniqueness
          Array.from(new Set(arr))
        ).filter(arr => arr.length >= 3),
        (profiles) => {
          const { container, unmount } = render(
            <FilterBar
              timeRange="7d"
              onTimeRangeChange={() => {}}
              policyProfile={profiles[0]}
              onPolicyProfileChange={() => {}}
              degradedMode={false}
              degradedServices={[]}
              policyPackVersion="v2.1.0"
              lastUpdated={new Date().toISOString()}
              availableProfiles={profiles}
            />
          );

          try {
            const profileSelect = container.querySelector('select[id="policy-profile"]') as HTMLSelectElement;
            expect(profileSelect).toBeTruthy();
            
            const options = Array.from(profileSelect.options);
            
            // Property: profile filter has at least 3 options
            expect(options.length).toBeGreaterThanOrEqual(3);
            
            // Verify all provided profiles are present
            expect(options.length).toBe(profiles.length);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: demo mode provides exactly 3 tenant options', () => {
    // This is a specific test for the demo mode requirement
    const demoTenants = ['tenant_1', 'tenant_2', 'tenant_3'];
    
    render(
      <FilterBar
        timeRange="7d"
        onTimeRangeChange={() => {}}
        policyProfile="Default"
        onPolicyProfileChange={() => {}}
        degradedMode={false}
        degradedServices={[]}
        policyPackVersion="v2.1.0"
        lastUpdated={new Date().toISOString()}
        availableTenants={demoTenants}
        onTenantChange={() => {}}
      />
    );

    const tenantSelect = screen.getByLabelText(/select tenant/i) as HTMLSelectElement;
    const options = Array.from(tenantSelect.options);
    const tenantOptions = options.filter(opt => opt.value !== '');
    
    expect(tenantOptions.length).toBe(3);
    expect(tenantOptions.map(opt => opt.value)).toEqual(demoTenants);
  });

  it('property: demo mode provides exactly 3 profile options', () => {
    // This is a specific test for the demo mode requirement
    const demoProfiles = ['Default', 'Strict', 'Permissive'];
    
    render(
      <FilterBar
        timeRange="7d"
        onTimeRangeChange={() => {}}
        policyProfile="Default"
        onPolicyProfileChange={() => {}}
        degradedMode={false}
        degradedServices={[]}
        policyPackVersion="v2.1.0"
        lastUpdated={new Date().toISOString()}
        availableProfiles={demoProfiles}
      />
    );

    const profileSelect = screen.getByLabelText(/select policy profile/i) as HTMLSelectElement;
    const options = Array.from(profileSelect.options);
    
    expect(options.length).toBe(3);
    expect(options.map(opt => opt.value)).toEqual(demoProfiles);
  });
});
