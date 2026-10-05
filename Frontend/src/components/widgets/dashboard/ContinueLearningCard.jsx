import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, ChevronRight } from 'lucide-react';

function Skeleton() {
  return (
    <div className="dash-widget continue-learning-widget">
      <div className="widget-header">
        <div className="skel-line" style={{ width: '40%', height: 14 }} />
      </div>
      <div className="skel-line" style={{ width: '70%', height: 20, marginBottom: 8 }} />
      <div className="skel-line" style={{ width: '50%', height: 14, marginBottom: 20 }} />
      <div className="skel-bar" style={{ height: 6 }} />
    </div>
  );
}

export default function ContinueLearningCard({ data, isLoading, isError, onRetry }) {
  const navigate = useNavigate();

  if (isLoading) return <Skeleton />;

  if (isError) return (
    <div className="dash-widget continue-learning-widget widget-error">
      <p>Failed to load learning progress.</p>
      <button className="retry-btn" onClick={onRetry}>Retry</button>
    </div>
  );

  if (!data?.has_data) return (
    <div className="dash-widget continue-learning-widget widget-empty">
      <div className="empty-icon"><BookOpen size={32} /></div>
      <h3>Start Your Journey</h3>
      <p>You haven't started any courses yet. Explore what's available.</p>
      <button className="cta-btn" onClick={() => navigate('/student/courses')}>
        Browse Courses <ChevronRight size={16} />
      </button>
    </div>
  );

  const { course_name, last_topic, progress_pct, course_id } = data;

  return (
    <div className="dash-widget continue-learning-widget">
      <div className="widget-header">
        <span className="widget-label">
          <Play size={14} /> Continue Learning
        </span>
        <button className="link-btn" onClick={() => navigate(`/student/courses/${course_id}`)}>
          Open <ChevronRight size={14} />
        </button>
      </div>

      <h2 className="cl-course-name">{course_name}</h2>
      <p className="cl-topic">
        <span className="topic-pill">Currently learning</span>
        {last_topic}
      </p>

      <div className="cl-progress-row">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress_pct}%` }} />
        </div>
        <span className="progress-pct">{progress_pct}%</span>
      </div>

      <button className="resume-btn" onClick={() => navigate(`/student/courses/${course_id}`)}>
        <Play size={16} /> Resume Course
      </button>
    </div>
  );
}
