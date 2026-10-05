import React, { useState } from 'react';

export default function SafetyPolicies() {
  const [policies, setPolicies] = useState([
    { id: 1, category: 'Adult / Explicit Content', severity: 'High', action: 'block' },
    { id: 2, category: 'Non-Academic Requests', severity: 'Low', action: 'warn' },
    { id: 3, category: 'Sensitive Academic Topics', severity: 'Medium', action: 'allow_context' },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Safety Policies Management</h2>
        <button style={{ padding: '8px 16px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          + Add Policy
        </button>
      </div>

      <div style={{ backgroundColor: '#222', borderRadius: '8px', border: '1px solid #444', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', borderBottom: '1px solid #444' }}>
              <th style={{ padding: '16px', color: '#ccc' }}>Category</th>
              <th style={{ padding: '16px', color: '#ccc' }}>Severity</th>
              <th style={{ padding: '16px', color: '#ccc' }}>Action</th>
              <th style={{ padding: '16px', color: '#ccc', textAlign: 'right' }}>Controls</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(policy => (
              <tr key={policy.id} style={{ borderBottom: '1px solid #444' }}>
                <td style={{ padding: '16px' }}>{policy.category}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    backgroundColor: policy.severity === 'High' ? '#ef444433' : policy.severity === 'Medium' ? '#f59e0b33' : '#10b98133',
                    color: policy.severity === 'High' ? '#ef4444' : policy.severity === 'Medium' ? '#f59e0b' : '#10b981',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {policy.severity}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <select 
                    value={policy.action}
                    onChange={(e) => {
                      const newPolicies = policies.map(p => p.id === policy.id ? { ...p, action: e.target.value } : p);
                      setPolicies(newPolicies);
                    }}
                    style={{ padding: '8px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                  >
                    <option value="allow">Allow</option>
                    <option value="allow_context">Allow With Context</option>
                    <option value="warn">Warn</option>
                    <option value="block">Block</option>
                  </select>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
