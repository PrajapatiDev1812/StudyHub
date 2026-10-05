import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, X, CheckCircle2, XCircle, Clock, AlertCircle,
  Calendar, Users, Edit3, Eye, RotateCcw, Send, Filter
} from 'lucide-react';
import api from '../../../services/api';
import './AdminTaskManager.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  TODO: { label: 'To Do', cls: 'atm-badge-todo' },
  IN_PROGRESS: { label: 'In Progress', cls: 'atm-badge-progress' },
  SUBMITTED: { label: 'Submitted', cls: 'atm-badge-submitted' },
  VERIFIED: { label: 'Verified', cls: 'atm-badge-verified' },
  COMPLETED: { label: 'Completed', cls: 'atm-badge-completed' },
  NEEDS_REVISION: { label: 'Needs Revision', cls: 'atm-badge-revision' },
};

function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || { label: status, cls: '' };
  return <span className={`atm-badge ${m.cls}`}>{m.label}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`atm-badge atm-badge-${priority}`}>{priority}</span>;
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateTaskModal({ students, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        assigned_student_ids: selectedStudents,
      };
      if (!payload.due_date) delete payload.due_date;
      await api.post('/admin/tasks/', payload);
      onCreated();
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.detail || d?.title?.[0] || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="atm-overlay" onClick={onClose}>
      <div className="atm-modal" onClick={e => e.stopPropagation()}>
        <div className="atm-modal-header">
          <h2>Create & Assign Task</h2>
          <button className="atm-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="atm-modal-body">
            {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</div>}
            <div className="atm-form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title..." autoFocus />
            </div>
            <div className="atm-form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the task..." />
            </div>
            <div className="atm-form-row">
              <div className="atm-form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="atm-form-group">
                <label>Due Date</label>
                <input type="datetime-local" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="atm-form-group">
              <label>Assign Students ({selectedStudents.length} selected)</label>
              <input
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                style={{ marginBottom: '0.5rem' }}
              />
              <div className="atm-student-list">
                {filteredStudents.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>No students found</p>
                ) : filteredStudents.map(s => (
                  <div key={s.id} className="atm-student-item" onClick={() => toggle(s.id)}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => {}}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    <label>{s.first_name} {s.last_name} <span style={{ opacity: 0.5 }}>@{s.username}</span></label>
                  </div>
                ))}
              </div>
              {selectedStudents.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  Leave empty to create a task without assigning (you can assign later).
                </p>
              )}
            </div>
          </div>
          <div className="atm-modal-footer">
            <button type="button" className="atm-btn atm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="atm-btn atm-btn-primary" disabled={saving}>
              {saving ? 'Creating...' : <><Plus size={14} /> Create Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Due Date Modal ──────────────────────────────────────────────────────

function EditDueDateModal({ task, onClose, onSaved }) {
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/tasks/${task.id}/due-date/`, { due_date: dueDate || null });
      onSaved();
      onClose();
    } catch (err) {
      setError('Failed to update due date.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="atm-overlay" onClick={onClose}>
      <div className="atm-modal" onClick={e => e.stopPropagation()}>
        <div className="atm-modal-header">
          <h2>Change Due Date</h2>
          <button className="atm-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="atm-modal-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Changing the due date for: <strong style={{ color: 'var(--text-primary)' }}>{task.title}</strong>
            </p>
            <p style={{ color: 'rgba(245,158,11,0.9)', fontSize: '0.8rem', marginBottom: '1rem', background: 'rgba(245,158,11,0.08)', padding: '0.6rem', borderRadius: '8px' }}>
              This will immediately update the deadline for all assigned students. Overdue calculations will use the new date.
            </p>
            {error && <div style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{error}</div>}
            <div className="atm-form-group">
              <label>New Due Date</label>
              <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="atm-modal-footer">
            <button type="button" className="atm-btn atm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="atm-btn atm-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Deadline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Verification Modal ───────────────────────────────────────────────────────

function VerifyModal({ assignment, onClose, onDone }) {
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState(null); // 'verify' | 'revision'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/task-assignments/${assignment.id}/verify/`);
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!feedback.trim()) { setError('Feedback is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post(`/task-assignments/${assignment.id}/request-revision/`, { revision_feedback: feedback });
      onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request revision.');
    } finally {
      setLoading(false);
    }
  };

  const studentName = assignment.student
    ? `${assignment.student.first_name} ${assignment.student.last_name}`.trim() || assignment.student.username
    : 'Student';

  return (
    <div className="atm-overlay" onClick={onClose}>
      <div className="atm-modal atm-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="atm-modal-header">
          <h2>Review Submission</h2>
          <button className="atm-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="atm-modal-body">
          <div className="atm-detail-row">
            <div className="atm-info-block">
              <div className="atm-info-label">Task</div>
              <div className="atm-info-value">{assignment.task?.title}</div>
            </div>
            <div className="atm-info-block">
              <div className="atm-info-label">Student</div>
              <div className="atm-info-value">{studentName}</div>
            </div>
            <div className="atm-info-block">
              <div className="atm-info-label">Submitted</div>
              <div className="atm-info-value">{fmt(assignment.submitted_at)}</div>
            </div>
            <div className="atm-info-block">
              <div className="atm-info-label">Due Date</div>
              <div className="atm-info-value">{fmt(assignment.task?.due_date)}</div>
            </div>
          </div>

          {assignment.submission_note && (
            <div className="atm-submission-box">
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Submission Note</p>
              {assignment.submission_note}
            </div>
          )}

          {assignment.submission_link && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Submission Link</p>
              <a href={assignment.submission_link} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                {assignment.submission_link}
              </a>
            </div>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</div>}

          {action === 'revision' && (
            <div className="atm-feedback-input">
              <p style={{ fontSize: '0.8rem', color: 'rgba(249,115,22,0.8)', marginBottom: '0.5rem' }}>Provide feedback for the student:</p>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Explain what needs to be revised..."
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="atm-modal-footer">
          <button className="atm-btn atm-btn-ghost" onClick={onClose}>Cancel</button>
          {action !== 'revision' && (
            <button className="atm-btn atm-btn-warn" onClick={() => setAction('revision')}>
              <RotateCcw size={14} /> Request Revision
            </button>
          )}
          {action === 'revision' ? (
            <button className="atm-btn atm-btn-warn" onClick={handleRevision} disabled={loading}>
              {loading ? 'Sending...' : 'Send Feedback'}
            </button>
          ) : (
            <button className="atm-btn atm-btn-success" onClick={handleVerify} disabled={loading}>
              {loading ? 'Verifying...' : <><CheckCircle2 size={14} /> Verify</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Task Assignments Panel ───────────────────────────────────────────────────

function TaskAssignmentsModal({ task, onClose, onRefresh }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tasks/${task.id}/assignments/`);
      setAssignments(res.data);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="atm-overlay" onClick={onClose}>
        <div className="atm-modal atm-modal-lg" onClick={e => e.stopPropagation()}>
          <div className="atm-modal-header">
            <h2>{task.title} — Assignments ({assignments.length})</h2>
            <button className="atm-modal-close" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="atm-modal-body">
            {loading ? (
              <div className="atm-loading"><div className="atm-spinner" /><p>Loading...</p></div>
            ) : assignments.length === 0 ? (
              <div className="atm-empty"><Users size={36} style={{ opacity: 0.3 }} /><h3>No Assignments</h3><p>No students have been assigned this task yet.</p></div>
            ) : (
              <div className="atm-table-wrap">
                <table className="atm-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Verified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(a => {
                      const sn = a.student_name || a.student?.username || 'Unknown';
                      return (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 500 }}>{sn}</td>
                          <td><StatusBadge status={a.status} /></td>
                          <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{fmt(a.submitted_at)}</td>
                          <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{fmt(a.verified_at)}</td>
                          <td>
                            {a.status === 'SUBMITTED' && (
                              <button className="atm-btn atm-btn-success" onClick={() => setSelected(a)}>
                                <Eye size={13} /> Review
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="atm-modal-footer">
            <button className="atm-btn atm-btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
      {selected && (
        <VerifyModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onDone={() => { load(); onRefresh(); }}
        />
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'queue', label: '🔔 Verification Queue' },
];

export default function AdminTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [queue, setQueue] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [dueDateTask, setDueDateTask] = useState(null);
  const [assignmentsTask, setAssignmentsTask] = useState(null);
  const [verifyAssignment, setVerifyAssignment] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, queueRes, studentsRes] = await Promise.all([
        api.get('/admin/tasks/'),
        api.get('/admin/tasks/verification-queue/'),
        api.get('/admin/task-students/'),
      ]);
      setTasks(tasksRes.data.results || tasksRes.data);
      setQueue(Array.isArray(queueRes.data) ? queueRes.data : []);
      const sData = studentsRes.data.results || studentsRes.data;
      setStudents(Array.isArray(sData) ? sData : []);
    } catch (err) {
      console.error('AdminTaskManager load error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });

  // Queue filtered by search
  const filteredQueue = queue.filter(a => {
    if (!search) return true;
    const taskTitle = a.task?.title || a.task_title || '';
    return taskTitle.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: tasks.length,
    admin_assigned: tasks.filter(t => t.source === 'ADMIN_ASSIGNED').length,
    queue: queue.length,
  };

  return (
    <div className="atm-page">
      {/* Header */}
      <div className="atm-header">
        <div>
          <h1>Task Manager</h1>
          <p>Create academic tasks, assign to students, and verify submissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="atm-btn atm-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Create Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="atm-stats">
        <div className="atm-stat"><div className="atm-stat-value">{stats.total}</div><div className="atm-stat-label">Total</div></div>
        <div className="atm-stat"><div className="atm-stat-value">{stats.admin_assigned}</div><div className="atm-stat-label">Academic</div></div>
        <div className={`atm-stat submitted`}><div className="atm-stat-value">{stats.queue}</div><div className="atm-stat-label">Pending Review</div></div>
      </div>

      {/* Toolbar */}
      <div className="atm-toolbar">
        <div className="atm-search">
          <Search size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." />
        </div>
        <select className="atm-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="atm-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`atm-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} {t.key === 'queue' && queue.length > 0 ? `(${queue.length})` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="atm-loading"><div className="atm-spinner" /><p>Loading tasks...</p></div>
      ) : tab === 'all' ? (
        filteredTasks.length === 0 ? (
          <div className="atm-empty">
            <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.75rem' }}>📋</div>
            <h3>No tasks yet</h3>
            <p>Create your first task to assign to students.</p>
          </div>
        ) : (
          <div className="atm-table-wrap">
            <table className="atm-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Assigned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <span className="atm-task-title" onClick={() => setAssignmentsTask(task)}>{task.title}</span>
                      {task.course_name && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>{task.course_name}</div>}
                    </td>
                    <td>
                      <span className={`atm-badge ${task.source === 'ADMIN_ASSIGNED' ? 'atm-badge-submitted' : 'atm-badge-todo'}`}>
                        {task.source === 'ADMIN_ASSIGNED' ? 'Academic' : 'Personal'}
                      </span>
                    </td>
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{fmt(task.due_date)}</td>
                    <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      {task.source === 'ADMIN_ASSIGNED' ? (task.assignments_count ?? '—') : 'N/A'}
                    </td>
                    <td>
                      <div className="atm-actions">
                        {task.source === 'ADMIN_ASSIGNED' && (
                          <>
                            <button className="atm-btn atm-btn-ghost" onClick={() => setDueDateTask(task)} title="Change Due Date">
                              <Calendar size={13} />
                            </button>
                            <button className="atm-btn atm-btn-ghost" onClick={() => setAssignmentsTask(task)} title="View Assignments">
                              <Users size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Verification Queue Tab */
        filteredQueue.length === 0 ? (
          <div className="atm-empty">
            <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.75rem' }}>✅</div>
            <h3>All clear!</h3>
            <p>No submissions awaiting review.</p>
          </div>
        ) : (
          <div className="atm-table-wrap">
            <table className="atm-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map(a => {
                  const sn = a.student?.username || a.student_name || '—';
                  const title = a.task?.title || a.task_title || '—';
                  const course = a.task?.course_name || a.course_name || '—';
                  const dueDate = a.task?.due_date || a.due_date;
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{title}</td>
                      <td style={{ color: 'rgba(255,255,255,0.7)' }}>{sn}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{course}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{fmt(dueDate)}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{fmt(a.submitted_at)}</td>
                      <td>
                        <button className="atm-btn atm-btn-success" onClick={() => setVerifyAssignment(a)}>
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modals */}
      {showCreate && (
        <CreateTaskModal
          students={students}
          onClose={() => setShowCreate(false)}
          onCreated={fetchAll}
        />
      )}

      {dueDateTask && (
        <EditDueDateModal
          task={dueDateTask}
          onClose={() => setDueDateTask(null)}
          onSaved={fetchAll}
        />
      )}

      {assignmentsTask && (
        <TaskAssignmentsModal
          task={assignmentsTask}
          onClose={() => setAssignmentsTask(null)}
          onRefresh={fetchAll}
        />
      )}

      {verifyAssignment && (
        <VerifyModal
          assignment={verifyAssignment}
          onClose={() => setVerifyAssignment(null)}
          onDone={fetchAll}
        />
      )}
    </div>
  );
}
