/**
 * Утилиты для сохранения и восстановления состояния формы в localStorage
 */

const STORAGE_KEY_PREFIX = 'application_create_form_';
const STORAGE_EXPIRY_HOURS = 24; // Данные хранятся 24 часа

interface StoredFormData {
  data: any;
  timestamp: number;
  version: string; // Версия структуры данных для миграций
}

/**
 * Сохраняет данные формы в localStorage
 */
export const saveFormToStorage = (formId: string, data: any): void => {
  try {
    const storageData: StoredFormData = {
      data,
      timestamp: Date.now(),
      version: '1.0',
    };

    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${formId}`,
      JSON.stringify(storageData)
    );
  } catch (error) {
    console.error('Failed to save form to localStorage:', error);
    // Игнорируем ошибки localStorage (например, когда квота превышена)
  }
};

/**
 * Восстанавливает данные формы из localStorage
 * Возвращает null если данные устарели или не найдены
 */
export const loadFormFromStorage = (formId: string): any | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${formId}`);
    if (!stored) return null;

    const storageData: StoredFormData = JSON.parse(stored);

    // Проверяем, не устарели ли данные
    const hoursSinceStorage =
      (Date.now() - storageData.timestamp) / (1000 * 60 * 60);

    if (hoursSinceStorage > STORAGE_EXPIRY_HOURS) {
      clearFormFromStorage(formId);
      return null;
    }

    return storageData.data;
  } catch (error) {
    console.error('Failed to load form from localStorage:', error);
    return null;
  }
};

/**
 * Удаляет сохраненные данные формы
 */
export const clearFormFromStorage = (formId: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${formId}`);
  } catch (error) {
    console.error('Failed to clear form from localStorage:', error);
  }
};

/**
 * Проверяет, есть ли сохраненные данные для формы
 */
export const hasStoredForm = (formId: string): boolean => {
  const data = loadFormFromStorage(formId);
  return data !== null;
};

/**
 * Получает метаданные сохраненной формы (без загрузки данных)
 */
export const getStoredFormMetadata = (
  formId: string
): { timestamp: number; age: string } | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${formId}`);
    if (!stored) return null;

    const storageData: StoredFormData = JSON.parse(stored);
    const minutesAgo = Math.floor(
      (Date.now() - storageData.timestamp) / (1000 * 60)
    );

    let age: string;
    if (minutesAgo < 1) {
      age = 'только что';
    } else if (minutesAgo < 60) {
      age = `${minutesAgo} мин. назад`;
    } else {
      const hoursAgo = Math.floor(minutesAgo / 60);
      age = `${hoursAgo} ч. назад`;
    }

    return {
      timestamp: storageData.timestamp,
      age,
    };
  } catch (error) {
    return null;
  }
};
