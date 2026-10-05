import { useState, useEffect } from 'react';
import { aiManagementApi } from '../../../services/aiManagement';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AIQuotaManager() {
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'student',
    max_requests: 50,
    max_tokens: 250000,
    time_window_hours: 24,
    window_type: 'rolling',
    burst_limit: 5,
    burst_window_seconds: 60,
    concurrent_requests: 2,
    warning_threshold_pct: 80,
    grace_requests: 0,
    auto_block: true,
    is_active: true,
    priority: 10
  });

  const loadQuotas = async () => {
    try {
      setLoading(true);
      const res = await aiManagementApi.getQuotas();
      setQuotas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (submitData.max_requests === '') submitData.max_requests = null;
      if (submitData.max_tokens === '') submitData.max_tokens = null;
      
      if (editingId) {
        await aiManagementApi.updateQuota(editingId, submitData);
      } else {
        await aiManagementApi.createQuota(submitData);
      }
      setIsModalOpen(false);
      loadQuotas();
    } catch (err) {
      console.error(err);
      alert('Error saving quota policy');
    }
  };

  const openEdit = (quota) => {
    setFormData({
      name: quota.name,
      role: quota.role,
      max_requests: quota.max_requests === null ? '' : quota.max_requests,
      max_tokens: quota.max_tokens === null ? '' : quota.max_tokens,
      time_window_hours: quota.time_window_hours,
      window_type: quota.window_type,
      burst_limit: quota.burst_limit,
      burst_window_seconds: quota.burst_window_seconds,
      concurrent_requests: quota.concurrent_requests,
      warning_threshold_pct: quota.warning_threshold_pct,
      grace_requests: quota.grace_requests,
      auto_block: quota.auto_block,
      is_active: quota.is_active,
      priority: quota.priority
    });
    setEditingId(quota.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this policy? Users will fall back to platform defaults.')) {
      try {
        await aiManagementApi.deleteQuota(id);
        loadQuotas();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openNew = () => {
    setFormData({
      name: '', role: 'student', max_requests: 50, max_tokens: 250000,
      time_window_hours: 24, window_type: 'rolling', burst_limit: 5,
      burst_window_seconds: 60, concurrent_requests: 2, warning_threshold_pct: 80,
      grace_requests: 0, auto_block: true, is_active: true, priority: 10
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading quotas...</div>;

  return (
    <div className="gov-panel">
      <div className="gov-panel-header">
        <h3>AI Quota Policies</h3>
        <button className="gov-btn primary" onClick={openNew}>
          <Plus size={16} /> Add Policy
        </button>
      </div>

      <table className="gov-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role Target</th>
            <th>Req / Tokens</th>
            <th>Window</th>
            <th>Burst</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotas.map(q => (
            <tr key={q.id}>
              <td><strong>{q.name}</strong></td>
              <td><span className="gov-badge default">{q.role}</span></td>
              <td>
                {q.is_unlimited ? 'Unlimited' : 
                 `${q.max_requests || '∞'} / ${(q.max_tokens/1000).toFixed(0) || '∞'}k`}
              </td>
              <td>{q.time_window_hours}h ({q.window_type})</td>
              <td>{q.burst_limit} / {q.burst_window_seconds}s</td>
              <td>
                <span className={`gov-badge ${q.is_active ? 'active' : 'inactive'}`}>
                  {q.is_active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td>
                <div className="gov-actions">
                  <button onClick={() => openEdit(q)}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(q.id)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
          {quotas.length === 0 && (
            <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No quotas configured. Falling back to platform defaults.</td></tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="gov-modal-overlay">
          <div className="gov-modal" style={{ maxWidth: '600px' }}>
            <h2>{editingId ? 'Edit Quota Policy' : 'Add Quota Policy'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Policy Name</label>
                  <input 
                    type="text" required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Target Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin (Super Admin)</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: '10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>Limits</h4>
              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Max Requests (blank = unlimited)</label>
                  <input 
                    type="number" 
                    value={formData.max_requests}
                    onChange={e => setFormData({...formData, max_requests: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Max Tokens (blank = unlimited)</label>
                  <input 
                    type="number" 
                    value={formData.max_tokens}
                    onChange={e => setFormData({...formData, max_tokens: e.target.value})}
                  />
                </div>
              </div>

              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Time Window (hours)</label>
                  <input 
                    type="number" required min="1"
                    value={formData.time_window_hours}
                    onChange={e => setFormData({...formData, time_window_hours: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Window Type</label>
                  <select 
                    value={formData.window_type}
                    onChange={e => setFormData({...formData, window_type: e.target.value})}
                  >
                    <option value="rolling">Rolling Window</option>
                    <option value="fixed">Fixed (Calendar Day)</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: '10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '5px' }}>Protection</h4>
              <div className="gov-form-row">
                <div className="gov-form-group">
                  <label>Burst Limit (reqs)</label>
                  <input 
                    type="number" required min="1"
                    value={formData.burst_limit}
                    onChange={e => setFormData({...formData, burst_limit: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Burst Window (sec)</label>
                  <input 
                    type="number" required min="1"
                    value={formData.burst_window_seconds}
                    onChange={e => setFormData({...formData, burst_window_seconds: e.target.value})}
                  />
                </div>
                <div className="gov-form-group">
                  <label>Max Concurrent</label>
                  <input 
                    type="number" required min="1"
                    value={formData.concurrent_requests}
                    onChange={e => setFormData({...formData, concurrent_requests: e.target.value})}
                  />
                </div>
              </div>

              <div className="gov-form-row">
                <div className="gov-form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.auto_block}
                    onChange={e => setFormData({...formData, auto_block: e.target.checked})}
                  />
                  <label style={{ margin: 0 }}>Auto-Block when limit reached</label>
                </div>
                <div className="gov-form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <label style={{ margin: 0 }}>Policy Enabled</label>
                </div>
              </div>

              <div className="gov-modal-actions">
                <button type="button" className="gov-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="gov-btn primary">Save Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
