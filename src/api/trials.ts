import apiClient from './client';
import type { 
  Trial, 
  MakeDecisionRequest, 
  CreateSortRequest, 
  AvailableSort, 
  TrialType,
  CreateTrialRequest,
  TrialParticipant,
  CreateTrialParticipantRequest,
  BulkCreateParticipantsRequest,
  MarkSentToLabRequest,
  LaboratoryBulkEntryRequest,
  LaboratoryCompleteRequest,
} from '@/types/api.types';

export const trialsService = {
  // Get all trials with optional filters
  getAll: async (params?: Record<string, any>) => {
    const { data } = await apiClient.get<{ results: Trial[] }>('/trials/', { params });
    return data.results || data;
  },

  // Get single trial by ID
  getById: async (id: number) => {
    const { data } = await apiClient.get<Trial>(`/trials/${id}/`);
    return data;
  },

  // Create trial with participants
  create: async (payload: CreateTrialRequest) => {
    const { data } = await apiClient.post<Trial>('/trials/', payload);
    return data;
  },

  // Update trial
  update: async (id: number, payload: Partial<Trial>) => {
    const { data } = await apiClient.patch<Trial>(`/trials/${id}/`, payload);
    return data;
  },

  // Make decision on trial
  makeDecision: async (id: number, payload: MakeDecisionRequest) => {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      trial: Trial;
      application_status: string;
    }>(`/trials/${id}/decision/`, payload);
    return data;
  },

  // Laboratory workflow
  // Отметить отправку образцов ВСЕХ участников в лабораторию
  markSentToLab: async (id: number, payload: MarkSentToLabRequest) => {
    const { data } = await apiClient.post<Trial>(
      `/trials/${id}/mark-sent-to-lab/`,
      payload
    );
    return data;
  },

  // Внести лабораторные результаты
  laboratoryBulkEntry: async (id: number, payload: LaboratoryBulkEntryRequest) => {
    const { data } = await apiClient.post<{ success: boolean; created: number }>(
      `/trials/${id}/laboratory-results/bulk-entry/`,
      payload
    );
    return data;
  },

  // Завершить лабораторные анализы
  laboratoryComplete: async (id: number, payload: LaboratoryCompleteRequest) => {
    const { data } = await apiClient.post<Trial>(
      `/trials/${id}/laboratory-complete/`,
      payload
    );
    return data;
  },

  // Завершить испытание (финализировать после всех работ)
  completeTrial: async (id: number) => {
    const { data } = await apiClient.post<Trial>(`/trials/${id}/complete/`);
    return data;
  },

  // Get trial types
  getTrialTypes: async () => {
    const { data } = await apiClient.get<TrialType[] | { results: TrialType[] }>('/trial-types/');
    // Бэкенд может вернуть либо массив, либо пагинированный объект с results
    return Array.isArray(data) ? data : data.results || [];
  },

  // Get available sorts from Patents Service
  getAvailableSorts: async (search?: string, culture?: number) => {
    const { data } = await apiClient.get('/trials/available-sorts/', {
      params: { search, culture },
    });
    return data;
  },

  // Create new sort in Patents Service
  createSort: async (payload: CreateSortRequest) => {
    const { data } = await apiClient.post<AvailableSort>('/patents/sorts/create/', payload);
    return data;
  },

  // Validate sort and get/create SortRecord
  validateSort: async (sortId: number) => {
    const { data } = await apiClient.post<{ sort_record_id: number }>('/trials/validate-sort/', { sort_id: sortId });
    return data;
  },

  // ============ ФОРМА 008 ============

  // Получить структуру формы 008
  getForm008: async (trialId: number) => {
    const { data } = await apiClient.get(`/trials/${trialId}/form008/`);
    return data;
  },

  // Сохранить форму 008
  saveForm008: async (trialId: number, payload: {
    is_final: boolean;
    harvest_date?: string;
    participants: Array<{
      participant_id: number;
      results: Record<string, number | null>;
    }>;
  }) => {
    const { data } = await apiClient.post(`/trials/${trialId}/form008/bulk-save/`, payload);
    return data;
  },
};

// Trial Participants service
export const trialParticipantsService = {
  // Get all participants for a trial
  getByTrial: async (trialId: number) => {
    const { data } = await apiClient.get<TrialParticipant[]>(`/trial-participants/?trial=${trialId}`);
    return data;
  },

  // Get single participant
  getById: async (id: number) => {
    const { data } = await apiClient.get<TrialParticipant>(`/trial-participants/${id}/`);
    return data;
  },

  // Create single participant
  create: async (payload: CreateTrialParticipantRequest) => {
    const { data } = await apiClient.post<TrialParticipant>('/trial-participants/', payload);
    return data;
  },

  // Bulk create participants
  bulkCreate: async (payload: BulkCreateParticipantsRequest) => {
    const { data } = await apiClient.post<{ success: boolean; participants: TrialParticipant[] }>(
      '/trial-participants/bulk-create/',
      payload
    );
    return data;
  },

  // Update participant
  update: async (id: number, payload: Partial<TrialParticipant>) => {
    const { data } = await apiClient.patch<TrialParticipant>(`/trial-participants/${id}/`, payload);
    return data;
  },

  // Delete participant
  delete: async (id: number) => {
    await apiClient.delete(`/trial-participants/${id}/`);
  },
};
