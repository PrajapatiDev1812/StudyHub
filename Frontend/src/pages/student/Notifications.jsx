import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications/')
      .then(res => setNotifications(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Your alerts and updates</p>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>🔔 No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => (
            <div key={n.id} className={`glass-card ${!n.is_read ? 'notification-unread' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: n.is_read ? 400 : 600 }}>{n.message}</p>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</span>
              </div>
              {!n.is_read && (
                <button className="btn btn-secondary btn-sm" onClick={() => markRead(n.id)}>Mark Read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
