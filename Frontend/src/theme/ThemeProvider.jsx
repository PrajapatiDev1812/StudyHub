import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeContext } from './ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BUILTIN_THEMES, getBuiltinTheme } from './themeConfig';
import { resolveMediaUrl } from '../utils/mediaUtils';
import api from '../services/api';

/**
 * Returns the correct DOM element to apply theme variables to.
 *
 * RULE:
 *   - On /admin/* routes  → apply to the `.admin-layout` element (scoped)
 *   - On all other routes → apply to `document.documentElement` (:root)
 *
 * This prevents admin theme changes from bleeding into the student panel.
 */
function getThemeTarget() {
  if (window.location.pathname.startsWith('/admin')) {
    const adminEl = document.querySelector('.admin-layout');
    if (adminEl) return adminEl;
  }
  return document.documentElement;
}

/**
 * Clear all inline CSS custom properties that were previously injected
 * onto the .admin-layout element (called when leaving admin routes).
 */
function clearAdminScopedVars() {
  const adminEl = document.querySelector('.admin-layout');
  if (!adminEl) return;
  const toRemove = [];
  for (let i = 0; i < adminEl.style.length; i++) {
    if (adminEl.style[i].startsWith('--')) toRemove.push(adminEl.style[i]);
  }
  toRemove.forEach(v => adminEl.style.removeProperty(v));
}

export function ThemeProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const prevPathRef = useRef(window.location.pathname);

  const [activeTheme, setActiveTheme] = useState(null);
  const [availableThemes, setAvailableThemes] = useState(BUILTIN_THEMES);
  const [themeMode, setThemeModeState] = useState('system');
  const [resolutionSource, setResolutionSource] = useState('system_default');
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Injects CSS design tokens into the correct scoped element.
   *   Admin routes  →  .admin-layout  (isolated)
   *   Other routes  →  :root
   *
   * Also handles background_image: resolves the backend media path to a full
   * browser-loadable URL and writes it as --theme-bg-img.
   */
  const applyThemeVariables = useCallback((config, backgroundImage = null) => {
    if (!config || typeof config !== 'object') return;
    const target = getThemeTarget();

    Object.entries(config).forEach(([variable, value]) => {
      if (variable.startsWith('--')) {
        target.style.setProperty(variable, value);
      }
    });

    const resolvedBg = resolveMediaUrl(backgroundImage);
    if (resolvedBg) {
      target.style.setProperty('--theme-bg-img', `url("${resolvedBg}")`);
    } else {
      target.style.removeProperty('--theme-bg-img');
    }
  }, []);

  /**
   * Re-applies the cached admin theme to the .admin-layout element.
   * Called from AdminLayout after it mounts so the scoping takes effect
   * (ThemeProvider may have written to :root before this element existed).
   */
  const reapplyToAdminLayout = useCallback(() => {
    if (!window.location.pathname.startsWith('/admin')) return;
    const cached = localStorage.getItem('studyhub_theme_cache');
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      const adminEl = document.querySelector('.admin-layout');
      if (!adminEl || !parsed.config) return;
      Object.entries(parsed.config).forEach(([variable, value]) => {
        if (variable.startsWith('--')) adminEl.style.setProperty(variable, value);
      });
      const resolvedBg = resolveMediaUrl(parsed.background_image);
      if (resolvedBg) {
        adminEl.style.setProperty('--theme-bg-img', `url("${resolvedBg}")`);
      } else {
        adminEl.style.removeProperty('--theme-bg-img');
      }
      // Clean up stale theme vars on :root
      if (parsed.config) {
        Object.keys(parsed.config).forEach(variable => {
          if (variable.startsWith('--')) document.documentElement.style.removeProperty(variable);
        });
        document.documentElement.style.removeProperty('--theme-bg-img');
      }
    } catch { /* ignore */ }
  }, []);

  /**
   * Listen for navigation events (works outside BrowserRouter).
   * When leaving admin → clear scoped vars from .admin-layout.
   */
  useEffect(() => {
    const handleNavigation = () => {
      const prev = prevPathRef.current;
      const curr = window.location.pathname;
      prevPathRef.current = curr;

      // Leaving admin: clear admin-scoped inline vars
      if (prev.startsWith('/admin') && !curr.startsWith('/admin')) {
        clearAdminScopedVars();
      }
    };

    // React Router uses the History API; listen for pushState/popstate
    window.addEventListener('popstate', handleNavigation);

    // Patch pushState & replaceState to fire a custom event
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = (...args) => {
      origPush(...args);
      handleNavigation();
    };
    history.replaceState = (...args) => {
      origReplace(...args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  /**
   * Resolves OS color scheme preference when in 'system' mode.
   */
  const resolveSystemTheme = useCallback(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const chosen = BUILTIN_THEMES.find(t => t.slug === (isDark ? 'dark' : 'light')) || BUILTIN_THEMES[BUILTIN_THEMES.length - 1];
    setActiveTheme(chosen);
    applyThemeVariables(chosen.config, chosen.background_image);
  }, [applyThemeVariables]);

  /**
   * Fetch complete theme catalog.
   * Uses /api/auth/themes/ (pagination disabled on backend) → plain array.
   * Safety net: also handles paginated { count, results } format.
   *
   * Strategy:
   *  - DB custom themes (theme_type='custom') are used as-is from the API
   *    since they carry background_image_url, etc.
   *  - DB built-in themes may lack CSS variable config; we enrich them with
   *    the local BUILTIN_THEMES config so their CSS tokens are always present.
   */
  const fetchAvailableThemes = useCallback(async () => {
    try {
      const res = await api.get('/auth/themes/');

      // Support both plain array and paginated { count, results } responses
      const rawThemes = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

      if (rawThemes.length > 0) {
        // Enrich DB builtin themes with rich local CSS config (DB rows may lack full config)
        const enriched = rawThemes.map(dbTheme => {
          if (dbTheme.theme_type === 'builtin' || dbTheme.theme_type === 'custom') {
            const localMatch = BUILTIN_THEMES.find(
              b => b.slug === dbTheme.slug || b.id === dbTheme.slug
            );
            if (localMatch && dbTheme.theme_type === 'builtin') {
              // Merge: keep DB metadata (id, name, etc.) but use local CSS config
              return { ...localMatch, ...dbTheme, config: localMatch.config || dbTheme.config };
            }
          }
          return dbTheme;
        });

        // Append any local builtins not present in DB (e.g. first-run before seed)
        const dbSlugs = new Set(rawThemes.map(t => t.slug));
        const missing = BUILTIN_THEMES.filter(b => !dbSlugs.has(b.slug));
        setAvailableThemes([...enriched, ...missing]);
      } else {
        // Empty response or error — use local builtins only
        setAvailableThemes(BUILTIN_THEMES);
      }
    } catch (e) {
      console.warn('Could not fetch themes, defaulting to builtins:', e?.message || e);
      setAvailableThemes(BUILTIN_THEMES);
    }
  }, []);

  /**
   * Resolve active theme hierarchy from backend API.
   */
  const syncActiveTheme = useCallback(async () => {
    try {
      const res = await api.get('/themes/active/');
      const resolved = res.data;
      if (resolved) {
        setResolutionSource(resolved.resolution_source || 'system_default');

        if (
          resolved.resolution_source === 'mandatory_scheduled' ||
          resolved.resolution_source === 'university_branding'
        ) {
          setActiveTheme(resolved);
          applyThemeVariables(resolved.config, resolved.background_image_url || resolved.background_image);
          localStorage.setItem('studyhub_theme_cache', JSON.stringify(resolved));
          return;
        }

        const savedMode = user?.appearance?.mode_preference || resolved.mode_preference || 'system';
        setThemeModeState(savedMode);

        if (savedMode === 'system' && resolved.resolution_source === 'system_default') {
          resolveSystemTheme();
        } else {
          setActiveTheme(resolved);
          applyThemeVariables(resolved.config, resolved.background_image_url || resolved.background_image);
        }
        localStorage.setItem('studyhub_theme_cache', JSON.stringify(resolved));
      }
    } catch (e) {
      console.warn('Fallback to local theme cache:', e?.message || e);
      const cached = localStorage.getItem('studyhub_theme_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setActiveTheme(parsed);
          applyThemeVariables(parsed.config, parsed.background_image_url || parsed.background_image);
          return;
        } catch (err) {
          console.error(err);
        }
      }
      resolveSystemTheme();
    }
  }, [user, applyThemeVariables, resolveSystemTheme]);

  // Initial loading & listeners
  useEffect(() => {
    fetchAvailableThemes();
    if (!authLoading) {
      syncActiveTheme();
    }
  }, [authLoading, fetchAvailableThemes, syncActiveTheme]);

  // OS color scheme listener
  useEffect(() => {
    if (themeMode !== 'system' || resolutionSource === 'mandatory_scheduled') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => resolveSystemTheme();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [themeMode, resolutionSource, resolveSystemTheme]);

  /** Preview a theme without persisting to DB. */
  const previewTheme = (theme) => {
    setActiveTheme(theme);
    applyThemeVariables(theme.config, theme.background_image || theme.preview_image);
  };

  /** Apply raw CSS variable tokens (Admin Theme Builder). */
  const applyCustomTokens = (cssVariables) => applyThemeVariables(cssVariables);

  /** Reset preview to saved DB state. */
  const resetToSaved = () => syncActiveTheme();

  /** Switch mode: 'light' | 'dark' | 'system'. */
  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    if (mode === 'system') {
      resolveSystemTheme();
    } else {
      const t = getBuiltinTheme(mode === 'light' ? 'light' : 'dark');
      setActiveTheme(t);
      applyThemeVariables(t.config);
    }
    if (user) {
      try {
        await api.patch('/auth/appearance/', { mode_preference: mode });
      } catch (e) {
        console.warn('Could not persist mode preference:', e);
      }
    }
  };

  /**
   * Save explicit theme choice to user profile.
   * Handles two cases:
   *   1. DB theme with integer id   → PATCH /auth/appearance/ { selected_theme: id }
   *   2. Local builtin (no DB id)   → just apply locally (no backend persistence needed
   *      since the theme lives in themeConfig.js, not the database)
   */
  const saveTheme = async (theme) => {
    setIsSaving(true);

    // Normalise: accept either a theme object or a raw id/slug
    const themeObj = typeof theme === 'object' ? theme : null;
    const themeId  = themeObj?.id ?? theme; // numeric DB id or slug string

    try {
      // Only attempt backend persistence when we have a real integer DB id
      if (Number.isInteger(themeId) || (typeof themeId === 'string' && /^\d+$/.test(String(themeId)))) {
        const res = await api.patch('/auth/appearance/', { selected_theme: themeId });
        if (res.data?.selected_theme_detail) {
          const saved = res.data.selected_theme_detail;
          setActiveTheme(saved);
          applyThemeVariables(saved.config, saved.background_image_url || saved.background_image);
          localStorage.setItem('studyhub_theme_cache', JSON.stringify(saved));
          return { success: true };
        }
      }

      // For local builtin themes (id is a slug like 'theme-light'), just apply locally
      if (themeObj?.config) {
        setActiveTheme(themeObj);
        applyThemeVariables(themeObj.config, themeObj.background_image_url || themeObj.background_image);
        localStorage.setItem('studyhub_theme_cache', JSON.stringify(themeObj));
        return { success: true };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save theme:', error);
      // Still apply locally so the UI reflects the selection
      if (themeObj?.config) {
        setActiveTheme(themeObj);
        applyThemeVariables(themeObj.config, themeObj.background_image_url || themeObj.background_image);
        localStorage.setItem('studyhub_theme_cache', JSON.stringify(themeObj));
      }
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTheme = async (themeId) => {
    try {
      await api.delete(`/auth/themes/${themeId}/`);
      // Remove it from available themes
      setAvailableThemes(prev => prev.filter(t => t.id !== themeId));
      // If the deleted theme was active, the backend defaults to the light theme.
      // We should sync the active theme to reflect this.
      if (activeTheme?.id === themeId) {
        await syncActiveTheme();
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to delete theme:', error);
      return { success: false, error };
    }
  };

  return (
    <ThemeContext.Provider value={{
      activeTheme,
      availableThemes,
      themeMode,
      setThemeMode,
      resolutionSource,
      previewTheme,
      applyCustomTokens,
      saveTheme,
      deleteTheme,
      resetToSaved,
      refreshThemes: fetchAvailableThemes,
      reapplyToAdminLayout,
      isSaving
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
export default ThemeProvider;
