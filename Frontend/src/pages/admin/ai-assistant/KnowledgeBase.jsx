import { useState, useEffect } from 'react';
import { Database, Upload, Trash2, FileText, CheckCircle2, Clock, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { listKnowledgeDocuments, uploadKnowledgeDocument, deleteKnowledgeDocument } from '../../../api/teacherAI';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await listKnowledgeDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load KB documents:', err);
      setNotification({ type: 'error', text: 'Could not fetch documents from server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title.trim()) {
        // Remove extension for default title
        const defTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTitle(defTitle);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title.trim() || selectedFile.name);

    setUploading(true);
    setProgress(0);
    setNotification(null);

    try {
      await uploadKnowledgeDocument(formData, (percent) => {
        setProgress(percent);
      });
      setNotification({ type: 'success', text: `Successfully embedded '${title}' into RAG vector database!` });
      setSelectedFile(null);
      setTitle('');
      fetchDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      setNotification({ type: 'error', text: err.message || 'Failed to upload and embed document.' });
    } finally {
      setUploading(false);
      setTimeout(() => setNotification(null), 7000);
    }
  };

  const handleDelete = async (id, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete '${docTitle}'? This will remove all associated vector embeddings.`)) {
      return;
    }
    try {
      await deleteKnowledgeDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setNotification({ type: 'success', text: `Removed '${docTitle}' and its embeddings from the Knowledge Base.` });
    } catch (err) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  const renderStatusBadge = (status, errorMsg) => {
    switch (status) {
      case 'done':
        return <span className="ai-badge ai-badge-success"><CheckCircle2 size={13} /> Embedded & Ready</span>;
      case 'processing':
        return <span className="ai-badge ai-badge-info"><Clock size={13} className="spinning" /> Embedding Chunks...</span>;
      case 'pending':
        return <span className="ai-badge ai-badge-warning"><Clock size={13} /> Queued</span>;
      case 'failed':
        return <span className="ai-badge ai-badge-danger" title={errorMsg}><AlertCircle size={13} /> Failed (Hover)</span>;
      default:
        return <span className="ai-badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {notification && (
        <div className="ai-glass-card" style={{
          padding: '14px 20px',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          borderColor: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: notification.type === 'success' ? '#34d399' : '#f87171',
          display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {notification.text}
        </div>
      )}

      {/* Upload Box */}
      <div className="ai-glass-card" style={{ border: '1px solid var(--border-color, rgba(99, 102, 241, 0.2))' }}>
        <h3 className="ai-card-title"><Upload size={20} color="#818cf8" /> Upload Course Material for AI RAG Engine</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '-8px 0 20px', lineHeight: 1.5 }}>
          Upload study guides, lecture notes, or textbooks. The AI engine automatically extracts text, chunks content into optimal context segments, and computes vector embeddings for precise citations.
        </p>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div className="ai-form-group" style={{ flex: '1 1 240px', marginBottom: 0 }}>
            <label className="ai-form-label">Document Display Title</label>
            <input
              type="text"
              className="ai-input"
              placeholder="e.g., Chapter 4: Neural Networks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              required
            />
          </div>

          <div className="ai-form-group" style={{ flex: '1 1 280px', marginBottom: 0 }}>
            <label className="ai-form-label">Select File (PDF, DOCX, or TXT — max 10MB)</label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              disabled={uploading}
              className="ai-input"
              style={{ padding: '8px 12px' }}
              required
            />
          </div>

          <button type="submit" className="ai-btn" disabled={!selectedFile || uploading} style={{ minWidth: '180px', alignSelf: 'flex-end' }}>
            {uploading ? <Clock size={18} className="spinning" /> : <Upload size={18} />}
            {uploading ? `Processing (${progress}%)...` : 'Embed Material'}
          </button>
        </form>

        {uploading && (
          <div style={{ marginTop: 16, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.3s ease' }}></div>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="ai-glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="ai-card-title" style={{ margin: 0 }}>
            <Database size={20} color="#10b981" /> Active Knowledge Base ({documents.length})
          </h3>
          <button className="ai-btn ai-btn-outline" onClick={fetchDocuments} disabled={loading} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} /> Refresh List
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="spinning" style={{ margin: '0 auto 10px', color: '#818cf8' }} />
            <p>Loading Knowledge Base database...</p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <FileText size={40} color="#64748b" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>No Knowledge Documents Uploaded Yet</h4>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', fontSize: '0.9rem' }}>
              Upload your first PDF or Word document above to start fueling your AI assistant with validated curriculum facts.
            </p>
          </div>
        ) : (
          <div className="ai-table-wrap">
            <table className="ai-table">
              <thead>
                <tr>
                  <th>Document Title & File Type</th>
                  <th>Vector Chunks</th>
                  <th>Embedding Status</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={20} color="#818cf8" flexShrink={0} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            {doc.file_type} • {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <Layers size={15} color="#60a5fa" />
                        {doc.embedded_chunks || 0} / {doc.total_chunks || 0} chunks
                      </div>
                    </td>
                    <td>{renderStatusBadge(doc.embedding_status, doc.error_message)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {new Date(doc.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="ai-btn ai-btn-danger" 
                        onClick={() => handleDelete(doc.id, doc.title)} 
                        title="Delete Document & Embeddings"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
