import { Target, Coffee } from 'lucide-react';

// Configurable constant — replace with API value when backend support is added
export const DAILY_STUDY_GOAL_MINUTES = 90;

function Skeleton() {
  return (
    <div className="dash-widget daily-goal-widget">
      <div className="skel-line" style={{ width: '50%', height: 14, marginBottom: 16 }} />
      <div className="skel-line" style={{ width: '80%', height: 36, marginBottom: 12 }} />
      <div className="skel-bar" style={{ height: 8 }} />
    </div>
  );
}

export default function DailyGoalCard({ studyHoursToday = 0, isLoading }) {
  if (isLoading) return <Skeleton />;

  const completedMinutes = Math.round(studyHoursToday * 60);
  const goalMinutes = DAILY_STUDY_GOAL_MINUTES;
  const pct = Math.min(Math.round((completedMinutes / goalMinutes) * 100), 100);
  const isComplete = pct >= 100;

  return (
    <div className={`dash-widget daily-goal-widget ${isComplete ? 'goal-complete' : ''}`}>
      <div className="widget-header">
        <span className="widget-label">
          <Target size={14} /> Today's Goal
        </span>
        {isComplete && <span className="goal-badge">🎉 Done!</span>}
      </div>

      <div className="goal-time-display">
        <span className="goal-done">{completedMinutes}</span>
        <span className="goal-sep"> / </span>
        <span className="goal-total">{goalMinutes} min</span>
      </div>

      <div className="goal-track">
        <div
          className={`goal-fill ${isComplete ? 'fill-complete' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="goal-sub">
        {isComplete
          ? "You've hit your daily study goal!"
          : `${goalMinutes - completedMinutes} minutes remaining`}
      </p>

      {completedMinutes === 0 && (
        <p className="goal-hint">
          <Coffee size={13} /> Start a Focus session to track time
        </p>
      )}
    </div>
  );
}
