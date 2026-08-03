import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Award, CheckCircle, Flame } from 'lucide-react';

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#EF4444'];

export default function AnalyticsModule({ data, isIndividualMode }) {
  if (!data) return null;

  const attendanceTrend = data.attendance_trend || [];
  const assignmentComp = data.assignment_completion || [];
  const testDist = data.test_distribution || [];
  const subjectComp = data.subject_comparison || [];
  const weakTopics = data.weak_topics || [];
  const strongTopics = data.strong_topics || [];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {isIndividualMode ? 'Individual Student Academic Intelligence' : 'Class-Wide Academic Intelligence & Analytics'}
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Real-time dynamic visualization engine reacting to global filter selection
        </span>
      </div>

      {/* Grid Row 1: Attendance Trend & Assignment Completion */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Attendance Trend Chart */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={chartTitleStyle}><TrendingUp size={16} color="#10B981" /> Attendance Trend Over Time</h4>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={attendanceTrend}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="week" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis domain={[50, 100]} stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assignment Completion Chart */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={chartTitleStyle}><BarChart3 size={16} color="var(--accent-primary)" /> Assignment Completion Rate</h4>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={assignmentComp}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="completed" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Test Grade Distribution & Subject Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Test Score Distribution */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={chartTitleStyle}><Award size={16} color="#8B5CF6" /> Test Grade Distribution</h4>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={testDist} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={80} label>
                  {testDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance Comparison */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={chartTitleStyle}><Flame size={16} color="#EC4899" /> Cross-Subject Performance</h4>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={subjectComp} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--text-secondary)" fontSize={12} />
                <YAxis type="category" dataKey="subject" stroke="var(--text-secondary)" fontSize={11} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg_score" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strong & Weak Topics Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Strong Topics */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={16} /> Top Mastered Curriculum Topics
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {strongTopics.map((st, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.08)', fontSize: '0.85rem' }}>
                <span>{st.topic}</span>
                <strong style={{ color: '#10B981' }}>{st.avg_correctness}%</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flame size={16} /> Focus Areas & Weak Topics
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weakTopics.map((wt, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.08)', fontSize: '0.85rem' }}>
                <span>{wt.topic}</span>
                <strong style={{ color: '#EF4444' }}>{wt.avg_correctness}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const chartTitleStyle = {
  margin: '0 0 14px 0',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const tooltipStyle = {
  background: 'var(--bg-card, #1e1e2e)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
};
