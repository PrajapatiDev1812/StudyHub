import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function StudentAchievements() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/achievements/students/')
      .then(res => setStudents(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading student achievements...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Student Progress</h2>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-sidebar)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Student</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Level</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Total XP</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Badges Earned</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{student.first_name} {student.last_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>Level {student.level}</td>
                <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{student.xp} XP</td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{student.total_badges} Badges</td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Award Badge</button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
