/**
 * DashboardHeader.jsx
 * Admin/Teacher Dashboard — Header Component
 *
 * Reads teacher profile from:
 * 1. useAuth() user object (live backend data)
 * 2. teacherProfile prop (mock or future API response)
 *
 * First-login detection:
 * - Production: use `teacherProfile.is_first_login` from backend
 * - Development fallback: localStorage key 'studyhub_teacher_first_login'
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, ChevronDown, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

/**
 * Resolve teacher display name.
 * Priority: profile name → user full name → username.
 */
function resolveTeacherName(user, profile) {
  if (profile?.name) return profile.name;

  const first = user?.first_name || '';
  const last  = user?.last_name  || '';
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (user?.full_name) return user.full_name;
  return user?.username || 'Teacher';
}

/**
 * Resolve avatar initials from name string.
 * E.g. "Dr. Rajesh Patel" → "RP"
 */
function getInitials(name) {
  const words = name.trim().split(/\s+/);
  // Skip titles like Dr./Prof.
  const significant = words.filter(w => !w.match(/^(dr|prof|mr|ms|mrs|sir)\.?$/i));
  if (significant.length >= 2) {
    return (significant[0][0] + significant[significant.length - 1][0]).toUpperCase();
  }
  return (name[0] || 'T').toUpperCase();
}

/**
 * Determine whether this is the teacher's first login.
 *
 * [API_READY]: When backend provides `is_first_login`, use that directly.
 * Current: uses localStorage as dev-only fallback.
 */
function resolveFirstLogin(profile) {
  // Backend field takes precedence
  if (profile?.is_first_login !== undefined) {
    return profile.is_first_login;
  }
  // Dev-only localStorage fallback
  const stored = localStorage.getItem('studyhub_teacher_first_login');
  return stored === null; // null means key was never set → first visit
}

/**
 * Mark first login as done.
 * [API_READY]: Replace localStorage call with API PATCH to update is_first_login = false.
 */
function markFirstLoginDone() {
  localStorage.setItem('studyhub_teacher_first_login', 'done');
}

export default function DashboardHeader({ teacherProfile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const name        = resolveTeacherName(user, teacherProfile);
  const initials    = getInitials(name);
  const isFirst     = resolveFirstLogin(teacherProfile);
  const designation = teacherProfile?.designation || user?.designation || '';
  const department  = teacherProfile?.department  || user?.department  || '';
  const avatarImg   = teacherProfile?.profile_image || user?.profile_image || '';

  const greeting   = isFirst ? `Welcome, ${name}` : `Welcome back, ${name}`;

  // After first render, mark first login done
  useEffect(() => {
    if (isFirst) {
      markFirstLoginDone();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="admin-header">
      {/* ── Left: avatar + greeting ── */}
      <div className="admin-header-left">
        <div className="admin-avatar">
          {avatarImg
            ? <img src={avatarImg} alt={name} />
            : <span>{initials}</span>
          }
        </div>

        <div className="admin-header-text">
          <h1 className="admin-welcome-line">
            {greeting}&nbsp;
            <span className="admin-welcome-emoji" role="img" aria-label="wave">👋</span>
          </h1>

          {(designation || department) && (
            <div className="admin-designation-line">
              {designation && <span>{designation}</span>}
              {designation && department && <span className="admin-sep">|</span>}
              {department && <span>Department of {department}</span>}
            </div>
          )}

          <p className="admin-subtitle">
            Manage your courses, track student progress, and create engaging learning content.
          </p>
        </div>
      </div>

      {/* ── Right: action icons + profile dropdown ── */}
      <div className="admin-header-actions">
        {/* Notifications */}
        <button
          className="admin-icon-btn"
          title="Notifications"
          aria-label="Notifications"
          id="admin-header-notifications-btn"
        >
          <Bell size={18} />
          <span className="admin-notif-dot" />
        </button>

        {/* Settings */}
        <button
          className="admin-icon-btn"
          title="Settings"
          aria-label="Settings"
          id="admin-header-settings-btn"
          onClick={() => navigate('/admin/profile')}
        >
          <Settings size={18} />
        </button>

        {/* Profile Dropdown */}
        <div className="admin-profile-menu" ref={dropdownRef}>
          <button
            className="admin-profile-trigger"
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            id="admin-header-profile-btn"
          >
            <div className="admin-profile-mini-avatar">{initials}</div>
            <span>{name.split(' ').slice(-1)[0]}</span>
            <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {dropdownOpen && (
            <div className="admin-dropdown" role="menu">
              <button
                className="admin-dropdown-item"
                role="menuitem"
                onClick={() => { navigate('/admin/profile'); setDropdownOpen(false); }}
                id="admin-dropdown-profile"
              >
                <User size={15} /> My Profile
              </button>
              <button
                className="admin-dropdown-item"
                role="menuitem"
                onClick={() => { navigate('/admin/profile'); setDropdownOpen(false); }}
                id="admin-dropdown-settings"
              >
                <Settings size={15} /> Settings
              </button>
              <div className="admin-dropdown-divider" />
              <button
                className="admin-dropdown-item danger"
                role="menuitem"
                onClick={handleLogout}
                id="admin-dropdown-logout"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
