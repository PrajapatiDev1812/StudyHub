import { useState, useEffect, useCallback, useMemo } from 'react';
import { academicApi } from '../services/academicApi';

export function useAcademicWorkspace() {
  const [activeModule, setActiveModule] = useState('overview'); // overview, students, attendance, assignments, tests, analytics, reports, ai-insights
  const [filterOptions, setFilterOptions] = useState(null);
  
  // Dynamic Global Filter Bar State
  const [filters, setFilters] = useState({
    session: '2026-27',
    program: '1', // M.Sc Data Science
    year: '2',    // Year 2
    semester: '3',// Semester 3
    division: 'All',
    batch: 'All',
    subject: '1', // Data Warehousing
    student: 'all', // 'all' or student_id
    dateRange: 'this_month',
    riskLevel: 'All',
    attendanceStatus: 'All',
    assignmentStatus: 'All',
    testStatus: 'All',
  });

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [studentsData, setStudentsData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [assignmentsData, setAssignmentsData] = useState(null);
  const [testsData, setTestsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [aiInsightsData, setAiInsightsData] = useState(null);

  // Active student detail modal state
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  // Load Filter Options metadata on mount
  useEffect(() => {
    let isMounted = true;
    academicApi.getFilterOptions().then((data) => {
      if (isMounted) {
        setFilterOptions(data);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Centralized refetch engine
  const fetchWorkspaceData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        student_id: filters.student,
        program: filters.program,
        year: filters.year,
        semester: filters.semester,
        subject: filters.subject,
        date_range: filters.dateRange,
        risk_level: filters.riskLevel,
      };

      const [overview, students, attendance, assignments, tests, analytics, ai] = await Promise.all([
        academicApi.getOverview(queryParams),
        academicApi.getStudents(queryParams),
        academicApi.getAttendance(queryParams),
        academicApi.getAssignments(queryParams),
        academicApi.getTests(queryParams),
        academicApi.getAnalytics(queryParams),
        academicApi.getAIInsights(queryParams),
      ]);

      setOverviewData(overview);
      setStudentsData(students);
      setAttendanceData(attendance);
      setAssignmentsData(assignments);
      setTestsData(tests);
      setAnalyticsData(analytics);
      setAiInsightsData(ai);
    } catch (err) {
      console.error('Error fetching academic workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Fetch individual student details when modal is triggered
  const openStudentProfile = useCallback(async (id) => {
    setSelectedStudentId(id);
    setStudentDetailLoading(true);
    try {
      const data = await academicApi.getStudentDetail(id);
      setStudentDetail(data);
    } catch (err) {
      console.error('Failed to load student detail', err);
    } finally {
      setStudentDetailLoading(false);
    }
  }, []);

  const closeStudentProfile = useCallback(() => {
    setSelectedStudentId(null);
    setStudentDetail(null);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      session: '2026-27',
      program: '1',
      year: '2',
      semester: '3',
      division: 'All',
      batch: 'All',
      subject: '1',
      student: 'all',
      dateRange: 'this_month',
      riskLevel: 'All',
      attendanceStatus: 'All',
      assignmentStatus: 'All',
      testStatus: 'All',
    });
  }, []);

  // Check whether workspace is in Class Mode or Individual Student Mode
  const isIndividualMode = useMemo(() => {
    return filters.student !== 'all' && Boolean(filters.student);
  }, [filters.student]);

  return {
    activeModule,
    setActiveModule,
    filters,
    handleFilterChange,
    resetFilters,
    filterOptions,
    loading,
    refetch: fetchWorkspaceData,
    overviewData,
    studentsData,
    attendanceData,
    assignmentsData,
    testsData,
    analyticsData,
    aiInsightsData,
    isIndividualMode,

    // Student Profile modal state
    selectedStudentId,
    studentDetail,
    studentDetailLoading,
    openStudentProfile,
    closeStudentProfile,
  };
}
