import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../services/api';
import './CurriculumManager.css';

// ── Toast System ──────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div className="cm-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`cm-toast cm-toast-${t.type}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="cm-modal-overlay" onClick={onCancel}>
      <div className="cm-modal cm-confirm-modal" onClick={e => e.stopPropagation()}>
        <span className="cm-confirm-icon">🗑️</span>
        <h3>Delete Confirmation</h3>
        <p>{message}</p>
        <div className="cm-confirm-actions">
          <button className="cm-btn cm-btn-edit" onClick={onCancel}>Cancel</button>
          <button className="cm-btn cm-btn-delete" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Level Config ──────────────────────────────────────────────────────────────

const LEVELS = {
  courses:  { label: 'Courses',   icon: '📚', endpoint: '/courses/',  childLabel: 'Subjects',  childLevel: 'subjects' },
  subjects: { label: 'Subjects',  icon: '📖', endpoint: '/subjects/', childLabel: 'Topics',    childLevel: 'topics'   },
  topics:   { label: 'Topics',    icon: '📌', endpoint: '/topics/',   childLabel: 'Materials', childLevel: 'materials' },
  materials:{ label: 'Materials', icon: '📄', endpoint: '/materials/', childLabel: null,        childLevel: null },
};

// ── Thumbnail Placeholder ─────────────────────────────────────────────────────

function Thumb({ url, icon }) {
  return (
    <div className="cm-thumbnail">
      {url ? <img src={url} alt="thumb" onError={e => { e.target.style.display='none'; }} /> : icon}
    </div>
  );
}

// ── Helper: get a displayable label from any item ────────────────────────────
const getItemLabel = (item, levelKey) => {
  if (!item) return LEVELS[levelKey]?.label || 'Item';
  const raw = item.title || item.name || '';
  return raw.trim() || `[Unnamed ${LEVELS[levelKey]?.label?.slice(0,-1) || 'Item'}]`;
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function CurriculumManager() {
  const [level, setLevel] = useState('courses');
  const [breadcrumbs, setBreadcrumbs] = useState([]); // [{level, item}]
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // item to delete

  const { toasts, toast } = useToast();
  const searchTimeout = useRef(null);

  // Current parent from breadcrumbs
  const parentItem = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].item : null;
  const config = LEVELS[level];

  // ── Fetch Data — accepts explicit state so no stale-closure issues ──────────

  const fetchData = useCallback(async (nextLevel, nextBreadcrumbs, searchVal = '') => {
    setLoading(true);
    const cfg = LEVELS[nextLevel];
    const parent = nextBreadcrumbs.length > 0 ? nextBreadcrumbs[nextBreadcrumbs.length - 1].item : null;
    try {
      let url = cfg.endpoint;
      const params = new URLSearchParams();
      if (searchVal) params.set('search', searchVal);
      if (nextLevel === 'subjects'  && parent) params.set('course',   parent.id);
      if (nextLevel === 'topics'    && parent) params.set('subject',  parent.id);
      if (nextLevel === 'materials' && parent) params.set('topic',    parent.id);
      const query = params.toString();
      if (query) url += '?' + query;
      const res = await api.get(url);
      setData(res.data.results || res.data);
    } catch {
      toast('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Central navigation — always call this to change level or go back
  const navigate = useCallback((nextLevel, nextBreadcrumbs, searchVal = '') => {
    setLevel(nextLevel);
    setBreadcrumbs(nextBreadcrumbs);
    setSearch(searchVal);
    fetchData(nextLevel, nextBreadcrumbs, searchVal);
  }, [fetchData]);

  // Initial load
  useEffect(() => { fetchData('courses', [], ''); }, [fetchData]);

  // ── Search with debounce ────────────────────────────────────────────────────

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchData(level, breadcrumbs, val), 400);
  };

  // ── Drill Down — go one level deeper ───────────────────────────────────────

  const drillDown = (item) => {
    const cfg = LEVELS[level];
    const nextLevel = cfg.childLevel;
    if (!nextLevel) return;
    const nextBreadcrumbs = [...breadcrumbs, { level, item }];
    navigate(nextLevel, nextBreadcrumbs, '');
  };

  // ── Breadcrumb navigation — go back to any previous level ──────────────────

  const navigateHome = () => navigate('courses', [], '');

  const navigateToBreadcrumb = (index) => {
    // crumb[index] = { level: 'courses'|'subjects'|'topics', item }
    // We want to show childLevel of that crumb, with that item as parent
    const crumb = breadcrumbs[index];
    const levelMap = { courses: 'subjects', subjects: 'topics', topics: 'materials' };
    const nextLevel = levelMap[crumb.level] || 'courses';
    // Keep breadcrumbs up to and including this crumb as the new parent
    const nextBreadcrumbs = breadcrumbs.slice(0, index + 1);
    navigate(nextLevel, nextBreadcrumbs, '');
  };

  // ── Modal Helpers ───────────────────────────────────────────────────────────

  const blankForm = () => {
    if (level === 'courses')   return { title: '', description: '', is_published: false, is_featured: false };
    if (level === 'subjects')  return { title: '', description: '', is_published: true, order: 0 };
    if (level === 'topics')    return { title: '', description: '', is_published: true, order: 0, estimated_duration: '', difficulty: 'medium' };
    if (level === 'materials') return { title: '', description: '', material_type: 'pdf', is_published: true, is_downloadable: false, order: 0, duration: '', video_url: '', external_url: '', text_content: '' };
    return {};
  };

  const openNew = () => {
    setEditing(null);
    setForm(blankForm());
    setFile(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    if (level === 'courses')
      setForm({ title: item.title || '', description: item.description || '', is_published: item.is_published || false, is_featured: item.is_featured || false });
    else if (level === 'subjects')
      setForm({ title: item.title || '', description: item.description || '', is_published: item.is_published ?? true, order: item.order ?? 0 });
    else if (level === 'topics')
      setForm({ title: item.title || '', description: item.description || '', is_published: item.is_published ?? true, order: item.order ?? 0, estimated_duration: item.estimated_duration || '', difficulty: item.difficulty || 'medium' });
    else if (level === 'materials')
      setForm({ title: item.title || '', description: item.description || '', material_type: item.material_type || 'pdf', is_published: item.is_published ?? true, is_downloadable: item.is_downloadable || false, order: item.order ?? 0, duration: item.duration || '', video_url: item.video_url || '', external_url: item.external_url || '', text_content: item.text_content || '' });
    setFile(null);
    setShowModal(true);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let payload;
      let headers = {};

      if (level === 'materials') {
        payload = new FormData();
        Object.entries(form).forEach(([k, v]) => payload.append(k, v));
        payload.append('topic', parentItem.id);
        if (file) payload.append('file', file);
        headers = { 'Content-Type': 'multipart/form-data' };
      } else {
        payload = { ...form };
        if (level === 'subjects') payload.course = parentItem.id;
        if (level === 'topics')   payload.subject = parentItem.id;
      }

      if (editing) {
        await api.put(`${config.endpoint}${editing.id}/`, payload, { headers });
        toast(`${config.label.slice(0,-1)} updated! ✨`);
      } else {
        await api.post(config.endpoint, payload, { headers });
        toast(`${config.label.slice(0,-1)} created! 🎉`);
      }

      setShowModal(false);
      setEditing(null);
      setFile(null);
      setForm(blankForm());
      fetchData(level, breadcrumbs, search);
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data).slice(0, 120) : 'Save failed.';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = (item) => setConfirmDelete(item);

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`${config.endpoint}${confirmDelete.id}/`);
      toast(`Deleted successfully.`);
      fetchData(level, breadcrumbs, search);
    } catch {
      toast('Delete failed. This item may have related data.', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  // ── Toggle Publish ──────────────────────────────────────────────────────────

  const togglePublish = async (item) => {
    try {
      await api.patch(`${config.endpoint}${item.id}/`, { is_published: !item.is_published });
      toast(item.is_published ? 'Unpublished.' : 'Published! ✅');
      fetchData(level, breadcrumbs, search);
    } catch {
      toast('Toggle failed.', 'error');
    }
  };

  // ── Form Change ─────────────────────────────────────────────────────────────

  const onFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Stats ───────────────────────────────────────────────────────────────────

  const currentParentStats = () => {
    if (!parentItem) return null;
    if (level === 'subjects')  return [{ label: 'Subjects', count: parentItem.total_subjects ?? '—' }];
    if (level === 'topics')    return [{ label: 'Topics', count: parentItem.total_topics ?? '—' }, { label: 'Materials', count: parentItem.total_materials ?? '—' }];
    if (level === 'materials') return [{ label: 'Materials', count: parentItem.total_materials ?? '—' }];
    return null;
  };

  const stats = currentParentStats();

  // ── Render Table Rows ───────────────────────────────────────────────────────

  const renderRow = (item) => {
    const name = getItemLabel(item, level);
    const thumb = item.thumbnail;
    const icon = config.icon;
    const isPublished = item.is_published;
    const canDrillDown = !!config.childLevel;

    return (
      <tr key={item.id}>
        <td>
          <div
            className={`cm-cell-title ${canDrillDown ? 'cm-cell-drillable' : ''}`}
            onClick={canDrillDown ? () => drillDown(item) : undefined}
            title={canDrillDown ? `Open ${config.childLabel}` : undefined}
          >
            <Thumb url={thumb} icon={icon} />
            <div className="cm-title-info">
              <strong className={canDrillDown ? 'cm-drillable-name' : ''}>
                {name}
                {canDrillDown && <span className="cm-drill-arrow"> ›</span>}
              </strong>
              <small>{item.slug || item.description?.slice(0, 50) || ''}</small>
            </div>
          </div>
        </td>

        {level === 'courses' && (
          <>
            <td>
              <span className="cm-badge cm-badge-count">📖 {item.total_subjects ?? 0} subjects</span>
            </td>
            <td>
              <span className="cm-badge cm-badge-count">📄 {item.total_materials ?? 0} materials</span>
            </td>
          </>
        )}
        {level === 'subjects' && (
          <td>
            <span className="cm-badge cm-badge-count">📌 {item.total_topics ?? 0} topics</span>
          </td>
        )}
        {level === 'topics' && (
          <td>
            <span className="cm-badge cm-badge-count">📄 {item.total_materials ?? 0} materials</span>
          </td>
        )}
        {level === 'materials' && (
          <>
            <td><span className="cm-badge cm-badge-type">{item.material_type}</span></td>
            <td><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.duration || '—'}</span></td>
          </>
        )}

        <td>
          <span className={`cm-badge ${isPublished ? 'cm-badge-published' : 'cm-badge-draft'}`}>
            {isPublished ? '✅ Published' : '⏸ Draft'}
          </span>
        </td>

        <td>
          <div className="cm-actions">
            {config.childLevel && (
              <button className="cm-btn cm-btn-drill" onClick={() => drillDown(item)}>
                {LEVELS[config.childLevel]?.icon} {config.childLabel} →
              </button>
            )}
            <button className="cm-btn cm-btn-publish" onClick={() => togglePublish(item)} title={isPublished ? 'Unpublish' : 'Publish'}>
              {isPublished ? '⏸' : '▶️'}
            </button>
            <button className="cm-btn cm-btn-edit" onClick={() => openEdit(item)}>✏️</button>
            <button className="cm-btn cm-btn-delete" onClick={() => handleDelete(item)}>🗑️</button>
          </div>
        </td>
      </tr>
    );
  };

  // ── Table Headers ───────────────────────────────────────────────────────────

  const renderHeaders = () => (
    <tr>
      <th>{config.label}</th>
      {level === 'courses'   && <><th>Subjects</th><th>Materials</th></>}
      {level === 'subjects'  && <th>Topics</th>}
      {level === 'topics'    && <th>Materials</th>}
      {level === 'materials' && <><th>Type</th><th>Duration</th></>}
      <th>Status</th>
      <th>Actions</th>
    </tr>
  );

  // ── Form Fields ─────────────────────────────────────────────────────────────

  const renderForm = () => (
    <>
      {/* Common: Title */}
      <div className="cm-form-group">
        <label>Title *</label>
        <input className="cm-input" name="title" value={form.title || ''} onChange={onFormChange} required placeholder={`Enter ${config.label.slice(0,-1)} title`} />
      </div>

      {/* Common: Description */}
      <div className="cm-form-group">
        <label>Description</label>
        <textarea className="cm-input" name="description" value={form.description || ''} onChange={onFormChange} rows={3} placeholder="Optional description..." />
      </div>

      {/* Course extras */}
      {level === 'courses' && (
        <div className="cm-form-row">
          <div className="cm-toggle-group">
            <input type="checkbox" id="is_published" name="is_published" checked={form.is_published || false} onChange={onFormChange} />
            <label htmlFor="is_published">Published</label>
          </div>
          <div className="cm-toggle-group">
            <input type="checkbox" id="is_featured" name="is_featured" checked={form.is_featured || false} onChange={onFormChange} />
            <label htmlFor="is_featured">Featured</label>
          </div>
        </div>
      )}

      {/* Subject / Topic extras */}
      {(level === 'subjects' || level === 'topics') && (
        <div className="cm-form-row">
          <div className="cm-form-group">
            <label>Order</label>
            <input className="cm-input" type="number" name="order" value={form.order ?? 0} onChange={onFormChange} min={0} />
          </div>
          <div className="cm-toggle-group" style={{ alignSelf: 'flex-end', marginBottom: 0 }}>
            <input type="checkbox" id="is_published" name="is_published" checked={form.is_published ?? true} onChange={onFormChange} />
            <label htmlFor="is_published">Published</label>
          </div>
        </div>
      )}

      {/* Topic-specific */}
      {level === 'topics' && (
        <div className="cm-form-row">
          <div className="cm-form-group">
            <label>Estimated Duration</label>
            <input className="cm-input" name="estimated_duration" value={form.estimated_duration || ''} onChange={onFormChange} placeholder='e.g. "2h 30m"' />
          </div>
          <div className="cm-form-group">
            <label>Difficulty</label>
            <select className="cm-input" name="difficulty" value={form.difficulty || 'medium'} onChange={onFormChange}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      )}

      {/* Material-specific */}
      {level === 'materials' && (
        <>
          <div className="cm-form-row">
            <div className="cm-form-group">
              <label>Material Type *</label>
              <select className="cm-input" name="material_type" value={form.material_type || 'pdf'} onChange={onFormChange}>
                <option value="pdf">📄 PDF</option>
                <option value="video">🎬 Video</option>
                <option value="notes">📝 Notes</option>
                <option value="quiz">📋 Quiz</option>
                <option value="assignment">📌 Assignment</option>
                <option value="link">🔗 External Link</option>
              </select>
            </div>
            <div className="cm-form-group">
              <label>Duration</label>
              <input className="cm-input" name="duration" value={form.duration || ''} onChange={onFormChange} placeholder='e.g. "45 min"' />
            </div>
          </div>

          {/* Conditional fields by type */}
          {form.material_type === 'video' && (
            <div className="cm-form-group">
              <label>Video URL</label>
              <input className="cm-input" name="video_url" value={form.video_url || ''} onChange={onFormChange} placeholder="YouTube or direct video URL" />
            </div>
          )}
          {form.material_type === 'link' && (
            <div className="cm-form-group">
              <label>External URL *</label>
              <input className="cm-input" name="external_url" value={form.external_url || ''} onChange={onFormChange} placeholder="https://..." />
            </div>
          )}
          {form.material_type === 'notes' && (
            <div className="cm-form-group">
              <label>Notes Content</label>
              <textarea className="cm-input" name="text_content" value={form.text_content || ''} onChange={onFormChange} rows={5} placeholder="Write notes content here..." />
            </div>
          )}
          {['pdf', 'video', 'assignment'].includes(form.material_type) && (
            <div className="cm-form-group">
              <label>Upload File</label>
              <input className="cm-input" type="file" onChange={e => setFile(e.target.files[0])} accept=".pdf,.mp4,.doc,.docx" />
              <p className="cm-hint">Max 50MB. Accepted: PDF, MP4, DOC, DOCX</p>
            </div>
          )}

          <div className="cm-form-row">
            <div className="cm-form-group">
              <label>Order</label>
              <input className="cm-input" type="number" name="order" value={form.order ?? 0} onChange={onFormChange} min={0} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="cm-toggle-group">
                <input type="checkbox" id="mat_published" name="is_published" checked={form.is_published ?? true} onChange={onFormChange} />
                <label htmlFor="mat_published">Published</label>
              </div>
              <div className="cm-toggle-group">
                <input type="checkbox" id="mat_download" name="is_downloadable" checked={form.is_downloadable || false} onChange={onFormChange} />
                <label htmlFor="mat_download">Downloadable</label>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="curriculum-manager fade-in">
      <Toast toasts={toasts} />

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <ConfirmModal
          message={`Are you sure you want to delete "${getItemLabel(confirmDelete, level)}"? This action cannot be undone.`}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Page Header */}
      <div className="cm-page-header">
        <div className="cm-title-group">
          <h1>📚 Curriculum Manager</h1>
          <p>Manage your complete course hierarchy: Courses → Subjects → Topics → Materials</p>
        </div>
        <button className="cm-btn-primary" onClick={openNew}>
          + New {config.label.slice(0, -1)}
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="cm-breadcrumb">
        <button
          className={`cm-crumb ${level === 'courses' && breadcrumbs.length === 0 ? 'active' : ''}`}
          onClick={navigateHome}
        >
          🏠 Home
        </button>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="cm-crumb-sep">›</span>
            <button
              className="cm-crumb"
              onClick={() => navigateToBreadcrumb(i)}
              title={`Go back to ${LEVELS[crumb.level]?.childLabel || 'items'} of ${getItemLabel(crumb.item, crumb.level)}`}
            >
              {LEVELS[crumb.level]?.icon} {getItemLabel(crumb.item, crumb.level)}
            </button>
          </span>
        ))}
        <span className="cm-crumb-sep">›</span>
        <span className="cm-crumb active">{config.icon} {config.label}</span>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="cm-stats-bar">
          {stats.map(s => (
            <div key={s.label} className="cm-stat-chip">
              <strong>{s.count}</strong> {s.label}
            </div>
          ))}
          <div className="cm-stat-chip"><strong>{data.length}</strong> Showing</div>
        </div>
      )}

      {/* Toolbar: Search */}
      <div className="cm-toolbar">
        <div className="cm-search">
          🔍
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder={`Search ${config.label.toLowerCase()}...`}
          />
          {search && <button style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }} onClick={() => { setSearch(''); fetchData(''); }}>×</button>}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {data.length} {config.label.toLowerCase()} found
        </div>
      </div>

      {/* Main Table */}
      <div className="cm-table-wrap">
        {loading ? (
          <div className="cm-loading">⏳ Loading {config.label.toLowerCase()}...</div>
        ) : data.length === 0 ? (
          <div className="cm-empty">
            <span className="cm-empty-icon">{config.icon}</span>
            <h3>No {config.label} Found</h3>
            <p>{search ? `No results for "${search}"` : `Create your first ${config.label.slice(0,-1).toLowerCase()} to get started.`}</p>
          </div>
        ) : (
          <table className="cm-table">
            <thead>{renderHeaders()}</thead>
            <tbody>{data.map(item => renderRow(item))}</tbody>
          </table>
        )}
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="cm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>{editing ? `Edit ${config.label.slice(0,-1)}` : `New ${config.label.slice(0,-1)}`}</h2>
              <button className="cm-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {renderForm()}
              <button type="submit" className="cm-submit" disabled={submitting}>
                {submitting ? '⏳ Saving...' : editing ? '💾 Update' : '✅ Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
