import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function ManageQuestions() {
  const { testId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ text: '', marks: 1, options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] });

  const fetchQuestions = () => {
    setLoading(true);
    api.get(`/questions/?test=${testId}`)
      .then(res => setQuestions(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuestions(); }, [testId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/questions/${editing.id}/`, { ...form, test: testId });
      } else {
        await api.post('/questions/', { ...form, test: testId });
      }
      // Save options
      setShowModal(false); setEditing(null);
      setForm({ text: '', marks: 1, options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] });
      fetchQuestions();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Error'); }
  };

  const handleEdit = (q) => {
    setEditing(q);
    setForm({ text: q.text, marks: q.marks, options: q.options?.length ? q.options : [{ text: '', is_correct: false }] });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try { await api.delete(`/questions/${id}/`); fetchQuestions(); } catch { alert('Failed'); }
  };

  const addOption = () => setForm({ ...form, options: [...form.options, { text: '', is_correct: false }] });

  const updateOption = (idx, field, value) => {
    const opts = [...form.options];
    opts[idx][field] = value;
    setForm({ ...form, options: opts });
  };

  const removeOption = (idx) => {
    const opts = form.options.filter((_, i) => i !== idx);
    setForm({ ...form, options: opts });
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Manage Questions</h1><p>Test #{testId} — Add and edit questions</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ text: '', marks: 1, options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }); setShowModal(true); }}>+ New Question</button>
      </div>

      {questions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>No questions yet. Click "+ New Question" to add one.</p>
        </div>
      ) : (
        questions.map((q, idx) => (
          <div key={q.id} className="glass-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4>Q{idx + 1}. {q.text} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({q.marks} marks)</span></h4>
              <div>
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(q)} style={{ marginRight: 8 }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>Delete</button>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              {q.options?.map(opt => (
                <div key={opt.id} style={{ padding: '4px 0', fontSize: '0.88rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{opt.is_correct ? '✅' : '⚪'}</span>
                  <span style={{ color: opt.is_correct ? 'var(--success)' : 'var(--text-secondary)' }}>{opt.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Question' : 'New Question'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question Text</label>
                <textarea className="form-input" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Marks</label>
                <input className="form-input" type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) })} min="1" />
              </div>
              <div className="form-group">
                <label>Options</label>
                {form.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input type="checkbox" checked={opt.is_correct} onChange={(e) => updateOption(i, 'is_correct', e.target.checked)} title="Mark correct" />
                    <input className="form-input" placeholder={`Option ${i + 1}`} value={opt.text} onChange={(e) => updateOption(i, 'text', e.target.value)} required style={{ flex: 1 }} />
                    {form.options.length > 2 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOption(i)}>✕</button>}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>+ Add Option</button>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{editing ? 'Update' : 'Create'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
