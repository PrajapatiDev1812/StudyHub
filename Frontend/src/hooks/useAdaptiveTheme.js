import { useState, useEffect, useRef, useCallback } from 'react';
import { getAccessibleTextColor } from '../utils/colorUtils';
import ThemeWorker from '../workers/themeWorker?worker';

export const useAdaptiveTheme = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPalette, setPreviewPalette] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const workerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const cached = localStorage.getItem('studyhub_theme');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCurrentTheme(parsed);
        applyTokens(parsed);
      } catch(e) {}
    }
  }, []);

  const applyTokens = (palette) => {
    const root = document.documentElement;
    const text = getAccessibleTextColor(palette.surface);
    const updatedPalette = { ...palette, text };
    
    Object.entries(updatedPalette).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    localStorage.setItem('studyhub_theme', JSON.stringify(updatedPalette));
    setCurrentTheme(updatedPalette);
  };

  const processImage = useCallback(async (fileOrUrl) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    return new Promise((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setIsProcessing(true);
        
        try {
          let file;
          if (typeof fileOrUrl === 'string') {
            const res = await fetch(fileOrUrl);
            file = await res.blob();
          } else {
            file = fileOrUrl;
          }

          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.crossOrigin = "Anonymous";
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const MAX_DIM = 800;
            let w = img.width;
            let h = img.height;
            if (w > MAX_DIM || h > MAX_DIM) {
              const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
              w = w * ratio;
              h = h * ratio;
            }
            
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            
            if (workerRef.current) workerRef.current.terminate();
            workerRef.current = new ThemeWorker();
            
            workerRef.current.onmessage = (e) => {
              const { palette } = e.data;
              palette.text = getAccessibleTextColor(palette.surface);
              setPreviewPalette(palette);
              setIsProcessing(false);
              resolve(palette);
            };
            
            workerRef.current.postMessage({ imageData });
          };
          img.onerror = () => {
            setIsProcessing(false);
            resolve(null);
          };
        } catch (err) {
          console.error("Error processing image:", err);
          setIsProcessing(false);
          resolve(null);
        }
      }, 200); 
    });
  }, []);

  const confirmTheme = useCallback(() => {
    if (previewPalette) {
      applyTokens(previewPalette);
      setPreviewPalette(null);
    }
  }, [previewPalette]);

  const cancelTheme = useCallback(() => {
    setPreviewPalette(null);
  }, []);

  const resetTheme = useCallback(() => {
    const defaultPalette = {
      primary: '#6366f1',
      surface: '#1e293b',
      border: '#334155',
      accent: '#06b6d4',
      muted: '#475569',
      text: '#ffffff'
    };
    applyTokens(defaultPalette);
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    isProcessing,
    previewPalette,
    currentTheme,
    processImage,
    confirmTheme,
    cancelTheme,
    resetTheme
  };
};
