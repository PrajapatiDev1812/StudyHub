import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, X, CheckCircle2, Clock, AlertCircle, RotateCcw,
  BookOpen, ChevronRight, Target, Filter, Calendar, FileText,
  Link2, Upload, Edit3, Trash2, Send, Play
} from 'lucide-react';
import api from '../../services/api';
import './TaskManager.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  SUBMITTED: 'Submitted',
  VERIFIED: 'Verified',
  NEEDS_REVISION: 'Needs Revision',
};

const SOURCE_LABELS = {
  STUDENT_CREATED: 'Personal',
  ADMIN_ASSIGNED: 'Assigned',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = d - now;
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function StatusBadge({ status, isOverdue }) {
  if (isOverdue && status !== 'VERIFIED' && status !== 'COMPLETED') {
    return <span className="tm-badge badge-overdue">⚠ Overdue</span>;
  }
  const cls = `tm-badge badge-status-${status.toLowerCase().replace('_', '-')}`;
  return <span className={cls}>{STATUS_LABELS[status] || status}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`tm-badge badge-priority-${priority}`}>{priority}</span>;
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', status: 'TODO' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.due_date) delete payload.due_date;
      await api.post('/student/my-tasks/', payload);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <h2>Create Personal Task</h2>
          <button className="tm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="tm-modal-body">
            {error && <div className="tm-revision-feedback" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', borderLeft: '3px solid #ef4444', marginBottom: '1rem' }}>{error}</div>}
            <div className="tm-form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="What do you need to do?" autoFocus />
            </div>
            <div className="tm-form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..." />
            </div>
            <div className="tm-form-row">
              <div className="tm-form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="tm-form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
            <div className="tm-form-group">
              <label>Due Date</label>
              <input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="tm-modal-footer">
            <button type="button" className="tm-btn tm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="tm-btn tm-btn-primary" disabled={saving}>
              {saving ? 'Creating...' : <><Plus size={15} /> Create Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Task Modal ──────────────────────────────────────────────────────────

function EditTaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
    status: task.status || 'TODO',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.due_date) payload.due_date = null;
      await api.patch(`/student/my-tasks/${task.id}/`, payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <h2>Edit Task</h2>
          <button className="tm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="tm-modal-body">
            {error && <div style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{error}</div>}
            <div className="tm-form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="tm-form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="tm-form-row">
              <div className="tm-form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="tm-form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>
            <div className="tm-form-group">
              <label>Due Date</label>
              <input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="tm-modal-footer">
            <button type="button" className="tm-btn tm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="tm-btn tm-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Submit Task Modal ────────────────────────────────────────────────────────

function SubmitTaskModal({ assignment, onClose, onSubmitted }) {
  const [form, setForm] = useState({ submission_note: '', submission_link: '' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isResubmit = assignment.status === 'NEEDS_REVISION';
  const endpoint = isResubmit
    ? `/task-assignments/${assignment.assignment_id}/resubmit/`
    : `/task-assignments/${assignment.assignment_id}/submit/`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('submission_note', form.submission_note);
      formData.append('submission_link', form.submission_link);
      if (file) formData.append('attachment', file);
      await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <h2>{isResubmit ? 'Resubmit Task' : 'Submit for Verification'}</h2>
          <button className="tm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="tm-modal-body">
            <div className="tm-workflow-info">
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{assignment.title}</strong>
              After submission, your teacher will review and verify your work.
            </div>
            {isResubmit && assignment.revision_feedback && (
              <div className="tm-revision-feedback">
                <strong>Teacher Feedback:</strong>
                {assignment.revision_feedback}
              </div>
            )}
            {error && <div style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{error}</div>}
            <div className="tm-form-group">
              <label>Submission Note</label>
              <textarea
                value={form.submission_note}
                onChange={e => setForm(p => ({ ...p, submission_note: e.target.value }))}
                placeholder="Describe what you completed..."
              />
            </div>
            <div className="tm-form-group">
              <label>Submission Link (optional)</label>
              <input
                value={form.submission_link}
                onChange={e => setForm(p => ({ ...p, submission_link: e.target.value }))}
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="tm-form-group">
              <label>Attachment (optional)</label>
              <input type="file" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>
          <div className="tm-modal-footer">
            <button type="button" className="tm-btn tm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="tm-btn tm-btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : <><Send size={14} /> {isResubmit ? 'Resubmit' : 'Submit'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────

function TaskDetailModal({ task, onClose, onAction }) {
  const isPersonal = task.type === 'personal';
  const isAssigned = task.type === 'assigned';
  const canStart = isAssigned && task.status === 'TODO';
  const canSubmit = isAssigned && (task.status === 'IN_PROGRESS' || task.status === 'NEEDS_REVISION');
  const [showSubmit, setShowSubmit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await api.post(`/task-assignments/${task.assignment_id}/start/`);
      onAction();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start task.');
    } finally {
      setStarting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task permanently?')) return;
    setDeleting(true);
    try {
      await api.delete(`/student/my-tasks/${task.id}/`);
      onAction();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="tm-modal-overlay" onClick={onClose}>
        <div className="tm-modal tm-modal-lg" onClick={e => e.stopPropagation()}>
          <div className="tm-modal-header">
            <h2>{task.title}</h2>
            <button className="tm-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="tm-modal-body">
            {/* Status bar */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <StatusBadge status={task.status} isOverdue={task.is_overdue} />
              <span className={`tm-badge ${isAssigned ? 'badge-source-assigned' : 'badge-source-personal'}`}>
                {isAssigned ? '📋 Assigned' : '👤 Personal'}
              </span>
              <PriorityBadge priority={task.priority} />
            </div>

            {/* Revision feedback */}
            {task.revision_feedback && (
              <div className="tm-revision-feedback">
                <strong>Teacher Feedback:</strong>
                {task.revision_feedback}
              </div>
            )}

            {/* Verified banner */}
            {task.status === 'VERIFIED' && (
              <div className="tm-verified-banner">
                <CheckCircle2 size={18} />
                Verified by {task.verified_by_name || 'Teacher'} on {formatDate(task.verified_at)}
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div className="tm-detail-section">
                <h3>Description</h3>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{task.description}</p>
              </div>
            )}

            <hr className="tm-divider" />

            {/* Details grid */}
            <div className="tm-detail-section">
              <h3>Details</h3>
              <div className="tm-detail-grid">
                <div className="tm-detail-item">
                  <div className="tm-detail-item-label">Due Date</div>
                  <div className="tm-detail-item-value" style={task.is_overdue && task.status !== 'VERIFIED' ? { color: '#ef4444' } : {}}>
                    {task.due_date ? formatDate(task.due_date) : 'No deadline'}
                    {task.is_overdue && task.status !== 'VERIFIED' && ' ⚠'}
                  </div>
                </div>
                {task.course_name && (
                  <div className="tm-detail-item">
                    <div className="tm-detail-item-label">Course</div>
                    <div className="tm-detail-item-value">{task.course_name}</div>
                  </div>
                )}
                {task.subject_name && (
                  <div className="tm-detail-item">
                    <div className="tm-detail-item-label">Subject</div>
                    <div className="tm-detail-item-value">{task.subject_name}</div>
                  </div>
                )}
                {task.creator_name && (
                  <div className="tm-detail-item">
                    <div className="tm-detail-item-label">Assigned By</div>
                    <div className="tm-detail-item-value">{task.creator_name}</div>
                  </div>
                )}
                {task.submitted_at && (
                  <div className="tm-detail-item">
                    <div className="tm-detail-item-label">Submitted</div>
                    <div className="tm-detail-item-value">{formatDate(task.submitted_at)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Previous submission */}
            {(task.submission_note || task.submission_link) && (
              <>
                <hr className="tm-divider" />
                <div className="tm-detail-section">
                  <h3>Your Submission</h3>
                  {task.submission_note && (
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 0.5rem' }}>{task.submission_note}</p>
                  )}
                  {task.submission_link && (
                    <a href={task.submission_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Link2 size={14} /> View Link
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="tm-modal-footer">
            {isPersonal && (
              <button className="tm-btn tm-btn-danger" onClick={handleDelete} disabled={deleting}>
                <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button className="tm-btn tm-btn-secondary" onClick={onClose}>Close</button>
            {canStart && (
              <button className="tm-btn tm-btn-primary" onClick={handleStart} disabled={starting}>
                <Play size={14} /> {starting ? 'Starting...' : 'Start Task'}
              </button>
            )}
            {canSubmit && (
              <button className="tm-btn tm-btn-primary" onClick={() => setShowSubmit(true)}>
                <Send size={14} /> {task.status === 'NEEDS_REVISION' ? 'Resubmit' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showSubmit && (
        <SubmitTaskModal
          assignment={task}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => { onAction(); onClose(); }}
        />
      )}
    </>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onClick }) {
  const isAssigned = task.type === 'assigned';
  const overdueClass = task.is_overdue && task.status !== 'VERIFIED' && task.status !== 'COMPLETED' ? 'status-overdue' : '';
  const statusClass = task.status === 'VERIFIED' ? 'status-verified' : task.status === 'NEEDS_REVISION' ? 'status-needs-revision' : '';
  const sourceClass = isAssigned ? 'source-assigned' : 'source-personal';

  return (
    <div className={`tm-card ${sourceClass} ${overdueClass} ${statusClass}`} onClick={onClick}>
      <div className="tm-card-header">
        <span className="tm-card-title">{task.title}</span>
        <StatusBadge status={task.status} isOverdue={task.is_overdue} />
      </div>

      <div className="tm-card-meta">
        <span className={`tm-badge ${isAssigned ? 'badge-source-assigned' : 'badge-source-personal'}`}>
          {isAssigned ? '📋 Assigned' : '👤 Personal'}
        </span>
        <PriorityBadge priority={task.priority} />
        {task.course_name && (
          <span className="tm-badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <BookOpen size={11} style={{ display: 'inline', marginRight: '2px' }} />{task.course_name}
          </span>
        )}
      </div>

      {task.description && (
        <p className="tm-card-description">{task.description}</p>
      )}

      <div className="tm-card-footer">
        <span className={`tm-card-due ${task.is_overdue && task.status !== 'VERIFIED' && task.status !== 'COMPLETED' ? 'overdue' : ''}`}>
          <Calendar size={12} />
          {task.due_date ? formatDate(task.due_date) : 'No deadline'}
        </span>
        {task.creator_name && (
          <span className="tm-card-context">by {task.creator_name}</span>
        )}
        {task.revision_feedback && (
          <span className="tm-badge badge-status-needs-revision" style={{ fontSize: '0.65rem' }}>Has Feedback</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'personal', label: 'My Tasks' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'SUBMITTED', label: 'Awaiting Review' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'NEEDS_REVISION', label: 'Needs Revision' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function TaskManager() {
  const [data, setData] = useState({ all: [], personal: [], assigned: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.all([
        api.get('/student/tasks/'),
        api.get('/student/tasks/stats/'),
      ]);
      setData(tasksRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const now = new Date();
  const today = now.toDateString();

  const filtered = data.all.filter(task => {
    // Tab filtering
    if (tab === 'personal' && task.type !== 'personal') return false;
    if (tab === 'assigned' && task.type !== 'assigned') return false;
    if (tab === 'overdue') {
      if (!task.is_overdue) return false;
      if (task.status === 'VERIFIED' || task.status === 'COMPLETED') return false;
    }
    if (tab === 'today') {
      if (!task.due_date) return false;
      if (new Date(task.due_date).toDateString() !== today) return false;
    }
    if (tab === 'upcoming') {
      if (!task.due_date || new Date(task.due_date) <= now) return false;
    }
    if (['TODO','IN_PROGRESS','COMPLETED','SUBMITTED','VERIFIED','NEEDS_REVISION'].includes(tab)) {
      if (task.status !== tab) return false;
    }

    // Search
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;

    // Priority
    if (priorityFilter && task.priority !== priorityFilter) return false;

    // Source
    if (sourceFilter === 'personal' && task.type !== 'personal') return false;
    if (sourceFilter === 'assigned' && task.type !== 'assigned') return false;

    return true;
  });

  // ── Stat card definitions ──────────────────────────────────────────────────
  const statCards = stats ? [
    { key: 'all', label: 'Total', value: stats.total },
    { key: 'personal', label: 'Personal', value: stats.personal_todo + stats.personal_in_progress + stats.personal_completed },
    { key: 'TODO', label: 'To Do', value: (stats.personal_todo || 0) + (stats.assigned_todo || 0) },
    { key: 'IN_PROGRESS', label: 'In Progress', value: (stats.personal_in_progress || 0) + (stats.assigned_in_progress || 0) },
    { key: 'SUBMITTED', label: 'Submitted', value: stats.assigned_submitted, cls: 'stat-submitted' },
    { key: 'VERIFIED', label: 'Verified', value: stats.assigned_verified, cls: 'stat-verified' },
    { key: 'NEEDS_REVISION', label: 'Revision', value: stats.assigned_needs_revision, cls: 'stat-revision' },
    { key: 'COMPLETED', label: 'Completed', value: stats.personal_completed },
    { key: 'overdue', label: 'Overdue', value: stats.overdue, cls: 'stat-overdue' },
  ] : [];

  return (
    <div className="tm-page">
      {/* Header */}
      <div className="tm-header">
        <div className="tm-header-text">
          <h1>Task Manager</h1>
          <p>Manage your personal tasks and academic assignments</p>
        </div>
        <div className="tm-header-actions">
          <button className="tm-btn tm-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="tm-stats-bar">
          {statCards.map(s => (
            <div
              key={s.key}
              className={`tm-stat-card ${s.cls || ''} ${tab === s.key ? 'active' : ''}`}
              onClick={() => setTab(s.key)}
            >
              <div className="tm-stat-value">{s.value ?? 0}</div>
              <div className="tm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="tm-toolbar">
        <div className="tm-search-box">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
          />
        </div>
        <select className="tm-filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="tm-filter-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="">All Sources</option>
          <option value="personal">Personal</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="tm-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`tm-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="tm-grid">
          <div className="tm-loading">
            <div className="tm-spinner" /> Loading tasks...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="tm-grid">
          <div className="tm-empty">
            <div className="tm-empty-icon">✅</div>
            <h3>{tab === 'all' ? 'No tasks yet' : `No ${TABS.find(t => t.key === tab)?.label || ''} tasks`}</h3>
            <p>{tab === 'all' ? 'Create your first task or wait for assignments from your teacher.' : 'Check other filters or create a new personal task.'}</p>
          </div>
        </div>
      ) : (
        <div className="tm-grid">
          {filtered.map(task => (
            <TaskCard
              key={task.type === 'assigned' ? `a-${task.assignment_id}` : `p-${task.id}`}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchData}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onAction={fetchData}
        />
      )}
    </div>
  );
}
