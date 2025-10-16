import apiClient from './client';

// ============ TYPES ============

export interface AnnualDecisionTable {
  id: number;
  year: number;
  oblast: number;
  oblast_name: string;
  culture: number | null;
  culture_name: string | null;
  status: 'draft' | 'finalized';
  status_display: string;
  title: string;
  created_by: number;
  created_by_name: string;
  finalized_by: number | null;
  finalized_by_name: string | null;
  finalized_date: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
  decisions_count: number;
  progress_percentage: number;
  statistics: TableStatistics;
}

export interface AnnualDecisionTableDetail extends AnnualDecisionTable {
  items: AnnualDecisionItem[];
}

export interface AnnualDecisionItem {
  id: number;
  row_number: number;
  sort_record: number;
  sort_name: string;
  sort_public_code: string;
  sort_id: number;
  maturity_group: string;
  yields_by_year: YieldsByYear;
  average_yield: number;
  deviation_from_standard: number;
  last_year_data: LastYearData;
  years_tested: number;
  year_started: number;
  decision: 'pending' | 'approved' | 'continue' | 'removed';
  decision_display: string;
  decision_justification: string;
  decision_recommendations: string;
  recommended_zones: RecommendedZone[];
  continue_reason: string | null;
  continue_until_year: number | null;
  removal_reason: string | null;
  decision_date: string | null;
  decided_by: number | null;
  decided_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnualDecisionItemDetail extends AnnualDecisionItem {
  sort_record_detail: SortRecordDetail;
  trials_data: TrialData[];
}

export interface YieldsByYear {
  [year: string]: number; // {"2022": 125, "2023": 210, "2024": 97}
}

export interface LastYearData {
  tuber_weight?: number;
  taste_score?: number;
  marketable_percentage?: number;
  damage_resistance?: number;
  hollow_heart?: number;
  diseases?: {
    dry_rot?: number;
    scab?: number;
    brown_spot?: number;
  };
  pests?: {
    wireworm?: number;
    wet_rot?: number;
  };
  biochemistry?: {
    starch_content?: { [year: string]: number };
    dry_matter?: { [year: string]: number };
    vitamin_c?: { [year: string]: number };
  };
}

export interface RecommendedZone {
  climate_zone_id: number;
  climate_zone_name: string;
  region_ids: number[];
}

export interface TableStatistics {
  total: number;
  approved: number;
  removed: number;
  continue: number;
  pending: number;
}

export interface TrialData {
  id: number;
  year: number;
  region_name: string;
  status: string;
  status_display: string;
}

export interface SortRecordDetail {
  id: number;
  name: string;
  culture: {
    id: number;
    name: string;
  };
  originators: Array<{
    name: string;
    percentage: number;
  }>;
}

// ============ REQUEST TYPES ============

export interface CreateTableRequest {
  year: number;
  oblast: number;
  culture?: number;
  auto_populate?: boolean;
  include_year_3?: boolean;
  include_year_2?: boolean;
  include_year_1?: boolean;
}

export interface DecisionFormData {
  decision: 'approved' | 'continue' | 'removed';
  decision_justification: string;
  decision_recommendations?: string;
  recommended_zones?: RecommendedZone[];
  continue_reason?: string;
  continue_until_year?: number;
  removal_reason?: string;
}

export interface TableFilters {
  oblast_id?: number;
  year?: number;
  status?: 'draft' | 'finalized';
  culture_id?: number;
}

// ============ RESPONSE TYPES ============

export interface AnnualTablesListResponse {
  count: number;
  results: AnnualDecisionTable[];
}

export interface MakeDecisionResponse {
  success: boolean;
  message: string;
  item: AnnualDecisionItem;
  table_progress: number;
}

export interface FinalizeTableResponse {
  success: boolean;
  message: string;
  table: AnnualDecisionTable;
}

export interface FinalizeTableErrorResponse {
  success: false;
  error: string;
  details: {
    total: number;
    decided: number;
    pending: number;
  };
}

export interface StatisticsResponse {
  table_id: number;
  year: number;
  oblast: string;
  statistics: TableStatistics;
  progress_percentage: number;
  is_complete: boolean;
}

// ============ SERVICE ============

class AnnualDecisionsService {
  // Список таблиц
  async getTables(filters?: TableFilters): Promise<AnnualTablesListResponse> {
    const response = await apiClient.get('/annual-decision-tables/', { params: filters });
    return response.data;
  }

  // Создать таблицу
  async createTable(data: CreateTableRequest): Promise<AnnualDecisionTable> {
    const response = await apiClient.post('/annual-decision-tables/', data);
    return response.data;
  }

  // Детали таблицы
  async getTableDetails(id: number): Promise<AnnualDecisionTableDetail> {
    const response = await apiClient.get(`/annual-decision-tables/${id}/`);
    return response.data;
  }

  // Завершить таблицу
  async finalizeTable(id: number): Promise<FinalizeTableResponse | FinalizeTableErrorResponse> {
    const response = await apiClient.post(`/annual-decision-tables/${id}/finalize/`);
    return response.data;
  }

  // Экспорт в Excel
  async exportExcel(id: number): Promise<Blob> {
    const response = await apiClient.get(
      `/annual-decision-tables/${id}/export-excel/`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Статистика таблицы
  async getStatistics(id: number): Promise<StatisticsResponse> {
    const response = await apiClient.get(`/annual-decision-tables/${id}/statistics/`);
    return response.data;
  }

  // Элементы таблицы
  async getItems(tableId: number): Promise<AnnualDecisionItem[]> {
    const response = await apiClient.get('/annual-decision-items/', {
      params: { table_id: tableId }
    });
    return response.data.results;
  }

  // Детали элемента
  async getItemDetails(itemId: number): Promise<AnnualDecisionItemDetail> {
    const response = await apiClient.get(`/annual-decision-items/${itemId}/`);
    return response.data;
  }

  // Принять решение
  async makeDecision(itemId: number, data: DecisionFormData): Promise<MakeDecisionResponse> {
    const response = await apiClient.post(
      `/annual-decision-items/${itemId}/make-decision/`,
      data
    );
    return response.data;
  }

  // Сбросить решение
  async resetDecision(itemId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/annual-decision-items/${itemId}/reset-decision/`);
    return response.data;
  }

  // Обновить данные элемента
  async refreshItemData(itemId: number): Promise<{ success: boolean; message: string; item: Partial<AnnualDecisionItem> }> {
    const response = await apiClient.post(`/annual-decision-items/${itemId}/refresh-data/`);
    return response.data;
  }
}

export const annualDecisionsService = new AnnualDecisionsService();
