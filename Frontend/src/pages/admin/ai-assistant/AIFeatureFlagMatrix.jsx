import { useState, useEffect } from 'react';
import { aiManagementApi } from '../../../services/aiManagement';
import { Plus, Trash2 } from 'lucide-react';

export default function AIFeatureFlagMatrix() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const FEATURES = [
    { id: 'ai_chat', name: 'AI Chat' },
    { id: 'ai_notes', name: 'AI Notes' },
    { id: 'ai_summaries', name: 'AI Summaries' },
    { id: 'ai_quiz_generator', name: 'AI Quiz Generator' },
    { id: 'ai_flashcards', name: 'AI Flashcards' },
    { id: 'ai_translation', name: 'AI Translation' },
    { id: 'ai_code_assistant', name: 'AI Code Assistant' },
  ];

  const loadFlags = async () => {
    try {
      setLoading(true);
      const res = await aiManagementApi.getFeatureFlags();
      setFlags(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const toggleFlag = async (flagId, currentStatus) => {
    try {
      await aiManagementApi.updateFeatureFlag(flagId, { is_enabled: !currentStatus });
      loadFlags();
    } catch (err) {
      console.error('Failed to toggle flag', err);
    }
  };

  const deleteFlag = async (id) => {
    if (window.confirm('Delete this flag? The feature will fall back to default enabled.')) {
      try {
        await aiManagementApi.deleteFeatureFlag(id);
        loadFlags();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const createGlobalDisable = async (featureId) => {
    try {
      await aiManagementApi.createFeatureFlag({
        feature: featureId,
        scope: 'platform',
        is_enabled: false
      });
      loadFlags();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading feature flags...</div>;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <h3>Feature Flag Configuration</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          By default, all features are enabled. Add flags here to disable specific features globally or for specific roles.
        </p>
      </div>

      <table className="gov-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Scope</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flags.map(f => (
            <tr key={f.id}>
              <td><strong>{f.feature_display}</strong></td>
              <td>
                <span className="gov-badge default">
                  {f.scope} {f.role ? `(${f.role})` : ''}
                </span>
              </td>
              <td>
                <button 
                  className={`gov-badge ${f.is_enabled ? 'active' : 'inactive'}`}
                  style={{ border: 'none', cursor: 'pointer' }}
                  onClick={() => toggleFlag(f.id, f.is_enabled)}
                >
                  {f.is_enabled ? 'Enabled' : 'Disabled'}
                </button>
              </td>
              <td>
                <button 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  onClick={() => deleteFlag(f.id)}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {flags.length === 0 && (
            <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No flags configured. All features are enabled by default.</td></tr>
          )}
        </tbody>
      </table>

      <h4 style={{ marginTop: '30px', marginBottom: '16px' }}>Quick Actions (Global Disable)</h4>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {FEATURES.map(feat => {
          const hasGlobalFlag = flags.some(f => f.feature === feat.id && f.scope === 'platform');
          if (hasGlobalFlag) return null;
          
          return (
            <button 
              key={feat.id} className="gov-btn" 
              style={{ border: '1px solid var(--border)' }}
              onClick={() => createGlobalDisable(feat.id)}
            >
              <Plus size={14} /> Disable {feat.name} Globally
            </button>
          );
        })}
      </div>
    </div>
  );
}
