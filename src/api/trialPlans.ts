import apiClient from './client';

// Types for Trial Plans - Новая 5-уровневая структура
// План → Культура → Тип испытания → Участник → Trial

export interface TrialPlanTrial {
  id: number;
  region_id: number;
  region_name: string;
  predecessor: string | number; // "fallow" или culture_id
  predecessor_culture_name?: string;
  seeding_rate: number;
  season: 'spring' | 'autumn' | 'summer' | 'winter';
}

export interface TrialPlanParticipant {
  id: number;
  participant_number: number;
  patents_sort_id: number;
  sort_name?: string; // Название сорта
  statistical_group: 0 | 1; // 0 = стандарт, 1 = испытываемый
  seeds_provision: 'provided' | 'imported' | 'purchased';
  maturity_group: string;
  application_id?: number | null;
  year_started?: number; // Год начала испытания (из заявки)
  trials: TrialPlanTrial[]; // Trials по регионам
}

// ⭐ НОВЫЙ УРОВЕНЬ: Тип испытания внутри культуры
export interface PlanCultureTrialType {
  id: number;
  trial_type_id: number;
  trial_type_name: string;
  trial_type_code?: string;
  season: 'spring' | 'autumn' | 'summer' | 'winter'; // ⭐ Сезон для этого типа испытания
  participants: TrialPlanParticipant[]; // Участники этого типа испытания
}

export interface PlanCulture {
  id: number;
  culture: number;
  culture_name: string;
  culture_group: string;
  trial_types: PlanCultureTrialType[]; // ⭐ Типы испытаний в культуре
  created_by: number;
  created_at: string;
  updated_at: string;
}

export type TrialPlanStatus = 'planned' | 'structured' | 'distributed' | 'finalized';

export interface TrialPlan {
  id: number;
  year: number;
  oblast: number | { id: number; name: string }; // ID области или объект
  oblast_name?: string; // Название области
  season?: 'spring' | 'autumn' | 'summer' | 'winter';
  status: TrialPlanStatus;
  cultures?: PlanCulture[]; // Культуры в плане с вложенными trial_types
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTrialPlanRequest {
  year: number;
  oblast: number;
  status?: TrialPlanStatus;
}

export interface UpdateTrialPlanRequest extends Partial<CreateTrialPlanRequest> {}

// Запрос для добавления участников
export interface AddParticipantsRequest {
  participants: Array<{
    patents_sort_id?: number; // Для реестра
    sort_name?: string; // Название сорта
    statistical_group: 0 | 1;
    seeds_provision: 'provided' | 'imported' | 'purchased';
    maturity_group: string;
    application?: number; // Для заявок
    trials: Array<{
      region_id: number;
      predecessor: string | number;
      seeding_rate: number;
      season?: 'spring' | 'autumn' | 'summer' | 'winter';
      trial_type_id?: number;
    }>;
  }>;
}

export interface DistributePlanRequest {
  // Пустой объект или дополнительные параметры
}

export interface TrialPlanStatistics {
  plan_id: number;
  total_participants: number;
  from_applications: number;
  from_registry: number;
  maturity_groups: Record<string, number>;
  seeds_provision: Record<string, number>;
  total_trials: number;
  trial_types: Record<string, number>;
  seasons: Record<string, number>;
  status: string;
}

class TrialPlansService {
  // Get all trial plans
  async getTrialPlans(params?: {
    year?: string;
    oblast?: string;
    status?: string;
  }) {
    const response = await apiClient.get('/trial-plans/', { params });
    return response.data;
  }

  // Get trial plan by ID
  async getTrialPlan(id: number): Promise<TrialPlan> {
    const response = await apiClient.get(`/trial-plans/${id}/`);
    return response.data;
  }

  // Create trial plan
  async createTrialPlan(data: CreateTrialPlanRequest): Promise<TrialPlan> {
    const response = await apiClient.post('/trial-plans/', data);
    return response.data;
  }

  // Update trial plan
  async updateTrialPlan(id: number, data: UpdateTrialPlanRequest): Promise<TrialPlan> {
    const response = await apiClient.put(`/trial-plans/${id}/`, data);
    return response.data;
  }

  // Delete trial plan
  async deleteTrialPlan(id: number): Promise<void> {
    await apiClient.delete(`/trial-plans/${id}/`);
  }

  // Add participants to trial plan (старый метод для обратной совместимости)
  async addParticipants(id: number, data: AddParticipantsRequest) {
    const response = await apiClient.post(`/trial-plans/${id}/add-participants/`, data);
    return response.data;
  }

  // ⭐ НОВЫЙ МЕТОД: Add participants to specific trial type
  async addParticipantsToTrialType(
    planId: number, 
    cultureId: number, 
    trialTypeId: number, 
    data: AddParticipantsRequest
  ) {
    const response = await apiClient.post(
      `/trial-plans/${planId}/cultures/${cultureId}/trial-types/${trialTypeId}/add-participants/`, 
      data
    );
    return response.data;
  }

  // Distribute trial plan
  async distributePlan(id: number, data?: DistributePlanRequest) {
    const response = await apiClient.post(`/trial-plans/${id}/distribute/`, data || {});
    return response.data;
  }

  // Get trial plan statistics
  async getTrialPlanStatistics(id: number) {
    const response = await apiClient.get(`/trial-plans/${id}/statistics/`);
    return response.data;
  }

  // Export trial plan to Excel
  async exportTrialPlan(id: number): Promise<Blob> {
    const response = await apiClient.get(`/trial-plans/${id}/export/`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Copy trial plan to next year
  async copyTrialPlan(id: number, targetYear: number): Promise<TrialPlan> {
    const response = await apiClient.post(`/trial-plans/${id}/copy/`, {
      target_year: targetYear,
    });
    return response.data;
  }

  // Suggest applications for plan
  async suggestApplications(params: {
    oblast_id: number;
    culture_id?: number;
    season?: string;
  }) {
    const response = await apiClient.get('/trial-plans/suggest-applications/', { params });
    return response.data;
  }

  // Get predecessor options
  async getPredecessorOptions() {
    const response = await apiClient.get('/trial-plans/predecessor-options/');
    return response.data;
  }

  // Add culture to trial plan
  async addCulture(id: number, cultureId: number) {
    const response = await apiClient.post(`/trial-plans/${id}/add-culture/`, {
      patents_culture_id: cultureId,
    });
    return response.data;
  }

  // Remove culture from trial plan
  async removeCulture(id: number, cultureId: number) {
    const response = await apiClient.delete(`/trial-plans/${id}/remove-culture/${cultureId}/`);
    return response.data;
  }

  // ============ ⭐ НОВЫЕ МЕТОДЫ ДЛЯ ТИПОВ ИСПЫТАНИЙ ============

  // Add trial type to culture in plan
  async addTrialTypeToCulture(
    planId: number, 
    cultureId: number, 
    trialTypeId: number, 
    season: 'spring' | 'autumn' | 'summer' | 'winter'
  ): Promise<PlanCultureTrialType> {
    const response = await apiClient.post(
      `/trial-plans/${planId}/cultures/${cultureId}/add-trial-type/`,
      { 
        trial_type_id: trialTypeId,
        season: season
      }
    );
    return response.data;
  }

  // Remove trial type from culture
  async removeTrialTypeFromCulture(planId: number, cultureId: number, trialTypeId: number) {
    const response = await apiClient.delete(
      `/trial-plans/${planId}/cultures/${cultureId}/trial-types/${trialTypeId}/`
    );
    return response.data;
  }

  // Add participant to trial type
  async addParticipantToTrialType(
    planId: number,
    cultureId: number,
    trialTypeId: number,
    data: {
      patents_sort_id: number;
      maturity_group: string;
      statistical_group: 0 | 1;
      seeds_provision: 'provided' | 'imported' | 'purchased';
      application_id?: number;
    }
  ): Promise<TrialPlanParticipant> {
    const response = await apiClient.post(
      `/trial-plans/${planId}/cultures/${cultureId}/trial-types/${trialTypeId}/add-participant/`,
      data
    );
    return response.data;
  }

  // Add trial (region) to participant
  async addTrialToParticipant(
    planId: number,
    participantId: number,
    data: {
      region_id: number;
      predecessor: string | number;
      seeding_rate: number;
      season: 'spring' | 'autumn' | 'summer' | 'winter';
    }
  ): Promise<TrialPlanTrial> {
    const response = await apiClient.post(
      `/trial-plans/${planId}/participants/${participantId}/add-trial/`,
      data
    );
    return response.data;
  }

  // Remove trial from participant
  async removeTrialFromParticipant(planId: number, participantId: number, trialId: number) {
    const response = await apiClient.delete(
      `/trial-plans/${planId}/participants/${participantId}/trials/${trialId}/`
    );
    return response.data;
  }

  // ============ НОВЫЕ МЕТОДЫ ДЛЯ ФОРМЫ 008 ============

  // Получить задачи агронома по региону
  async getMyTasks(params: { region_id?: number; year?: number }) {
    const response = await apiClient.get('/trial-plans/my-tasks/', { params });
    return response.data;
  }

  // Создать Trial из плана
  async createTrialFromPlan(planId: number, data: {
    region_id: number;
    culture_id: number;
    start_date: string;
    responsible_person?: string;
    harvest_timing?: string;
  }) {
    const response = await apiClient.post(`/trial-plans/${planId}/create-trial/`, data);
    return response.data;
  }
}

export const trialPlansService = new TrialPlansService();
