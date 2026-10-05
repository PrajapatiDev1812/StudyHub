import React, { memo } from 'react';
import { useContinueLearning } from '../../hooks/queries';
import { WidgetSkeleton, WidgetError, WidgetEmpty } from './WidgetStates';
import { PlayCircle } from 'lucide-react';

const ContinueLearning = memo(({ studentId }) => {
  const { data, isLoading, isError, refetch } = useContinueLearning(studentId);

  if (isLoading) return <WidgetSkeleton className="h-40 md:col-span-8 col-span-12" />;
  if (isError) return <WidgetError message="Could not load continue learning" onRetry={refetch} />;
  if (!data) return <WidgetEmpty message="Ready to begin? Browse your enrolled courses." ctaLabel="Browse Courses" />;

  return (
    <div className="col-span-12 md:col-span-8 glass-card p-6 flex flex-col justify-between group cursor-pointer hover:border-[var(--theme-primary)] transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-[var(--theme-muted)] uppercase tracking-wider mb-1">Continue Learning</p>
          <h2 className="text-lg font-bold text-[var(--theme-text)]">{data.course_title}</h2>
          <p className="text-sm text-[var(--theme-text)]/80 mt-1">{data.module_title}</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[var(--theme-primary)]/10 flex items-center justify-center text-[var(--theme-primary)] group-hover:scale-110 transition-transform">
          <PlayCircle className="w-6 h-6" />
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-xs text-[var(--theme-muted)] mb-2">
          <span>Progress</span>
          <span>{data.progress_percentage}%</span>
        </div>
        <div className="w-full bg-[var(--theme-border)] rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-[var(--theme-primary)] h-1.5 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${data.progress_percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
});

export default ContinueLearning;
