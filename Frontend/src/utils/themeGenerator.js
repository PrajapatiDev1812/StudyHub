/**
 * Utility to extract dominant and accent colors from a File (Image) 
 * and generate dynamic, cohesive CSS Theme Tokens.
 */

// Helper to calculate perceived brightness (0-255)
const getBrightness = (r, g, b) => (r * 299 + g * 587 + b * 114) / 1000;

// Helper to convert RGB to HSL
const rgbToHsl = (r, g, b) => {
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
  return [h * 360, s * 100, l * 100];
};

// Helper to convert HSL to RGB string
const hslToRgbStr = (h, s, l, a = 1) => {
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
};

export const generateThemeFromImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Scale down significantly for faster sampling
        const scale = 100 / Math.max(img.width, img.height);
        canvas.width = Math.max(1, img.width * scale);
        canvas.height = Math.max(1, img.height * scale);
        
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        try {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // A better extraction algorithm that focuses on colorful pixels
          let totalR = 0, totalG = 0, totalB = 0;
          let pixelCount = 0;
          
          let colorfulR = 0, colorfulG = 0, colorfulB = 0;
          let colorfulCount = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            if (a < 128) continue;
            
            totalR += r; totalG += g; totalB += b;
            pixelCount++;
            
            // Check if pixel is "colorful" (not too gray, not too dark, not too bright)
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            
            if (saturation > 0.15 && max > 30 && max < 240) {
              colorfulR += r;
              colorfulG += g;
              colorfulB += b;
              colorfulCount++;
            }
          }

          if (pixelCount === 0) throw new Error("No pixels found");

          // Target the central hue of the image
          const useColorful = colorfulCount > (pixelCount * 0.05); // If at least 5% of image is colorful
          const avgR = Math.floor((useColorful ? colorfulR / colorfulCount : totalR / pixelCount));
          const avgG = Math.floor((useColorful ? colorfulG / colorfulCount : totalG / pixelCount));
          const avgB = Math.floor((useColorful ? colorfulB / colorfulCount : totalB / pixelCount));
          
          const overallR = Math.floor(totalR / pixelCount);
          const overallG = Math.floor(totalG / pixelCount);
          const overallB = Math.floor(totalB / pixelCount);
          
          const [domH, domS, domL] = rgbToHsl(avgR, avgG, avgB);
          const [accH, accS, accL] = rgbToHsl(overallR, overallG, overallB);
          
          const domBrightness = getBrightness(overallR, overallG, overallB);
          // If image overall is dark, make the theme dark. 
          const isDark = domBrightness < 130;

          // Instead of hardcapping saturation extremely low, let the hue bleed into the glass.
          // Warm images will get warm glass, cool images cool glass.
          const baseH = domH;
          const baseS = isDark ? Math.min(domS, 45) : Math.min(domS, 25);
          
          const surfaceL = isDark ? 12 : 95;
          const cardL = isDark ? 16 : 92;
          const hoverL = isDark ? 20 : 88;
          const borderL = isDark ? 30 : 80;
          
          // Accent popping
          let primaryH = (domS > 15) ? baseH : accH;
          let primaryS = Math.max(65, domS); 
          let primaryL = isDark ? 65 : 45;

          const primaryHex = hslToRgbStr(primaryH, primaryS, primaryL);
          const secondaryHex = hslToRgbStr((primaryH + 35) % 360, primaryS, primaryL);

          const textPrimary = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(10, 10, 10, 0.95)';
          const textSecondary = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 10, 10, 0.7)';
          const textMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(10, 10, 10, 0.5)';

          const config = {
             // Main Backgrounds
            '--bg-primary': 'transparent', // controlled by wallpaper
            '--backgroundOverlay': hslToRgbStr(baseH, baseS, isDark ? 8 : 95, 0.75), 
            
            // Surfaces
            '--bg-surface': hslToRgbStr(baseH, baseS, surfaceL, 0.85),
            '--surfaceSecondary': hslToRgbStr(baseH, baseS, cardL, 0.85),
            '--bg-sidebar': hslToRgbStr(baseH, baseS, isDark ? 10 : 98, 0.90),
            '--bg-navbar': hslToRgbStr(baseH, baseS, isDark ? 12 : 96, 0.85),
            '--bg-panel': hslToRgbStr(baseH, baseS, cardL, 0.90),
            
            // Cards
            '--bg-card': hslToRgbStr(baseH, baseS, cardL, 0.65), 
            '--bg-card-hover': hslToRgbStr(baseH, baseS, hoverL, 0.75),
            
            // Glass specific
            '--glassTint': isDark ? `hsla(${baseH}, ${baseS}%, 50%, 0.05)` : `hsla(${baseH}, ${baseS}%, 50%, 0.1)`,
            '--glassBorder': isDark ? `hsla(${baseH}, ${baseS}%, 80%, 0.1)` : `hsla(${baseH}, ${baseS}%, 20%, 0.1)`,
            '--bg-glass': isDark ? `hsla(${baseH}, ${baseS}%, 80%, 0.06)` : `hsla(${baseH}, ${baseS}%, 20%, 0.04)`,
            '--bg-input': hslToRgbStr(baseH, baseS, isDark ? 22 : 85, 0.6),

            // Text
            '--text-primary': textPrimary,
            '--text-secondary': textSecondary,
            '--text-muted': textMuted,
            '--text-inverse': isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            
            // Accents
            '--accent-primary': primaryHex,
            '--accent-secondary': secondaryHex,
            '--primary': primaryHex,
            '--secondary': secondaryHex,
            '--accent-gradient': `linear-gradient(135deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
            '--accent-glow': isDark ? `0 0 20px ${hslToRgbStr(primaryH, primaryS, primaryL, 0.4)}` : `0 0 20px ${hslToRgbStr(primaryH, primaryS, primaryL, 0.25)}`,
            
            // Borders & Shadows
            '--border-color': hslToRgbStr(baseH, baseS, borderL, 0.25),
            '--border': hslToRgbStr(baseH, baseS, borderL, 0.25),
            '--border-glow': isDark ? `0 0 0 1px ${hslToRgbStr(primaryH, primaryS, primaryL, 0.4)}` : `0 0 0 1px ${hslToRgbStr(primaryH, primaryS, primaryL, 0.3)}`,
            '--shadow-color': isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
            '--glow': isDark ? `0 0 15px hsla(${primaryH}, ${primaryS}%, ${primaryL}%, 0.3)` : `0 0 15px hsla(${primaryH}, ${primaryS}%, ${primaryL}%, 0.15)`,
            
            // Interactive 
            '--tab-active': primaryHex,
            '--tab-inactive': textMuted,
            '--active-item': isDark ? `hsla(${primaryH}, ${primaryS}%, ${primaryL}%, 0.15)` : `hsla(${primaryH}, ${primaryS}%, ${primaryL}%, 0.1)`,
            '--hover-item': isDark ? `hsla(${baseH}, ${baseS}%, 50%, 0.1)` : `hsla(${baseH}, ${baseS}%, 50%, 0.05)`,
            '--button-bg': `linear-gradient(135deg, ${primaryHex} 0%, ${secondaryHex} 100%)`,
            '--button-text': '#ffffff',
            
            // Progress rings/graphs
            '--progress-fill': primaryHex,
            '--progress-track': isDark ? `hsla(${baseH}, ${baseS}%, 60%, 0.15)` : `hsla(${baseH}, ${baseS}%, 40%, 0.1)`,
          };

          resolve({ config, isDark, previewUrl: e.target.result });
        } catch (err) {
          reject('Could not analyze image. ' + err.message);
        }
      };
      
      img.onerror = () => reject('Failed to load image.');
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject('Failed to read file.');
    reader.readAsDataURL(file);
  });
};
