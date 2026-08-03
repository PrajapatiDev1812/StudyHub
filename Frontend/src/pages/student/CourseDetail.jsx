import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const MATERIAL_ICONS = {
  video: '🎬', pdf: '📄', notes: '📝', quiz: '📋', assignment: '📌', link: '🔗',
};

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  // Materials for selected topic (fetched from new endpoint)
  const [materials, setMaterials] = useState([]);
  const [matLoading, setMatLoading] = useState(false);

  useEffect(() => {
    api.get(`/courses/${id}/`)
      .then(res => setCourse(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // When a topic is selected, fetch its materials from /materials/?topic=<id>
  useEffect(() => {
    if (!selectedTopic) { 
      setTimeout(() => setMaterials([]), 0); 
      return; 
    }
    setTimeout(() => setMatLoading(true), 0);
    api.get(`/materials/?topic=${selectedTopic.id}`)
      .then(res => setMaterials(res.data.results || res.data))
      .catch(() => setMaterials(selectedTopic.materials || selectedTopic.contents || []))
      .finally(() => setMatLoading(false));
  }, [selectedTopic]);

  if (loading) return <div className="spinner" />;
  if (!course) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Course not found.</p>;

  const handleBackToSubjects = () => { setSelectedSubject(null); setSelectedTopic(null); };
  const handleBackToTopics   = () => setSelectedTopic(null);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>{course.title || course.name}</h1>
        <p>{course.description}</p>
        {/* Course Stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="badge badge-info">📖 {course.total_subjects || 0} Subjects</span>
          <span className="badge badge-info">📌 {course.total_topics || 0} Topics</span>
          <span className="badge badge-info">📄 {course.total_materials || 0} Materials</span>
          {course.level && <span className="badge badge-success">{course.level}</span>}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="glass-card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${!selectedSubject ? 'btn-primary' : 'btn-secondary'}`} onClick={handleBackToSubjects}>
          📖 All Subjects
        </button>
        {selectedSubject && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <button className={`btn btn-sm ${selectedSubject && !selectedTopic ? 'btn-primary' : 'btn-secondary'}`} onClick={handleBackToTopics}>
              {selectedSubject.title || selectedSubject.name}
            </button>
          </>
        )}
        {selectedTopic && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <button className="btn btn-sm btn-primary">
              {selectedTopic.title || selectedTopic.name}
            </button>
          </>
        )}
      </div>

      {/* Level 1: Subject Cards */}
      {!selectedSubject && (
        <div>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Select a Subject
          </h3>
          {course.subjects?.length > 0 ? (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {course.subjects.map(subject => (
                <div
                  key={subject.id}
                  className="glass-card"
                  onClick={() => setSelectedSubject(subject)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {subject.thumbnail && (
                    <img src={subject.thumbnail} alt={subject.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                  )}
                  {!subject.thumbnail && (
                    <div style={{ height: 80, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                      📖
                    </div>
                  )}
                  <h3 style={{ marginBottom: 8, fontSize: '1.05rem' }}>{subject.title || subject.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12, lineHeight: 1.5 }}>
                    {subject.description || 'Explore topics in this subject.'}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-info">📌 {subject.total_topics || 0} Topics</span>
                    <span className="badge badge-info">📄 {subject.total_materials || 0} Materials</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No subjects available yet.</p>
          )}
        </div>
      )}

      {/* Level 2: Topic List */}
      {selectedSubject && !selectedTopic && (
        <div>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Topics in {selectedSubject.title || selectedSubject.name}
          </h3>
          {selectedSubject.topics?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedSubject.topics.map(topic => (
                <div
                  key={topic.id}
                  className="glass-card"
                  onClick={() => setSelectedTopic(topic)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: 4 }}>📌 {topic.title || topic.name}</h4>
                    {topic.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', margin: 0 }}>{topic.description}</p>}
                    {topic.estimated_duration && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>⏱ {topic.estimated_duration}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge badge-info">📄 {topic.total_materials || 0} Materials</span>
                    {topic.difficulty && <span className={`badge ${topic.difficulty === 'easy' ? 'badge-success' : topic.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}`}>{topic.difficulty}</span>}
                    <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No topics available in this subject.</p>
          )}
        </div>
      )}

      {/* Level 3: Materials */}
      {selectedTopic && (
        <div>
          <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Materials in {selectedTopic.title || selectedTopic.name}
          </h3>
          {matLoading ? (
            <div className="spinner" />
          ) : materials.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materials.map(mat => {
                const icon = MATERIAL_ICONS[mat.material_type || mat.content_type] || '📄';
                const href = mat.material_type === 'link' ? (mat.external_url || mat.external_link) : (mat.material_type === 'video' && mat.video_url) ? mat.video_url : `/student/content/${mat.id}`;
                const isExternal = mat.material_type === 'link' || (mat.material_type === 'video' && mat.video_url);
                return (
                  <a
                    key={mat.id}
                    href={isExternal ? href : undefined}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="content-item glass-card"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}
                    onClick={!isExternal ? (e) => { e.preventDefault(); window.location.href = `/student/content/${mat.id}`; } : undefined}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>{mat.title}</strong>
                      {mat.description && <small style={{ color: 'var(--text-muted)' }}>{mat.description.slice(0, 80)}</small>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {mat.duration && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>⏱ {mat.duration}</span>}
                      <span className="badge badge-info">{mat.material_type || mat.content_type}</span>
                      {mat.is_downloadable && <span className="badge badge-success">⬇ Download</span>}
                      <span style={{ color: 'var(--text-muted)' }}>›</span>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No materials available in this topic.</p>
          )}
        </div>
      )}
    </div>
  );
}
