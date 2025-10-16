import apiClient from './client';

// Patents Service API Types
export interface PatentsSort {
  id: number;
  name: string;
  code: string;
  status: number;
  applicant_data: boolean;
  lifestyle: number;
  characteristic: number;
  development_cycle: number;
  culture: {
    id: number;
    name: string;
    code: string | null;
    group: {
      id: number;
      name: string;
      description: string;
      code: string;
    };
  };
  ariginators: Array<{
    id: number;
    ariginator: {
      id: number;
      name: string;
    };
    percentage: number;
  }>;
  note: string | null;
  applicant: string;
  patent_nis: boolean;
  images: Array<{
    id: number;
    image: string;
    description?: string;
  }>;
  created_at: string;
}

export interface PatentsCulture {
  id: number;
  name: string;
  code?: string;
  culture_group?: number;
  culture_group_name?: string;
  description?: string;
}

export interface PatentsCultureGroup {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface PatentsOriginator {
  id: number;
  name: string;
  country: string;
  description?: string;
}

export interface PatentsSearchParams {
  search?: string;
  culture?: number;
  group?: number;
  applicant?: string;
  originator?: number;
  patent_nis?: boolean;
}

// Patents API returns array directly, not paginated response
export type PatentsSearchResponse = PatentsSort[];

export interface CreateSortRequest {
  name: string;
  code?: string;
  culture: number;
  lifestyle: number;
  characteristic: number;
  development_cycle: number;
  applicant?: string;
  patent_nis?: boolean;
  note?: string | null;
  status?: number;
  ariginators?: Array<{
    ariginator_id: number;
    percentage: number;
  }>;
}

export const patentsService = {
  // Search sorts with advanced filtering
  searchSorts: async (params: PatentsSearchParams = {}): Promise<PatentsSearchResponse> => {
    const { data } = await apiClient.get<PatentsSearchResponse>('/patents/sorts/', { params });
    return data;
  },

  // Get sort by ID
  getSortById: async (id: number): Promise<PatentsSort> => {
    const { data } = await apiClient.get<PatentsSort>(`/patents/sorts/${id}/`);
    return data;
  },

  // Create new sort
  createSort: async (sortData: CreateSortRequest): Promise<PatentsSort> => {
    const { data } = await apiClient.post<PatentsSort>('/v2/patents/sorts/', sortData);
    return data;
  },

  // Get all cultures
  getCultures: async (params?: { group?: number; search?: string }): Promise<PatentsCulture[]> => {
    const { data } = await apiClient.get<PatentsCulture[] | { results: PatentsCulture[] }>('/patents/cultures/', { params });
    return Array.isArray(data) ? data : data.results || [];
  },

  // Get culture by ID
  getCultureById: async (id: number): Promise<PatentsCulture> => {
    const { data } = await apiClient.get<PatentsCulture>(`/patents/cultures/${id}/`);
    return data;
  },

  // Get all culture groups
  getCultureGroups: async (): Promise<PatentsCultureGroup[]> => {
    const { data } = await apiClient.get<PatentsCultureGroup[]>('/patents/group-cultures/');
    return data;
  },

  // Get culture group by ID
  getCultureGroupById: async (id: number): Promise<PatentsCultureGroup> => {
    const { data } = await apiClient.get<PatentsCultureGroup>(`/patents/group-cultures/${id}/`);
    return data;
  },

  // Get all originators
  getOriginators: async (params?: { search?: string; country?: string }): Promise<PatentsOriginator[]> => {
    const { data } = await apiClient.get<PatentsOriginator[] | { results: PatentsOriginator[] }>('/patents/originators/', { params });
    return Array.isArray(data) ? data : data.results || [];
  },

  // Get originator by ID
  getOriginatorById: async (id: number): Promise<PatentsOriginator> => {
    const { data } = await apiClient.get<PatentsOriginator>(`/patents/originators/${id}/`);
    return data;
  },

  // Get sorts by culture
  getSortsByCulture: async (cultureId: number, params?: { search?: string }): Promise<PatentsSort[]> => {
    const { data } = await apiClient.get<PatentsSort[]>(`/patents/cultures/${cultureId}/sorts/`, { params });
    return data;
  },

  // Get sorts by culture group
  getSortsByCultureGroup: async (groupId: number, params?: { search?: string }): Promise<PatentsSort[]> => {
    const { data } = await apiClient.get<PatentsSort[]>(`/patents/group-cultures/${groupId}/sorts/`, { params });
    return data;
  },
};
