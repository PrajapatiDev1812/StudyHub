/**
 * StudyHub Enterprise Color Generation Engine
 * Given a primary color (and optional mode), algorithmically generates a complete harmonious,
 * visually engaging palette with hover states, surface variations, borders, and shadows.
 */

export function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

export function adjustLightness(hex, delta) {
  const { h, s, l } = hexToHsl(hex);
  const newL = Math.max(0, Math.min(100, l + delta));
  return hslToHex(h, s, newL);
}

export function adjustSaturation(hex, delta) {
  const { h, s, l } = hexToHsl(hex);
  const newS = Math.max(0, Math.min(100, s + delta));
  return hslToHex(h, newS, l);
}

export function generateHarmonies(primaryHex, mode = 'dark') {
  const { h, s, l } = hexToHsl(primaryHex || '#6366F1');
  
  // Analogous and complementary secondary/accent tones
  const secondaryH = (h + 30) % 360;
  const accentH = (h + 150) % 360;
  
  const secondary = hslToHex(secondaryH, Math.min(s, 85), l);
  const accent = hslToHex(accentH, Math.min(s, 90), mode === 'dark' ? 65 : 45);
  
  const primaryLight = adjustLightness(primaryHex, mode === 'dark' ? 15 : 20);
  const primaryDark = adjustLightness(primaryHex, mode === 'dark' ? -15 : -20);
  
  const palette = {
    primary: primaryHex,
    primaryLight,
    primaryDark,
    secondary,
    accent,
    // Background and surfaces
    backgroundPrimary: mode === 'dark' ? '#020617' : '#F8FAFC',
    backgroundSecondary: mode === 'dark' ? '#0F172A' : '#F1F5F9',
    surface: mode === 'dark' ? '#1E293B' : '#FFFFFF',
    card: mode === 'dark' ? '#1E293B' : '#FFFFFF',
    border: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    textPrimary: mode === 'dark' ? '#F8FAFC' : '#0F172A',
    textSecondary: mode === 'dark' ? '#94A3B8' : '#475569',
    textMuted: mode === 'dark' ? '#64748B' : '#94A3B8',
    buttonBg: primaryHex,
    buttonHover: primaryLight,
    shadow: mode === 'dark' ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  };

  // Build dual-token CSS mappings (new enterprise + legacy aliases)
  const cssVariables = {
    // Enterprise Tokens
    '--primary-color': palette.primary,
    '--primary-light': palette.primaryLight,
    '--primary-dark': palette.primaryDark,
    '--secondary-color': palette.secondary,
    '--accent-color': palette.accent,
    '--background-primary': palette.backgroundPrimary,
    '--background-secondary': palette.backgroundSecondary,
    '--surface-color': palette.surface,
    '--card-background': palette.card,
    '--text-primary': palette.textPrimary,
    '--text-secondary': palette.textSecondary,
    '--text-muted': palette.textMuted,
    '--border-color': palette.border,
    '--shadow-color': palette.shadow,
    '--button-background': palette.buttonBg,
    '--hover-background': palette.buttonHover,
    '--success-color': palette.success,
    '--warning-color': palette.warning,
    '--error-color': palette.error,
    '--info-color': palette.info,

    // Legacy Token Aliases (Ensures ZERO visual regressions in existing app)
    '--bg-primary': palette.backgroundPrimary,
    '--bg-secondary': palette.backgroundSecondary,
    '--bg-card': palette.card,
    '--bg-card-hover': mode === 'dark' ? '#334155' : '#F8FAFC',
    '--bg-hover': mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    '--text-color': palette.textPrimary,
    '--accent-primary': palette.primary,
    '--accent-secondary': palette.secondary,
    '--gradient-primary': `linear-gradient(135deg, ${palette.primary} 0%, ${palette.accent} 100%)`,
  };

  return { palette, cssVariables };
}
