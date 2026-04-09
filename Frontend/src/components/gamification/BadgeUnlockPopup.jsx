import React, { useEffect, useState } from 'react';
import './BadgeUnlockPopup.css';

const BadgeUnlockPopup = ({ badge, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for transition before unmounting
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [badge]);

  if (!badge) return null;

  const isMilestone = badge.tier && badge.tier !== 'none';
  const isRepeatableIncrement = badge.repeatable_earned;

  return (
    <div className={`badge-popup-overlay ${visible ? 'show' : ''} tier-${badge.tier || 'none'}`} onClick={(e) => {
        setVisible(false);
        setTimeout(onClose, 300);
    }}>
      <div className="badge-popup-card" onClick={e => e.stopPropagation()}>
        <div className="confetti-bg"></div>
        <div className="badge-popup-header">
            <h3>{isMilestone ? `${badge.tier.toUpperCase()} Milestone!` : (isRepeatableIncrement ? 'Achievement Progress!' : 'Achievement Unlocked!')}</h3>
            <span>+{badge.xp || 10} XP</span>
        </div>
        <div className="badge-popup-icon-wrapper">
          {badge.icon ? (
            <img src={badge.icon.startsWith('http') ? badge.icon : `http://127.0.0.1:8000${badge.icon}`} alt={badge.name} className="badge-popup-img" />
          ) : (
            <div className="badge-popup-placeholder">🏆</div>
          )}
        </div>
        <div className="badge-popup-content">
          <h4>{badge.name}</h4>
          <p>{badge.description}</p>
          {isRepeatableIncrement && badge.earned_count && (
            <div className="badge-popup-count">
                Total Completed: <strong>{badge.earned_count}</strong>
            </div>
          )}
        </div>
        <button className="badge-popup-close" onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }}>
          Awesome!
        </button>
      </div>
    </div>
  );
};

export default BadgeUnlockPopup;
