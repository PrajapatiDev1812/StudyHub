import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Appearance from './Appearance';
import './Profile.css';

function PersonalInfoTab({ user, onUpdate }) {
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSave = async () => {
    if (!username.trim()) return setMsg({ text: 'Username cannot be empty', type: 'error' });
    setLoading(true);
    try {
      const res = await api.put('/auth/profile/personal/', { username });
      onUpdate(res.data);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to update profile.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="glass-card slide-up profile-tab-card">
      <div className="profile-avatar-wrapper">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase()}
        </div>
      </div>
      
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="form-group">
        <label>Username</label>
        <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Email (Read-only)</label>
        <input className="form-input" value={user?.email || ''} readOnly />
      </div>
      <div className="form-group">
        <label>Role</label>
        <input className="form-input" value={user?.role || ''} readOnly style={{ textTransform: 'capitalize' }} />
      </div>
      <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function AccountSecurityTab() {
  const [passData, setPassData] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [sessions, setSessions] = useState([]);
  const [logins, setLogins] = useState([]);
  const [backupCodes, setBackupCodes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [sessRes, logRes] = await Promise.all([
          api.get('/auth/security/sessions/'),
          api.get('/auth/security/login-activity/')
        ]);
        if (!cancelled) {
          setSessions(Array.isArray(sessRes.data) ? sessRes.data : []);
          setLogins(Array.isArray(logRes.data) ? logRes.data : []);
        }
      } catch (e) {
        console.error('Security data load failed:', e);
        if (!cancelled) {
          setSessions([]);
          setLogins([]);
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const refetchSecurity = async () => {
    try {
      const [sessRes, logRes] = await Promise.all([
        api.get('/auth/security/sessions/'),
        api.get('/auth/security/login-activity/')
      ]);
      setSessions(Array.isArray(sessRes.data) ? sessRes.data : []);
      setLogins(Array.isArray(logRes.data) ? logRes.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordChange = async () => {
    if (!passData.current_password || !passData.new_password) {
      setMsg({ text: 'Please fill in both password fields.', type: 'error' });
      return;
    }
    setPassLoading(true);
    try {
      await api.post('/auth/security/change-password/', passData);
      setMsg({ text: 'Password changed successfully.', type: 'success' });
      setPassData({ current_password: '', new_password: '' });
    } catch (err) {
      console.error(err);
      setMsg({ text: err.response?.data?.error || 'Failed to change password.', type: 'error' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogoutOthers = async () => {
    try {
      await api.post('/auth/security/logout-others/');
      setMsg({ text: 'Logged out of other devices.', type: 'success' });
      refetchSecurity();
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to logout other devices.', type: 'error' });
    }
  };

  const generateBackupCodes = async () => {
    if (!window.confirm('Generating new codes will invalidate old ones. Continue?')) return;
    try {
      const res = await api.post('/auth/security/2fa/backup-codes/');
      setBackupCodes(res.data.backup_codes || []);
      setMsg({ text: 'Backup codes generated. Save them now!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMsg({ text: err.response?.data?.error || 'Failed to generate codes.', type: 'error' });
    }
  };

  return (
    <div className="slide-up profile-grid">
      {msg.text && (
        <div className={`alert alert-${msg.type} span-full`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      <div className="glass-card">
        <h3>Change Password</h3>
        <div className="form-group mt-3">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Current Password</label>
          <input type="password" placeholder="Enter current password" value={passData.current_password} onChange={e => setPassData({...passData, current_password: e.target.value})} className="form-input" />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>New Password</label>
          <input type="password" placeholder="Minimum 8 characters" value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})} className="form-input" />
        </div>
        <button className="btn btn-primary w-full" onClick={handlePasswordChange} disabled={passLoading}>
          {passLoading ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      <div className="glass-card">
        <h3>Two-Factor Authentication</h3>
        <p className="text-muted mt-2">Add an extra layer of security to your account.</p>
        <button className="btn btn-outline w-full mt-3" disabled>Configure 2FA (Coming Soon)</button>
        <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
        <h4 style={{ marginBottom: '0.5rem' }}>Backup Codes</h4>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>Use these if you lose 2FA access. Store them safely.</p>
        <button className="btn btn-outline w-full" onClick={generateBackupCodes}>Generate New Backup Codes</button>
        {backupCodes.length > 0 && (
          <div className="backup-codes-box mt-3">
            {backupCodes.map((c, i) => <span key={i} className="code-badge">{c}</span>)}
          </div>
        )}
      </div>

      <div className="glass-card span-full">
        <div className="flex-between mb-3">
          <h3>Active Sessions</h3>
          <button className="btn btn-danger btn-sm" onClick={handleLogoutOthers}>Logout Other Devices</button>
        </div>
        {loadingData ? (
          <div className="spinner" style={{ margin: '20px auto' }} />
        ) : (
          <div className="table-responsive">
            <table className="profile-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>IP Address</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>{s.device || 'Unknown Browser'}</td>
                    <td>{s.ip_address || '—'}</td>
                    <td>{s.last_active ? new Date(s.last_active).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active sessions tracked yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card span-full">
        <h3>Recent Login Activity</h3>
        {loadingData ? (
          <div className="spinner" style={{ margin: '20px auto' }} />
        ) : (
          <div className="table-responsive mt-3">
            <table className="profile-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Device / IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logins.map(l => (
                  <tr key={l.id}>
                    <td><span className={`status-badge ${l.status === 'success' ? 'success' : 'error'}`}>{l.status}</span></td>
                    <td>{l.device || 'Web Browser'}<br /><small style={{ color: 'var(--text-muted)' }}>{l.ip_address || ''}</small></td>
                    <td>{l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {logins.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No login activity found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AiPreferencesTab() {
  const [prefs, setPrefs] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    api.get('/auth/profile/preferences/').then(res => setPrefs(res.data));
  }, []);

  const savePrefs = async () => {
    try {
      await api.put('/auth/profile/preferences/', prefs);
      setMsg({ text: 'AI preferences saved!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to save preferences.', type: 'error' });
    }
  };

  if (!prefs) return <div className="spinner" />;

  return (
    <div className="slide-up profile-grid">
      {msg.text && <div className={`alert alert-${msg.type} span-full`}>{msg.text}</div>}

      <div className="glass-card">
        <h3>AI Assistant Preferences</h3>
        <div className="form-group mt-3">
          <label>Default Mode</label>
          <select className="form-input" value={prefs.default_ai_mode} onChange={e => setPrefs({...prefs, default_ai_mode: e.target.value})}>
            <option value="student">Student Mode</option>
            <option value="teacher">Teacher Mode</option>
            <option value="exam">Exam Mode</option>
          </select>
        </div>
        <div className="form-group">
          <label>Response Style</label>
          <select className="form-input" value={prefs.ai_response_style} onChange={e => setPrefs({...prefs, ai_response_style: e.target.value})}>
            <option value="short">Short &amp; Concise</option>
            <option value="detailed">Detailed</option>
            <option value="step-by-step">Step-by-step</option>
          </select>
        </div>
        <div className="toggle-group mt-4">
          <label className="toggle-label">
            <span>Enable Emojis in AI responses</span>
            <input type="checkbox" checked={prefs.emoji_enabled} onChange={e => setPrefs({...prefs, emoji_enabled: e.target.checked})} />
          </label>
        </div>
      </div>

      <div className="span-full flex-end">
        <button className="btn btn-primary" onClick={savePrefs}>Save AI Preferences</button>
      </div>
    </div>
  );
}

function FocusPreferencesTab() {
  const [prefs, setPrefs] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    api.get('/auth/profile/preferences/').then(res => setPrefs(res.data));
  }, []);

  const savePrefs = async () => {
    try {
      await api.put('/auth/profile/preferences/', prefs);
      setMsg({ text: 'Focus preferences saved!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Failed to save preferences.', type: 'error' });
    }
  };

  if (!prefs) return <div className="spinner" />;

  return (
    <div className="slide-up profile-grid">
      {msg.text && <div className={`alert alert-${msg.type} span-full`}>{msg.text}</div>}

      <div className="glass-card">
        <h3>Focus Mode Preferences</h3>
        <div className="form-group mt-3">
          <label>Default Focus Duration (minutes)</label>
          <input type="number" className="form-input" min="5" value={prefs.default_focus_minutes} onChange={e => setPrefs({...prefs, default_focus_minutes: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Default Break Duration (minutes)</label>
          <input type="number" className="form-input" min="1" value={prefs.default_break_minutes} onChange={e => setPrefs({...prefs, default_break_minutes: e.target.value})} />
        </div>
        <div className="toggle-group mt-4">
          <label className="toggle-label">
            <span>Strict Mode Default</span>
            <input type="checkbox" checked={prefs.strict_mode_default} onChange={e => setPrefs({...prefs, strict_mode_default: e.target.checked})} />
          </label>
          <label className="toggle-label mt-2">
            <span>Auto-start Breaks</span>
            <input type="checkbox" checked={prefs.auto_break_enabled} onChange={e => setPrefs({...prefs, auto_break_enabled: e.target.checked})} />
          </label>
        </div>
      </div>

      <div className="span-full flex-end">
        <button className="btn btn-primary" onClick={savePrefs}>Save Focus Preferences</button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="slide-up profile-grid">
      <div className="glass-card span-full">
        <h3>Notifications</h3>
        <p className="text-muted mt-2">Notification preferences coming soon.</p>
      </div>
    </div>
  );
}

function ActivitySummaryTab() {
  return (
    <div className="slide-up profile-grid">
      <div className="glass-card span-full">
        <h3>Activity & Privacy</h3>
        <p className="text-muted mt-2">Activity and privacy settings coming soon.</p>
      </div>
    </div>
  );
}

// ── TAB metadata: label + subtitle shown as page header ──────────────────────

const SECTION_META = {
  personal:      { label: 'Profile Settings',    subtitle: 'Manage your personal details' },
  appearance:    { label: 'Appearance',           subtitle: 'Theme and display preferences' },
  security:      { label: 'Security & 2FA',       subtitle: 'Password, OTP and login safety' },
  notifications: { label: 'Notifications',        subtitle: 'Reminders and alert settings' },
  ai:            { label: 'AI Preferences',       subtitle: 'Assistant mode and response style' },
  focus:         { label: 'Focus Preferences',    subtitle: 'Timer, strict mode and focus sound' },
  activity:      { label: 'Activity & Privacy',   subtitle: 'Sessions, history and data controls' },
};

export default function Profile() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Map URL ?tab= param to internal tab keys
  const TAB_MAP = {
    personal:      'personal',
    appearance:    'appearance',
    security:      'security',
    notifications: 'notifications',
    ai:            'ai',
    focus:         'focus',
    activity:      'activity',
    // legacy aliases (old ?tab=preferences navigates to ai)
    preferences:   'ai',
    info:          'personal',
  };

  const resolveTab = () => TAB_MAP[searchParams.get('tab')] || 'personal';
  const [activeTab, setActiveTab] = useState(resolveTab);

  // Sync when URL changes (back/forward navigation)
  useEffect(() => {
    const t = TAB_MAP[searchParams.get('tab')];
    if (t) setActiveTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':      return <PersonalInfoTab user={user} onUpdate={() => {}} />;
      case 'appearance':    return <Appearance />;
      case 'security':      return <AccountSecurityTab />;
      case 'notifications': return <NotificationsTab />;
      case 'ai':            return <AiPreferencesTab />;
      case 'focus':         return <FocusPreferencesTab />;
      case 'activity':      return <ActivitySummaryTab />;
      default:              return <PersonalInfoTab user={user} onUpdate={() => {}} />;
    }
  };

  const meta = SECTION_META[activeTab] || SECTION_META.personal;

  return (
    <div className="fade-in profile-container">
      <div className="page-header">
        <h1>{meta.label}</h1>
        <p>{meta.subtitle}</p>
      </div>

      <div className="profile-content">
        {renderContent()}
      </div>
    </div>
  );
}
