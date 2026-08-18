import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ContentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Try the new Material endpoint first, fall back to legacy Content
    api.get(`/materials/${id}/`)
      .then(res => setContent(res.data))
      .catch(() => {
        // Fallback to legacy Content model
        return api.get(`/contents/${id}/`)
          .then(res => setContent(res.data))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkComplete = async () => {
    try {
      // Try legacy endpoint for marking complete
      await api.post(`/contents/${id}/mark_complete/`);
      setCompleted(true);
    } catch {
      // Try tracking view on material endpoint
      try {
        await api.post(`/materials/${id}/track_view/`);
        setCompleted(true);
      } catch {
        alert('Failed to mark as complete');
      }
    }
  };

  if (loading) return <div className="spinner" />;
  if (!content) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Content not found.</p>;

  // Normalize field names between Material and Content models
  const type = content.material_type || content.content_type || 'text';
  const fileUrl = content.file ? (content.file.startsWith('http') ? content.file : `http://127.0.0.1:8000${content.file}`) : null;
  const videoUrl = content.video_url || null;
  const extUrl = content.external_url || content.external_link || null;
  const textContent = content.text_content || '';
  const description = content.description || '';

  // Simple text-to-HTML for markdown-like formatting
  const renderText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) return <h4 key={i} style={{ marginTop: 16, marginBottom: 8, color: 'var(--text-primary)' }}>{line.slice(4)}</h4>;
      if (line.startsWith('## ')) return <h3 key={i} style={{ marginTop: 20, marginBottom: 10, color: 'var(--text-primary)' }}>{line.slice(3)}</h3>;
      if (line.startsWith('# ')) return <h2 key={i} style={{ marginTop: 24, marginBottom: 12, color: 'var(--text-primary)' }}>{line.slice(2)}</h2>;
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: 20, marginBottom: 4, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{formatInline(line.slice(2))}</li>;
      // Numbered lists
      if (/^\d+\.\s/.test(line)) return <li key={i} style={{ marginLeft: 20, marginBottom: 4, color: 'var(--text-secondary)', lineHeight: 1.7, listStyleType: 'decimal' }}>{formatInline(line.replace(/^\d+\.\s/, ''))}</li>;
      // Code blocks (simple)
      if (line.startsWith('  ') && line.trim()) return <pre key={i} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent-primary)', margin: '4px 0', overflowX: 'auto' }}>{line}</pre>;
      // Empty lines
      if (!line.trim()) return <br key={i} />;
      // Normal paragraphs
      return <p key={i} style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 6 }}>{formatInline(line)}</p>;
    });
  };

  // Bold/italic inline formatting
  const formatInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ flexShrink: 0 }}>
          ← Back
        </button>
        <div>
          <h1>{content.title}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span className="badge badge-info">{type}</span>
            {content.duration && <span className="badge badge-secondary">⏱ {content.duration}</span>}
            {content.is_downloadable && <span className="badge badge-success">⬇ Downloadable</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="glass-card" style={{ marginBottom: 16, padding: '14px 20px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>{description}</p>
        </div>
      )}

      {/* Main content area */}
      <div className="glass-card" style={{ marginBottom: 24, minHeight: 200 }}>

        {/* Video */}
        {type === 'video' && videoUrl && (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8 }}>
            {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
              <iframe
                src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={content.title}
              />
            ) : (
              <video controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 8 }}>
                <source src={videoUrl} />
              </video>
            )}
          </div>
        )}

        {type === 'video' && fileUrl && !videoUrl && (
          <video controls style={{ width: '100%', borderRadius: 8 }}>
            <source src={fileUrl} />
          </video>
        )}

        {/* PDF */}
        {type === 'pdf' && fileUrl && (
          <div>
            <iframe
              src={fileUrl}
              style={{ width: '100%', height: 600, border: 'none', borderRadius: 8 }}
              title={content.title}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href={fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                📄 Open PDF in New Tab
              </a>
            </div>
          </div>
        )}

        {/* Text / Notes */}
        {(type === 'text' || type === 'notes') && textContent && (
          <div style={{ lineHeight: 1.8 }}>
            {renderText(textContent)}
          </div>
        )}

        {/* Assignment */}
        {type === 'assignment' && (
          <div>
            {textContent && <div style={{ lineHeight: 1.8 }}>{renderText(textContent)}</div>}
            {fileUrl && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <a href={fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                  📥 Download Assignment
                </a>
              </div>
            )}
          </div>
        )}

        {/* External Link */}
        {type === 'link' && extUrl && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>This material links to an external resource:</p>
            <a href={extUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
              🔗 Open External Resource
            </a>
          </div>
        )}

        {/* Fallback: show text_content if nothing else matched */}
        {!fileUrl && !videoUrl && !extUrl && !textContent && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📭</p>
            <p>No content has been uploaded for this material yet.</p>
          </div>
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
