import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ThemePreviewCard from './ThemePreviewCard';
import ThemeCustomizerModal from './ThemeCustomizerModal';
import { useTheme } from '../../../theme/useTheme';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

export default function MyThemesSection({
  activeTheme,
  onSelectTheme,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess,
  onDeleteError
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const { availableThemes, deleteTheme } = useTheme();

  // Custom themes: uploaded by users (theme_type === 'custom' from DB)
  // These always have an integer `id` from the database.
  const customThemes = availableThemes.filter(
    (theme) => theme.theme_type === 'custom'
  );

  const handleDelete = async (e, theme) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${theme.name}"?`)) return;

    setIsDeleting(theme.id);
    const result = await deleteTheme(theme.id);
    setIsDeleting(null);

    if (result?.success) {
      onDeleteSuccess?.(theme.name);
    } else {
      onDeleteError?.('Failed to delete theme.');
    }
  };

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        My Themes
      </h2>
      <div className="themes-grid">
        {customThemes.map((theme) => {
          const isActive = activeTheme && (activeTheme.id === theme.id || activeTheme.slug === theme.slug);
          // Prefer absolute URL from backend; fall back to relative path + resolution
          const resolvedBg = theme.background_image_url || resolveMediaUrl(theme.background_image);
          return (
            <ThemePreviewCard
              key={theme.id}
              theme={{ ...theme, background_image: resolvedBg }}
              isActive={isActive}
              isCustom={true}
              isDeleting={isDeleting === theme.id}
              onSelect={onSelectTheme}
              onDelete={(e) => handleDelete(e, theme)}
            />
          );
        })}

        {/* Add New Theme Card */}
        <div className="create-theme-card" onClick={() => setIsModalOpen(true)}>
          <Plus size={32} style={{ marginBottom: '0.5rem' }} />
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Add New Theme</span>
          <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Upload a background image</span>
        </div>
      </div>

      {isModalOpen && (
        <ThemeCustomizerModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(name) => {
            setIsModalOpen(false);
            onUploadSuccess?.(name);
          }}
          onError={onUploadError}
        />
      )}
    </div>
  );
}
