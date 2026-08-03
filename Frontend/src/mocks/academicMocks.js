// Mock dataset for offline / demo mode fallback

export const MOCK_ACADEMIC_SESSIONS = [
  { id: 1, name: '2025-26', is_current: false },
  { id: 2, name: '2026-27', is_current: true },
];

export const MOCK_PROGRAMS = [
  { id: 1, name: 'M.Sc Data Science', code: 'MSC-DS', department: 'Data Science & AI' },
  { id: 2, name: 'B.Sc Data Science', code: 'BSC-DS', department: 'Data Science & AI' },
  { id: 3, name: 'Biotechnology', code: 'BIOTECH', department: 'Life Sciences' },
  { id: 4, name: 'B.Tech Computer Science', code: 'BTECH-CS', department: 'Computer Engineering' },
];

export const MOCK_YEARS = [
  { id: 1, program_id: 1, year_number: 1, name: 'Year 1' },
  { id: 2, program_id: 1, year_number: 2, name: 'Year 2' },
  { id: 3, program_id: 2, year_number: 1, name: 'Year 1' },
  { id: 4, program_id: 2, year_number: 2, name: 'Year 2' },
  { id: 5, program_id: 2, year_number: 3, name: 'Year 3' },
];

export const MOCK_SEMESTERS = [
  { id: 1, program_year_id: 1, semester_number: 1, name: 'Semester 1' },
  { id: 2, program_year_id: 1, semester_number: 2, name: 'Semester 2' },
  { id: 3, program_year_id: 2, semester_number: 3, name: 'Semester 3' },
  { id: 4, program_year_id: 2, semester_number: 4, name: 'Semester 4' },
];

export const MOCK_SUBJECTS = [
  { id: 1, title: 'Data Warehousing & OLAP', code: 'DS501' },
  { id: 2, title: 'Machine Learning Engineering', code: 'DS502' },
  { id: 3, title: 'Natural Language Processing', code: 'DS503' },
  { id: 4, title: 'Big Data Distributed Systems', code: 'DS504' },
];

export const MOCK_STUDENTS = [
  {
    id: 101,
    roll_number: '2026-DS-001',
    name: 'Dev Prajapati',
    username: 'dev_prajapati',
    email: 'dev@university.edu',
    attendance_percentage: 94.5,
    assignment_percentage: 96.0,
    test_average: 91.2,
    progress_percentage: 92.0,
    lms_activity_score: 95.0,
    risk_score: 8.5,
    risk_level: 'Low',
    avatar: 'DP',
    division: 'A',
    batch: 'B1',
  },
  {
    id: 102,
    roll_number: '2026-DS-002',
    name: 'Aarav Patel',
    username: 'aarav_p',
    email: 'aarav@university.edu',
    attendance_percentage: 88.0,
    assignment_percentage: 90.0,
    test_average: 84.5,
    progress_percentage: 86.0,
    lms_activity_score: 88.0,
    risk_score: 16.2,
    risk_level: 'Low',
    avatar: 'AP',
    division: 'A',
    batch: 'B1',
  },
  {
    id: 103,
    roll_number: '2026-DS-003',
    name: 'Rahul Sharma',
    username: 'rahul_s',
    email: 'rahul@university.edu',
    attendance_percentage: 64.0,
    assignment_percentage: 58.0,
    test_average: 52.0,
    progress_percentage: 55.0,
    lms_activity_score: 45.0,
    risk_score: 72.4,
    risk_level: 'Critical',
    avatar: 'RS',
    division: 'A',
    batch: 'B2',
  },
  {
    id: 104,
    roll_number: '2026-DS-004',
    name: 'Ananya Roy',
    username: 'ananya_r',
    email: 'ananya@university.edu',
    attendance_percentage: 71.5,
    assignment_percentage: 74.0,
    test_average: 68.0,
    progress_percentage: 70.0,
    lms_activity_score: 65.0,
    risk_score: 48.0,
    risk_level: 'High',
    avatar: 'AR',
    division: 'B',
    batch: 'B1',
  },
  {
    id: 105,
    roll_number: '2026-DS-005',
    name: 'Siddharth Joshi',
    username: 'siddharth_j',
    email: 'siddharth@university.edu',
    attendance_percentage: 82.0,
    assignment_percentage: 85.0,
    test_average: 79.0,
    progress_percentage: 81.0,
    lms_activity_score: 80.0,
    risk_score: 28.5,
    risk_level: 'Medium',
    avatar: 'SJ',
    division: 'A',
    batch: 'B2',
  },
  {
    id: 106,
    roll_number: '2026-DS-006',
    name: 'Meera Iyer',
    username: 'meera_i',
    email: 'meera@university.edu',
    attendance_percentage: 91.0,
    assignment_percentage: 94.0,
    test_average: 89.5,
    progress_percentage: 90.0,
    lms_activity_score: 92.0,
    risk_score: 11.0,
    risk_level: 'Low',
    avatar: 'MI',
    division: 'B',
    batch: 'B2',
  },
];

export const MOCK_OVERVIEW_CLASS = {
  summary: {
    total_students: 42,
    average_attendance: 86.4,
    assignment_completion: 89.2,
    average_test_score: 81.5,
    pending_evaluations: 8,
    high_risk_students: 4,
  },
  recent_activity: [
    { id: 1, type: 'attendance', text: 'Attendance marked for M.Sc DS Year 2 - Data Warehousing (39 Present, 3 Absent)', timestamp: '15 mins ago' },
    { id: 2, type: 'assignment', text: '14 new submissions received for Assignment 3: ETL Pipelines', timestamp: '1 hour ago' },
    { id: 3, type: 'test', text: 'Quiz 2: Indexing & Partitioning completed by 38 students (Avg score: 82%)', timestamp: 'Yesterday' },
    { id: 4, type: 'alert', text: 'Risk Alert: Rahul Sharma attendance dropped below 65%', timestamp: '2 days ago' },
  ],
};

export const MOCK_ATTENDANCE = {
  summary: {
    overall_percentage: 86.4,
    total_conducted: 48,
    present_count: 41,
    absent_count: 4,
    late_count: 2,
    medical_leave_count: 1,
  },
  records: [
    { id: 1, student_id: 101, name: 'Dev Prajapati', roll_number: '2026-DS-001', status: 'present', date: '2026-07-28' },
    { id: 2, student_id: 102, name: 'Aarav Patel', roll_number: '2026-DS-002', status: 'present', date: '2026-07-28' },
    { id: 3, student_id: 103, name: 'Rahul Sharma', roll_number: '2026-DS-003', status: 'absent', date: '2026-07-28' },
    { id: 4, student_id: 104, name: 'Ananya Roy', roll_number: '2026-DS-004', status: 'late', date: '2026-07-28' },
    { id: 5, student_id: 105, name: 'Siddharth Joshi', roll_number: '2026-DS-005', status: 'present', date: '2026-07-28' },
    { id: 6, student_id: 106, name: 'Meera Iyer', roll_number: '2026-DS-006', status: 'present', date: '2026-07-28' },
  ],
  heatmap: [
    { date: '2026-07-01', attendance: 92 },
    { date: '2026-07-05', attendance: 88 },
    { date: '2026-07-10', attendance: 85 },
    { date: '2026-07-15', attendance: 90 },
    { date: '2026-07-20', attendance: 84 },
    { date: '2026-07-25', attendance: 87 },
  ],
  alerts: [
    { id: 1, student_name: 'Rahul Sharma', attendance: '64%', risk: 'Critical', issue: 'Absent 6 consecutive sessions' },
    { id: 2, student_name: 'Ananya Roy', attendance: '71.5%', risk: 'High Risk', issue: 'Attendance < 75% threshold' },
  ],
};

export const MOCK_ASSIGNMENTS = [
  {
    id: 1,
    title: 'Assignment 1: Star Schema & Data Mart Design',
    subject: 'Data Warehousing & OLAP',
    deadline: '2026-08-05T23:59:00Z',
    max_marks: 100,
    submitted_count: 38,
    total_students: 42,
    pending_count: 4,
    avg_marks: 86.5,
    status: 'Active',
    description: 'Design a dimensional star schema for a high-throughput retail e-commerce enterprise.',
  },
  {
    id: 2,
    title: 'Assignment 2: Distributed PySpark ETL Pipeline',
    subject: 'Data Warehousing & OLAP',
    deadline: '2026-07-20T23:59:00Z',
    max_marks: 100,
    submitted_count: 40,
    total_students: 42,
    pending_count: 2,
    avg_marks: 88.2,
    status: 'Evaluated',
    description: 'Build a distributed ETL pipeline extracting JSON streams into Parquet tables.',
  },
];

export const MOCK_TESTS = [
  {
    id: 1,
    title: 'Mid-Sem Exam: Data Warehousing Concepts',
    date: '2026-07-15',
    avg_score: 82.4,
    highest_score: 98.0,
    lowest_score: 54.0,
    pass_percentage: 92.8,
    total_attempts: 42,
  },
  {
    id: 2,
    title: 'Quiz 2: Indexing & Partitioning Strategies',
    date: '2026-07-22',
    avg_score: 78.5,
    highest_score: 100.0,
    lowest_score: 48.0,
    pass_percentage: 88.0,
    total_attempts: 40,
  },
];

export const MOCK_ANALYTICS = {
  attendance_trend: [
    { week: 'Week 1', attendance: 94 },
    { week: 'Week 2', attendance: 91 },
    { week: 'Week 3', attendance: 85 },
    { week: 'Week 4', attendance: 88 },
  ],
  assignment_completion: [
    { name: 'Assg 1', completed: 40, pending: 2, missing: 0 },
    { name: 'Assg 2', completed: 38, pending: 3, missing: 1 },
    { name: 'Assg 3', completed: 35, pending: 5, missing: 2 },
  ],
  test_distribution: [
    { grade: 'A (90-100%)', count: 14 },
    { grade: 'B (80-89%)', count: 18 },
    { grade: 'C (70-79%)', count: 7 },
    { grade: 'D (60-69%)', count: 2 },
    { grade: 'F (<60%)', count: 1 },
  ],
  subject_comparison: [
    { subject: 'Data Warehousing', avg_score: 84.5 },
    { subject: 'Machine Learning', avg_score: 81.2 },
    { subject: 'NLP', avg_score: 79.0 },
    { subject: 'Big Data', avg_score: 86.4 },
  ],
  weak_topics: [
    { topic: 'B-Tree & Bitmap Indexing', avg_correctness: 62 },
    { topic: 'Slowly Changing Dimensions (Type 2)', avg_correctness: 68 },
    { topic: 'Partition Pruning in Postgres', avg_correctness: 74 },
  ],
  strong_topics: [
    { topic: 'Fact vs Dimension Tables', avg_correctness: 94 },
    { topic: 'Extract-Transform-Load Fundamentals', avg_correctness: 91 },
    { topic: 'OLAP Cube Slicing & Dicing', avg_correctness: 89 },
  ],
};

export const MOCK_AI_INSIGHTS = {
  insights: [
    { id: 1, category: 'Risk Detection', severity: 'high', title: '4 Students At High Risk', description: 'Rahul Sharma and 3 others have attendance < 65% and unsubmitted assignments.' },
    { id: 2, category: 'Curriculum Mastery', severity: 'medium', title: 'Low Correctness on Indexing', description: 'Quiz 2 analysis shows 38% failure rate on B-Tree vs Bitmap Index questions.' },
    { id: 3, category: 'Positive Performance', severity: 'low', title: '12% Increase in ETL Assignments', description: 'Submissions surged after providing the interactive PySpark notebook.' },
  ],
  recommendations: [
    'Organize a 30-minute review class on B-Tree & Bitmap Indexing.',
    'Send an automated SMS/Email reminder to Rahul Sharma regarding Assignment 3.',
    'Publish supplementary reference materials for Slowly Changing Dimensions (Type 2).',
  ]
};
