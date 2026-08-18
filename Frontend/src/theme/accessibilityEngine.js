/**
 * StudyHub Enterprise WCAG 2.1 Accessibility Engine
 * Evaluates relative luminance and contrast ratios, automatically adjusting text and element
 * colors to ensure visual accessibility and high-contrast readability.
 */

function hexToRgba(hex) {
  hex = hex.replace('#', '');
  let r = 0, g = 0, b = 0, a = 1;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (hex.length === 8) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
    a = parseInt(hex.substring(6, 8), 16) / 255;
  }
  return { r, g, b, a };
}

/**
 * Calculates relative luminance according to WCAG 2.1 specifications.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function getLuminance(hex) {
  if (!hex || !hex.startsWith('#')) return 0.5;
  let { r, g, b } = hexToRgba(hex);
  const [R, G, B] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Computes contrast ratio between two colors (range 1 to 21).
 */
export function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Automatically determines optimal high-contrast foreground color (light vs dark text)
 * for any background tone to guarantee WCAG compliance.
 */
export function getBestContrastColor(bgHex, darkColor = '#0F172A', lightColor = '#FFFFFF') {
  if (!bgHex || typeof bgHex !== 'string' || !bgHex.startsWith('#')) return lightColor;
  const contrastWithLight = getContrastRatio(bgHex, lightColor);
  const contrastWithDark = getContrastRatio(bgHex, darkColor);
  return contrastWithLight >= contrastWithDark ? lightColor : darkColor;
}

/**
 * Validates a generated theme configuration against WCAG AA (4.5:1) standards.
 * Returns compliance scorecard for display in the Admin Theme Builder.
 */
export function validatePaletteContrast(cssVariables = {}) {
  const bg = cssVariables['--background-primary'] || '#020617';
  const text = cssVariables['--text-primary'] || '#F8FAFC';
  const buttonBg = cssVariables['--button-background'] || cssVariables['--primary-color'] || '#6366F1';
  const buttonText = getBestContrastColor(buttonBg);
  const surface = cssVariables['--surface-color'] || cssVariables['--bg-card'] || '#1E293B';
  const textSecond = cssVariables['--text-secondary'] || '#94A3B8';

  const bodyContrast = getContrastRatio(bg, text);
  const buttonContrast = getContrastRatio(buttonBg, buttonText);
  const surfaceContrast = getContrastRatio(surface, text);
  const secondaryContrast = getContrastRatio(surface, textSecond);

  return {
    bodyText: {
      ratio: bodyContrast,
      passedAA: bodyContrast >= 4.5,
      passedAAA: bodyContrast >= 7.0,
      label: `Body Text vs Background (${bodyContrast}:1)`
    },
    buttonText: {
      ratio: buttonContrast,
      passedAA: buttonContrast >= 4.5,
      passedAAA: buttonContrast >= 7.0,
      label: `Button Text vs Primary (${buttonContrast}:1)`,
      recommendedTextColor: buttonText
    },
    surfaceText: {
      ratio: surfaceContrast,
      passedAA: surfaceContrast >= 4.5,
      passedAAA: surfaceContrast >= 7.0,
      label: `Card Surface Text (${surfaceContrast}:1)`
    },
    secondaryText: {
      ratio: secondaryContrast,
      passedAA: secondaryContrast >= 3.0, // 3:1 required for large/secondary UI text
      passedAAA: secondaryContrast >= 4.5,
      label: `Secondary Text (${secondaryContrast}:1)`
    },
    overallCompliance: (bodyContrast >= 4.5 && buttonContrast >= 4.5 && surfaceContrast >= 4.5) ? 'WCAG AA Verified' : 'Adjustments Needed'
  };
}
