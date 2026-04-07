import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

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

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourses from './pages/admin/ManageCourses';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTopics from './pages/admin/ManageTopics';
import ManageContent from './pages/admin/ManageContent';
import ManageTests from './pages/admin/ManageTests';
import ManageQuestions from './pages/admin/ManageQuestions';
import TestAnalytics from './pages/admin/TestAnalytics';
import StudentList from './pages/admin/StudentList';

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
  return (
    <ProtectedRoute role="admin">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
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
            <Route path="/student/completed-content" element={<StudentRoute><CompletedContent /></StudentRoute>} />
            <Route path="/student/total-content" element={<StudentRoute><TotalContent /></StudentRoute>} />
            <Route path="/student/appearance" element={<StudentRoute><Appearance /></StudentRoute>} />
            <Route path="/student/focus" element={<StudentRoute><FocusLanding /></StudentRoute>} />
            <Route path="/student/focus/history" element={<StudentRoute><FocusHistory /></StudentRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/courses" element={<AdminRoute><ManageCourses /></AdminRoute>} />
            <Route path="/admin/subjects" element={<AdminRoute><ManageSubjects /></AdminRoute>} />
            <Route path="/admin/topics" element={<AdminRoute><ManageTopics /></AdminRoute>} />
            <Route path="/admin/content" element={<AdminRoute><ManageContent /></AdminRoute>} />
            <Route path="/admin/tests" element={<AdminRoute><ManageTests /></AdminRoute>} />
            <Route path="/admin/tests/:testId/questions" element={<AdminRoute><ManageQuestions /></AdminRoute>} />
            <Route path="/admin/tests/:id/analytics" element={<AdminRoute><TestAnalytics /></AdminRoute>} />
            <Route path="/admin/courses/:id/students" element={<AdminRoute><StudentList /></AdminRoute>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
