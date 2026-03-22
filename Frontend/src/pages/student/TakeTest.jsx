import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/tests/${id}/`)
      .then(res => setTest(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = (questionId, optionId) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit?')) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([qId, oId]) => ({
          question_id: parseInt(qId),
          selected_option_id: parseInt(oId),
        })),
      };
      const res = await api.post(`/tests/${id}/submit/`, payload);
      navigate(`/student/attempts/${res.data.attempt_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" />;
  if (!test) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Test not found.</p>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>{test.title}</h1>
        <p>{test.description}</p>
      </div>

      {test.questions?.map((q, idx) => (
        <div key={q.id} className="glass-card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 12 }}>
            Q{idx + 1}. {q.text} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({q.marks} marks)</span>
          </h4>
          <div className="options-list">
            {q.options?.map(opt => (
              <label key={opt.id} className={`option-item ${answers[q.id] === opt.id ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[q.id] === opt.id}
                  onChange={() => handleSelect(q.id, opt.id)}
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        className="btn btn-primary btn-lg"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ marginTop: 8 }}
      >
        {submitting ? 'Submitting...' : '📩 Submit Test'}
      </button>
    </div>
  );
}
