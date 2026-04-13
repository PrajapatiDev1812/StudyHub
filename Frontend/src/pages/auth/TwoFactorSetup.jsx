import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

export default function TwoFactorSetup() {
  const [password, setPassword] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [otp, setOtp] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  
  const [step, setStep] = useState(1); // 1: Password, 2: Scan QR, 3: Backup Codes
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('http://127.0.0.1:8000/api/auth/2fa/setup/', 
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authenticate password.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('http://127.0.0.1:8000/api/auth/2fa/activate/', 
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBackupCodes(res.data.backup_codes);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const finishSetup = () => {
    // User must acknowledge they saved the codes.
    navigate('/login'); // Force re-login with the new 2FA requirement to establish full session if this was setup directly after registration.
  };

  return (
    <div className="auth-page">
      <div className="auth-container slide-up" style={{ maxWidth: 550 }}>
        <div className="auth-header">
          <span className="auth-logo">🛡️</span>
          <h1>Two-Factor Setup</h1>
          <p>Secure your StudyHub account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 1 && (
          <form onSubmit={handlePasswordSubmit}>
            <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
              To begin setting up 2FA, please verify your password.
            </p>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ color: 'var(--text-secondary)' }}>1. Scan this QR code with Google Authenticator or Authy.</p>
              <div style={{ background: '#fff', padding: 15, display: 'inline-block', borderRadius: 10, margin: '15px 0' }}>
                <img src={qrCode} alt="2FA QR Code" width="200" height="200" />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Or manually enter this secret: <br/>
                <code style={{ background: 'rgba(0,0,0,0.1)', padding: '4px 8px', borderRadius: 4, userSelect: 'all' }}>{secret}</code>
              </p>
            </div>

            <div className="form-group">
              <label>2. Enter the 6-digit code to activate</label>
              <input
                type="text"
                className="form-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Activate 2FA'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div>
            <div className="alert alert-success">
              ✅ 2FA is now active on your account!
            </div>
            
            <h3 style={{ marginTop: 20, marginBottom: 10 }}>Backup Recovery Codes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              If you lose access to your phone, you can use these 8-character backup codes to log in. 
              <strong> Each code can only be used once.</strong> Please save them in a secure password manager.
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 10, 
              background: 'var(--bg-secondary)', 
              padding: 20, 
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: '1.1rem'
            }}>
              {backupCodes.map((code, idx) => (
                <div key={idx} style={{ textAlign: 'center', padding: '8px 0', border: '1px dashed var(--border-color)' }}>
                  {code}
                </div>
              ))}
            </div>

            <button onClick={finishSetup} className="btn btn-primary btn-lg auth-btn" style={{ marginTop: 25 }}>
              I have safely saved these codes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
