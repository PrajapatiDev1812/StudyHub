import React, { memo } from 'react';
import { useStudentOverview } from '../../hooks/queries';
import { WidgetSkeleton, WidgetError } from './WidgetStates';

const WelcomeBanner = memo(({ studentId }) => {
  const { data, isLoading, isError, refetch } = useStudentOverview(studentId);

  if (isLoading) return <WidgetSkeleton className="h-24 md:h-32 col-span-12" />;
  if (isError) return <WidgetError message="Could not load profile" onRetry={refetch} />;

  return (
    <div className="col-span-12 glass-card flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 bg-gradient-to-r from-[var(--theme-surface)] to-[var(--theme-primary)]/20 border-l-4 border-l-[var(--theme-primary)]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--theme-text)] mb-2">
          Welcome back, {data?.first_name}!
        </h1>
        <p className="text-[var(--theme-muted)] text-sm md:text-base">
          You're on a {data?.streak_days}-day learning streak. Keep it up!
        </p>
      </div>
      <div className="mt-4 md:mt-0 flex gap-4">
        <div className="text-center px-4 border-r border-[var(--theme-border)]">
          <p className="text-2xl font-bold text-[var(--theme-text)]">{data?.total_courses}</p>
          <p className="text-xs text-[var(--theme-muted)] uppercase tracking-wider">Courses</p>
        </div>
        <div className="text-center px-4">
          <p className="text-2xl font-bold text-[var(--theme-primary)]">{data?.overall_progress}%</p>
          <p className="text-xs text-[var(--theme-muted)] uppercase tracking-wider">Progress</p>
        </div>
      </div>
    </div>
  );
});

export default WelcomeBanner;
