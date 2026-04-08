import React, { useEffect, useState } from 'react';
import { getBadges, getUserBadges, getUserStats } from '../../services/gamificationApi';
import './AchievementsPage.css';

const AchievementsPage = () => {
    const [stats, setStats] = useState(null);
    const [allBadges, setAllBadges] = useState([]);
    const [userBadges, setUserBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAchievements = async () => {
            try {
                const [statsData, badgesData, userBadgesData] = await Promise.all([
                    getUserStats(),
                    getBadges(),
                    getUserBadges()
                ]);
                
                setStats(statsData);
                setAllBadges(badgesData);
                setUserBadges(userBadgesData);
            } catch (error) {
                console.error("Failed to load achievements page data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadAchievements();
    }, []);

    if (loading) {
        return <div className="achievements-loading">Loading achievements...</div>;
    }

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge.id));

    // Group badges by category if desired, or just show all
    const groupedBadges = allBadges.reduce((acc, badge) => {
        const cat = badge.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(badge);
        return acc;
    }, {});

    return (
        <div className="achievements-page">
            <header className="achievements-header">
                <h1>My Achievements</h1>
                <p>Track your progress and earn rewards</p>
            </header>

            {stats && (
                <div className="achievements-stats-panel">
                    <div className="stat-card level-card">
                        <h3>Current Level</h3>
                        <div className="stat-value">{stats.level}</div>
                        <div className="stat-sub">XP: {stats.xp} / {(stats.level) * 100}</div>
                    </div>
                    <div className="stat-card streak-card">
                        <h3>🔥 Active Streak</h3>
                        <div className="stat-value">{stats.streak_days} Days</div>
                    </div>
                    <div className="stat-card completion-card">
                        <h3>Badges Earned</h3>
                        <div className="stat-value">{userBadges.length} / {allBadges.length}</div>
                    </div>
                </div>
            )}

            <div className="achievements-categories">
                {Object.keys(groupedBadges).map(category => (
                    <div key={category} className="achievement-category">
                        <h2>{category.charAt(0).toUpperCase() + category.slice(1)} Badges</h2>
                        <div className="badges-grid">
                            {groupedBadges[category].map(badge => {
                                const isEarned = earnedBadgeIds.has(badge.id);
                                return (
                                    <div key={badge.id} className={`badge-card ${isEarned ? 'earned' : 'locked'}`}>
                                        <div className="badge-icon-container">
                                            {badge.icon ? (
                                                <img src={`http://127.0.0.1:8000${badge.icon}`} alt={badge.name} />
                                            ) : (
                                                <div className="badge-placeholder">🏆</div>
                                            )}
                                            {!isEarned && <div className="lock-overlay">🔒</div>}
                                        </div>
                                        <div className="badge-info">
                                            <h4>{badge.name}</h4>
                                            <p>{badge.description}</p>
                                            <span className="badge-xp">+{badge.xp_reward} XP</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AchievementsPage;
