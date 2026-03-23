import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function StudentList() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}/`),
      api.get(`/courses/${id}/students/`).catch(() => ({ data: [] })),
    ]).then(([courseRes, studRes]) => {
      setCourse(courseRes.data);
      setStudents(studRes.data.results || studRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Enrolled Students</h1>
        <p>{course?.name || `Course #${id}`}</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Enrolled</div>
          <div className="stat-value">{students.length}</div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>No students enrolled in this course yet.</p>
        </div>
      ) : (
        <div className="glass-card">
          <table className="data-table">
            <thead><tr><th>#</th><th>Username</th><th>Email</th><th>Enrolled At</th></tr></thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{s.username || s.student_username || s.student}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
