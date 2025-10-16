import apiClient from './client';
import type { Oblast, Region, ClimateZone, Indicator, Culture, CultureGroup, Originator, SortRecord, TrialType } from '@/types/api.types';

export const dictionariesService = {
  // Oblasts
  oblasts: {
    getAll: async () => {
      const { data } = await apiClient.get<{ results: Oblast[] } | Oblast[]>('/oblasts/', { params: { page_size: 1000 } });
      return Array.isArray(data) ? data : data.results || [];
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<Oblast>(`/oblasts/${id}/`);
      return data;
    },
  },

  // Climate Zones
  climateZones: {
    getAll: async () => {
      const { data } = await apiClient.get<{ results: ClimateZone[] } | ClimateZone[]>('/climate-zones/', { params: { page_size: 1000 } });
      return Array.isArray(data) ? data : data.results || [];
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<ClimateZone>(`/climate-zones/${id}/`);
      return data;
    },
  },

  // Regions
  regions: {
    getAll: async (params?: { oblast?: number; climate_zone?: number }) => {
      // Загружаем все регионы, обходя пагинацию
      let allRegions: Region[] = [];
      let nextUrl: string | null = '/regions/';
      let pageNum = 1;
      
      console.log('🔍 Загрузка всех регионов...');
      
      while (nextUrl) {
        const queryParams = { ...params, page: pageNum, page_size: 100 };
        const { data } = await apiClient.get<{ results: Region[]; next: string | null; count: number } | Region[]>(
          nextUrl.startsWith('http') ? nextUrl : '/regions/',
          nextUrl.startsWith('http') ? undefined : { params: queryParams }
        );
        
        if (Array.isArray(data)) {
          // Если пришел массив напрямую - возвращаем его
          console.log('✅ Получен массив регионов:', data.length);
          return data;
        } else {
          // Пагинированный ответ
          allRegions = [...allRegions, ...data.results];
          nextUrl = data.next;
          console.log(`📄 Страница ${pageNum}: получено ${data.results.length}, всего ${allRegions.length} из ${data.count}`);
          pageNum++;
          
          // Защита от бесконечного цикла
          if (pageNum > 50) {
            console.warn('⚠️ Достигнут лимит страниц');
            break;
          }
        }
      }
      
      console.log('✅ Загружено всего регионов:', allRegions.length);
      return allRegions;
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<Region>(`/regions/${id}/`);
      return data;
    },
  },

  // Indicators
  indicators: {
    getAll: async (params?: { 
      culture?: number; 
      culture_group?: number;
      is_universal?: boolean; 
      is_quality?: boolean; 
      category?: string;
      search?: string;
    }) => {
      const { data } = await apiClient.get<{ results: Indicator[] } | Indicator[]>('/indicators/', { params });
      return Array.isArray(data) ? data : data.results || [];
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<Indicator>(`/indicators/${id}/`);
      return data;
    },
    getByTrial: async (trialId: number) => {
      const { data } = await apiClient.get<Indicator[]>(`/trials/${trialId}/indicators/`);
      return data;
    },
    create: async (payload: Omit<Indicator, 'id'>) => {
      const { data } = await apiClient.post<Indicator>('/indicators/', payload);
      return data;
    },
    update: async (id: number, payload: Partial<Indicator>) => {
      const { data } = await apiClient.patch<Indicator>(`/indicators/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      await apiClient.delete(`/indicators/${id}/`);
    },
  },

  // Culture Groups
  cultureGroups: {
    getAll: async () => {
      const { data } = await apiClient.get<CultureGroup[]>('/patents/group-cultures/');
      return data;
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<CultureGroup>(`/patents/group-cultures/${id}/`);
      return data;
    },
  },

  // Cultures
  cultures: {
    getAll: async (params?: { group?: number }) => {
      const { data } = await apiClient.get<Culture[] | { results: Culture[] }>('/patents/cultures/', { params });
      // Бэкенд может вернуть либо массив, либо пагинированный объект с results
      return Array.isArray(data) ? data : data.results || [];
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<Culture>(`/patents/cultures/${id}/`);
      return data;
    },
  },

  // Originators
  originators: {
    getAll: async () => {
      const { data } = await apiClient.get<Originator[]>('/patents/originators/');
      return data;
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<Originator>(`/patents/originators/${id}/`);
      return data;
    },
  },

  // Sort Records (from Trials Service with proper culture mapping)
  sortRecords: {
    getAll: async (params?: Record<string, any>) => {
      // ВАЖНО: Используем endpoint Trials с маппингом культур (Trials ID → Patents ID)
      // Параметр 'culture' автоматически преобразуется в 'culture_id' для backend
      const modifiedParams = params ? { ...params } : {};
      if (modifiedParams.culture) {
        modifiedParams.culture_id = modifiedParams.culture;
        delete modifiedParams.culture;
      }
      const { data } = await apiClient.get<{ sorts: SortRecord[] }>('/sort-records/by-culture/', { params: modifiedParams });
      // Backend возвращает объект с полем 'sorts', извлекаем массив
      return data.sorts || [];
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<SortRecord>(`/patents/sorts/${id}/`);
      return data;
    },
    // Note: sync endpoints may not exist in Patents API
    sync: async (id: number) => {
      const { data } = await apiClient.post<SortRecord>(`/patents/sorts/${id}/sync/`);
      return data;
    },
    syncAll: async () => {
      const { data } = await apiClient.post('/patents/sorts/sync-all/');
      return data;
    },
  },

  // Trial Types
  trialTypes: {
    getAll: async () => {
      const { data } = await apiClient.get<TrialType[] | { results: TrialType[] }>('/trial-types/');
      // Бэкенд может вернуть либо массив, либо пагинированный объект с results
      return Array.isArray(data) ? data : data.results || [];
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<TrialType>(`/trial-types/${id}/`);
      return data;
    },
  },
};
