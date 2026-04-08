import React, { useEffect, useState } from 'react';
import { getUserStats } from '../../services/gamificationApi';
import './GamificationWidget.css';

const GamificationWidget = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const data = await getUserStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load gamification stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        
        // Listen to a custom event to refresh stats when an action occurs
        const handleRefresh = () => fetchStats();
        window.addEventListener('refresh-gamification', handleRefresh);
        return () => window.removeEventListener('refresh-gamification', handleRefresh);
    }, []);

    if (loading || !stats) return null;

    // Calculate progress to next level
    const xpForCurrentLevel = (stats.level - 1) * 100;
    const xpForNextLevel = stats.level * 100;
    const progressXP = stats.xp - xpForCurrentLevel;
    const progressPercent = Math.min((progressXP / 100) * 100, 100);

    return (
        <div className="gamification-widget">
            <div className="gamification-header">
                <div className="level-badge">
                    <span>Lvl</span>
                    <strong>{stats.level}</strong>
                </div>
                <div className="streak-badge">
                    🔥 {stats.streak_days}
                </div>
            </div>
            
            <div className="gamification-xp-bar-container">
                <div className="gamification-xp-info">
                    <span>XP: {stats.xp}</span>
                    <span>Next: {xpForNextLevel}</span>
                </div>
                <div className="gamification-xp-bar-bg">
                    <div 
                        className="gamification-xp-bar-fill" 
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default GamificationWidget;
