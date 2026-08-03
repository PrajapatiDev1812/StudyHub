import { useState } from 'react';
import { 
  Server, Cpu, Shield, Key, 
  Activity, ListFilter, Sliders 
} from 'lucide-react';

import './AIManagement.css';
import AIProviderManager from './AIProviderManager';
import AIModelManager from './AIModelManager';
import AIQuotaManager from './AIQuotaManager';
import AIFeatureFlagMatrix from './AIFeatureFlagMatrix';
import AIUsageDashboard from './AIUsageDashboard';
import AIRequestLogViewer from './AIRequestLogViewer';
import AIAuditLogViewer from './AIAuditLogViewer';

const SUB_TABS = [
  { id: 'dashboard', label: 'Analytics Dashboard', icon: Activity },
  { id: 'providers', label: 'AI Providers', icon: Server },
  { id: 'models', label: 'AI Models', icon: Cpu },
  { id: 'quotas', label: 'Quota Policies', icon: Shield },
  { id: 'features', label: 'Feature Flags', icon: Sliders },
  { id: 'logs', label: 'Request Logs', icon: ListFilter },
  { id: 'audit', label: 'Audit Trail', icon: Key },
];

export default function AIManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AIUsageDashboard />;
      case 'providers': return <AIProviderManager />;
      case 'models': return <AIModelManager />;
      case 'quotas': return <AIQuotaManager />;
      case 'features': return <AIFeatureFlagMatrix />;
      case 'logs': return <AIRequestLogViewer />;
      case 'audit': return <AIAuditLogViewer />;
      default: return <AIUsageDashboard />;
    }
  };

  return (
    <div className="ai-management-container">
      <div className="ai-management-nav">
        {SUB_TABS.map(({ id, label, icon: Icon }) => ( // eslint-disable-line no-unused-vars
          <button
            key={id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      
      <div className="ai-management-content">
        {renderContent()}
      </div>
    </div>
  );
}
