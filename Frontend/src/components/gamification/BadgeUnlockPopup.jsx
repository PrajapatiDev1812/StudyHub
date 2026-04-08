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

  return (
    <div className={`badge-popup-overlay ${visible ? 'show' : ''}`} onClick={(e) => {
        setVisible(false);
        setTimeout(onClose, 300);
    }}>
      <div className="badge-popup-card" onClick={e => e.stopPropagation()}>
        <div className="confetti-bg"></div>
        <div className="badge-popup-header">
            <h3>Achievement Unlocked!</h3>
            <span>+{badge.xp} XP</span>
        </div>
        <div className="badge-popup-icon-wrapper">
          {badge.icon ? (
            <img src={`http://127.0.0.1:8000${badge.icon}`} alt={badge.name} className="badge-popup-img" />
          ) : (
            <div className="badge-popup-placeholder">🏆</div>
          )}
        </div>
        <div className="badge-popup-content">
          <h4>{badge.name}</h4>
          <p>{badge.description}</p>
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
