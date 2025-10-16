import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultsService } from '@/api';
import type { CreateTrialResultRequest, BatchCreateTrialResultsRequest, BulkEntryRequest } from '@/types/api.types';
import { trialKeys } from './useTrials';

// Query keys
export const resultKeys = {
  all: ['results'] as const,
  lists: () => [...resultKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...resultKeys.lists(), filters] as const,
  details: () => [...resultKeys.all, 'detail'] as const,
  detail: (id: number) => [...resultKeys.details(), id] as const,
};

// Get all results
export const useResults = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: resultKeys.list(filters),
    queryFn: () => resultsService.getAll(filters),
  });
};

// Get single result
export const useResult = (id: number) => {
  return useQuery({
    queryKey: resultKeys.detail(id),
    queryFn: () => resultsService.getById(id),
    enabled: !!id,
  });
};

// Create result mutation
export const useCreateResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrialResultRequest) => resultsService.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(result.trial) });
    },
  });
};

// Batch create results mutation
export const useBatchCreateResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchCreateTrialResultsRequest) => resultsService.createBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trialKeys.all });
    },
  });
};

// Update result mutation
export const useUpdateResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTrialResultRequest> }) =>
      resultsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: resultKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
    },
  });
};

// Delete result mutation
export const useDeleteResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => resultsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trialKeys.all });
    },
  });
};

// Bulk entry mutation - массовое внесение результатов для одного участника
export const useBulkEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkEntryRequest) => resultsService.bulkEntry(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trialKeys.all });
      // Инвалидируем конкретное испытание, если оно известно
      if (variables.participant) {
        queryClient.invalidateQueries({ queryKey: trialKeys.all });
      }
    },
  });
};
