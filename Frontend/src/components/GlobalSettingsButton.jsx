import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './GlobalSettingsButton.css';

const MENU_ITEMS = [
  {
    icon: '👤',
    label: 'Profile Settings',
    subtitle: 'Manage your personal details',
    tab: 'personal',
  },
  {
    icon: '🎨',
    label: 'Appearance',
    subtitle: 'Theme and display preferences',
    tab: 'appearance',
  },
  {
    icon: '🔐',
    label: 'Security & 2FA',
    subtitle: 'Password, OTP and login safety',
    tab: 'security',
  },
  {
    icon: '🔔',
    label: 'Notifications',
    subtitle: 'Reminders and alerts',
    tab: 'notifications',
  },
  {
    icon: '🤖',
    label: 'AI Preferences',
    subtitle: 'Assistant mode and response style',
    tab: 'ai',
  },
  {
    icon: '🎯',
    label: 'Focus Preferences',
    subtitle: 'Timer, strict mode and focus sound',
    tab: 'focus',
  },
  {
    icon: '📊',
    label: 'Activity & Privacy',
    subtitle: 'Sessions, history and data controls',
    tab: 'activity',
  },
];

export default function GlobalSettingsButton() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);


  const closeMenu = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, closeMenu]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closeMenu]);

  // Only render for students
  if (user?.role !== 'student') return null;

  const handleItemClick = (tab) => {
    closeMenu();
    navigate(`/student/profile?tab=${tab}`);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  return (
    <div className="gsb-wrapper">
      {/* Gear Icon Button */}
      <button
        ref={buttonRef}
        className={`gsb-trigger ${open ? 'gsb-trigger--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Settings"
      >
        <svg
          className="gsb-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="gsb-dropdown"
          role="menu"
          aria-label="Settings menu"
        >
          <div className="gsb-dropdown-header">
            <span className="gsb-dropdown-title">Settings</span>
          </div>

          <div className="gsb-menu-items">
            {MENU_ITEMS.map((item) => (
              <button
                key={`${item.label}-${item.tab}`}
                className="gsb-menu-item"
                role="menuitem"
                onClick={() => handleItemClick(item.tab)}
              >
                <span className="gsb-item-icon">{item.icon}</span>
                <div className="gsb-item-text">
                  <span className="gsb-item-label">{item.label}</span>
                  <span className="gsb-item-subtitle">{item.subtitle}</span>
                </div>
                <span className="gsb-item-arrow">›</span>
              </button>
            ))}
          </div>

          <div className="gsb-dropdown-divider" />

          <button
            className="gsb-menu-item gsb-logout-item"
            role="menuitem"
            onClick={handleLogout}
          >
            <span className="gsb-item-icon">🚪</span>
            <div className="gsb-item-text">
              <span className="gsb-item-label">Logout</span>
              <span className="gsb-item-subtitle">Sign out from StudyHub</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
