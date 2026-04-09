import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getThemeById } from '../themes';
import api from '../services/api';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  
  // State for the currently active theme (either saved or previewed)
  const [activeTheme, setActiveTheme] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Injects CSS variables from a theme config into the document's :root.
   */
  const applyThemeVariables = useCallback((config, backgroundImage = null) => {
    if (!config) return;
    const root = document.documentElement;
    Object.entries(config).forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });

    if (backgroundImage) {
      // Ensure backend URL is absolute if it's a relative media URL, though often DRF provides full URL.
      // We just set it directly to the root for the whole app.
      root.style.setProperty('--theme-bg-img', `url("${backgroundImage}")`);
    } else {
      root.style.removeProperty('--theme-bg-img');
    }
  }, []);

  /**
   * Sync theme when user data arrives or changes.
   * Prioritizes the database-saved theme, falls back to localStorage, then defaults to Light.
   */
  useEffect(() => {
    if (user?.appearance?.selected_theme_detail) {
      const savedTheme = user.appearance.selected_theme_detail;
      setActiveTheme(savedTheme);
      applyThemeVariables(savedTheme.config, savedTheme.background_image);
      localStorage.setItem('studyhub_theme_cache', JSON.stringify(savedTheme));
    } else {
      // Check if we have a locally cached theme to prevent flashing during data load
      const cached = localStorage.getItem('studyhub_theme_cache');
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          setActiveTheme(parsedCache);
          applyThemeVariables(parsedCache.config, parsedCache.background_image);
          return;
        } catch (e) {
          console.error('Failed to parse cached theme', e);
        }
      }
      
      // Absolute fallback
      const defaultTheme = getThemeById('light');
      setActiveTheme(defaultTheme);
      applyThemeVariables(defaultTheme.config, defaultTheme.background_image);
    }
  }, [user, applyThemeVariables]);

  /**
   * Previews a theme locally without saving to DB.
   */
  const previewTheme = (theme) => {
    setActiveTheme(theme);
    // For local custom theme previews, the image might be a data URL stored locally
    // If it's a built-in or fetched one, it uses background_image URL
    applyThemeVariables(theme.config, theme.background_image || theme.preview_image);
  };

  /**
   * Refreshes/Resets to the user's actually saved theme.
   */
  const resetToSaved = () => {
    if (user?.appearance?.selected_theme_detail) {
      const savedTheme = user.appearance.selected_theme_detail;
      setActiveTheme(savedTheme);
      applyThemeVariables(savedTheme.config, savedTheme.background_image);
    } else {
      const defaultTheme = getThemeById('light');
      setActiveTheme(defaultTheme);
      applyThemeVariables(defaultTheme.config, defaultTheme.background_image);
    }
  };

  /**
   * Persists the selected theme to the database.
   */
  const saveTheme = async (themeId) => {
    // Find the actual theme object from our local THEMES list or database
    // Note: themeId is the numeric ID from the database
    setIsSaving(true);
    try {
      const res = await api.patch('/auth/appearance/', {
        selected_theme: themeId
      });
      
      // Update local state, re-apply, and fiercely update the synchronous cache
      if (res.data.selected_theme_detail) {
        const savedTheme = res.data.selected_theme_detail;
        setActiveTheme(savedTheme);
        applyThemeVariables(savedTheme.config, savedTheme.background_image);
        localStorage.setItem('studyhub_theme_cache', JSON.stringify(savedTheme));
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to save theme:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      activeTheme, 
      previewTheme, 
      saveTheme, 
      resetToSaved,
      isSaving 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
