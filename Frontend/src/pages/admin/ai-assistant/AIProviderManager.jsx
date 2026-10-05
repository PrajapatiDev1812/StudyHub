import { useState, useEffect } from 'react';
import { aiManagementApi } from '../../../services/aiManagement';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export default function AIProviderManager() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: 'google',
    api_key: '',
    is_enabled: true,
    is_default: false,
    priority: 10
  });

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await aiManagementApi.getProviders();
      setProviders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await aiManagementApi.updateProvider(editingId, formData);
      } else {
        await aiManagementApi.createProvider(formData);
      }
      setIsModalOpen(false);
      loadProviders();
    } catch (err) {
      console.error(err);
      alert('Error saving provider');
    }
  };

  const openEdit = (provider) => {
    setFormData({
      name: provider.name,
      slug: provider.slug,
      api_key: '', // Don't show existing key
      is_enabled: provider.is_enabled,
      is_default: provider.is_default,
      priority: provider.priority
    });
    setEditingId(provider.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      try {
        await aiManagementApi.deleteProvider(id);
        loadProviders();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openNew = () => {
    setFormData({
      name: '', slug: 'google', api_key: '', 
      is_enabled: true, is_default: false, priority: 10
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading providers...</div>;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <h3>AI Providers</h3>
        <button className="gov-btn primary" onClick={openNew}>
          <Plus size={16} /> Add Provider
        </button>
      </div>

      <table className="gov-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>API Key</th>
            <th>Status</th>
            <th>Default</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map(p => (
            <tr key={p.id}>
              <td><strong>{p.name}</strong></td>
              <td>{p.slug}</td>
              <td style={{ fontFamily: 'monospace' }}>{p.masked_key}</td>
              <td>
                <span className={`gov-badge ${p.is_enabled ? 'active' : 'inactive'}`}>
                  {p.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </td>
              <td>
                {p.is_default && <span className="gov-badge default">Default</span>}
              </td>
              <td>{p.priority}</td>
              <td>
                <div className="gov-actions">
                  <button onClick={() => openEdit(p)}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
          {providers.length === 0 && (
            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No providers configured.</td></tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="gov-modal-overlay">
          <div className="gov-modal">
            <h2>{editingId ? 'Edit Provider' : 'Add Provider'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="gov-form-group">
                <label>Provider Name (e.g. Gemini Pro)</label>
                <input 
                  type="text" required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="gov-form-group">
                <label>Provider Type</label>
                <select 
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  disabled={!!editingId} // Don't allow changing type after creation
                >
                  <option value="google">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="local_llm">Local LLM</option>
                </select>
              </div>
              <div className="gov-form-group">
                <label>API Key {editingId && '(leave blank to keep current)'}</label>
                <input 
                  type="password" 
                  required={!editingId}
                  value={formData.api_key}
                  onChange={e => setFormData({...formData, api_key: e.target.value})}
                />
              </div>
              
              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Priority (lower = higher priority)</label>
                  <input 
                    type="number" min="1"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                  />
                </div>
              </div>

              <div className="gov-form-row">
                <div className="gov-form-group" style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_enabled}
                    onChange={e => setFormData({...formData, is_enabled: e.target.checked})}
                  />
                  <label style={{ margin: 0 }}>Enabled</label>
                </div>
                <div className="gov-form-group" style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_default}
                    onChange={e => setFormData({...formData, is_default: e.target.checked})}
                  />
                  <label style={{ margin: 0 }}>Set as Default Provider</label>
                </div>
              </div>

              <div className="gov-modal-actions">
                <button type="button" className="gov-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="gov-btn primary">Save Provider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
