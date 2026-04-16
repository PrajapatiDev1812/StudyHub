import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import './MyMaterials.css';

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_META = {
  pdf:   { icon: '📄', label: 'PDF',          cls: 'mm-type-pdf'   },
  doc:   { icon: '📝', label: 'Document',     cls: 'mm-type-doc'   },
  ppt:   { icon: '📊', label: 'Presentation', cls: 'mm-type-ppt'   },
  image: { icon: '🖼️', label: 'Image',        cls: 'mm-type-image' },
  text:  { icon: '✏️', label: 'Text Note',    cls: 'mm-type-text'  },
  link:  { icon: '🔗', label: 'Link',         cls: 'mm-type-link'  },
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
        ? await api.patch(`/materials/${initial.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/materials/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const showFile  = ['pdf','doc','ppt','image'].includes(form.material_type);
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
          <div className="form-group">
            <label>Type *</label>
            <select name="material_type" className="form-input" value={form.material_type} onChange={handleChange}>
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          {showFile && (
            <div className="form-group">
              <label>File {!isEdit && '*'}</label>
              <input type="file" className="form-input" onChange={e => setFile(e.target.files[0])} required={!isEdit} />
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
            <div className="form-group">
              <label>Visibility</label>
              <select name="visibility" className="form-input" value={form.visibility} onChange={handleChange}>
                <option value="private">🔒 Private</option>
                <option value="shared">🤝 Shared</option>
              </select>
            </div>
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
  const [username, setUsername] = useState('');
  const [perms, setPerms] = useState({ can_view: true, can_edit: false, can_comment: true });
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadGrants = useCallback(async () => {
    try {
      const res = await api.get(`/materials/${material.id}/sharing/access-list/`);
      setGrants(res.data);
    } catch { /* ignore */ }
  }, [material.id]);

  useEffect(() => { loadGrants(); }, [loadGrants]);

  const handleShare = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setMsg('');
    try {
      await api.post(`/materials/${material.id}/sharing/share/`, { username, ...perms });
      setMsg(`✅ Shared with ${username}`);
      setUsername('');
      loadGrants();
    } catch (err) {
      setError(err.response?.data?.username?.[0] || err.response?.data?.error || 'Failed to share.');
    } finally { setLoading(false); }
  };

  const handleRevoke = async (grantId) => {
    try {
      await api.delete(`/materials/${material.id}/sharing/${grantId}/revoke/`);
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
            <label>Share with student (username)</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter their username" />
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

  useEffect(() => {
    api.get(`/materials/${material.id}/note/`).then(r => {
      setSavedNote(r.data.note_content || '');
      setNote(r.data.note_content || '');
    }).catch(() => {});
  }, [material.id]);

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      await api.post(`/materials/${material.id}/note/`, { note_content: note });
      setSavedNote(note);
      setDirty(false);
    } catch { /* ignore */ }
    finally { setSaving(false); }
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
          <a href={material.file} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginBottom: 14, display: 'inline-flex' }}>⬇️ Download File</a>
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
      </div>
    </div>
  );
}

// ── Material Card ──────────────────────────────────────────────────────────

function MaterialCard({ item, currentUser, onAction }) {
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

  return (
    <div className={`mm-card ${isTrash ? 'is-deleted' : ''}`}>
      <div className="mm-card-header">
        <div className={`mm-type-icon ${tm.cls}`}>{tm.icon}</div>
        <div className="mm-card-title-block">
          <div className="mm-card-title" title={item.title}>{item.title}</div>
          <div className="mm-card-meta">
            {tm.label} · {formatDate(item.uploaded_at)}
            {!isOwner && <span className="mm-owner-badge">by {item.student_username}</span>}
          </div>
        </div>
      </div>

      {item.description && <div className="mm-card-body">{item.description}</div>}

      <div className="mm-card-footer">
        <div className="mm-card-tags">
          {(item.tags || []).slice(0, 3).map((t, i) => <span key={i} className="mm-tag">{t}</span>)}
          <span className={`mm-visibility-badge ${item.visibility}`}>
            {item.visibility === 'shared' ? '🤝' : '🔒'} {item.visibility}
          </span>
        </div>
        <div className="mm-card-actions">
          {!isTrash && isOwner && (
            <button
              className={`mm-icon-btn fav ${item.favorite ? 'active' : ''}`}
              title={item.favorite ? 'Unfavorite' : 'Favorite'}
              onClick={() => onAction('toggle-fav', item)}
            >⭐</button>
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
      await api.post(`/materials/${material.id}/move-to-folder/`, { folder_name: folder });
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
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [folders, setFolders] = useState([]);

  // Modals
  const [modal, setModal] = useState(null); // { type: 'upload'|'edit'|'share'|'view'|'move', item? }

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab: activeTab });
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      params.append('sort', sortBy);
      const res = await api.get(`/materials/?${params}`);
      setItems(res.data.results ?? res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [activeTab, search, typeFilter, sortBy]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await api.get('/materials/folders/');
      setFolders(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);
  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const handleAction = async (action, item) => {
    switch (action) {
      case 'view':           setModal({ type: 'view', item }); break;
      case 'edit':           setModal({ type: 'edit', item }); break;
      case 'share':          setModal({ type: 'share', item }); break;
      case 'move':           setModal({ type: 'move', item }); break;
      case 'toggle-fav': {
        try {
          const res = await api.post(`/materials/${item.id}/toggle-favorite/`);
          setItems(prev => prev.map(x => x.id === item.id ? { ...x, favorite: res.data.favorite } : x));
        } catch { /* ignore */ }
        break;
      }
      case 'trash': {
        if (!window.confirm('Move this material to trash?')) break;
        try {
          await api.delete(`/materials/${item.id}/`);
          setItems(prev => prev.filter(x => x.id !== item.id));
        } catch { /* ignore */ }
        break;
      }
      case 'restore': {
        try {
          await api.post(`/materials/${item.id}/restore/`);
          setItems(prev => prev.filter(x => x.id !== item.id));
        } catch { /* ignore */ }
        break;
      }
      case 'permanent-delete': {
        if (!window.confirm('Permanently delete? This cannot be undone.')) break;
        try {
          await api.delete(`/materials/${item.id}/permanent-delete/`);
          setItems(prev => prev.filter(x => x.id !== item.id));
        } catch { /* ignore */ }
        break;
      }
      default: break;
    }
  };

  const handleSaved = (savedItem) => {
    setItems(prev => {
      const exists = prev.find(x => x.id === savedItem.id);
      return exists ? prev.map(x => x.id === savedItem.id ? savedItem : x) : [savedItem, ...prev];
    });
    fetchFolders();
  };

  const handleMoved = (id, folder) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, folder_name: folder } : x));
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
    all:       { icon: '🗂️', title: 'No materials yet', text: 'Upload your first study material!' },
    uploads:   { icon: '⬆️', title: 'No uploads yet',   text: 'Click "+ Upload" to add your own materials.' },
    shared:    { icon: '🤝', title: 'Nothing shared',    text: 'No one has shared materials with you yet.' },
    favorites: { icon: '⭐', title: 'No favorites',      text: 'Star your important materials to find them here.' },
    trash:     { icon: '🗑️', title: 'Trash is empty',   text: 'Deleted materials will appear here.' },
  };

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
            onClick={() => setActiveTab(t.key)}
          >
            {t.icon} {t.label}
            {tabCounts[t.key] !== null && <span className="mm-tab-count">{tabCounts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mm-toolbar">
        <div className="mm-search">
          <span className="mm-search-icon">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, subject or topic..."
          />
        </div>
        <div className="mm-filter-row">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>
        {activeTab !== 'trash' && (
          <button className="mm-upload-btn" onClick={() => setModal({ type: 'upload' })}>
            ➕ Upload
          </button>
        )}
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
            <MaterialCard key={item.id} item={item} onAction={handleAction} />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'upload' && (
        <MaterialModal folders={folders} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'edit' && (
        <MaterialModal initial={modal.item} folders={folders} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'view' && (
        <ViewModal material={modal.item} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'share' && (
        <ShareModal material={modal.item} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'move' && (
        <FolderModal material={modal.item} folders={folders} onClose={() => setModal(null)} onMoved={handleMoved} />
      )}
    </div>
  );
}
