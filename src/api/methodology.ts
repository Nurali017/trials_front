import apiClient from './client';
import { MethodologyTableResponse, MethodologyTableFilters } from '@/types/methodology.types';
import { SummaryResponse, SummaryFilters } from '@/types/summary.types';

class MethodologyService {
  // Получить таблицу методологии
  async getMethodologyTable(filters: MethodologyTableFilters): Promise<MethodologyTableResponse> {
    const response = await apiClient.get('/annual-reports/methodology_table/', {
      params: {
        year: filters.year,
        oblast_id: filters.oblast_id,
        culture_id: filters.culture_id
      }
    });
    return response.data;
  }

  // Получить сводный отчет
  async getSummary(filters: SummaryFilters): Promise<SummaryResponse> {
    const response = await apiClient.get('/annual-reports/summary/', {
      params: {
        year: filters.year,
        oblast_id: filters.oblast_id
      }
    });
    return response.data;
  }
}

export const methodologyService = new MethodologyService();
