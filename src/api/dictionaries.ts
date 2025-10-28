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
      
      while (nextUrl) {
        const queryParams = { ...params, page: pageNum, page_size: 100 };
        const { data }: { data: { results: Region[]; next: string | null; count: number } | Region[] } = await apiClient.get<{ results: Region[]; next: string | null; count: number } | Region[]>(
          nextUrl.startsWith('http') ? nextUrl : '/regions/',
          nextUrl.startsWith('http') ? undefined : { params: queryParams }
        );
        
        if (Array.isArray(data)) {
          // Если пришел массив напрямую - возвращаем его
          return data;
        } else {
          // Пагинированный ответ
          allRegions = [...allRegions, ...data.results];
          nextUrl = data.next;
          pageNum++;
          
          // Защита от бесконечного цикла
          if (pageNum > 50) {
            console.warn('⚠️ Достигнут лимит страниц');
            break;
          }
        }
      }
      
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
      is_required?: boolean;
      is_recommended?: boolean;
      is_auto_calculated?: boolean;
    }) => {
      // Загружаем все показатели, обходя пагинацию
      let allIndicators: any[] = [];
      let nextUrl: string | null = '/indicators/';
      let pageNum = 1;
      
      while (nextUrl) {
        const queryParams = { ...params, page: pageNum, page_size: 100 };
        const { data }: { data: { results: any[]; next: string | null; count: number } | any[] } = await apiClient.get<{ results: any[]; next: string | null; count: number } | any[]>(
          nextUrl.startsWith('http') ? nextUrl : '/indicators/',
          nextUrl.startsWith('http') ? undefined : { params: queryParams }
        );
        
        if (Array.isArray(data)) {
          // Если пришел массив напрямую - возвращаем его
          return data;
        } else {
          // Пагинированный ответ
          allIndicators = [...allIndicators, ...data.results];
          nextUrl = data.next;
          pageNum++;
          
          // Защита от бесконечного цикла
          if (pageNum > 50) {
            console.warn('⚠️ Достигнут лимит страниц');
            break;
          }
        }
      }
      
      return allIndicators;
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

  // Culture Groups (from Patents API)
  cultureGroups: {
    getAll: async () => {
      try {
        const { data } = await apiClient.get<CultureGroup[]>('/patents/group-cultures/');
        return data || [];
      } catch (error) {
        console.error('❌ Ошибка загрузки групп культур из Patents API:', error);
        
        // Fallback: получаем данные из заявок
        try {
          const { data: applicationsData } = await apiClient.get<{ results: any[] }>('/applications/', { 
            params: { page_size: 1000 } 
          });
          
          const applications = applicationsData?.results || [];
          const groupsMap = new Map();
          
          applications.forEach(app => {
            if (app.sort_record_data?.culture_group_name) {
              groupsMap.set(app.sort_record_data.culture_group_name, {
                id: Math.random(),
                name: app.sort_record_data.culture_group_name,
                group_culture_id: Math.random()
              });
            }
          });
          
          const result = Array.from(groupsMap.values());
          return result;
        } catch (fallbackError) {
          console.error('❌ Ошибка fallback:', fallbackError);
          return [];
        }
      }
    },
    getById: async (id: number) => {
      try {
        const { data } = await apiClient.get<CultureGroup>(`/patents/group-cultures/${id}/`);
        return data;
      } catch (error) {
        console.error('❌ Ошибка получения группы культур по ID:', error);
        return {
          id,
          name: 'Unknown Group',
          group_culture_id: id
        } as CultureGroup;
      }
    },
  },

  // Cultures (from Patents API)
  cultures: {
    getAll: async (params?: { group?: number }) => {
      try {
        const { data } = await apiClient.get<Culture[] | { results: Culture[] }>('/patents/cultures/', { params });
        
        // Бэкенд может вернуть либо массив, либо пагинированный объект с results
        const result = Array.isArray(data) ? data : data.results || [];
        return result;
      } catch (error) {
        console.error('❌ Ошибка загрузки культур из Patents API:', error);
        
        // Fallback: получаем данные из заявок
        try {
          const { data: applicationsData } = await apiClient.get<{ results: any[] }>('/applications/', { 
            params: { page_size: 1000 } 
          });
          
          const applications = applicationsData?.results || [];
          const culturesMap = new Map();
          
          applications.forEach(app => {
            if (app.sort_record_data?.culture_name) {
              culturesMap.set(app.sort_record_data.culture_name, {
                id: app.sort_record_data.culture || Math.random(),
                name: app.sort_record_data.culture_name,
                culture_group: app.sort_record_data.culture_group,
                culture_group_name: app.sort_record_data.culture_group_name
              });
            }
          });
          
          let result = Array.from(culturesMap.values());
          
          // Фильтруем по группе если указана
          if (params?.group) {
            result = result.filter(culture => 
              culture.culture_group === params.group || 
              culture.culture_group_name === params.group
            );
          }
          
          return result;
        } catch (fallbackError) {
          console.error('❌ Ошибка fallback:', fallbackError);
          return [];
        }
      }
    },
    getById: async (id: number) => {
      try {
        const { data } = await apiClient.get<Culture>(`/patents/cultures/${id}/`);
        return data;
      } catch (error) {
        console.error('❌ Ошибка получения культуры по ID:', error);
        return {
          id,
          name: 'Unknown Culture',
          culture_group: undefined
        } as Culture;
      }
    },
  },

  // Originators
  originators: {
    getAll: async (params?: {
      search?: string;
      is_foreign?: boolean;
      is_nanoc?: boolean;
      has_code?: boolean;
      ordering?: string;
    }) => {
      const { data } = await apiClient.get<Originator[]>('/patents/ariginators/', { params });
      return data;
    },
    getById: async (id: number) => {
      const { data } = await apiClient.get<Originator>(`/patents/ariginators/${id}/`);
      return data;
    },
    create: async (payload: Omit<Originator, 'id' | 'originator_id' | 'synced_at' | 'created_at' | 'updated_at'>) => {
      const { data } = await apiClient.post<Originator>('/patents/ariginators/', payload);
      return data;
    },
    update: async (id: number, payload: Partial<Originator>) => {
      const { data } = await apiClient.patch<Originator>(`/patents/ariginators/${id}/`, payload);
      return data;
    },
    delete: async (id: number) => {
      await apiClient.delete(`/patents/ariginators/${id}/`);
    },
    getStatistics: async () => {
      const { data } = await apiClient.get<{
        total_count: number;
        foreign_count: number;
        domestic_count: number;
        nanoc_count: number;
        with_code_count: number;
        without_code_count: number;
      }>('/patents/ariginators/statistics/');
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
