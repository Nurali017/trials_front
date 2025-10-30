/**
 * Константы для query keys в React Query
 * Централизованное хранение для предотвращения опечаток и дублирования
 */

export const QUERY_KEYS = {
  // Сорта
  availableSorts: ['trials', 'available-sorts'] as const,
  sortRecords: ['sort-records'] as const,
  patentsSorts: ['patents-sorts'] as const,

  // Культуры
  cultureGroups: ['culture-groups'] as const,
  cultures: ['cultures'] as const,
  patentsCultureGroups: ['patents', 'culture-groups'] as const,
  patentsCultures: ['patents', 'cultures'] as const,

  // Заявки
  applications: ['applications'] as const,
  application: (id: number) => ['applications', id] as const,

  // Документы
  documents: ['documents'] as const,
  applicationDocuments: (applicationId: number) => ['documents', 'application', applicationId] as const,
  trialDocuments: (trialId: number) => ['documents', 'trial', trialId] as const,

  // Области
  oblasts: ['oblasts'] as const,

  // Оригинаторы
  originators: ['originators'] as const,

  // Испытания
  trials: ['trials'] as const,
  trial: (id: number) => ['trials', id] as const,
} as const;

/**
 * Инвалидация связанных query keys для сортов
 */
export const invalidateSortQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.availableSorts });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sortRecords });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patentsSorts });
};
