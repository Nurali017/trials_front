import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trialPlansService } from '../api';
import type {
  CreateTrialPlanRequest,
  UpdateTrialPlanRequest,
  AddParticipantsRequest,
  DistributePlanRequest,
} from '../api/trialPlans';

// Query keys
export const trialPlansKeys = {
  all: ['trialPlans'] as const,
  lists: () => [...trialPlansKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...trialPlansKeys.lists(), filters] as const,
  details: () => [...trialPlansKeys.all, 'detail'] as const,
  detail: (id: number) => [...trialPlansKeys.details(), id] as const,
  statistics: (id: number) => [...trialPlansKeys.detail(id), 'statistics'] as const,
};

// Get trial plans list
export const useTrialPlans = (params?: {
  year?: string;
  oblast?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: trialPlansKeys.list(params || {}),
    queryFn: () => trialPlansService.getTrialPlans(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get trial plan by ID
export const useTrialPlan = (id: number) => {
  return useQuery({
    queryKey: trialPlansKeys.detail(id),
    queryFn: () => trialPlansService.getTrialPlan(id),
    enabled: !!id,
  });
};

// Get trial plan statistics
export const useTrialPlanStatistics = (id: number) => {
  return useQuery({
    queryKey: trialPlansKeys.statistics(id),
    queryFn: () => trialPlansService.getTrialPlanStatistics(id),
    enabled: !!id,
  });
};

// Create trial plan mutation
export const useCreateTrialPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrialPlanRequest) => trialPlansService.createTrialPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.lists() });
    },
  });
};

// Update trial plan mutation
export const useUpdateTrialPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTrialPlanRequest }) =>
      trialPlansService.updateTrialPlan(id, data),
    onSuccess: (updatedPlan) => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.detail(updatedPlan.id) });
    },
  });
};

// Delete trial plan mutation
export const useDeleteTrialPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => trialPlansService.deleteTrialPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.lists() });
    },
  });
};

// Add participants mutation (старый метод для обратной совместимости)
export const useAddParticipants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddParticipantsRequest }) =>
      trialPlansService.addParticipants(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.statistics(variables.id) });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.lists() });
    },
  });
};

// ⭐ НОВЫЙ ХУК: Add participants to specific trial type
export const useAddParticipantsToTrialType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      planId, 
      cultureId, 
      trialTypeId, 
      data 
    }: { 
      planId: number; 
      cultureId: number; 
      trialTypeId: number; 
      data: AddParticipantsRequest 
    }) =>
      trialPlansService.addParticipantsToTrialType(planId, cultureId, trialTypeId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.statistics(variables.planId) });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.lists() });
    },
  });
};

// Distribute plan mutation
export const useDistributePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: DistributePlanRequest }) =>
      trialPlansService.distributePlan(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.statistics(variables.id) });
    },
  });
};

// Copy trial plan mutation
export const useCopyTrialPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, targetYear }: { id: number; targetYear: number }) =>
      trialPlansService.copyTrialPlan(id, targetYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.lists() });
    },
  });
};

// Export trial plan mutation
export const useExportTrialPlan = () => {
  return useMutation({
    mutationFn: (id: number) => trialPlansService.exportTrialPlan(id),
  });
};

// Suggest applications query
export const useSuggestApplications = (params: {
  oblast_id: number;
  culture_id?: number;
  season?: string;
}, enabled = true) => {
  return useQuery({
    queryKey: ['suggestApplications', params],
    queryFn: () => trialPlansService.suggestApplications(params),
    enabled: enabled && !!params.oblast_id,
  });
};

// Add culture to trial plan mutation
export const useAddCultureToPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cultureId }: { id: number; cultureId: number }) =>
      trialPlansService.addCulture(id, cultureId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.statistics(variables.id) });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.lists() });
    },
  });
};

// Get predecessor options
export const usePredecessorOptions = () => {
  return useQuery({
    queryKey: ['predecessorOptions'],
    queryFn: () => trialPlansService.getPredecessorOptions(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// ============ НОВЫЕ ХУКИ ДЛЯ ФОРМЫ 008 ============

// Get my tasks (для агронома)
export const useMyTasks = (params: { region_id?: number; year?: number }, enabled = true) => {
  return useQuery({
    queryKey: ['myTasks', params],
    queryFn: () => trialPlansService.getMyTasks(params),
    enabled: enabled && !!params.region_id,
  });
};

// Create trial from plan mutation
export const useCreateTrialFromPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: {
      planId: number;
      data: {
        region_id: number;
        culture_id: number;
        area_ha: number;
        responsible_person?: string;
        start_date: string;
        exclude_participants?: number[];
      };
    }) => trialPlansService.createTrialFromPlan(planId, data),
    onSuccess: () => {
      // Инвалидируем задачи и планы
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: trialPlansKeys.all });
      // Инвалидируем испытания
      queryClient.invalidateQueries({ queryKey: ['trials'] });
    },
  });
};
