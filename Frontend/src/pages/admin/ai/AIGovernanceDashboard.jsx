import React, { useState } from 'react';
import AIConfiguration from './components/AIConfiguration';
import SafetyPolicies from './components/SafetyPolicies';
import PromptManagement from './components/PromptManagement';
import AIAnalytics from './components/AIAnalytics';

export default function AIGovernanceDashboard() {
  const [activeTab, setActiveTab] = useState('config');

  const tabs = [
    { id: 'config', label: 'AI Configuration' },
    { id: 'policies', label: 'Safety Policies' },
    { id: 'prompts', label: 'Prompt Management' },
    { id: 'analytics', label: 'AI Analytics & Logs' },
  ];

  return (
    <div className="ai-governance-dashboard" style={{ padding: '24px', color: '#fff', backgroundColor: '#111', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '24px', fontWeight: 'bold' }}>AI Governance & Safety Management</h1>
      
      <div className="tabs" style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid #333' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#4F46E5' : '#888',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" style={{ backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
        {activeTab === 'config' && <AIConfiguration />}
        {activeTab === 'policies' && <SafetyPolicies />}
        {activeTab === 'prompts' && <PromptManagement />}
        {activeTab === 'analytics' && <AIAnalytics />}
      </div>
    </div>
  );
}
