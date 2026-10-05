import { useNavigate } from 'react-router-dom';
import { Bot, Crosshair, Search, BarChart2, BookOpen, ClipboardList } from 'lucide-react';

const ACTIONS = [
  { icon: Bot,         label: 'Ask AI Tutor',     path: '/student/ai-chat',     accent: true  },
  { icon: Crosshair,   label: 'Focus Mode',        path: '/student/focus',       accent: false },
  { icon: Search,      label: 'Browse Courses',    path: '/student/courses',     accent: false },
  { icon: ClipboardList,label:'My Tests',           path: '/student/tests',       accent: false },
  { icon: BarChart2,   label: 'Analytics',         path: '/student/analytics',   accent: false },
  { icon: BookOpen,    label: 'My Materials',      path: '/student/my-materials',accent: false },
];

export default function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <div className="dash-widget quick-actions-widget">
      <div className="widget-header">
        <span className="widget-label">⚡ Quick Actions</span>
      </div>
      <div className="qa-grid">
        {ACTIONS.map(({ icon: Icon, label, path, accent }) => ( // eslint-disable-line no-unused-vars
          <button
            key={path}
            className={`qa-btn ${accent ? 'qa-btn-accent' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
