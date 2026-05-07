import { useEffect, useState } from 'react';
import api from '../../services/api';
import './StudentAnalyticsPage.css';

/* ── Lightweight SVG Charts ── */
function BarChart({ data, labels, height = 200 }) {
  if (!data || data.length === 0) return <div className="empty-chart">No data available</div>;
  const max = Math.max(...data, 1);
  return (
    <div className="svg-chart-container" style={{ height }}>
      <div className="svg-bars">
        {data.map((val, i) => {
          const pct = (val / max) * 100;
          return (
            <div key={i} className="svg-bar-col" title={`${labels[i]}: ${val}`}>
              <div className="svg-bar" style={{ height: `${pct}%` }}>
                <span className="bar-tooltip">{val}</span>
              </div>
              <span className="bar-label">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutChart({ data, labels, size = 160, stroke = 20 }) {
  if (!data || data.length === 0) return <div className="empty-chart">No data available</div>;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let currentOffset = 0;

  const colors = ['var(--accent-primary)', 'var(--accent-secondary)', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="donut-wrapper">
      <svg width={size} height={size} className="donut-svg">
        {data.map((val, i) => {
          const pct = val / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const offset = currentOffset;
          // eslint-disable-next-line react-hooks/immutability
          currentOffset -= dash;
          
          return (
            <circle
              key={i}
              cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={colors[i % colors.length]} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              className="donut-segment"
            />
          );
        })}
      </svg>
      <div className="donut-legend">
        {labels.map((lbl, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: colors[i % colors.length] }} />
            {lbl}: {data[i]}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    let start_date = new Date();
    
    if (dateRange === '7d') start_date.setDate(start_date.getDate() - 7);
    else if (dateRange === '15d') start_date.setDate(start_date.getDate() - 15);
    else if (dateRange === '1m') start_date.setMonth(start_date.getMonth() - 1);
    else if (dateRange === '3m') start_date.setMonth(start_date.getMonth() - 3);
    else if (dateRange === '6m') start_date.setMonth(start_date.getMonth() - 6);
    else if (dateRange === '1y') start_date.setFullYear(start_date.getFullYear() - 1);
    else start_date = new Date('2020-01-01'); // All
    
    const isoStart = start_date.toISOString().split('T')[0];
    
    api.get(`/student/analytics/all/?start_date=${isoStart}`)
      .then(res => setAnalytics(res.data))
      .catch(err => console.error("Failed to load analytics", err))
      .finally(() => setLoading(false));
  }, [dateRange]);

  if (loading) return <div className="spinner" />;

  const {
    summary,
    study_distribution,
    course_distribution,
    time_of_day,
    focus_mode,
    ai_insights,
    smart_insights
  } = analytics || {};

  return (
    <div className="analytics-page fade-in">
      <div className="analytics-header">
        <div>
          <h1>Learning Analytics</h1>
          <p>Detailed insights into your study habits and focus trends.</p>
        </div>
        <div className="range-filter">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="15d">Last 15 Days</option>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="analytics-summary-grid">
        <div className="summary-card glass-card">
          <div className="card-icon">⏱️</div>
          <div className="card-info">
            <span className="card-label">Total Study Time</span>
            <span className="card-value">{summary?.total_study_time_hours || 0} hrs</span>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="card-icon">🎯</div>
          <div className="card-info">
            <span className="card-label">Focus Sessions</span>
            <span className="card-value">{summary?.sessions_completed || 0}</span>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="card-icon">✅</div>
          <div className="card-info">
            <span className="card-label">Tasks & Content</span>
            <span className="card-value">{(summary?.tasks_completed || 0) + (summary?.content_completed || 0)}</span>
          </div>
        </div>
        <div className="summary-card glass-card premium-card">
          <div className="card-icon">⚡</div>
          <div className="card-info">
            <span className="card-label">Productivity Score</span>
            <span className="card-value">{summary?.productivity_score || 0}</span>
          </div>
        </div>
      </div>

      {/* ── Smart Insights ── */}
      <div className="smart-insights-container">
        {smart_insights?.map((insight, idx) => (
          <div key={idx} className={`insight-pill type-${insight.type}`}>
            <strong>{insight.title}:</strong> {insight.body}
          </div>
        ))}
      </div>

      <div className="charts-grid">
        {/* ── Study Distribution ── */}
        <div className="chart-card glass-card span-2">
          <h3>📅 Study Activity (Hours)</h3>
          {study_distribution?.study_hours?.reduce((a,b)=>a+b,0) > 0 ? (
            <BarChart data={study_distribution.study_hours} labels={study_distribution.labels} />
          ) : (
            <div className="empty-state">Start a Focus Mode session to see your study trends.</div>
          )}
        </div>

        {/* ── Focus Mode Analytics ── */}
        <div className="chart-card glass-card">
          <h3>🎯 Focus Mode Efficiency</h3>
          <div className="comparison-stats">
            <div className="stat-row">
              <span>Normal Mode</span>
              <strong>{focus_mode?.normal_mode?.completion_rate || 0}% completion</strong>
            </div>
            <div className="stat-row">
              <span>Strict Mode</span>
              <strong className="text-accent">{focus_mode?.strict_mode?.completion_rate || 0}% completion</strong>
            </div>
            <div className="stat-row text-muted">
              <span>Avg Duration</span>
              <span>{Math.max(focus_mode?.normal_mode?.avg_duration_min || 0, focus_mode?.strict_mode?.avg_duration_min || 0)} mins</span>
            </div>
          </div>
        </div>

        {/* ── Course Distribution ── */}
        <div className="chart-card glass-card">
          <h3>📚 Topics Explored</h3>
          {course_distribution?.values?.length > 0 ? (
            <DonutChart data={course_distribution.values} labels={course_distribution.labels} />
          ) : (
            <div className="empty-state">Enroll in courses to see your focus distribution.</div>
          )}
        </div>

        {/* ── Time of Day ── */}
        <div className="chart-card glass-card">
          <h3>🕐 Prime Study Time</h3>
          {time_of_day?.values?.reduce((a,b)=>a+b,0) > 0 ? (
            <DonutChart data={time_of_day.values} labels={time_of_day.labels} />
          ) : (
            <div className="empty-state">Complete study sessions to discover your most productive hours.</div>
          )}
        </div>

        {/* ── AI-Assisted Learning ── */}
        <div className="chart-card glass-card span-2 ai-card">
          <h3>🤖 AI-Assisted Learning</h3>
          {ai_insights?.total_interactions > 0 ? (
             <div className="ai-insights-content">
               <div className="ai-stat-big">
                 <span className="big-num">{ai_insights.total_interactions}</span>
                 <span className="big-label">Learning Interactions</span>
               </div>
               <div className="ai-topics">
                 <h4>Most Explored Topics</h4>
                 <div className="topic-tags">
                   {ai_insights.top_topics?.labels?.map((t, i) => (
                     <span key={i} className="topic-tag">{t}</span>
                   ))}
                 </div>
               </div>
             </div>
          ) : (
            <div className="empty-state">Use AI Assistant during study sessions to see learning insights.</div>
          )}
        </div>
      </div>
    </div>
  );
}
