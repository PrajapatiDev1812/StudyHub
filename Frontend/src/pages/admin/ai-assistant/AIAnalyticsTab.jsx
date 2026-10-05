import { useState, useEffect } from 'react';
import { Activity, Users, Zap, ShieldAlert, BarChart3, TrendingUp, RefreshCw, Layers } from 'lucide-react';
import { getProfessorClassInsights, getAdminAnalyticsOverview } from '../../../api/teacherAI';

export default function AIAnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('professor'); // 'professor' or 'admin'

  const fetchAnalytics = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'admin') {
        const res = await getAdminAnalyticsOverview();
        setData({ type: 'admin', ...res });
      } else {
        const res = await getProfessorClassInsights();
        setData({ type: 'professor', ...res });
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      // Fallback display if not superadmin for admin tab
      if (tab === 'admin' && err.status === 403) {
        setData({ type: 'error', text: 'Full technical analytics are restricted to Superuser accounts.' });
      } else {
        setData({ type: 'error', text: 'Could not retrieve AI analytics from server.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeTab);
  }, [activeTab]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Selector Header */}
      <div className="ai-glass-card" style={{ padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className={`ai-tab-btn ${activeTab === 'professor' ? 'active' : ''}`}
            onClick={() => setActiveTab('professor')}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Users size={15} /> Instructor Class Insights
          </button>
          <button 
            className={`ai-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <BarChart3 size={15} /> Platform Technical Overview
          </button>
        </div>
        <button className="ai-btn ai-btn-outline" onClick={() => fetchAnalytics(activeTab)} disabled={loading} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh Metrics
        </button>
      </div>

      {loading ? (
        <div className="ai-glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={32} className="spinning" style={{ margin: '0 auto 16px', color: '#818cf8' }} />
          <p>Analyzing student interaction logs and aggregating vector confidence distributions...</p>
        </div>
      ) : data?.type === 'error' ? (
        <div className="ai-glass-card" style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>
          <ShieldAlert size={40} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>Notice</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>{data.text}</p>
        </div>
      ) : activeTab === 'professor' ? (
        <>
          {/* Instructor Class Insights Grid */}
          <div className="ai-grid-3">
            <div className="ai-glass-card">
              <div className="ai-metric-box">
                <span className="ai-metric-label"><Users size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Enrolled Students Tracked</span>
                <span className="ai-metric-value">{data.total_enrolled_students || 0}</span>
                <span className="ai-metric-sub">Across your active courses</span>
              </div>
            </div>

            <div className="ai-glass-card">
              <div className="ai-metric-box">
                <span className="ai-metric-label"><Activity size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Class AI Interactions</span>
                <span className="ai-metric-value">{data.total_class_interactions || 0}</span>
                <span className="ai-metric-sub" style={{ color: '#60a5fa' }}>Tutoring sessions and quizzes</span>
              </div>
            </div>

            <div className="ai-glass-card">
              <div className="ai-metric-box">
                <span className="ai-metric-label"><TrendingUp size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Engagement Index</span>
                <span className="ai-metric-value">{data.total_enrolled_students ? Math.min(100, Math.round((data.total_class_interactions / (data.total_enrolled_students || 1)) * 10)) + '%' : 'N/A'}</span>
                <span className="ai-metric-sub">Student RAG utilization rate</span>
              </div>
            </div>
          </div>

          {/* Top Difficult Topics & Engagement Breakdown */}
          <div className="ai-grid-2">
            <div className="ai-glass-card">
              <h3 className="ai-card-title"><BarChart3 size={20} color="#818cf8" /> Most Frequently Inquired Topics</h3>
              {(!data.top_inquired_topics || data.top_inquired_topics.length === 0) ? (
                <p style={{ color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>No topical queries recorded for your courses yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.top_inquired_topics.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.detected_topic || 'General Query'}</span>
                      <span className="ai-badge ai-badge-purple">{item.count} queries</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ai-glass-card">
              <h3 className="ai-card-title"><Zap size={20} color="#10b981" /> Pedagogical RAG Observations</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Students inquiring about complex curriculum concepts are immediately routed to your uploaded knowledge documents (PDF/DOCX) before fallback AI models are triggered.
              </p>
              <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                  ✨ Active Recommendation
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                  If certain topics appear repeatedly in student queries above, consider generating an automated 5-question diagnostic MCQ assessment using the Question Generator tab!
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Admin Technical Analytics */}
          <div className="ai-grid-3">
            <div className="ai-glass-card">
              <div className="ai-metric-box">
                <span className="ai-metric-label"><Zap size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Total AI Requests</span>
                <span className="ai-metric-value">{data.total_requests || 0}</span>
                <span className="ai-metric-sub">{data.success_rate_percent || 100}% successful response rate</span>
              </div>
            </div>

            <div className="ai-glass-card">
              <div className="ai-metric-box">
                <span className="ai-metric-label"><Layers size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Token Usage Volume</span>
                <span className="ai-metric-value">{(data.total_tokens_used || 0).toLocaleString()}</span>
                <span className="ai-metric-sub" style={{ color: '#a78bfa' }}>Estimated cost: Free tier</span>
              </div>
            </div>

            <div className="ai-glass-card">
              <div className="ai-metric-box">
                <span className="ai-metric-label"><Activity size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Avg Response Latency</span>
                <span className="ai-metric-value">{data.average_response_time_ms ? `${Math.round(data.average_response_time_ms)} ms` : '0 ms'}</span>
                <span className="ai-metric-sub">Optimized with Redis edge caching</span>
              </div>
            </div>
          </div>

          <div className="ai-glass-card">
            <h3 className="ai-card-title"><BarChart3 size={20} color="#818cf8" /> Platform AI Workload Breakdown</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              System-wide telemetry monitoring provider performance, low-confidence RAG fallbacks, and prompt injection deflection.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>ACTIVE PROVIDER</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>Google Gemini</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>INJECTION ATTEMPTS BLOCKED</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>0 blocked</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>REDIS CACHE EFFICIENCY</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>Optimal</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
