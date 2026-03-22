import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function ContentViewer() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    api.get(`/contents/${id}/`)
      .then(res => setContent(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkComplete = async () => {
    try {
      await api.post(`/contents/${id}/mark_complete/`);
      setCompleted(true);
    } catch {
      alert('Failed to mark as complete');
    }
  };

  if (loading) return <div className="spinner" />;
  if (!content) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Content not found.</p>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>{content.title}</h1>
        <p>Type: <span className="badge badge-info">{content.content_type}</span></p>
      </div>

      <div className="glass-card" style={{ marginBottom: 24 }}>
        {content.content_type === 'video' && content.file && (
          <video controls style={{ width: '100%', borderRadius: 8 }}>
            <source src={`http://127.0.0.1:8000${content.file}`} />
          </video>
        )}

        {content.content_type === 'pdf' && content.file && (
          <div style={{ textAlign: 'center' }}>
            <a href={`http://127.0.0.1:8000${content.file}`} target="_blank" rel="noreferrer" className="btn btn-primary">
              📄 Open PDF
            </a>
          </div>
        )}

        {content.content_type === 'text' && (
          <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            {content.text_content}
          </div>
        )}

        {content.content_type === 'link' && content.external_link && (
          <a href={content.external_link} target="_blank" rel="noreferrer" className="btn btn-primary">
            🔗 Open External Link
          </a>
        )}
      </div>

      <button
        className={`btn ${completed ? 'btn-success' : 'btn-primary'} btn-lg`}
        onClick={handleMarkComplete}
        disabled={completed}
      >
        {completed ? '✅ Completed!' : '✓ Mark as Complete'}
      </button>
    </div>
  );
}
