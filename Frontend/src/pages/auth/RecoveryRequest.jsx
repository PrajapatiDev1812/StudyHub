import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

export default function RecoveryRequest() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    enrollment_no: '',
    role_claimed: 'student',
    reason: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/auth/recovery-request/', formData);
      setMessage(res.data.detail);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-page">
      <div className="auth-container slide-up" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <span className="auth-logo">🚑</span>
          <h1>Manual Recovery</h1>
          <p>Submit this form if you cannot use the automated recovery system.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                className="form-input"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="form-group">
                <label>Registered Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username (optional)</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="form-group">
                <label>Enrollment No / ID</label>
                <input
                  type="text"
                  name="enrollment_no"
                  className="form-input"
                  value={formData.enrollment_no}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Role</label>
                <select 
                  name="role_claimed" 
                  className="form-input"
                  value={formData.role_claimed}
                  onChange={handleChange}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Manual Recovery</label>
              <textarea
                name="reason"
                className="form-input"
                rows="3"
                placeholder="e.g. My email is not verified, and I don't have secondary auth access."
                value={formData.reason}
                onChange={handleChange}
                required
                style={{ resize: 'none' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Navigate home: <Link to="/">Return to StudyHub</Link>
        </p>
      </div>
    </div>
  );
}
