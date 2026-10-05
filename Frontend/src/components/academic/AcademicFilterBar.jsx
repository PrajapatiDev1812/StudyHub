import React from 'react';
import { Filter, RotateCcw, User, Calendar, BookOpen, Layers, Award } from 'lucide-react';

export default function AcademicFilterBar({ filters, onFilterChange, onReset, filterOptions }) {
  const sessions = filterOptions?.sessions || [];
  const programs = filterOptions?.programs || [];
  const years = filterOptions?.years || [];
  const semesters = filterOptions?.semesters || [];
  const subjects = filterOptions?.subjects || [];
  const students = filterOptions?.students || [];

  return (
    <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Filter size={15} color="#fff" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Global Academic Filter Bar
          </h3>
          <span style={{
            fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12,
            background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', fontWeight: 600
          }}>
            Single Source of Truth
          </span>
        </div>

        <button
          onClick={onReset}
          className="admin-action-btn secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
          title="Reset all filters to default"
        >
          <RotateCcw size={13} />
          Reset Filters
        </button>
      </div>

      {/* Cascading Filter Controls Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {/* Session */}
        <div>
          <label style={labelStyle}><Calendar size={12} /> Session</label>
          <select
            value={filters.session}
            onChange={(e) => onFilterChange('session', e.target.value)}
            style={selectStyle}
          >
            {sessions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        {/* Program */}
        <div>
          <label style={labelStyle}><BookOpen size={12} /> Program</label>
          <select
            value={filters.program}
            onChange={(e) => onFilterChange('program', e.target.value)}
            style={selectStyle}
          >
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Year */}
        <div>
          <label style={labelStyle}><Layers size={12} /> Year</label>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange('year', e.target.value)}
            style={selectStyle}
          >
            {years.map(y => <option key={y.id} value={y.year_number}>{y.name}</option>)}
          </select>
        </div>

        {/* Semester */}
        <div>
          <label style={labelStyle}>Semester</label>
          <select
            value={filters.semester}
            onChange={(e) => onFilterChange('semester', e.target.value)}
            style={selectStyle}
          >
            {semesters.map(sem => <option key={sem.id} value={sem.semester_number}>{sem.name}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label style={labelStyle}><Award size={12} /> Subject</label>
          <select
            value={filters.subject}
            onChange={(e) => onFilterChange('subject', e.target.value)}
            style={selectStyle}
          >
            {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.title}</option>)}
          </select>
        </div>

        {/* Student Selector */}
        <div>
          <label style={{ ...labelStyle, color: filters.student !== 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            <User size={12} /> Student Scope
          </label>
          <select
            value={filters.student}
            onChange={(e) => onFilterChange('student', e.target.value)}
            style={{
              ...selectStyle,
              border: filters.student !== 'all' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: filters.student !== 'all' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass)',
            }}
          >
            <option value="all">⚡ All Students (Class Mode)</option>
            {students.map(st => (
              <option key={st.id} value={st.id}>
                👤 {st.name} ({st.roll_number || st.username})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label style={labelStyle}>Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            style={selectStyle}
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="full_semester">Full Semester</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div>
          <label style={labelStyle}>Risk Level</label>
          <select
            value={filters.riskLevel}
            onChange={(e) => onFilterChange('riskLevel', e.target.value)}
            style={selectStyle}
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">🟢 Low Risk</option>
            <option value="Medium">🟡 Medium Risk</option>
            <option value="High">🟠 High Risk</option>
            <option value="Critical">🔴 Critical Risk</option>
          </select>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
};

const selectStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '0.82rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-glass)',
  color: 'var(--text-primary)',
  outline: 'none',
};
