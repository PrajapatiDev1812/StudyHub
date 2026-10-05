import React, { memo } from 'react';
import { useDailyGoal, useAIRecommendations, useUpcomingEvents } from '../../hooks/queries';
import { WidgetSkeleton, WidgetError, WidgetEmpty } from './WidgetStates';
import { Target, Zap, Calendar, AlertCircle } from 'lucide-react';

export const DailyGoal = memo(({ studentId }) => {
  const { data, isLoading, isError, refetch } = useDailyGoal(studentId);

  if (isLoading) return <WidgetSkeleton className="h-40 md:col-span-4 col-span-12" />;
  if (isError) return <WidgetError onRetry={refetch} />;
  
  const progress = Math.min((data.completed_minutes / data.target_minutes) * 100, 100);

  return (
    <div className="col-span-12 md:col-span-4 glass-card p-6 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-[var(--theme-accent)]" />
        <h2 className="text-sm font-semibold text-[var(--theme-text)]">Daily Goal</h2>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold text-[var(--theme-text)]">{data.completed_minutes}</span>
        <span className="text-sm text-[var(--theme-muted)] mb-1">/ {data.target_minutes} min</span>
      </div>
      <div className="w-full bg-[var(--theme-border)] rounded-full h-2 mt-2">
        <div 
          className="bg-[var(--theme-accent)] h-2 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

export const AIRecommendations = memo(({ studentId }) => {
  const { data, isLoading, isError, refetch } = useAIRecommendations(studentId);

  if (isLoading) return <WidgetSkeleton className="h-40 md:col-span-4 col-span-12" />;
  if (isError) return <WidgetError onRetry={refetch} />;
  if (!data || data.length === 0) return <WidgetEmpty message="Complete at least one quiz to unlock AI suggestions." />;

  return (
    <div className="col-span-12 md:col-span-4 glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h2 className="text-sm font-semibold text-[var(--theme-text)]">AI Recommendations</h2>
      </div>
      <div className="space-y-3">
        {data.slice(0, 2).map((item) => (
          <div key={item.id} className="p-3 bg-[var(--theme-border)]/30 rounded-lg hover:bg-[var(--theme-border)]/50 transition-colors cursor-pointer border border-transparent hover:border-[var(--theme-primary)]/50">
            <h3 className="text-sm font-medium text-[var(--theme-text)] truncate">{item.title}</h3>
            <p className="text-xs text-[var(--theme-muted)] mt-1 truncate">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export const UpcomingEvents = memo(({ studentId }) => {
  const { data, isLoading, isError, refetch } = useUpcomingEvents(studentId);

  if (isLoading) return <WidgetSkeleton className="h-40 md:col-span-4 col-span-12" />;
  if (isError) return <WidgetError onRetry={refetch} />;
  if (!data || data.length === 0) return <WidgetEmpty message="No upcoming events." />;

  return (
    <div className="col-span-12 md:col-span-4 glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[var(--theme-primary)]" />
        <h2 className="text-sm font-semibold text-[var(--theme-text)]">Upcoming</h2>
      </div>
      <div className="space-y-3">
        {data.slice(0, 2).map((event) => (
          <div key={event.id} className="flex items-start gap-3">
            <div className={`w-2 h-2 mt-1.5 rounded-full ${event.urgency === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <div>
              <h3 className="text-sm font-medium text-[var(--theme-text)]">{event.title}</h3>
              <p className="text-xs text-[var(--theme-muted)]">{new Date(event.due_date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
