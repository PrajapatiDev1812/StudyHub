import React from 'react';
import { Award, CheckCircle2, XCircle, AlertTriangle, TrendingDown, HelpCircle } from 'lucide-react';

export default function TestsModule({ data }) {
  const testsList = data?.tests || [];
  const topicWeakness = data?.topic_weakness || [];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Examinations & Assessment Analytics
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Review test attempts, pass/fail ratios, and topic weakness patterns
        </span>
      </div>

      {/* Tests Performance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
        {testsList.map((t) => (
          <div key={t.id} className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {t.title}
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.date}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 14 }}>
              <MetricTile label="Average Score" value={`${t.avg_score}%`} color="var(--accent-primary)" />
              <MetricTile label="Pass Rate" value={`${t.pass_percentage}%`} color="#10B981" />
              <MetricTile label="Highest Score" value={`${t.highest_score}%`} color="#10B981" />
              <MetricTile label="Lowest Score" value={`${t.lowest_score}%`} color="#EF4444" />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Attempts: <strong>{t.total_attempts}</strong></span>
              <span>Passing Cutoff: <strong>50%</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Question Analysis & Topic Weakness */}
      <div className="glass-card" style={{ padding: 22 }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.02rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: '#F59E0B' }}>
          <TrendingDown size={18} /> Topic-Wise Weakness & Correctness Analysis
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topicWeakness.map((tw, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HelpCircle size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tw.topic}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Correctness:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: tw.avg_correctness < 70 ? '#EF4444' : '#F59E0B' }}>
                  {tw.avg_correctness}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, color }) {
  return (
    <div style={{ padding: 10, borderRadius: 6, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: color, marginTop: 2 }}>{value}</div>
    </div>
  );
}
