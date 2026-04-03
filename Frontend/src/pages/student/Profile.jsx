import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Appearance from './Appearance';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'appearance'

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Profile Settings</h1>
        <p>Manage your account info and visual preferences</p>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Personal Info
        </button>
        <button 
          className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="glass-card slide-up" style={{ maxWidth: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 700, color: 'white',
              margin: '0 auto 12px'
            }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input className="form-input" value={user?.username || ''} readOnly />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" value={user?.email || ''} readOnly />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input className="form-input" value={user?.role || ''} readOnly style={{ textTransform: 'capitalize' }} />
          </div>
        </div>
      ) : (
        <Appearance />
      )}
    </div>
  );
}
