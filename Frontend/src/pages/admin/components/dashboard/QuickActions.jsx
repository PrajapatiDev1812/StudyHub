/**
 * QuickActions.jsx
 * Admin/Teacher Dashboard — Quick Action Buttons Panel
 *
 * Provides one-click access to common teacher workflows.
 * "Create Course" is styled as the primary action.
 * Actions without dedicated pages use navigate to closest available route.
 */

import { useNavigate } from 'react-router-dom';
import { BookPlus, Layers, Upload, Zap, Megaphone } from 'lucide-react';

const ACTIONS = [
  {
    id: 'create-course',
    icon: BookPlus,
    label: 'Create Course',
    path: '/admin/courses',
    primary: true,
  },
  {
    id: 'add-subject',
    icon: Layers,
    label: 'Add Subject',
    path: '/admin/courses',
    primary: false,
  },
  {
    id: 'upload-material',
    icon: Upload,
    label: 'Upload Material',
    path: '/admin/courses',
    primary: false,
  },
  {
    id: 'generate-quiz',
    icon: Zap,
    label: 'Generate Quiz',
    path: '/admin/tests',
    primary: false,
  },
  {
    id: 'announcement',
    icon: Megaphone,
    label: 'Create Announcement',
    path: '/admin/dashboard',  // placeholder — no dedicated route yet
    primary: false,
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="admin-widget admin-anim-up">
      <div className="admin-section-header">
        <div className="admin-section-title">⚡ Quick Actions</div>
      </div>

      <div className="admin-qa-grid">
        {/* eslint-disable-next-line no-unused-vars */}
        {ACTIONS.map(({ id, icon: Icon, label, path, primary }) => (
          <button
            key={id}
            id={`admin-qa-${id}`}
            className={`admin-qa-btn${primary ? ' admin-qa-primary' : ''}`}
            onClick={() => navigate(path)}
            title={label}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
