import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_public: true });

  const fetchCourses = () => {
    setLoading(true);
    api.get('/courses/')
      .then(res => setCourses(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/courses/${editing.id}/`, form);
      } else {
        await api.post('/courses/', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', description: '', is_public: true });
      fetchCourses();
    } catch (err) {
      alert(JSON.stringify(err.response?.data) || 'Error saving course');
    }
  };

  const handleEdit = (course) => {
    setEditing(course);
    setForm({ name: course.name, description: course.description || '', is_public: course.is_public });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await api.delete(`/courses/${id}/`);
      fetchCourses();
    } catch { alert('Failed to delete'); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Manage Courses</h1>
          <p>Create, edit, and delete courses</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '', is_public: true }); setShowModal(true); }}>+ New Course</button>
      </div>

      <div className="glass-card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Public</th><th>Actions</th></tr></thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.is_public ? <span className="badge badge-success">Yes</span> : <span className="badge badge-warning">No</span>}</td>
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
              <h2>{editing ? 'Edit Course' : 'New Course'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" name="description" value={form.description} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange} id="is_public" />
                <label htmlFor="is_public" style={{ margin: 0 }}>Public course</label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editing ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
