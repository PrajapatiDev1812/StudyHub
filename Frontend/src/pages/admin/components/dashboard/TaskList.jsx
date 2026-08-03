/**
 * TaskList.jsx
 * Admin/Teacher Dashboard — Upcoming Tasks & Deadlines
 *
 * Renders pending teacher tasks with priority badges:
 *   today    → danger (red)
 *   tomorrow → warning (amber)
 *   later    → info (blue)
 *
 * Props:
 *   tasks      — array from MOCK_TASKS or API
 *   isLoading  — boolean
 *   isError    — boolean
 *   onRetry    — function
 */

import {
  Upload, ClipboardList, BookOpen, FileText, Zap, CheckCircle2, AlertCircle,
} from 'lucide-react';

/* ── Icon mapping by task type ── */
const TASK_ICONS = {
  upload:     Upload,
  exam:       ClipboardList,
  assignment: FileText,
  syllabus:   BookOpen,
  quiz:       Zap,
};

function getTaskIcon(type) {
  const Icon = TASK_ICONS[type] || ClipboardList;
  return Icon;
}

/* ── Badge label ── */
const BADGE_LABELS = {
  today:    'Today',
  tomorrow: 'Tomorrow',
  later:    'Upcoming',
};

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="admin-widget">
      <div className="admin-skel" style={{ height: 14, width: '40%', marginBottom: 20 }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div className="admin-skel" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="admin-skel" style={{ height: 10, width: '80%' }} />
            <div className="admin-skel" style={{ height: 8, width: '40%' }} />
          </div>
          <div className="admin-skel" style={{ width: 60, height: 22, borderRadius: 6, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

export default function TaskList({ tasks = [], isLoading, isError, onRetry }) {
  if (isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="admin-widget">
        <div className="admin-error-state">
          <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
          <p>Failed to load tasks.</p>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  // Sort: today first, then tomorrow, then later
  const PRIORITY = { today: 0, tomorrow: 1, later: 2 };
  const sorted = [...tasks].sort((a, b) => (PRIORITY[a.due] ?? 2) - (PRIORITY[b.due] ?? 2));

  return (
    <div className="admin-widget admin-anim-up">
      <div className="admin-section-header">
        <div className="admin-section-title">
          <ClipboardList size={14} /> Upcoming Tasks
        </div>
        {tasks.length > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {tasks.length} pending
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="admin-empty">
          <CheckCircle2 size={36} />
          <p className="admin-empty-title">You're all caught up!</p>
          <p className="admin-empty-sub">No pending tasks at the moment. Keep up the great work.</p>
        </div>
      ) : (
        <div className="admin-task-list">
          {sorted.map(task => {
            const Icon = getTaskIcon(task.type);
            const badgeCls = task.due === 'today'
              ? 'today'
              : task.due === 'tomorrow'
              ? 'tomorrow'
              : 'later';

            return (
              <div key={task.id} className="admin-task-item">
                <div className="admin-task-icon">
                  <Icon size={15} />
                </div>
                <div className="admin-task-body">
                  <div className="admin-task-title">{task.title}</div>
                  <div className="admin-task-due">
                    Due: {BADGE_LABELS[task.due] || 'Upcoming'}
                  </div>
                </div>
                <div className={`admin-task-badge ${badgeCls}`}>
                  {BADGE_LABELS[task.due] || 'Later'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
