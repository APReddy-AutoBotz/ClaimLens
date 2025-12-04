import type { FilterState } from '../types';

interface FilterBarProps {
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
  policyProfile: string;
  onPolicyProfileChange: (profile: string) => void;
  tenant?: string;
  onTenantChange?: (tenant: string) => void;
  degradedMode: boolean;
  degradedServices: string[];
  policyPackVersion: string;
  lastUpdated: string;
  availableProfiles?: string[];
  availableTenants?: string[];
}

function FilterBar({
  timeRange,
  onTimeRangeChange,
  policyProfile,
  onPolicyProfileChange,
  tenant,
  onTenantChange,
  degradedMode,
  degradedServices,
  policyPackVersion,
  lastUpdated,
  availableProfiles = ['Default', 'Strict', 'Permissive'],
  availableTenants = [],
}: FilterBarProps) {
  const formatLastUpdated = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      // Check if date is invalid
      if (isNaN(date.getTime())) {
        return 'Updated recently';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Updated just now';
      if (diffMins < 60) return `Updated ${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Updated ${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `Updated ${diffDays}d ago`;
    } catch {
      return 'Updated recently';
    }
  };

  const getTimeRangeLabel = () => {
    const labels = {
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days'
    };
    return labels[timeRange];
  };

  const getProfileLabel = () => {
    return policyProfile;
  };

  const getTenantLabel = () => {
    return tenant || 'All Tenants';
  };

  const handleReset = () => {
    onTimeRangeChange('7d');
    onPolicyProfileChange('Default');
    if (onTenantChange) {
      onTenantChange('');
    }
  };

  const isDefaultFilters = timeRange === '7d' && policyProfile === 'Default' && !tenant;

  return (
    <div className="filter-bar-container">
      <div className="filter-bar">
        <div className="filter-controls">
          {/* Time Range Selector */}
          <div className="filter-group">
            <label htmlFor="time-range" className="filter-label">
              Time Range
            </label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as '24h' | '7d' | '30d')}
              className="filter-select"
              aria-label="Select time range for dashboard metrics"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Policy Profile Selector */}
          <div className="filter-group">
            <label htmlFor="policy-profile" className="filter-label">
              Policy Profile
            </label>
            <select
              id="policy-profile"
              value={policyProfile}
              onChange={(e) => onPolicyProfileChange(e.target.value)}
              className="filter-select"
              aria-label="Select policy profile"
            >
              {availableProfiles && availableProfiles.length > 0 ? (
                availableProfiles.map((profile) => (
                  <option key={profile} value={profile}>
                    {profile}
                  </option>
                ))
              ) : (
                <option value="Default">Default</option>
              )}
            </select>
          </div>

          {/* Optional Tenant Selector */}
          {onTenantChange && availableTenants.length > 0 && (
            <div className="filter-group">
              <label htmlFor="tenant" className="filter-label">
                Tenant
              </label>
              <select
                id="tenant"
                value={tenant || ''}
                onChange={(e) => onTenantChange(e.target.value)}
                className="filter-select"
                aria-label="Select tenant"
              >
                <option value="">All Tenants</option>
                {availableTenants.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Button */}
          {!isDefaultFilters && (
            <button
              className="btn-ghost filter-reset"
              onClick={handleReset}
              aria-label="Reset filters to defaults"
            >
              Reset
            </button>
          )}
        </div>

        <div className="filter-status">
          {/* Policy Pack Version */}
          <div className="status-item">
            <span className="status-label">Pack:</span>
            <span className="status-value">{policyPackVersion}</span>
          </div>

          {/* Last Updated */}
          <div className="status-item">
            <span className="status-value">{formatLastUpdated(lastUpdated)}</span>
          </div>

          {/* Degraded Mode Badge */}
          {degradedMode && degradedServices.length > 0 && (
            <div
              className="degraded-badge"
              role="status"
              aria-live="polite"
              aria-label={`System in degraded mode. Affected services: ${degradedServices.join(', ')}`}
            >
              <span className="degraded-icon" aria-hidden="true">⚠️</span>
              <span className="degraded-text">Degraded Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Applied Filters Summary */}
      <div className="filter-summary">
        <span className="filter-summary-label">Showing:</span>
        <span className="filter-summary-value">{getTimeRangeLabel()}</span>
        <span className="filter-summary-separator">•</span>
        <span className="filter-summary-value">{getProfileLabel()}</span>
        {onTenantChange && availableTenants.length > 0 && (
          <>
            <span className="filter-summary-separator">•</span>
            <span className="filter-summary-value">{getTenantLabel()}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
