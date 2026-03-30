import { useEffect, useState } from 'react';
import api from '../../services/api';
import './Dashboard.css';

export default function TotalContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/my-total-content/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results;
        setItems(data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Total Content Available</h1>
        <p>All study materials across your enrolled courses.</p>
      </div>

      <div className="glass-card">
        {loading ? (
           <div style={{ padding: 40, textAlign: 'center' }}>
             <div className="spinner" />
           </div>
        ) : items.length === 0 ? (
          <p className="text-muted" style={{ padding: 20 }}>No content available yet.</p>
        ) : (
          <div className="activity-list" style={{ padding: 20 }}>
            {items.map((item, i) => (
              <div key={i} className="activity-item">
                <span className="activity-icon">📄</span>
                <div>
                  <span className="activity-title">{item.title}</span>
                  <span className="activity-time">Type: {item.content_type?.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
