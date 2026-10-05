import { useState, useEffect } from 'react';
import { Settings, Sliders, ToggleLeft, Check, AlertCircle, Cpu, Shield, BookOpen } from 'lucide-react';
import { getAIConfiguration, updateAIConfiguration } from '../../../api/teacherAI';

export default function AIConfiguration() {
  const [formData, setFormData] = useState({
    assistant_name: 'StudyHub AI Assistant',
    provider: 'google',
    model_name: 'gemini-2.5-pro',
    teaching_style: 'socratic',
    difficulty_level: 'intermediate',
    temperature: 0.7,
    custom_system_prompt: '',
    enable_chat: true,
    enable_question_generation: true,
    enable_summarization: true,
    enable_exam_mode: true,
    enable_rag: true,
    enable_external_knowledge: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    getAIConfiguration()
      .then((data) => {
        if (data) {
          setFormData({
            assistant_name: data.assistant_name ?? 'StudyHub AI Assistant',
            provider: data.provider ?? 'google',
            model_name: data.model_name ?? 'gemini-2.5-pro',
            teaching_style: data.teaching_style ?? 'socratic',
            difficulty_level: data.difficulty_level ?? 'intermediate',
            temperature: data.temperature ?? 0.7,
            custom_system_prompt: data.custom_system_prompt ?? '',
            enable_chat: data.enable_chat ?? true,
            enable_question_generation: data.enable_question_generation ?? true,
            enable_summarization: data.enable_summarization ?? true,
            enable_exam_mode: data.enable_exam_mode ?? true,
            enable_rag: data.enable_rag ?? true,
            enable_external_knowledge: data.enable_external_knowledge ?? false,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch AI configuration:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      await updateAIConfiguration(formData);
      setNotification({ type: 'success', text: 'AI Configuration updated successfully!' });
    } catch (err) {
      console.error('Error saving config:', err);
      setNotification({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="ai-glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <Cpu size={36} className="spinning" style={{ margin: '0 auto 16px', color: '#818cf8' }} />
        <p>Loading AI configurations and security models...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {notification && (
        <div className="ai-glass-card" style={{
          padding: '14px 20px',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          borderColor: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: notification.type === 'success' ? '#34d399' : '#f87171',
          display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600
        }}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {notification.text}
        </div>
      )}

      {/* Provider & Model Selection (Provider Agnostic Architecture) */}
      <div className="ai-glass-card">
        <h3 className="ai-card-title"><Cpu size={20} color="#818cf8" /> AI Provider & Model Strategy</h3>
        <div className="ai-grid-2">
          <div className="ai-form-group">
            <label className="ai-form-label">Provider Service</label>
            <select className="ai-select" value={formData.provider} onChange={(e) => handleChange('provider', e.target.value)}>
              <option value="google">Google Gemini (Recommended / Free Tier Ready)</option>
              <option value="openai">OpenAI GPT (Future Expansion)</option>
              <option value="anthropic">Anthropic Claude (Future Expansion)</option>
            </select>
          </div>

          <div className="ai-form-group">
            <label className="ai-form-label">Model Engine</label>
            <select className="ai-select" value={formData.model_name} onChange={(e) => handleChange('model_name', e.target.value)}>
              <option value="gemini-2.5-pro">gemini-2.5-pro (State of the Art Advanced Reasoning)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash (High Speed Response & Low Latency)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Standard Multi-modal Processing)</option>
            </select>
          </div>
        </div>

        <div className="ai-form-group" style={{ marginBottom: 0 }}>
          <label className="ai-form-label">Assistant Display Name</label>
          <input 
            type="text" 
            className="ai-input" 
            value={formData.assistant_name} 
            onChange={(e) => handleChange('assistant_name', e.target.value)}
            placeholder="e.g., Professor Turing / StudyHub Tutor"
          />
        </div>
      </div>

      {/* Behavioral & Pedagogical Tuning */}
      <div className="ai-glass-card">
        <h3 className="ai-card-title"><Sliders size={20} color="#10b981" /> Pedagogical Behavior & Parameters</h3>
        <div className="ai-grid-2">
          <div className="ai-form-group">
            <label className="ai-form-label">Teaching Style Strategy</label>
            <select className="ai-select" value={formData.teaching_style} onChange={(e) => handleChange('teaching_style', e.target.value)}>
              <option value="socratic">Socratic (Guide with conceptual probing questions)</option>
              <option value="direct">Direct & Concise (Immediate clear factual answers)</option>
              <option value="step_by_step">Step-by-Step Breakdown (Methodical procedural problem solving)</option>
              <option value="friendly">Encouraging & Enthusiastic (Supportive tutoring tone)</option>
            </select>
          </div>

          <div className="ai-form-group">
            <label className="ai-form-label">Default Target Difficulty</label>
            <select className="ai-select" value={formData.difficulty_level} onChange={(e) => handleChange('difficulty_level', e.target.value)}>
              <option value="beginner">Beginner (Fundamental terminology & simple analogies)</option>
              <option value="intermediate">Intermediate (Standard college undergraduate rigorous level)</option>
              <option value="advanced">Advanced (Deep theoretical nuances and edge cases)</option>
            </select>
          </div>
        </div>

        <div className="ai-form-group">
          <label className="ai-form-label">
            <span>Creativity / Randomness Temperature: <strong>{formData.temperature}</strong></span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>0.0 = Highly Factual | 1.0 = Imaginative</span>
          </label>
          <input 
            type="range" 
            min="0.0" 
            max="1.0" 
            step="0.05" 
            value={formData.temperature} 
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))} 
            style={{ width: '100%', accentColor: '#818cf8', cursor: 'pointer' }} 
          />
        </div>

        <div className="ai-form-group" style={{ marginBottom: 0 }}>
          <label className="ai-form-label">Custom Master System Instruction (Optional Override)</label>
          <textarea 
            className="ai-textarea" 
            rows="4"
            value={formData.custom_system_prompt} 
            onChange={(e) => handleChange('custom_system_prompt', e.target.value)}
            placeholder="Provide explicit instructions or pedagogical boundaries that take precedence in every chat session..."
          />
        </div>
      </div>

      {/* Feature Flags (Enhancement 12) */}
      <div className="ai-glass-card">
        <h3 className="ai-card-title"><ToggleLeft size={20} color="#a78bfa" /> Feature Flags & RAG Capabilities</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: -8, marginBottom: 18 }}>
          Control exactly which AI capabilities are exposed to students and instructors across StudyHub.
        </p>

        <div className="ai-grid-2">
          <div className="ai-switch-row" onClick={() => handleToggle('enable_rag')}>
            <div className="ai-switch-info">
              <span className="ai-switch-title">RAG Knowledge Retrieval</span>
              <span className="ai-switch-desc">Connect chat responses to uploaded course documents & embeddings.</span>
            </div>
            <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={formData.enable_rag} onChange={() => handleToggle('enable_rag')} />
              <span className="ai-slider"></span>
            </label>
          </div>

          <div className="ai-switch-row" onClick={() => handleToggle('enable_external_knowledge')}>
            <div className="ai-switch-info">
              <span className="ai-switch-title">Allow External General Knowledge</span>
              <span className="ai-switch-desc">If disabled, the assistant refuses queries outside StudyHub materials.</span>
            </div>
            <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={formData.enable_external_knowledge} onChange={() => handleToggle('enable_external_knowledge')} />
              <span className="ai-slider"></span>
            </label>
          </div>

          <div className="ai-switch-row" onClick={() => handleToggle('enable_chat')}>
            <div className="ai-switch-info">
              <span className="ai-switch-title">Interactive AI Chatbot</span>
              <span className="ai-switch-desc">Enable 24/7 student tutoring and assistance dialogues.</span>
            </div>
            <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={formData.enable_chat} onChange={() => handleToggle('enable_chat')} />
              <span className="ai-slider"></span>
            </label>
          </div>

          <div className="ai-switch-row" onClick={() => handleToggle('enable_question_generation')}>
            <div className="ai-switch-info">
              <span className="ai-switch-title">Assessment Question Generator</span>
              <span className="ai-switch-desc">Allow teachers to synthesize quizzes & exams from course materials.</span>
            </div>
            <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={formData.enable_question_generation} onChange={() => handleToggle('enable_question_generation')} />
              <span className="ai-slider"></span>
            </label>
          </div>

          <div className="ai-switch-row" onClick={() => handleToggle('enable_summarization')}>
            <div className="ai-switch-info">
              <span className="ai-switch-title">AI Note Summarization</span>
              <span className="ai-switch-desc">Enable automated summarization of long lecture transcripts and notes.</span>
            </div>
            <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={formData.enable_summarization} onChange={() => handleToggle('enable_summarization')} />
              <span className="ai-slider"></span>
            </label>
          </div>

          <div className="ai-switch-row" onClick={() => handleToggle('enable_exam_mode')}>
            <div className="ai-switch-info">
              <span className="ai-switch-title">Focus & Exam Prep Mode</span>
              <span className="ai-switch-desc">Allow strict exam simulation without providing direct solutions.</span>
            </div>
            <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={formData.enable_exam_mode} onChange={() => handleToggle('enable_exam_mode')} />
              <span className="ai-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="ai-btn" disabled={saving} style={{ minWidth: 200, fontSize: '1rem', padding: '14px 28px' }}>
          {saving ? 'Saving Strategy...' : 'Save AI Configuration'}
        </button>
      </div>
    </form>
  );
}
