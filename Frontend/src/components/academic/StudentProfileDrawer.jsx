import React, { useState } from 'react';
import { X, User, CheckCircle2, FileText, Award, Activity, Sparkles, Clock, AlertTriangle } from 'lucide-react';

export default function StudentProfileDrawer({ isOpen, onClose, studentData, loading }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, attendance, assignments, tests, progress, ai-summary

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={drawerStyle}
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={avatarCircleStyle}>
              {studentData?.student?.name ? studentData.student.name[0].toUpperCase() : 'S'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {studentData?.student?.name || 'Loading Student...'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Roll: {studentData?.student?.roll_number} • {studentData?.student?.program || 'M.Sc Data Science'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'tests', label: 'Tests', icon: Award },
            { id: 'progress', label: 'Progress', icon: Activity },
            { id: 'ai-summary', label: 'AI Summary', icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading student profile...</div>
          ) : !studentData ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No student details found.</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
                    <DetailBox label="Attendance %" value={`${studentData.metrics.attendance_percentage}%`} />
                    <DetailBox label="Assignment %" value={`${studentData.metrics.assignment_percentage}%`} />
                    <DetailBox label="Test Average" value={`${studentData.metrics.test_average}%`} />
                    <DetailBox label="Risk Score" value={`${studentData.metrics.risk_score}% (${studentData.metrics.risk_level})`} />
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600 }}>Risk Breakdown & Factors</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Calculated using weighted multi-factor formula (Attendance 30%, Assignments 25%, Tests 25%, Topics 10%, Activity 10%). Status is currently <strong>{studentData.metrics.risk_level} Risk</strong>.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem' }}>Attendance History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studentData.attendance_history?.map((rec, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 6, fontSize: '0.85rem' }}>
                        <span>{rec.date} — <strong>{rec.subject}</strong></span>
                        <span style={{ fontWeight: 600, color: rec.status === 'Present' ? '#10B981' : '#EF4444' }}>{rec.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem' }}>Assignment Records</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studentData.assignment_history?.map((assg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 6, fontSize: '0.85rem' }}>
                        <span>{assg.title}</span>
                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{assg.marks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'tests' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem' }}>Test Performance</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studentData.test_history?.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 6, fontSize: '0.85rem' }}>
                        <span>{t.title}</span>
                        <span style={{ fontWeight: 600, color: '#10B981' }}>{t.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem' }}>Topic & Material Completion</h4>
                  <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {studentData.metrics.topic_progress}%
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overall Course Curriculum Completion</span>
                  </div>
                </div>
              )}

              {activeTab === 'ai-summary' && (
                <div>
                  <div style={{ padding: 16, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                      <Sparkles size={16} /> AI Academic Advisor Note
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                      {studentData.ai_summary}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'flex-end',
};

const drawerStyle = {
  width: '100%',
  maxWidth: 540,
  height: '100%',
  background: 'var(--bg-card, #1e1e2e)',
  color: 'var(--text-primary)',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
};

const avatarCircleStyle = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  background: 'var(--accent-gradient)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 700,
  fontSize: '1.1rem',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: 4,
};
