import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Run SYNCHRONOUSLY before React paints to prevent the "Flash of Unstyled Content" (FOUC)
// This strictly guarantees the background is painted with the exact saved theme on frame 0.
try {
  const cachedTheme = localStorage.getItem('studyhub_theme_cache');
  if (cachedTheme) {
    const parsed = JSON.parse(cachedTheme);
    if (parsed && parsed.config) {
      const root = document.documentElement;
      Object.entries(parsed.config).forEach(([variable, value]) => {
        root.style.setProperty(variable, value);
      });
      if (parsed.background_image) {
        root.style.setProperty('--theme-bg-img', `url("${parsed.background_image}")`);
      }
    }
  }
} catch (e) {
  // Ignore parse errors on boot
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
