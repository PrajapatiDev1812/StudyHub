import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';

/* ── Lightweight SVG Bar Chart for Dashboard ── */
function MiniBarChart({ data, labels, height = 120 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="mini-chart-container" style={{ height }}>
      <div className="mini-chart-bars">
        {data.map((val, i) => {
          const pct = (val / max) * 100;
          return (
            <div key={i} className="mini-chart-col">
              <div className="mini-chart-bar" style={{ height: `${pct}%` }}></div>
              <span className="mini-chart-label">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [recent, setRecent] = useState([]);
  const [continueLearning, setContinueLearning] = useState(null);
  const [insights, setInsights] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sumRes, weekRes, recRes, contRes, insRes, aiRes] = await Promise.all([
          api.get('/dashboard/summary/'),
          api.get('/dashboard/weekly-activity/'),
          api.get('/dashboard/recent-activity/'),
          api.get('/dashboard/continue-learning/'),
          api.get('/dashboard/insights/'),
          api.get('/dashboard/ai-summary/')
        ]);
        
        setSummary(sumRes.data);
        setWeekly(weekRes.data);
        setRecent(recRes.data);
        setContinueLearning(contRes.data);
        setInsights(insRes.data);
        setAiSummary(aiRes.data);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="dashboard-action-center fade-in">
      <div className="page-header">
        <h1>Daily Action Center</h1>
        <p>Your learning hub for today. Pick up where you left off or start something new.</p>
      </div>

      {/* ── 1. Top Summary Cards (Today / This Week) ── */}
      <div className="dashboard-summary-grid">
        <div className="dash-card stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <span className="stat-label">Enrolled Courses</span>
            <span className="stat-val">{summary?.enrolled_courses || 0}</span>
          </div>
        </div>
        <div className="dash-card stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <span className="stat-label">Study Time (Week)</span>
            <span className="stat-val">{summary?.study_time_week_hours || 0}h</span>
          </div>
        </div>
        <div className="dash-card stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-label">Tasks Done (Week)</span>
            <span className="stat-val">{summary?.tasks_completed_week || 0}</span>
          </div>
        </div>
        <div className="dash-card stat-card highlight-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <span className="stat-label">Current Streak</span>
            <span className="stat-val">{summary?.current_streak || 0} Days</span>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Actions Panel ── */}
      <div className="dash-card quick-actions-panel">
        <h3>⚡ Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => navigate('/student/lms-panel')}>
            <span className="btn-icon">📚</span> Open LMS Panel
          </button>
          <button className="action-btn" onClick={() => navigate('/student/focus')}>
            <span className="btn-icon">🎯</span> Start Focus Mode
          </button>
          <button className="action-btn" onClick={() => navigate('/student/ai-chat')}>
            <span className="btn-icon">🤖</span> Open AI Assistant
          </button>
          <button className="action-btn" onClick={() => navigate('/student/courses')}>
            <span className="btn-icon">🔍</span> Browse Courses
          </button>
          <button className="action-btn" onClick={() => navigate('/student/analytics')}>
            <span className="btn-icon">📈</span> View Analytics
          </button>
        </div>
      </div>

      <div className="dashboard-main-grid">
        {/* ── 3. Continue Learning Section ── */}
        <div className="dash-card continue-learning-card">
          <h3>▶️ Continue Learning</h3>
          {continueLearning?.has_data ? (
            <div className="cl-content">
              <div className="cl-details">
                <span className="cl-course">{continueLearning.course_name}</span>
                <span className="cl-topic">Last viewed: {continueLearning.last_topic}</span>
              </div>
              <div className="cl-progress">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${continueLearning.progress_pct}%` }}></div>
                </div>
                <span className="progress-text">{continueLearning.progress_pct}% Completed</span>
              </div>
              <button className="btn btn-primary mt-3" onClick={() => navigate(`/student/courses/${continueLearning.course_id}`)}>
                Resume Course
              </button>
            </div>
          ) : (
            <div className="empty-dash-state">
              <p>You haven't started any courses yet.</p>
              <button className="btn btn-outline" onClick={() => navigate('/student/courses')}>Explore Courses</button>
            </div>
          )}
        </div>

        {/* ── 5. Smart Insights ── */}
        <div className="dash-card smart-insights-card">
          <h3>💡 Smart Insights</h3>
          {insights && insights.length > 0 ? (
            <div className="insights-list">
              {insights.map((insight, i) => (
                <div key={i} className="insight-item">
                  <span className="bullet">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-dash-state">
              <p>Complete tasks and sessions to unlock personalized insights.</p>
            </div>
          )}
        </div>

        {/* ── 4. Weekly Activity Preview ── */}
        <div className="dash-card weekly-activity-card">
          <div className="card-header-flex">
            <h3>📅 Activity This Week</h3>
            <button className="link-btn" onClick={() => navigate('/student/analytics')}>Full Analytics →</button>
          </div>
          {weekly && weekly.study_hours && weekly.study_hours.reduce((a,b)=>a+b,0) > 0 ? (
            <MiniBarChart data={weekly.study_hours} labels={weekly.labels} />
          ) : (
            <div className="empty-dash-state" style={{ height: 120 }}>
              <p>Start a Focus session to see your activity.</p>
            </div>
          )}
        </div>

        {/* ── 6. AI Assistant Summary ── */}
        <div className="dash-card ai-summary-card">
          <h3>🤖 AI Assistant</h3>
          {aiSummary?.has_data ? (
            <div className="ai-summary-content">
              <div className="ai-top-topic">
                <span>Top Topic:</span>
                <strong>{aiSummary.top_topic}</strong>
              </div>
              <p className="ai-suggestion">{aiSummary.message}</p>
              <button className="btn btn-outline btn-sm mt-3" onClick={() => navigate('/student/ai-chat')}>
                Ask Another Question
              </button>
            </div>
          ) : (
            <div className="empty-dash-state">
              <p>{aiSummary?.message || "Use the AI Assistant to get insights."}</p>
              <button className="btn btn-outline" onClick={() => navigate('/student/ai-chat')}>Open AI Chat</button>
            </div>
          )}
        </div>

        {/* ── 7. Recent Activity List ── */}
        <div className="dash-card recent-activity-card span-full">
          <h3>⏱️ Recent Actions</h3>
          {recent && recent.length > 0 ? (
            <div className="recent-timeline">
              {recent.map((item, i) => (
                <div key={i} className={`timeline-item type-${item.type}`}>
                  <div className="timeline-icon">
                    {item.type === 'focus' ? '🎯' : item.type === 'task' ? '✅' : '🤖'}
                  </div>
                  <div className="timeline-content">
                    <strong>{item.title}</strong>
                    <span className="timeline-time">{new Date(item.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-dash-state">
              <p>No recent activity. Start a focus session or complete a task!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
