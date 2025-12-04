import type { EnhancedAuditRecord } from '../types';

interface AuditDetailsDrawerProps {
  audit: EnhancedAuditRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper to derive "Why this was flagged" summary from audit data
function deriveWhySummary(audit: EnhancedAuditRecord) {
  const reasons = audit.verdict?.reasons || [];
  const tags = audit.tags || [];
  const verdict = audit.verdict?.verdict || 'allow';
  
  // Primary reason - from reasons array or derive from tags/verdict
  let primaryReason = 'No issues detected';
  if (reasons.length > 0 && reasons[0].why) {
    primaryReason = reasons[0].why;
  } else if (tags.includes('banned_claim')) {
    primaryReason = 'Contains unsubstantiated health claim';
  } else if (tags.includes('allergen')) {
    primaryReason = 'Missing or incomplete allergen disclosure';
  } else if (tags.includes('recall')) {
    primaryReason = 'Product matches active recall notice';
  } else if (tags.includes('pii')) {
    primaryReason = 'Contains personally identifiable information';
  } else if (verdict === 'modify') {
    primaryReason = 'Content requires compliance modification';
  } else if (verdict === 'block') {
    primaryReason = 'Content violates policy requirements';
  }

  // Policy triggered - from transform name or derive from tags
  let policyTriggered = 'packs/default';
  if (reasons.length > 0 && reasons[0].transform) {
    policyTriggered = `packs/${reasons[0].transform}`;
  } else if (tags.includes('banned_claim')) {
    policyTriggered = 'packs/block.banned_claims';
  } else if (tags.includes('allergen')) {
    policyTriggered = 'packs/detect.allergens';
  } else if (tags.includes('recall')) {
    policyTriggered = 'packs/detect.recalls';
  }

  // Recommended action based on verdict
  let recommendedAction = 'No action required';
  if (verdict === 'block') {
    recommendedAction = 'Remove item from publication queue';
  } else if (verdict === 'modify') {
    recommendedAction = 'Review and approve suggested changes';
  }

  return { primaryReason, policyTriggered, recommendedAction };
}

// Helper to get decision explanation
function getDecisionExplanation(decision: string): string {
  switch (decision) {
    case 'pass': return 'No findings';
    case 'flag': return 'Policy violation detected';
    case 'modify': return 'Rewrite applied';
    default: return 'Processed';
  }
}

function AuditDetailsDrawer({ audit, isOpen, onClose }: AuditDetailsDrawerProps) {
  if (!audit) return null;

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      full: date.toISOString()
    };
  };

  const { date, time, full } = formatTimestamp(audit.ts);
  const totalTransformTime = audit.transforms?.reduce((sum, t) => sum + t.duration_ms, 0) || 0;
  const whySummary = deriveWhySummary(audit);

  // Semantic colors matching KPI cards (WCAG AA compliant)
  const COLORS = {
    success: '#34D399',  // Green - allow/pass/low
    warning: '#FBBF24',  // Amber - modify/medium  
    danger: '#F87171',   // Red - block/flag/high
    neutral: '#94A3B8'   // Gray - default
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'allow': return COLORS.success;
      case 'modify': return COLORS.warning;
      case 'block': return COLORS.danger;
      default: return COLORS.neutral;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return COLORS.danger;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.success;
      default: return COLORS.neutral;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'pass': return COLORS.success;
      case 'flag': return COLORS.danger;
      case 'modify': return COLORS.warning;
      default: return COLORS.neutral;
    }
  };

  // Get before/after content for diff preview
  const changes = audit.verdict?.changes || [];
  const hasChanges = changes.length > 0;
  const firstChange = hasChanges ? changes[0] : null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`audit-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <aside 
        className={`audit-drawer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-drawer-title"
      >
        <div className="audit-drawer-content">
          {/* Header */}
          <header className="audit-drawer-header">
            <div>
              <h2 id="audit-drawer-title" className="audit-drawer-title">Audit Details</h2>
              <p className="audit-drawer-subtitle">{audit.item_name || audit.item_id}</p>
            </div>
            <button 
              className="audit-drawer-close"
              onClick={onClose}
              aria-label="Close audit details"
            >
              ✕
            </button>
          </header>

          {/* Body */}
          <div className="audit-drawer-body">
            {/* Why This Was Flagged - Top Summary Block */}
            <section className="audit-section audit-why-section">
              <h3 className="audit-section-title">
                <span className="audit-section-icon">⚡</span>
                Why This Was Flagged
              </h3>
              <div className="audit-why-card">
                <ul className="audit-why-list">
                  <li className="audit-why-item">
                    <span className="audit-why-bullet" style={{ backgroundColor: getSeverityColor(audit.severity || 'low') }}>1</span>
                    <div className="audit-why-content">
                      <span className="audit-why-label">Primary Reason</span>
                      <span className="audit-why-value">{whySummary.primaryReason}</span>
                    </div>
                  </li>
                  <li className="audit-why-item">
                    <span className="audit-why-bullet audit-why-bullet-secondary">2</span>
                    <div className="audit-why-content">
                      <span className="audit-why-label">Policy Triggered</span>
                      <code className="audit-why-code">{whySummary.policyTriggered}</code>
                    </div>
                  </li>
                  <li className="audit-why-item">
                    <span className="audit-why-bullet audit-why-bullet-tertiary">3</span>
                    <div className="audit-why-content">
                      <span className="audit-why-label">Recommended Action</span>
                      <span className="audit-why-value">{whySummary.recommendedAction}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Before → After Preview */}
            <section className="audit-section">
              <h3 className="audit-section-title">
                <span className="audit-section-icon">📝</span>
                Before → After Preview
              </h3>
              <div className="audit-diff-card">
                {hasChanges && firstChange ? (
                  <>
                    <div className="audit-diff-row audit-diff-before">
                      <div className="audit-diff-label">
                        <span className="audit-diff-indicator audit-diff-indicator-before">−</span>
                        Original
                      </div>
                      <div className="audit-diff-content">{firstChange.before || 'N/A'}</div>
                    </div>
                    <div className="audit-diff-arrow">↓</div>
                    <div className="audit-diff-row audit-diff-after">
                      <div className="audit-diff-label">
                        <span className="audit-diff-indicator audit-diff-indicator-after">+</span>
                        Suggested
                      </div>
                      <div className="audit-diff-content">{firstChange.after || 'N/A'}</div>
                    </div>
                  </>
                ) : (
                  <div className="audit-diff-empty">
                    <span className="audit-diff-empty-icon">📄</span>
                    <span>Suggested rewrite not available</span>
                  </div>
                )}
              </div>
            </section>

            {/* Overview - Grouped into Identity, Context, Outcome */}
            <section className="audit-section">
              <h3 className="audit-section-title">
                <span className="audit-section-icon">📋</span>
                Overview
              </h3>
              
              {/* Identity Group */}
              <div className="audit-group">
                <div className="audit-group-label">Identity</div>
                <div className="audit-group-grid">
                  <div className="audit-field">
                    <label>Audit ID</label>
                    <span className="audit-value audit-id">{audit.audit_id || 'N/A'}</span>
                  </div>
                  <div className="audit-field">
                    <label>Timestamp</label>
                    <span className="audit-value" title={full}>{date} {time}</span>
                  </div>
                </div>
              </div>

              {/* Context Group */}
              <div className="audit-group">
                <div className="audit-group-label">Context</div>
                <div className="audit-group-grid audit-group-grid-3">
                  <div className="audit-field">
                    <label>Tenant</label>
                    <span className="audit-value">{audit.tenant || 'N/A'}</span>
                  </div>
                  <div className="audit-field">
                    <label>Profile</label>
                    <span className="audit-value">{audit.profile || 'N/A'}</span>
                  </div>
                  <div className="audit-field">
                    <label>Route</label>
                    <span className="audit-value">{audit.route || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Outcome Group */}
              <div className="audit-group">
                <div className="audit-group-label">Outcome</div>
                <div className="audit-group-grid">
                  <div className="audit-field">
                    <label>Verdict</label>
                    <span 
                      className="audit-verdict-inline"
                      style={{ 
                        backgroundColor: `${getVerdictColor(audit.verdict?.verdict || 'allow')}20`,
                        color: getVerdictColor(audit.verdict?.verdict || 'allow'),
                        borderColor: `${getVerdictColor(audit.verdict?.verdict || 'allow')}40`
                      }}
                    >
                      {(audit.verdict?.verdict || 'allow').toUpperCase()}
                    </span>
                  </div>
                  <div className="audit-field">
                    <label>Total Latency</label>
                    <span className="audit-value">{audit.latency_ms || 0}ms</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Transform Pipeline - Enhanced with explanations */}
            <section className="audit-section">
              <h3 className="audit-section-title">
                <span className="audit-section-icon">⚙️</span>
                Transform Pipeline
              </h3>
              <div className="audit-transforms">
                {(audit.transforms || []).map((transform, index) => {
                  const maxDuration = Math.max(...(audit.transforms || []).map(t => t.duration_ms), 1);
                  const decisionColor = getDecisionColor(transform.decision);
                  return (
                    <div key={index} className="audit-transform">
                      <div className="audit-transform-header">
                        <span className="audit-transform-name">{transform.name}</span>
                        <div className="audit-transform-meta">
                          <span 
                            className="audit-transform-decision"
                            style={{ 
                              color: decisionColor,
                              backgroundColor: `${decisionColor}20`,
                              borderColor: `${decisionColor}40`
                            }}
                          >
                            {transform.decision}
                          </span>
                          <span className="audit-transform-duration">{transform.duration_ms}ms</span>
                        </div>
                      </div>
                      <div className="audit-transform-explanation" style={{ color: decisionColor }}>
                        {getDecisionExplanation(transform.decision)}
                      </div>
                      <div className="audit-transform-progress">
                        <div 
                          className="audit-transform-progress-bar"
                          style={{ 
                            width: `${(transform.duration_ms / maxDuration) * 100}%`,
                            backgroundColor: decisionColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!audit.transforms || audit.transforms.length === 0) && (
                  <div className="audit-empty-state">No transforms executed</div>
                )}
              </div>
            </section>

            {/* Tags */}
            {audit.tags && audit.tags.length > 0 && (
              <section className="audit-section">
                <h3 className="audit-section-title">
                  <span className="audit-section-icon">🏷️</span>
                  Tags
                </h3>
                <div className="audit-tags">
                  {audit.tags.map((tag, index) => (
                    <span key={index} className="audit-tag">
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Performance Summary */}
            <section className="audit-section">
              <h3 className="audit-section-title">
                <span className="audit-section-icon">📊</span>
                Performance
              </h3>
              <div className="audit-performance-grid">
                <div className="audit-perf-metric">
                  <div className="audit-perf-value">{audit.latency_ms || 0}ms</div>
                  <div className="audit-perf-label">Total Latency</div>
                </div>
                <div className="audit-perf-metric">
                  <div className="audit-perf-value">{totalTransformTime}ms</div>
                  <div className="audit-perf-label">Transform Time</div>
                </div>
                <div className="audit-perf-metric">
                  <div className="audit-perf-value">{audit.transforms?.length || 0}</div>
                  <div className="audit-perf-label">Transforms</div>
                </div>
                <div className="audit-perf-metric">
                  <div className="audit-perf-value">{audit.pack_version || 'N/A'}</div>
                  <div className="audit-perf-label">Pack Version</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AuditDetailsDrawer;
