import { useEffect, useState, useRef } from 'react';
import { api, generateDemoAuditItems } from '../api';
import type { EnhancedDashboardMetrics, FilterState, PolicyChangeRequest, EnhancedAuditRecord } from '../types';
import FilterBar from '../components/FilterBar';
import PublishReadinessCard from '../components/PublishReadinessCard';
import ComplianceRiskCard from '../components/ComplianceRiskCard';
import SLOHealthCard from '../components/SLOHealthCard';
import TopViolationsCard from '../components/TopViolationsCard';
import PolicyChangeModal from '../components/PolicyChangeModal';
import ReceiptsDrawer from '../components/ReceiptsDrawer';
import PreviewRewriteModal from '../components/PreviewRewriteModal';
import AuditDetailsDrawer from '../components/AuditDetailsDrawer';
import EmptyState from '../components/EmptyState';
import { MCPHealthPanel } from '../components/MCPHealthPanel';

function Dashboard() {
  const [metrics, setMetrics] = useState<EnhancedDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    timeRange: '7d',
    policyProfile: 'Default',
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAudits, setSelectedAudits] = useState<Set<string>>(new Set());
  const [receiptsDrawerOpen, setReceiptsDrawerOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [policyChangeModalOpen, setPolicyChangeModalOpen] = useState(false);
  const [policyChangeSuccess, setPolicyChangeSuccess] = useState<string | null>(null);
  const [runningDemo, setRunningDemo] = useState(false);
  const [newAuditIds, setNewAuditIds] = useState<Set<string>>(new Set());
  const actionQueueRef = useRef<HTMLDivElement>(null);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [selectedAuditForDrawer, setSelectedAuditForDrawer] = useState<EnhancedAuditRecord | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard(filters);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  // ESC key support for closing drawer and modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (auditDrawerOpen) setAuditDrawerOpen(false);
        if (receiptsDrawerOpen) setReceiptsDrawerOpen(false);
        if (previewModalOpen) setPreviewModalOpen(false);
        if (policyChangeModalOpen) setPolicyChangeModalOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [auditDrawerOpen, receiptsDrawerOpen, previewModalOpen, policyChangeModalOpen]);

  if (loading && !metrics) {
    return (
      <div>
        <div className="header">
          <h1>Dashboard</h1>
        </div>
        <div className="filter-bar" style={{ opacity: 0.5 }}>
          <div className="filter-controls">
            <div className="filter-group">
              <div className="filter-label">Time Range</div>
              <div className="filter-select" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>Loading...</div>
            </div>
          </div>
        </div>
        <div className="decision-cockpit">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="cockpit-card" style={{ opacity: 0.5 }}>
              <div className="cockpit-card-header">
                <div className="cockpit-icon">⏳</div>
                <h3 className="cockpit-title">Loading...</h3>
              </div>
              <div className="cockpit-metric">
                <div className="cockpit-value">--</div>
                <div className="cockpit-label">Consulting the ledger...</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h2>Action Queue</h2>
          <div className="card">
            <p style={{ padding: '2rem', textAlign: 'center', color: '#C7D2FE' }}>
              Loading audit records...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div>
        <div className="header">
          <h1>Dashboard</h1>
        </div>
        <div className="degraded-banner" role="alert" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' }}>
          <strong>⚠️ Error Loading Dashboard</strong>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Get enhanced metrics or use defaults
  const enhancedMetrics = metrics as any;
  const policyPackVersion = enhancedMetrics?.policy_pack_version || 'v2.1.0';
  const lastUpdated = enhancedMetrics?.last_updated || new Date().toISOString();
  const degradedMode = metrics?.degraded_services && metrics.degraded_services.length > 0;

  // Filter audits by selected tags, tenant, and profile (client-side)
  const filteredAudits = metrics.recent_audits.filter(audit => {
    const enhancedAudit = audit as any;
    const tags = enhancedAudit.tags || [];
    
    // Filter by tags
    const matchesTags = selectedTags.length === 0 || selectedTags.some(selectedTag => tags.includes(selectedTag));
    
    // Filter by tenant (client-side)
    const matchesTenant = !filters.tenant || audit.tenant === filters.tenant;
    
    // Filter by profile (client-side) - 'Default' shows all
    const matchesProfile = !filters.policyProfile || filters.policyProfile === 'Default' || audit.profile === filters.policyProfile;
    
    return matchesTags && matchesTenant && matchesProfile;
  });

  // Helper functions
  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSelectAudit = (auditId: string) => {
    setSelectedAudits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(auditId)) {
        newSet.delete(auditId);
      } else {
        newSet.add(auditId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAudits.size === filteredAudits.length && filteredAudits.length > 0) {
      setSelectedAudits(new Set());
    } else {
      setSelectedAudits(new Set(filteredAudits.map(a => a.audit_id)));
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredAudits.filter(a => selectedAudits.has(a.audit_id));
    const json = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewReceipts = (auditId: string) => {
    setSelectedAuditId(auditId);
    setReceiptsDrawerOpen(true);
  };

  const handlePreviewRewrite = (auditId: string) => {
    setSelectedAuditId(auditId);
    setPreviewModalOpen(true);
  };

  const handleRowClick = (audit: EnhancedAuditRecord) => {
    setSelectedAuditForDrawer(audit);
    setAuditDrawerOpen(true);
  };

  const handleCloseAuditDrawer = () => {
    setAuditDrawerOpen(false);
    setTimeout(() => setSelectedAuditForDrawer(null), 300);
  };

  const getTagIcon = (tag: string): string => {
    switch (tag) {
      case 'banned_claim': return '🚫';
      case 'allergen': return '⚠️';
      case 'recall': return '🔔';
      case 'pii': return '🔒';
      default: return '🏷️';
    }
  };

  const formatTagLabel = (tag: string): string => {
    return tag.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (ts: string): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handlePolicyChangeSubmit = async (request: Omit<PolicyChangeRequest, 'id' | 'timestamp' | 'status'>) => {
    try {
      const response = await api.createPolicyChange({
        context: request.context,
        constraints: request.constraints,
        self_critique: request.self_critique,
      });
      
      setPolicyChangeSuccess('Change request logged in the ledger');
      setPolicyChangeModalOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setPolicyChangeSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to submit policy change:', err);
      alert('Failed to submit policy change request. Please try again.');
    }
  };

  const handleRunDemoAudit = async () => {
    setRunningDemo(true);
    setPolicyChangeSuccess('🔄 Generating demo audits...');
    
    // Generate demo audits client-side for immediate visibility using enhanced generation
    const demoAudits = generateDemoAuditItems() as EnhancedAuditRecord[];
    const demoAuditIds = new Set(demoAudits.map(a => a.audit_id));
    
    // Update metrics with demo audits injected
    setMetrics(prev => {
      if (!prev) return prev;
      
      const existingAudits = prev.recent_audits || [];
      const mergedAudits: EnhancedAuditRecord[] = [...demoAudits, ...existingAudits];
      
      // Recalculate KPIs based on merged data
      const bannedClaimsCount = mergedAudits.filter((a: any) => a.tags?.includes('banned_claim')).length;
      const allergensCount = mergedAudits.filter((a: any) => a.tags?.includes('allergen')).length;
      const recallsCount = mergedAudits.filter((a: any) => a.tags?.includes('recall')).length;
      const piiCount = mergedAudits.filter((a: any) => a.tags?.includes('pii')).length;
      
      const flaggedItems = mergedAudits.filter(a => a.verdict.verdict !== 'allow').length;
      const avgLatency = mergedAudits.reduce((sum, a) => sum + a.latency_ms, 0) / mergedAudits.length;
      
      // Calculate compliance risk
      const riskScore = Math.min(100, (bannedClaimsCount * 15) + (allergensCount * 8) + (recallsCount * 25));
      const riskLevel: 'low' | 'medium' | 'high' = riskScore > 50 ? 'high' : riskScore > 20 ? 'medium' : 'low';
      
      // Determine publish status
      const blockedItems = mergedAudits.filter(a => a.verdict.verdict === 'block').length;
      const needsReviewItems = mergedAudits.filter(a => a.verdict.verdict === 'modify').length;
      let publishStatus: 'ready' | 'needs_review' | 'block' = 'ready';
      if (blockedItems > 0) publishStatus = 'block';
      else if (needsReviewItems > 0) publishStatus = 'needs_review';
      
      return {
        ...prev,
        total_audits: mergedAudits.length,
        flagged_items: flaggedItems,
        avg_processing_time: Math.round(avgLatency),
        recent_audits: mergedAudits,
        top_violations: {
          banned_claims: bannedClaimsCount,
          allergens: allergensCount,
          recalls: recallsCount,
          pii: piiCount,
        },
        compliance_risk: {
          ...prev.compliance_risk,
          level: riskLevel,
          score: riskScore,
          drivers: [
            ...(bannedClaimsCount > 0 ? [{ type: 'Banned claims', count: bannedClaimsCount }] : []),
            ...(allergensCount > 0 ? [{ type: 'Allergen risks', count: allergensCount }] : []),
          ],
        },
        publish_readiness: {
          ...prev.publish_readiness,
          status: publishStatus,
          drivers: [
            ...(needsReviewItems > 0 ? [{ label: `${needsReviewItems} items need review`, count: needsReviewItems, type: 'warning' as const }] : []),
            ...(bannedClaimsCount > 0 ? [{ label: `${bannedClaimsCount} policy violations`, count: bannedClaimsCount, type: 'danger' as const }] : []),
          ],
        },
        slo_health: {
          ...prev.slo_health,
          p95_latency_ms: Math.round(avgLatency * 1.5),
        },
      };
    });
    
    // Track new audit IDs for highlight animation
    setNewAuditIds(demoAuditIds);
    
    // Clear tag filters to ensure demo audits are visible
    setSelectedTags([]);
    
    // Show success message
    setPolicyChangeSuccess(`✓ Demo audit completed! ${demoAudits.length} new audits added to queue.`);
    setRunningDemo(false);
    
    // Scroll to Action Queue
    setTimeout(() => {
      actionQueueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Clear highlight after animation
    setTimeout(() => {
      setNewAuditIds(new Set());
    }, 2000);
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setPolicyChangeSuccess(null);
    }, 5000);
  };

  return (
    <div>
      <div className="header">
        <h1>Dashboard</h1>
        <button
          className="btn btn-primary"
          onClick={() => setPolicyChangeModalOpen(true)}
          aria-label="Request policy change"
        >
          Request Policy Change
        </button>
      </div>

      {/* Success Message */}
      {policyChangeSuccess && (
        <div className="success-banner" role="status" aria-live="polite">
          ✓ {policyChangeSuccess}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        timeRange={filters.timeRange}
        onTimeRangeChange={(range) => setFilters({ ...filters, timeRange: range })}
        policyProfile={filters.policyProfile}
        onPolicyProfileChange={(profile) => setFilters({ ...filters, policyProfile: profile })}
        tenant={filters.tenant}
        onTenantChange={(tenant) => setFilters({ ...filters, tenant })}
        degradedMode={degradedMode || false}
        degradedServices={metrics?.degraded_services || []}
        policyPackVersion={policyPackVersion}
        lastUpdated={lastUpdated}
        availableProfiles={['Default', 'Strict', 'Permissive']}
        availableTenants={['tenant_1', 'tenant_2', 'tenant_3']}
      />

      {/* Degraded Mode Banner */}
      {metrics?.degraded_services && metrics.degraded_services.length > 0 && (
        <div className="degraded-banner" role="alert" aria-live="polite">
          <strong>⚠️ System Operating in Degraded Mode</strong>
          <ul>
            {metrics.degraded_services.map(service => (
              <li key={service}>
                Service {service} unavailable. Processing continues with fallback behavior.
              </li>
            ))}
          </ul>
          <a href="/.kiro/specs/degraded-mode-matrix.yaml" target="_blank" rel="noopener noreferrer">
            View degraded mode policies
          </a>
        </div>
      )}

      {/* Decision Cockpit */}
      {metrics.publish_readiness && metrics.compliance_risk && metrics.slo_health && metrics.top_violations && metrics.sparkline_data ? (
        <div className="decision-cockpit">
          <PublishReadinessCard 
            data={metrics.publish_readiness}
            sparklineData={metrics.sparkline_data.publish_readiness}
          />
          <ComplianceRiskCard 
            data={metrics.compliance_risk}
            sparklineData={metrics.sparkline_data.compliance_risk}
          />
          <SLOHealthCard 
            data={metrics.slo_health}
            sparklineData={metrics.sparkline_data.slo_latency}
          />
          <TopViolationsCard 
            data={metrics.top_violations}
            sparklineData={metrics.sparkline_data.total_violations}
          />

          {/* MCP Service Health Panel */}
          <div style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
            <MCPHealthPanel demoMode={true} />
          </div>
        </div>
      ) : (
        /* Fallback to old KPI cards if enhanced data not available */
        <div className="kpis">
          <div className="kpi">
            <h4>Total Audits</h4>
            <div className="num">{metrics.total_audits.toLocaleString()}</div>
          </div>
          <div className="kpi">
            <h4>Flagged Items</h4>
            <div className="num">{metrics.flagged_items.toLocaleString()}</div>
          </div>
          <div className="kpi">
            <h4>Avg Processing Time</h4>
            <div className="num">{metrics.avg_processing_time.toFixed(0)}ms</div>
          </div>
          <div className="kpi">
            <h4>System Status</h4>
            <div className="num" style={{ fontSize: '1.2rem' }}>
              {metrics.degraded_services.length > 0 ? (
                <span className="badge-warn cl-badge">Degraded</span>
              ) : (
                <span className="badge-ok cl-badge">Healthy</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Queue Table */}
      <div className="mt-4" ref={actionQueueRef}>
        <div className="action-queue-header">
          <h2>Action Queue</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {filteredAudits.length > 0 && (
              <span style={{ color: '#A5B4FC', fontSize: '0.875rem' }}>
                {filteredAudits.length} item{filteredAudits.length !== 1 ? 's' : ''}
              </span>
            )}
            {selectedAudits.size > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleBulkExport}
                aria-label={`Export ${selectedAudits.size} selected audits`}
              >
                Bulk Export ({selectedAudits.size})
              </button>
            )}
          </div>
        </div>
        <div className="card">
          <table className="table action-queue-table" role="table">
            <thead>
              <tr>
                <th scope="col" className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedAudits.size === filteredAudits.length && filteredAudits.length > 0}
                    onChange={handleSelectAll}
                    aria-label="Select all audits"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                  />
                </th>
                <th scope="col" style={{ width: '80px' }}>Severity</th>
                <th scope="col" style={{ minWidth: '200px' }}>Trigger Tags</th>
                <th scope="col">Policy Profile</th>
                <th scope="col">Pack Version</th>
                <th scope="col">Route</th>
                <th scope="col">Operator</th>
                <th scope="col">Timestamp</th>
                <th scope="col" style={{ minWidth: '300px', width: '400px' }}>Item Name</th>
                <th scope="col">Verdict</th>
                <th scope="col">Latency</th>
                <th scope="col" style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudits.map(audit => {
                const enhancedAudit = audit as any;
                const severity = enhancedAudit.severity || 'low';
                const tags = enhancedAudit.tags || [];
                const packVersion = enhancedAudit.pack_version || 'v2.1.0';
                const isNewAudit = newAuditIds.has(audit.audit_id);
                
                return (
                  <tr 
                    key={audit.audit_id} 
                    className={`audit-row-clickable ${selectedAudits.has(audit.audit_id) ? 'selected-row' : ''} ${isNewAudit ? 'new-audit-row' : ''}`}
                    onClick={() => handleRowClick(audit as EnhancedAuditRecord)}
                  >
                    <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedAudits.has(audit.audit_id)}
                        onChange={() => handleSelectAudit(audit.audit_id)}
                        aria-label={`Select audit ${audit.item_name || audit.item_id}`}
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      />
                    </td>
                    <td>
                      <span 
                        className={`severity-icon severity-${severity}`}
                        aria-label={`${severity} severity`}
                        title={`${severity} severity`}
                      >
                        {severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢'}
                      </span>
                    </td>
                    <td>
                      <div className="tag-chips">
                        {tags.map((tag: string) => (
                          <button
                            key={tag}
                            className={`tag-chip ${selectedTags.includes(tag) ? 'tag-chip-active' : ''}`}
                            onClick={() => handleTagFilter(tag)}
                            aria-label={`Filter by ${tag}`}
                            aria-pressed={selectedTags.includes(tag)}
                          >
                            {getTagIcon(tag)} {formatTagLabel(tag)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>{audit.profile}</td>
                    <td><code className="version-code">{packVersion}</code></td>
                    <td><code className="route-code">{audit.route}</code></td>
                    <td>{audit.tenant}</td>
                    <td>{formatTimestamp(audit.ts)}</td>
                    <td 
                      className="item-name-cell" 
                      title={audit.item_name || audit.item_id}
                      style={{ 
                        maxWidth: '400px',
                        minWidth: '250px',
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {audit.item_name || audit.item_id}
                    </td>
                    <td>
                      <span 
                        className={`cl-badge ${
                          audit.verdict.verdict === 'allow' ? 'badge-ok' :
                          audit.verdict.verdict === 'modify' ? 'badge-warn' :
                          'badge-danger'
                        }`}
                      >
                        {audit.verdict.verdict}
                      </span>
                    </td>
                    <td>{audit.latency_ms}ms</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleViewReceipts(audit.audit_id)}
                          aria-label={`View receipts for ${audit.item_name || audit.item_id}`}
                          title="View Receipts"
                        >
                          👁️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handlePreviewRewrite(audit.audit_id)}
                          aria-label={`Preview rewrite for ${audit.item_name || audit.item_id}`}
                          title="Preview Rewrite"
                        >
                          📝
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAudits.length === 0 && (
            <EmptyState
              icon="📋"
              title="No data yet"
              description={selectedTags.length > 0 
                ? 'Clear tag filters to see all audits, or adjust your time range.'
                : 'Run a demo audit to see the system in action.'}
              ctaLabel={runningDemo ? '🔄 Generating...' : '▶ Run Demo Audit'}
              onCtaClick={handleRunDemoAudit}
            />
          )}
        </div>
      </div>

      {/* Receipts Drawer */}
      {selectedAuditId && (
        <ReceiptsDrawer
          auditId={selectedAuditId}
          isOpen={receiptsDrawerOpen}
          onClose={() => setReceiptsDrawerOpen(false)}
        />
      )}

      {/* Preview Rewrite Modal */}
      {selectedAuditId && (
        <PreviewRewriteModal
          auditId={selectedAuditId}
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
        />
      )}

      {/* Policy Change Modal */}
      <PolicyChangeModal
        isOpen={policyChangeModalOpen}
        onClose={() => setPolicyChangeModalOpen(false)}
        onSubmit={handlePolicyChangeSubmit}
        operator="admin-user"
      />

      {/* Audit Details Drawer */}
      <AuditDetailsDrawer
        audit={selectedAuditForDrawer}
        isOpen={auditDrawerOpen}
        onClose={handleCloseAuditDrawer}
      />
    </div>
  );
}

export default Dashboard;
