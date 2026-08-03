/**
 * AIInsightsCard.jsx
 * Admin/Teacher Dashboard — AI Assistant Insights Panel
 *
 * Displays:
 * - Total AI queries answered + quizzes generated (stat boxes)
 * - Top 3 most-asked topics with rank indicators
 * - AI content suggestion in amber-tinted box
 *
 * Props:
 *   insights     — { total_queries_answered, quizzes_generated, most_asked_topics, suggestion }
 *   isLoading    — boolean
 *   isError      — boolean
 *   onRetry      — function
 */

import { Sparkles, Lightbulb, AlertCircle } from 'lucide-react';

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="admin-widget">
      <div className="admin-skel" style={{ height: 14, width: '50%', marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="admin-skel" style={{ height: 64, borderRadius: 10 }} />
        <div className="admin-skel" style={{ height: 64, borderRadius: 10 }} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <div className="admin-skel" style={{ width: 20, height: 20, borderRadius: '50%' }} />
          <div className="admin-skel" style={{ flex: 1, height: 10 }} />
          <div className="admin-skel" style={{ width: 40, height: 10 }} />
        </div>
      ))}
      <div className="admin-skel" style={{ height: 72, borderRadius: 10, marginTop: 12 }} />
    </div>
  );
}

export default function AIInsightsCard({ insights, isLoading, isError, onRetry }) {
  if (isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="admin-widget">
        <div className="admin-error-state">
          <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
          <p>Failed to load AI insights.</p>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  const totalQueries  = insights?.total_queries_answered ?? 0;
  const quizzes       = insights?.quizzes_generated      ?? 0;
  const mostAsked     = insights?.most_asked_topics      ?? [];
  const suggestion    = insights?.suggestion;

  return (
    <div className="admin-widget admin-anim-up">
      {/* ── Header ── */}
      <div className="admin-section-header">
        <div className="admin-section-title">
          <Sparkles size={14} /> AI Assistant Insights
        </div>
      </div>

      {/* ── AI Stats Row ── */}
      <div className="admin-ai-stats">
        <div className="admin-ai-stat-box">
          <div className="val">
            {totalQueries >= 1000
              ? `${(totalQueries / 1000).toFixed(1)}k`
              : totalQueries}
          </div>
          <div className="lbl">Queries Answered</div>
        </div>
        <div className="admin-ai-stat-box">
          <div className="val">{quizzes}</div>
          <div className="lbl">Quizzes Generated</div>
        </div>
      </div>

      {/* ── Most Asked Topics ── */}
      {mostAsked.length > 0 && (
        <>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-muted)',
              marginBottom: '0.6rem',
            }}
          >
            Most Asked Topics
          </div>
          <div className="admin-ai-topics">
            {mostAsked.slice(0, 3).map((item, idx) => (
              <div key={idx} className="admin-ai-topic-row">
                <div className="admin-ai-rank">{idx + 1}</div>
                <span className="admin-ai-topic-name">{item.topic}</span>
                <span className="admin-ai-query-count">{item.query_count} queries</span>
              </div>
            ))}
          </div>
        </>
      )}

      {mostAsked.length === 0 && (
        <div className="admin-empty" style={{ padding: '1rem 0' }}>
          <Sparkles size={24} />
          <p className="admin-empty-sub">No AI activity recorded yet.</p>
        </div>
      )}

      {/* ── AI Suggestion Box ── */}
      {suggestion && (
        <div className="admin-ai-suggestion">
          <Lightbulb size={18} className="admin-ai-suggestion-icon" />
          <div>
            <div className="admin-ai-suggestion-title">{suggestion.title}</div>
            <div className="admin-ai-suggestion-body">{suggestion.body}</div>
          </div>
        </div>
      )}
    </div>
  );
}
