import apiClient from './client';
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  DistributeApplicationRequest,
  Trial,
  ApplicationStatistics,
  PendingApplicationsForRegion,
  CulturesForRegionResponse,
  RegionalStatusResponse,
} from '@/types/api.types';

export const applicationsService = {
  // Get all applications with optional filters
  getAll: async (params?: Record<string, any>) => {
    // Загружаем все заявки, обходя пагинацию
    let allApplications: Application[] = [];
    let nextUrl: string | null = '/applications/';
    let pageNum = 1;
    
    console.log('🔍 Загрузка всех заявок...');
    
    while (nextUrl) {
      const queryParams = { ...params, page: pageNum, page_size: 100 };
      const { data }: { data: { results: Application[]; next: string | null; count: number } | Application[] } = await apiClient.get<{ results: Application[]; next: string | null; count: number } | Application[]>(
        nextUrl.startsWith('http') ? nextUrl : '/applications/',
        nextUrl.startsWith('http') ? undefined : { params: queryParams }
      );
      
      if (Array.isArray(data)) {
        // Если пришел массив напрямую - возвращаем его
        console.log('✅ Получен массив заявок:', data.length);
        return data;
      } else {
        // Пагинированный ответ
        allApplications = [...allApplications, ...data.results];
        nextUrl = data.next;
        console.log(`📄 Страница ${pageNum}: получено ${data.results.length}, всего ${allApplications.length} из ${data.count}`);
        pageNum++;
        
        // Защита от бесконечного цикла
        if (pageNum > 50) {
          console.warn('⚠️ Достигнут лимит страниц');
          break;
        }
      }
    }
    
    console.log(`✅ Загружено всего заявок: ${allApplications.length}`);
    return allApplications;
  },

  // Get single application by ID
  getById: async (id: number) => {
    const { data } = await apiClient.get<Application>(`/applications/${id}/`);
    return data;
  },

  // Create new application
  create: async (payload: CreateApplicationRequest) => {
    const { data } = await apiClient.post<Application>('/applications/', payload);
    return data;
  },

  // Update application
  update: async (id: number, payload: UpdateApplicationRequest) => {
    const { data } = await apiClient.put<Application>(`/applications/${id}/`, payload);
    return data;
  },

  // Partial update
  patch: async (id: number, payload: Partial<UpdateApplicationRequest>) => {
    const { data } = await apiClient.patch<Application>(`/applications/${id}/`, payload);
    return data;
  },

  // Delete application
  delete: async (id: number) => {
    await apiClient.delete(`/applications/${id}/`);
  },

  // Distribute application to regions
  distribute: async (id: number, payload: DistributeApplicationRequest) => {
    const { data } = await apiClient.post<{ trials: Trial[]; application: Application }>(
      `/applications/${id}/distribute/`,
      payload
    );
    return data;
  },

  // Get regional trials for application
  getRegionalTrials: async (id: number) => {
    const { data } = await apiClient.get<Trial[]>(`/applications/${id}/regional-trials/`);
    return data;
  },

  // ⭐ Новый метод: Получить статусы по областям (многолетние испытания)
  getRegionalStatus: async (id: number) => {
    const { data } = await apiClient.get<RegionalStatusResponse>(
      `/applications/${id}/regional-status/`
    );
    return data;
  },

  // Get decisions for application
  getDecisions: async (id: number) => {
    const { data } = await apiClient.get(`/applications/${id}/decisions/`);
    return data;
  },

  // Get statistics
  getStatistics: async () => {
    const { data } = await apiClient.get<ApplicationStatistics>('/applications/statistics/');
    return data;
  },

  // Get cultures with applications for region
  getCulturesForRegion: async (regionId: number) => {
    const { data } = await apiClient.get<CulturesForRegionResponse>(
      '/applications/cultures-for-region/',
      { params: { region_id: regionId } }
    );
    return data;
  },

  // Get pending applications for region (culture_id optional)
  getPendingForRegion: async (regionId: number, cultureId?: number) => {
    const { data } = await apiClient.get<PendingApplicationsForRegion>(
      '/applications/pending-for-region/',
      { params: { region_id: regionId, culture_id: cultureId } }
    );
    return data;
  },
};
