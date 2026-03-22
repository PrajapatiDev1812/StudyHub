import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', course: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/subjects/'),
      api.get('/courses/'),
    ]).then(([subRes, courseRes]) => {
      setSubjects(subRes.data.results || subRes.data);
      setCourses(courseRes.data.results || courseRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/subjects/${editing.id}/`, form);
      } else {
        await api.post('/subjects/', form);
      }
      setShowModal(false); setEditing(null); setForm({ name: '', description: '', course: '' });
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || '', course: s.course });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try { await api.delete(`/subjects/${id}/`); fetchData(); } catch { alert('Failed'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Manage Subjects</h1><p>Organize subjects within courses</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '', course: '' }); setShowModal(true); }}>+ New Subject</button>
      </div>

      <div className="glass-card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Course</th><th>Actions</th></tr></thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{courses.find(c => c.id === s.course)?.name || s.course}</td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(s)} style={{ marginRight: 8 }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
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
              <h2>{editing ? 'Edit Subject' : 'New Subject'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" name="description" value={form.description} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Course</label>
                <select className="form-input" name="course" value={form.course} onChange={handleChange} required>
                  <option value="">Select a course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
