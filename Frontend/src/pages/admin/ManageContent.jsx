import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ManageContent() {
  const [contents, setContents] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content_type: 'text', topic: '', text_content: '', external_link: '' });
  const [file, setFile] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/contents/'),
      api.get('/topics/'),
    ]).then(([conRes, topRes]) => {
      setContents(conRes.data.results || conRes.data);
      setTopics(topRes.data.results || topRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content_type', form.content_type);
      formData.append('topic', form.topic);
      if (form.text_content) formData.append('text_content', form.text_content);
      if (form.external_link) formData.append('external_link', form.external_link);
      if (file) formData.append('file', file);

      if (editing) {
        await api.put(`/contents/${editing.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/contents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false); setEditing(null); setFile(null);
      setForm({ title: '', content_type: 'text', topic: '', text_content: '', external_link: '' });
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({ title: c.title, content_type: c.content_type, topic: c.topic, text_content: c.text_content || '', external_link: c.external_link || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this content?')) return;
    try { await api.delete(`/contents/${id}/`); fetchData(); } catch { alert('Failed'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Manage Content</h1><p>Upload and manage learning materials</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setFile(null); setForm({ title: '', content_type: 'text', topic: '', text_content: '', external_link: '' }); setShowModal(true); }}>+ New Content</button>
      </div>

      <div className="glass-card">
        <table className="data-table">
          <thead><tr><th>Title</th><th>Type</th><th>Topic</th><th>Actions</th></tr></thead>
          <tbody>
            {contents.map(c => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td><span className="badge badge-info">{c.content_type}</span></td>
                <td>{topics.find(t => t.id === c.topic)?.name || c.topic}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(c)} style={{ marginRight: 8 }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
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
              <h2>{editing ? 'Edit Content' : 'New Content'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="form-input" name="content_type" value={form.content_type} onChange={handleChange}>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="text">Text</option>
                  <option value="link">External Link</option>
                </select>
              </div>
              <div className="form-group">
                <label>Topic</label>
                <select className="form-input" name="topic" value={form.topic} onChange={handleChange} required>
                  <option value="">Select a topic</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {form.content_type === 'text' && (
                <div className="form-group">
                  <label>Text Content</label>
                  <textarea className="form-input" name="text_content" value={form.text_content} onChange={handleChange} rows={5} />
                </div>
              )}
              {form.content_type === 'link' && (
                <div className="form-group">
                  <label>External URL</label>
                  <input className="form-input" name="external_link" value={form.external_link} onChange={handleChange} />
                </div>
              )}
              {(form.content_type === 'video' || form.content_type === 'pdf') && (
                <div className="form-group">
                  <label>Upload File (max 50MB)</label>
                  <input type="file" className="form-input" onChange={(e) => setFile(e.target.files[0])} accept={form.content_type === 'video' ? '.mp4' : '.pdf'} />
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
