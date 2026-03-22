import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}/`)
      .then(res => setCourse(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!course) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Course not found.</p>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>{course.name}</h1>
        <p>{course.description}</p>
      </div>

      <div className="course-tree">
        {course.subjects?.length > 0 ? course.subjects.map(subject => (
          <div key={subject.id} className="glass-card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12 }}>📖 {subject.name}</h3>
            {subject.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>{subject.description}</p>}

            {subject.topics?.map(topic => (
              <div key={topic.id} className="topic-block">
                <h4 style={{ marginBottom: 8 }}>📌 {topic.name}</h4>
                {topic.contents?.map(content => (
                  <Link key={content.id} to={`/student/content/${content.id}`} className="content-item">
                    <span className="content-type-icon">
                      {content.content_type === 'video' ? '🎬' : content.content_type === 'pdf' ? '📄' : content.content_type === 'text' ? '📝' : '🔗'}
                    </span>
                    <span>{content.title}</span>
                    <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{content.content_type}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )) : (
          <p style={{ color: 'var(--text-muted)' }}>No content available yet.</p>
        )}
      </div>
    </div>
  );
}
