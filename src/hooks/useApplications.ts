import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService } from '@/api';
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  DistributeApplicationRequest,
} from '@/types/api.types';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: number) => [...applicationKeys.details(), id] as const,
  statistics: () => [...applicationKeys.all, 'statistics'] as const,
  regionalTrials: (id: number) => [...applicationKeys.detail(id), 'regional-trials'] as const,
  regionalStatus: (id: number) => [...applicationKeys.detail(id), 'regional-status'] as const, // ⭐ Новый!
  decisions: (id: number) => [...applicationKeys.detail(id), 'decisions'] as const,
  culturesForRegion: (regionId: number) => [...applicationKeys.all, 'cultures-for-region', regionId] as const,
  pendingForRegion: (regionId: number, cultureId?: number) => 
    [...applicationKeys.all, 'pending-for-region', regionId, cultureId] as const,
};

// Get all applications
export const useApplications = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () => applicationsService.getAll(filters),
  });
};

// Get single application
export const useApplication = (id: number, enabled = true) => {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => applicationsService.getById(id),
    enabled: enabled && !!id,
  });
};

// Get application statistics
export const useApplicationStatistics = () => {
  return useQuery({
    queryKey: applicationKeys.statistics(),
    queryFn: () => applicationsService.getStatistics(),
  });
};

// Get regional trials for application
export const useRegionalTrials = (applicationId: number) => {
  return useQuery({
    queryKey: applicationKeys.regionalTrials(applicationId),
    queryFn: () => applicationsService.getRegionalTrials(applicationId),
    enabled: !!applicationId,
  });
};

// ⭐ Новый хук: Get regional status (многолетние испытания)
export const useRegionalStatus = (applicationId: number) => {
  return useQuery({
    queryKey: applicationKeys.regionalStatus(applicationId),
    queryFn: () => applicationsService.getRegionalStatus(applicationId),
    enabled: !!applicationId,
  });
};

// Get decisions for application
export const useApplicationDecisions = (applicationId: number) => {
  return useQuery({
    queryKey: applicationKeys.decisions(applicationId),
    queryFn: () => applicationsService.getDecisions(applicationId),
    enabled: !!applicationId,
  });
};

// Create application mutation
export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApplicationRequest) => applicationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.statistics() });
    },
  });
};

// Update application mutation
export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateApplicationRequest }) =>
      applicationsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
};

// Delete application mutation
export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => applicationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.statistics() });
    },
  });
};

// Distribute application mutation
export const useDistributeApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DistributeApplicationRequest }) =>
      applicationsService.distribute(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.regionalTrials(id) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.regionalStatus(id) }); // ⭐ Новый!
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });
};

// Get cultures with applications for region
export const useCulturesForRegion = (regionId: number | null) => {
  return useQuery({
    queryKey: applicationKeys.culturesForRegion(regionId || 0),
    queryFn: () => applicationsService.getCulturesForRegion(regionId!),
    enabled: !!regionId,
  });
};

// Get pending applications for region
export const usePendingApplicationsForRegion = (regionId: number | null, cultureId?: number | null) => {
  return useQuery({
    queryKey: applicationKeys.pendingForRegion(regionId || 0, cultureId || undefined),
    queryFn: () => applicationsService.getPendingForRegion(regionId!, cultureId || undefined),
    enabled: !!regionId,
  });
};
