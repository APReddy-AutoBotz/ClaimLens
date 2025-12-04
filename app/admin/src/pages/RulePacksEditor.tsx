import { useEffect, useState } from 'react';
import { api } from '../api';
import PolicyChangeModal from '../components/PolicyChangeModal';
import type { RulePack, AugmentLiteFields, RiskProfile } from '../types';
import EmptyState from '../components/EmptyState';

const RULE_PACK_RISK_PROFILE: RiskProfile = {
  action: 'Edit rule pack content',
  riskLevel: 'medium',
  maxAutonomy: 3,
  requiresApproval: false
};

function RulePacksEditor() {
  const [rulePacks, setRulePacks] = useState<RulePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<RulePack | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showAugmentLite, setShowAugmentLite] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [versions, setVersions] = useState<RulePack[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadRulePacks();
  }, []);

  const loadRulePacks = async () => {
    try {
      setLoading(true);
      const data = await api.getRulePacks();
      // Ensure data is an array
      setRulePacks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rule packs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (pack: RulePack) => {
    setEditingPack(pack);
    setEditedContent(pack.content);
    setShowDiff(false);
    setTestResults(null);

    // Load version history
    try {
      const versionData = await api.getRulePackVersions(pack.name);
      setVersions(versionData);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  };

  const handleTestAgainstFixtures = async () => {
    if (!editingPack) return;

    setTesting(true);
    try {
      // Create temporary pack with edited content
      const tempPack = { ...editingPack, content: editedContent };
      
      // Run fixtures with this pack
      // Note: This would need backend support to test with modified pack
      const results = await api.runFixtures(['edge-cases.json']);
      setTestResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test fixtures');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveClick = () => {
    if (!editingPack) return;

    // Check if content changed
    if (editedContent === editingPack.content) {
      setEditingPack(null);
      return;
    }

    setShowAugmentLite(true);
  };

  const saveChanges = async (augmentLite: AugmentLiteFields, autonomy: number) => {
    if (!editingPack) return;

    try {
      await api.updateRulePack(editingPack.name, editedContent, augmentLite);
      await loadRulePacks();
      setEditingPack(null);
      setEditedContent('');
      setShowDiff(false);
      setTestResults(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule pack');
    }
  };

  const toggleDiff = () => {
    setShowDiff(!showDiff);
  };

  const generateDiff = () => {
    if (!editingPack) return { added: [], removed: [], unchanged: [] };

    const originalLines = editingPack.content.split('\n');
    const editedLines = editedContent.split('\n');

    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];

    // Simple line-by-line diff
    const maxLines = Math.max(originalLines.length, editedLines.length);
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i];
      const editLine = editedLines[i];

      if (origLine === editLine) {
        unchanged.push(origLine || '');
      } else {
        if (origLine && !editedLines.includes(origLine)) {
          removed.push(origLine);
        }
        if (editLine && !originalLines.includes(editLine)) {
          added.push(editLine);
        }
      }
    }

    return { added, removed, unchanged };
  };

  if (loading) {
    return (
      <div>
        <h1>Rule Packs</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          Manage policy rule packs and version history
        </p>
        <div className="card mt-4">
          <EmptyState
            icon="⏳"
            title="Loading rule packs..."
            description="Fetching policy rule packs and version history"
          />
        </div>
      </div>
    );
  }

  if (error && !editingPack) {
    return (
      <div>
        <h1>Rule Packs</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          Manage policy rule packs and version history
        </p>
        <div className="card mt-4">
          <EmptyState
            icon="⚠️"
            title="No rule packs loaded"
            description={error}
            ctaLabel="Load Defaults"
            onCtaClick={loadRulePacks}
          />
        </div>
      </div>
    );
  }

  if (rulePacks.length === 0 && !editingPack) {
    return (
      <div>
        <h1>Rule Packs</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          Manage policy rule packs and version history
        </p>
        <div className="card mt-4">
          <EmptyState
            icon="📦"
            title="No rule packs loaded"
            description="Load default rule packs to get started"
            ctaLabel="Load Defaults"
            onCtaClick={loadRulePacks}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Rule Packs</h1>

      <div className="mt-4">
        {rulePacks.map(pack => (
          <div key={pack.name} className="card mt-3">
            <div className="flex">
              <div>
                <h3 style={{ margin: 0 }}>{pack.name}</h3>
                <div style={{ color: '#C7D2FE', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Version {pack.version} • Updated {new Date(pack.updated_at).toLocaleString()} by {pack.updated_by}
                </div>
              </div>
              <button
                className="btn btn-ghost right"
                onClick={() => handleEdit(pack)}
                aria-label={`Edit ${pack.name}`}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPack && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-pack-title">
          <div className="modal" style={{ maxWidth: '900px' }}>
            <h2 id="edit-pack-title">Edit Rule Pack: {editingPack.name}</h2>
            <div style={{ color: '#C7D2FE', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Current Version: {editingPack.version}
            </div>

            <div className="form-group">
              <label htmlFor="pack-content">Content</label>
              <textarea
                id="pack-content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                aria-label="Rule pack content"
              />
            </div>

            {showDiff && (
              <div className="diff-view">
                <div className="diff-column">
                  <h4>Removed Lines</h4>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {generateDiff().removed.map((line, i) => (
                      <div key={i} className="diff-removed" style={{ padding: '0.25rem' }}>
                        - {line}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="diff-column">
                  <h4>Added Lines</h4>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {generateDiff().added.map((line, i) => (
                      <div key={i} className="diff-added" style={{ padding: '0.25rem' }}>
                        + {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {testResults && (
              <div className="mt-3">
                <h4>Test Results</h4>
                <div className="card">
                  {testResults.map((result: any, i: number) => (
                    <div key={i} className="metric-row">
                      <span>{result.fixture}</span>
                      <span>
                        Flags: {result.flags} | Warnings: {result.warnings} | Errors: {result.errors}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {versions.length > 1 && (
              <div className="mt-3">
                <h4>Version History</h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {versions.map(v => (
                    <div key={v.version} className="metric-row">
                      <span>v{v.version}</span>
                      <span style={{ fontSize: '0.85rem', color: '#C7D2FE' }}>
                        {new Date(v.updated_at).toLocaleString()} by {v.updated_by}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex" style={{ justifyContent: 'space-between', marginTop: '2rem' }}>
              <div className="flex">
                <button 
                  className="btn btn-ghost" 
                  onClick={toggleDiff}
                  type="button"
                >
                  {showDiff ? 'Hide' : 'Show'} Diff
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleTestAgainstFixtures}
                  disabled={testing}
                  type="button"
                >
                  {testing ? 'Testing...' : 'Test Against Fixtures'}
                </button>
              </div>
              <div className="flex">
                <button 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setEditingPack(null);
                    setEditedContent('');
                    setShowDiff(false);
                    setTestResults(null);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveClick}
                  disabled={testResults && testResults.some((r: any) => r.errors > 0)}
                  type="button"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {testResults && testResults.some((r: any) => r.errors > 0) && (
              <div style={{ color: 'var(--cl-danger)', marginTop: '1rem', fontSize: '0.85rem' }}>
                Cannot save: Test failures detected. Please fix errors before saving.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Augment-Lite Modal */}
      {showAugmentLite && (
        <PolicyChangeModal
          isOpen={showAugmentLite}
          onClose={() => setShowAugmentLite(false)}
          onSubmit={async (request) => {
            await saveChanges({
              context: request.context,
              constraints: request.constraints,
              selfCritique: request.self_critique,
              confirm: true
            }, 0);
            setShowAugmentLite(false);
          }}
          operator="admin"
        />
      )}
    </div>
  );
}

export default RulePacksEditor;
