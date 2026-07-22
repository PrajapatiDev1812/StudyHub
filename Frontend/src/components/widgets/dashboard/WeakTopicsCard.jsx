import { Brain, TrendingUp } from 'lucide-react';

/**
 * WeakTopicsCard
 *
 * Reads from the /api/dashboard/insights/ response.
 * If insights contain objects with { topic, score } structure, they are rendered as weak topic cards.
 * If insights are plain strings, they are shown as insight bullets.
 * Future: dedicated /api/dashboard/weak-topics/ endpoint can replace the insights prop.
 */

function Skeleton() {
  return (
    <div className="dash-widget weak-topics-widget">
      <div className="skel-line" style={{ width: '50%', height: 14, marginBottom: 16 }} />
      {[1, 2].map(i => (
        <div key={i} className="weak-topic-skel">
          <div className="skel-line" style={{ width: '60%', height: 14, marginBottom: 6 }} />
          <div className="skel-bar" style={{ height: 6 }} />
        </div>
      ))}
    </div>
  );
}

export default function WeakTopicsCard({ insights, isLoading, isError, onRetry }) {
  if (isLoading) return <Skeleton />;

  if (isError) return (
    <div className="dash-widget weak-topics-widget widget-error">
      <p>Could not load analysis.</p>
      <button className="retry-btn" onClick={onRetry}>Retry</button>
    </div>
  );

  // Try to detect structured weak topic objects
  const structuredTopics = Array.isArray(insights)
    ? insights.filter(i => typeof i === 'object' && i?.topic && i?.score !== undefined)
    : [];

  const stringInsights = Array.isArray(insights)
    ? insights.filter(i => typeof i === 'string')
    : [];

  const hasData = structuredTopics.length > 0 || stringInsights.length > 0;

  return (
    <div className="dash-widget weak-topics-widget">
      <div className="widget-header">
        <span className="widget-label"><Brain size={14} /> Weak Topic Analysis</span>
      </div>

      {!hasData ? (
        <div className="widget-empty-inline">
          <TrendingUp size={24} />
          <p>No weak topics identified yet</p>
          <span className="empty-sub">Take quizzes to unlock AI analysis</span>
        </div>
      ) : (
        <div className="weak-topics-list">
          {structuredTopics.slice(0, 3).map((item, i) => (
            <div key={i} className="weak-topic-item">
              <div className="weak-topic-header">
                <span className="weak-topic-name">{item.topic}</span>
                <span className="weak-topic-score" style={{ color: item.score < 60 ? 'var(--danger)' : 'var(--warning)' }}>
                  {item.score}%
                </span>
              </div>
              <div className="weak-topic-bar-track">
                <div
                  className="weak-topic-bar-fill"
                  style={{
                    width: `${item.score}%`,
                    background: item.score < 60 ? 'var(--danger)' : 'var(--warning)'
                  }}
                />
              </div>
            </div>
          ))}

          {stringInsights.slice(0, 3).map((insight, i) => (
            <div key={`s-${i}`} className="insight-bullet-item">
              <span className="insight-dot" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
