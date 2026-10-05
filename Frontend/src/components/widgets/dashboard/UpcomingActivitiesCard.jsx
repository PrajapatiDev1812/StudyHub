import { CalendarClock, PartyPopper } from 'lucide-react';

/**
 * UpcomingActivitiesCard
 *
 * Ready for future API integration:
 *   GET /api/dashboard/upcoming/
 *
 * Expected response shape:
 *   [{ id, title, type: 'quiz'|'assignment'|'exam', due_date, urgency: 'high'|'medium'|'low' }]
 */

const URGENCY_CONFIG = {
  high:   { label: 'Due Soon', color: 'var(--danger)' },
  medium: { label: 'Upcoming', color: 'var(--warning)' },
  low:    { label: 'Scheduled', color: 'var(--success)' },
};

const TYPE_ICONS = {
  quiz:       '📝',
  assignment: '📋',
  exam:       '📘',
  class:      '🎓',
};

function Skeleton() {
  return (
    <div className="dash-widget upcoming-widget">
      <div className="skel-line" style={{ width: '50%', height: 14, marginBottom: 16 }} />
      {[1, 2, 3].map(i => (
        <div key={i} className="upcoming-skel-item">
          <div className="skel-circle" style={{ width: 8, height: 8, borderRadius: '50%' }} />
          <div>
            <div className="skel-line" style={{ width: 120, height: 13, marginBottom: 4 }} />
            <div className="skel-line" style={{ width: 80, height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UpcomingActivitiesCard({ data = null, isLoading }) {
  if (isLoading) return <Skeleton />;

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="dash-widget upcoming-widget">
      <div className="widget-header">
        <span className="widget-label"><CalendarClock size={14} /> Upcoming</span>
      </div>

      {!hasData ? (
        <div className="widget-empty-inline">
          <PartyPopper size={24} />
          <p>No upcoming deadlines</p>
          <span className="empty-sub">You're all caught up! 🎉</span>
        </div>
      ) : (
        <div className="upcoming-list">
          {data.map((item) => {
            const cfg = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.low;
            const icon = TYPE_ICONS[item.type] || '📌';
            return (
              <div key={item.id} className="upcoming-item">
                <div className="upcoming-dot" style={{ background: cfg.color }} />
                <div className="upcoming-info">
                  <span className="upcoming-icon">{icon}</span>
                  <div>
                    <p className="upcoming-title">{item.title}</p>
                    <p className="upcoming-date">
                      {new Date(item.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      <span className="upcoming-urgency-tag" style={{ color: cfg.color }}>
                        · {cfg.label}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
