import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/my-courses/')
      .then(res => setCourses(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnenroll = async (courseId) => {
    if (!confirm('Are you sure you want to unenroll?')) return;
    try {
      await api.post(`/courses/${courseId}/unenroll/`);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unenroll');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>My Courses</h1>
        <p>Courses you are currently enrolled in</p>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>You haven't enrolled in any courses yet.</p>
          <Link to="/student/courses" className="btn btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="glass-card course-card">
              <h3>{course.name}</h3>
              <p className="course-desc">{course.description?.slice(0, 100)}...</p>
              <div className="course-actions">
                <Link to={`/student/courses/${course.id}`} className="btn btn-secondary btn-sm">View</Link>
                <button className="btn btn-danger btn-sm" onClick={() => handleUnenroll(course.id)}>Unenroll</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
