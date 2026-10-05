import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import './MyMaterials.css';
import { SearchInput, SortDropdown } from '../../components/FilterSystem/FilterComponents';

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_META = {
  pdf:   { icon: '📄', label: 'PDF',          cls: 'mm-type-pdf',   fileLabel: 'PDF File' },
  doc:   { icon: '📝', label: 'Word file',    cls: 'mm-type-doc',   fileLabel: 'Word File' },
  ppt:   { icon: '📊', label: 'PPT',          cls: 'mm-type-ppt',   fileLabel: 'PPT File' },
  excel: { icon: '📈', label: 'Excel/CSV (.xls, .xlsx, .csv)', cls: 'mm-type-excel', fileLabel: 'Excel/CSV File' },
  image: { icon: '🖼️', label: 'Image (.jpg, .jpeg, .png, .gif, .webp)', cls: 'mm-type-image', fileLabel: 'Image File' },
  text:  { icon: '✏️', label: 'Text Note',    cls: 'mm-type-text',  fileLabel: 'Text Note' },
  link:  { icon: '🔗', label: 'Link',         cls: 'mm-type-link',  fileLabel: 'Link' },
};

const ACCEPT_MAP = {
  pdf: '.pdf',
  doc: '.doc,.docx,.txt',
  ppt: '.ppt,.pptx',
  excel: '.xls,.xlsx,.csv',
  image: 'image/*',
};

const TABS = [
  { key: 'all',      label: 'All',            icon: '🗂️' },
  { key: 'uploads',  label: 'My Uploads',     icon: '⬆️' },
  { key: 'shared',   label: 'Shared With Me', icon: '🤝' },
  { key: 'favorites',label: 'Favorites',      icon: '⭐' },
  { key: 'trash',    label: 'Trash',          icon: '🗑️' },
];

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const getFullUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000${path}`;
}

// ── Custom Dropdown Component ──────────────────────────────────────────────

function ThemedSelect({ label, value, options, onChange, iconMap = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="form-group mm-custom-select-group" ref={containerRef}>
      <label>{label}</label>
      <div className={`mm-custom-select ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <span className="mm-selected-value">
          {iconMap[value] || selected.icon} {selected.label}
        </span>
        <span className="mm-select-arrow">▾</span>
      </div>
      {isOpen && (
        <div className="mm-custom-select-dropdown">
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`mm-custom-select-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {iconMap[opt.value] || opt.icon} {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Upload / Edit Modal ────────────────────────────────────────────────────

function MaterialModal({ initial, onClose, onSaved, folders }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    material_type: initial?.material_type || 'pdf',
    external_url: initial?.external_url || '',
    note_text: initial?.note_text || '',
    subject: initial?.subject || '',
    topic: initial?.topic || '',
    tags: (initial?.tags || []).join(', '),
    visibility: initial?.visibility || 'private',
    folder_name: initial?.folder_name || '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'tags') {
          const tagsArr = v.split(',').map(t => t.trim()).filter(Boolean);
          fd.append('tags', JSON.stringify(tagsArr));
        } else {
          fd.append(k, v);
        }
      });
      if (file) fd.append('file', file);

      const res = isEdit
        ? await api.patch(`/student-materials/${initial.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/student-materials/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      onSaved(res.data);
      onClose();
    } catch (err) {
      console.error("Upload error:", err.response?.data || err);
      if (err.response?.data) {
        const d = err.response.data;
        const msg = typeof d === 'object' ? Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' | ') : d;
        setError(msg || 'Something went wrong.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  const showFile  = ['pdf','doc','ppt','excel','image'].includes(form.material_type);
  const showUrl   = form.material_type === 'link';
  const showNote  = form.material_type === 'text';

  return (
    <div className="mm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mm-modal">
        <h2>{isEdit ? '✏️ Edit Material' : '➕ Upload New Material'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input name="title" className="form-input" value={form.title} onChange={handleChange} required placeholder="e.g. Chapter 3 Notes" />
          </div>
          <ThemedSelect 
            label="Type *" 
            value={form.material_type}
            onChange={(val) => setForm(prev => ({ ...prev, material_type: val }))}
            options={Object.entries(TYPE_META).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))}
          />
          {showFile && (
            <div className="form-group">
              <label>{TYPE_META[form.material_type]?.fileLabel || 'File'} {!isEdit && '*'}</label>
              <input type="file" className="form-input" onChange={e => setFile(e.target.files[0])} required={!isEdit} accept={ACCEPT_MAP[form.material_type] || ''} />
            </div>
          )}
          {showUrl && (
            <div className="form-group">
              <label>URL *</label>
              <input name="external_url" className="form-input" value={form.external_url} onChange={handleChange} placeholder="https://..." required />
            </div>
          )}
          {showNote && (
            <div className="form-group">
              <label>Note Content *</label>
              <textarea name="note_text" className="form-input" rows={5} value={form.note_text} onChange={handleChange} required placeholder="Write your note here..." />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Subject</label>
              <input name="subject" className="form-input" value={form.subject} onChange={handleChange} placeholder="e.g. Physics" />
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input name="topic" className="form-input" value={form.topic} onChange={handleChange} placeholder="e.g. Thermodynamics" />
            </div>
          </div>
          <div className="form-group">
            <label>Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
            <input name="tags" className="form-input" value={form.tags} onChange={handleChange} placeholder="e.g. exam, important, revision" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ThemedSelect 
              label="Visibility"
              value={form.visibility}
              onChange={(val) => setForm(prev => ({ ...prev, visibility: val }))}
              options={[
                { value: 'private', label: 'Private', icon: '🔒' },
                { value: 'shared',  label: 'Shared',  icon: '🤝' }
              ]}
            />
            <div className="form-group">
              <label>Folder</label>
              <input name="folder_name" className="form-input" value={form.folder_name} onChange={handleChange} placeholder="Optional folder" list="mm-folders" />
              <datalist id="mm-folders">
                {folders.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-input" rows={2} value={form.description} onChange={handleChange} placeholder="Short description (optional)" />
          </div>
          <div className="mm-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Upload'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Share Modal ────────────────────────────────────────────────────────────

function ShareModal({ material, onClose }) {
  const [email, setEmail] = useState('');
  const [perms, setPerms] = useState({ can_view: true, can_edit: false, can_comment: true });
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadGrants = useCallback(async () => {
    try {
      const res = await api.get(`/student-materials/${material.id}/sharing/access-list/`);
      setGrants(res.data);
    } catch { /* ignore */ }
  }, [material.id]);

  useEffect(() => { loadGrants(); }, [loadGrants]);

  const handleShare = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setMsg('');
    try {
      await api.post(`/student-materials/${material.id}/sharing/share/`, { email, ...perms });
      setMsg(`✅ Shared successfully with ${email}`);
      setEmail('');
      loadGrants();
    } catch (err) {
      setError(err.response?.data?.email?.[0] || err.response?.data?.error || 'Failed to share.');
    } finally { setLoading(false); }
  };

  const handleRevoke = async (grantId) => {
    try {
      await api.delete(`/student-materials/${material.id}/sharing/${grantId}/revoke/`);
      setGrants(g => g.filter(x => x.id !== grantId));
    } catch { /* ignore */ }
  };

  return (
    <div className="mm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mm-modal">
        <h2>🤝 Share "{material.title}"</h2>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleShare}>
          <div className="form-group">
            <label>Share with student (organization email id)</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Enter their email address" />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {[['can_view','Can View'],['can_edit','Can Edit'],['can_comment','Can Comment']].map(([k,l]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={perms[k]} onChange={e => setPerms(p => ({ ...p, [k]: e.target.checked }))} />
                {l}
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sharing...' : 'Share'}</button>
        </form>

        {grants.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600 }}>People with access:</p>
            {grants.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{g.username}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                    {[g.can_view && 'View', g.can_edit && 'Edit', g.can_comment && 'Comment'].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <button className="mm-icon-btn danger" onClick={() => handleRevoke(g.id)} title="Revoke access" style={{ color: 'var(--danger)' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="mm-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────

function ViewModal({ material, onClose }) {
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    api.get(`/student-materials/${material.id}/note/`).then(r => {
      setSavedNote(r.data.note_content || '');
      setNote(r.data.note_content || '');
    }).catch(() => {});
    
    // Load comments
    if (material.visibility === 'shared') {
      api.get(`/student-materials/${material.id}/comments/`).then(r => {
        setComments(r.data);
      }).catch(() => {});
    }
  }, [material.id, material.visibility]);

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      await api.post(`/student-materials/${material.id}/note/`, { note_content: note });
      setSavedNote(note);
      setDirty(false);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handlePostComment = async e => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const r = await api.post(`/student-materials/${material.id}/comments/`, { content: newComment });
      setComments(prev => [...prev, r.data]);
      setNewComment('');
    } catch { /* ignore */ }
    finally { setPostingComment(false); }
  };

  const handleDeleteComment = async cid => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/student-materials/${material.id}/comments/${cid}/`);
      setComments(prev => prev.filter(c => c.id !== cid));
    } catch { /* ignore */ }
  };

  const tm = TYPE_META[material.material_type] || TYPE_META.text;

  return (
    <div className="mm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mm-modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div className={`mm-type-icon ${tm.cls}`}>{tm.icon}</div>
          <div>
            <h2 style={{ marginBottom: 0 }}>{material.title}</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {material.subject && `${material.subject} · `}{material.topic && `${material.topic} · `}
              {formatDate(material.uploaded_at)}
            </p>
          </div>
        </div>

        {material.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 14 }}>{material.description}</p>}

        {material.material_type === 'text' && material.note_text && (
          <div style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 14, whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {material.note_text}
          </div>
        )}
        {material.material_type === 'link' && material.external_url && (
          <a href={material.external_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginBottom: 14, display: 'inline-flex' }}>🔗 Open Link</a>
        )}
        {material.file && (
          <div style={{ marginBottom: 14 }}>
            {material.material_type === 'image' ? (
              <img src={getFullUrl(material.file)} alt={material.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
            ) : material.material_type === 'pdf' ? (
              <iframe src={getFullUrl(material.file)} width="100%" height="400px" style={{ border: 'none', borderRadius: 8 }} title={material.title}></iframe>
            ) : (
              <a href={getFullUrl(material.file)} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex' }}>⬇️ Download File</a>
            )}
          </div>
        )}

        {material.tags?.length > 0 && (
          <div className="mm-card-tags" style={{ marginBottom: 16 }}>
            {material.tags.map((t, i) => <span key={i} className="mm-tag">{t}</span>)}
          </div>
        )}

        {/* Private note section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 4 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>🔒 My Private Notes</p>
          <textarea
            className="form-input"
            rows={4}
            value={note}
            onChange={e => { setNote(e.target.value); setDirty(e.target.value !== savedNote); }}
            placeholder="Add personal notes here — only you can see these..."
          />
          {dirty && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveNote} disabled={saving}>{saving ? 'Saving...' : 'Save Note'}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setNote(savedNote); setDirty(false); }}>Discard</button>
            </div>
          )}
        </div>

        <div className="mm-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>

        {/* Public Comments section (if shared) */}
        {material.visibility === 'shared' && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 24 }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>💬 Shared Discussion</p>
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12, paddingRight: 8 }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No comments yet. Start the discussion!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.username}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(c.created_at)}</span>
                        {(c.username === material.student_username || material.is_owner) && (
                          <span onClick={() => handleDeleteComment(c.id)} style={{ fontSize: '0.75rem', color: 'var(--danger)', cursor: 'pointer', opacity: 0.8 }}>✕</span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: 8 }}>
              <input 
                className="form-input" 
                placeholder="Write a comment... (visible to everyone with access)" 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                required 
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={postingComment}>{postingComment ? '...' : 'Post'}</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }) {
  return (
    <div className="mm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mm-modal mm-confirm-modal">
        <div className={`mm-confirm-icon ${danger ? 'danger' : 'accent'}`}>
          {danger ? '⚠️' : '💬'}
        </div>
        <h3 className="mm-confirm-title">{title}</h3>
        <p className="mm-confirm-message">{message}</p>
        <div className="mm-modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose(); }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Action Bar ────────────────────────────────────────────────────────

function BulkActionBar({ count, isTrash, onDeselect, onBulkTrash, onBulkRestore, onBulkDelete }) {
  if (count === 0) return null;
  return (
    <div className="mm-bulk-bar">
      <button className="mm-bulk-deselect" onClick={onDeselect} title="Clear selection">✕</button>
      <span className="mm-bulk-count">{count} selected</span>
      {isTrash ? (
        <>
          <button className="btn btn-secondary btn-sm" onClick={onBulkRestore}>↩️ Restore</button>
          <button className="btn btn-danger btn-sm" onClick={onBulkDelete}>🗑️ Delete Permanently</button>
        </>
      ) : (
        <button className="btn btn-danger btn-sm" onClick={onBulkTrash}>🗑️ Move to Trash</button>
      )}
    </div>
  );
}

function MaterialCard({ item, onAction, selected, onToggleSelect, selectionMode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const tm = TYPE_META[item.material_type] || TYPE_META.text;
  const isOwner = item.is_owner;
  const isTrash = item.is_deleted;

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const menuItems = isTrash ? [
    { label: '↩️ Restore', action: 'restore' },
    ...(isOwner ? [{ label: '🗑️ Delete Permanently', action: 'permanent-delete', danger: true }] : []),
  ] : [
    { label: '👁️ View', action: 'view' },
    ...(isOwner ? [{ label: '✏️ Edit', action: 'edit' }] : []),
    ...(isOwner ? [{ label: '📁 Move to Folder', action: 'move' }] : []),
    ...(isOwner ? [{ label: '🤝 Share', action: 'share' }] : []),
    { label: '─', sep: true },
    ...(isOwner ? [{ label: '🗑️ Move to Trash', action: 'trash', danger: true }] : []),
  ];

  const handleCardClick = () => {
    if (selectionMode) { onToggleSelect(item.id); return; }
    if (!isTrash) onAction('view', item);
  };

  return (
    <div
      className={`mm-card ${isTrash ? 'is-deleted' : ''} ${selected ? 'selected' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {/* Checkbox */}
      <div className="mm-card-checkbox-wrap" onClick={e => e.stopPropagation()}>
        <input type="checkbox" className="mm-card-checkbox" checked={selected} onChange={() => onToggleSelect(item.id)} />
      </div>

      <div className="mm-card-header">
        <div className={`mm-type-icon ${tm.cls}`}>{tm.icon}</div>
        <div className="mm-card-title-block">
          <div className="mm-card-title" title={item.title}>{item.title}</div>
          <div className="mm-card-meta">
            {tm.label} · {isTrash ? `Deleted ${formatDate(item.deleted_at)}` : formatDate(item.uploaded_at)}
            {!isOwner && <span className="mm-owner-badge">by {item.student_username}</span>}
          </div>
        </div>
      </div>

      {item.description && <div className="mm-card-body">{item.description}</div>}

      {/* Trash metadata */}
      {isTrash && item.deleted_at && (
        <div className="mm-trash-meta">
          🗓️ {formatDate(item.deleted_at)}{item.deleted_by_username ? ` · by ${item.deleted_by_username}` : ''}
        </div>
      )}

      <div className="mm-card-footer">
        <div className="mm-card-tags">
          {(item.tags || []).slice(0, 3).map((t, i) => <span key={i} className="mm-tag">{t}</span>)}
          <span className={`mm-visibility-badge ${item.visibility}`}>
            {item.visibility === 'shared' ? '🤝' : '🔒'} {item.visibility}
          </span>
        </div>
        <div className="mm-card-actions" onClick={e => e.stopPropagation()}>
          {!isTrash && isOwner && (
            <button className={`mm-icon-btn fav ${item.favorite ? 'active' : ''}`} title={item.favorite ? 'Unfavorite' : 'Favorite'} onClick={() => onAction('toggle-fav', item)}>⭐</button>
          )}
          <div className="mm-menu-wrapper" ref={menuRef}>
            <button className="mm-icon-btn" onClick={() => setMenuOpen(o => !o)} title="More options">⋮</button>
            {menuOpen && (
              <div className="mm-dropdown">
                {menuItems.map((m, i) =>
                  m.sep ? <div key={i} className="mm-dropdown-sep" /> :
                  <button key={i} className={`mm-dropdown-item ${m.danger ? 'danger' : ''}`} onClick={() => { setMenuOpen(false); onAction(m.action, item); }}>
                    {m.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Move to Folder Modal ───────────────────────────────────────────────────

function FolderModal({ material, folders, onClose, onMoved }) {
  const [folder, setFolder] = useState(material.folder_name || '');
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    setLoading(true);
    try {
      await api.post(`/student-materials/${material.id}/move-to-folder/`, { folder_name: folder });
      onMoved(material.id, folder);
      onClose();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="mm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mm-modal" style={{ maxWidth: 380 }}>
        <h2>📁 Move to Folder</h2>
        <div className="form-group">
          <label>Folder Name</label>
          <input className="form-input" value={folder} onChange={e => setFolder(e.target.value)} placeholder="Leave empty to remove from folder" list="mm-folders-move" />
          <datalist id="mm-folders-move">
            {folders.map(f => <option key={f} value={f} />)}
          </datalist>
        </div>
        <div className="mm-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleMove} disabled={loading}>{loading ? 'Moving...' : 'Move'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MyMaterials() {
  const [activeTab, setActiveTab]     = useState('all');
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [visFilter, setVisFilter]     = useState('');
  const [searchFolder, setSearchFolder] = useState('');
  const [deletedDate, setDeletedDate] = useState('');
  const [sortBy, setSortBy]           = useState('newest');
  const [folders, setFolders]         = useState([]);

  // Multi-select
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const selectionMode                     = selectedIds.size > 0;

  // Confirm modal
  const [confirm, setConfirm] = useState(null); // { title, message, confirmLabel, danger, onConfirm }

  // Modals
  const [modal, setModal] = useState(null);

  const isTrash = activeTab === 'trash';

  // Reset selection when tab changes
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab]);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab: activeTab });
      if (search)      params.append('search', search);
      if (typeFilter)  params.append('type', typeFilter);
      if (visFilter)   params.append('visibility', visFilter);
      if (searchFolder) params.append('folder', searchFolder);
      if (deletedDate && isTrash) params.append('deleted_date', deletedDate);
      params.append('sort', sortBy);
      const res = await api.get(`/student-materials/?${params}`);
      setItems(res.data.results ?? res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [activeTab, search, typeFilter, visFilter, searchFolder, deletedDate, sortBy, isTrash]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await api.get('/student-materials/folders/');
      setFolders(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);
  useEffect(() => { fetchFolders(); },   [fetchFolders]);

  // ── Toggle select ──────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  // ── Individual actions ─────────────────────────────────────────────────
  const handleAction = async (action, item) => {
    switch (action) {
      case 'view':       setModal({ type: 'view', item }); break;
      case 'edit':       setModal({ type: 'edit', item }); break;
      case 'share':      setModal({ type: 'share', item }); break;
      case 'move':       setModal({ type: 'move', item }); break;
      case 'toggle-fav': {
        try {
          const res = await api.post(`/student-materials/${item.id}/toggle-favorite/`);
          setItems(prev => prev.map(x => x.id === item.id ? { ...x, favorite: res.data.favorite } : x));
        } catch { /* ignore */ }
        break;
      }
      case 'trash': {
        setConfirm({
          title: 'Move to Trash',
          message: `Move "${item.title}" to trash?`,
          confirmLabel: 'Move to Trash',
          danger: false,
          onConfirm: async () => {
            try {
              await api.delete(`/student-materials/${item.id}/`);
              setItems(prev => prev.filter(x => x.id !== item.id));
            } catch { /* ignore */ }
          },
        });
        break;
      }
      case 'restore': {
        try {
          await api.post(`/student-materials/${item.id}/restore/`);
          setItems(prev => prev.filter(x => x.id !== item.id));
        } catch { /* ignore */ }
        break;
      }
      case 'permanent-delete': {
        setConfirm({
          title: 'Permanently Delete',
          message: `Permanently delete "${item.title}"? This cannot be undone.`,
          confirmLabel: 'Delete Forever',
          danger: true,
          onConfirm: async () => {
            try {
              await api.delete(`/student-materials/${item.id}/permanent-delete/`);
              setItems(prev => prev.filter(x => x.id !== item.id));
            } catch { /* ignore */ }
          },
        });
        break;
      }
      default: break;
    }
  };

  // ── Bulk actions ───────────────────────────────────────────────────────
  const selectedList = [...selectedIds];

  const handleBulkTrash = () => {
    setConfirm({
      title: 'Move to Trash',
      message: `Move ${selectedList.length} item(s) to trash?`,
      confirmLabel: 'Move to Trash',
      danger: false,
      onConfirm: async () => {
        try {
          await api.post('/student-materials/bulk-trash/', { ids: selectedList });
          setItems(prev => prev.filter(x => !selectedIds.has(x.id)));
          setSelectedIds(new Set());
        } catch { /* ignore */ }
      },
    });
  };

  const handleBulkRestore = () => {
    setConfirm({
      title: 'Restore Items',
      message: `Restore ${selectedList.length} item(s) from trash?`,
      confirmLabel: 'Restore',
      danger: false,
      onConfirm: async () => {
        try {
          await api.post('/student-materials/bulk-restore/', { ids: selectedList });
          setItems(prev => prev.filter(x => !selectedIds.has(x.id)));
          setSelectedIds(new Set());
        } catch { /* ignore */ }
      },
    });
  };

  const handleBulkDelete = () => {
    setConfirm({
      title: 'Permanently Delete',
      message: `Permanently delete ${selectedList.length} item(s)? This cannot be undone.`,
      confirmLabel: 'Delete Forever',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete('/student-materials/bulk-permanent-delete/', { data: { ids: selectedList } });
          setItems(prev => prev.filter(x => !selectedIds.has(x.id)));
          setSelectedIds(new Set());
        } catch { /* ignore */ }
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirm({
      title: '💣 Empty Trash',
      message: `Permanently delete all ${items.length} item(s) in your trash? This cannot be undone.`,
      confirmLabel: 'Empty Trash',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete('/student-materials/empty-trash/');
          setItems([]);
          setSelectedIds(new Set());
        } catch { /* ignore */ }
      },
    });
  };

  const handleSaved = () => {
    fetchMaterials();
    fetchFolders();
  };

  const handleMoved = () => {
    fetchMaterials();
    fetchFolders();
  };

  const tabCounts = {
    all: activeTab === 'all' ? items.length : null,
    uploads: activeTab === 'uploads' ? items.length : null,
    shared: activeTab === 'shared' ? items.length : null,
    favorites: activeTab === 'favorites' ? items.length : null,
    trash: activeTab === 'trash' ? items.length : null,
  };

  const EMPTY_MESSAGES = {
    all:       { icon: '🗂️', title: 'No materials yet',  text: 'Upload your first study material!' },
    uploads:   { icon: '⬆️', title: 'No uploads yet',    text: 'Click "+ Upload" to add your own materials.' },
    shared:    { icon: '🤝', title: 'Nothing shared',     text: 'No one has shared materials with you yet.' },
    favorites: { icon: '⭐', title: 'No favorites',       text: 'Star your important materials to find them here.' },
    trash:     { icon: '🗑️', title: 'Trash is empty',    text: 'Deleted materials will appear here.' },
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>My Materials</h1>
        <p>Manage, share, and organize your personal study resources</p>
      </div>

      {/* Tabs */}
      <div className="mm-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`mm-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.key); setSortBy(t.key === 'trash' ? 'newest_deleted' : 'newest'); }}
          >
            {t.icon} {t.label}
            {tabCounts[t.key] !== null && <span className="mm-tab-count">{tabCounts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mm-toolbar">
        {/* Select All */}
        <label className="mm-select-all-label" title="Select all">
          <input
            type="checkbox"
            className="mm-card-checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
          />
          <span className="mm-select-all-text">All</span>
        </label>

        {/* Search */}
        <div className="mm-search">
          <SearchInput
            value={search}
            onChange={val => setSearch(val)}
            placeholder="Search by title, subject or topic..."
          />
        </div>

        {/* Filters */}
        <div className="mm-filter-row">
          <select className="mm-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>

          <select className="mm-filter-select" value={visFilter} onChange={e => setVisFilter(e.target.value)}>
            <option value="">All Visibility</option>
            <option value="private">🔒 Private</option>
            <option value="shared">🤝 Shared</option>
          </select>

          <select className="mm-filter-select" value={searchFolder || ''} onChange={e => setSearchFolder(e.target.value)}>
            <option value="">All Folders</option>
            {folders.map(f => <option key={f} value={f}>📁 {f}</option>)}
          </select>

          {isTrash && (
            <select className="mm-filter-select" value={deletedDate} onChange={e => setDeletedDate(e.target.value)}>
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          )}

          <SortDropdown
            value={sortBy}
            onChange={val => setSortBy(val)}
            options={
              isTrash ? [
                { value: 'newest_deleted', label: 'Newest Deleted', icon: '🕒' },
                { value: 'oldest_deleted', label: 'Oldest Deleted', icon: '📅' },
                { value: 'az',             label: 'A → Z',          icon: '🔤' },
                { value: 'za',             label: 'Z → A',          icon: '🔡' },
              ] : [
                { value: 'newest', label: 'Newest First', icon: '🆕' },
                { value: 'oldest', label: 'Oldest First', icon: '📅' },
                { value: 'az',     label: 'A → Z',        icon: '🔤' },
                { value: 'za',     label: 'Z → A',        icon: '🔡' },
              ]
            }
          />
        </div>

        {/* Actions */}
        <div className="mm-toolbar-actions">
          {!isTrash && (
            <button className="mm-upload-btn" onClick={() => setModal({ type: 'upload' })}>➕ Upload</button>
          )}
          {isTrash && items.length > 0 && (
            <button className="mm-empty-trash-btn" onClick={handleEmptyTrash}>💣 Empty Trash</button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mm-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 150, borderRadius: 'var(--radius)' }} className="mm-skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mm-empty">
          <div className="mm-empty-icon">{EMPTY_MESSAGES[activeTab]?.icon}</div>
          <h3>{EMPTY_MESSAGES[activeTab]?.title}</h3>
          <p>{EMPTY_MESSAGES[activeTab]?.text}</p>
          {activeTab !== 'trash' && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal({ type: 'upload' })}>
              ➕ Upload Your First Material
            </button>
          )}
        </div>
      ) : (
        <div className="mm-grid">
          {items.map(item => (
            <MaterialCard
              key={item.id}
              item={item}
              onAction={handleAction}
              selected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        count={selectedIds.size}
        isTrash={isTrash}
        onDeselect={() => setSelectedIds(new Set())}
        onBulkTrash={handleBulkTrash}
        onBulkRestore={handleBulkRestore}
        onBulkDelete={handleBulkDelete}
      />

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}

      {/* Modals */}
      {modal?.type === 'upload' && <MaterialModal folders={folders} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === 'edit'   && <MaterialModal initial={modal.item} folders={folders} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === 'view'   && <ViewModal material={modal.item} onClose={() => setModal(null)} />}
      {modal?.type === 'share'  && <ShareModal material={modal.item} onClose={() => setModal(null)} />}
      {modal?.type === 'move'   && <FolderModal material={modal.item} folders={folders} onClose={() => setModal(null)} onMoved={handleMoved} />}
    </div>
  );
}

