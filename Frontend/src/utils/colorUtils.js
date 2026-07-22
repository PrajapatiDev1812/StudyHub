export const getLuminance = (r, g, b) => {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const getContrastRatio = (l1, l2) => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

export const rgbToHex = (r, g, b) => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
};

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const getAccessibleTextColor = (hexColor) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#0f172a";
  const bgLuminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const whiteLuminance = getLuminance(255, 255, 255);
  const blackLuminance = getLuminance(15, 23, 42);
  
  const whiteContrast = getContrastRatio(whiteLuminance, bgLuminance);
  const blackContrast = getContrastRatio(blackLuminance, bgLuminance);
  
  if (whiteContrast >= 4.5) return "#ffffff";
  if (blackContrast >= 4.5) return "#0f172a";
  
  return whiteContrast > blackContrast ? "#ffffff" : "#0f172a";
};
