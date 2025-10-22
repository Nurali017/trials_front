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
    queryFn: () => {
      return dictionariesService.oblasts.getAll();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    onError: (error) => {
      console.error('❌ Ошибка загрузки областей:', error);
    },
    onSuccess: (data) => {
    },
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
  culture_group?: number;
  is_universal?: boolean; 
  is_quality?: boolean; 
  category?: string;
  search?: string;
  is_required?: boolean;
  is_recommended?: boolean;
  is_auto_calculated?: boolean;
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
    queryFn: () => {
      return dictionariesService.cultureGroups.getAll();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    onError: (error) => {
      console.error('❌ Ошибка загрузки групп культур:', error);
    },
    onSuccess: (data) => {
    },
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

// Create originator
export const useCreateOriginator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Originator, 'id' | 'originator_id' | 'synced_at' | 'created_at' | 'updated_at'>) =>
      dictionariesService.originators.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictionaryKeys.originators });
    },
  });
};

// Update originator
export const useUpdateOriginator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Originator> }) =>
      dictionariesService.originators.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictionaryKeys.originators });
    },
  });
};

// Delete originator
export const useDeleteOriginator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => dictionariesService.originators.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dictionaryKeys.originators });
    },
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
  const { data: oblasts = [], isLoading: oblastsLoading, error: oblastsError } = useOblasts();
  const { data: regions = [] } = useRegions();
  const { data: climateZones = [] } = useClimateZones();
  const { data: indicators = [] } = useIndicators();
  const { data: cultureGroups = [], isLoading: cultureGroupsLoading, error: cultureGroupsError } = useCultureGroups();
  const { data: originators = [] } = useOriginators();
  const { data: trialTypes = [] } = useTrialTypes();

  // Загрузка всех культур (без фильтра по группе)
  const { data: cultures = [], isLoading: culturesLoading, error: culturesError } = useQuery({
    queryKey: ['cultures', 'all'],
    queryFn: () => {
      return dictionariesService.cultures.getAll();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: true, // Всегда загружаем культуры
    onError: (error) => {
      console.error('❌ Ошибка загрузки культур:', error);
    },
    onSuccess: (data) => {
    },
  });

  // Пользователи пока не загружаются (endpoint может не существовать)
  // Если нужно - добавить отдельный хук useUsers()
  const users: any[] = [];

  // Отладка состояния загрузки
  if (import.meta.env.DEV) {
    // console.log('🔍 useDictionaries состояние:', {
    //   oblasts: { data: oblasts, loading: oblastsLoading, error: oblastsError },
    //   cultures: { data: cultures, loading: culturesLoading, error: culturesError },
    //   cultureGroups: { data: cultureGroups, loading: cultureGroupsLoading, error: cultureGroupsError },
    // });
  }

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
    // Добавляем состояние загрузки для отладки
    loading: {
      oblasts: oblastsLoading,
      cultures: culturesLoading,
      cultureGroups: cultureGroupsLoading,
    },
    errors: {
      oblasts: oblastsError,
      cultures: culturesError,
      cultureGroups: cultureGroupsError,
    },
  };
};
