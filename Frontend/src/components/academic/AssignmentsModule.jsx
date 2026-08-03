import React, { useState } from 'react';
import { FileText, Plus, Calendar, Clock, CheckCircle2, AlertCircle, Edit, Send } from 'lucide-react';
import { academicApi } from '../../services/academicApi';

export default function AssignmentsModule({ data, refetch }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [saving, setSaving] = useState(false);

  const assignmentsList = data?.assignments || [];

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await academicApi.createAssignment({ title, description, deadline, max_marks: Number(maxMarks) });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      if (refetch) refetch();
    } catch {
      alert('Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Course Assignments Manager
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Manage coursework, set deadlines, and grade student submissions
          </span>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="admin-action-btn primary"
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Create Assignment
        </button>
      </div>

      {/* Assignments List Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {assignmentsList.map((assg) => (
          <div key={assg.id} className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {assg.title}
                  </h4>
                  <span style={{
                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12,
                    background: assg.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                    color: assg.status === 'Active' ? '#10B981' : 'var(--accent-primary)', fontWeight: 600
                  }}>
                    {assg.status}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: 650 }}>
                  {assg.description || 'Enterprise dataset implementation task.'}
                </p>

                <div style={{ display: 'flex', gap: 18, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Subject: <strong>{assg.subject}</strong></span>
                  <span>Deadline: <strong>{new Date(assg.deadline).toLocaleDateString()}</strong></span>
                  <span>Max Marks: <strong>{assg.max_marks}</strong></span>
                </div>
              </div>

              {/* Progress pill stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {assg.submitted_count} / {assg.total_students}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Submissions</div>
                </div>

                <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>
                    {assg.avg_marks}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Avg Score</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Creating Assignment */}
      {showCreateModal && (
        <div style={modalOverlayStyle} onClick={() => setShowCreateModal(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()} className="fade-in">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 700 }}>Create New Course Assignment</h3>
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assignment 3: Distributed Partitioning & Indexing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide instructions and dataset requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Submission Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Maximum Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="admin-action-btn secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="admin-action-btn primary">
                  {saving ? 'Creating...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-glass)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
};
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalBoxStyle = {
  width: '100%', maxWidth: 500, background: 'var(--bg-card, #1e1e2e)',
  padding: 24, borderRadius: 12, border: '1px solid var(--border-color)',
  color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
};
