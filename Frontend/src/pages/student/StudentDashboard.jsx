import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

import WelcomeSection from '../../components/widgets/dashboard/WelcomeSection';
import ContinueLearningCard from '../../components/widgets/dashboard/ContinueLearningCard';
import AIRecommendationsCard from '../../components/widgets/dashboard/AIRecommendationsCard';
import ProgressSummaryCard from '../../components/widgets/dashboard/ProgressSummaryCard';
import DailyGoalCard from '../../components/widgets/dashboard/DailyGoalCard';
import UpcomingActivitiesCard from '../../components/widgets/dashboard/UpcomingActivitiesCard';
import WeeklyActivityChart from '../../components/widgets/dashboard/WeeklyActivityChart';
import RecentActivityCard from '../../components/widgets/dashboard/RecentActivityCard';
import WeakTopicsCard from '../../components/widgets/dashboard/WeakTopicsCard';
import QuickActionsCard from '../../components/widgets/dashboard/QuickActionsCard';

import './Dashboard.css';

/**
 * StudentDashboard — orchestrates all dashboard widget data fetching.
 * Each widget manages its own visual state (loading/error/empty/success).
 * All API calls use the existing /api/dashboard/* endpoints.
 */
export default function StudentDashboard() {
  const [summary,         setSummary]         = useState(null);
  const [weekly,          setWeekly]          = useState(null);
  const [recent,          setRecent]          = useState([]);
  const [continueLearning,setContinueLearning]= useState(null);
  const [insights,        setInsights]        = useState([]);
  const [aiSummary,       setAiSummary]       = useState(null);

  const [loadingMap, setLoadingMap] = useState({
    summary: true, weekly: true, recent: true,
    continueLearning: true, insights: true, aiSummary: true,
  });
  const [errorMap, setErrorMap] = useState({});

  const setLoaded = (key) =>
    setLoadingMap(prev => ({ ...prev, [key]: false }));

  const setError = (key) =>
    setErrorMap(prev => ({ ...prev, [key]: true }));

  const fetchAll = useCallback(() => {
    setTimeout(() => {
      setLoadingMap({ summary: true, weekly: true, recent: true, continueLearning: true, insights: true, aiSummary: true });
      setErrorMap({});
    }, 0);

    api.get('/dashboard/summary/')
      .then(r => setSummary(r.data))
      .catch(() => setError('summary'))
      .finally(() => setLoaded('summary'));

    api.get('/dashboard/weekly-activity/')
      .then(r => setWeekly(r.data))
      .catch(() => setError('weekly'))
      .finally(() => setLoaded('weekly'));

    api.get('/dashboard/recent-activity/')
      .then(r => setRecent(r.data))
      .catch(() => setError('recent'))
      .finally(() => setLoaded('recent'));

    api.get('/dashboard/continue-learning/')
      .then(r => setContinueLearning(r.data))
      .catch(() => setError('continueLearning'))
      .finally(() => setLoaded('continueLearning'));

    api.get('/dashboard/insights/')
      .then(r => setInsights(r.data))
      .catch(() => setError('insights'))
      .finally(() => setLoaded('insights'));

    api.get('/dashboard/ai-summary/')
      .then(r => setAiSummary(r.data))
      .catch(() => setError('aiSummary'))
      .finally(() => setLoaded('aiSummary'));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Study time today derived from weekly data (last entry = today if labels include today)
  const studyHoursToday = weekly?.study_hours?.[weekly.study_hours.length - 1] ?? 0;

  return (
    <div className="student-dashboard fade-in">

      {/* ── Row 1: Full-width welcome ── */}
      <WelcomeSection
        summary={summary}
        isLoading={loadingMap.summary}
      />

      {/* ── Row 2: Continue Learning (large) + AI Recommendations ── */}
      <div className="dash-row row-2col-wide">
        <ContinueLearningCard
          data={continueLearning}
          isLoading={loadingMap.continueLearning}
          isError={errorMap.continueLearning}
          onRetry={() => {
            setLoadingMap(p => ({ ...p, continueLearning: true }));
            setErrorMap(p => ({ ...p, continueLearning: false }));
            api.get('/dashboard/continue-learning/')
              .then(r => setContinueLearning(r.data))
              .catch(() => setError('continueLearning'))
              .finally(() => setLoaded('continueLearning'));
          }}
        />
        <AIRecommendationsCard
          data={aiSummary}
          insights={insights}
          isLoading={loadingMap.aiSummary || loadingMap.insights}
          isError={errorMap.aiSummary}
          onRetry={() => {
            setLoadingMap(p => ({ ...p, aiSummary: true, insights: true }));
            setErrorMap(p => ({ ...p, aiSummary: false }));
            api.get('/dashboard/ai-summary/')
              .then(r => setAiSummary(r.data))
              .catch(() => setError('aiSummary'))
              .finally(() => setLoaded('aiSummary'));
            api.get('/dashboard/insights/')
              .then(r => setInsights(r.data))
              .catch(() => setError('insights'))
              .finally(() => setLoaded('insights'));
          }}
        />
      </div>

      {/* ── Row 3: Progress + Daily Goal + Upcoming ── */}
      <div className="dash-row row-3col">
        <ProgressSummaryCard
          summary={summary}
          isLoading={loadingMap.summary}
          isError={errorMap.summary}
          onRetry={() => {
            setLoadingMap(p => ({ ...p, summary: true }));
            setErrorMap(p => ({ ...p, summary: false }));
            api.get('/dashboard/summary/')
              .then(r => setSummary(r.data))
              .catch(() => setError('summary'))
              .finally(() => setLoaded('summary'));
          }}
        />
        <DailyGoalCard
          studyHoursToday={studyHoursToday}
          isLoading={loadingMap.weekly}
        />
        <UpcomingActivitiesCard
          data={null}
          isLoading={false}
        />
      </div>

      {/* ── Row 4: Weekly Chart (large) + Recent Activity ── */}
      <div className="dash-row row-2col-wide">
        <WeeklyActivityChart
          data={weekly}
          isLoading={loadingMap.weekly}
          isError={errorMap.weekly}
          onRetry={() => {
            setLoadingMap(p => ({ ...p, weekly: true }));
            setErrorMap(p => ({ ...p, weekly: false }));
            api.get('/dashboard/weekly-activity/')
              .then(r => setWeekly(r.data))
              .catch(() => setError('weekly'))
              .finally(() => setLoaded('weekly'));
          }}
        />
        <RecentActivityCard
          data={recent}
          isLoading={loadingMap.recent}
          isError={errorMap.recent}
          onRetry={() => {
            setLoadingMap(p => ({ ...p, recent: true }));
            setErrorMap(p => ({ ...p, recent: false }));
            api.get('/dashboard/recent-activity/')
              .then(r => setRecent(r.data))
              .catch(() => setError('recent'))
              .finally(() => setLoaded('recent'));
          }}
        />
      </div>

      {/* ── Row 5: Weak Topics + Quick Actions ── */}
      <div className="dash-row row-2col-narrow">
        <WeakTopicsCard
          insights={insights}
          isLoading={loadingMap.insights}
          isError={errorMap.insights}
          onRetry={() => {
            setLoadingMap(p => ({ ...p, insights: true }));
            setErrorMap(p => ({ ...p, insights: false }));
            api.get('/dashboard/insights/')
              .then(r => setInsights(r.data))
              .catch(() => setError('insights'))
              .finally(() => setLoaded('insights'));
          }}
        />
        <QuickActionsCard />
      </div>

    </div>
  );
}
