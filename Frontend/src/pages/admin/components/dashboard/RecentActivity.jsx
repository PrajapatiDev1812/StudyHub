/**
 * RecentActivity.jsx
 * Admin/Teacher Dashboard — Activity Timeline
 *
 * Renders a vertical timeline of teacher actions.
 * Each item has a colored dot icon, description, and relative timestamp.
 *
 * Props:
 *   activities   — array from MOCK_RECENT_ACTIVITY or API
 *   isLoading    — boolean
 *   isError      — boolean
 *   onRetry      — function
 */

import {
  Upload, Tag, Sparkles, FileText, Users, AlertCircle, Clock,
} from 'lucide-react';

/* ── Icon and class mapping by activity type ── */
const ACTIVITY_CONFIG = {
  upload:   { Icon: Upload,    cls: 'upload'   },
  topic:    { Icon: Tag,       cls: 'topic'    },
  ai:       { Icon: Sparkles,  cls: 'ai'       },
  syllabus: { Icon: FileText,  cls: 'syllabus' },
  student:  { Icon: Users,     cls: 'student'  },
};

function getActivityConfig(type) {
  return ACTIVITY_CONFIG[type] || { Icon: Clock, cls: 'upload' };
}

/* ── Relative timestamp ── */
function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 2)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="admin-widget">
      <div className="admin-skel" style={{ height: 14, width: '45%', marginBottom: 20 }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
          <div className="admin-skel" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="admin-skel" style={{ height: 10, width: '90%' }} />
            <div className="admin-skel" style={{ height: 8,  width: '35%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecentActivity({ activities = [], isLoading, isError, onRetry }) {
  if (isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="admin-widget">
        <div className="admin-error-state">
          <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
          <p>Failed to load recent activity.</p>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-widget admin-anim-up">
      <div className="admin-section-header">
        <div className="admin-section-title">
          <Clock size={14} /> Recent Activity
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="admin-empty">
          <Clock size={36} />
          <p className="admin-empty-title">No recent activity</p>
          <p className="admin-empty-sub">
            Your actions — uploads, topic changes, and quiz generations — will appear here.
          </p>
        </div>
      ) : (
        <div className="admin-activity-list">
          {activities.map(item => {
            const { Icon, cls } = getActivityConfig(item.type);
            return (
              <div key={item.id} className="admin-activity-item">
                <div className={`admin-activity-dot ${cls}`}>
                  <Icon size={15} />
                </div>
                <div className="admin-activity-body">
                  <div className="admin-activity-desc">{item.description}</div>
                  <div className="admin-activity-time">{relativeTime(item.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
