import React from 'react';
import { Trash2, Lock } from 'lucide-react';

export default function ThemePreviewCard({ theme, isActive, onSelect, isCustom = false, isDeleting = false, onDelete = null }) {
  const pCol = theme.primary_color || theme.config?.['--primary-color'] || '#3B82F6';
  const sCol = theme.secondary_color || theme.config?.['--secondary-color'] || '#60A5FA';
  const aCol = theme.accent_color || theme.config?.['--accent-color'] || '#2563EB';

  const isDark = theme.mode === 'dark';
  const previewBg      = theme.config?.['--bg-primary'] || theme.config?.['--background-primary'] || (isDark ? '#0F172A' : '#F8FAFC');
  const previewCardBg  = theme.config?.['--bg-card']    || theme.config?.['--card-background']    || (isDark ? '#1E293B' : '#FFFFFF');
  const previewSideBar = theme.config?.['--bg-sidebar'] || (isDark ? '#0a0a2e' : '#1E293B');

  // Info bar colours — always readable regardless of the currently active page theme
  const infoBarBg      = isDark ? '#111827' : '#1e293b';
  const infoTextColour = '#f1f5f9';        // always light so it shows on the dark info bar
  const infoBorderColour = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)';

  return (
    <div
      className={`theme-preview-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(theme)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {/* ── Visual Preview ── */}
      <div
        className="theme-preview-visual"
        style={{
          backgroundColor: previewBg,
          ...(theme.background_image
            ? {
                backgroundImage: `url("${theme.background_image}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : {}),
        }}
      >
        {/* Mock Sidebar */}
        <div className="theme-preview-sidebar" style={{ backgroundColor: previewSideBar }}>
          <div className="theme-preview-sidebar-item" style={{ backgroundColor: pCol }} />
          <div className="theme-preview-sidebar-item" style={{ backgroundColor: isDark ? '#334155' : '#475569' }} />
          <div className="theme-preview-sidebar-item" style={{ backgroundColor: isDark ? '#334155' : '#475569' }} />
        </div>

        {/* Mock Main Content */}
        <div className="theme-preview-main">
          <div className="theme-preview-header" style={{ backgroundColor: previewCardBg }} />
          <div className="theme-preview-content-box" style={{ backgroundColor: previewCardBg }}>
            {/* Mock Chart bars */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60%' }}>
              <div className="theme-preview-chart-bar" style={{ backgroundColor: sCol, height: '40%' }} />
              <div className="theme-preview-chart-bar" style={{ backgroundColor: pCol, height: '70%' }} />
              <div className="theme-preview-chart-bar" style={{ backgroundColor: aCol, height: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Info bar — always readable, never inherits active-theme colour ── */}
      <div
        className="theme-preview-info"
        style={{
          backgroundColor: infoBarBg,
          borderTop: `1px solid ${infoBorderColour}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="theme-preview-name"
            style={{ 
              color: infoTextColour, 
              fontWeight: 600, 
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isCustom ? '120px' : '100%'
            }}
            title={theme.name}
          >
            {theme.name}
          </span>
          {!isCustom && (
            <div className="theme-preview-colors">
              <div className="color-dot" style={{ backgroundColor: pCol, border: '1.5px solid rgba(255,255,255,0.2)' }} />
              <div className="color-dot" style={{ backgroundColor: sCol, border: '1.5px solid rgba(255,255,255,0.2)' }} />
              <div className="color-dot" style={{ backgroundColor: aCol, border: '1.5px solid rgba(255,255,255,0.2)' }} />
            </div>
          )}
        </div>

        {isCustom && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ 
              color: isActive ? '#10b981' : 'transparent', 
              fontWeight: 600, 
              fontSize: '0.85rem' 
            }}>
              {isActive ? 'Applied' : ''}
            </span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Lock size={16} color="var(--text-muted)" style={{ opacity: 0.7 }} />
              <button 
                onClick={onDelete} 
                disabled={isDeleting}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: isDeleting ? 'wait' : 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
                title="Delete theme"
              >
                <Trash2 size={16} style={{ opacity: 0.8 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
