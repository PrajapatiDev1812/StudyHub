import { useEffect, useState } from 'react';
import { Sparkles, Database, ShieldCheck, Activity, BookOpen, FileQuestion, MessageSquare, RefreshCw, Layers } from 'lucide-react';
import { getKnowledgeHealth, getAIConfiguration } from '../../../api/teacherAI';

export default function AIOverview({ onNavigateTab }) {
  const [health, setHealth] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [healthData, configData] = await Promise.all([
        getKnowledgeHealth().catch(() => null),
        getAIConfiguration().catch(() => null)
      ]);
      setHealth(healthData);
      setConfig(configData);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="ai-glass-card" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)', borderLeft: '4px solid #6366f1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="ai-badge ai-badge-purple">
                <Sparkles size={13} /> {config?.provider ? config.provider.toUpperCase() : 'GOOGLE'} PROVIDER ACTIVE
              </span>
              {config?.enable_rag && (
                <span className="ai-badge ai-badge-success">
                  <Database size={13} /> RAG CONNECTED
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 8px' }}>
              Welcome to StudyHub AI Control Center
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
              Configure your academic assistant's behavior, upload course knowledge documents (PDF, DOCX, TXT) for retrieval-augmented generation, and produce verified assessments in seconds.
            </p>
          </div>
          <button className="ai-btn ai-btn-outline" onClick={fetchOverviewData} disabled={loading} style={{ alignSelf: 'flex-start' }}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0' }}>Knowledge Base & System Status</h3>
      <div className="ai-grid-3">
        <div className="ai-glass-card">
          <div className="ai-metric-box">
            <span className="ai-metric-label"><BookOpen size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Total KB Documents</span>
            <span className="ai-metric-value">{health ? health.total_documents : (loading ? '...' : 0)}</span>
            <span className="ai-metric-sub">{health?.done || 0} successfully embedded</span>
          </div>
        </div>

        <div className="ai-glass-card">
          <div className="ai-metric-box">
            <span className="ai-metric-label"><Layers size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Vector Embeddings</span>
            <span className="ai-metric-value">{health ? health.total_embeddings : (loading ? '...' : 0)}</span>
            <span className="ai-metric-sub" style={{ color: '#60a5fa' }}>From {health?.total_chunks || 0} extracted text chunks</span>
          </div>
        </div>

        <div className="ai-glass-card">
          <div className="ai-metric-box">
            <span className="ai-metric-label"><ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> Security & Injection Guard</span>
            <span className="ai-metric-value" style={{ color: '#10b981' }}>Active</span>
            <span className="ai-metric-sub">Zero-cost regex filter protecting queries</span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '8px 0 0' }}>Quick Actions</h3>
      <div className="ai-grid-3">
        <div className="ai-glass-card interactive" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('question_gen')}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <FileQuestion size={22} color="#818cf8" />
          </div>
          <h4 style={{ fontSize: '1.1rem', margin: '0 0 6px' }}>Generate Assessments</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            Create custom MCQs and case studies tailored to specific subjects and Bloom's taxonomy levels.
          </p>
        </div>

        <div className="ai-glass-card interactive" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('knowledge')}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Database size={22} color="#10b981" />
          </div>
          <h4 style={{ fontSize: '1.1rem', margin: '0 0 6px' }}>Upload Knowledge</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            Upload syllabus documents, lecture notes, or reference books (PDF, DOCX, TXT) to empower AI answers.
          </p>
        </div>

        <div className="ai-glass-card interactive" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('workspace')}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MessageSquare size={22} color="#c084fc" />
          </div>
          <h4 style={{ fontSize: '1.1rem', margin: '0 0 6px' }}>AI Workspace</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
            Interact directly with the educational RAG chatbot, manage sessions, and run educational actions.
          </p>
        </div>
      </div>
    </div>
  );
}
