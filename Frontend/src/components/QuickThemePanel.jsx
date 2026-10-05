import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/useTheme';
import { useAuth } from '../context/AuthContext';
import { generateHarmonies } from '../theme/colorEngine';
import api from '../services/api';
import './QuickThemePanel.css';

export default function QuickThemePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState('#8B5CF6');
  const [isPreviewingCustom, setIsPreviewingCustom] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const {
    availableThemes,
    activeTheme,
    themeMode,
    setThemeMode,
    saveTheme,
    applyCustomTokens,
    resetToSaved,
    resolutionSource,
    refreshThemes
  } = useTheme();

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide floating button on login/auth routes to keep authentication screen clean
  if (location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || location.pathname.startsWith('/auth')) {
    return null;
  }

  const handleSelectTheme = async (theme) => {
    setIsPreviewingCustom(false);
    const targetId = theme.id || theme.slug;
    await saveTheme(targetId);
  };

  const handleCustomColorChange = (hex) => {
    setCustomHex(hex);
    setIsPreviewingCustom(true);
    setSaveMsg('');
    const { cssVariables } = generateHarmonies(hex, themeMode === 'light' ? 'light' : 'dark');
    applyCustomTokens(cssVariables);
  };

  const handleSaveCustomAccent = async () => {
    setSaveMsg('Saving accent...');
    const { palette, cssVariables } = generateHarmonies(customHex, themeMode === 'light' ? 'light' : 'dark');
    try {
      const payload = {
        name: `Custom Accent ${customHex.toUpperCase()}`,
        description: 'Instant brand accent generated via Quick Theme Panel.',
        mode: themeMode === 'light' ? 'light' : 'dark',
        primary_color: palette.primary,
        secondary_color: palette.secondary,
        accent_color: palette.accent,
        generated_colors: palette,
        config: cssVariables,
        is_public: false,
        is_active: true
      };
      const res = await api.post('/themes/create/', payload);
      await saveTheme(res.data.id);
      if (refreshThemes) refreshThemes();
      setIsPreviewingCustom(false);
      setSaveMsg('✓ Accent theme saved & activated!');
      setTimeout(() => setSaveMsg(''), 3500);
    } catch (err) {
      console.error('Failed to save custom accent:', err);
      setSaveMsg('Could not save theme to backend.');
    }
  };

  const handleResetCustom = () => {
    setIsPreviewingCustom(false);
    setSaveMsg('');
    resetToSaved();
  };

  const navigateToFullSettings = () => {
    setIsOpen(false);
    if (user?.role === 'admin') {
      navigate('/admin/appearance');
    } else {
      navigate('/student/appearance');
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button 
        className="quick-theme-trigger" 
        onClick={() => setIsOpen(true)}
        title="Open Quick Theme Customization Panel"
      >
        <span className="trigger-icon">🎨</span>
        <span>Themes</span>
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div className="theme-panel-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="theme-panel-drawer">
          <div className="drawer-header">
            <div>
              <h3>✨ StudyHub Theme Center</h3>
              <p>Instant visual adaptation & WCAG AA styling</p>
              {resolutionSource && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#60A5FA', textTransform: 'capitalize' }}>
                  Current Rule: <strong>{resolutionSource.replace('_', ' ')}</strong>
                </div>
              )}
            </div>
            <button className="btn-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="drawer-body">
            {/* Section 1: Mode Switcher */}
            <div>
              <div className="section-title">🌓 Color Scheme Preference</div>
              <div className="mode-segmented-bar">
                <button 
                  className={`mode-pill-btn ${themeMode === 'system' ? 'active' : ''}`}
                  onClick={() => setThemeMode && setThemeMode('system')}
                >
                  <span style={{ fontSize: '16px' }}>💻</span>
                  <span>System Auto</span>
                </button>
                <button 
                  className={`mode-pill-btn ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => setThemeMode && setThemeMode('dark')}
                >
                  <span style={{ fontSize: '16px' }}>🌙</span>
                  <span>Dark Mode</span>
                </button>
                <button 
                  className={`mode-pill-btn ${themeMode === 'light' ? 'active' : ''}`}
                  onClick={() => setThemeMode && setThemeMode('light')}
                >
                  <span style={{ fontSize: '16px' }}>☀️</span>
                  <span>Light Mode</span>
                </button>
              </div>
            </div>

            {/* Section 2: Built-In & Available Themes */}
            <div>
              <div className="section-title">🎨 Professional Theme Catalog</div>
              <div className="drawer-themes-list">
                {availableThemes.map((theme, i) => {
                  const isCur = activeTheme && !isPreviewingCustom && (activeTheme.id === theme.id || activeTheme.slug === theme.slug);
                  const pCol = theme.primary_color || theme.config?.['--primary-color'] || '#8B5CF6';
                  const sCol = theme.secondary_color || theme.config?.['--secondary-color'] || '#3B82F6';
                  const aCol = theme.accent_color || theme.config?.['--accent-color'] || '#A855F7';

                  return (
                    <div 
                      key={theme.id || theme.slug || i} 
                      className={`drawer-theme-card ${isCur ? 'active-card' : ''}`}
                      onClick={() => handleSelectTheme(theme)}
                    >
                      <div className="theme-card-info">
                        <h4>
                          {theme.name}
                          {isCur && <span className="badge-active-check">Active ✓</span>}
                        </h4>
                        <p>{theme.mode === 'light' ? '☀️ Light Optimized' : '🌙 Dark OLED Workspace'}</p>
                      </div>

                      <div className="swatch-group">
                        <div className="swatch-circle" style={{ backgroundColor: pCol }} title="Primary Tone" />
                        <div className="swatch-circle" style={{ backgroundColor: sCol }} title="Secondary Tone" />
                        <div className="swatch-circle" style={{ backgroundColor: aCol }} title="Accent Tone" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Instant Algorithmic Accent Generator */}
            <div>
              <div className="section-title">🧪 Live Brand Accent Override</div>
              <div className="accent-generator-box">
                <p>Pick a brand color below; our engine instantaneously recomputes complementary accents and contrast depth.</p>
                
                <div className="picker-control-row">
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>Primary Accent Hex:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ fontSize: '13px', color: '#A78BFA' }}>{customHex.toUpperCase()}</code>
                    <input 
                      type="color" 
                      value={customHex} 
                      onChange={e => handleCustomColorChange(e.target.value)} 
                    />
                  </div>
                </div>

                {isPreviewingCustom && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="quick-save-btn" style={{ margin: 0, flex: 1 }} onClick={handleSaveCustomAccent}>
                      Save Accent 💾
                    </button>
                    <button className="quick-save-btn" style={{ margin: 0, background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)', flex: 0.8 }} onClick={handleResetCustom}>
                      Discard ✕
                    </button>
                  </div>
                )}

                {saveMsg && (
                  <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 'bold', marginTop: '8px', textAlign: 'center' }}>
                    {saveMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="drawer-footer">
            <button className="btn-full-settings" onClick={navigateToFullSettings}>
              {user?.role === 'admin' ? '⚙️ Open Advanced Admin Theme Builder & Version Control' : '⚙️ Open Full Appearance Settings'} →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
