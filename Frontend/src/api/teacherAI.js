import apiClient from './client';

/**
 * Teacher AI Panel API Client
 * Connects Frontend components to backend /api/ai/ endpoints.
 */

// ── AI Configuration ──────────────────────────────────────────────────────────

export const getAIConfiguration = () => {
  return apiClient.get('/api/ai/configuration/');
};

export const updateAIConfiguration = (configData) => {
  return apiClient.put('/api/ai/configuration/', configData);
};

// ── Knowledge Base (RAG Documents) ───────────────────────────────────────────

export const listKnowledgeDocuments = () => {
  return apiClient.get('/api/ai/knowledge-documents/');
};

export const uploadKnowledgeDocument = (formData, onProgress) => {
  return apiClient.post('/api/ai/knowledge-documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 90000, // 90 seconds for large document extraction/embedding
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
};

export const deleteKnowledgeDocument = (id) => {
  return apiClient.delete(`/api/ai/knowledge-documents/${id}/`);
};

export const getDocumentStatus = (id) => {
  return apiClient.get(`/api/ai/knowledge-documents/${id}/status/`);
};

export const getKnowledgeHealth = () => {
  return apiClient.get('/api/ai/knowledge-health/');
};

// ── Advanced Question Generator ──────────────────────────────────────────────

export const generateAssessmentQuestions = (params) => {
  return apiClient.post('/api/ai/generate-question/', params, {
    timeout: 60000, // 60s timeout for generative reasoning
  });
};

// ── Teacher AI Chat Interface ────────────────────────────────────────────────

export const sendTeacherChatMessage = (chatPayload) => {
  return apiClient.post('/api/ai/chat/', chatPayload, {
    timeout: 60000,
  });
};

// ── AI Analytics & Usage Insights ────────────────────────────────────────────

export const getProfessorClassInsights = () => {
  return apiClient.get('/api/ai/analytics/professor/class-insights/');
};

export const getAdminAnalyticsOverview = () => {
  return apiClient.get('/api/ai/analytics/admin/overview/');
};
