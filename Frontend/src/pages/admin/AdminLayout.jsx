import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, BarChart3, LogOut,
  Search, Bell, Sparkles, Menu, X, ClipboardCheck, Megaphone, Palette, Trophy, ClipboardList
} from 'lucide-react';
import { useTheme } from '../../theme/useTheme';
import api from '../../services/api';
import './AdminLayout.css';

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { reapplyToAdminLayout } = useTheme();

  useEffect(() => {
    // Fetch profile for header
    api.get('/auth/profile/')
      .then(res => setUser(res.data))
      .catch(() => {
        setUser({ first_name: 'Admin', last_name: 'User', role: 'admin' });
      });
  }, []);

  // After .admin-layout mounts, re-apply the cached theme scoped to it
  // (ThemeProvider may have written to :root before this element existed)
  useEffect(() => {
    reapplyToAdminLayout();
  }, [reapplyToAdminLayout]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/admin/curriculum', icon: BookOpen, label: 'Curriculum' },
    { path: '/admin/students', icon: Users, label: 'Students' },
    { path: '/admin/tests', icon: ClipboardCheck, label: 'Tests' },
    { path: '/admin/tasks', icon: ClipboardList, label: 'Tasks' },
    { path: '/admin/achievements', icon: Trophy, label: 'Achievements' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/ai', icon: Sparkles, label: 'AI Tools' },
    { path: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/admin/appearance', icon: Palette, label: 'Appearance' },
  ];

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <Sparkles className="admin-logo-icon" size={28} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px', color: 'var(--sidebar-text-hover, #ffffff)' }}>
            StudyHub<span style={{ color: 'var(--accent-primary)' }}>.</span>
          </h2>
          <button 
            className="admin-topbar-btn d-lg-none" 
            style={{ marginLeft: 'auto', color: 'var(--sidebar-text-hover, #fff)' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            onClick={handleLogout}
            className="admin-nav-item" 
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--danger)' }}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="admin-topbar-btn d-lg-none" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="admin-topbar-search">
              <Search size={18} color="var(--text-muted)" />
              <input type="text" placeholder="Search students, courses..." />
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button className="admin-topbar-btn">
              <Bell size={20} />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-sidebar)' }}></span>
            </button>
            
            <div className="admin-profile-btn" onClick={() => navigate('/admin/profile')}>
              <div className="admin-profile-avatar">
                {user?.first_name?.[0] || 'A'}
              </div>
              <div className="d-none d-md-block">
                <div className="admin-profile-name">{user?.first_name} {user?.last_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user?.role || 'Admin'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
