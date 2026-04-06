/**
 * FocusTimer.jsx
 * --------------
 * Circular SVG countdown timer that shows remaining time
 * and an animated progress stroke.
 */
import React, { useEffect, useRef } from 'react';

const SIZE = 140;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusTimer({
  totalSeconds,
  remainingSeconds,
  isRunning,
  label = 'Focus',
  color = '#6c63ff',
  breakColor = '#10b981',
}) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="focus-timer-wrap">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={`focus-timer-svg ${isRunning ? 'running' : ''}`}
      >
        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={label === 'Break' ? breakColor : color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {/* Time text */}
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="22"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {formatTime(remainingSeconds)}
        </text>
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize="10"
          fontFamily="Inter, sans-serif"
          letterSpacing="2"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
