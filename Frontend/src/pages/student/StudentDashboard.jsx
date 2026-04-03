import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ProgressGraph, { TABS } from './ProgressGraph';
import './Dashboard.css';

/* ── Circular Progress Ring (pure SVG) ── */
function ProgressRing({ percent = 0, size = 140, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg className="progress-ring" width={size} height={size}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--border-color)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="url(#progressGradient)" strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-primary)" />
          <stop offset="100%" stopColor="var(--accent-secondary)" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="progress-ring-text" style={{ fill: 'var(--text-primary)' }}>
        {percent}%
      </text>
    </svg>
  );
}

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [graphOpen, setGraphOpen] = useState(false);

  // Graph state lifted up to sync with pie chart
  const [activeTab, setActiveTab] = useState(0); 
  const [periodData, setPeriodData] = useState(null);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoadingOverview(false));
  }, []);

  useEffect(() => {
    setLoadingPeriod(true);
    api.get(`/progress-history/?days=${activeTab}`)
      .then(res => setPeriodData(res.data))
      .catch(() => setPeriodData(null))
      .finally(() => setLoadingPeriod(false));
  }, [activeTab]);

  if (loadingOverview) return <div className="spinner" />;

  // Overview stats
  const completed = data?.completed_content_count || 0;
  const total = data?.total_content_to_complete || 0;

  // Sync pie chart and progress bar with either total or period gained based on tab
  const activeTabLabel = TABS.find(t => t.days === activeTab)?.label || 'All';
  const isAllTime = activeTab === 0;

  const displayProgress = periodData?.period_progress_gained ?? data?.overall_progress_percentage ?? 0;
  const displayCompleted = periodData?.period_completed ?? completed;
  const displayTotal = periodData?.total_content ?? total;
  const pieChartTitle = isAllTime ? "OVERALL PROGRESS" : `${activeTabLabel.toUpperCase()} PROGRESS`;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p>Your learning progress at a glance</p>
      </div>

      <div className="stats-grid">
        <div 
          className="stat-card clickable-stat"
          onClick={() => navigate('/student/my-courses')}
        >
          <div className="stat-label">Enrolled Courses</div>
          <div className="stat-value">{data?.enrolled_courses_count || 0}</div>
        </div>
        <div 
          className="stat-card clickable-stat"
          onClick={() => navigate('/student/completed-content')}
        >
          <div className="stat-label">Completed Content</div>
          <div className="stat-value">{completed}</div>
        </div>
        <div 
          className="stat-card clickable-stat"
          onClick={() => navigate('/student/total-content')}
        >
          <div className="stat-label">Total Content</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card stat-card-ring">
          <div className="stat-label">{pieChartTitle}</div>
          <ProgressRing percent={displayProgress} size={100} stroke={8} />
        </div>
      </div>

      {/* ── Clickable Overall Progress → expands graph ── */}
      <div className="glass-card progress-section">
        <div
          className="progress-section-header clickable"
          onClick={() => setGraphOpen(!graphOpen)}
        >
          <div>
            <h3>📈 {isAllTime ? "Overall Progress" : `${activeTabLabel} Progress`}</h3>
            <p className="text-muted">{displayCompleted} of {displayTotal} content items completed</p>
          </div>
          <span className={`expand-arrow ${graphOpen ? 'open' : ''}`}>▼</span>
        </div>

        <div className="progress-bar-bg" style={{ marginTop: 12 }}>
          <div className="progress-bar-fill" style={{ width: `${displayProgress}%` }} />
        </div>

        {/* Expandable Graph */}
        <div className={`graph-expand ${graphOpen ? 'open' : ''}`}>
          {graphOpen && (
            <ProgressGraph 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              points={periodData?.history || []} 
              loading={loadingPeriod} 
            />
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>🕐 Recent Activity</h3>
        {data?.recent_activity?.length > 0 ? (
          <div className="activity-list">
            {data.recent_activity.map((item, i) => (
              <div key={i} className="activity-item">
                <span className="activity-icon">✅</span>
                <div>
                  <span className="activity-title">{item.content_title}</span>
                  <span className="activity-time">
                    {new Date(item.completed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No activity yet. Start learning!</p>
        )}
      </div>
    </div>
  );
}
