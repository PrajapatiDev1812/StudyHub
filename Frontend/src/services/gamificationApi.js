import api from './api';

export const getBadges = async () => {
    const res = await api.get('/gamification/badges/');
    return res.data;
};

export const getUserBadges = async () => {
    const res = await api.get('/gamification/user-badges/');
    return res.data;
};

export const getUserStats = async () => {
    const res = await api.get('/gamification/user-stats/');
    return res.data;
};

// Manually trigger an event if needed, but normally this is handled by backend hooks.
export const triggerGamificationEvent = async (eventType, payload) => {
    const res = await api.post(`/gamification/event/${eventType}/`, payload);
    return res.data;
};
