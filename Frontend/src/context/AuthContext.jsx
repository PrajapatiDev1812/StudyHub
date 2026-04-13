import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a token and fetch the profile
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setUser(res.data);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    
    // If 2FA is required, do NOT set tokens or fetch profile yet.
    // Return early so the Login component can advance to the OTP step.
    if (res.data.requires_2fa) {
      return res.data;
    }

    // Normal JWT login (e.g., first login before 2FA setup).
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    await fetchProfile();
    return res.data;
  };

  const verifyOTP = async (tempToken, otp) => {
    const res = await api.post('/auth/verify-otp/', { temp_token: tempToken, otp });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    await fetchProfile();
    return res.data;
  };
  const register = async (data) => {
    const res = await api.post('/auth/register/', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOTP, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
