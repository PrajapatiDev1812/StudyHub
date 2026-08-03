/**
 * TeacherAiWorkspace.jsx
 * Teacher-only AI chat workspace at /admin/ai-chat
 * Full conversation management, educational actions, prompt library.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, X, Pin, Archive, Share2, Copy, Download, Trash2,
  ChevronRight, MessageSquare, Sparkles, BookOpen, FileText,
  BarChart2, Layers, Brain, Zap, Info, PanelLeftClose,
  PanelLeftOpen, MoreHorizontal, Send, Mic, MicOff, Paperclip,
  ThumbsUp, ThumbsDown, RotateCcw, ChevronDown, ChevronUp,
  GraduationCap, FolderOpen, Tag, Library, Clock,
  CheckCircle, AlertCircle, Loader2, ArrowDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './TeacherAiWorkspace.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES = [
  { value: 'teacher_mode', label: 'Teacher',  color: '#10b981', icon: '🎓' },
  { value: 'exam_mode',    label: 'Exam',     color: '#f59e0b', icon: '📝' },
];

const EDU_ACTIONS = [
  { id: 'save-notes',         icon: '📘', label: 'Save as Study Notes',        desc: 'Extract key concepts as notes'    },
  { id: 'generate-quiz',      icon: '📝', label: 'Generate Quiz',              desc: 'Create MCQ or written questions'  },
  { id: 'generate-flashcards',icon: '🎴', label: 'Generate Flashcards',        desc: 'Q&A pairs for spaced repetition'  },
  { id: 'convert-material',   icon: '📄', label: 'Convert to Lecture Material',desc: 'Formal lecture notes format'      },
  { id: 'generate-assignment',icon: '🧠', label: 'Generate Assignment',        desc: 'Structured student assignment'    },
  { id: 'blooms-questions',   icon: '📊', label: "Bloom's Taxonomy Questions", desc: 'Questions at all 6 cognitive levels'},
  { id: 'student-insight',    icon: '👥', label: 'Student Insight',            desc: 'Ask about student performance'   },
];

const WELCOME_SUGGESTIONS = [
  { icon: '📚', text: 'Explain a concept',    subtext: 'Get a detailed explanation for any topic',  prompt: 'Explain the concept of neural networks in simple terms' },
  { icon: '📝', text: 'Create a quiz',        subtext: 'Generate questions from your material',     prompt: 'Create a 5-question quiz about machine learning basics' },
  { icon: '🎴', text: 'Make flashcards',      subtext: 'Quick study cards for any subject',         prompt: 'Create flashcards for the key concepts of recursion' },
  { icon: '📄', text: 'Draft lecture notes',  subtext: 'Convert discussion into formal material',   prompt: 'Create lecture notes on database normalization' },
];

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date  = new Date(dateStr);
  const now   = new Date();
  const diff  = Math.floor((now - date) / 1000);
  if (diff < 60)        return 'Just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800)    return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateBucket(dateStr) {
  if (!dateStr) return 'Older';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff < 1)  return 'Today';
  if (diff < 2)  return 'Yesterday';
  if (diff < 8)  return 'Previous 7 Days';
  if (diff < 31) return 'Previous 30 Days';
  return 'Older';
}

function groupSessions(sessions) {
  const pinned = sessions.filter(s => s.is_pinned && !s.is_archived);
  const rest   = sessions.filter(s => !s.is_pinned && !s.is_archived);
  const archived = sessions.filter(s => s.is_archived);

  const groups = [];
  if (pinned.length)   groups.push({ label: '📌 Pinned', items: pinned });

  const bucketed = {};
  const ORDER = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];
  for (const s of rest) {
    const b = getDateBucket(s.last_message_at || s.updated_at);
    if (!bucketed[b]) bucketed[b] = [];
    bucketed[b].push(s);
  }
  for (const b of ORDER) {
    if (bucketed[b]?.length) groups.push({ label: b, items: bucketed[b] });
  }
  if (archived.length) groups.push({ label: '📦 Archived', items: archived, collapsed: true });
  return groups;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContextMenu({ pos, session, onClose, onRename, onPin, onArchive, onShare, onDuplicate, onExport, onDelete }) {
  const ref = useRef(null);
  useEffect(() => {
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="taw-context-menu" ref={ref} style={{ top: pos.y, left: pos.x }}>
      <button className="taw-ctx-item" onClick={() => { onRename(session); onClose(); }}>
        <FileText size={14} /> Rename
      </button>
      <button className="taw-ctx-item" onClick={() => { onPin(session); onClose(); }}>
        <Pin size={14} /> {session.is_pinned ? 'Unpin' : 'Pin'}
      </button>
      <button className="taw-ctx-item" onClick={() => { onShare(session); onClose(); }}>
        <Share2 size={14} /> Share
      </button>
      <button className="taw-ctx-item" onClick={() => { onDuplicate(session); onClose(); }}>
        <Copy size={14} /> Duplicate
      </button>
      <button className="taw-ctx-item" onClick={() => { onArchive(session); onClose(); }}>
        <Archive size={14} /> {session.is_archived ? 'Unarchive' : 'Archive'}
      </button>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <button className="taw-ctx-item" onClick={() => { onExport(session, 'txt'); onClose(); }}>
          <Download size={14} /> Export as TXT
        </button>
        <button className="taw-ctx-item" onClick={() => { onExport(session, 'md'); onClose(); }}>
          <Download size={14} /> Export as Markdown
        </button>
        <button className="taw-ctx-item" onClick={() => { onExport(session, 'pdf'); onClose(); }}>
          <Download size={14} /> Export as PDF
        </button>
      </div>
      <div className="taw-ctx-divider" />
      <button className="taw-ctx-item danger" onClick={() => { onDelete(session); onClose(); }}>
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}

function InfoDrawer({ session, messages, onClose }) {
  if (!session) return null;
  const msgCount = messages.length;
  const aiMsgs   = messages.filter(m => m.role === 'assistant');
  const wordCount = messages.reduce((acc, m) => acc + (m.content?.split(' ')?.length || 0), 0);

  return (
    <aside className="taw-drawer">
      <div className="taw-drawer-header">
        <h3>Conversation Info</h3>
        <button className="taw-drawer-close" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="taw-drawer-body">
        <div className="taw-drawer-field">
          <label>Title</label>
          <div className="val">{session.title}</div>
        </div>
        <div className="taw-drawer-field">
          <label>Mode</label>
          <div className="val">{session.mode?.replace('_', ' ')}</div>
        </div>
        {session.subject_name && (
          <div className="taw-drawer-field">
            <label>Subject</label>
            <div className="val">{session.subject_name}</div>
          </div>
        )}
        {session.topic_name && (
          <div className="taw-drawer-field">
            <label>Topic</label>
            <div className="val">{session.topic_name}</div>
          </div>
        )}
        <div className="taw-drawer-stat">
          <span className="stat-label">Total Messages</span>
          <span className="stat-val">{msgCount}</span>
        </div>
        <div className="taw-drawer-stat">
          <span className="stat-label">AI Responses</span>
          <span className="stat-val">{aiMsgs.length}</span>
        </div>
        <div className="taw-drawer-stat">
          <span className="stat-label">Total Words</span>
          <span className="stat-val">{wordCount.toLocaleString()}</span>
        </div>
        <div className="taw-drawer-stat">
          <span className="stat-label">Pinned</span>
          <span className="stat-val">{session.is_pinned ? '✅ Yes' : '—'}</span>
        </div>
        <div className="taw-drawer-stat">
          <span className="stat-label">Shared</span>
          <span className="stat-val">{session.is_shared ? `🔗 ${session.sharing_level}` : '—'}</span>
        </div>
        <div className="taw-drawer-field">
          <label>Created</label>
          <div className="val">{new Date(session.created_at).toLocaleString()}</div>
        </div>
        <div className="taw-drawer-field">
          <label>Last Active</label>
          <div className="val">{session.last_message_at ? new Date(session.last_message_at).toLocaleString() : '—'}</div>
        </div>
        {session.tags?.length > 0 && (
          <div className="taw-drawer-field">
            <label>Tags</label>
            <div className="taw-tags-row">
              {session.tags.map(t => (
                <span key={t.id} className="taw-tag" style={{ color: t.color, borderColor: t.color + '55' }}>
                  #{t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function SourcesPanel({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;

  return (
    <div className="taw-sources">
      <div className="taw-sources-header" onClick={() => setOpen(p => !p)}>
        <BookOpen size={12} />
        <span>{sources.length} Source{sources.length > 1 ? 's' : ''}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </div>
      {open && (
        <div className="taw-sources-list">
          {sources.map((s, i) => (
            <div key={i} className="taw-source-chip" title={s.content?.slice(0, 200)}>
              <FileText size={11} />
              <span>{s.source_document || `Source ${i + 1}`}</span>
              {s.score != null && (
                <div className="taw-source-score" title={`Confidence: ${Math.round(s.score * 100)}%`}>
                  <div className="taw-source-score-fill" style={{ width: `${s.score * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowUpSuggestions({ suggestions, onSelect }) {
  if (!suggestions?.length) return null;
  return (
    <div className="taw-followup">
      <div className="taw-followup-label">Follow-up suggestions</div>
      <div className="taw-followup-chips">
        {suggestions.map((s, i) => (
          <button key={i} className="taw-followup-chip" onClick={() => onSelect(s)}>
            <Sparkles size={11} /> {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function EduActionModal({ action, session, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({
    question_type:  'mcq',
    difficulty:     'medium',
    question_count: 5,
    card_count:     10,
    due_days:       7,
    query:          '',
    save_draft:     false,
  });

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const payload = action.id === 'student-insight'
        ? { query: form.query }
        : action.id === 'generate-quiz'
        ? { question_type: form.question_type, difficulty: form.difficulty, question_count: form.question_count }
        : action.id === 'generate-flashcards'
        ? { card_count: form.card_count }
        : action.id === 'generate-assignment'
        ? { difficulty: form.difficulty, due_days: form.due_days }
        : action.id === 'blooms-questions'
        ? { save_draft: form.save_draft }
        : {};

      const endpoint = `/ai/sessions/${session.id}/educational/${action.id}/`;
      const { data } = await api.post(endpoint, payload);
      setResult(data);
      onSuccess && onSuccess(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = EDU_ACTIONS.find(a => a.id === action.id)?.label || action.id;
  const actionIcon  = EDU_ACTIONS.find(a => a.id === action.id)?.icon || '🤖';

  return (
    <div className="taw-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="taw-modal">
        <div className="taw-modal-header">
          <h3>{actionIcon} {actionLabel}</h3>
          <button className="taw-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="taw-modal-body">
          {!result ? (
            <>
              {/* Quiz options */}
              {action.id === 'generate-quiz' && (
                <>
                  <div className="taw-form-row">
                    <div className="taw-form-group">
                      <label>Question Type</label>
                      <select value={form.question_type} onChange={e => setField('question_type', e.target.value)}>
                        <option value="mcq">Multiple Choice</option>
                        <option value="short_answer">Short Answer</option>
                        <option value="long_answer">Long Answer</option>
                        <option value="case_study">Case Study</option>
                      </select>
                    </div>
                    <div className="taw-form-group">
                      <label>Difficulty</label>
                      <select value={form.difficulty} onChange={e => setField('difficulty', e.target.value)}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className="taw-form-group">
                    <label>Number of Questions</label>
                    <input type="number" min={1} max={20} value={form.question_count}
                      onChange={e => setField('question_count', +e.target.value)} />
                  </div>
                </>
              )}
              {/* Flashcard count */}
              {action.id === 'generate-flashcards' && (
                <div className="taw-form-group">
                  <label>Number of Flashcards</label>
                  <input type="number" min={3} max={30} value={form.card_count}
                    onChange={e => setField('card_count', +e.target.value)} />
                </div>
              )}
              {/* Assignment options */}
              {action.id === 'generate-assignment' && (
                <div className="taw-form-row">
                  <div className="taw-form-group">
                    <label>Difficulty</label>
                    <select value={form.difficulty} onChange={e => setField('difficulty', e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="taw-form-group">
                    <label>Due in (days)</label>
                    <input type="number" min={1} max={30} value={form.due_days}
                      onChange={e => setField('due_days', +e.target.value)} />
                  </div>
                </div>
              )}
              {/* Bloom's save draft option */}
              {action.id === 'blooms-questions' && (
                <div className="taw-form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="save_draft" checked={form.save_draft}
                    onChange={e => setField('save_draft', e.target.checked)}
                    style={{ width: 'auto' }} />
                  <label htmlFor="save_draft" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Save as draft after generating
                  </label>
                </div>
              )}
              {/* Student insight query */}
              {action.id === 'student-insight' && (
                <div className="taw-form-group">
                  <label>Your question about students</label>
                  <input type="text" placeholder='e.g. "Which topics are students struggling with?"'
                    value={form.query} onChange={e => setField('query', e.target.value)} />
                </div>
              )}
              {/* Default message for simple actions */}
              {['save-notes', 'convert-material'].includes(action.id) && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                  AI will extract and structure content from this conversation. The result will be saved as a <strong>draft</strong> for your review.
                </p>
              )}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </>
          ) : (
            /* Result view */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 13, marginBottom: 12 }}>
                <CheckCircle size={16} /> Generated successfully — saved as <strong>draft</strong>
              </div>
              {result.insight && (
                <div className="taw-gen-preview">{result.insight}</div>
              )}
              {result.content && !result.questions && (
                <div className="taw-gen-preview">{result.content}</div>
              )}
              {result.questions && Array.isArray(result.questions) && (
                <div className="taw-gen-preview">
                  {result.questions.map((q, i) => (
                    <div key={i} style={{ marginBottom: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>Q{i + 1}: {q.question}</div>
                      {q.options && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.options.join(' | ')}</div>}
                      {q.answer_hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>💡 {q.answer_hint}</div>}
                    </div>
                  ))}
                </div>
              )}
              {result.questions && !Array.isArray(result.questions) && typeof result.questions === 'object' && (
                <div className="taw-gen-preview">
                  {Object.entries(result.questions).map(([level, qs]) => (
                    <div key={level} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'capitalize', marginBottom: 4 }}>
                        {level}
                      </div>
                      {qs.map((q, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>
                          {i + 1}. {q.question}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {result.flashcards && (
                <div className="taw-gen-preview">
                  {result.flashcards.map((c, i) => (
                    <div key={i} style={{ marginBottom: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🔹 {c.front}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>💡 {c.back}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="taw-modal-footer">
          <button className="taw-btn secondary" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              className={`taw-btn primary${loading ? ' loading-spinner' : ''}`}
              onClick={handleSubmit}
              disabled={loading || (action.id === 'student-insight' && !form.query.trim())}
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportModal({ session, onClose }) {
  const [fmt, setFmt] = useState('txt');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/ai/sessions/${session.id}/export/`, { format: fmt });
      if (fmt === 'pdf' && data.content_b64) {
        const bytes = Uint8Array.from(atob(data.content_b64), c => c.charCodeAt(0));
        const blob  = new Blob([bytes], { type: 'application/pdf' });
        const url   = URL.createObjectURL(blob);
        const a     = document.createElement('a');
        a.href = url; a.download = data.filename; a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = data.filename; a.click();
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="taw-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="taw-modal">
        <div className="taw-modal-header">
          <h3><Download size={16} style={{ marginRight: 6 }} />Export Conversation</h3>
          <button className="taw-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="taw-modal-body">
          <div className="taw-form-group">
            <label>Format</label>
            <select value={fmt} onChange={e => setFmt(e.target.value)}>
              <option value="txt">Plain Text (.txt)</option>
              <option value="md">Markdown (.md)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>
        </div>
        <div className="taw-modal-footer">
          <button className="taw-btn secondary" onClick={onClose}>Cancel</button>
          <button className={`taw-btn primary${loading ? ' loading-spinner' : ''}`} onClick={handleExport} disabled={loading}>
            {loading ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ session, onClose, onShare }) {
  const [level, setLevel]  = useState(session.sharing_level || 'private');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(session.is_shared ? `${window.location.origin}/shared/chat/${session.share_token}/` : '');

  const handleShare = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/ai/sessions/${session.id}/share/`, { sharing_level: level });
      setShareUrl(data.share_url || '');
      onShare(data);
    } catch {
      alert('Share failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="taw-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="taw-modal">
        <div className="taw-modal-header">
          <h3><Share2 size={16} style={{ marginRight: 6 }} />Share Conversation</h3>
          <button className="taw-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="taw-modal-body">
          <div className="taw-form-group">
            <label>Sharing Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)}>
              <option value="private">Private (remove share)</option>
              <option value="institution">Institution (coming soon)</option>
              <option value="public">Public Link</option>
            </select>
          </div>
          {shareUrl && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input readOnly value={shareUrl}
                style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                  borderRadius: 6, color: 'var(--text-primary)', padding: '7px 10px', fontSize: 12 }} />
              <button className="taw-btn secondary" onClick={() => { navigator.clipboard.writeText(shareUrl); }}>
                <Copy size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="taw-modal-footer">
          <button className="taw-btn secondary" onClick={onClose}>Close</button>
          <button className={`taw-btn primary${loading ? ' loading-spinner' : ''}`} onClick={handleShare} disabled={loading}>
            {loading ? 'Updating…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ session, onClose, onConfirm }) {
  return (
    <div className="taw-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="taw-modal">
        <div className="taw-modal-header">
          <h3 style={{ color: 'var(--danger)' }}><Trash2 size={16} style={{ marginRight: 6 }} />Delete Conversation</h3>
          <button className="taw-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="taw-modal-body">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{session.title}"</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="taw-modal-footer">
          <button className="taw-btn secondary" onClick={onClose}>Cancel</button>
          <button className="taw-btn danger" onClick={() => { onConfirm(session); onClose(); }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptLibraryPanel({ templates, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(q.toLowerCase()) ||
    t.prompt.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="taw-prompt-library">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 6px 8px' }}>
        <Search size={13} style={{ color: 'var(--text-muted)' }} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search templates…"
          style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)',
            fontSize: 12, outline: 'none' }} />
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={13} />
        </button>
      </div>
      {filtered.length === 0 && (
        <div style={{ padding: '16px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          No templates found
        </div>
      )}
      {filtered.map(t => (
        <div key={t.id} className="taw-prompt-item" onClick={() => { onSelect(t.prompt); onClose(); }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span className="taw-prompt-cat">{t.category}</span>
              <span className="ptitle">{t.title}</span>
            </div>
            <div className="ptext">{t.prompt.slice(0, 80)}{t.prompt.length > 80 ? '…' : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherAiWorkspace({ embedded = false }) {
  const { user } = useAuth();

  // UI state
  const [sidebarOpen, setSidebarOpen]     = useState(!embedded ? true : true);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [eduPanelOpen, setEduPanelOpen]   = useState(false);
  const [promptLibOpen, setPromptLibOpen]  = useState(false);
  const [showScrollBtn, setShowScrollBtn]  = useState(false);
  const [archivedOpen, setArchivedOpen]    = useState(false);

  // Session state
  const [sessions, setSessions]       = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [currentSession, setCurrentSession]   = useState(null);
  const [messages, setMessages]       = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Chat input state
  const [input, setInput]   = useState('');
  const [mode, setMode]     = useState('teacher_mode');
  const [sending, setSending] = useState(false);


  // Search
  const [searchQ, setSearchQ] = useState('');

  // Context menu
  const [ctxMenu, setCtxMenu] = useState(null); // { pos, session }

  // Inline rename
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal]   = useState('');

  // Header rename
  const [headerRenaming, setHeaderRenaming] = useState(false);
  const [headerRenameVal, setHeaderRenameVal] = useState('');

  // Modals
  const [modal, setModal] = useState(null); // { type, session?, action? }

  // Follow-up suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [, setLastSources] = useState([]);


  // Prompt templates
  const [templates, setTemplates] = useState([]);

  // Generated content
  const [, setGeneratedContent] = useState([]);

  // Refs
  const messagesEndRef   = useRef(null);
  const messagesAreaRef  = useRef(null);
  const inputRef         = useRef(null);
  const searchRef        = useRef(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const { data } = await api.get('/ai/chat-sessions/?archived=false');
      // Also fetch archived separately for the collapsed group
      const { data: arch } = await api.get('/ai/chat-sessions/?archived=true');
      setSessions([...data, ...arch]);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (sessionId) => {
    setMessagesLoading(true);
    try {
      const { data } = await api.get(`/ai/chats/${sessionId}/messages/`);
      setMessages(data);
      setLastSources([]);
      setSuggestions([]);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/prompt-templates/');
      setTemplates(data);
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchTemplates();
  }, [fetchSessions, fetchTemplates]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handleNewChat(); }
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F2' && currentSession) { setHeaderRenaming(true); setHeaderRenameVal(currentSession.title); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentSession]);

  // ── Scroll ─────────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleMessagesScroll = () => {
    const el = messagesAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  // ── Session management ─────────────────────────────────────────────────────

  const handleNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setSuggestions([]);
    setLastSources([]);
    setEduPanelOpen(false);
    setInfoDrawerOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const selectSession = async (session) => {
    setCurrentSession(session);
    setMode(session.mode || 'teacher_mode');
    await fetchMessages(session.id);
    if (window.innerWidth <= 1024) setSidebarOpen(false);
  };

  const updateSessionInList = (updated) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    if (currentSession?.id === updated.id) setCurrentSession(p => ({ ...p, ...updated }));
  };

  // ── Session Actions ────────────────────────────────────────────────────────

  const handlePin = async (session) => {
    try {
      const { data } = await api.post(`/ai/sessions/${session.id}/pin/`);
      updateSessionInList({ id: session.id, is_pinned: data.is_pinned });
    } catch (err) { console.error(err); }
  };

  const handleArchive = async (session) => {
    try {
      const { data } = await api.post(`/ai/sessions/${session.id}/archive/`);
      updateSessionInList({ id: session.id, is_archived: data.is_archived });
      if (currentSession?.id === session.id && data.is_archived) handleNewChat();
    } catch (err) { console.error(err); }
  };

  const handleDuplicate = async (session) => {
    try {
      const { data } = await api.post(`/ai/sessions/${session.id}/duplicate/`);
      setSessions(prev => [data, ...prev]);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (session) => {
    try {
      await api.delete(`/ai/chats/${session.id}/`);
      setSessions(prev => prev.filter(s => s.id !== session.id));
      if (currentSession?.id === session.id) handleNewChat();
    } catch (err) { console.error(err); }
  };

  const handleRenameInline = async (session, newTitle) => {
    if (!newTitle.trim() || newTitle === session.title) { setRenamingId(null); return; }
    try {
      const { data } = await api.patch(`/ai/sessions/${session.id}/`, { title: newTitle.trim() });
      updateSessionInList({ id: session.id, title: data.title });
    } catch (err) { console.error(err); }
    setRenamingId(null);
  };

  const handleRenameHeader = async () => {
    if (!headerRenameVal.trim() || !currentSession) { setHeaderRenaming(false); return; }
    await handleRenameInline(currentSession, headerRenameVal);
    setHeaderRenaming(false);
  };

  // ── Search ─────────────────────────────────────────────────────────────────

  const filteredSessions = searchQ.trim()
    ? sessions.filter(s => s.title?.toLowerCase().includes(searchQ.toLowerCase()))
    : sessions;
  const sessionGroups = groupSessions(filteredSessions);

  // ── Sending messages ───────────────────────────────────────────────────────

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || sending) return;

    setInput('');
    setSuggestions([]);
    setSending(true);

    const userMsg = { id: Date.now(), role: 'user', content, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    const thinkingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: thinkingId, role: 'thinking' }]);

    try {
      let activeSessionId = currentSession?.id;
      if (!activeSessionId) {
        const sessionRes = await api.post('/ai/chats/', { mode });
        activeSessionId = sessionRes.data.id;
      }
      
      const payload = {
        message:    content,
        mode,
      };
      const { data } = await api.post(`/ai/chats/${activeSessionId}/messages/`, payload);

      setMessages(prev => prev.filter(m => m.id !== thinkingId));

      const aiMsg = {
        id:          Date.now() + 2,
        role:        'assistant',
        content:     data.error || data.response || data.reply || data.message || 'No response',
        created_at:  new Date().toISOString(),
        sources:     data.sources || [],
        suggestions: data.follow_up_suggestions || [],
      };
      setMessages(prev => [...prev, aiMsg]);
      setLastSources(data.sources || []);
      setSuggestions(data.follow_up_suggestions || generateFallbackSuggestions(content));

      // Update or set session
      if (data.session_id && (!currentSession || currentSession.id !== data.session_id)) {
        // New session was created by the backend
        const newSession = {
          id:          data.session_id,
          title:       data.session_title || content.slice(0, 50),
          mode,
          is_pinned:   false,
          is_archived: false,
          last_message_at: new Date().toISOString(),
          created_at:  new Date().toISOString(),
          updated_at:  new Date().toISOString(),
        };
        setCurrentSession(newSession);
        setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
      } else if (currentSession) {
        updateSessionInList({ id: currentSession.id, last_message_at: new Date().toISOString() });
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      const errMsg = {
        id: Date.now() + 3,
        role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.',
        created_at: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  function generateFallbackSuggestions(lastMsg) {
    const lower = lastMsg.toLowerCase();
    if (lower.includes('explain'))  return ['Can you give an example?', 'Simplify further', 'What are the key takeaways?'];
    if (lower.includes('quiz'))     return ['Make it harder', 'Add more questions', 'Generate answer key'];
    if (lower.includes('concept'))  return ['How is this applied in practice?', 'What are common misconceptions?'];
    return ['Tell me more', 'Can you elaborate?', 'Give me an example'];
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Context menu ───────────────────────────────────────────────────────────

  const openCtxMenu = (e, session) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setCtxMenu({
      pos: { x: rect.right - 200, y: rect.bottom + 4 },
      session,
    });
  };

  // ── Auto-resize textarea ───────────────────────────────────────────────────

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  // ── Export handler ─────────────────────────────────────────────────────────

  const handleExport = (session, fmt) => {
    if (fmt) {
      // Direct export without modal
      api.post(`/ai/sessions/${session.id}/export/`, { format: fmt }).then(({ data }) => {
        const blob = new Blob([data.content || ''], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = data.filename; a.click();
        URL.revokeObjectURL(url);
      }).catch(() => {});
    } else {
      setModal({ type: 'export', session });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasMessages = messages.length > 0;

  return (
    <div className={`taw-shell${embedded ? ' embedded' : ''}`}>
      {/* ── Sidebar backdrop (mobile) ── */}
      <div
        className={`taw-sidebar-backdrop${sidebarOpen && window.innerWidth <= 1024 ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ══ SIDEBAR ════════════════════════════════════════════════════════════ */}
      <div className={`taw-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        {/* Header */}
        <div className="taw-sidebar-header">
          <button className="taw-new-chat-btn" onClick={handleNewChat} title="New Chat (Ctrl+N)">
            <Plus size={15} /> New Chat
            <span className="kbd">Ctrl+N</span>
          </button>
          <button className="taw-sidebar-toggle-btn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar">
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="taw-search-box">
          <div className="taw-search-inner">
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search conversations…"
              title="Search (Ctrl+K)"
            />
            {searchQ && (
              <button className="taw-search-clear" onClick={() => setSearchQ('')}><X size={12} /></button>
            )}
          </div>
        </div>

        {/* Session list */}
        <div className="taw-session-list">
          {sessionsLoading ? (
            <div className="taw-sidebar-empty">
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              Loading conversations…
            </div>
          ) : sessionGroups.length === 0 ? (
            <div className="taw-sidebar-empty">
              <MessageSquare size={28} />
              No conversations yet.
              <br />Start a new chat above.
            </div>
          ) : (
            sessionGroups.map(group => {
              const isArchiveGroup = group.label.includes('Archived');
              if (isArchiveGroup && !archivedOpen) {
                return (
                  <div key={group.label}>
                    <div className="taw-group-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => setArchivedOpen(true)}>
                      {group.label}
                      <ChevronRight size={11} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({group.items.length})</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={group.label}>
                  <div className="taw-group-label"
                    style={isArchiveGroup ? { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } : {}}
                    onClick={isArchiveGroup ? () => setArchivedOpen(false) : undefined}>
                    {group.label}
                    {isArchiveGroup && <ChevronDown size={11} />}
                  </div>
                  {group.items.map(session => {
                    const isRenaming = renamingId === session.id;
                    const isActive   = currentSession?.id === session.id;
                    const modeConf   = MODES.find(m => m.value === session.mode);

                    return (
                      <div
                        key={session.id}
                        className={`taw-session-item${isActive ? ' active' : ''}`}
                        onClick={() => !isRenaming && selectSession(session)}
                      >
                        <div className="taw-session-icon">
                          {modeConf?.icon || '💬'}
                        </div>
                        <div className="taw-session-meta">
                          {isRenaming ? (
                            <div className="taw-rename-wrap" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                className="taw-rename-input"
                                value={renameVal}
                                onChange={e => setRenameVal(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameInline(session, renameVal);
                                  if (e.key === 'Escape') setRenamingId(null);
                                }}
                              />
                              <button className="taw-rename-save" onClick={() => handleRenameInline(session, renameVal)}>
                                ✓
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="taw-session-title">{session.title}</div>
                              <div className="taw-session-sub">
                                {session.mode && (
                                  <span className={`taw-mode-badge ${session.mode}`}>
                                    {session.mode.replace('_mode', '')}
                                  </span>
                                )}
                                <span className="taw-session-time">
                                  {formatRelativeTime(session.last_message_at || session.updated_at)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        {session.is_pinned && !isRenaming && (
                          <Pin size={12} className="taw-pin-icon" />
                        )}
                        {!isRenaming && (
                          <button
                            className="taw-session-menu-btn"
                            onClick={e => openCtxMenu(e, session)}
                            title="Options"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar footer */}
        <div className="taw-sidebar-footer">
          <div className="taw-usage-label">
            <span>AI Workspace</span>
            <span>{sessions.filter(s => !s.is_archived).length} conversations</span>
          </div>
          <div className="taw-usage-bar-track">
            <div className="taw-usage-bar-fill" style={{ width: '100%' }} />
          </div>
          <div className="taw-usage-label">
            <span style={{ color: 'var(--accent-primary)', fontSize: 11 }}>🎓 Teacher Mode</span>
          </div>
        </div>
      </div>

      {/* ══ MAIN PANEL ════════════════════════════════════════════════════════ */}
      <main className="taw-main">
        {/* Header */}
        <header className="taw-header">
          {!sidebarOpen && (
            <button className="taw-header-toggle-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
              <PanelLeftOpen size={16} />
            </button>
          )}

          <div className="taw-header-title-area"
            onDoubleClick={() => { if (currentSession) { setHeaderRenaming(true); setHeaderRenameVal(currentSession.title); } }}>
            {headerRenaming ? (
              <input
                autoFocus
                className="taw-header-title-input"
                value={headerRenameVal}
                onChange={e => setHeaderRenameVal(e.target.value)}
                onBlur={handleRenameHeader}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameHeader();
                  if (e.key === 'Escape') setHeaderRenaming(false);
                }}
              />
            ) : (
              <>
                <div className="taw-header-title" title="Double-click to rename">
                  {currentSession ? currentSession.title : '✨ Teacher AI Workspace'}
                </div>
                {currentSession && (
                  <div className="taw-header-sub">
                    <span className={`taw-mode-badge ${currentSession.mode}`}>
                      {currentSession.mode?.replace('_mode', '')}
                    </span>
                    {currentSession.subject_name && (
                      <span className="taw-subject-chip">{currentSession.subject_name}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="taw-header-actions">
            {currentSession && (
              <>
                <button className="taw-header-btn edu-btn" onClick={() => setEduPanelOpen(p => !p)} title="Educational Actions">
                  <GraduationCap size={14} />
                  <span className="btn-label">Edu Actions</span>
                </button>
                <button className={`taw-header-btn${infoDrawerOpen ? ' active' : ''}`}
                  onClick={() => setInfoDrawerOpen(p => !p)} title="Conversation info">
                  <Info size={14} />
                  <span className="btn-label">Info</span>
                </button>
                <button className="taw-header-btn" onClick={() => setModal({ type: 'share', session: currentSession })} title="Share">
                  <Share2 size={14} />
                </button>
                <button className="taw-header-btn" onClick={() => setModal({ type: 'export', session: currentSession })} title="Export">
                  <Download size={14} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Messages / Welcome */}
        {!hasMessages && !messagesLoading ? (
          <div className="taw-welcome">
            <div className="taw-welcome-logo">
              <GraduationCap size={32} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h2>Teacher AI Workspace</h2>
            <p className="taw-welcome-sub">
              Your intelligent teaching assistant. Ask anything, generate educational content,
              and manage all your AI conversations in one place.
            </p>
            <div className="taw-suggestion-grid">
              {WELCOME_SUGGESTIONS.map((s, i) => (
                <button key={i} className="taw-suggestion-card" onClick={() => sendMessage(s.prompt)}>
                  <span className="icon">{s.icon}</span>
                  <span className="text">{s.text}</span>
                  <span className="subtext">{s.subtext}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="taw-messages-area" ref={messagesAreaRef} onScroll={handleMessagesScroll}>
            {messagesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
              </div>
            ) : (
              <div className="taw-messages-inner">
                {messages.map((msg, idx) => {
                  if (msg.role === 'thinking') {
                    return (
                      <div key={msg.id} className="taw-bubble ai">
                        <div className="taw-avatar">✦</div>
                        <div className="taw-bubble-body">
                          <div className="taw-thinking">
                            <div className="taw-thinking-dot" />
                            <div className="taw-thinking-dot" />
                            <div className="taw-thinking-dot" />
                            <span className="taw-thinking-text" onClick={() => setSending(false)}>
                              Thinking… (click to cancel)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const isUser = msg.role === 'user';
                  const isLast = idx === messages.length - 1;
                  const letter = user?.username?.[0]?.toUpperCase() || 'T';

                  return (
                    <div key={msg.id || idx}>
                      <div className={`taw-bubble ${isUser ? 'user' : 'ai'}`}>
                        <div className="taw-avatar">{isUser ? letter : '✦'}</div>
                        <div className="taw-bubble-body">
                          <div className="taw-bubble-text">
                            {isUser ? (
                              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                            ) : (
                              <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                            )}
                          </div>
                          <div className="taw-msg-actions">
                            {!isUser && (
                              <>
                                <button className="taw-msg-btn" title="Copy"
                                  onClick={() => navigator.clipboard.writeText(msg.content)}>
                                  <Copy size={13} />
                                </button>
                                <button className="taw-msg-btn good" title="Good response">
                                  <ThumbsUp size={13} />
                                </button>
                                <button className="taw-msg-btn bad" title="Bad response">
                                  <ThumbsDown size={13} />
                                </button>
                              </>
                            )}
                            {isUser && (
                              <button className="taw-msg-btn" title="Re-send" onClick={() => sendMessage(msg.content)}>
                                <RotateCcw size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Sources after AI message */}
                      {!isUser && msg.sources?.length > 0 && (
                        <SourcesPanel sources={msg.sources} />
                      )}
                      {/* Follow-up after last AI message */}
                      {!isUser && isLast && suggestions.length > 0 && (
                        <FollowUpSuggestions suggestions={suggestions} onSelect={sendMessage} />
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <button className="taw-scroll-btn" onClick={scrollToBottom} title="Scroll to bottom">
            <ArrowDown size={16} />
          </button>
        )}

        {/* Educational Actions floating panel */}
        {eduPanelOpen && (
          <div className="taw-edu-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="taw-edu-panel-title">Educational Actions</div>
              <button onClick={() => setEduPanelOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                <X size={14} />
              </button>
            </div>
            <div className="taw-edu-actions-grid">
              {EDU_ACTIONS.map(act => (
                <button key={act.id} className="taw-edu-action-btn"
                  onClick={() => { setModal({ type: 'edu', action: act }); setEduPanelOpen(false); }}
                  title={act.desc}>
                  <span className="edu-icon">{act.icon}</span>
                  <span className="edu-label">{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="taw-input-area">
          <div className="taw-input-area-inner">
            {/* Mode selector row */}
            <div className="taw-mode-row">
              {MODES.map(m => (
                <button
                  key={m.value}
                  className={`taw-mode-pill${mode === m.value ? ' active' : ''}`}
                  style={{ '--active-color': m.color }}
                  onClick={() => setMode(m.value)}
                >
                  {m.icon} {m.label}
                </button>
              ))}
              <button className="taw-prompt-templates-btn" onClick={() => setPromptLibOpen(p => !p)}>
                <Library size={12} /> Templates
              </button>
            </div>

            {/* Prompt library dropdown */}
            <div style={{ position: 'relative' }}>
              {promptLibOpen && (
                <PromptLibraryPanel
                  templates={templates}
                  onSelect={t => { setInput(t); setTimeout(() => inputRef.current?.focus(), 50); }}
                  onClose={() => setPromptLibOpen(false)}
                />
              )}

              {/* Input bar */}
              <div className="taw-input-bar">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask anything in ${MODES.find(m2 => m2.value === mode)?.label || ''} mode…`}
                  rows={1}
                />
                <div className="taw-input-actions">
                  {sending ? (
                    <button className="taw-send-btn stop" onClick={() => setSending(false)} title="Stop">
                      ■
                    </button>
                  ) : (
                    <button
                      className="taw-send-btn"
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      title="Send (Enter)"
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="taw-input-hint">
              Enter to send · Shift+Enter for new line · Ctrl+N new chat · Ctrl+K search
            </div>
          </div>
        </div>
      </main>

      {/* ══ INFO DRAWER ═══════════════════════════════════════════════════════ */}
      {infoDrawerOpen ? (
        <InfoDrawer
          session={currentSession}
          messages={messages}
          onClose={() => setInfoDrawerOpen(false)}
        />
      ) : (
        <aside className="taw-drawer hidden" />
      )}

      {/* ══ CONTEXT MENU ══════════════════════════════════════════════════════ */}
      {ctxMenu && (
        <ContextMenu
          pos={ctxMenu.pos}
          session={ctxMenu.session}
          onClose={() => setCtxMenu(null)}
          onRename={s => { setRenamingId(s.id); setRenameVal(s.title); }}
          onPin={handlePin}
          onArchive={handleArchive}
          onShare={s => setModal({ type: 'share', session: s })}
          onDuplicate={handleDuplicate}
          onExport={handleExport}
          onDelete={s => setModal({ type: 'delete', session: s })}
        />
      )}

      {/* ══ MODALS ════════════════════════════════════════════════════════════ */}
      {modal?.type === 'edu' && (
        <EduActionModal
          action={modal.action}
          session={currentSession}
          onClose={() => setModal(null)}
          onSuccess={data => { setGeneratedContent(prev => [data, ...prev]); }}
        />
      )}
      {modal?.type === 'export' && (
        <ExportModal session={modal.session} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'share' && (
        <ShareModal
          session={modal.session}
          onClose={() => setModal(null)}
          onShare={data => updateSessionInList({ id: modal.session.id, ...data })}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          session={modal.session}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
