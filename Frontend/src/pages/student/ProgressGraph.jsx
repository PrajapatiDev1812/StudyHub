import { useEffect, useState } from 'react';
import api from '../../services/api';

export const TABS = [
  { label: '7 Days', days: 7 },
  { label: '15 Days', days: 15 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '4 Months', days: 120 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: 'All', days: 0 },
];

/* Pure SVG line graph */
export default function ProgressGraph({ activeTab, setActiveTab, points, loading }) {


  /* ── Chart dimensions ── */
  const W = 800, H = 320;
  const PAD = { top: 24, right: 24, bottom: 50, left: 55 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  /* ── Y-axis: exactly 6 ticks ── */
  const numYTicks = 6;
  const yTicks = [];
  for (let i = 0; i < numYTicks; i++) {
    yTicks.push(i * (100 / (numYTicks - 1)));
  }
  const yScale = (v) => PAD.top + chartH - (v / 100) * chartH;

  /* ── X-axis: 6 physically equi-distant grid lines ── */
  const n = points.length;
  const xScale = (i) => PAD.left + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);

  const numXTicks = 6;
  const xGridLines = [];
  if (n > 0) {
    for (let j = 0; j < numXTicks; j++) {
      const ratio = numXTicks > 1 ? j / (numXTicks - 1) : 0.5;
      const xPos = PAD.left + ratio * chartW;
      const dataIndex = Math.round(ratio * (n - 1));
      xGridLines.push({ xPos, date: points[dataIndex]?.date });
    }
  }

  /* ── Build SVG path ── */
  const linePath = n > 1
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(p.progress).toFixed(1)}`).join(' ')
    : '';

  const areaPath = linePath
    ? `${linePath} L${xScale(n - 1).toFixed(1)},${yScale(0).toFixed(1)} L${xScale(0).toFixed(1)},${yScale(0).toFixed(1)} Z`
    : '';

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="progress-graph-wrapper">
      {/* Timeline Tabs */}
      <div className="graph-tabs">
        {TABS.map(tab => (
          <button
            key={tab.days}
            className={`graph-tab ${activeTab === tab.days ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.days)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="graph-container">
        {loading ? (
          <div className="spinner" style={{ margin: '60px auto' }} />
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="line-chart">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6c63ff" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6c63ff" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines + Y labels (equi-distant) */}
            {yTicks.map(tick => (
              <g key={tick}>
                <line
                  x1={PAD.left} y1={yScale(tick)}
                  x2={W - PAD.right} y2={yScale(tick)}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
                <text
                  x={PAD.left - 10} y={yScale(tick) + 4}
                  textAnchor="end" className="axis-label"
                >
                  {tick}%
                </text>
              </g>
            ))}

            {/* Vertical grid lines + X labels (equi-distant physical spacing) */}
            {xGridLines.map((grid, i) => (
              <g key={i}>
                <line
                  x1={grid.xPos} y1={PAD.top}
                  x2={grid.xPos} y2={PAD.top + chartH}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                />
                <text
                  x={grid.xPos} y={H - 12}
                  textAnchor="middle" className="axis-label"
                >
                  {formatDate(grid.date)}
                </text>
              </g>
            ))}

            {/* Axes */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {/* Area fill */}
            {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

            {/* Line */}
            {linePath && (
              <path
                d={linePath} fill="none"
                stroke="url(#lineGrad)" strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round"
              />
            )}

            {/* No data message */}
            {n === 0 && (
              <text x={W / 2} y={H / 2} textAnchor="middle" className="no-data-text">
                No data for this period
              </text>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
