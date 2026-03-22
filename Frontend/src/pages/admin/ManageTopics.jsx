import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ManageTopics() {
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', subject: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/topics/'),
      api.get('/subjects/'),
    ]).then(([topRes, subRes]) => {
      setTopics(topRes.data.results || topRes.data);
      setSubjects(subRes.data.results || subRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/topics/${editing.id}/`, form); }
      else { await api.post('/topics/', form); }
      setShowModal(false); setEditing(null); setForm({ name: '', description: '', subject: '' });
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const handleEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description || '', subject: t.subject });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this topic?')) return;
    try { await api.delete(`/topics/${id}/`); fetchData(); } catch { alert('Failed'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Manage Topics</h1><p>Organize topics within subjects</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '', subject: '' }); setShowModal(true); }}>+ New Topic</button>
      </div>

      <div className="glass-card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Subject</th><th>Actions</th></tr></thead>
          <tbody>
            {topics.map(t => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{subjects.find(s => s.id === t.subject)?.name || t.subject}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(t)} style={{ marginRight: 8 }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Topic' : 'New Topic'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Topic Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" name="description" value={form.description} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select className="form-input" name="subject" value={form.subject} onChange={handleChange} required>
                  <option value="">Select a subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
