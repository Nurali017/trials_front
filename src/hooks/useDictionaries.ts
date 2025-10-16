import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dictionariesService } from '@/api';
import apiClient from '@/api/client';
import type { Indicator } from '@/types/api.types';

// Query keys
export const dictionaryKeys = {
  oblasts: ['oblasts'] as const,
  climateZones: ['climate-zones'] as const,
  regions: (oblast?: number, climate_zone?: number) => ['regions', oblast, climate_zone] as const,
  indicators: (culture_id?: number, is_universal?: boolean) => ['indicators', culture_id, is_universal] as const,
  cultureGroups: ['culture-groups'] as const,
  cultures: (cultureGroup?: number) => ['cultures', cultureGroup] as const,
  originators: ['originators'] as const,
  sortRecords: (filters?: Record<string, any>) => ['sort-records', filters] as const,
};

// Oblasts
export const useOblasts = () => {
  return useQuery({
    queryKey: dictionaryKeys.oblasts,
    queryFn: () => dictionariesService.oblasts.getAll(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Climate Zones
export const useClimateZones = () => {
  return useQuery({
    queryKey: dictionaryKeys.climateZones,
    queryFn: () => dictionariesService.climateZones.getAll(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Regions
export const useRegions = (oblast?: number, climate_zone?: number) => {
  return useQuery({
    queryKey: dictionaryKeys.regions(oblast, climate_zone),
    queryFn: () => {
      const params: any = {};
      if (oblast) params.oblast = oblast;
      if (climate_zone) params.climate_zone = climate_zone;
      return dictionariesService.regions.getAll(Object.keys(params).length > 0 ? params : undefined);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Indicators
export const useIndicators = (params?: { 
  culture?: number; 
  is_universal?: boolean; 
  is_quality?: boolean; 
  category?: string;
}) => {
  return useQuery({
    queryKey: ['indicators', params],
    queryFn: () => dictionariesService.indicators.getAll(params),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Get indicators for a specific trial
export const useTrialIndicators = (trialId: number | undefined) => {
  return useQuery({
    queryKey: ['trial-indicators', trialId],
    queryFn: () => dictionariesService.indicators.getByTrial(trialId!),
    enabled: !!trialId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Create indicator mutation
export const useCreateIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Indicator, 'id'>) => dictionariesService.indicators.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });
};

// Update indicator mutation
export const useUpdateIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Indicator> }) =>
      dictionariesService.indicators.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });
};

// Delete indicator mutation
export const useDeleteIndicator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dictionariesService.indicators.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicators'] });
    },
  });
};

// Culture Groups
export const useCultureGroups = () => {
  return useQuery({
    queryKey: dictionaryKeys.cultureGroups,
    queryFn: () => dictionariesService.cultureGroups.getAll(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Cultures
export const useCultures = (cultureGroup?: number) => {
  return useQuery({
    queryKey: dictionaryKeys.cultures(cultureGroup),
    queryFn: () => dictionariesService.cultures.getAll(cultureGroup ? { group: cultureGroup } : undefined),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: true, // Всегда загружаем культуры
  });
};

// Originators
export const useOriginators = () => {
  return useQuery({
    queryKey: dictionaryKeys.originators,
    queryFn: () => dictionariesService.originators.getAll(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Sort Records
export const useSortRecords = (filters?: Record<string, any>, enabled: boolean = true) => {
  return useQuery({
    queryKey: dictionaryKeys.sortRecords(filters),
    queryFn: () => dictionariesService.sortRecords.getAll(filters),
    enabled: enabled && !!filters, // Включаем только если enabled=true И есть filters
  });
};

// Trial Types
export const useTrialTypes = () => {
  return useQuery({
    queryKey: ['trial-types'],
    queryFn: () => dictionariesService.trialTypes.getAll(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Sync sort record
export const useSyncSortRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dictionariesService.sortRecords.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sort-records'] });
    },
  });
};

// Sync all sort records
export const useSyncAllSortRecords = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dictionariesService.sortRecords.syncAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sort-records'] });
    },
  });
};

// Combined hook for all dictionaries (convenience)
export const useDictionaries = () => {
  const { data: oblasts = [] } = useOblasts();
  const { data: regions = [] } = useRegions();
  const { data: climateZones = [] } = useClimateZones();
  const { data: indicators = [] } = useIndicators();
  const { data: cultureGroups = [] } = useCultureGroups();
  const { data: originators = [] } = useOriginators();
  const { data: trialTypes = [] } = useTrialTypes();

  // Загрузка всех культур (без фильтра по группе)
  const { data: cultures = [] } = useQuery({
    queryKey: ['cultures', 'all'],
    queryFn: () => dictionariesService.cultures.getAll(),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: true, // Всегда загружаем культуры
  });

  // Пользователи пока не загружаются (endpoint может не существовать)
  // Если нужно - добавить отдельный хук useUsers()
  const users: any[] = [];

  return {
    oblasts,
    regions,
    climateZones,
    indicators,
    cultureGroups,
    cultures,
    originators,
    trialTypes,
    users,
  };
};
