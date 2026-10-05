function kMeans(pixels, k, maxIterations = 10) {
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const randomIdx = Math.floor(Math.random() * pixels.length);
    centroids.push([...pixels[randomIdx]]);
  }

  let clusters = new Array(k).fill(0).map(() => []);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    clusters = new Array(k).fill(0).map(() => []);
    
    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i];
      let minDst = Infinity;
      let clusterIdx = 0;
      for (let j = 0; j < k; j++) {
        const c = centroids[j];
        const dst = Math.pow(p[0]-c[0], 2) + Math.pow(p[1]-c[1], 2) + Math.pow(p[2]-c[2], 2);
        if (dst < minDst) {
          minDst = dst;
          clusterIdx = j;
        }
      }
      clusters[clusterIdx].push(p);
    }
    
    let changed = false;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      
      let sumR = 0, sumG = 0, sumB = 0;
      for (let p of clusters[i]) {
        sumR += p[0];
        sumG += p[1];
        sumB += p[2];
      }
      
      const newR = Math.round(sumR / clusters[i].length);
      const newG = Math.round(sumG / clusters[i].length);
      const newB = Math.round(sumB / clusters[i].length);
      
      if (centroids[i][0] !== newR || centroids[i][1] !== newG || centroids[i][2] !== newB) {
        changed = true;
        centroids[i] = [newR, newG, newB];
      }
    }
    
    if (!changed) break;
  }
  
  const sortedCentroids = centroids.map((centroid, i) => ({
    color: centroid,
    size: clusters[i].length
  })).sort((a, b) => b.size - a.size);
  
  return sortedCentroids.map(c => c.color);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if(max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if(s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r, g, b) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

self.onmessage = function(e) {
  const { imageData } = e.data;
  const pixels = [];
  
  const stride = 16; 
  for (let i = 0; i < imageData.data.length; i += 4 * stride) {
    pixels.push([
      imageData.data[i],
      imageData.data[i+1],
      imageData.data[i+2]
    ]);
  }
  
  const dominantColors = kMeans(pixels, 5);
  const primaryRgb = dominantColors[0];
  const primaryHex = rgbToHex(...primaryRgb);
  
  const [h, s, l] = rgbToHsl(...primaryRgb);
  const surfaceRgb = hslToRgb(h, s, l > 50 ? l - 40 : l + 40);
  const surfaceHex = rgbToHex(...surfaceRgb);
  
  const borderRgb = hslToRgb(h, Math.max(0, s - 40), l);
  const borderHex = rgbToHex(...borderRgb);
  
  const accentRgb = hslToRgb((h + 30) % 360, s, l);
  const accentHex = rgbToHex(...accentRgb);
  
  const mutedRgb = hslToRgb(h, s * 0.5, l > 50 ? l - 20 : l + 20);
  const mutedHex = rgbToHex(...mutedRgb);
  
  self.postMessage({
    palette: {
      primary: primaryHex,
      surface: surfaceHex,
      border: borderHex,
      accent: accentHex,
      muted: mutedHex
    }
  });
};
