import { useAuth } from '../../../context/AuthContext';
import { Flame, Trophy, BookOpen } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getStudentName(user) {
  if (!user) return 'Student';
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (user.full_name) return user.full_name;
  return user.username || 'Student';
}

function CircularProgress({ percentage = 0, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border-color)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--accent-primary)" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className="circular-progress-label">{percentage}%</div>
    </div>
  );
}

export default function WelcomeSection({ summary, isLoading }) {
  const { user } = useAuth();
  const name = getStudentName(user);
  const greeting = getGreeting();
  const streak = summary?.current_streak ?? 0;
  const enrolled = summary?.enrolled_courses ?? 0;
  const studyTime = summary?.study_time_week_hours ?? 0;

  return (
    <div className="welcome-section">
      <div className="welcome-left">
        <p className="welcome-greeting">{greeting} 👋</p>
        <h1 className="welcome-name">{name}</h1>
        <p className="welcome-subtitle">
          {enrolled > 0
            ? `You're enrolled in ${enrolled} course${enrolled !== 1 ? 's' : ''}. Keep going!`
            : "Start your learning journey today."}
        </p>
        <div className="welcome-badges">
          <div className="welcome-badge badge-fire">
            <Flame size={14} />
            <span>{streak} Day Streak</span>
          </div>
          <div className="welcome-badge badge-book">
            <BookOpen size={14} />
            <span>{studyTime}h This Week</span>
          </div>
        </div>
      </div>

      <div className="welcome-right">
        {isLoading ? (
          <div className="skel-circle" style={{ width: 80, height: 80, borderRadius: '50%' }} />
        ) : (
          <div className="welcome-progress-ring">
            <CircularProgress percentage={Math.min(Math.round((summary?.tasks_completed_week || 0) * 10), 100)} />
            <p className="welcome-ring-label">Weekly<br/>Progress</p>
          </div>
        )}
      </div>
    </div>
  );
}
