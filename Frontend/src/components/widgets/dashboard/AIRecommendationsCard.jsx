import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

function Skeleton() {
  return (
    <div className="dash-widget ai-recommendations-widget">
      <div className="skel-line" style={{ width: '50%', height: 14, marginBottom: 12 }} />
      <div className="skel-line" style={{ width: '90%', height: 14, marginBottom: 8 }} />
      <div className="skel-line" style={{ width: '80%', height: 14, marginBottom: 8 }} />
      <div className="skel-line" style={{ width: '60%', height: 14 }} />
    </div>
  );
}

export default function AIRecommendationsCard({ data, insights, isLoading, isError, onRetry }) {
  const navigate = useNavigate();

  if (isLoading) return <Skeleton />;

  if (isError) return (
    <div className="dash-widget ai-recommendations-widget widget-error">
      <p>Could not load AI recommendations.</p>
      <button className="retry-btn" onClick={onRetry}>Retry</button>
    </div>
  );

  const hasAiData = data?.has_data;
  const hasInsights = insights && insights.length > 0;

  if (!hasAiData && !hasInsights) return (
    <div className="dash-widget ai-recommendations-widget widget-empty">
      <div className="ai-empty-icon"><Sparkles size={28} /></div>
      <p className="ai-empty-text">Complete activities to unlock personalized AI recommendations.</p>
      <button className="cta-btn-ghost" onClick={() => navigate('/student/ai-chat')}>
        <Bot size={14} /> Ask AI Tutor
      </button>
    </div>
  );

  return (
    <div className="dash-widget ai-recommendations-widget">
      <div className="widget-header">
        <span className="widget-label ai-label">
          <Bot size={14} />
          <span>AI Recommendations</span>
          <span className="ai-pulse-dot" />
        </span>
      </div>

      {hasAiData && (
        <div className="ai-main-suggestion">
          <Lightbulb size={16} className="ai-bulb" />
          <p>{data.message}</p>
        </div>
      )}

      {hasInsights && (
        <ul className="ai-insights-list">
          {insights.slice(0, 3).map((insight, i) => (
            <li key={i} className="ai-insight-item">
              <span className="insight-dot" />
              {insight}
            </li>
          ))}
        </ul>
      )}

      <button className="ai-cta" onClick={() => navigate('/student/ai-chat')}>
        Ask AI Tutor <ArrowRight size={14} />
      </button>
    </div>
  );
}
