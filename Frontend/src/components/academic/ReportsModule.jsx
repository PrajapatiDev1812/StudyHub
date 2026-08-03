import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { academicApi } from '../../services/academicApi';

export default function ReportsModule({ filters, studentsData }) {
  const [reportScope, setReportScope] = useState('class'); // class, subject, student, semester, program
  const [generating, setGenerating] = useState(false);
  const [, setReportData] = useState(null);

  const studentsList = studentsData?.students || [];

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const data = await academicApi.getReports({ report_type: reportScope, ...filters });
      setReportData(data);
    } catch {
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!studentsList.length) return;
    const headers = ['Roll Number', 'Name', 'Email', 'Attendance %', 'Assignment %', 'Test Avg %', 'Progress %', 'Risk Level'];
    const rows = studentsList.map(s => [
      s.roll_number,
      `"${s.name}"`,
      s.email,
      s.attendance_percentage,
      s.assignment_percentage,
      s.test_average,
      s.progress_percentage,
      s.risk_level
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StudyHub_Academic_Report_${reportScope}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable PDF Export
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Academic Report Generator Engine
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Generate, preview, and export comprehensive academic analytics reports
        </span>
      </div>

      {/* Report Configuration Bar */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Report Scope:</label>
            <select
              value={reportScope}
              onChange={(e) => setReportScope(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              <option value="class">Class Summary Report</option>
              <option value="subject">Subject Performance Report</option>
              <option value="student">Individual Student Progress Report</option>
              <option value="semester">Semester Assessment Report</option>
              <option value="program">Program Accreditation Report</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="admin-action-btn primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FileText size={15} />
              {generating ? 'Generating...' : 'Generate Live Preview'}
            </button>

            <button
              onClick={handleExportCSV}
              className="admin-action-btn secondary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={15} /> Export CSV / Excel
            </button>

            <button
              onClick={handlePrintPDF}
              className="admin-action-btn secondary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Live Table Preview */}
      <div className="glass-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={18} color="var(--accent-primary)" />
            Report Data Preview
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Generated at: {new Date().toLocaleTimeString()}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 14px' }}>Roll Number</th>
                <th style={{ padding: '12px 14px' }}>Student Name</th>
                <th style={{ padding: '12px 14px' }}>Attendance Rate</th>
                <th style={{ padding: '12px 14px' }}>Assignment Rate</th>
                <th style={{ padding: '12px 14px' }}>Test Average</th>
                <th style={{ padding: '12px 14px' }}>Curriculum Progress</th>
                <th style={{ padding: '12px 14px' }}>Risk Status</th>
              </tr>
            </thead>
            <tbody>
              {studentsList.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{s.roll_number}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                  <td style={{ padding: '12px 14px' }}>{s.attendance_percentage}%</td>
                  <td style={{ padding: '12px 14px' }}>{s.assignment_percentage}%</td>
                  <td style={{ padding: '12px 14px' }}>{s.test_average}%</td>
                  <td style={{ padding: '12px 14px' }}>{s.progress_percentage}%</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`risk-badge risk-${s.risk_level.toLowerCase()}`}>
                      {s.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
