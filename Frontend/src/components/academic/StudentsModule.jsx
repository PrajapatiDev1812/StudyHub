import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, UserCheck, Eye, Download, Mail, ShieldAlert } from 'lucide-react';

export default function StudentsModule({ data, onOpenProfile }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtering & Search
  const filteredStudents = useMemo(() => {
    const studentsList = data?.students || [];
    return studentsList.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [data?.students, searchTerm]);

  // Sorting
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStudents, sortField, sortDir]);

  // Pagination
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage]);

  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="fade-in">
      {/* Top Action & Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by student name, roll number, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-glass)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{sortedStudents.length}</strong> students
          </span>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="fade-in">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {selectedIds.length} Selected
            </span>
            <button className="admin-action-btn secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={14} /> Send Reminders
            </button>
            <button className="admin-action-btn secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Export Selected
            </button>
          </div>
        )}
      </div>

      {/* Datatable */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px', width: 40 }}>
                  <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === paginatedStudents.length} onChange={toggleSelectAll} />
                </th>
                <th style={thStyle} onClick={() => handleSort('name')}>
                  Student Name {sortField === 'name' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th style={thStyle} onClick={() => handleSort('roll_number')}>
                  Roll Number {sortField === 'roll_number' && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th style={thStyle} onClick={() => handleSort('attendance_percentage')}>
                  Attendance %
                </th>
                <th style={thStyle} onClick={() => handleSort('assignment_percentage')}>
                  Assignments %
                </th>
                <th style={thStyle} onClick={() => handleSort('test_average')}>
                  Test Avg
                </th>
                <th style={thStyle} onClick={() => handleSort('progress_percentage')}>
                  Progress
                </th>
                <th style={thStyle} onClick={() => handleSort('risk_level')}>
                  Risk Level
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((st) => (
                <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '14px 16px' }}>
                    <input type="checkbox" checked={selectedIds.includes(st.id)} onChange={() => toggleSelect(st.id)} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#fff', fontSize: '0.85rem'
                      }}>
                        {st.avatar || st.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{st.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{st.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{st.roll_number}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: 600, color: st.attendance_percentage < 75 ? '#EF4444' : '#10B981' }}>
                      {st.attendance_percentage}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{st.assignment_percentage}%</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{st.test_average}%</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                        <div style={{ width: `${st.progress_percentage}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.78rem' }}>{st.progress_percentage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`risk-badge risk-${st.risk_level.toLowerCase()}`}>
                      {st.risk_level} ({st.risk_score}%)
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => onOpenProfile(st.id)}
                      className="admin-action-btn secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={13} /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="admin-action-btn secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="admin-action-btn secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '14px 16px',
  cursor: 'pointer',
  userSelect: 'none',
};
