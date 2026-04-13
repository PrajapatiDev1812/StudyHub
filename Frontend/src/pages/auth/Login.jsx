import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [otp, setOtp] = useState('');

  const { login, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleInitialLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      
      if (data.requires_2fa) {
        setRequires2FA(true);
        setTempToken(data.temp_token);
        setLoading(false);
        return; // Stop here, wait for OTP
      }

      // Handle users without 2FA but who require setup
      if (data.requires_2fa_setup) {
         navigate('/setup-2fa');
         return;
      }

      redirectUser(data.role);
    } catch (err) {
      handleAuthError(err);
    } finally {
      if (!requires2FA) setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await verifyOTP(tempToken, otp);
      redirectUser(data.role); // Role isn't directly returned by verify-otp, AuthContext fetchProfile handles user state. We fetch it manually here if needed, but AuthContext should have set it.
      
      // Because AuthContext calls fetchProfile, we can fetch role manually one last time for routing
      const res = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const profileData = await res.json();
      redirectUser(profileData.role);

    } catch (err) {
      handleAuthError(err);
      setOtp(''); // Clear OTP field on failure
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    navigate(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
  };

  const handleAuthError = (err) => {
    if (!err.response) {
      setError('Cannot connect to the backend server. Is it running?');
    } else if (err.response.status === 429) {
      setError(err.response.data.error || 'Too many attempts. Please try again later.');
    } else {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Authentication failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container slide-up">
        <div className="auth-header">
          <span className="auth-logo">{requires2FA ? '🔐' : '🎯'}</span>
          <h1>{requires2FA ? 'Two-Factor Authentication' : 'Welcome Back'}</h1>
          <p>{requires2FA ? 'Enter the authentication code from your app.' : 'Sign in to your StudyHub account'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!requires2FA ? (
          <form onSubmit={handleInitialLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Continuing...' : 'Sign In'}
            </button>
            
            <div className="auth-recovery-links" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15 }}>
              <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot password?</Link>
              <Link to="/forgot-username" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot username?</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOTPVerify}>
            <div className="form-group">
              <label>Authentication Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="000000 or Backup Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoComplete="one-time-code"
                style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-lg auth-btn" 
              style={{ marginTop: 10, width: '100%' }}
              onClick={() => {
                setRequires2FA(false);
                setTempToken(null);
                setOtp('');
                setError('');
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </form>
        )}

        {!requires2FA && (
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        )}
      </div>
    </div>
  );
}
