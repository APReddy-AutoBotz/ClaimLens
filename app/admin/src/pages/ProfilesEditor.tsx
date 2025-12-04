import { useEffect, useState } from 'react';
import { api } from '../api';
import PolicyChangeModal from '../components/PolicyChangeModal';
import type { Profile, Route, AugmentLiteFields, RiskProfile } from '../types';
import EmptyState from '../components/EmptyState';

const RISK_PROFILES: Record<string, RiskProfile> = {
  reorder_transforms: {
    action: 'Reorder transforms in pipeline',
    riskLevel: 'high',
    maxAutonomy: 2,
    requiresApproval: true
  },
  change_threshold: {
    action: 'Modify nutrition thresholds',
    riskLevel: 'medium',
    maxAutonomy: 3,
    requiresApproval: false
  },
  add_transform: {
    action: 'Add new transform to pipeline',
    riskLevel: 'high',
    maxAutonomy: 2,
    requiresApproval: true
  }
};

function ProfilesEditor() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<{ profileName: string; route: Route } | null>(null);
  const [showAugmentLite, setShowAugmentLite] = useState(false);
  const [currentRiskProfile, setCurrentRiskProfile] = useState<RiskProfile | null>(null);
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  const [draggedTransform, setDraggedTransform] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [originalRoute, setOriginalRoute] = useState<Route | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await api.getProfiles();
      // Ensure data is an array
      setProfiles(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoute = (profileName: string, route: Route) => {
    setEditingRoute({ profileName, route: { ...route } });
    setOriginalRoute({ ...route });
    setShowDiff(false);
  };

  const handleThresholdChange = (key: string, value: string) => {
    if (!editingRoute) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setEditingRoute({
      ...editingRoute,
      route: {
        ...editingRoute.route,
        thresholds: {
          ...editingRoute.route.thresholds,
          [key]: numValue
        }
      }
    });
  };

  const handleDragStart = (transform: string) => {
    setDraggedTransform(transform);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetTransform: string) => {
    if (!editingRoute || !draggedTransform) return;

    const transforms = [...editingRoute.route.transforms];
    const draggedIndex = transforms.indexOf(draggedTransform);
    const targetIndex = transforms.indexOf(targetTransform);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder
    transforms.splice(draggedIndex, 1);
    transforms.splice(targetIndex, 0, draggedTransform);

    setEditingRoute({
      ...editingRoute,
      route: {
        ...editingRoute.route,
        transforms
      }
    });

    setDraggedTransform(null);
  };

  const checkRiskLevel = (): RiskProfile | null => {
    if (!editingRoute || !originalRoute) return null;

    // Check if transforms were reordered
    const transformsChanged = JSON.stringify(editingRoute.route.transforms) !== 
                             JSON.stringify(originalRoute.transforms);
    if (transformsChanged) {
      return RISK_PROFILES.reorder_transforms;
    }

    // Check if critical thresholds changed
    const thresholdsChanged = JSON.stringify(editingRoute.route.thresholds) !== 
                             JSON.stringify(originalRoute.thresholds);
    if (thresholdsChanged) {
      return RISK_PROFILES.change_threshold;
    }

    return null;
  };

  const handleSaveClick = () => {
    const riskProfile = checkRiskLevel();
    
    if (riskProfile) {
      setCurrentRiskProfile(riskProfile);
      setPendingChanges(editingRoute);
      setShowAugmentLite(true);
    } else {
      // No risk, save directly
      saveChanges({
        context: 'Minor configuration update',
        constraints: 'No critical changes',
        selfCritique: 'Low risk change',
        confirm: true
      }, 0);
    }
  };

  const saveChanges = async (augmentLite: AugmentLiteFields, autonomy: number) => {
    if (!editingRoute) return;

    try {
      await api.updateProfile(editingRoute.profileName, {
        routes: profiles
          .find(p => p.name === editingRoute.profileName)
          ?.routes.map(r => r.path === editingRoute.route.path ? editingRoute.route : r) || []
      }, augmentLite);

      await loadProfiles();
      setEditingRoute(null);
      setOriginalRoute(null);
      setShowDiff(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const toggleDiff = () => {
    setShowDiff(!showDiff);
  };

  if (loading) {
    return (
      <div>
        <h1>Profiles & Routes</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          Configure policy profiles and route-specific transforms
        </p>
        <div className="card mt-4">
          <EmptyState
            icon="⏳"
            title="Loading profiles..."
            description="Fetching policy profiles and route configurations"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Profiles & Routes</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          Configure policy profiles and route-specific transforms
        </p>
        <div className="card mt-4">
          <EmptyState
            icon="⚠️"
            title="No profiles configured"
            description={error}
            ctaLabel="Add Profile"
            onCtaClick={loadProfiles}
          />
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div>
        <h1>Profiles & Routes</h1>
        <p style={{ color: '#C7D2FE', marginBottom: '1.5rem' }}>
          Configure policy profiles and route-specific transforms
        </p>
        <div className="card mt-4">
          <EmptyState
            icon="📋"
            title="No profiles configured"
            description="Create your first policy profile to get started"
            ctaLabel="Add Profile"
            onCtaClick={loadProfiles}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Profiles & Routes</h1>

      {profiles.map(profile => (
        <div key={profile.name} className="card mt-4">
          <div 
            className="flex" 
            style={{ cursor: 'pointer' }}
            onClick={() => setExpandedProfile(expandedProfile === profile.name ? null : profile.name)}
            role="button"
            tabIndex={0}
            aria-expanded={expandedProfile === profile.name}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpandedProfile(expandedProfile === profile.name ? null : profile.name);
              }
            }}
          >
            <h3 style={{ margin: 0 }}>{profile.name}</h3>
            <span className="right">{expandedProfile === profile.name ? '▼' : '▶'}</span>
          </div>

          {expandedProfile === profile.name && (
            <div className="mt-3">
              {profile.routes.map(route => (
                <div key={route.path} className="section mt-2">
                  <div className="flex">
                    <h4 style={{ margin: 0 }}>{route.path}</h4>
                    <button
                      className="btn btn-ghost right"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      onClick={() => handleEditRoute(profile.name, route)}
                      aria-label={`Edit route ${route.path}`}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-2">
                    <strong>Transforms:</strong> {route.transforms.join(' → ')}
                  </div>
                  <div className="mt-1">
                    <strong>Latency Budget:</strong> {route.latency_budget_ms}ms
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Edit Modal */}
      {editingRoute && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className="modal">
            <h2 id="edit-modal-title">Edit Route: {editingRoute.route.path}</h2>

            <div className="form-group">
              <label>Transform Order (drag to reorder)</label>
              <div>
                {editingRoute.route.transforms.map(transform => (
                  <div
                    key={transform}
                    className={`draggable-item ${draggedTransform === transform ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(transform)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(transform)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Transform ${transform}, draggable`}
                  >
                    {transform}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Thresholds</label>
              {Object.entries(editingRoute.route.thresholds).map(([key, value]) => (
                <div key={key} className="flex mt-2">
                  <label style={{ flex: 1 }}>{key}:</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleThresholdChange(key, e.target.value)}
                    style={{ width: '100px' }}
                    aria-label={`Threshold for ${key}`}
                  />
                </div>
              ))}
            </div>

            {showDiff && originalRoute && (
              <div className="diff-view">
                <div className="diff-column">
                  <h4>Before</h4>
                  <pre style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(originalRoute, null, 2)}
                  </pre>
                </div>
                <div className="diff-column">
                  <h4>After</h4>
                  <pre style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(editingRoute.route, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex" style={{ justifyContent: 'space-between', marginTop: '2rem' }}>
              <button 
                className="btn btn-ghost" 
                onClick={toggleDiff}
                type="button"
              >
                {showDiff ? 'Hide' : 'Show'} Diff
              </button>
              <div className="flex">
                <button 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setEditingRoute(null);
                    setOriginalRoute(null);
                    setShowDiff(false);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveClick}
                  type="button"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Augment-Lite Modal */}
      {showAugmentLite && currentRiskProfile && (
        <PolicyChangeModal
          isOpen={showAugmentLite}
          onClose={() => {
            setShowAugmentLite(false);
            setCurrentRiskProfile(null);
            setPendingChanges(null);
          }}
          onSubmit={async (request) => {
            await saveChanges({
              context: request.context,
              constraints: request.constraints,
              selfCritique: request.self_critique,
              confirm: true
            }, 0);
            setShowAugmentLite(false);
            setCurrentRiskProfile(null);
            setPendingChanges(null);
          }}
          operator="admin"
        />
      )}
    </div>
  );
}

export default ProfilesEditor;
