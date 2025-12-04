import { useEffect, useState } from 'react';
import { api } from '../api';
import type { AuditRecord } from '../types';

interface PreviewRewriteModalProps {
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
}

function PreviewRewriteModal({ auditId, isOpen, onClose }: PreviewRewriteModalProps) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const highlightDifferences = (before: string, after: string) => {
    const beforeWords = before.split(/(\s+)/);
    const afterWords = after.split(/(\s+)/);
    
    const beforeHighlighted = (
      <>
        {beforeWords.map((word, i) => {
          const isRemoved = !afterWords.includes(word) && word.trim().length > 0;
          return (
            <span key={i} className={isRemoved ? 'diff-removed-text' : ''}>
              {word}
            </span>
          );
        })}
      </>
    );

    const afterHighlighted = (
      <>
        {afterWords.map((word, i) => {
          const isAdded = !beforeWords.includes(word) && word.trim().length > 0;
          return (
            <span key={i} className={isAdded ? 'diff-added-text' : ''}>
              {word}
            </span>
          );
        })}
      </>
    );

    return { beforeHighlighted, afterHighlighted };
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="preview-rewrite-modal">
        <div className="modal-header">
          <h3 id="preview-modal-title">Preview Rewrite</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close modal"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
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
            <>
              <div className="preview-overview">
                <div className="preview-meta">
                  <div className="preview-meta-item">
                    <span className="preview-meta-label">Item:</span>
                    <span className="preview-meta-value">{audit.item_name || audit.item_id}</span>
                  </div>
                  <div className="preview-meta-item">
                    <span className="preview-meta-label">Verdict:</span>
                    <span className={`cl-badge ${
                      audit.verdict.verdict === 'allow' ? 'badge-ok' :
                      audit.verdict.verdict === 'modify' ? 'badge-warn' :
                      'badge-danger'
                    }`}>
                      {audit.verdict.verdict}
                    </span>
                  </div>
                  <div className="preview-meta-item">
                    <span className="preview-meta-label">Profile:</span>
                    <span className="preview-meta-value">{audit.profile}</span>
                  </div>
                </div>
              </div>

              {audit.verdict.changes && audit.verdict.changes.length > 0 ? (
                <div className="preview-changes">
                  <h4 className="preview-section-title">Content Changes</h4>
                  {audit.verdict.changes.map((change, index) => {
                    const { beforeHighlighted, afterHighlighted } = highlightDifferences(
                      change.before,
                      change.after
                    );

                    return (
                      <div key={index} className="preview-change-item">
                        <div className="preview-field-name">
                          <strong>Field:</strong> {change.field}
                        </div>
                        <div className="preview-comparison">
                          <div className="preview-column preview-before">
                            <div className="preview-column-header">
                              <span className="preview-column-icon">📝</span>
                              <span className="preview-column-title">Original</span>
                            </div>
                            <div className="preview-content">
                              {beforeHighlighted}
                            </div>
                          </div>
                          <div className="preview-divider">
                            <span className="preview-arrow">→</span>
                          </div>
                          <div className="preview-column preview-after">
                            <div className="preview-column-header">
                              <span className="preview-column-icon">✨</span>
                              <span className="preview-column-title">Modified</span>
                            </div>
                            <div className="preview-content">
                              {afterHighlighted}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No content changes detected</p>
                  <p className="empty-state-hint">
                    This audit did not result in any modifications to the content.
                  </p>
                </div>
              )}

              {audit.verdict.reasons && audit.verdict.reasons.length > 0 && (
                <div className="preview-reasons">
                  <h4 className="preview-section-title">Why These Changes?</h4>
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
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewRewriteModal;
