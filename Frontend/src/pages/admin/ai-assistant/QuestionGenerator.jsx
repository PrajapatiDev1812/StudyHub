import { useState } from 'react';
import { FileQuestion, Sparkles, Copy, Check, Download, Layers, BookOpen, AlertCircle } from 'lucide-react';
import { generateAssessmentQuestions } from '../../../api/teacherAI';

export default function QuestionGenerator() {
  const [formData, setFormData] = useState({
    subject: 'Computer Science',
    topic: 'Algorithm Complexity & Big-O Notation',
    difficulty: 'medium',
    question_type: 'mcq',
    count: 5,
    blooms_level: 'analyze',
    marks_per_question: 2,
    include_answer_key: true,
    include_explanation: true,
    shuffle_mcq_options: true,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = { ...formData };
      if (!payload.blooms_level || payload.blooms_level === 'none') delete payload.blooms_level;
      if (!payload.marks_per_question) delete payload.marks_per_question;

      const data = await generateAssessmentQuestions(payload);
      setResult(data);
    } catch (err) {
      console.error('Question generation error:', err);
      setError(err.message || 'Failed to generate assessment questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result && result.questions_markdown) {
      navigator.clipboard.writeText(result.questions_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleExport = () => {
    if (result && result.questions_markdown) {
      const blob = new Blob([result.questions_markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Assessment_${formData.subject.replace(/\s+/g, '_')}_${formData.topic.replace(/\s+/g, '_')}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Configuration Form Card */}
      <div className="ai-glass-card">
        <h3 className="ai-card-title">
          <FileQuestion size={22} color="#818cf8" /> Advanced Assessment & Quiz Generator
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '-8px 0 20px', lineHeight: 1.5 }}>
          Synthesize custom academic examinations aligned with precise Bloom's Taxonomy cognitive levels and marks weighting.
        </p>

        <form onSubmit={handleGenerate}>
          <div className="ai-grid-2">
            <div className="ai-form-group">
              <label className="ai-form-label">Subject Domain</label>
              <input 
                type="text" 
                className="ai-input" 
                value={formData.subject} 
                onChange={(e) => handleChange('subject', e.target.value)}
                required
              />
            </div>

            <div className="ai-form-group">
              <label className="ai-form-label">Specific Lesson Topic</label>
              <input 
                type="text" 
                className="ai-input" 
                value={formData.topic} 
                onChange={(e) => handleChange('topic', e.target.value)}
                required
              />
            </div>

            <div className="ai-form-group">
              <label className="ai-form-label">Question Format Type</label>
              <select className="ai-select" value={formData.question_type} onChange={(e) => handleChange('question_type', e.target.value)}>
                <option value="mcq">Multiple Choice (4 Options A, B, C, D)</option>
                <option value="short_answer">Short Answer / Conceptual Prompt</option>
                <option value="long_answer">Long Answer / Comprehensive Essay</option>
                <option value="case_study">Real-world Practical Case Study Analysis</option>
              </select>
            </div>

            <div className="ai-form-group">
              <label className="ai-form-label">Target Difficulty</label>
              <select className="ai-select" value={formData.difficulty} onChange={(e) => handleChange('difficulty', e.target.value)}>
                <option value="easy">Easy (Basic Recall & Definitions)</option>
                <option value="medium">Medium (Application & Interconnection)</option>
                <option value="hard">Hard (Advanced Critical Synthesis)</option>
              </select>
            </div>

            <div className="ai-form-group">
              <label className="ai-form-label">Bloom's Taxonomy Cognitive Level (Enhancement 9)</label>
              <select className="ai-select" value={formData.blooms_level} onChange={(e) => handleChange('blooms_level', e.target.value)}>
                <option value="remember">1. Remember (Retrieve irrelevant facts and concepts)</option>
                <option value="understand">2. Understand (Explain ideas and grasp meaning)</option>
                <option value="apply">3. Apply (Use procedures in new situations)</option>
                <option value="analyze">4. Analyze (Draw connections and inspect underlying structures)</option>
                <option value="evaluate">5. Evaluate (Justify a stance or critique arguments)</option>
                <option value="create">6. Create (Produce original conceptual frameworks)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="ai-form-group" style={{ flex: 1 }}>
                <label className="ai-form-label">Question Count</label>
                <input 
                  type="number" 
                  min="1" max="20" 
                  className="ai-input" 
                  value={formData.count} 
                  onChange={(e) => handleChange('count', parseInt(e.target.value) || 1)} 
                />
              </div>

              <div className="ai-form-group" style={{ flex: 1 }}>
                <label className="ai-form-label">Marks Each</label>
                <input 
                  type="number" 
                  min="1" max="50" 
                  className="ai-input" 
                  value={formData.marks_per_question} 
                  onChange={(e) => handleChange('marks_per_question', parseInt(e.target.value) || 1)} 
                />
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '12px 0 12px', color: 'var(--text-primary)' }}>
            Output Formatting & Assessment Options
          </h4>
          <div className="ai-grid-3" style={{ marginBottom: 24 }}>
            <div className="ai-switch-row" style={{ marginBottom: 0 }} onClick={() => handleToggle('include_answer_key')}>
              <span className="ai-switch-title" style={{ fontSize: '0.88rem' }}>Include Answer Key</span>
              <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={formData.include_answer_key} onChange={() => handleToggle('include_answer_key')} />
                <span className="ai-slider"></span>
              </label>
            </div>

            <div className="ai-switch-row" style={{ marginBottom: 0 }} onClick={() => handleToggle('include_explanation')}>
              <span className="ai-switch-title" style={{ fontSize: '0.88rem' }}>Include Explanations</span>
              <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={formData.include_explanation} onChange={() => handleToggle('include_explanation')} />
                <span className="ai-slider"></span>
              </label>
            </div>

            <div className="ai-switch-row" style={{ marginBottom: 0, opacity: formData.question_type === 'mcq' ? 1 : 0.5 }} onClick={() => formData.question_type === 'mcq' && handleToggle('shuffle_mcq_options')}>
              <span className="ai-switch-title" style={{ fontSize: '0.88rem' }}>Shuffle MCQ Options</span>
              <label className="ai-toggle" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={formData.shuffle_mcq_options} disabled={formData.question_type !== 'mcq'} onChange={() => handleToggle('shuffle_mcq_options')} />
                <span className="ai-slider"></span>
              </label>
            </div>
          </div>

          <button type="submit" className="ai-btn" disabled={loading} style={{ width: '100%', padding: '15px', fontSize: '1.05rem', height: 52 }}>
            <Sparkles size={20} className={loading ? 'spinning' : ''} />
            {loading ? 'Synthesizing Rigorous Academic Assessment...' : 'Generate Assessment Now'}
          </button>
        </form>
      </div>

      {error && (
        <div className="ai-glass-card" style={{ padding: '16px 20px', background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#f87171', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
          <AlertCircle size={22} />
          {error}
        </div>
      )}

      {/* Generated Results Panel */}
      {result && (
        <div className="ai-glass-card" style={{ borderTop: '4px solid #10b981', animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <span className="ai-badge ai-badge-success" style={{ marginBottom: 6 }}>
                ✅ Ready for Classroom Distribution
              </span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                Generated {result.count} {result.difficulty.toUpperCase()} {result.question_type.toUpperCase()} Questions
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Domain: {result.subject} — Topic: {result.topic} ({result.model_used || 'Gemini 2.5 Pro'})
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ai-btn ai-btn-outline" onClick={handleCopy} style={{ padding: '8px 16px' }}>
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Markdown'}
              </button>
              <button className="ai-btn" onClick={handleExport} style={{ padding: '8px 16px', background: 'var(--accent-gradient)' }}>
                <Download size={16} /> Export File
              </button>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.35)', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'monospace', 
            whiteSpace: 'pre-wrap', 
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: '#e2e8f0',
            overflowX: 'auto',
            maxHeight: '650px',
            overflowY: 'auto'
          }}>
            {result.questions_markdown}
          </div>
        </div>
      )}
    </div>
  );
}
