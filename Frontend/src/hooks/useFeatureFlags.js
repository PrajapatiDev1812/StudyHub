import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => apiClient.get('/api/feature-flags'),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};
