import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

export default function ForgotUsername() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/forgot-username/', { email });
      setMessage(res.data.detail);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container slide-up">
        <div className="auth-header">
          <span className="auth-logo">👤</span>
          <h1>Forgot Username?</h1>
          <p>We'll send your username to your registered email address.</p>
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
              {loading ? 'Sending...' : 'Retrieve Username'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Navigate to login: <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
