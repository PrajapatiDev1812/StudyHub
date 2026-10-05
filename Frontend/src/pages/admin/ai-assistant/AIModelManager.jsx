import { useState, useEffect } from 'react';
import { aiManagementApi } from '../../../services/aiManagement';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AIModelManager() {
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    provider: '',
    name: '',
    display_name: '',
    input_token_limit: 128000,
    output_token_limit: 8192,
    context_window: 128000,
    cost_per_input_token: 0,
    cost_per_output_token: 0,
    status: 'active',
    is_default: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [modRes, provRes] = await Promise.all([
        aiManagementApi.getModels(),
        aiManagementApi.getProviders()
      ]);
      setModels(modRes.data);
      setProviders(provRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await aiManagementApi.updateModel(editingId, formData);
      } else {
        await aiManagementApi.createModel(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Error saving model');
    }
  };

  const openEdit = (model) => {
    setFormData({
      provider: model.provider,
      name: model.name,
      display_name: model.display_name,
      input_token_limit: model.input_token_limit,
      output_token_limit: model.output_token_limit,
      context_window: model.context_window,
      cost_per_input_token: model.cost_per_input_token,
      cost_per_output_token: model.cost_per_output_token,
      status: model.status,
      is_default: model.is_default
    });
    setEditingId(model.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await aiManagementApi.deleteModel(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openNew = () => {
    setFormData({
      provider: providers.length > 0 ? providers[0].id : '',
      name: '', display_name: '', 
      input_token_limit: 128000, output_token_limit: 8192, context_window: 128000,
      cost_per_input_token: 0, cost_per_output_token: 0,
      status: 'active', is_default: false
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading models...</div>;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <h3>AI Models</h3>
        <button className="gov-btn primary" onClick={openNew}>
          <Plus size={16} /> Add Model
        </button>
      </div>

      <table className="gov-table">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Display Name</th>
            <th>Model ID</th>
            <th>Context Window</th>
            <th>Status</th>
            <th>Default</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {models.map(m => (
            <tr key={m.id}>
              <td>{m.provider_name}</td>
              <td><strong>{m.display_name}</strong></td>
              <td style={{ fontFamily: 'monospace' }}>{m.name}</td>
              <td>{(m.context_window / 1000).toFixed(0)}k</td>
              <td>
                <span className={`gov-badge ${m.status === 'active' ? 'active' : 'inactive'}`}>
                  {m.status}
                </span>
              </td>
              <td>
                {m.is_default && <span className="gov-badge default">Default</span>}
              </td>
              <td>
                <div className="gov-actions">
                  <button onClick={() => openEdit(m)}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(m.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
          {models.length === 0 && (
            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No models configured.</td></tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="gov-modal-overlay">
          <div className="gov-modal">
            <h2>{editingId ? 'Edit Model' : 'Add Model'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="gov-form-group">
                <label>Provider</label>
                <select 
                  required
                  value={formData.provider}
                  onChange={e => setFormData({...formData, provider: e.target.value})}
                >
                  <option value="">Select Provider...</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Display Name (e.g. Gemini 1.5 Pro)</label>
                  <input 
                    type="text" required 
                    value={formData.display_name}
                    onChange={e => setFormData({...formData, display_name: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Model ID (e.g. gemini-1.5-pro)</label>
                  <input 
                    type="text" required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Input Limit</label>
                  <input 
                    type="number" required 
                    value={formData.input_token_limit}
                    onChange={e => setFormData({...formData, input_token_limit: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Output Limit</label>
                  <input 
                    type="number" required 
                    value={formData.output_token_limit}
                    onChange={e => setFormData({...formData, output_token_limit: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Context Window</label>
                  <input 
                    type="number" required 
                    value={formData.context_window}
                    onChange={e => setFormData({...formData, context_window: e.target.value})}
                  />
                </div>
              </div>

              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="testing">Testing</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="gov-form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_default}
                    onChange={e => setFormData({...formData, is_default: e.target.checked})}
                  />
                  <label style={{ margin: 0 }}>Set as Provider Default</label>
                </div>
              </div>

              <div className="gov-modal-actions">
                <button type="button" className="gov-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="gov-btn primary">Save Model</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
