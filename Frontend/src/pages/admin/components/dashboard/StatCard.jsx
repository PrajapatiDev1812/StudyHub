/**
 * StatCard.jsx
 * Admin/Teacher Dashboard — Reusable Stat Card
 *
 * Props:
 *   icon         — Lucide icon component
 *   title        — card label
 *   value        — primary metric display string
 *   trend        — numeric change (positive = up, negative = down, 0 = neutral)
 *   trendLabel   — text suffix for trend (e.g. "this month")
 *   iconColor    — CSS class suffix: violet | blue | teal | green | amber | rose
 *   animDelay    — stagger delay class suffix: 1-6
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  title,
  value,
  trend = 0,
  trendLabel = 'this month',
  iconColor = 'violet',
  animDelay = 1,
}) {
  const trendPositive = trend > 0;
  const trendNegative = trend < 0;
  const trendNeutral  = trend === 0;
  const trendClass    = trendPositive ? 'up' : trendNegative ? 'down' : '';
  const trendAbs      = Math.abs(trend);

  return (
    <div className={`admin-stat-card admin-anim-up admin-anim-d${animDelay}`}>
      <div className="admin-stat-top">
        <div className={`admin-stat-icon ${iconColor}`}>
          {Icon && <Icon size={20} />}
        </div>

        {/* Trend badge */}
        {!trendNeutral && (
          <div className={`admin-stat-trend ${trendClass}`}>
            {trendPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{trendAbs > 0 ? `+${trendAbs}` : trendAbs}</span>
          </div>
        )}
        {trendNeutral && trend !== undefined && (
          <div className="admin-stat-trend" style={{ opacity: 0.4 }}>
            <Minus size={10} />
          </div>
        )}
      </div>

      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{title}</div>

      {trendLabel && !trendNeutral && (
        <div className="admin-stat-sub">
          {trendPositive ? '↑' : '↓'} vs {trendLabel}
        </div>
      )}
    </div>
  );
}
