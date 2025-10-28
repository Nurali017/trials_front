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
  ApplicationFilters,
  CultureGroupsStatisticsResponse,
} from '@/types/api.types';

export const applicationsService = {
  // Get applications with filters and pagination
  getAll: async (params?: ApplicationFilters) => {
    const { data } = await apiClient.get<{ 
      count: number; 
      next: string | null; 
      previous: string | null; 
      results: Application[] 
    }>('/applications/', { params });
    
    return data;
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

  // Get culture groups statistics
  getCultureGroupsStatistics: async (filters?: { year?: number; status?: string; oblast?: number }) => {
    const { data } = await apiClient.get<CultureGroupsStatisticsResponse>(
      '/applications/culture-groups-stats/',
      { params: filters }
    );
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
