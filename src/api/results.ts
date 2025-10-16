import apiClient from './client';
import type {
  TrialResult,
  CreateTrialResultRequest,
  BatchCreateTrialResultsRequest,
  BulkEntryRequest,
} from '@/types/api.types';

export const resultsService = {
  // Get all results with optional filters
  getAll: async (params?: Record<string, any>) => {
    const { data } = await apiClient.get<{ results: TrialResult[] }>('/trial-results/', { params });
    return data.results || data;
  },

  // Get single result by ID
  getById: async (id: number) => {
    const { data } = await apiClient.get<TrialResult>(`/trial-results/${id}/`);
    return data;
  },

  // Create new result
  create: async (payload: CreateTrialResultRequest) => {
    const { data } = await apiClient.post<TrialResult>('/trial-results/', payload);
    return data;
  },

  // Batch create results
  createBatch: async (payload: BatchCreateTrialResultsRequest) => {
    const { data } = await apiClient.post<{ created: TrialResult[]; count: number }>(
      '/trial-results/batch/',
      payload
    );
    return data;
  },

  // Bulk entry - массовое внесение результатов для одного участника
  bulkEntry: async (payload: BulkEntryRequest) => {
    const { data } = await apiClient.post<{ 
      success: boolean; 
      created: number; 
      updated: number; 
      total: number;
    }>(
      '/trial-results/bulk-entry/',
      payload
    );
    return data;
  },

  // Update result
  update: async (id: number, payload: Partial<CreateTrialResultRequest>) => {
    const { data } = await apiClient.patch<TrialResult>(`/trial-results/${id}/`, payload);
    return data;
  },

  // Delete result
  delete: async (id: number) => {
    await apiClient.delete(`/trial-results/${id}/`);
  },
};
