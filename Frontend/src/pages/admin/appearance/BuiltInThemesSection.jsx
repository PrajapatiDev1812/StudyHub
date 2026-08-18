import React from 'react';
import ThemePreviewCard from './ThemePreviewCard';
import { BUILTIN_THEMES } from '../../../theme/themeConfig';

export default function BuiltInThemesSection({ activeTheme, onSelectTheme }) {
  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        Built-in Themes
      </h2>
      <div className="themes-grid">
        {BUILTIN_THEMES.map((theme) => {
          const isActive = activeTheme && (activeTheme.id === theme.id || activeTheme.slug === theme.slug);
          return (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isActive={isActive}
              onSelect={onSelectTheme}
            />
          );
        })}
      </div>
    </div>
  );
}
