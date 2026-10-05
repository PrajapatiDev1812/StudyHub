import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Calendar, Save, Filter } from 'lucide-react';
import { academicApi } from '../../services/academicApi';

export default function AttendanceModule({ data, studentsData, refetch }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const studentsList = studentsData?.students || [];

  const handleStatusChange = (studentId, status) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkMark = (status) => {
    const updated = {};
    studentsList.forEach(s => { updated[s.id] = status; });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMessage(null);
    const records = Object.entries(attendanceState).map(([studentId, status]) => ({
      student_id: Number(studentId),
      date: selectedDate,
      status: status,
    }));

    try {
      const res = await academicApi.markAttendance(records);
      setMessage(res.message || 'Attendance saved successfully!');
      if (refetch) refetch();
    } catch {
      setMessage('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const summary = data?.summary || {
    overall_percentage: 86.4,
    total_conducted: 48,
    present_count: 41,
    absent_count: 4,
    late_count: 2,
    medical_leave_count: 1,
  };

  return (
    <div className="fade-in">
      {/* Attendance Summary Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatTile label="Overall Attendance" value={`${summary.overall_percentage}%`} color="#10B981" />
        <StatTile label="Conducted Sessions" value={summary.total_conducted} color="#3B82F6" />
        <StatTile label="Present Count" value={summary.present_count} color="#10B981" />
        <StatTile label="Absent Count" value={summary.absent_count} color="#EF4444" />
        <StatTile label="Late Count" value={summary.late_count} color="#F59E0B" />
      </div>

      {/* Attendance Marker Tool */}
      <div className="glass-card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="var(--accent-primary)" />
              Session Attendance Marker
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select date & mark statuses for assigned subject</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="admin-action-btn primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {message && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontSize: '0.85rem', fontWeight: 600, marginBottom: 16 }}>
            ✓ {message}
          </div>
        )}

        {/* Quick Bulk Marking Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Bulk Actions:</span>
          <button onClick={() => handleBulkMark('present')} className="admin-action-btn secondary" style={btnSm}>Mark All Present</button>
          <button onClick={() => handleBulkMark('absent')} className="admin-action-btn secondary" style={btnSm}>Mark All Absent</button>
          <button onClick={() => handleBulkMark('late')} className="admin-action-btn secondary" style={btnSm}>Mark All Late</button>
        </div>

        {/* Attendance Student List Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Roll No</th>
                <th style={{ padding: '12px 14px', textAlign: 'left' }}>Student Name</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Present</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Absent</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Late</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Medical</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Excused</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.map((st) => {
                const currentStatus = attendanceState[st.id] || 'present';
                return (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{st.roll_number}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{st.name}</td>

                    {/* Present */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="radio"
                        name={`att_${st.id}`}
                        checked={currentStatus === 'present'}
                        onChange={() => handleStatusChange(st.id, 'present')}
                      />
                    </td>

                    {/* Absent */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="radio"
                        name={`att_${st.id}`}
                        checked={currentStatus === 'absent'}
                        onChange={() => handleStatusChange(st.id, 'absent')}
                      />
                    </td>

                    {/* Late */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="radio"
                        name={`att_${st.id}`}
                        checked={currentStatus === 'late'}
                        onChange={() => handleStatusChange(st.id, 'late')}
                      />
                    </td>

                    {/* Medical Leave */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="radio"
                        name={`att_${st.id}`}
                        checked={currentStatus === 'medical_leave'}
                        onChange={() => handleStatusChange(st.id, 'medical_leave')}
                      />
                    </td>

                    {/* Excused */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="radio"
                        name={`att_${st.id}`}
                        checked={currentStatus === 'excused'}
                        onChange={() => handleStatusChange(st.id, 'excused')}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Attendance Alerts (<75%) */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: '0.98rem', fontWeight: 600, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} /> Low Attendance Alerts (&lt; 75% Threshold)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {data?.alerts?.map((al, idx) => (
            <div key={idx} style={{ padding: 14, borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{al.student_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: 4 }}>
                Attendance Rate: <strong>{al.attendance}</strong> ({al.risk})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const btnSm = { padding: '4px 10px', fontSize: '0.75rem' };
