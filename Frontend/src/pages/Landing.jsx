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
          <Link to="/login" className="landing-btn landing-btn-secondary" style={{padding: '10px 24px', fontSize: '0.95rem'}}>Sign In</Link>
          <Link to="/register" className="landing-btn landing-btn-primary" style={{padding: '10px 24px', fontSize: '0.95rem'}}>Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content slide-up">
          <h1>Learn Smarter,<br /><span className="gradient-text">Not Harder</span></h1>
          <p>Your AI-powered study platform with courses, quizzes, progress tracking, and an intelligent assistant — all in one place.</p>
          <div className="hero-buttons">
            <Link to="/register" className="landing-btn landing-btn-primary">Start Learning Free</Link>
            <Link to="/login" className="landing-btn landing-btn-secondary">I have an account</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          {[
            { icon: '📚', title: 'Rich Courses', desc: 'Structured courses with subjects, topics, and multimedia content tailored to your learning pace.' },
            { icon: '📝', title: 'Smart Quizzes', desc: 'Auto-graded MCQ tests with instant results, actionable feedback, and detailed performance analytics.' },
            { icon: '📊', title: 'Progress Tracking', desc: 'Track your entire learning journey with beautiful, data-rich progress dashboards and insights.' },
            { icon: '🤖', title: 'AI Assistant', desc: 'Get instant, context-aware answers and AI-generated content summaries from your personal tutor.' },
            { icon: '🏆', title: 'Gamification', desc: 'Earn XP, unlock achievements, and maintain your study streak to stay motivated.' },
            { icon: '🛡️', title: 'Secure & Fast', desc: 'Enterprise-grade security with JWT auth, rapid content delivery, and a buttery smooth UI.' },
          ].map((f, i) => (
            <div key={i} className="landing-feature-card slide-up" style={{animationDelay: `${i * 0.15}s`}}>
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
