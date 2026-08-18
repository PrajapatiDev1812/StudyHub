import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Wand2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../theme/useTheme';
import { generateThemeFromImage } from '../../../utils/themeGenerator';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import api from '../../../services/api';

export default function ThemeCustomizerModal({ onClose, onSuccess, onError }) {
  const { refreshThemes, saveTheme } = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [autoName, setAutoName] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedColors, setExtractedColors] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAutoName(file.name.split('.')[0].replace(/[-_]/g, ' ') || 'Custom Theme');

    try {
      const { config } = await generateThemeFromImage(file);
      setExtractedColors(config);
    } catch {
      setExtractedColors(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', autoName || 'Custom Theme');
      formData.append('background_image', selectedFile);
      formData.append('config', JSON.stringify(extractedColors || {}));

      // POST /api/auth/themes/custom/
      // Returns UserAppearanceSerializer: { selected_theme, selected_theme_detail, ... }
      const res = await api.post('/auth/themes/custom/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const createdTheme = res.data?.selected_theme_detail;

      if (!createdTheme) {
        throw new Error('Backend did not return the created theme details.');
      }

      // 1. Re-fetch themes list so the new theme appears in availableThemes
      await refreshThemes();

      // 2. Apply it immediately as the active theme (uses resolved URL via saveTheme)
      await saveTheme(createdTheme);

      onClose();
      onSuccess?.(createdTheme.name || autoName);
    } catch (err) {
      console.error('Upload Error:', err, err.response?.data);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.name?.[0] ||
        err.response?.data?.background_image?.[0] ||
        err.message ||
        'Unknown error';
      onError?.(`Upload failed: ${detail}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal-content">
        <div className="theme-modal-header">
          <h3 className="theme-modal-title">Upload Custom Theme</h3>
          <button className="theme-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="theme-modal-body">
          <p className="theme-modal-subtitle">
            Upload a background image. Colors are automatically extracted to create a harmonious adaptive theme.
          </p>

          {/* Upload area */}
          <div
            className="theme-upload-area"
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '10px',
              cursor: 'pointer',
              marginTop: '0.5rem',
              background: previewUrl ? `url(${previewUrl}) center/cover no-repeat` : 'var(--bg-hover)',
              position: 'relative',
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            {!previewUrl && (
              <>
                <ImageIcon size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  Click to browse image
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                  JPG, PNG or WEBP recommended
                </span>
              </>
            )}
            {previewUrl && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>
                  Click to change image
                </span>
                {extractedColors && (
                  <span style={{ color: '#a3e635', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wand2 size={13} /> Colors extracted
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="theme-modal-footer" style={{ marginTop: '1.5rem' }}>
          <button
            className="theme-modal-button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {isUploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <Upload size={18} />
                <span>Upload Theme</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
