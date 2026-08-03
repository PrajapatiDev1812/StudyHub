import { useState } from 'react';
import { Sparkles, LayoutDashboard, BotMessageSquare, Settings, Database, FileQuestion, BarChart3, Shield } from 'lucide-react';

import './ai-assistant/AdminAI.css';
import AIOverview from './ai-assistant/AIOverview';
import AIConfiguration from './ai-assistant/AIConfiguration';
import KnowledgeBase from './ai-assistant/KnowledgeBase';
import QuestionGenerator from './ai-assistant/QuestionGenerator';
import AIAnalyticsTab from './ai-assistant/AIAnalyticsTab';
import TeacherAiWorkspace from './ai/TeacherAiWorkspace';
import AIManagement from './ai-assistant/AIManagement';

const AI_TABS = [
  { id: 'overview',     label: 'Dashboard Overview',    icon: LayoutDashboard },
  { id: 'workspace',    label: 'AI Workspace',          icon: BotMessageSquare },
  { id: 'governance',   label: 'AI Governance',         icon: Shield },
  { id: 'config',       label: 'AI Strategy & Config',  icon: Settings },
  { id: 'knowledge',    label: 'Knowledge Base',        icon: Database },
  { id: 'question_gen', label: 'Question Generator',    icon: FileQuestion },
  { id: 'analytics',    label: 'Engagement Analytics',  icon: BarChart3 },
];

export default function AdminAI() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <AIOverview onNavigateTab={(tabId) => setActiveTab(tabId)} />;
      case 'workspace':
        return <TeacherAiWorkspace embedded />;
      case 'governance':
        return <AIManagement />;
      case 'config':
        return <AIConfiguration />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'question_gen':
        return <QuestionGenerator />;
      case 'analytics':
        return <AIAnalyticsTab />;
      default:
        return <AIOverview onNavigateTab={(tabId) => setActiveTab(tabId)} />;
    }
  };

  return (
    <div className="admin-ai-container">
      {/* Header */}
      <div className="ai-page-header">
        <div className="ai-page-header-title">
          <div className="ai-header-icon">
            <Sparkles size={28} color="#fff" />
          </div>
          <div>
            <h1>Academic AI Control Center</h1>
            <p>Provider-agnostic educational AI assistant with multi-tier RAG and verified assessment generation.</p>
          </div>
        </div>
      </div>

      {/* Modern Glass Tab Navigation */}
      <div className="ai-nav-tabs">
        {AI_TABS.map(({ id, label, icon: Icon }) => ( // eslint-disable-line no-unused-vars
          <button
            key={id}
            className={`ai-tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Component */}
      <div style={{ marginTop: activeTab === 'workspace' ? 0 : 8 }}>
        {renderActiveTab()}
      </div>
    </div>
  );
}
