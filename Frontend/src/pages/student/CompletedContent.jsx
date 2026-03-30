import { useEffect, useState } from 'react';
import api from '../../services/api';
import './Dashboard.css';

export default function CompletedContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/my-completed-content/')
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
        <h1>Completed Content</h1>
        <p>A timeline of all the study materials you have finished.</p>
      </div>

      <div className="glass-card">
        {loading ? (
           <div style={{ padding: 40, textAlign: 'center' }}>
             <div className="spinner" />
           </div>
        ) : items.length === 0 ? (
          <p className="text-muted" style={{ padding: 20 }}>No completed content found.</p>
        ) : (
          <div className="activity-list" style={{ padding: 20 }}>
            {items.map((item, i) => (
              <div key={i} className="activity-item">
                <span className="activity-icon">✅</span>
                <div>
                  <span className="activity-title">{item.content_title}</span>
                  <span className="activity-time">{new Date(item.completed_at).toLocaleString('en-US')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
