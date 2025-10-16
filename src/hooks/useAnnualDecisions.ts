import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { annualDecisionsService } from '@/api/annualDecisions';
import type {
  AnnualDecisionTable,
  AnnualDecisionTableDetail,
  AnnualDecisionItem,
  AnnualDecisionItemDetail,
  CreateAnnualTableRequest,
  AnnualDecisionFormData,
  AnnualTableFilters,
  MakeDecisionResponse,
  FinalizeTableResponse,
  StatisticsResponse,
} from '@/types/api.types';

// ============ QUERY KEYS ============

export const annualDecisionKeys = {
  all: ['annual-decisions'] as const,
  tables: () => [...annualDecisionKeys.all, 'tables'] as const,
  tablesList: (filters?: AnnualTableFilters) => [...annualDecisionKeys.tables(), 'list', filters] as const,
  table: (id: number) => [...annualDecisionKeys.tables(), 'detail', id] as const,
  items: (tableId: number) => [...annualDecisionKeys.tables(), 'items', tableId] as const,
  item: (itemId: number) => [...annualDecisionKeys.all, 'items', itemId] as const,
  statistics: (id: number) => [...annualDecisionKeys.tables(), 'statistics', id] as const,
};

// ============ QUERIES ============

// Получить список годовых таблиц
export const useAnnualTables = (filters?: AnnualTableFilters) => {
  return useQuery({
    queryKey: annualDecisionKeys.tablesList(filters),
    queryFn: () => annualDecisionsService.getTables(filters),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

// Получить детали годовой таблицы
export const useAnnualTable = (id: number, enabled = true) => {
  return useQuery({
    queryKey: annualDecisionKeys.table(id),
    queryFn: () => annualDecisionsService.getTableDetails(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
};

// Получить детали элемента таблицы
export const useAnnualDecisionItem = (itemId: number, enabled = true) => {
  return useQuery({
    queryKey: annualDecisionKeys.item(itemId),
    queryFn: () => annualDecisionsService.getItemDetails(itemId),
    enabled: enabled && !!itemId,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

// Получить статистику таблицы
export const useAnnualTableStatistics = (id: number, enabled = true) => {
  return useQuery({
    queryKey: annualDecisionKeys.statistics(id),
    queryFn: () => annualDecisionsService.getStatistics(id),
    enabled: enabled && !!id,
    staleTime: 1 * 60 * 1000, // 1 минута
  });
};

// ============ MUTATIONS ============

// Создать годовую таблицу
export const useCreateAnnualTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnnualTableRequest) => annualDecisionsService.createTable(data),
    onSuccess: (newTable) => {
      // Инвалидировать список таблиц
      queryClient.invalidateQueries({ queryKey: annualDecisionKeys.tables() });
      
      // Предварительно добавить новую таблицу в кэш
      queryClient.setQueryData(annualDecisionKeys.table(newTable.id), newTable);
    },
  });
};

// Принять решение по элементу
export const useMakeDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: AnnualDecisionFormData }) =>
      annualDecisionsService.makeDecision(itemId, data),
    onSuccess: (response: MakeDecisionResponse, { itemId }) => {
      // Обновить элемент в кэше
      queryClient.setQueryData(annualDecisionKeys.item(itemId), (oldData: AnnualDecisionItemDetail | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            decision: response.item.decision,
            decision_display: response.item.decision_display,
            decision_date: response.item.decision_date,
            decided_by: response.item.decided_by,
            decided_by_name: response.item.decided_by_name,
            updated_at: response.item.updated_at,
          };
        }
        return oldData;
      });

      // Инвалидировать связанные запросы
      queryClient.invalidateQueries({ queryKey: annualDecisionKeys.tables() });
      queryClient.invalidateQueries({ queryKey: annualDecisionKeys.statistics(response.item.id) });
    },
  });
};

// Завершить таблицу
export const useFinalizeAnnualTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => annualDecisionsService.finalizeTable(id),
    onSuccess: (response: FinalizeTableResponse, tableId) => {
      // Обновить таблицу в кэше
      queryClient.setQueryData(annualDecisionKeys.table(tableId), (oldData: AnnualDecisionTableDetail | undefined) => {
        if (oldData && response.success) {
          return {
            ...oldData,
            status: response.table.status,
            status_display: response.table.status_display,
            finalized_by: response.table.finalized_by,
            finalized_by_name: response.table.finalized_by_name,
            finalized_date: response.table.finalized_date,
            updated_at: response.table.updated_at,
          };
        }
        return oldData;
      });

      // Инвалидировать список таблиц
      queryClient.invalidateQueries({ queryKey: annualDecisionKeys.tables() });
    },
  });
};

// Сбросить решение
export const useResetDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => annualDecisionsService.resetDecision(itemId),
    onSuccess: (_, itemId) => {
      // Инвалидировать элемент
      queryClient.invalidateQueries({ queryKey: annualDecisionKeys.item(itemId) });
      
      // Инвалидировать связанные таблицы
      queryClient.invalidateQueries({ queryKey: annualDecisionKeys.tables() });
    },
  });
};

// Обновить данные элемента
export const useRefreshItemData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => annualDecisionsService.refreshItemData(itemId),
    onSuccess: (response, itemId) => {
      // Обновить элемент в кэше
      queryClient.setQueryData(annualDecisionKeys.item(itemId), (oldData: AnnualDecisionItemDetail | undefined) => {
        if (oldData && response.success) {
          return {
            ...oldData,
            ...response.item,
          };
        }
        return oldData;
      });

      // Инвалидировать таблицу
      queryClient.invalidateQueries({ queryKey: annualDecisionKeys.tables() });
    },
  });
};

// Экспорт в Excel
export const useExportAnnualTableExcel = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const blob = await annualDecisionsService.exportExcel(id);
      
      // Создать ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `annual_table_${id}.xlsx`;
      link.click();
      
      // Очистить URL
      window.URL.revokeObjectURL(url);
      
      return blob;
    },
  });
};


