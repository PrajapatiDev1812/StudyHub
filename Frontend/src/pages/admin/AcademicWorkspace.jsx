import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  FileText,
  Award,
  BarChart3,
  FileSpreadsheet,
  Sparkles,
  UserCheck,
  Shield,
} from 'lucide-react';
import { useAcademicWorkspace } from '../../hooks/useAcademicWorkspace';

// Components
import AcademicFilterBar from '../../components/academic/AcademicFilterBar';
import OverviewModule from '../../components/academic/OverviewModule';
import StudentsModule from '../../components/academic/StudentsModule';
import StudentProfileDrawer from '../../components/academic/StudentProfileDrawer';
import AttendanceModule from '../../components/academic/AttendanceModule';
import AssignmentsModule from '../../components/academic/AssignmentsModule';
import TestsModule from '../../components/academic/TestsModule';
import AnalyticsModule from '../../components/academic/AnalyticsModule';
import ReportsModule from '../../components/academic/ReportsModule';
import AIInsightsModule from '../../components/academic/AIInsightsModule';

const MODULE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'tests', label: 'Tests', icon: Award },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
];

export default function AcademicWorkspace() {
  const {
    activeModule,
    setActiveModule,
    filters,
    handleFilterChange,
    resetFilters,
    filterOptions,
    loading,
    refetch,
    overviewData,
    studentsData,
    attendanceData,
    assignmentsData,
    testsData,
    analyticsData,
    aiInsightsData,
    isIndividualMode,

    // Student Profile Drawer State
    selectedStudentId,
    studentDetail,
    studentDetailLoading,
    openStudentProfile,
    closeStudentProfile,
  } = useAcademicWorkspace();

  return (
    <div className="fade-in" style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      {/* 1. Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Academic Management Workspace
            </h1>
            <span style={{
              fontSize: '0.78rem', padding: '3px 10px', borderRadius: 14,
              background: isIndividualMode ? 'rgba(168, 85, 247, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: isIndividualMode ? '#A855F7' : 'var(--accent-primary)',
              fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5
            }}>
              {isIndividualMode ? <UserCheck size={13} /> : <Shield size={13} />}
              {isIndividualMode ? 'INDIVIDUAL STUDENT MODE' : 'CLASS MODE'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Scoped academic workspace for managing assigned subjects, students, attendance, assessments, and predictive risk insights.
          </p>
        </div>
      </div>

      {/* 2. Global Academic Filter Bar */}
      <AcademicFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        filterOptions={filterOptions}
      />

      {/* 3. Navigation Sub-Module Tabs Bar */}
      <div className="glass-card" style={{ padding: '6px 8px', marginBottom: 24, display: 'flex', gap: 6, overflowX: 'auto' }}>
        {MODULE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Active Sub-Module Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Updating Academic Workspace Telemetry...</div>
          <span style={{ fontSize: '0.85rem' }}>Applying global filters across all 8 sub-modules</span>
        </div>
      ) : (
        <div>
          {activeModule === 'overview' && (
            <OverviewModule data={overviewData} isIndividualMode={isIndividualMode} />
          )}

          {activeModule === 'students' && (
            <StudentsModule data={studentsData} onOpenProfile={openStudentProfile} />
          )}

          {activeModule === 'attendance' && (
            <AttendanceModule data={attendanceData} studentsData={studentsData} refetch={refetch} />
          )}

          {activeModule === 'assignments' && (
            <AssignmentsModule data={assignmentsData} refetch={refetch} />
          )}

          {activeModule === 'tests' && (
            <TestsModule data={testsData} />
          )}

          {activeModule === 'analytics' && (
            <AnalyticsModule data={analyticsData} isIndividualMode={isIndividualMode} />
          )}

          {activeModule === 'reports' && (
            <ReportsModule filters={filters} studentsData={studentsData} />
          )}

          {activeModule === 'ai-insights' && (
            <AIInsightsModule data={aiInsightsData} />
          )}
        </div>
      )}

      {/* 5. Slide-Over Student Profile Drawer */}
      <StudentProfileDrawer
        isOpen={Boolean(selectedStudentId)}
        onClose={closeStudentProfile}
        studentData={studentDetail}
        loading={studentDetailLoading}
      />
    </div>
  );
}
