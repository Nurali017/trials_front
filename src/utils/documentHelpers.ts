import type { DocumentType } from '@/types/api.types';

/**
 * Человекочитаемые названия типов документов
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  // Обязательные документы для заявки
  application_for_testing: 'Заявление на испытание',
  breeding_questionnaire: 'Анкета селекционного достижения',
  variety_description: 'Описание сорта',
  plant_photo_with_ruler: 'Фото растения с линейкой',
  
  // Условно обязательные
  right_to_submit: 'Документ о праве подачи заявки',
  gmo_free: 'Документ об отсутствии ГМО',
  
  // Прочие документы
  report: 'Отчет по испытанию',
  protocol: 'Протокол заседания комиссии',
  certificate: 'Сертификат',
  decision: 'Решение комиссии',
  other: 'Прочий документ',
};

/**
 * Обязательные типы документов для заявки
 */
export const MANDATORY_APPLICATION_DOCUMENTS: DocumentType[] = [
  'application_for_testing',
  'breeding_questionnaire',
  'variety_description',
  'plant_photo_with_ruler',
];

/**
 * Условно обязательные документы (в зависимости от условий)
 */
export const CONDITIONAL_DOCUMENTS: DocumentType[] = [
  'right_to_submit',
  'gmo_free',
];

/**
 * Документы для испытаний
 */
export const TRIAL_DOCUMENTS: DocumentType[] = [
  'report',
  'protocol',
  'certificate',
  'decision',
  'other',
];

/**
 * Извлекает имя файла без расширения для использования как title
 */
export function getFilenameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Проверяет, является ли документ обязательным для заявки
 */
export function isMandatoryDocument(documentType: DocumentType): boolean {
  return MANDATORY_APPLICATION_DOCUMENTS.includes(documentType);
}

/**
 * Проверяет, является ли документ условно обязательным
 */
export function isConditionalDocument(documentType: DocumentType): boolean {
  return CONDITIONAL_DOCUMENTS.includes(documentType);
}

/**
 * Проверяет, является ли документ документом испытания
 */
export function isTrialDocument(documentType: DocumentType): boolean {
  return TRIAL_DOCUMENTS.includes(documentType);
}

/**
 * Получает список документов для конкретного контекста
 */
export function getAvailableDocumentTypes(context: 'application' | 'trial'): DocumentType[] {
  if (context === 'application') {
    return [
      ...MANDATORY_APPLICATION_DOCUMENTS,
      ...CONDITIONAL_DOCUMENTS,
      'other',
    ];
  }
  
  return TRIAL_DOCUMENTS;
}

/**
 * Получает расширение файла
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || '';
}

/**
 * Получает описание для типа документа (подсказка для пользователя)
 */
export function getDocumentTypeDescription(documentType: DocumentType): string {
  const descriptions: Record<DocumentType, string> = {
    application_for_testing: 'Официальное заявление на проведение испытания сорта',
    breeding_questionnaire: 'Подробная анкета с характеристиками селекционного достижения',
    variety_description: 'Полное описание морфологических и хозяйственных признаков сорта',
    plant_photo_with_ruler: 'Фотография растения с масштабной линейкой для визуальной оценки',
    right_to_submit: 'Требуется, если заявитель не является оригинатором (доверенность, договор)',
    gmo_free: 'Требуется для сортов иностранной селекции',
    report: 'Отчет о результатах проведенного испытания',
    protocol: 'Протокол заседания комиссии по рассмотрению результатов',
    certificate: 'Сертификат или удостоверение',
    decision: 'Официальное решение комиссии',
    other: 'Любые другие документы, относящиеся к делу',
  };
  
  return descriptions[documentType];
}

/**
 * Получает иконку для типа документа (emoji для UI)
 */
export function getDocumentTypeIcon(documentType: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    application_for_testing: '📝',
    breeding_questionnaire: '📋',
    variety_description: '📄',
    plant_photo_with_ruler: '📸',
    right_to_submit: '📑',
    gmo_free: '🧬',
    report: '📊',
    protocol: '📜',
    certificate: '🏆',
    decision: '⚖️',
    other: '📎',
  };
  
  return icons[documentType];
}

