import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trialsService, form008ValidationService } from '@/api/trials';
import type { 
  MakeDecisionRequest, 
  CreateSortRequest,
  MarkSentToLabRequest,
  LaboratoryBulkEntryRequest,
  LaboratoryCompleteRequest,
  Form008SaveRequest,
  Form008UpdateConditionsRequest,
  StatisticsPreviewRequest,
  AddIndicatorsRequest,
  RemoveIndicatorsRequest,
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
  return useMutation({
    mutationFn: ({ trialId, payload }: {
      trialId: number;
      payload: Form008SaveRequest;
    }) => trialsService.saveForm008(trialId, payload),
    // Не делаем автоматическую инвалидацию после каждого сохранения,
    // чтобы не сбрасывать локальное состояние формы при автосохранении
  });
};

// Частичное сохранение формы 008
export const useSaveForm008Partial = () => {
  return useMutation({
    mutationFn: ({ trialId, payload }: {
      trialId: number;
      payload: Partial<Form008SaveRequest>;
    }) => trialsService.saveForm008Partial(trialId, payload),
  });
};

// Сохранение только урожайности
export const useSaveForm008Yield = () => {
  return useMutation({
    mutationFn: ({ trialId, participants, statistics }: {
      trialId: number;
      participants: Form008SaveRequest['participants'];
      statistics?: Form008SaveRequest['statistics'];
    }) => trialsService.saveForm008Yield(trialId, participants, statistics),
  });
};

// Сохранение только статистики
export const useSaveForm008Statistics = () => {
  return useMutation({
    mutationFn: ({ trialId, statistics }: {
      trialId: number;
      statistics: Form008SaveRequest['statistics'];
    }) => trialsService.saveForm008Statistics(trialId, statistics),
  });
};

// Get form 008 statistics (включая авторасчет)
export const useForm008Statistics = (trialId: number, enabled = true) => {
  return useQuery({
    queryKey: [...trialKeys.detail(trialId), 'form008', 'statistics'],
    queryFn: () => trialsService.getForm008Statistics(trialId),
    enabled: enabled && !!trialId,
  });
};

// Update trial conditions mutation
export const useUpdateTrialConditions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trialId, payload }: {
      trialId: number;
      payload: Form008UpdateConditionsRequest;
    }) => trialsService.updateTrialConditions(trialId, payload),
    onSuccess: (_, { trialId }) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(trialId) });
      queryClient.invalidateQueries({ queryKey: [...trialKeys.detail(trialId), 'form008'] });
    },
  });
};

// ============ СТАТИСТИКА И РАСЧЕТЫ ============

export const usePreviewStatistics = () => {
  return useMutation({
    mutationFn: ({ trialId, payload }: { trialId: number; payload: StatisticsPreviewRequest; }) => trialsService.previewStatistics(trialId, payload),
  });
};

// ============ УПРАВЛЕНИЕ ПОКАЗАТЕЛЯМИ ============

export const useGetIndicatorsByCulture = (cultureId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['indicators', 'by-culture', cultureId],
    queryFn: () => trialsService.getIndicatorsByCulture(cultureId),
    enabled: (options?.enabled ?? true) && !!cultureId,
  });
};

export const useAddIndicators = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trialId, payload }: { trialId: number; payload: AddIndicatorsRequest; }) => trialsService.addIndicators(trialId, payload),
    onSuccess: (_, { trialId }) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(trialId) });
      queryClient.invalidateQueries({ queryKey: [...trialKeys.detail(trialId), 'form008'] });
    },
  });
};

export const useRemoveIndicators = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trialId, payload }: { trialId: number; payload: RemoveIndicatorsRequest; }) => trialsService.removeIndicators(trialId, payload),
    onSuccess: (_, { trialId }) => {
      queryClient.invalidateQueries({ queryKey: trialKeys.detail(trialId) });
      queryClient.invalidateQueries({ queryKey: [...trialKeys.detail(trialId), 'form008'] });
    },
  });
};

// Hook for Form008 validation rules
export const useForm008ValidationRules = (trialId: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['form008', 'validation-rules', trialId],
    queryFn: () => form008ValidationService.getValidationRules(trialId),
    enabled: (options?.enabled ?? true) && !!trialId,
  });
};

