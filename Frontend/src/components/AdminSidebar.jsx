import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Users,
  ClipboardCheck,
  BarChart3,
  Sparkles,
  Megaphone,
  LogOut,
  ChevronRight,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminSidebar.css';

/* ─────────────────────────────────────────────────────────────
   Navigation config — add future items here, zero code changes
   ───────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Dashboard',      icon: Home,             path: '/admin/dashboard' },
  { label: 'Curriculum',     icon: BookOpen,          path: '/admin/curriculum' },
  { label: 'Students',       icon: Users,             path: '/admin/students' },
  { label: 'Tests',          icon: ClipboardCheck,    path: '/admin/tests' },
  { label: 'Analytics',      icon: BarChart3,         path: '/admin/analytics' },
  { label: 'AI Assistant',   icon: Sparkles,          path: '/admin/ai' },
  { label: 'Announcements',  icon: Megaphone,         path: '/admin/announcements' },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change (mobile)
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, []);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close mobile drawer when a link is clicked
    setMobileOpen(false);
  };

  const displayName = user?.username ?? 'Teacher';
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'T';

  return (
    <>
      {/* ── Mobile Hamburger Toggle ── */}
      <button
        className="admin-mobile-toggle"
        onClick={() => setMobileOpen(prev => !prev)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Mobile Backdrop Overlay ── */}
      <div
        className={`admin-sidebar-overlay ${mobileOpen ? '' : 'hidden'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar Panel ── */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        aria-label="Teacher navigation"
        role="navigation"
      >
        {/* ── Brand ── */}
        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon-wrap" aria-hidden="true">
            <GraduationCap size={18} />
          </div>
          <span className="admin-brand-text">StudyHub</span>
          <span className="admin-brand-badge">Teacher</span>
        </div>

        {/* ── User Profile Card ── */}
        <div
          className="admin-sidebar-user"
          onClick={() => { navigate('/admin/profile'); handleNavClick(); }}
          title="View profile"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { navigate('/admin/profile'); handleNavClick(); } }}
          aria-label={`View profile of ${displayName}`}
        >
          <div className="admin-user-avatar" aria-hidden="true">
            {avatarLetter}
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{displayName}</span>
            <span className="admin-user-role">Teacher</span>
          </div>
          <ChevronRight size={14} className="admin-user-chevron" aria-hidden="true" />
        </div>

        {/* ── Navigation ── */}
        <nav className="admin-nav-section" aria-label="Main navigation">
          <div className="admin-nav-section-label">Navigation</div>

          {NAV_ITEMS.map(({ label, icon: Icon, path }) => ( // eslint-disable-line no-unused-vars
            <NavLink
              key={path}
              to={path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `admin-nav-item${isActive ? ' active' : ''}`
              }
              aria-label={label}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              <span className="admin-nav-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="admin-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Footer / Logout ── */}
        <footer className="admin-sidebar-footer">
          <button
            className="admin-logout-btn"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={16} aria-hidden="true" />
            Logout
          </button>
        </footer>
      </aside>
    </>
  );
}
