/**
 * BreakOverlay.jsx
 * ----------------
 * Full-screen calm break overlay with breathing guide animation,
 * rotating motivational quotes, and break timer.
 */
import React, { useState, useEffect } from 'react';
import FocusTimer from './FocusTimer';
import './BreakOverlay.css';

const QUOTES = [
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { text: "Rest is not idleness, and to lie sometimes on the grass under trees on a summer's day is by no means a waste of time.", author: "John Lubbock" },
  { text: "The time to relax is when you don't have time for it.", author: "Sydney J. Harris" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
  { text: "A mind at peace, a mind centered and not focused on harming others, is stronger than any physical force.", author: "Wayne Dyer" },
  { text: "Excellence is not a skill. It is an attitude.", author: "Ralph Marston" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
];

const BREATHING_PHASES = [
  { label: 'Breathe In', duration: 4000, scale: 1.5 },
  { label: 'Hold', duration: 2000, scale: 1.5 },
  { label: 'Breathe Out', duration: 4000, scale: 1.0 },
  { label: 'Hold', duration: 2000, scale: 1.0 },
];

export default function BreakOverlay({
  session,
  breakRemaining,
  totalBreakSeconds,
  onResume,
  onExtend,
  onEnd,
}) {
  const [quoteIdx, setQuoteIdx] = useState(Math.floor(Math.random() * QUOTES.length));
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathScale, setBreathScale] = useState(1.0);
  const [breathLabel, setBreathLabel] = useState('Breathe In');

  // Rotate quotes every 15 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
    }, 15000);
    return () => clearInterval(t);
  }, []);

  // Breathing animation
  useEffect(() => {
    let cancelled = false;
    const cycle = async () => {
      for (let i = 0; i < BREATHING_PHASES.length; i++) {
        if (cancelled) return;
        const phase = BREATHING_PHASES[i];
        setBreathPhase(i);
        setBreathScale(phase.scale);
        setBreathLabel(phase.label);
        await new Promise((r) => setTimeout(r, phase.duration));
      }
      if (!cancelled) cycle();
    };
    cycle();
    return () => { cancelled = true; };
  }, []);

  const quote = QUOTES[quoteIdx];

  return (
    <div className="break-overlay">
      <div className="break-content">
        {/* Header */}
        <div className="break-header">
          <div className="break-badge">☕ Break Time</div>
          <div className="break-subject">{session?.subject_name || 'Study Session'}</div>
        </div>

        {/* Timer + Breathing side by side */}
        <div className="break-center-row">
          {/* Break Timer */}
          <div className="break-timer-section">
            <FocusTimer
              totalSeconds={totalBreakSeconds}
              remainingSeconds={breakRemaining}
              isRunning={true}
              label="Break"
              color="#10b981"
              breakColor="#10b981"
            />
            <p className="break-timer-hint">Break timer</p>
          </div>

          {/* Breathing guide */}
          <div className="break-breathing">
            <div
              className="breath-circle"
              style={{ transform: `scale(${breathScale})` }}
            >
              <div className="breath-inner" />
            </div>
            <span className="breath-label">{breathLabel}</span>
          </div>
        </div>

        {/* Quote */}
        <div className="break-quote-card">
          <p className="break-quote-text">"{quote.text}"</p>
          <p className="break-quote-author">— {quote.author}</p>
        </div>

        {/* Controls */}
        <div className="break-actions">
          <button className="btn-primary break-resume-btn" onClick={onResume}>
            ▶ Resume Study
          </button>
          <button className="btn-glass" onClick={onExtend}>
            +5 min Break
          </button>
          <button className="btn-danger-ghost" onClick={onEnd}>
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}
