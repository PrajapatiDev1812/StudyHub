import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Settings, Search } from 'lucide-react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

// Eagerly Loaded Widgets
import WelcomeBanner from '../components/widgets/WelcomeBanner';
import ContinueLearning from '../components/widgets/ContinueLearning';
import { DailyGoal, AIRecommendations, UpcomingEvents } from '../components/widgets/MiscWidgets';
import { WidgetSkeleton } from '../components/widgets/WidgetStates';

import ThemeSettingsPanel from '../components/ThemeSettingsPanel';

// Lazy Loaded Widgets (below fold)
const WeeklyAnalytics = lazy(() => import('../components/widgets/LazyWidgets').then(module => ({ default: module.WeeklyAnalytics })));
const ActivityFeed = lazy(() => import('../components/widgets/LazyWidgets').then(module => ({ default: module.ActivityFeed })));

// Lazy Load Command Palette
const CommandPalette = lazy(() => import('../components/CommandPalette'));

export default function Dashboard() {
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isCommandPaletteLoaded, setIsCommandPaletteLoaded] = useState(false);

  // We assume a logged in student ID for development
  const studentId = '123';

  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        if (!isCommandPaletteLoaded) {
          setIsCommandPaletteLoaded(true);
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCommandPaletteLoaded]);

  // Load command palette on demand (Cmd+K is caught by global listener in App, but if they click the fake search bar)
  const handleSearchClick = () => {
    setIsCommandPaletteLoaded(true);
    // Dispatch a synthetic event to trigger the palette's internal listener
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    }, 100);
  };

  // Preload on first global interaction could also be done in App.jsx

  return (
    <div className="min-h-screen bg-[var(--theme-surface)]/10 text-[var(--theme-text)] transition-colors duration-500">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-[var(--theme-border)] bg-[var(--theme-surface)]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 w-full max-w-xl">
          <h1 className="font-bold text-xl tracking-tight text-[var(--theme-primary)]">StudyHub</h1>
          
          <button 
            onClick={handleSearchClick}
            className="flex-1 flex items-center px-4 py-2 bg-[var(--theme-border)]/50 hover:bg-[var(--theme-border)] border border-[var(--theme-border)] rounded-md text-sm text-[var(--theme-muted)] transition-colors max-w-sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Search... <span className="ml-auto text-xs border border-[var(--theme-border)] rounded px-1 py-0.5">⌘K</span>
          </button>
        </div>

        <button 
          onClick={() => setIsThemePanelOpen(true)}
          className="p-2 rounded-full hover:bg-[var(--theme-border)] transition-colors"
          aria-label="Theme Settings"
        >
          <Settings className="w-5 h-5 text-[var(--theme-muted)] hover:text-[var(--theme-text)]" />
        </button>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-12 gap-4 md:gap-6 auto-rows-max">
          
          {/* Eager Above-The-Fold */}
          <WelcomeBanner studentId={studentId} />
          
          <ContinueLearning studentId={studentId} />
          
          {(!flagsLoading && flags?.ai_insights !== false) && (
            <AIRecommendations studentId={studentId} />
          )}

          {/* 
            Desktop: [Progress - 4] [Daily Goal - 4] [Upcoming - 4]
            We just mocked Daily Goal and Upcoming. 
            We'll let them reflow based on feature flags.
          */}
          <DailyGoal studentId={studentId} />
          <UpcomingEvents studentId={studentId} />

          {/* Lazy Below-The-Fold */}
          <Suspense fallback={<WidgetSkeleton className="h-72 md:col-span-8 col-span-12" />}>
            <WeeklyAnalytics studentId={studentId} />
          </Suspense>

          <Suspense fallback={<WidgetSkeleton className="h-72 md:col-span-4 col-span-12" />}>
            <ActivityFeed studentId={studentId} />
          </Suspense>

        </div>
      </main>

      {/* Slide-over Settings */}
      <ThemeSettingsPanel isOpen={isThemePanelOpen} onClose={() => setIsThemePanelOpen(false)} />
      
      {/* Dynamic Command Palette Loading */}
      {isCommandPaletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      )}
    </div>
  );
}
