import api from './api';
import {
  MOCK_ACADEMIC_SESSIONS,
  MOCK_PROGRAMS,
  MOCK_YEARS,
  MOCK_SEMESTERS,
  MOCK_SUBJECTS,
  MOCK_STUDENTS,
  MOCK_OVERVIEW_CLASS,
  MOCK_ATTENDANCE,
  MOCK_ASSIGNMENTS,
  MOCK_TESTS,
  MOCK_ANALYTICS,
  MOCK_AI_INSIGHTS,
} from '../mocks/academicMocks';

export const academicApi = {
  // Fetch Filter Dropdowns
  getFilterOptions: async () => {
    try {
      const res = await api.get('/academic/filter-options/');
      return res.data;
    } catch {
      return {
        sessions: MOCK_ACADEMIC_SESSIONS,
        programs: MOCK_PROGRAMS,
        years: MOCK_YEARS,
        semesters: MOCK_SEMESTERS,
        divisions: ['A', 'B', 'C', 'All'],
        batches: ['B1', 'B2', 'B3', 'All'],
        subjects: MOCK_SUBJECTS,
        students: MOCK_STUDENTS,
        risk_levels: ['All', 'Low', 'Medium', 'High', 'Critical'],
      };
    }
  },

  // Fetch Workspace Overview Data (supports student_id query param)
  getOverview: async (filters = {}) => {
    try {
      const res = await api.get('/academic/overview/', { params: filters });
      return res.data;
    } catch {
      if (filters.student_id && filters.student_id !== 'all') {
        const student = MOCK_STUDENTS.find(s => s.id === Number(filters.student_id)) || MOCK_STUDENTS[0];
        return {
          mode: 'individual',
          student: student,
          metrics: {
            attendance_percentage: student.attendance_percentage,
            assignment_percentage: student.assignment_percentage,
            test_average: student.test_average,
            topic_progress: student.progress_percentage,
            lms_activity_score: student.lms_activity_score,
            risk_score: student.risk_score,
            risk_level: student.risk_level,
          },
          recent_activity: [
            { id: 1, type: 'attendance', text: 'Marked Present in Data Warehousing', timestamp: '2 hours ago' },
            { id: 2, type: 'assignment', text: 'Submitted Assignment 2 (ETL Pipeline)', timestamp: 'Yesterday' },
            { id: 3, type: 'test', text: 'Scored 92% in Quiz 2 (Data Marts)', timestamp: '3 days ago' },
          ],
        };
      }
      return {
        mode: 'class',
        ...MOCK_OVERVIEW_CLASS
      };
    }
  },

  // Fetch Students List
  getStudents: async (filters = {}) => {
    try {
      const res = await api.get('/academic/students/', { params: filters });
      return res.data;
    } catch {
      let filtered = [...MOCK_STUDENTS];
      if (filters.risk_level && filters.risk_level !== 'All') {
        filtered = filtered.filter(s => s.risk_level === filters.risk_level);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(s =>
          s.name.toLowerCase().includes(query) ||
          s.roll_number.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
        );
      }
      return {
        count: filtered.length,
        students: filtered,
      };
    }
  },

  // Fetch Student Detail
  getStudentDetail: async (id) => {
    try {
      const res = await api.get(`/academic/student/${id}/`);
      return res.data;
    } catch {
      const student = MOCK_STUDENTS.find(s => s.id === Number(id)) || MOCK_STUDENTS[0];
      return {
        student: {
          ...student,
          program: 'M.Sc Data Science',
          year: 'Year 2',
          semester: 'Semester 3',
        },
        metrics: {
          attendance_percentage: student.attendance_percentage,
          assignment_percentage: student.assignment_percentage,
          test_average: student.test_average,
          topic_progress: student.progress_percentage,
          lms_activity_score: student.lms_activity_score,
          risk_score: student.risk_score,
          risk_level: student.risk_level,
        },
        attendance_history: [
          { date: '2026-07-28', subject: 'Data Warehousing', status: 'Present' },
          { date: '2026-07-27', subject: 'Machine Learning', status: 'Present' },
          { date: '2026-07-26', subject: 'Data Warehousing', status: 'Late' },
          { date: '2026-07-25', subject: 'NLP', status: 'Present' },
        ],
        assignment_history: [
          { title: 'Assignment 1: Star Schema', status: 'Evaluated', marks: '94 / 100' },
          { title: 'Assignment 2: ETL Pipeline', status: 'Evaluated', marks: '90 / 100' },
          { title: 'Assignment 3: Sharding & Partitioning', status: 'Submitted', marks: 'Pending' },
        ],
        test_history: [
          { title: 'Mid-Sem Exam: Data Warehousing', score: '91%', status: 'Passed' },
          { title: 'Quiz 1: SQL Optimization', score: '95%', status: 'Passed' },
          { title: 'Quiz 2: Data Marts', score: '88%', status: 'Passed' },
        ],
        ai_summary: `${student.name} maintains a stellar academic record with ${student.attendance_percentage}% attendance and ${student.assignment_percentage}% assignment completion. Consistently scores above class median in SQL & ETL architecture.`,
      };
    }
  },

  // Attendance
  getAttendance: async (filters = {}) => {
    try {
      const res = await api.get('/academic/attendance/', { params: filters });
      return res.data;
    } catch {
      return MOCK_ATTENDANCE;
    }
  },

  markAttendance: async (records) => {
    try {
      const res = await api.post('/academic/attendance/', { records });
      return res.data;
    } catch {
      return { message: 'Saved attendance locally in demo fallback mode.', marked_count: records.length };
    }
  },

  // Assignments
  getAssignments: async (filters = {}) => {
    try {
      const res = await api.get('/academic/assignments/', { params: filters });
      return res.data;
    } catch {
      return { assignments: MOCK_ASSIGNMENTS };
    }
  },

  createAssignment: async (payload) => {
    try {
      const res = await api.post('/academic/assignments/', payload);
      return res.data;
    } catch {
      return { message: `Created assignment '${payload.title}' successfully.`, id: Math.floor(Math.random() * 1000) };
    }
  },

  // Tests
  getTests: async (filters = {}) => {
    try {
      const res = await api.get('/academic/tests/', { params: filters });
      return res.data;
    } catch {
      return { tests: MOCK_TESTS, topic_weakness: MOCK_ANALYTICS.weak_topics };
    }
  },

  // Analytics
  getAnalytics: async (filters = {}) => {
    try {
      const res = await api.get('/academic/analytics/', { params: filters });
      return res.data;
    } catch {
      return MOCK_ANALYTICS;
    }
  },

  // Reports
  getReports: async (filters = {}) => {
    try {
      const res = await api.get('/academic/reports/', { params: filters });
      return res.data;
    } catch {
      return {
        report_meta: {
          generated_at: new Date().toLocaleString(),
          title: `StudyHub Academic Report - ${filters.report_type || 'CLASS'}`,
          total_records: MOCK_STUDENTS.length,
        },
        data: MOCK_STUDENTS.map(s => ({
          roll_no: s.roll_number,
          name: s.name,
          attendance: `${s.attendance_percentage}%`,
          assignment: `${s.assignment_percentage}%`,
          test_avg: `${s.test_average}%`,
          risk: s.risk_level,
        })),
      };
    }
  },

  // AI Insights
  getAIInsights: async (filters = {}) => {
    try {
      const res = await api.get('/academic/ai-insights/', { params: filters });
      return res.data;
    } catch {
      return MOCK_AI_INSIGHTS;
    }
  },
};
