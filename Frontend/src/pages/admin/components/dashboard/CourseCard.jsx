/**
 * CourseCard.jsx
 * Admin/Teacher Dashboard — Course Overview Card
 *
 * Displays teacher-owned course with:
 * - Circular SVG progress ring (teacher content completion, NOT student completion)
 * - Subject/student/material metadata chips
 * - View and Manage action buttons
 * - Proper empty state
 *
 * Props:
 *   courses      — array of course objects (from API or mock)
 *   isLoading    — boolean
 *   isError      — boolean
 *   onRetry      — function
 */

import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, FileText, Layers, AlertCircle, Plus } from 'lucide-react';

/* ── Circular SVG Progress Ring ── */
function CourseRing({ percentage = 0 }) {
  const size        = 52;
  const strokeWidth = 4;
  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="admin-course-ring" title={`${percentage}% content uploaded`}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
      </svg>
      <span className="admin-course-ring-pct">{percentage}%</span>
    </div>
  );
}

/* ── Single Course Card ── */
function SingleCourseCard({ course }) {
  const navigate = useNavigate();

  return (
    <div className="admin-course-card">
      <div className="admin-course-top">
        <div>
          <div className="admin-course-title">{course.name}</div>
          {course.code && <div className="admin-course-code">{course.code}</div>}
        </div>
        <CourseRing percentage={course.content_completion_percentage ?? 0} />
      </div>

      <div className="admin-course-meta">
        <div className="admin-course-meta-item">
          <span className="admin-course-meta-val">{course.subjects_count ?? 0}</span>
          <span className="admin-course-meta-key">Subjects</span>
        </div>
        <div className="admin-course-meta-item">
          <span className="admin-course-meta-val">{course.students_enrolled ?? 0}</span>
          <span className="admin-course-meta-key">Students</span>
        </div>
        <div className="admin-course-meta-item">
          <span className="admin-course-meta-val">{course.materials_count ?? 0}</span>
          <span className="admin-course-meta-key">Materials</span>
        </div>
      </div>

      <div className="admin-course-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/admin/courses')}
          id={`admin-course-view-${course.id}`}
        >
          View Course
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/admin/courses')}
          id={`admin-course-manage-${course.id}`}
        >
          Manage Content
        </button>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="admin-course-card" style={{ gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div className="admin-skel" style={{ height: 14, width: '75%' }} />
              <div className="admin-skel" style={{ height: 10, width: '40%' }} />
            </div>
            <div className="admin-skel" style={{ width: 52, height: 52, borderRadius: '50%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[1, 2, 3].map(j => <div key={j} className="admin-skel" style={{ height: 48, borderRadius: 8 }} />)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="admin-skel" style={{ flex: 1, height: 32, borderRadius: 8 }} />
            <div className="admin-skel" style={{ flex: 1, height: 32, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Main Export ── */
export default function CourseCard({ courses = [], isLoading, isError, onRetry }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="admin-widget admin-anim-up">
        <div className="admin-section-header">
          <div className="admin-section-title"><BookOpen size={14} /> My Courses</div>
        </div>
        <div className="admin-course-grid">
          <Skeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="admin-widget">
        <div className="admin-error-state">
          <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
          <p>Failed to load courses. Please try again.</p>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-widget admin-anim-up">
      <div className="admin-section-header">
        <div className="admin-section-title">
          <BookOpen size={14} /> My Courses
          {courses.length > 0 && (
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
              ({courses.length})
            </span>
          )}
        </div>
        <button
          className="admin-section-link"
          onClick={() => navigate('/admin/courses')}
          id="admin-course-view-all"
        >
          Manage all →
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="admin-empty">
          <BookOpen size={40} />
          <p className="admin-empty-title">No courses yet</p>
          <p className="admin-empty-sub">Create your first course to start managing subjects and materials.</p>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => navigate('/admin/courses')}
            id="admin-course-create-first"
          >
            <Plus size={14} /> Create Course
          </button>
        </div>
      ) : (
        <div className="admin-course-grid">
          {courses.map(course => (
            <SingleCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
