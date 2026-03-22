import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function BrowseCourses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCourses = (query = '') => {
    setLoading(true);
    api.get(`/courses/${query ? `?search=${query}` : ''}`)
      .then(res => setCourses(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses(search);
  };

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll/`);
      fetchCourses(search);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Browse Courses</h1>
        <p>Discover and enroll in available courses</p>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search courses by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No courses found.</p>
        ) : courses.map(course => (
          <div key={course.id} className="glass-card course-card">
            <div className="course-card-header">
              <h3>{course.name}</h3>
              {course.is_public && <span className="badge badge-info">Public</span>}
            </div>
            <p className="course-desc">{course.description?.slice(0, 120)}...</p>
            <div className="course-meta">
              <span>👨‍🎓 {course.enrolled_count || 0} enrolled</span>
            </div>
            <div className="course-actions">
              <Link to={`/student/courses/${course.id}`} className="btn btn-secondary btn-sm">View Details</Link>
              {course.is_enrolled ? (
                <span className="badge badge-success">✓ Enrolled</span>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => handleEnroll(course.id)}>Enroll</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
