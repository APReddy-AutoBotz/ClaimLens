import { useEffect, useState } from 'react';
import { api } from '../api';
import type { AuditRecord } from '../types';

interface ReceiptsDrawerProps {
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
}

function ReceiptsDrawer({ auditId, isOpen, onClose }: ReceiptsDrawerProps) {
  const [audit, setAudit] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !auditId) return;

    const loadAudit = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAudit(auditId);
        setAudit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit details');
      } finally {
        setLoading(false);
      }
    };

    loadAudit();
  }, [auditId, isOpen]);

  if (!isOpen) return null;

  const formatDuration = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getDecisionBadgeClass = (decision: string): string => {
    switch (decision) {
      case 'pass': return 'badge-ok';
      case 'modify': return 'badge-warn';
      case 'flag': return 'badge-danger';
      default: return '';
    }
  };

  return (
    <div 
      className="drawer-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div 
        className="drawer" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h3 id="drawer-title">Audit Trail</h3>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close drawer"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>
        
        <div className="drawer-content">
          {loading && (
            <div className="empty-state">
              <p>Consulting the ledger...</p>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {audit && !loading && (
            <div className="receipts-container">
              {/* Audit Overview */}
              <section className="receipt-section">
                <h4 className="receipt-section-title">Overview</h4>
                <div className="receipt-details">
                  <div className="receipt-row">
                    <span className="receipt-label">Audit ID:</span>
                    <code className="receipt-value">{audit.audit_id}</code>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Timestamp:</span>
                    <span className="receipt-value">{new Date(audit.ts).toLocaleString()}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Tenant:</span>
                    <span className="receipt-value">{audit.tenant}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Profile:</span>
                    <span className="receipt-value">{audit.profile}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Route:</span>
                    <code className="receipt-value route-code">{audit.route}</code>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Item:</span>
                    <span className="receipt-value">{audit.item_name || audit.item_id}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Total Latency:</span>
                    <span className="receipt-value">{formatDuration(audit.latency_ms)}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="receipt-label">Verdict:</span>
                    <span className={`cl-badge ${
                      audit.verdict.verdict === 'allow' ? 'badge-ok' :
                      audit.verdict.verdict === 'modify' ? 'badge-warn' :
                      'badge-danger'
                    }`}>
                      {audit.verdict.verdict}
                    </span>
                  </div>
                  {audit.degraded_mode && (
                    <div className="receipt-row">
                      <span className="receipt-label">Mode:</span>
                      <span className="degraded-badge">
                        ⚠️ Degraded Mode
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Transform Execution Details */}
              <section className="receipt-section">
                <h4 className="receipt-section-title">Transform Execution</h4>
                <div className="transform-list">
                  {audit.transforms.map((transform, index) => (
                    <div key={index} className="transform-item">
                      <div className="transform-header">
                        <span className="transform-name">{transform.name}</span>
                        <div className="transform-meta">
                          <span className={`cl-badge ${getDecisionBadgeClass(transform.decision)}`}>
                            {transform.decision}
                          </span>
                          <span className="transform-duration">
                            {formatDuration(transform.duration_ms)}
                          </span>
                        </div>
                      </div>
                      {transform.metadata && Object.keys(transform.metadata).length > 0 && (
                        <div className="transform-metadata">
                          {Object.entries(transform.metadata).map(([key, value]) => (
                            <div key={key} className="metadata-row">
                              <span className="metadata-key">{key}:</span>
                              <span className="metadata-value">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value, null, 2)
                                  : String(value)
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Verdict Reasons */}
              {audit.verdict.reasons && audit.verdict.reasons.length > 0 && (
                <section className="receipt-section">
                  <h4 className="receipt-section-title">Verdict Reasons</h4>
                  <div className="reasons-list">
                    {audit.verdict.reasons.map((reason, index) => (
                      <div key={index} className="reason-item">
                        <div className="reason-transform">
                          <strong>{reason.transform}</strong>
                        </div>
                        <div className="reason-why">
                          {reason.why}
                          {reason.source && (
                            <a 
                              href={reason.source} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="reason-source"
                              aria-label={`Source link for ${reason.transform}`}
                            >
                              🔗 Source
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Content Changes */}
              {audit.verdict.changes && audit.verdict.changes.length > 0 && (
                <section className="receipt-section">
                  <h4 className="receipt-section-title">Content Changes</h4>
                  <div className="changes-list">
                    {audit.verdict.changes.map((change, index) => (
                      <div key={index} className="change-item">
                        <div className="change-field">
                          <strong>Field:</strong> {change.field}
                        </div>
                        <div className="change-diff">
                          <div className="change-before">
                            <div className="change-label">Before:</div>
                            <pre className="change-content">{change.before}</pre>
                          </div>
                          <div className="change-after">
                            <div className="change-label">After:</div>
                            <pre className="change-content">{change.after}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Before/After Content (if available) */}
              {(audit.before_content || audit.after_content) && (
                <section className="receipt-section">
                  <h4 className="receipt-section-title">Full Content</h4>
                  <div className="content-comparison">
                    {audit.before_content && (
                      <div className="content-panel">
                        <div className="content-panel-header">Before</div>
                        <pre className="content-panel-body">{audit.before_content}</pre>
                      </div>
                    )}
                    {audit.after_content && (
                      <div className="content-panel">
                        <div className="content-panel-header">After</div>
                        <pre className="content-panel-body">{audit.after_content}</pre>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Correlation ID */}
              <section className="receipt-section">
                <div className="receipt-row">
                  <span className="receipt-label">Correlation ID:</span>
                  <code className="receipt-value">{audit.verdict.correlation_id}</code>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptsDrawer;
