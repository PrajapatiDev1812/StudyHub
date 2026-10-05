import { NavLink, Outlet } from 'react-router-dom';
import { Trophy, Award, ScrollText, Users, TrendingUp, ShieldAlert, BarChart } from 'lucide-react';
import '../AdminLayout.css';
import './AchievementsLayout.css';

export default function AchievementsLayout() {
  const tabs = [
    { path: '/admin/achievements', icon: Trophy, label: 'Overview', end: true },
    { path: '/admin/achievements/badges', icon: Award, label: 'Badges' },
    { path: '/admin/achievements/rules', icon: ScrollText, label: 'Rules Builder' },
    { path: '/admin/achievements/students', icon: Users, label: 'Student Progress' },
    { path: '/admin/achievements/xp', icon: TrendingUp, label: 'XP & Levels' },
    { path: '/admin/achievements/analytics', icon: BarChart, label: 'Analytics' },
    { path: '/admin/achievements/audit', icon: ShieldAlert, label: 'Audit Logs' },
  ];

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1 className="achievements-title">Achievement System</h1>
        <p className="achievements-subtitle">Manage badges, configure gamification rules, and analyze student engagement.</p>
      </div>

      {/* Sub-navigation */}
      <div className="achievements-tabs">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `achievements-tab-link ${isActive ? 'active' : ''}`
            }
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Render sub-route components */}
      <div className="achievements-content">
        <Outlet />
      </div>
    </div>
  );
}
