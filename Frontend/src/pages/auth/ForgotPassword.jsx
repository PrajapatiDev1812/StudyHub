import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualRequired, setManualRequired] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    setManualRequired(false);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/forgot-password/', { email });
      setMessage(res.data.detail);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.manual_required) {
        setError(err.response.data.detail);
        setManualRequired(true);
      } else {
        setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container slide-up">
        <div className="auth-header">
          <span className="auth-logo">🔑</span>
          <h1>Forgot Password?</h1>
          <p>Enter your email to receive recovery instructions.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Recovery Email'}
            </button>
          </form>
        )}

        {manualRequired && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/recovery-request" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none' }}>
              Request Manual Recovery
            </Link>
          </div>
        )}

        <p className="auth-footer">
          Remembered your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
