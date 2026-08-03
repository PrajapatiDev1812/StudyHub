import React, { useState } from 'react';

export default function AIConfiguration() {
  const [config, setConfig] = useState({
    mode: 'academic',
    knowledge_priority: 'material_first',
    capabilities: {
      answer_academic: true,
      explain_concepts: true,
      summarize: true,
      quizzes: true,
      creative_writing: false,
      general_conversation: false
    }
  });

  const handleModeChange = (e) => {
    setConfig({ ...config, mode: e.target.value });
  };

  const handleKnowledgePriorityChange = (e) => {
    setConfig({ ...config, knowledge_priority: e.target.value });
  };

  const toggleCapability = (key) => {
    setConfig({
      ...config,
      capabilities: {
        ...config.capabilities,
        [key]: !config.capabilities[key]
      }
    });
  };

  const handleSave = () => {
    // API call to save config
    console.log('Saving config', config);
    alert('Configuration saved successfully!');
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '24px', fontWeight: 'bold' }}>AI System Configuration</h2>
      
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#ccc' }}>System Mode</h3>
        <select 
          value={config.mode} 
          onChange={handleModeChange}
          style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}
        >
          <option value="general">General Assistant Mode</option>
          <option value="academic">Academic Assistant Mode (Default)</option>
          <option value="strict">Strict University Mode</option>
          <option value="research">Research Mode</option>
        </select>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#ccc' }}>Knowledge Mode</h3>
        <select 
          value={config.knowledge_priority} 
          onChange={handleKnowledgePriorityChange}
          style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}
        >
          <option value="material_only">Material Only</option>
          <option value="material_first">University Material First + Global Knowledge (Default)</option>
          <option value="global_first">Global Knowledge Enabled</option>
        </select>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#ccc' }}>Capabilities Control</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Object.entries(config.capabilities).map(([key, enabled]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid #444' }}>
              <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
              <button 
                onClick={() => toggleCapability(key)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: enabled ? '#10B981' : '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSave}
        style={{ padding: '12px 32px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
      >
        Save Configuration
      </button>
    </div>
  );
}
