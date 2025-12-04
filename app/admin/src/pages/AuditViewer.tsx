import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import type { AuditRecord } from '../types';
import EmptyState from '../components/EmptyState';

function AuditViewer() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAudit = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await api.getAudit(id);
        setAudit(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit record');
      } finally {
        setLoading(false);
      }
    };

    loadAudit();
  }, [id]);

  const downloadJSON = () => {
    if (!audit) return;
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${audit.audit_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMarkdown = () => {
    if (!audit) return;
    
    const md = `# Audit Report: ${audit.audit_id}

**Timestamp:** ${new Date(audit.ts).toLocaleString()}  
**Tenant:** ${audit.tenant}  
**Profile:** ${audit.profile}  
**Route:** ${audit.route}  
**Item:** ${audit.item_name || audit.item_id}  
**Verdict:** ${audit.verdict.verdict}  
**Latency:** ${audit.latency_ms}ms  
**Degraded Mode:** ${audit.degraded_mode ? 'Yes' : 'No'}

## Before Content
\`\`\`
${audit.before_content || 'N/A'}
\`\`\`

## After Content
\`\`\`
${audit.after_content || 'N/A'}
\`\`\`

## Changes
${audit.verdict.changes.map(c => `- **${c.field}**: \`${c.before}\` → \`${c.after}\``).join('\n')}

## Reasons
${audit.verdict.reasons.map(r => `- **${r.transform}**: ${r.why}${r.source ? ` ([source](${r.source}))` : ''}`).join('\n')}

## Transform Execution
${audit.transforms.map(t => `- **${t.name}**: ${t.decision} (${t.duration_ms}ms)`).join('\n')}

## Performance Metrics
- **Total Latency:** ${audit.latency_ms}ms
${audit.transforms.map(t => `- **${t.name}:** ${t.duration_ms}ms`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${audit.audit_id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading audit record...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>Audit Viewer</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          View detailed audit records and export data
        </p>
        <div className="card">
          <EmptyState
            icon="⚠️"
            title="No audits found"
            description={error}
            ctaLabel="Clear Filters"
            onCtaClick={() => window.location.href = '/'}
          />
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div>
        <h1>Audit Viewer</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          View detailed audit records and export data
        </p>
        <div className="card">
          <EmptyState
            icon="📋"
            title="No audits found"
            description="The requested audit record could not be found."
            ctaLabel="Return to Dashboard"
            onCtaClick={() => window.location.href = '/'}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex" style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-ghost">← Back to Dashboard</Link>
        <div className="right flex" style={{ gap: '0.5rem' }}>
          <button 
            onClick={downloadJSON} 
            className="btn btn-ghost"
            aria-label="Download audit as JSON"
          >
            Download JSONL
          </button>
          <button 
            onClick={downloadMarkdown} 
            className="btn btn-ghost"
            aria-label="Download audit as Markdown"
          >
            Download Markdown
          </button>
        </div>
      </div>

      <h1>Audit Details</h1>

      {/* Metadata */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="grid-2">
          <div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Audit ID:</span>
              <span>{audit.audit_id}</span>
            </div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Timestamp:</span>
              <span>{new Date(audit.ts).toLocaleString()}</span>
            </div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Tenant:</span>
              <span>{audit.tenant}</span>
            </div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Profile:</span>
              <span>{audit.profile}</span>
            </div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Route:</span>
              <span>{audit.route}</span>
            </div>
          </div>
          <div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Item:</span>
              <span>{audit.item_name || audit.item_id}</span>
            </div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Verdict:</span>
              <span 
                className={`cl-badge ${
                  audit.verdict.verdict === 'allow' ? 'badge-ok' :
                  audit.verdict.verdict === 'modify' ? 'badge-warn' :
                  'badge-danger'
                }`}
              >
                {audit.verdict.verdict}
              </span>
            </div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Latency:</span>
              <span>{audit.latency_ms}ms</span>
            </div>
            <div className="metric-row">
              <span style={{ color: '#C7D2FE' }}>Degraded Mode:</span>
              <span>{audit.degraded_mode ? 'Yes' : 'No'}</span>
            </div>
            {audit.degraded_services && audit.degraded_services.length > 0 && (
              <div className="metric-row">
                <span style={{ color: '#C7D2FE' }}>Degraded Services:</span>
                <span>{audit.degraded_services.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Before/After Content */}
      <h2>Content Comparison</h2>
      <div className="diff-view" style={{ marginBottom: '1.5rem' }}>
        <div className="diff-column">
          <h4>Before</h4>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: '0.9rem',
            margin: 0
          }}>
            {audit.before_content || 'N/A'}
          </pre>
        </div>
        <div className="diff-column">
          <h4>After</h4>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            fontSize: '0.9rem',
            margin: 0
          }}>
            {audit.after_content || 'N/A'}
          </pre>
        </div>
      </div>

      {/* Changes */}
      {audit.verdict.changes.length > 0 && (
        <>
          <h2>Changes</h2>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Before</th>
                  <th scope="col">After</th>
                </tr>
              </thead>
              <tbody>
                {audit.verdict.changes.map((change, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{change.field}</td>
                    <td>
                      <span className="diff-removed" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {change.before}
                      </span>
                    </td>
                    <td>
                      <span className="diff-added" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {change.after}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reasons */}
      <h2>Reasons</h2>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {audit.verdict.reasons.map((reason, idx) => (
          <div key={idx} className="metric-row">
            <div>
              <strong style={{ color: '#C7D2FE' }}>{reason.transform}</strong>
              <div style={{ marginTop: '0.25rem' }}>{reason.why}</div>
              {reason.source && (
                <a 
                  href={reason.source} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'inline-block' }}
                  aria-label={`View source for ${reason.transform}`}
                >
                  View source →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <h2>Performance Metrics</h2>
      <div className="card">
        <div className="metric-row" style={{ fontWeight: 600, borderBottom: '2px solid rgba(255,255,255,0.12)' }}>
          <span>Transform</span>
          <span>Duration</span>
        </div>
        {audit.transforms.map((transform, idx) => (
          <div key={idx} className="metric-row">
            <span>{transform.name}</span>
            <span>{transform.duration_ms}ms</span>
          </div>
        ))}
        <div className="metric-row" style={{ fontWeight: 600, borderTop: '2px solid rgba(255,255,255,0.12)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
          <span>Total Latency</span>
          <span>{audit.latency_ms}ms</span>
        </div>
      </div>
    </div>
  );
}

export default AuditViewer;