/**
 * services/focusApi.js
 * --------------------
 * All API calls for the Focus Mode system.
 */
import api from './api';

const BASE = '/focus';

export const focusApi = {
  // Start a new session
  startSession: (data) => api.post(`${BASE}/sessions/start/`, data),

  // List sessions with optional filters
  // params: { mode: 'normal'|'strict', status: 'completed'|'abandoned', time: '7d'|'30d'|'all', ordering: '-start_time'|'start_time' }
  listSessions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.mode && params.mode !== 'all') query.set('mode', params.mode);
    if (params.status) query.set('status', params.status);
    if (params.time && params.time !== 'all') query.set('time', params.time);
    if (params.ordering) query.set('ordering', params.ordering);
    const qs = query.toString();
    return api.get(`${BASE}/sessions/${qs ? `?${qs}` : ''}`);
  },

  // Get aggregated stats for history (supports same filters as listSessions)
  getStats: (params = {}) => {
    const query = new URLSearchParams();
    if (params.mode && params.mode !== 'all') query.set('mode', params.mode);
    if (params.time && params.time !== 'all') query.set('time', params.time);
    const qs = query.toString();
    return api.get(`${BASE}/sessions/stats/${qs ? `?${qs}` : ''}`);
  },

  // Retrieve a specific session
  getSession: (id) => api.get(`${BASE}/sessions/${id}/`),

  // Get current active/paused/break session
  getActiveSession: () => api.get(`${BASE}/sessions/active/`),

  // Sync elapsed focus time to backend (heartbeat)
  syncTimer: (id, focusSecondsElapsed) =>
    api.post(`${BASE}/sessions/${id}/sync_timer/`, {
      focus_seconds_elapsed: focusSecondsElapsed,
    }),

  // Pause
  pauseSession: (id) => api.post(`${BASE}/sessions/${id}/pause/`),

  // Take a break
  takeBreak: (id) => api.post(`${BASE}/sessions/${id}/take_break/`),

  // Resume from break or pause
  resumeSession: (id) => api.post(`${BASE}/sessions/${id}/resume/`),

  // End session cleanly (completed)
  endSession: (id) => api.post(`${BASE}/sessions/${id}/end/`),

  // Abandon session (exit without completing)
  abandonSession: (id) => api.post(`${BASE}/sessions/${id}/abandon/`),

  // Delete a single session from history
  deleteSession: (id) => api.delete(`${BASE}/sessions/${id}/`),

  // Delete all completed + abandoned sessions (optionally filtered by mode)
  clearHistory: (mode = null) => {
    const qs = mode ? `?mode=${mode}` : '';
    return api.delete(`${BASE}/sessions/clear_history/${qs}`);
  },

  // Get timer suggestions (pass topicId for difficulty-based suggestions)
  getSuggestions: (topicId = null) =>
    api.get(`${BASE}/suggestions/${topicId ? `?topic_id=${topicId}` : ''}`),
};

export default focusApi;
