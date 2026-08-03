import React from 'react';
import { Users, CheckCircle2, Award, AlertTriangle, Clock, Activity, FileText } from 'lucide-react';

export default function OverviewModule({ data, isIndividualMode }) {
  if (!data) return null;

  if (isIndividualMode && data.student) {
    const { student, metrics, recent_activity } = data;
    return (
      <div className="fade-in">
        {/* Individual Student Header Banner */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 700, color: '#fff', boxShadow: 'var(--accent-glow)'
              }}>
                {student.name ? student.name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {student.name}
                </h2>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Roll: <strong>{student.roll_number}</strong></span>
                  <span>•</span>
                  <span>{student.email}</span>
                  <span>•</span>
                  <span>M.Sc Data Science (Year 2)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`risk-badge risk-${metrics.risk_level?.toLowerCase() || 'low'}`} style={riskBadgeStyle}>
                Risk Level: {metrics.risk_level || 'Low'} ({metrics.risk_score}%)
              </span>
            </div>
          </div>
        </div>

        {/* Individual KPI Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <KpiCard icon={CheckCircle2} label="Attendance Rate" value={`${metrics.attendance_percentage}%`} color="#10B981" />
          <KpiCard icon={FileText} label="Assignment Completion" value={`${metrics.assignment_percentage}%`} color="#6366F1" />
          <KpiCard icon={Award} label="Test Average" value={`${metrics.test_average}%`} color="#8B5CF6" />
          <KpiCard icon={Activity} label="LMS Activity Score" value={`${metrics.lms_activity_score}%`} color="#EC4899" />
        </div>

        {/* Student Recent Activity Timeline */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="var(--accent-primary)" />
            Student Academic Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recent_activity?.map((act) => (
              <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{act.text}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Class Mode Overview
  const summary = data.summary || {};
  return (
    <div className="fade-in">
      {/* Class Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard icon={Users} label="Total Enrolled Students" value={summary.total_students || 42} color="#3B82F6" />
        <KpiCard icon={CheckCircle2} label="Class Avg Attendance" value={`${summary.average_attendance || 86.4}%`} color="#10B981" />
        <KpiCard icon={FileText} label="Assignment Completion" value={`${summary.assignment_completion || 89.2}%`} color="#6366F1" />
        <KpiCard icon={Award} label="Class Test Average" value={`${summary.average_test_score || 81.5}%`} color="#8B5CF6" />
        <KpiCard icon={Clock} label="Pending Evaluations" value={summary.pending_evaluations || 8} color="#F59E0B" />
        <KpiCard icon={AlertTriangle} label="High Risk Students" value={summary.high_risk_students || 4} color="#EF4444" alert />
      </div>

      {/* Class Recent Activity Stream */}
      <div className="glass-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--accent-primary)" />
            Real-Time Academic Activity Stream
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live updates</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.recent_activity?.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 8,
                background: act.type === 'alert' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-glass)',
                border: act.type === 'alert' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: act.type === 'alert' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {act.type === 'attendance' && <CheckCircle2 size={16} color="#10B981" />}
                  {act.type === 'assignment' && <FileText size={16} color="#6366F1" />}
                  {act.type === 'quiz' && <Award size={16} color="#8B5CF6" />}
                  {act.type === 'alert' && <AlertTriangle size={16} color="#EF4444" />}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {act.text}
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {act.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, alert }) { // eslint-disable-line no-unused-vars
  return (
    <div className="glass-card" style={{
      padding: 18,
      border: alert ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
      background: alert ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), transparent)' : 'var(--bg-glass)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

const riskBadgeStyle = {
  padding: '6px 14px',
  borderRadius: 20,
  fontSize: '0.82rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
};
