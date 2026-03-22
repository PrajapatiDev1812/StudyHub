import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ManageTests() {
  const [tests, setTests] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', topic: '', time_limit_minutes: '', passing_score: 50 });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/tests/'),
      api.get('/topics/'),
    ]).then(([testRes, topRes]) => {
      setTests(testRes.data.results || testRes.data);
      setTopics(topRes.data.results || topRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, time_limit_minutes: form.time_limit_minutes ? parseInt(form.time_limit_minutes) : null, passing_score: parseInt(form.passing_score) };
    try {
      if (editing) { await api.put(`/tests/${editing.id}/`, payload); }
      else { await api.post('/tests/', payload); }
      setShowModal(false); setEditing(null);
      setForm({ title: '', description: '', topic: '', time_limit_minutes: '', passing_score: 50 });
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const handleEdit = (t) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description || '', topic: t.topic, time_limit_minutes: t.time_limit_minutes || '', passing_score: t.passing_score });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this test?')) return;
    try { await api.delete(`/tests/${id}/`); fetchData(); } catch { alert('Failed'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Manage Tests</h1><p>Create quizzes and manage questions</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ title: '', description: '', topic: '', time_limit_minutes: '', passing_score: 50 }); setShowModal(true); }}>+ New Test</button>
      </div>

      <div className="glass-card">
        <table className="data-table">
          <thead><tr><th>Title</th><th>Time Limit</th><th>Pass Score</th><th>Actions</th></tr></thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.time_limit_minutes ? `${t.time_limit_minutes} min` : '—'}</td>
                <td>{t.passing_score}%</td>
                <td>
                  <Link to={`/admin/tests/${t.id}/questions`} className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}>Questions</Link>
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
              <h2>{editing ? 'Edit Test' : 'New Test'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" name="description" value={form.description} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Topic</label>
                <select className="form-input" name="topic" value={form.topic} onChange={handleChange} required>
                  <option value="">Select a topic</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Time Limit (minutes, optional)</label>
                <input className="form-input" type="number" name="time_limit_minutes" value={form.time_limit_minutes} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Passing Score (%)</label>
                <input className="form-input" type="number" name="passing_score" value={form.passing_score} onChange={handleChange} min="0" max="100" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
