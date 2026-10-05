import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export const useStudentOverview = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'overview'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/overview`),
    enabled: !!studentId,
  });
};

export const useContinueLearning = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'continue-learning'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/continue-learning`),
    enabled: !!studentId,
  });
};

export const useDailyGoal = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'daily-goal'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/daily-goal`),
    enabled: !!studentId,
  });
};

export const useAIRecommendations = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'ai-recommendations'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/ai-recommendations`),
    enabled: !!studentId,
  });
};

export const useUpcomingEvents = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'upcoming-events'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/upcoming-events`),
    enabled: !!studentId,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProgressSummary = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'progress-summary'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/progress-summary`),
    enabled: !!studentId,
  });
};

export const useRecentContent = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'recent-content'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/recent-content`),
    enabled: !!studentId,
  });
};

export const useActivityFeed = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'activity-feed'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/activity-feed`),
    enabled: !!studentId,
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

export const useWeakTopics = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'weak-topics'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/weak-topics`),
    enabled: !!studentId,
  });
};

export const useStudyCalendar = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'study-calendar'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/study-calendar`),
    enabled: !!studentId,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAIInsights = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'ai-insights'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/ai-insights`),
    enabled: !!studentId,
  });
};

export const useWeeklyAnalytics = (studentId) => {
  return useQuery({
    queryKey: ['student', studentId, 'weekly-analytics'],
    queryFn: () => apiClient.get(`/api/students/${studentId}/weekly-analytics`),
    enabled: !!studentId,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSmartSearch = (query) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => apiClient.get(`/api/search?q=${encodeURIComponent(query)}`),
    enabled: !!query && query.length > 1,
    staleTime: 5 * 60 * 1000,
  });
};
