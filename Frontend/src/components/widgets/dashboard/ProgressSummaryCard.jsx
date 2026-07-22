import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckSquare, TrendingUp } from 'lucide-react';

function StatItem({ icon: Icon, label, value, color }) {
  return (
    <div className="progress-stat">
      <div className="progress-stat-icon" style={{ color }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="progress-stat-value">{value}</p>
        <p className="progress-stat-label">{label}</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="dash-widget progress-summary-widget">
      <div className="skel-line" style={{ width: '50%', height: 14, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="skel-circle" style={{ width: 36, height: 36 }} />
            <div>
              <div className="skel-line" style={{ width: 60, height: 16, marginBottom: 4 }} />
              <div className="skel-line" style={{ width: 80, height: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProgressSummaryCard({ summary, isLoading, isError, onRetry }) {
  const navigate = useNavigate();

  if (isLoading) return <Skeleton />;

  if (isError) return (
    <div className="dash-widget progress-summary-widget widget-error">
      <p>Failed to load progress.</p>
      <button className="retry-btn" onClick={onRetry}>Retry</button>
    </div>
  );

  return (
    <div className="dash-widget progress-summary-widget">
      <div className="widget-header">
        <span className="widget-label"><TrendingUp size={14} /> Progress</span>
        <button className="link-btn" onClick={() => navigate('/student/analytics')}>
          Full Report →
        </button>
      </div>
      <div className="progress-stats-list">
        <StatItem
          icon={BookOpen}
          label="Enrolled Courses"
          value={summary?.enrolled_courses ?? '—'}
          color="var(--accent-primary)"
        />
        <StatItem
          icon={Clock}
          label="Study Hours (Week)"
          value={`${summary?.study_time_week_hours ?? 0}h`}
          color="var(--accent-secondary)"
        />
        <StatItem
          icon={CheckSquare}
          label="Tasks Done (Week)"
          value={summary?.tasks_completed_week ?? '—'}
          color="var(--success)"
        />
      </div>
    </div>
  );
}
