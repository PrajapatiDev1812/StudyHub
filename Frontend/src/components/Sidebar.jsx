import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { to: '/student/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/student/courses', icon: '📚', label: 'Browse Courses' },
    { to: '/student/my-courses', icon: '🎓', label: 'My Courses' },
    { to: '/student/tests', icon: '📝', label: 'Tests' },
    { to: '/student/my-attempts', icon: '📋', label: 'My Attempts' },
    { to: '/student/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/student/ai-chat', icon: '🤖', label: 'AI Assistant' },
    { to: '/student/profile', icon: '👤', label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/courses', icon: '📚', label: 'Courses' },
    { to: '/admin/subjects', icon: '📖', label: 'Subjects' },
    { to: '/admin/topics', icon: '📌', label: 'Topics' },
    { to: '/admin/content', icon: '📄', label: 'Content' },
    { to: '/admin/tests', icon: '📝', label: 'Tests' },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">🎯</span>
        <span className="brand-text">StudyHub</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
        <div className="user-info">
          <span className="user-name">{user?.username}</span>
          <span className="user-role">{user?.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{link.icon}</span>
            <span className="nav-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <span>🚪</span> Logout
      </button>
    </aside>
  );
}
