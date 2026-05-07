import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

// ── Reusable password field with show/hide toggle
function PasswordInput({ value, onChange, placeholder, required = true }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrapper">
      <input
        type={show ? 'text' : 'password'}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)} tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}


export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const userId = searchParams.get('user_id');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !userId) {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, [token, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/reset-password/', {
        user_id: userId,
        token: token,
        new_password: password,
        confirm_password: confirmPassword
      });
      setMessage(res.data.detail);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.new_password?.[0] || err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container slide-up">
        <div className="auth-header">
          <span className="auth-logo">🔒</span>
          <h1>Reset Password</h1>
          <p>Choose a strong new password for your account.</p>
        </div>

        {message && <div className="alert alert-success">{message} Redirecting to login...</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!message && !error && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Suddenly remembered? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
