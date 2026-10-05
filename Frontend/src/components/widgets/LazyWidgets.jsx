import React, { memo } from 'react';
import { useWeeklyAnalytics, useActivityFeed } from '../../hooks/queries';
import { WidgetSkeleton, WidgetError, WidgetEmpty } from './WidgetStates';
import ResponsiveBarChart from '../charts/ResponsiveBarChart';
import { Activity } from 'lucide-react';

export const WeeklyAnalytics = memo(({ studentId }) => {
  const { data, isLoading, isError, refetch } = useWeeklyAnalytics(studentId);

  if (isLoading) return <WidgetSkeleton className="h-72 md:col-span-8 col-span-12" />;
  if (isError) return <WidgetError onRetry={refetch} />;

  return (
    <div className="col-span-12 md:col-span-8 glass-card p-6">
      <h2 className="text-sm font-semibold text-[var(--theme-text)] mb-6">Weekly Study Activity</h2>
      <ResponsiveBarChart data={data} xKey="day" yKey="minutes" />
    </div>
  );
});

export const ActivityFeed = memo(({ studentId }) => {
  const { data, isLoading, isError, refetch } = useActivityFeed(studentId);

  if (isLoading) return <WidgetSkeleton className="h-72 md:col-span-4 col-span-12" />;
  if (isError) return <WidgetError onRetry={refetch} />;
  if (!data || data.length === 0) return <WidgetEmpty message="No recent activity. Start learning to populate your feed." />;

  return (
    <div className="col-span-12 md:col-span-4 glass-card p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[var(--theme-primary)]" />
        <h2 className="text-sm font-semibold text-[var(--theme-text)]">Recent Activity</h2>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4" aria-live="polite">
        {data.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--theme-primary)]" />
            <div>
              <p className="text-sm text-[var(--theme-text)]">
                <span className="font-medium capitalize">{item.action.replace('_', ' ')}:</span> {item.target}
              </p>
              <p className="text-xs text-[var(--theme-muted)]">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
