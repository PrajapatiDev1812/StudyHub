/**
 * adminDashboardMocks.js
 * StudyHub — Admin/Teacher Dashboard Mock Data
 *
 * All shapes match the expected Django REST API response format.
 * Replace with real API calls when backend endpoints are ready.
 *
 * API integration points are marked with: [API_READY]
 */

// ─── Teacher Profile ──────────────────────────────────────────────────────────
// [API_READY] GET /api/auth/teacher-profile/
export const MOCK_TEACHER_PROFILE = {
  id: 1,
  name: 'Dr. Rajesh Patel',
  first_name: 'Rajesh',
  last_name: 'Patel',
  designation: 'Professor',
  department: 'Computer Science',
  profile_image: '',
  is_first_login: false, // set to true to test first-login welcome
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
// [API_READY] GET /api/admin/dashboard/stats/
export const MOCK_STATS = {
  total_courses: 5,
  total_subjects: 18,
  total_materials: 240,
  total_students: 120,
  ai_queries: 1250,
  engagement_percentage: 78,
  // trend vs last month (positive = up, negative = down)
  trends: {
    courses: +1,
    subjects: +3,
    materials: +22,
    students: +8,
    ai_queries: +340,
    engagement: +5,
  },
};

// ─── Recent Activity ─────────────────────────────────────────────────────────
// [API_READY] GET /api/admin/dashboard/recent-activity/
export const MOCK_RECENT_ACTIVITY = [
  {
    id: 1,
    type: 'upload',
    description: 'Uploaded "Linear Regression Notes" to Machine Learning',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),   // 1h ago
  },
  {
    id: 2,
    type: 'topic',
    description: 'Added new topic "Decision Tree Algorithm" to Data Mining',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),   // 3h ago
  },
  {
    id: 3,
    type: 'ai',
    description: 'Generated AI quiz for Machine Learning — 15 questions',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),   // 8h ago
  },
  {
    id: 4,
    type: 'syllabus',
    description: 'Updated course syllabus for M.Sc Data Science',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),  // yesterday
  },
  {
    id: 5,
    type: 'student',
    description: '8 new students enrolled in Python Programming course',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),  // 2 days ago
  },
];

// ─── Courses ──────────────────────────────────────────────────────────────────
// [API_READY] GET /api/courses/?teacher=me
export const MOCK_COURSES = [
  {
    id: 1,
    name: 'M.Sc Data Science',
    code: 'DS-501',
    subjects_count: 6,
    students_enrolled: 45,
    materials_count: 98,
    content_completion_percentage: 82,
    is_public: true,
  },
  {
    id: 2,
    name: 'Machine Learning',
    code: 'ML-401',
    subjects_count: 5,
    students_enrolled: 38,
    materials_count: 76,
    content_completion_percentage: 65,
    is_public: true,
  },
  {
    id: 3,
    name: 'Python Programming',
    code: 'PY-101',
    subjects_count: 4,
    students_enrolled: 22,
    materials_count: 44,
    content_completion_percentage: 91,
    is_public: false,
  },
  {
    id: 4,
    name: 'Statistics for Data Science',
    code: 'ST-301',
    subjects_count: 3,
    students_enrolled: 15,
    materials_count: 22,
    content_completion_percentage: 40,
    is_public: true,
  },
];

// ─── Topic Performance ────────────────────────────────────────────────────────
// [API_READY] GET /api/admin/dashboard/topic-performance/
export const MOCK_TOPIC_PERFORMANCE = [
  { id: 1, topic: 'Machine Learning', percentage: 85, views: 420 },
  { id: 2, topic: 'Python Programming', percentage: 70, views: 310 },
  { id: 3, topic: 'Statistics', percentage: 55, views: 215 },
  { id: 4, topic: 'Deep Learning', percentage: 45, views: 180 },
  { id: 5, topic: 'Data Visualization', percentage: 38, views: 142 },
];

// ─── Student Activity (7-day chart) ──────────────────────────────────────────
// [API_READY] GET /api/admin/dashboard/student-activity/
export const MOCK_STUDENT_ACTIVITY = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  active_students: [42, 55, 48, 60, 53, 32, 28],
  material_views: [120, 145, 98, 175, 132, 78, 55],
  ai_usage: [18, 25, 22, 30, 28, 12, 10],
};

// ─── AI Insights ──────────────────────────────────────────────────────────────
// [API_READY] GET /api/admin/dashboard/ai-insights/
export const MOCK_AI_INSIGHTS = {
  total_queries_answered: 1250,
  quizzes_generated: 34,
  most_asked_topics: [
    { topic: 'Gradient Descent', query_count: 145 },
    { topic: 'Neural Networks', query_count: 112 },
    { topic: 'Overfitting & Regularization', query_count: 89 },
  ],
  suggestion: {
    title: 'Content Gap Detected',
    body: 'Students are frequently asking about Gradient Descent. Consider adding more step-by-step examples or a short video walkthrough.',
    affected_topic: 'Gradient Descent',
  },
};

// ─── Upcoming Tasks ───────────────────────────────────────────────────────────
// [API_READY] GET /api/admin/dashboard/tasks/
export const MOCK_TASKS = [
  {
    id: 1,
    title: 'Upload Neural Network lecture notes',
    type: 'upload',
    due: 'tomorrow',    // 'today' | 'tomorrow' | 'later'
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Review ML Mid-term exam questions',
    type: 'exam',
    due: 'today',
    due_date: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Prepare Python assignment rubric',
    type: 'assignment',
    due: 'later',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: 'Update Data Science course syllabus',
    type: 'syllabus',
    due: 'later',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    title: 'Create Statistics quiz — Chapter 4',
    type: 'quiz',
    due: 'tomorrow',
    due_date: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
  },
];
