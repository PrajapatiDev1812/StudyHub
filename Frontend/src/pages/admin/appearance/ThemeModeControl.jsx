import React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../../theme/useTheme';

export default function ThemeModeControl() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="theme-card">
      <div className="theme-mode-grid">
        {/* System Preference */}
        <div>
          <h3 className="mode-section-title">System Preference</h3>
          <p className="mode-section-desc">Use system settings</p>
          <button
            className={`system-toggle ${themeMode === 'system' ? 'active' : ''}`}
            onClick={() => setThemeMode('system')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Monitor size={20} />
              <span style={{ fontWeight: 500 }}>Auto-follow OS</span>
            </div>
            <div style={{
              width: '40px', height: '24px', borderRadius: '12px',
              background: themeMode === 'system' ? 'var(--accent-primary)' : 'var(--bg-input)',
              position: 'relative',
              transition: 'background 0.3s'
            }}>
              <div style={{
                position: 'absolute', top: '2px', left: themeMode === 'system' ? '18px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                transition: 'left 0.3s'
              }} />
            </div>
          </button>
        </div>

        {/* Quick Mode */}
        <div>
          <h3 className="mode-section-title">Quick Mode</h3>
          <p className="mode-section-desc">Choose light or dark mode</p>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              <Sun size={24} color={themeMode === 'light' ? 'var(--accent-primary)' : 'var(--text-primary)'} />
              <span>Light</span>
            </button>
            <button
              className={`mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              <Moon size={24} color={themeMode === 'dark' ? 'var(--accent-primary)' : 'var(--text-primary)'} />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
