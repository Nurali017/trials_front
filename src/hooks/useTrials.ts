import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trialsService } from '@/api';
import type { 
  MakeDecisionRequest, 
  CreateSortRequest,
  MarkSentToLabRequest,
  LaboratoryBulkEntryRequest,
  LaboratoryCompleteRequest,
} from '@/types/api.types';
import { applicationKeys } from './useApplications';

// Query keys
export const trialKeys = {
  all: ['trials'] as const,
  lists: () => [...trialKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...trialKeys.lists(), filters] as const,
  details: () => [...trialKeys.all, 'detail'] as const,
  detail: (id: number) => [...trialKeys.details(), id] as const,
  availableSorts: (search?: string, culture?: number) => [...trialKeys.all, 'available-sorts', search, culture] as const,
  trialTypes: () => [...trialKeys.all, 'trial-types'] as const,
};

// Get all trials
export const useTrials = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: trialKeys.list(filters),
    queryFn: () => trialsService.getAll(filters),
  });
};

// Get single trial
export const useTrial = (id: number, enabled = true) => {
  return useQuery({
    queryKey: trialKeys.detail(id),
    queryFn: () => trialsService.getById(id),
    enabled: enabled && !!id,
  });
};

// Get trial types
export const useTrialTypes = () => {
  return useQuery({
    queryKey: trialKeys.trialTypes(),
    queryFn: () => trialsService.getTrialTypes(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (справочник редко меняется)
  });
};

// Get available sorts from Patents Service
export const useAvailableSorts = (search?: string, culture?: number) => {
  return useQuery({
    queryKey: trialKeys.availableSorts(search, culture),
    queryFn: () => trialsService.getAvailableSorts(search, culture),
    enabled: culture !== undefined, // Включаем только когда выбрана культура
  });
};

// Update trial mutation
export const useUpdateTrial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<any> }) =>
      trialsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trialKeys.lists() });
    },
  });
};

// Make decision mutation
export const useMakeDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trialId, data }: { trialId: number; data: MakeDecisionRequest }) =>
      trialsService.makeDecision(trialId, data),
    onSuccess: () => {
      // Invalidate trial queries
      queryClient.invalidateQueries({ queryKey: trialKeys.all });

      // Invalidate related application queries
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
};

// Create sort mutation
export const useCreateSort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSortRequest) => trialsService.createSort(data),
    onSuccess: () => {
      // Invalidate available sorts queries to refresh the list
      queryClient.invalidateQueries({ queryKey: trialKeys.all });
    },
  });
};

// Laboratory workflow mutations
export const useMarkSentToLab = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MarkSentToLabRequest }) =>
      trialsService.markSentToLab(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trialKeys.lists() });
    },
  });
};

export const useLaboratoryBulkEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LaboratoryBulkEntryRequest }) =>
      trialsService.laboratoryBulkEntry(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trialKeys.lists() });
    },
  });
};

export const useLaboratoryComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LaboratoryCompleteRequest }) =>
      trialsService.laboratoryComplete(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trialKeys.lists() });
    },
  });
};

// Complete trial (finalize)
export const useCompleteTrial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => trialsService.completeTrial(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: trialKeys.lists() });
    },
  });
};

// ============ ФОРМА 008 ============

// Get form 008 data
export const useForm008 = (trialId: number, enabled = true) => {
  return useQuery({
    queryKey: [...trialKeys.detail(trialId), 'form008'],
    queryFn: () => trialsService.getForm008(trialId),
    enabled: enabled && !!trialId,
  });
};

// Save form 008 mutation
export const useSaveForm008 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trialId, payload }: {
      trialId: number;
      payload: {
        is_final: boolean;
        harvest_date?: string;
        participants: Array<{
          participant_id: number;
          results: Record<string, number | null>;
        }>;
      };
    }) => trialsService.saveForm008(trialId, payload),
    // Не делаем автоматическую инвалидацию после каждого сохранения,
    // чтобы не сбрасывать локальное состояние формы при автосохранении
  });
};
