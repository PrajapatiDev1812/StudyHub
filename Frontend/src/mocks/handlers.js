import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/students/:studentId/overview', ({ params }) => {
    return HttpResponse.json({
      student_id: params.studentId,
      first_name: "Alex",
      last_name: "Johnson",
      total_courses: 4,
      overall_progress: 68,
      streak_days: 12,
    });
  }),

  http.get('/api/students/:studentId/continue-learning', ({ params }) => {
    return HttpResponse.json({
      course_id: 101,
      course_title: "Advanced Mathematics",
      module_title: "Linear Algebra Fundamentals",
      progress_percentage: 45,
      type: "video",
      url: "/courses/101/module/3",
    });
  }),

  http.get('/api/students/:studentId/daily-goal', ({ params }) => {
    return HttpResponse.json({
      target_minutes: 120,
      completed_minutes: 85,
      goal_status: "in_progress", // "completed", "in_progress", "failed"
    });
  }),

  http.get('/api/students/:studentId/ai-recommendations', ({ params }) => {
    return HttpResponse.json([
      {
        id: 1,
        title: "Review Quantum Mechanics Quiz",
        reason: "You scored 60% on your last attempt. Reviewing notes might help.",
        action_url: "/quizzes/5/review",
        priority: "high"
      },
      {
        id: 2,
        title: "Start next module in Biology",
        reason: "You are on a streak! Keep the momentum going.",
        action_url: "/courses/102/module/2",
        priority: "medium"
      }
    ]);
  }),

  http.get('/api/students/:studentId/upcoming-events', ({ params }) => {
    return HttpResponse.json([
      { id: 10, title: "Calculus Midterm", due_date: "2026-07-25T10:00:00Z", urgency: "high" },
      { id: 11, title: "History Essay Draft", due_date: "2026-07-28T23:59:00Z", urgency: "medium" }
    ]);
  }),

  http.get('/api/students/:studentId/progress-summary', ({ params }) => {
    return HttpResponse.json({
      courses: [
        { id: 101, title: "Advanced Mathematics", progress: 45 },
        { id: 102, title: "Biology 101", progress: 80 },
        { id: 103, title: "World History", progress: 10 }
      ]
    });
  }),

  http.get('/api/students/:studentId/recent-content', ({ params }) => {
    return HttpResponse.json([
      { id: 1, title: "Chapter 4: Derivatives", type: "pdf", uploaded_at: "2026-07-19T14:30:00Z" },
      { id: 2, title: "Photosynthesis Lecture", type: "video", uploaded_at: "2026-07-18T09:15:00Z" }
    ]);
  }),

  http.get('/api/students/:studentId/activity-feed', ({ params }) => {
    return HttpResponse.json([
      { id: 101, action: "completed_quiz", target: "Cell Structure Quiz", timestamp: "2026-07-20T10:05:00Z" },
      { id: 102, action: "earned_badge", target: "7-Day Streak", timestamp: "2026-07-19T22:00:00Z" },
      { id: 103, action: "watched_video", target: "Intro to Matrices", timestamp: "2026-07-18T16:45:00Z" }
    ]);
  }),

  http.get('/api/students/:studentId/weak-topics', ({ params }) => {
    return HttpResponse.json([
      { topic: "Eigenvectors", confidence_score: 42, related_course: "Advanced Mathematics" },
      { topic: "Cellular Respiration", confidence_score: 55, related_course: "Biology 101" }
    ]);
  }),

  http.get('/api/students/:studentId/study-calendar', ({ params }) => {
    return HttpResponse.json([
      { date: "2026-07-21", title: "Study Group Session", type: "meeting" },
      { date: "2026-07-25", title: "Calculus Midterm", type: "exam" }
    ]);
  }),

  http.get('/api/students/:studentId/ai-insights', ({ params }) => {
    return HttpResponse.json({
      insight: "You tend to study most effectively between 9 AM and 11 AM. Try scheduling your hardest subjects during this window."
    });
  }),

  http.get('/api/students/:studentId/weekly-analytics', ({ params }) => {
    return HttpResponse.json([
      { day: "Mon", minutes: 45 },
      { day: "Tue", minutes: 120 },
      { day: "Wed", minutes: 90 },
      { day: "Thu", minutes: 30 },
      { day: "Fri", minutes: 150 },
      { day: "Sat", minutes: 0 },
      { day: "Sun", minutes: 60 }
    ]);
  }),

  http.get('/api/feature-flags', () => {
    return HttpResponse.json({
      gamification: true,
      leaderboard: false,
      ai_insights: true,
      study_groups: false,
      peer_learning: false,
      adaptive_theme: true,
      focus_mode: true
    });
  }),

  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) return HttpResponse.json([]);

    // Mock search results
    const results = [
      { id: 1, title: 'Advanced Calculus', category: 'Courses' },
      { id: 2, title: 'Linear Algebra Notes', category: 'Notes' },
      { id: 3, title: 'Calculus Midterm', category: 'Assignments' },
      { id: 4, title: 'Prof. Calculusson', category: 'Teachers' }
    ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

    // Group by category
    const grouped = results.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr);
      return acc;
    }, {});

    const formatted = Object.keys(grouped).map(key => ({
      category: key,
      items: grouped[key]
    }));

    return HttpResponse.json(formatted);
  }),
];
