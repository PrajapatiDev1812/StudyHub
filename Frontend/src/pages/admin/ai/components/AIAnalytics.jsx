import React from 'react';

export default function AIAnalytics() {
  const stats = [
    { label: 'Total AI Requests', value: '14,231', color: '#4F46E5' },
    { label: 'Blocked Requests (Safety)', value: '342', color: '#EF4444' },
    { label: 'Est. Total Cost', value: '$124.50', color: '#10B981' },
    { label: 'Active Users', value: '891', color: '#F59E0B' }
  ];

  const recentLogs = [
    { id: '1', user: 'student123', status: 'Success', latency: '1.2s', cost: '$0.0012' },
    { id: '2', user: 'student456', status: 'Blocked (Safety)', latency: '0.4s', cost: '$0.0000' },
    { id: '3', user: 'teacher01', status: 'Success', latency: '2.5s', cost: '$0.0045' },
    { id: '4', user: 'student999', status: 'Blocked (Jailbreak)', latency: '0.1s', cost: '$0.0000' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>AI Analytics & Audit Logs</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ padding: '24px', backgroundColor: '#222', borderRadius: '12px', border: `1px solid #333`, borderTop: `4px solid ${stat.color}` }}>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#222', borderRadius: '12px', border: '1px solid #333', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: '#ccc' }}>Recent Request Logs</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ padding: '12px 8px', color: '#888' }}>User</th>
                <th style={{ padding: '12px 8px', color: '#888' }}>Status</th>
                <th style={{ padding: '12px 8px', color: '#888' }}>Latency</th>
                <th style={{ padding: '12px 8px', color: '#888' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px 8px' }}>{log.user}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ color: log.status.includes('Blocked') ? '#EF4444' : '#10B981' }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{log.latency}</td>
                  <td style={{ padding: '12px 8px' }}>{log.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ marginTop: '16px', padding: '8px 16px', background: 'none', border: '1px solid #444', color: '#ccc', borderRadius: '6px', cursor: 'pointer', width: '100%' }}>
            View Full Audit Logs
          </button>
        </div>

        <div style={{ backgroundColor: '#222', borderRadius: '12px', border: '1px solid #333', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: '#ccc' }}>Safety Violations by Type</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}>
              <span>Adult Content</span>
              <span style={{ color: '#EF4444', fontWeight: 'bold' }}>145</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}>
              <span>Jailbreak Attempts</span>
              <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>98</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}>
              <span>Non-Academic</span>
              <span style={{ color: '#ccc', fontWeight: 'bold' }}>67</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
              <span>Violence/Harm</span>
              <span style={{ color: '#EF4444', fontWeight: 'bold' }}>32</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
