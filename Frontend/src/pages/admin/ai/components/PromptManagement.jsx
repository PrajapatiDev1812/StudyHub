import React, { useState } from 'react';

export default function PromptManagement() {
  const [promptText, setPromptText] = useState(
    "You are StudyHub Academic Assistant.\n\nYour purpose is to support students and teachers with academic learning.\n\nRules:\n1. Prioritize university-approved course materials.\n2. Answer only educational queries.\n3. Do not generate explicit or inappropriate content.\n4. Allow sensitive topics only when they are academically relevant.\n5. Maintain professional academic communication.\n6. Follow university AI policies."
  );

  const [version, setVersion] = useState(3);

  const handleSave = () => {
    console.log('Saved Prompt', promptText);
    setVersion(v => v + 1);
    alert('New Prompt Version Saved: v' + (version + 1));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>System Prompt Management</h2>
        <span style={{ padding: '4px 12px', backgroundColor: '#10B98122', color: '#10B981', borderRadius: '16px', fontSize: '14px' }}>
          Current Version: v{version}
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>Active System Prompt</label>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={12}
          style={{ 
            width: '100%', 
            padding: '16px', 
            backgroundColor: '#111', 
            color: '#fff', 
            border: '1px solid #444', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
          Changes to this prompt will take effect immediately for all new AI requests.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          onClick={handleSave}
          style={{ padding: '12px 24px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Save New Version
        </button>
        <button 
          style={{ padding: '12px 24px', backgroundColor: 'transparent', color: '#ccc', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer' }}
        >
          View Version History
        </button>
      </div>
    </div>
  );
}
