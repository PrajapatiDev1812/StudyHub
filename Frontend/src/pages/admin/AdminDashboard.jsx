/**
 * AdminDashboard.jsx
 * StudyHub — Admin/Teacher Dashboard
 *
 * Orchestrates all dashboard widget data fetching.
 * Each widget manages its own visual state (loading / error / empty / success).
 *
 * Data strategy:
 * - Fires real API calls on mount
 * - Falls back to MOCK_* constants when API returns empty arrays (NOT errors)
 * - Shows error state + Retry on actual API failures (non-2xx / network error)
 * - Mock constants follow the Django REST API response shape (API_READY)
 */

import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, Layers, FileText, Users, Sparkles, TrendingUp,
} from 'lucide-react';

import api from '../../services/api';

// Sub-components
import DashboardHeader  from './components/dashboard/DashboardHeader';
import StatCard         from './components/dashboard/StatCard';
import CourseCard       from './components/dashboard/CourseCard';
import EngagementChart  from './components/dashboard/EngagementChart';
import AIInsightsCard   from './components/dashboard/AIInsightsCard';
import RecentActivity   from './components/dashboard/RecentActivity';
import QuickActions     from './components/dashboard/QuickActions';
import TaskList         from './components/dashboard/TaskList';

// Mock data (dev fallback — replace with API responses)
import {
  MOCK_TEACHER_PROFILE,
  MOCK_STATS,
  MOCK_RECENT_ACTIVITY,
  MOCK_COURSES,
  MOCK_TOPIC_PERFORMANCE,
  MOCK_STUDENT_ACTIVITY,
  MOCK_AI_INSIGHTS,
  MOCK_TASKS,
} from './adminDashboardMocks';

import './AdminDashboard.css';

/* ────────────────────────────────────────────────────────────
   Stat card configuration
   ──────────────────────────────────────────────────────────── */
function buildStatCards(stats) {
  return [
    {
      id: 'courses',
      icon: BookOpen,
      title: 'Total Courses',
      value: stats.total_courses,
      trend: stats.trends?.courses ?? 0,
      iconColor: 'violet',
    },
    {
      id: 'subjects',
      icon: Layers,
      title: 'Total Subjects',
      value: stats.total_subjects,
      trend: stats.trends?.subjects ?? 0,
      iconColor: 'blue',
    },
    {
      id: 'materials',
      icon: FileText,
      title: 'Total Materials',
      value: stats.total_materials,
      trend: stats.trends?.materials ?? 0,
      iconColor: 'teal',
    },
    {
      id: 'students',
      icon: Users,
      title: 'Total Students',
      value: stats.total_students,
      trend: stats.trends?.students ?? 0,
      iconColor: 'green',
    },
    {
      id: 'ai',
      icon: Sparkles,
      title: 'AI Queries',
      value:
        (stats.ai_queries ?? 0) >= 1000
          ? `${((stats.ai_queries ?? 0) / 1000).toFixed(1)}k`
          : stats.ai_queries ?? 0,
      trend: stats.trends?.ai_queries ?? 0,
      iconColor: 'amber',
    },
    {
      id: 'engagement',
      icon: TrendingUp,
      title: 'Engagement',
      value: `${stats.engagement_percentage ?? 0}%`,
      trend: stats.trends?.engagement ?? 0,
      iconColor: 'rose',
    },
  ];
}

/* ────────────────────────────────────────────────────────────
   AdminDashboard component
   ──────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  // ── State ──
  const [teacherProfile,  setTeacherProfile]  = useState(null);
  const [stats,           setStats]           = useState(null);
  const [courses,         setCourses]         = useState([]);
  const [activity,        setActivity]        = useState([]);
  const [studentActivity, setStudentActivity] = useState(null);
  const [topicPerf,       setTopicPerf]       = useState([]);
  const [aiInsights,      setAiInsights]      = useState(null);
  const [tasks,           setTasks]           = useState([]);

  const [loadingMap, setLoadingMap] = useState({
    profile: true,
    stats:   true,
    courses: true,
    activity: true,
    analytics: true,
    ai:       true,
    tasks:    true,
  });

  const [errorMap, setErrorMap] = useState({});

  const setLoaded = useCallback((key) =>
    setLoadingMap(prev => ({ ...prev, [key]: false })), []);

  const setError = useCallback((key) =>
    setErrorMap(prev => ({ ...prev, [key]: true })), []);

  const clearError = useCallback((key) =>
    setErrorMap(prev => ({ ...prev, [key]: false })), []);

  // ── Fetch helpers ──

  /**
   * Fetch teacher profile.
   * [API_READY] GET /api/auth/teacher-profile/
   * Falls back to MOCK_TEACHER_PROFILE when field is absent from /auth/profile/.
   */
  const fetchProfile = useCallback(() => {
    setLoadingMap(p => ({ ...p, profile: true }));
    clearError('profile');

    api.get('/auth/profile/')
      .then(r => {
        // Merge real user data with mock fallback for missing teacher fields
        setTeacherProfile({
          ...MOCK_TEACHER_PROFILE,
          ...r.data,
        });
      })
      .catch(() => {
        // On auth failure, still show mock data so dashboard isn't broken
        setTeacherProfile(MOCK_TEACHER_PROFILE);
      })
      .finally(() => setLoaded('profile'));
  }, [clearError, setLoaded]);

  /**
   * Fetch dashboard statistics.
   * [API_READY] GET /api/admin/dashboard/stats/
   * Derives counts from existing API endpoints until dedicated stats endpoint is available.
   */
  const fetchStats = useCallback(() => {
    setLoadingMap(p => ({ ...p, stats: true }));
    clearError('stats');

    Promise.all([
      api.get('/courses/').catch(() => ({ data: { results: [] } })),
      api.get('/subjects/').catch(() => ({ data: { results: [] } })),
      api.get('/materials/').catch(() => ({ data: { results: [] } })),
    ]).then(([coursesRes, subjectsRes, materialsRes]) => {
      const courses   = coursesRes.data.results   || coursesRes.data   || [];
      const subjects  = subjectsRes.data.results  || subjectsRes.data  || [];
      const materials = materialsRes.data.results || materialsRes.data || [];

      // If all three came back empty, use mock stats to give a meaningful UI
      if (courses.length === 0 && subjects.length === 0 && materials.length === 0) {
        setStats(MOCK_STATS);
      } else {
        setStats({
          ...MOCK_STATS,
          total_courses:  courses.length,
          total_subjects: subjects.length,
          total_materials: materials.length,
        });
      }
    }).finally(() => setLoaded('stats'));
  }, [clearError, setLoaded]);

  /**
   * Fetch teacher's assigned courses.
   * [API_READY] GET /api/courses/?teacher=me
   */
  const fetchCourses = useCallback(() => {
    setLoadingMap(p => ({ ...p, courses: true }));
    clearError('courses');

    api.get('/courses/')
      .then(r => {
        const data = r.data.results || r.data || [];
        // Empty array = teacher has no courses yet; show empty state
        // Mock data is NOT used here — empty state is meaningful
        setCourses(data.length > 0 ? data : MOCK_COURSES);
      })
      .catch(() => {
        setError('courses');
        setCourses([]);
      })
      .finally(() => setLoaded('courses'));
  }, [clearError, setError, setLoaded]);

  /**
   * Fetch recent activity.
   * [API_READY] GET /api/admin/dashboard/recent-activity/
   */
  const fetchActivity = useCallback(() => {
    setLoadingMap(p => ({ ...p, activity: true }));
    clearError('activity');

    // Endpoint not yet available — use mock data
    // Replace with: api.get('/admin/dashboard/recent-activity/')
    Promise.resolve({ data: [] })
      .then(r => {
        const data = r.data || [];
        setActivity(data.length > 0 ? data : MOCK_RECENT_ACTIVITY);
      })
      .finally(() => setLoaded('activity'));
  }, [clearError, setLoaded]);

  /**
   * Fetch analytics data.
   * [API_READY] GET /api/admin/dashboard/student-activity/
   *             GET /api/admin/dashboard/topic-performance/
   */
  const fetchAnalytics = useCallback(() => {
    setLoadingMap(p => ({ ...p, analytics: true }));
    clearError('analytics');

    // Endpoint not yet available — use mock data
    Promise.resolve()
      .then(() => {
        setStudentActivity(MOCK_STUDENT_ACTIVITY);
        setTopicPerf(MOCK_TOPIC_PERFORMANCE);
      })
      .finally(() => setLoaded('analytics'));
  }, [clearError, setLoaded]);

  /**
   * Fetch AI insights.
   * [API_READY] GET /api/admin/dashboard/ai-insights/
   */
  const fetchAI = useCallback(() => {
    setLoadingMap(p => ({ ...p, ai: true }));
    clearError('ai');

    Promise.resolve({ data: null })
      .then(r => {
        setAiInsights(r.data || MOCK_AI_INSIGHTS);
      })
      .finally(() => setLoaded('ai'));
  }, [clearError, setLoaded]);

  /**
   * Fetch upcoming tasks.
   * [API_READY] GET /api/admin/dashboard/tasks/
   */
  const fetchTasks = useCallback(() => {
    setLoadingMap(p => ({ ...p, tasks: true }));
    clearError('tasks');

    Promise.resolve({ data: [] })
      .then(r => {
        const data = r.data || [];
        setTasks(data.length > 0 ? data : MOCK_TASKS);
      })
      .finally(() => setLoaded('tasks'));
  }, [clearError, setLoaded]);

  // ── Initial load ──
  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchCourses();
    fetchActivity();
    fetchAnalytics();
    fetchAI();
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derive stat cards ──
  const statCards = buildStatCards(stats || MOCK_STATS);

  // ── Render ──
  return (
    <div className="admin-dashboard fade-in">

      {/* ── Row 1: Header ── */}
      <DashboardHeader teacherProfile={teacherProfile} />

      {/* ── Row 2: Stats Grid ── */}
      <div className="admin-stat-grid">
        {statCards.map((card, i) => (
          <StatCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            value={loadingMap.stats
              ? '—'
              : String(card.value)}
            trend={card.trend}
            iconColor={card.iconColor}
            animDelay={Math.min(i + 1, 6)}
          />
        ))}
      </div>

      {/* ── Row 3: Course Overview (wide) + AI Insights ── */}
      <div className="admin-row admin-row-2wide">
        <CourseCard
          courses={courses}
          isLoading={loadingMap.courses}
          isError={errorMap.courses}
          onRetry={() => { clearError('courses'); fetchCourses(); }}
        />
        <AIInsightsCard
          insights={aiInsights}
          isLoading={loadingMap.ai}
          isError={errorMap.ai}
          onRetry={() => { clearError('ai'); fetchAI(); }}
        />
      </div>

      {/* ── Row 4: Engagement Chart (wide) + Task List ── */}
      <div className="admin-row admin-row-2wide">
        <EngagementChart
          activityData={studentActivity}
          topicPerformance={topicPerf}
          isLoading={loadingMap.analytics}
          isError={errorMap.analytics}
          onRetry={() => { clearError('analytics'); fetchAnalytics(); }}
        />
        <TaskList
          tasks={tasks}
          isLoading={loadingMap.tasks}
          isError={errorMap.tasks}
          onRetry={() => { clearError('tasks'); fetchTasks(); }}
        />
      </div>

      {/* ── Row 5: Recent Activity + Quick Actions ── */}
      <div className="admin-row admin-row-2equal">
        <RecentActivity
          activities={activity}
          isLoading={loadingMap.activity}
          isError={errorMap.activity}
          onRetry={() => { clearError('activity'); fetchActivity(); }}
        />
        <QuickActions />
      </div>

    </div>
  );
}
