/**
 * EngagementChart.jsx
 * Admin/Teacher Dashboard — Student Engagement Analytics
 *
 * Renders two sections:
 * 1. 7-day grouped bar chart (active students / material views / AI usage)
 * 2. Topic performance progress bars
 *
 * Uses ONLY pure CSS — no external chart libraries.
 * Matches the existing WeeklyActivityChart.jsx pattern.
 *
 * Props:
 *   activityData      — { labels, active_students, material_views, ai_usage }
 *   topicPerformance  — [{ topic, percentage }]
 *   isLoading         — boolean
 *   isError           — boolean
 *   onRetry           — function
 */

import { BarChart2, AlertCircle, TrendingUp } from 'lucide-react';

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="admin-widget">
      <div className="admin-skel" style={{ height: 14, width: '40%', marginBottom: 20 }} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130 }}>
        {[70, 90, 50, 80, 100, 60, 40].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%' }}>
            <div className="admin-skel" style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
            <div className="admin-skel" style={{ flex: 1, height: `${Math.max(h - 20, 10)}%`, borderRadius: '4px 4px 0 0' }} />
            <div className="admin-skel" style={{ flex: 1, height: `${Math.max(h - 40, 5)}%`, borderRadius: '4px 4px 0 0' }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div className="admin-skel" style={{ height: 10, width: `${70 - i * 10}%`, marginBottom: 6 }} />
            <div className="admin-skel" style={{ height: 6, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EngagementChart({
  activityData,
  topicPerformance = [],
  isLoading,
  isError,
  onRetry,
}) {
  if (isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="admin-widget">
        <div className="admin-error-state">
          <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
          <p>Failed to load analytics data.</p>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  const labels  = activityData?.labels          || [];
  const students = activityData?.active_students || [];
  const views    = activityData?.material_views  || [];
  const ai       = activityData?.ai_usage        || [];

  // Normalise all bars against the single max across all series
  const allVals = [...students, ...views, ...ai];
  const max     = Math.max(...allVals, 1);

  const hasData = allVals.some(v => v > 0);

  return (
    <div className="admin-widget admin-anim-up">
      {/* ── Section 1: Activity Chart ── */}
      <div className="admin-section-header">
        <div className="admin-section-title">
          <BarChart2 size={14} /> Student Activity — This Week
        </div>
      </div>

      {!hasData ? (
        <div className="admin-empty" style={{ padding: '1.5rem 1rem' }}>
          <BarChart2 size={28} />
          <p className="admin-empty-title">No activity data yet</p>
          <p className="admin-empty-sub">Student activity will appear once students start engaging with your materials.</p>
        </div>
      ) : (
        <>
          <div className="admin-chart-bars-group">
            {labels.map((label, i) => {
              const sPct = Math.max((students[i] / max) * 100, 2);
              const vPct = Math.max((views[i]    / max) * 100, 2);
              const aPct = Math.max((ai[i]       / max) * 100, 2);
              return (
                <div key={i} className="admin-chart-col">
                  <div className="admin-chart-bars">
                    <div
                      className="admin-chart-bar bar-students"
                      style={{ height: `${sPct}%` }}
                      title={`Active students: ${students[i]}`}
                    />
                    <div
                      className="admin-chart-bar bar-views"
                      style={{ height: `${vPct}%` }}
                      title={`Material views: ${views[i]}`}
                    />
                    <div
                      className="admin-chart-bar bar-ai"
                      style={{ height: `${aPct}%` }}
                      title={`AI queries: ${ai[i]}`}
                    />
                  </div>
                  <span className="admin-chart-label">{label}</span>
                </div>
              );
            })}
          </div>

          <div className="admin-chart-legend">
            <div className="admin-legend-dot">
              <div className="admin-legend-dot-icon students" />
              Active Students
            </div>
            <div className="admin-legend-dot">
              <div className="admin-legend-dot-icon views" />
              Material Views
            </div>
            <div className="admin-legend-dot">
              <div className="admin-legend-dot-icon ai" />
              AI Usage
            </div>
          </div>
        </>
      )}

      {/* ── Divider ── */}
      <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.25rem 0' }} />

      {/* ── Section 2: Topic Performance ── */}
      <div className="admin-section-header" style={{ marginBottom: '0.875rem' }}>
        <div className="admin-section-title">
          <TrendingUp size={14} /> Topic Performance
        </div>
      </div>

      {topicPerformance.length === 0 ? (
        <div className="admin-empty" style={{ padding: '1rem' }}>
          <TrendingUp size={24} />
          <p className="admin-empty-sub">No topic data available yet.</p>
        </div>
      ) : (
        <div className="admin-topic-list">
          {topicPerformance.map((item) => (
            <div key={item.id ?? item.topic} className="admin-topic-row">
              <div className="admin-topic-row-header">
                <span className="admin-topic-name">{item.topic}</span>
                <span className="admin-topic-pct">{item.percentage}%</span>
              </div>
              <div className="admin-topic-bar-track">
                <div
                  className="admin-topic-bar-fill"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
