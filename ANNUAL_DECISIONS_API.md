# 📊 API МОДУЛЯ ГОДОВЫХ ТАБЛИЦ РЕШЕНИЙ - ФРОНТЕНД ГАЙД

## 🎯 КОНЦЕПЦИЯ

**Годовая таблица решений** - это единый документ на год, содержащий:
- Все сорта, завершившие испытания в области
- Агрегированные данные по годам (урожайность, качество)
- Решение по каждому сорту (одобрить/снять/продолжить)

**Пример:** "Урожай клубней и другие показатели испытываемых сортов картофеля - Костанайская область, 2024"

---

## 🔄 ПРОЦЕСС (кратко)

```
1. Агроном создает годовую таблицу → система автоматически добавляет сорта
2. По каждому сорту агроном принимает решение
3. Когда все решения приняты → таблица завершается
4. Экспорт в Excel/PDF → официальный документ готов
```

---

## 📋 API ENDPOINTS

### 1️⃣ Список годовых таблиц

```http
GET /api/v1/annual-decision-tables/
```

**Query параметры:**
- `oblast_id` - фильтр по области
- `year` - фильтр по году
- `status` - фильтр по статусу (`draft` / `finalized`)
- `culture_id` - фильтр по культуре

**Пример:**
```http
GET /api/v1/annual-decision-tables/?oblast_id=1&year=2024&status=draft
```

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "year": 2024,
      "oblast": 1,
      "oblast_name": "Костанайская область",
      "culture": 5,
      "culture_name": "Картофель",
      "status": "draft",
      "status_display": "Черновик",
      "title": "Годовая таблица решений 2024 - Костанайская область - Картофель",
      "created_by": 2,
      "created_by_name": "Иванов Иван",
      "finalized_by": null,
      "finalized_by_name": null,
      "finalized_date": null,
      "created_at": "2024-10-01T10:00:00Z",
      "updated_at": "2024-10-15T14:30:00Z",
      "items_count": 13,
      "decisions_count": 10,
      "progress_percentage": 76.9,
      "statistics": {
        "total": 13,
        "approved": 8,
        "removed": 1,
        "continue": 1,
        "pending": 3
      }
    }
  ]
}
```

---

### 2️⃣ Создать годовую таблицу

```http
POST /api/v1/annual-decision-tables/
```

**Request:**
```json
{
  "year": 2024,
  "oblast": 1,
  "culture": 5,
  "auto_populate": true,
  "include_year_3": true,
  "include_year_2": true,
  "include_year_1": false
}
```

**Параметры:**
- `year` * - год таблицы
- `oblast` * - ID области
- `culture` - ID культуры (опционально)
- `auto_populate` - автоматически добавить сорта (default: true)
- `include_year_3` - включить сорта на 3-м году (default: true)
- `include_year_2` - включить сорта на 2-м году (default: true)
- `include_year_1` - включить сорта на 1-м году (default: false)

**Response:**
```json
{
  "id": 1,
  "year": 2024,
  "oblast": 1,
  "oblast_name": "Костанайская область",
  "culture": 5,
  "culture_name": "Картофель",
  "status": "draft",
  "title": "Годовая таблица решений 2024 - Костанайская область - Картофель",
  "items_count": 13,
  "decisions_count": 0,
  "progress_percentage": 0,
  "statistics": {
    "total": 13,
    "approved": 0,
    "removed": 0,
    "continue": 0,
    "pending": 13
  }
}
```

---

### 3️⃣ Детали годовой таблицы (с элементами)

```http
GET /api/v1/annual-decision-tables/{id}/
```

**Пример:**
```http
GET /api/v1/annual-decision-tables/1/
```

**Response:**
```json
{
  "id": 1,
  "year": 2024,
  "oblast": 1,
  "oblast_name": "Костанайская область",
  "culture": 5,
  "culture_name": "Картофель",
  "status": "draft",
  "status_display": "Черновик",
  "title": "Годовая таблица решений 2024 - Костанайская область - Картофель",
  "items_count": 13,
  "progress_percentage": 76.9,
  "statistics": {
    "total": 13,
    "approved": 8,
    "removed": 1,
    "continue": 1,
    "pending": 3
  },
  "items": [
    {
      "id": 1,
      "row_number": 1,
      "sort_record": 1774,
      "sort_name": "Коринна",
      "sort_public_code": "KZ-2020-001",
      "sort_id": 1774,
      "maturity_group": "1",
      "yields_by_year": {
        "2022": 125,
        "2023": 210,
        "2024": 97
      },
      "average_yield": 144,
      "deviation_from_standard": 0,
      "last_year_data": {
        "tuber_weight": 142,
        "taste_score": 5,
        "marketable_percentage": 92.5,
        "damage_resistance": 95,
        "hollow_heart": 0,
        "diseases": {
          "dry_rot": 2,
          "scab": 0,
          "brown_spot": 0
        },
        "pests": {
          "wireworm": 0,
          "wet_rot": 0
        },
        "biochemistry": {
          "starch_content": {"2022": 11, "2023": 14.6},
          "dry_matter": {"2022": 21.9, "2023": 21.5},
          "vitamin_c": {"2022": 4.8, "2023": 16.9}
        }
      },
      "years_tested": 3,
      "year_started": 2022,
      "decision": "approved",
      "decision_display": "Одобрено к включению в Госреестр",
      "decision_justification": "Сорт показал стабильную урожайность на уровне стандарта...",
      "decision_recommendations": "Рекомендуется для лесостепной зоны...",
      "recommended_zones": [
        {
          "climate_zone_id": 1,
          "climate_zone_name": "Лесостепная",
          "region_ids": [1, 2, 3]
        }
      ],
      "continue_reason": null,
      "continue_until_year": null,
      "removal_reason": null,
      "decision_date": "2024-10-10",
      "decided_by": 2,
      "decided_by_name": "Иванов Иван",
      "created_at": "2024-10-01T10:00:00Z",
      "updated_at": "2024-10-10T15:20:00Z"
    },
    {
      "id": 2,
      "row_number": 2,
      "sort_name": "Еламан",
      "maturity_group": "2",
      "yields_by_year": {
        "2022": 124,
        "2023": 288,
        "2024": 107
      },
      "average_yield": 173,
      "decision": "approved",
      ...
    },
    {
      "id": 9,
      "row_number": 9,
      "sort_name": "Норман",
      "maturity_group": "3",
      "yields_by_year": {
        "2024": 165
      },
      "average_yield": 165,
      "years_tested": 1,
      "year_started": 2024,
      "decision": "pending",
      "decision_display": "Ожидает решения",
      ...
    }
  ]
}
```

---

### 4️⃣ Принять решение по сорту

```http
POST /api/v1/annual-decision-items/{item_id}/make-decision/
```

**Request (Одобрить):**
```json
{
  "decision": "approved",
  "decision_justification": "Сорт показал стабильную урожайность на уровне стандарта (144 ц/га за 3 года). Отличные вкусовые качества (5 баллов). Высокая товарность (92.5%). Устойчив к болезням и вредителям.",
  "decision_recommendations": "Рекомендуется для возделывания в лесостепной зоне Костанайской области на богарных землях. Оптимальная норма посадки: 45-50 тыс. клубней/га.",
  "recommended_zones": [
    {
      "climate_zone_id": 1,
      "climate_zone_name": "Лесостепная",
      "region_ids": [1, 2, 3]
    }
  ]
}
```

**Request (Продолжить испытания):**
```json
{
  "decision": "continue",
  "decision_justification": "Сорт показал хорошие результаты, но устойчивость к механическим повреждениям составляет только 54%, что ниже минимального требования (70%). Требуется дополнительный год испытаний для подтверждения данных.",
  "continue_reason": "Низкая устойчивость к механическим повреждениям",
  "continue_until_year": 2025
}
```

**Request (Снять с испытаний):**
```json
{
  "decision": "removed",
  "decision_justification": "Сорт показал урожайность на 28 ц/га ниже стандарта области. Нестабильные показатели по годам. Не рекомендуется для возделывания в регионе.",
  "removal_reason": "Урожайность существенно ниже стандарта"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Решение успешно сохранено",
  "item": {
    "id": 1,
    "decision": "approved",
    "decision_display": "Одобрено к включению в Госреестр",
    "decision_date": "2024-10-15",
    "decided_by": 2,
    "decided_by_name": "Иванов Иван",
    ...
  },
  "table_progress": 84.6
}
```

---

### 5️⃣ Получить детали элемента (сорта)

```http
GET /api/v1/annual-decision-items/{item_id}/
```

**Response:**
```json
{
  "id": 1,
  "row_number": 1,
  "sort_record": 1774,
  "sort_name": "Коринна",
  "sort_id": 1774,
  "yields_by_year": {
    "2022": 125,
    "2023": 210,
    "2024": 97
  },
  "average_yield": 144,
  "last_year_data": { ... },
  "decision": "approved",
  ...
  "sort_record_detail": {
    "id": 1774,
    "name": "Коринна",
    "culture": {
      "id": 5,
      "name": "Картофель"
    },
    "originators": [
      {
        "name": "ТОО КазНИИ картофелеводства",
        "percentage": 100
      }
    ],
    ...
  },
  "trials_data": [
    {
      "id": 15,
      "year": 2022,
      "region_name": "Когалинский ГСУ",
      "status": "completed",
      "status_display": "Завершено"
    },
    {
      "id": 28,
      "year": 2023,
      "region_name": "Когалинский ГСУ",
      "status": "completed",
      "status_display": "Завершено"
    },
    {
      "id": 42,
      "year": 2024,
      "region_name": "Когалинский ГСУ",
      "status": "lab_completed",
      "status_display": "Лабораторные анализы завершены"
    }
  ]
}
```

---

### 6️⃣ Обновить решение

```http
PATCH /api/v1/annual-decision-items/{item_id}/
```

**Request:**
```json
{
  "decision_justification": "Обновленное обоснование...",
  "decision_recommendations": "Обновленные рекомендации..."
}
```

**Response:** Обновленный элемент

---

### 7️⃣ Сбросить решение

```http
DELETE /api/v1/annual-decision-items/{item_id}/reset-decision/
```

**Response:**
```json
{
  "success": true,
  "message": "Решение сброшено",
  "item": {
    "id": 1,
    "decision": "pending",
    "decision_date": null,
    "decided_by": null,
    ...
  }
}
```

---

### 8️⃣ Обновить данные из испытаний

```http
POST /api/v1/annual-decision-items/{item_id}/refresh-data/
```

**Что делает:** Пересчитывает урожайность и показатели из Trial/TrialResult

**Response:**
```json
{
  "success": true,
  "message": "Данные обновлены",
  "item": {
    "yields_by_year": { ... },
    "average_yield": 144,
    "last_year_data": { ... }
  }
}
```

---

### 9️⃣ Завершить таблицу (финализировать)

```http
POST /api/v1/annual-decision-tables/{id}/finalize/
```

**Что делает:**
- Проверяет что все решения приняты
- Блокирует таблицу для редактирования
- Устанавливает status = 'finalized'

**Response (успех):**
```json
{
  "success": true,
  "message": "Таблица успешно завершена",
  "table": {
    "id": 1,
    "status": "finalized",
    "finalized_date": "2024-10-15",
    "finalized_by": 2,
    "finalized_by_name": "Иванов Иван",
    ...
  }
}
```

**Response (ошибка - не все решения):**
```json
{
  "success": false,
  "error": "Не все решения приняты",
  "details": {
    "total": 13,
    "decided": 10,
    "pending": 3
  }
}
```

---

### 🔟 Экспорт в Excel

```http
GET /api/v1/annual-decision-tables/{id}/export-excel/
```

**Response:** Excel файл

**Имя файла:** `Tablica_resheniy_KST_2024.xlsx`

**Структура Excel:**

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| **УРОЖАЙ КЛУБНЕЙ И ДРУГИЕ ПОКАЗАТЕЛИ ИСПЫТЫВАЕМЫХ СОРТОВ** ||||||||| 
| **Костанайская область - Картофель** |||||||||
| **2024 год** |||||||||
| | | | | | | | | | |
| **№ п/п** | **Сорта** | **Группа спелости** | **2022** | **2023** | **2024** | **Средняя за 3 года** | **Отклонение** | **Решение** | **Обоснование** |
| 1 | Коринна | 1 | 125 | 210 | 97 | 144 | ст | Одобрено | ... |
| 2 | Еламан | 2 | 124 | 288 | 107 | 173 | ст | Одобрено | ... |
| ... ||||||||

---

### 1️⃣1️⃣ Статистика таблицы

```http
GET /api/v1/annual-decision-tables/{id}/statistics/
```

**Response:**
```json
{
  "table_id": 1,
  "year": 2024,
  "oblast": "Костанайская область",
  "statistics": {
    "total": 13,
    "approved": 8,
    "removed": 1,
    "continue": 1,
    "pending": 3
  },
  "progress_percentage": 76.9,
  "is_complete": false
}
```

---

## 🎨 UI КОМПОНЕНТЫ И СЕРВИСЫ

### **Компонент 1: AnnualDecisionTableList**

**Назначение:** Список годовых таблиц

**Путь:** `/decisions/annual-tables`

**State:**
```typescript
interface AnnualTableListState {
  tables: AnnualDecisionTable[];
  loading: boolean;
  filters: {
    oblast_id?: number;
    year?: number;
    status?: 'draft' | 'finalized';
    culture_id?: number;
  };
}
```

**API вызовы:**
```typescript
// Загрузка списка
const loadTables = async (filters) => {
  const response = await api.get('/annual-decision-tables/', { params: filters });
  return response.data.results;
};
```

**UI действия:**
- Просмотр таблицы → navigate to `/decisions/annual-tables/{id}`
- Создать таблицу → open modal `CreateAnnualTableModal`
- Фильтрация по области/году/статусу

---

### **Компонент 2: CreateAnnualTableModal**

**Назначение:** Модальное окно создания таблицы

**Form data:**
```typescript
interface CreateTableForm {
  year: number;
  oblast: number;
  culture?: number;
  auto_populate: boolean;
  include_year_3: boolean;
  include_year_2: boolean;
  include_year_1: boolean;
}
```

**API вызов:**
```typescript
const createTable = async (data: CreateTableForm) => {
  const response = await api.post('/annual-decision-tables/', data);
  return response.data;
};
```

**После успешного создания:**
→ Закрыть modal
→ Перейти на детали таблицы `/decisions/annual-tables/{id}`

---

### **Компонент 3: AnnualDecisionTableView**

**Назначение:** Главный экран работы с таблицей

**Путь:** `/decisions/annual-tables/{id}`

**State:**
```typescript
interface TableViewState {
  table: AnnualDecisionTable;
  items: AnnualDecisionItem[];
  selectedItem: AnnualDecisionItem | null;
  showDecisionModal: boolean;
  expandedColumns: boolean;
  loading: boolean;
}
```

**API вызовы:**
```typescript
// Загрузка таблицы с элементами
const loadTable = async (id: number) => {
  const response = await api.get(`/annual-decision-tables/${id}/`);
  return response.data;
};

// Обновление таблицы (polling для real-time обновлений)
const refreshTable = async (id: number) => {
  const response = await api.get(`/annual-decision-tables/${id}/`);
  return response.data;
};
```

**UI элементы:**

1. **Заголовок таблицы:**
   - Название
   - Статус (Черновик/Завершена)
   - Прогресс (10/13 решений, 76.9%)

2. **Панель действий:**
   - `[📥 Экспорт Excel]` → скачать файл
   - `[✅ Завершить таблицу]` → finalize endpoint
   - `[⚙️ Настроить колонки]` → показать/скрыть колонки

3. **Таблица данных:**
   - Строки = items
   - Колонки = показатели
   - Действия на строке: `[Принять решение]` / `[Просмотр]` / `[Редактировать]`

4. **Фильтры/Сортировка:**
   - Фильтр по решению (все/одобрено/снято/продолжить/ожидает)
   - Сортировка по колонкам

---

### **Компонент 4: DecisionModal**

**Назначение:** Модальное окно принятия решения

**Props:**
```typescript
interface DecisionModalProps {
  item: AnnualDecisionItem;
  onClose: () => void;
  onSave: (decision: DecisionFormData) => void;
}
```

**Form data:**
```typescript
interface DecisionFormData {
  decision: 'approved' | 'continue' | 'removed';
  decision_justification: string;
  decision_recommendations?: string;
  recommended_zones?: RecommendedZone[];
  continue_reason?: string;
  continue_until_year?: number;
  removal_reason?: string;
}
```

**API вызов:**
```typescript
const makeDecision = async (itemId: number, data: DecisionFormData) => {
  const response = await api.post(
    `/annual-decision-items/${itemId}/make-decision/`,
    data
  );
  return response.data;
};
```

**UI логика:**

1. **Показать агрегированные данные:**
   - Урожайность по годам (таблица + график)
   - Показатели качества
   - Сравнение со стандартом

2. **Форма решения:**
   - Radio buttons: Одобрить / Продолжить / Снять
   - Обоснование (textarea, обязательно)
   - Условные поля:
     - Если "Одобрить" → показать рекомендации + зоны
     - Если "Продолжить" → показать причину + до года
     - Если "Снять" → показать причину

3. **Кнопки:**
   - `[Отмена]` → закрыть modal
   - `[Сохранить]` → вызвать API, обновить таблицу

---

### **Компонент 5: DecisionDetailsView**

**Назначение:** Просмотр детального решения

**Props:**
```typescript
interface DecisionDetailsViewProps {
  item: AnnualDecisionItem;
  readOnly: boolean;  // true если таблица finalized
}
```

**UI блоки:**

1. **Шапка:**
   - Сорт + статус решения
   - Дата + кто принял

2. **Данные испытаний:**
   - Таблица урожайности по ГСУ и годам
   - График урожайности
   - Показатели качества (развернутые)

3. **Решение:**
   - Обоснование (text block)
   - Рекомендации (text block)
   - Зоны возделывания (список)

4. **Связанные документы:**
   - Формы 008 по годам
   - Лабораторные анализы

5. **Действия:**
   - `[Редактировать]` (если status='draft')
   - `[Экспорт в PDF]`

---

## 🔧 ВСПОМОГАТЕЛЬНЫЕ СЕРВИСЫ

### **Service: AnnualDecisionsService**

```typescript
class AnnualDecisionsService {
  // Список таблиц
  async getTables(filters?: TableFilters): Promise<AnnualDecisionTable[]> {
    const response = await api.get('/annual-decision-tables/', { params: filters });
    return response.data.results;
  }
  
  // Создать таблицу
  async createTable(data: CreateTableData): Promise<AnnualDecisionTable> {
    const response = await api.post('/annual-decision-tables/', data);
    return response.data;
  }
  
  // Детали таблицы
  async getTableDetails(id: number): Promise<AnnualDecisionTableDetail> {
    const response = await api.get(`/annual-decision-tables/${id}/`);
    return response.data;
  }
  
  // Завершить таблицу
  async finalizeTable(id: number): Promise<ApiResponse> {
    const response = await api.post(`/annual-decision-tables/${id}/finalize/`);
    return response.data;
  }
  
  // Экспорт в Excel
  async exportExcel(id: number): Promise<Blob> {
    const response = await api.get(
      `/annual-decision-tables/${id}/export-excel/`,
      { responseType: 'blob' }
    );
    return response.data;
  }
  
  // Статистика таблицы
  async getStatistics(id: number): Promise<TableStatistics> {
    const response = await api.get(`/annual-decision-tables/${id}/statistics/`);
    return response.data;
  }
  
  // Элементы таблицы
  async getItems(tableId: number): Promise<AnnualDecisionItem[]> {
    const response = await api.get('/annual-decision-items/', {
      params: { table_id: tableId }
    });
    return response.data.results;
  }
  
  // Детали элемента
  async getItemDetails(itemId: number): Promise<AnnualDecisionItemDetail> {
    const response = await api.get(`/annual-decision-items/${itemId}/`);
    return response.data;
  }
  
  // Принять решение
  async makeDecision(itemId: number, data: DecisionData): Promise<ApiResponse> {
    const response = await api.post(
      `/annual-decision-items/${itemId}/make-decision/`,
      data
    );
    return response.data;
  }
  
  // Сбросить решение
  async resetDecision(itemId: number): Promise<ApiResponse> {
    const response = await api.delete(`/annual-decision-items/${itemId}/reset-decision/`);
    return response.data;
  }
  
  // Обновить данные элемента
  async refreshItemData(itemId: number): Promise<ApiResponse> {
    const response = await api.post(`/annual-decision-items/${itemId}/refresh-data/`);
    return response.data;
  }
}

export const annualDecisionsService = new AnnualDecisionsService();
```

---

## 📊 ТИПЫ ДАННЫХ (TypeScript)

```typescript
// Годовая таблица
interface AnnualDecisionTable {
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

// Таблица с элементами
interface AnnualDecisionTableDetail extends AnnualDecisionTable {
  items: AnnualDecisionItem[];
}

// Элемент таблицы (строка = сорт)
interface AnnualDecisionItem {
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

// Детальный элемент (с полной информацией)
interface AnnualDecisionItemDetail extends AnnualDecisionItem {
  sort_record_detail: SortRecordDetail;
  trials_data: TrialData[];
}

// Урожайность по годам
interface YieldsByYear {
  [year: string]: number;  // {"2022": 125, "2023": 210, "2024": 97}
}

// Показатели последнего года
interface LastYearData {
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

// Рекомендуемые зоны
interface RecommendedZone {
  climate_zone_id: number;
  climate_zone_name: string;
  region_ids: number[];
}

// Статистика таблицы
interface TableStatistics {
  total: number;
  approved: number;
  removed: number;
  continue: number;
  pending: number;
}

// Данные испытания
interface TrialData {
  id: number;
  year: number;
  region_name: string;
  status: string;
  status_display: string;
}
```

---

## 💡 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### **Пример 1: Загрузка списка таблиц**

```typescript
import { annualDecisionsService } from '@/services/annual-decisions';

const DashboardPage = () => {
  const [tables, setTables] = useState<AnnualDecisionTable[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      const data = await annualDecisionsService.getTables({
        oblast_id: 1,
        year: 2024,
        status: 'draft'
      });
      setTables(data);
    };
    loadData();
  }, []);
  
  return (
    <div>
      <h1>Годовые таблицы решений</h1>
      {tables.map(table => (
        <TableCard key={table.id} table={table} />
      ))}
    </div>
  );
};
```

---

### **Пример 2: Создание таблицы**

```typescript
const handleCreateTable = async () => {
  try {
    const newTable = await annualDecisionsService.createTable({
      year: 2024,
      oblast: 1,
      culture: 5,  // Картофель
      auto_populate: true,
      include_year_3: true,
      include_year_2: true,
      include_year_1: false
    });
    
    // Перейти на созданную таблицу
    navigate(`/decisions/annual-tables/${newTable.id}`);
    
    toast.success(`Создана таблица с ${newTable.items_count} сортами`);
  } catch (error) {
    toast.error('Ошибка создания таблицы');
  }
};
```

---

### **Пример 3: Принятие решения**

```typescript
const handleMakeDecision = async (itemId: number, formData: DecisionFormData) => {
  try {
    const result = await annualDecisionsService.makeDecision(itemId, {
      decision: 'approved',
      decision_justification: formData.justification,
      decision_recommendations: formData.recommendations,
      recommended_zones: formData.zones
    });
    
    toast.success('Решение сохранено');
    
    // Обновить прогресс таблицы
    setTableProgress(result.table_progress);
    
    // Закрыть modal
    setShowDecisionModal(false);
    
    // Обновить список элементов
    refreshTable();
  } catch (error) {
    toast.error('Ошибка сохранения решения');
  }
};
```

---

### **Пример 4: Завершение таблицы**

```typescript
const handleFinalizeTable = async (tableId: number) => {
  try {
    const result = await annualDecisionsService.finalizeTable(tableId);
    
    if (result.success) {
      toast.success('Таблица завершена и заблокирована');
      refreshTable();
    }
  } catch (error) {
    if (error.response?.data?.error === 'Не все решения приняты') {
      const details = error.response.data.details;
      toast.warning(
        `Невозможно завершить таблицу. ` +
        `Решений принято: ${details.decided}/${details.total}. ` +
        `Ожидают решения: ${details.pending} сортов.`
      );
    } else {
      toast.error('Ошибка завершения таблицы');
    }
  }
};
```

---

### **Пример 5: Экспорт в Excel**

```typescript
const handleExportExcel = async (tableId: number, tableName: string) => {
  try {
    const blob = await annualDecisionsService.exportExcel(tableId);
    
    // Создать ссылку для скачивания
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName}.xlsx`;
    link.click();
    
    toast.success('Файл Excel скачан');
  } catch (error) {
    toast.error('Ошибка экспорта');
  }
};
```

---

## 🎨 UI МАКЕТЫ (Wireframes)

### **Макет 1: Таблица с решениями**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Годовая таблица 2024 - Костанайская область - Картофель      │
│ Статус: Черновик | Прогресс: 10/13 (76.9%)                     │
│ [📥 Excel] [✅ Завершить] [⚙️ Колонки]                          │
├─────────────────────────────────────────────────────────────────┤
│ Фильтр: [Все решения ▼] [Группа: Все ▼] [Поиск...]            │
├───┬─────────┬────┬─────┬─────┬─────┬──────┬────┬──────────┬────┤
│ № │ Сорт    │ Гр │2022 │2023 │2024 │Средн.│Отк.│ Решение  │    │
├───┼─────────┼────┼─────┼─────┼─────┼──────┼────┼──────────┼────┤
│ 1 │Коринна  │ 1  │ 125 │ 210 │ 97  │ 144  │ст  │✅Одобрено│[👁️]│
│ 2 │Еламан   │ 2  │ 124 │ 288 │ 107 │ 173  │ст  │✅Одобрено│[👁️]│
│ 3 │Лабелла  │ 2  │ 140 │ 372 │ 190 │ 234  │ст  │✅Одобрено│[👁️]│
│ 4 │Зорба    │ 2  │ 141 │ 235 │ 148 │ 175  │ст  │🔄Продолж.│[👁️]│
│ 9 │Норман   │ 3  │  -  │  -  │ 165 │ 165  │+43 │⏳ Ожидает│[✏️]│
│10 │Камелия  │ 3  │  -  │  -  │ 170 │ 170  │+48 │⏳ Ожидает│[✏️]│
│12 │Акустик  │ 4  │ 210 │ 226 │ 152 │ 196  │ст  │⏳ Ожидает│[✏️]│
└───┴─────────┴────┴─────┴─────┴─────┴──────┴────┴──────────┴────┘
```

### **Макет 2: Модальное окно решения**

```
┌─────────────────────────────────────────────────────┐
│ Принятие решения: "Норман"                    [×]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📊 ДАННЫЕ ИСПЫТАНИЙ                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Год │ ГСУ          │ Урожайность              │ │
│ │ 2024│ Когалинский  │ 165 ц/га (+43 от станд.) │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ⚖️ РЕШЕНИЕ                                          │
│ ( ) ✅ Одобрить к включению в Госреестр             │
│ (*) 🔄 Продолжить испытания                        │
│ ( ) ❌ Снять с испытаний                            │
│                                                     │
│ Причина продления: *                                │
│ [Недостаточно данных (1 год испытаний) ▼]          │
│                                                     │
│ Продлить до года: *                                 │
│ [2025 ▼]                                            │
│                                                     │
│ Обоснование: *                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Сорт показал хорошую урожайность (+43 от        │ │
│ │ стандарта), но имеется только 1 год данных.     │ │
│ │ Требуется минимум 2 года для принятия решения.  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Отмена]                         [💾 Сохранить]    │
└─────────────────────────────────────────────────────┘
```

---

## 📱 МАРШРУТЫ (Routes)

```typescript
const routes = [
  {
    path: '/decisions',
    element: <DecisionsLayout />,
    children: [
      // Список таблиц
      {
        path: 'annual-tables',
        element: <AnnualTablesList />
      },
      
      // Детали таблицы
      {
        path: 'annual-tables/:id',
        element: <AnnualTableView />
      },
      
      // Перечень одобренных (фильтр)
      {
        path: 'approved',
        element: <ApprovedVarietiesList />
      },
      
      // Перечень снятых (фильтр)
      {
        path: 'removed',
        element: <RemovedVarietiesList />
      },
      
      // Продолжающие (фильтр)
      {
        path: 'continuing',
        element: <ContinuingVarietiesList />
      }
    ]
  }
];
```

---

## ✅ СТАТУСЫ И ПЕРЕХОДЫ

### **Статусы таблицы:**

```
draft (Черновик)
  ↓
  [Принятие всех решений]
  ↓
  [Клик "Завершить таблицу"]
  ↓
finalized (Завершена)
```

**Правила:**
- `draft` - можно редактировать, добавлять, удалять
- `finalized` - только просмотр, экспорт

### **Статусы элемента (решения):**

```
pending (Ожидает)
  ↓
  [Агроном принимает решение]
  ↓
approved / continue / removed
```

---

## 🚨 ОБРАБОТКА ОШИБОК

### **Попытка завершить неполную таблицу:**
```typescript
try {
  await annualDecisionsService.finalizeTable(tableId);
} catch (error) {
  if (error.response?.status === 400) {
    const data = error.response.data;
    alert(
      `${data.error}\n` +
      `Принято решений: ${data.details.decided}/${data.details.total}\n` +
      `Ожидают: ${data.details.pending}`
    );
  }
}
```

### **Попытка редактировать завершенную таблицу:**
```typescript
try {
  await annualDecisionsService.makeDecision(itemId, data);
} catch (error) {
  if (error.response?.status === 400) {
    alert('Таблица завершена. Редактирование невозможно.');
  }
}
```

---

## 📦 ЗАВИСИМОСТИ

### **Backend (requirements.txt):**
```
openpyxl>=3.0.0  # Для экспорта в Excel
```

### **Frontend:**
```json
{
  "axios": "^1.6.0",
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0"
}
```

---

## 🎯 ГОТОВО!

Все endpoints реализованы и готовы к использованию! 

**Следующие шаги:**
1. Применить миграцию: `docker exec trials-service python manage.py migrate`
2. Создать fixture с тестовыми данными
3. Реализовать фронтенд компоненты

---

## 📞 SUPPORT

Вопросы? Обратитесь к полной бизнес-логике в начале этого документа.

