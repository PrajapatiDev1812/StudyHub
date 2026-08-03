import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
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
  // Also apply new adaptive theme tokens if present
  const adaptiveTheme = localStorage.getItem('studyhub_theme');
  if (adaptiveTheme) {
    const parsed = JSON.parse(adaptiveTheme);
    if (parsed) {
      const root = document.documentElement;
      Object.entries(parsed).forEach(([variable, value]) => {
        root.style.setProperty(`--theme-${variable}`, value);
      });
    }
  }
} catch {
  // Ignore parse errors on boot
}

async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }
  
  const { worker } = await import('./mocks/browser')
  
  return worker.start({
    onUnhandledRequest: 'bypass', 
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
})
