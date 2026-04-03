import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { generateThemeFromImage } from '../../utils/themeGenerator';

const ThemePreviewCard = ({ theme, isActive, onClick }) => {
  // Ultra-defensive check
  if (!theme || typeof theme !== 'object') return null;
  const config = theme.config || {};
  const background_image = theme.background_image;
  
  return (
    <div 
      className={`theme-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(theme)}
    >
      <div 
        className="theme-mini-preview" 
        style={{ 
          backgroundColor: config['--bg-primary'] || '#fff',
          backgroundImage: background_image ? `url("${background_image}")` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mini-sidebar" style={{ background: config['--bg-sidebar'] || 'transparent', backdropFilter: background_image ? 'blur(10px)' : 'none', borderRight: `1px solid ${config['--border-color'] || 'transparent'}` }} />
        <div className="mini-content">
          <div className="mini-card" style={{ background: config['--bg-card'] || 'transparent', backdropFilter: background_image ? 'blur(10px)' : 'none', border: `1px solid ${config['--border-color'] || 'transparent'}` }}>
            <div className="mini-line" style={{ background: config['--text-primary'] || 'transparent', width: '60%' }} />
            <div className="mini-line" style={{ background: config['--text-secondary'] || 'transparent', width: '40%' }} />
          </div>
          <div className="mini-button" style={{ background: config['--accent-gradient'] || 'transparent' }} />
        </div>
      </div>
      <div className="theme-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span className="theme-name">{theme.name || 'Untitled Theme'}</span>
          {isActive && <span className="active-badge" style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Applied</span>}
        </div>
        {theme.theme_type === 'custom' && onClick && (
          <div className="theme-actions" style={{ display: 'flex', gap: '8px' }}>
            {theme.onTogglePublic && (
               <button 
                 title={theme.is_public ? 'Make Private' : 'Make Public'}
                 className="btn-theme-action"
                 style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.is_public ? 'var(--info)' : 'var(--text-muted)', fontSize: '1rem', padding: '4px' }}
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); theme.onTogglePublic(theme); }}
               >
                 {theme.is_public ? '👁️' : '🔒'}
               </button>
            )}
            {theme.onDelete && (
               <button 
                 title="Delete Theme"
                 className="btn-theme-action"
                 style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', padding: '4px' }}
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); theme.onDelete(theme); }}
               >
                 🗑️
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Appearance() {
  const { activeTheme, previewTheme, saveTheme, resetToSaved, isSaving } = useTheme();
  
  const [themes, setThemes] = useState([]);
  const [selectedForPreview, setSelectedForPreview] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Sync selection when activeTheme is loaded from Context
  useEffect(() => {
    if (activeTheme && !selectedForPreview) {
      setSelectedForPreview(activeTheme);
    }
  }, [activeTheme, selectedForPreview]);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const res = await api.get('/auth/themes/');
      // Handle both direct array or DRF paginated response
      const themesData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setThemes(themesData);
    } catch (err) {
      console.error('Failed to load themes:', err);
    }
  };

  const handlePreview = (theme) => {
    if (!theme) return;
    setSelectedForPreview(theme);
    previewTheme(theme);
  };

  const handleSave = async () => {
    const themeId = selectedForPreview?.id;
    if (!themeId) return;
    
    setSaveStatus('saving');
    const result = await saveTheme(themeId);
    
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleCustomUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { config } = await generateThemeFromImage(file);
      
      const formData = new FormData();
      formData.append('name', file.name.split('.')[0] || 'Custom Theme');
      formData.append('background_image', file);
      formData.append('config', JSON.stringify(config));

      const res = await api.post('/auth/themes/custom/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchThemes();
      
      if (res.data?.selected_theme_detail) {
        setSelectedForPreview(res.data.selected_theme_detail);
      }
      
      alert('Custom Theme created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to process custom theme. Make sure it is a valid image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const safeThemes = Array.isArray(themes) ? themes : [];
  const builtinThemes = safeThemes.filter(t => t?.theme_type === 'builtin');
  const customThemes = safeThemes.filter(t => t?.theme_type === 'custom');

  // Compare IDs safely (string vs int)
  const isThemeSelected = (themeId) => {
    if (!selectedForPreview || !themeId) return false;
    const sId = String(selectedForPreview.id || '');
    const sSlug = String(selectedForPreview.slug || '');
    const tId = String(themeId || '');
    
    return sId === tId || (sSlug && sSlug === tId);
  };

  const isCurrentActive = selectedForPreview?.id && activeTheme?.id && (
    String(selectedForPreview.id) === String(activeTheme.id) ||
    (selectedForPreview.slug && selectedForPreview.slug === activeTheme.slug)
  );

  const handleTogglePublic = async (theme) => {
    try {
      await api.patch(`/auth/themes/${theme.id}/`, { is_public: !theme.is_public });
      fetchThemes();
    } catch (err) {
      console.error('Failed to toggle visibility:', err.response?.data || err.message);
      alert(`Failed to change theme visibility: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  };

  const handleDeleteTheme = async (theme) => {
    if (!window.confirm(`Are you sure you want to delete "${theme.name}"?`)) return;
    try {
      await api.delete(`/auth/themes/${theme.id}/`);
      
      // If deleted theme was the ACTIVE one, the backend reverts them to Light
      // Let's force a reload of the app state if this happens.
      if (activeTheme?.id === theme.id) {
         window.location.reload();
      } else {
         fetchThemes();
         if (selectedForPreview?.id === theme.id) {
           setSelectedForPreview(activeTheme);
           previewTheme(activeTheme);
         }
      }
    } catch (err) {
      console.error('Failed to delete theme:', err.response?.data || err.message);
      alert(`Failed to delete theme: ${JSON.stringify(err.response?.data || err.message)}`);
    }
  };

  return (
    <div className="appearance-settings fade-in">
      <div className="settings-header">
        <h2>Appearance & Themes</h2>
        <p>Personalize your StudyHub workspace with custom themes and accent colors.</p>
      </div>

      <div className="current-selection-banner glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="current-info">
          <label>Active Theme</label>
          <div className="active-theme-name">
            {activeTheme?.name || 'Default Light'} 
            <span className="theme-type-tag">
              {activeTheme?.theme_type === 'custom' ? 'Custom' : 'Built-in'}
            </span>
          </div>
        </div>
        <div className="selection-actions">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => {
              resetToSaved();
              setSelectedForPreview(activeTheme);
            }}
            disabled={isCurrentActive && !saveStatus}
          >
            Reset to Saved
          </button>
          <button 
            className={`btn btn-primary btn-sm ${saveStatus === 'saving' ? 'loading' : ''}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || (isCurrentActive && !saveStatus) || !selectedForPreview?.id}
          >
            {saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Retry' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="theme-category-section">
        <h3>Your Custom Themes</h3>
        <div className="theme-grid">
          {customThemes.map((theme, idx) => (
            <ThemePreviewCard 
              key={theme.id || `custom-${idx}`}
              theme={{ ...theme, onTogglePublic: handleTogglePublic, onDelete: handleDeleteTheme }}
              isActive={isThemeSelected(theme.id)}
              onClick={handlePreview}
            />
          ))}

          <div className="theme-card upload-theme-card" onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px', borderStyle: 'dashed', background: 'transparent', cursor: 'pointer' }}>
            <span style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '8px' }}>+</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {uploading ? 'Processing...' : 'Upload Image Theme'}
            </span>
            <input 
              type="file" 
              accept="image/*" 
              hidden 
              ref={fileInputRef} 
              onChange={handleCustomUpload} 
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      <div className="theme-category-section">
        <h3>Built-in Themes</h3>
        <div className="theme-grid">
          {builtinThemes.length > 0 ? builtinThemes.map((theme, idx) => (
            <ThemePreviewCard 
              key={theme.id || `builtin-${idx}`}
              theme={theme}
              isActive={isThemeSelected(theme.id)}
              onClick={handlePreview}
            />
          )) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No built-in themes found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

