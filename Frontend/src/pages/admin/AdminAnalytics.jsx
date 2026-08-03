import { BarChart3, TrendingUp, PieChart, Layers } from 'lucide-react';

const COMING_SOON_FEATURES = [
  { icon: TrendingUp, label: 'Student Engagement' },
  { icon: BarChart3,  label: 'Course Completion' },
  { icon: PieChart,   label: 'Material Usage' },
  { icon: Layers,     label: 'Learning Trends' },
];

export default function AdminAnalytics() {
  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto', paddingTop: 16 }}>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Deep insights into student performance and course engagement.</p>
      </div>

      <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--radius)',
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', boxShadow: 'var(--accent-glow)',
        }}>
          <BarChart3 size={32} color="#fff" />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
          Coming Soon
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 400, margin: '0 auto 36px' }}>
          The Analytics panel is under development. Here's what's planned:
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, textAlign: 'left',
        }}>
          {COMING_SOON_FEATURES.map(({ icon: Icon, label }) => ( // eslint-disable-line no-unused-vars
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <Icon size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
