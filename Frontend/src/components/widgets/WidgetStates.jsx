import React from 'react';

export function WidgetSkeleton({ className = "" }) {
  return (
    <div className={`glass-card animate-pulse bg-[var(--theme-border)]/50 ${className}`}></div>
  );
}

export function WidgetError({ message, onRetry }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center p-6 text-center h-full min-h-[160px]">
      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
        <span className="text-red-400 font-bold text-xl">!</span>
      </div>
      <p className="text-[var(--theme-text)] text-sm mb-4">{message || "Failed to load data"}</p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-[var(--theme-border)] hover:bg-[var(--theme-muted)] text-[var(--theme-text)] rounded-md text-xs font-medium transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export function WidgetEmpty({ message, ctaLabel, ctaAction }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center p-6 text-center h-full min-h-[160px]">
      <p className="text-[var(--theme-muted)] text-sm mb-4">{message}</p>
      {ctaLabel && (
        <button 
          onClick={ctaAction}
          className="px-4 py-2 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white rounded-md text-xs font-medium transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
