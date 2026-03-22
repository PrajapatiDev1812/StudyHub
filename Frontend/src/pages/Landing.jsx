import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-brand">
          <span>🎯</span> StudyHub
        </div>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content slide-up">
          <h1>Learn Smarter,<br /><span className="gradient-text">Not Harder</span></h1>
          <p>Your AI-powered study platform with courses, quizzes, progress tracking, and an intelligent assistant — all in one place.</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">Start Learning Free</Link>
            <Link to="/login" className="btn btn-secondary btn-lg">I have an account</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          {[
            { icon: '📚', title: 'Rich Courses', desc: 'Structured courses with subjects, topics, and multimedia content.' },
            { icon: '📝', title: 'Smart Quizzes', desc: 'Auto-graded MCQ tests with instant results and analytics.' },
            { icon: '📊', title: 'Progress Tracking', desc: 'Track your learning journey with detailed progress dashboards.' },
            { icon: '🤖', title: 'AI Assistant', desc: 'Get instant answers and AI-generated content summaries.' },
            { icon: '🔔', title: 'Notifications', desc: 'Stay up-to-date with real-time alerts and reminders.' },
            { icon: '🛡️', title: 'Secure & Fast', desc: 'JWT auth, rate limiting, and caching for a smooth experience.' },
          ].map((f, i) => (
            <div key={i} className="feature-card glass-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
