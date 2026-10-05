import { useNavigate } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';

function Skeleton() {
  return (
    <div className="dash-widget weekly-chart-widget">
      <div className="skel-line" style={{ width: '40%', height: 14, marginBottom: 20 }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
        {[60, 90, 40, 75, 100, 30, 55].map((h, i) => (
          <div key={i} className="skel-bar-col">
            <div className="skel-bar" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeeklyActivityChart({ data, isLoading, isError, onRetry }) {
  const navigate = useNavigate();

  if (isLoading) return <Skeleton />;

  if (isError) return (
    <div className="dash-widget weekly-chart-widget widget-error">
      <p>Failed to load activity data.</p>
      <button className="retry-btn" onClick={onRetry}>Retry</button>
    </div>
  );

  const hours = data?.study_hours || [];
  const labels = data?.labels || [];
  const hasData = hours.length > 0 && hours.some(h => h > 0);
  const max = Math.max(...hours, 1);

  return (
    <div className="dash-widget weekly-chart-widget">
      <div className="widget-header">
        <span className="widget-label"><BarChart2 size={14} /> Activity This Week</span>
        <button className="link-btn" onClick={() => navigate('/student/analytics')}>
          Full Analytics →
        </button>
      </div>

      {!hasData ? (
        <div className="widget-empty-inline">
          <BarChart2 size={28} />
          <p>No activity recorded yet</p>
          <span className="empty-sub">Start a Focus session to see your activity chart</span>
        </div>
      ) : (
        <div className="chart-container" role="img" aria-label="Weekly study hours bar chart">
          <div className="chart-bars">
            {hours.map((val, i) => {
              const pct = (val / max) * 100;
              return (
                <div key={i} className="chart-col">
                  <div className="chart-bar-wrapper" title={`${val}h`}>
                    <div
                      className="chart-bar"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="chart-label">{labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
