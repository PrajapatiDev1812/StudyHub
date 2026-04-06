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

  // Get current active/paused/break session
  getActiveSession: () => api.get(`${BASE}/sessions/active/`),

  // List recent sessions (history)
  listSessions: () => api.get(`${BASE}/sessions/`),

  // Retrieve a specific session
  getSession: (id) => api.get(`${BASE}/sessions/${id}/`),

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

  // Get timer suggestions (pass topicId for difficulty-based suggestions)
  getSuggestions: (topicId = null) =>
    api.get(`${BASE}/suggestions/${topicId ? `?topic_id=${topicId}` : ''}`),
};

export default focusApi;
