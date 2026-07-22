import { Activity } from 'lucide-react';

const TYPE_META = {
  focus: { icon: '🎯', label: 'Focus Session', color: 'var(--accent-primary)' },
  task:  { icon: '✅', label: 'Task',          color: 'var(--success)' },
  ai:    { icon: '🤖', label: 'AI Chat',       color: 'var(--accent-secondary)' },
};

function Skeleton() {
  return (
    <div className="dash-widget recent-activity-widget">
      <div className="skel-line" style={{ width: '45%', height: 14, marginBottom: 16 }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="recent-skel-item">
          <div className="skel-circle" style={{ width: 32, height: 32 }} />
          <div>
            <div className="skel-line" style={{ width: 140, height: 13, marginBottom: 4 }} />
            <div className="skel-line" style={{ width: 80, height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecentActivityCard({ data, isLoading, isError, onRetry }) {
  if (isLoading) return <Skeleton />;

  if (isError) return (
    <div className="dash-widget recent-activity-widget widget-error">
      <p>Could not load activity.</p>
      <button className="retry-btn" onClick={onRetry}>Retry</button>
    </div>
  );

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="dash-widget recent-activity-widget">
      <div className="widget-header">
        <span className="widget-label"><Activity size={14} /> Recent Activity</span>
      </div>

      {!hasData ? (
        <div className="widget-empty-inline">
          <Activity size={24} />
          <p>No recent activity</p>
          <span className="empty-sub">Complete tasks or start a Focus session</span>
        </div>
      ) : (
        <div className="activity-feed" aria-live="polite" aria-label="Recent activity feed">
          {data.slice(0, 6).map((item, i) => {
            const meta = TYPE_META[item.type] || TYPE_META.task;
            return (
              <div key={i} className="activity-item">
                <div className="activity-icon-wrap" style={{ background: `${meta.color}18` }}>
                  <span>{meta.icon}</span>
                </div>
                <div className="activity-info">
                  <p className="activity-title">{item.title}</p>
                  <p className="activity-time">
                    {new Date(item.time).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
