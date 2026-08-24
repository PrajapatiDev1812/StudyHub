import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './pages/admin/AdminLayout';
import BadgeUnlockPopup from './components/gamification/BadgeUnlockPopup';


// Public Pages
import Landing from './pages/Landing';
import LearnMorePage from './pages/LearnMorePage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotUsername from './pages/auth/ForgotUsername';
import RecoveryRequest from './pages/auth/RecoveryRequest';
import TwoFactorSetup from './pages/auth/TwoFactorSetup';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import BrowseCourses from './pages/student/BrowseCourses';
import CourseDetail from './pages/student/CourseDetail';
import ContentViewer from './pages/student/ContentViewer';
import MyCourses from './pages/student/MyCourses';
import TestsList from './pages/student/TestsList';
import TakeTest from './pages/student/TakeTest';
import TestResults from './pages/student/TestResults';
import MyAttempts from './pages/student/MyAttempts';
import Notifications from './pages/student/Notifications';
import AiChat from './pages/student/AiChat';
import Profile from './pages/student/Profile';
import Appearance from './pages/student/Appearance';
import CompletedContent from './pages/student/CompletedContent';
import TotalContent from './pages/student/TotalContent';
import FocusLanding from './pages/student/FocusMode/FocusLanding';
import FocusHistory from './pages/student/FocusMode/FocusHistory';
import AchievementsPage from './pages/student/AchievementsPage';
import MyMaterials from './pages/student/MyMaterials';
import StudentAnalyticsPage from './pages/student/StudentAnalyticsPage';
import LmsPanel from './pages/student/LmsPanel';
import TaskManager from './pages/student/TaskManager';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CurriculumManager from './pages/admin/CurriculumManager';
import ManageTests from './pages/admin/ManageTests';
import ManageQuestions from './pages/admin/ManageQuestions';
import TestAnalytics from './pages/admin/TestAnalytics';
import StudentList from './pages/admin/StudentList';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAI from './pages/admin/AdminAI';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import TeacherAiWorkspace from './pages/admin/ai/TeacherAiWorkspace';
import AdminAppearance from './pages/admin/appearance/AdminAppearance';
import AchievementsLayout from './pages/admin/achievements/AchievementsLayout';
import AchievementOverview from './pages/admin/achievements/AchievementOverview';
import BadgeManagement from './pages/admin/achievements/BadgeManagement';
import RuleBuilder from './pages/admin/achievements/RuleBuilder';
import StudentAchievements from './pages/admin/achievements/StudentAchievements';
import XPLevels from './pages/admin/achievements/XPLevels';
import AchievementAnalytics from './pages/admin/achievements/AchievementAnalytics';
import AuditLogs from './pages/admin/achievements/AuditLogs';
import AdminTaskManager from './pages/admin/tasks/AdminTaskManager';


// Shared CSS
import './pages/student/Student.css';

function StudentRoute({ children }) {
  return (
    <ProtectedRoute role="student">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

function AdminRoute({ children }) {
  // Wrap admin routes in the new AdminLayout
  return (
    <ProtectedRoute role="admin">
      <AdminLayout />
    </ProtectedRoute>
  );
}

/** Full-screen admin route — no DashboardLayout (page provides its own layout) */
function AdminFullscreen({ children }) {
  return (
    <ProtectedRoute role="admin">
      {children}
    </ProtectedRoute>
  );
}

function App() {
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  useEffect(() => {
    const handleBadgeUnlock = (event) => {
        setUnlockedBadge(event.detail);
    };
    window.addEventListener('badge-unlocked', handleBadgeUnlock);
    return () => window.removeEventListener('badge-unlocked', handleBadgeUnlock);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <BadgeUnlockPopup badge={unlockedBadge} onClose={() => setUnlockedBadge(null)} />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/learn-more" element={<LearnMorePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-username" element={<ForgotUsername />} />
            <Route path="/recovery-request" element={<RecoveryRequest />} />
            
            {/* Authenticated Setup Routes */}
            <Route path="/setup-2fa" element={
              <StudentRoute>
                <TwoFactorSetup />
              </StudentRoute>
            } />


            {/* Student Routes */}
            <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
            <Route path="/student/lms-panel" element={<StudentRoute><LmsPanel /></StudentRoute>} />
            <Route path="/student/analytics" element={<StudentRoute><StudentAnalyticsPage /></StudentRoute>} />
            <Route path="/student/courses" element={<StudentRoute><BrowseCourses /></StudentRoute>} />
            <Route path="/student/courses/:id" element={<StudentRoute><CourseDetail /></StudentRoute>} />
            <Route path="/student/content/:id" element={<StudentRoute><ContentViewer /></StudentRoute>} />
            <Route path="/student/my-courses" element={<StudentRoute><MyCourses /></StudentRoute>} />
            <Route path="/student/tests" element={<StudentRoute><TestsList /></StudentRoute>} />
            <Route path="/student/tests/:id" element={<StudentRoute><TakeTest /></StudentRoute>} />
            <Route path="/student/attempts/:id" element={<StudentRoute><TestResults /></StudentRoute>} />
            <Route path="/student/my-attempts" element={<StudentRoute><MyAttempts /></StudentRoute>} />
            <Route path="/student/notifications" element={<StudentRoute><Notifications /></StudentRoute>} />
            <Route path="/student/ai-chat" element={<StudentRoute><AiChat /></StudentRoute>} />
            <Route path="/student/profile" element={<StudentRoute><Profile /></StudentRoute>} />
            <Route path="/student/achievements" element={<StudentRoute><AchievementsPage /></StudentRoute>} />
            <Route path="/student/completed-content" element={<StudentRoute><CompletedContent /></StudentRoute>} />
            <Route path="/student/total-content" element={<StudentRoute><TotalContent /></StudentRoute>} />
            <Route path="/student/appearance" element={<StudentRoute><Appearance /></StudentRoute>} />
            <Route path="/student/focus" element={<StudentRoute><FocusLanding /></StudentRoute>} />
            <Route path="/student/focus/history" element={<StudentRoute><FocusHistory /></StudentRoute>} />
            <Route path="/student/my-materials" element={<StudentRoute><MyMaterials /></StudentRoute>} />
            <Route path="/student/tasks" element={<StudentRoute><TaskManager /></StudentRoute>} />


            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="curriculum" element={<CurriculumManager />} />
              <Route path="courses" element={<CurriculumManager />} />
              <Route path="tests" element={<ManageTests />} />
              <Route path="tests/:testId/questions" element={<ManageQuestions />} />
              <Route path="tests/:id/analytics" element={<TestAnalytics />} />
              <Route path="courses/:id/students" element={<StudentList />} />
              <Route path="profile" element={<Profile />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="ai" element={<AdminAI />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="appearance" element={<AdminAppearance />} />
              <Route path="tasks" element={<AdminTaskManager />} />
              
              <Route path="achievements" element={<AchievementsLayout />}>
                <Route index element={<AchievementOverview />} />
                <Route path="badges" element={<BadgeManagement />} />
                <Route path="rules" element={<RuleBuilder />} />
                <Route path="students" element={<StudentAchievements />} />
                <Route path="xp" element={<XPLevels />} />
                <Route path="analytics" element={<AchievementAnalytics />} />
                <Route path="audit" element={<AuditLogs />} />
              </Route>

            </Route>
            
            {/* Admin Fullscreen / Special AI Tools */}
            <Route path="/admin/ai/teacher-workspace" element={<AdminFullscreen><TeacherAiWorkspace /></AdminFullscreen>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
