# 📱 ГОДОВЫЕ ТАБЛИЦЫ РЕШЕНИЙ - ФРОНТЕНД ГАЙД

## 🔄 ПОТОК ДАННЫХ (ПРАВИЛЬНЫЙ)

```
TrialPlan (План 2024, Костанайская область, Картофель)
    ↓
TrialPlanParticipant (13 сортов)
    ├─ patents_sort_id → SortRecord
    ├─ application → Application (заявка)
    ├─ maturity_group → "1", "2", "3"
    ↓
Trial (создается из плана через API)
    ↓
TrialParticipant (участники в Trial)
    ↓
TrialResult (результаты испытаний)
    ↓
AnnualDecisionTable + AnnualDecisionItem
    ↓ (агрегация)
yields_by_year: {2022: 125, 2023: 210, 2024: 97}
average_yield: 144
last_year_data: {все показатели}
```

---

## 📋 API ENDPOINTS

### **1. Создать таблицу**

```http
POST /api/v1/annual-decision-tables/

Body:
{
  "year": 2024,
  "oblast": 1,
  "culture": 5,
  "auto_populate": true,
  "include_year_3": true,
  "include_year_2": true,
  "include_year_1": false
}

Response:
{
  "id": 1,
  "title": "Таблица 2024 - Костанайская область - Картофель",
  "items_count": 13,
  "statistics": {"total": 13, "pending": 13}
}
```

**Что происходит:**
1. Система ищет TrialPlan(oblast=1, year=2024, culture=5)
2. Из плана берет TrialPlanParticipant (13 сортов)
3. Создает AnnualDecisionItem для каждого сорта
4. Автоматически агрегирует данные из Trial/TrialResult

---

### **2. Получить таблицу**

```http
GET /api/v1/annual-decision-tables/1/

Response:
{
  "id": 1,
  "year": 2024,
  "oblast_name": "Костанайская область",
  "culture_name": "Картофель",
  "status": "draft",
  "progress_percentage": 76.9,
  "items": [
    {
      "id": 1,
      "row_number": 1,
      "sort_name": "Коринна",
      "maturity_group": "1",
      "yields_by_year": {"2022": 125, "2023": 210, "2024": 97},
      "average_yield": 144,
      "deviation_from_standard": 0,
      "decision": "pending",
      "decided_by_name": null
    },
    ...12 еще
  ]
}
```

---

### **3. Принять решение**

```http
POST /api/v1/annual-decision-items/5/make-decision/

Body (Одобрить):
{
  "decision": "approved",
  "decision_justification": "Сорт показал стабильную урожайность...",
  "decision_recommendations": "Рекомендуется для лесостепной зоны..."
}

Body (Продолжить):
{
  "decision": "continue",
  "decision_justification": "Требуется еще год...",
  "continue_reason": "Недостаточно данных",
  "continue_until_year": 2025
}

Body (Снять):
{
  "decision": "removed",
  "decision_justification": "Урожайность ниже стандарта...",
  "removal_reason": "Низкая урожайность"
}

Response:
{
  "success": true,
  "message": "Решение сохранено",
  "table_progress": 84.6
}
```

---

### **4. Завершить таблицу**

```http
POST /api/v1/annual-decision-tables/1/finalize/

Response (успех):
{
  "success": true,
  "message": "Таблица завершена"
}

Response (ошибка):
{
  "success": false,
  "error": "Не все решения приняты",
  "details": {"total": 13, "decided": 10, "pending": 3}
}
```

---

### **5. Экспорт Excel**

```http
GET /api/v1/annual-decision-tables/1/export-excel/

Response: файл .xlsx
```

---

### **6. Другие endpoints**

```http
# Статистика
GET /annual-decision-tables/1/statistics/

# Сбросить решение
DELETE /annual-decision-items/5/reset-decision/

# Обновить данные
POST /annual-decision-items/5/refresh-data/

# Список таблиц с фильтрами
GET /annual-decision-tables/?oblast_id=1&year=2024&status=draft
```

---

## 🎨 UI ЭКРАНЫ

### **ЭКРАН 1: Список таблиц** `/decisions/annual-tables`

```
API: GET /annual-decision-tables/?oblast_id=1&year=2024

Показать:
┌────┬──────┬─────────────┬───────┬──────────┬────────┬────────┐
│ ID │ Год  │ Область     │ Сортов│ Прогресс │ Статус │ Действия│
├────┼──────┼─────────────┼───────┼──────────┼────────┼────────┤
│ 1  │ 2024 │ Костанай.   │ 13    │ 10/13    │Черновик│[Открыть]│
│ 2  │ 2024 │ Акмолин.    │ 11    │ 11/11    │Завершена│[Excel] │
└────┴──────┴─────────────┴───────┴──────────┴────────┴────────┘

[+ Создать таблицу]
```

---

### **ЭКРАН 2: Работа с таблицей** `/decisions/annual-tables/1`

```
API: GET /annual-decision-tables/1/

Показать:
📊 Таблица 2024 - Костанайская - Картофель
Прогресс: 10/13 (76.9%) [██████████░░░]

[📥 Excel] [✅ Завершить]

┌───┬─────────┬────┬─────┬─────┬─────┬────────┬──────────┬─────────┐
│ № │ Сорт    │ Гр │2022 │2023 │2024 │ Средняя│ Решение  │ Действия│
├───┼─────────┼────┼─────┼─────┼─────┼────────┼──────────┼─────────┤
│ 1 │Коринна  │ 1  │ 125 │ 210 │ 97  │ 144    │✅Одобрено│ [👁️]    │
│ 2 │Еламан   │ 2  │ 124 │ 288 │ 107 │ 173    │✅Одобрено│ [👁️]    │
│ 9 │Норман   │ 3  │  -  │  -  │ 165 │ 165    │⏳Ожидает │ [✏️]    │
└───┴─────────┴────┴─────┴─────┴─────┴────────┴──────────┴─────────┘

Клик [✏️] → открыть modal принятия решения
```

---

### **ЭКРАН 3: Modal принятия решения**

```
Клик [✏️] на "Норман"
  ↓
API: GET /annual-decision-items/9/
  ↓
Показать modal:

┌─────────────────────────────────────────┐
│ Принятие решения: "Норман"        [×]   │
├─────────────────────────────────────────┤
│ 📊 ДАННЫЕ (из API response):            │
│ • yields_by_year: {"2024": 165}        │
│ • average_yield: 165                    │
│ • deviation_from_standard: +43          │
│ • last_year_data: {...}                 │
│                                         │
│ Решение: (*) 🔄 Продолжить             │
│ Обоснование: [textarea]                 │
│                                         │
│ [Отмена] [Сохранить]                   │
└─────────────────────────────────────────┘

Клик [Сохранить]
  ↓
API: POST /annual-decision-items/9/make-decision/
{decision: "continue", decision_justification: "..."}
  ↓
Закрыть modal
  ↓
Обновить таблицу (строка #9 → 🔄 Продолжить)
```

---

## 💾 СОСТОЯНИЕ (State Management)

### **Компонент: AnnualTableView**

```typescript
const [table, setTable] = useState(null);
const [items, setItems] = useState([]);
const [selectedItem, setSelectedItem] = useState(null);
const [showModal, setShowModal] = useState(false);
const [loading, setLoading] = useState(false);

// Загрузка таблицы
useEffect(() => {
  loadTable(tableId);
}, [tableId]);

const loadTable = async (id) => {
  const data = await GET `/annual-decision-tables/${id}/`;
  setTable(data);
  setItems(data.items);
};

// Открыть modal
const openDecisionModal = async (itemId) => {
  const itemDetail = await GET `/annual-decision-items/${itemId}/`;
  setSelectedItem(itemDetail);
  setShowModal(true);
};

// Сохранить решение
const saveDecision = async (formData) => {
  await POST `/annual-decision-items/${selectedItem.id}/make-decision/`
  setShowModal(false);
  loadTable(tableId); // Обновить таблицу
};
```

---

## 🔧 TYPESCRIPT СЕРВИС

```typescript
// services/annualDecisions.service.ts

export const annualDecisionsService = {
  
  getTables: (filters) => 
    axios.get('/api/v1/annual-decision-tables/', {params: filters}),
  
  createTable: (data) => 
    axios.post('/api/v1/annual-decision-tables/', data),
  
  getTable: (id) => 
    axios.get(`/api/v1/annual-decision-tables/${id}/`),
  
  getItemDetail: (itemId) => 
    axios.get(`/api/v1/annual-decision-items/${itemId}/`),
  
  makeDecision: (itemId, decisionData) => 
    axios.post(`/api/v1/annual-decision-items/${itemId}/make-decision/`, decisionData),
  
  finalizeTable: (id) => 
    axios.post(`/api/v1/annual-decision-tables/${id}/finalize/`),
  
  exportExcel: async (id) => {
    const {data} = await axios.get(
      `/api/v1/annual-decision-tables/${id}/export-excel/`,
      {responseType: 'blob'}
    );
    
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table_${id}.xlsx`;
    link.click();
  },
  
  getStatistics: (id) => 
    axios.get(`/api/v1/annual-decision-tables/${id}/statistics/`),
  
  resetDecision: (itemId) => 
    axios.delete(`/api/v1/annual-decision-items/${itemId}/reset-decision/`),
  
  refreshData: (itemId) => 
    axios.post(`/api/v1/annual-decision-items/${itemId}/refresh-data/`)
};
```

---

## 📊 СТРУКТУРА ДАННЫХ

### **AnnualDecisionItem (строка в таблице):**

```json
{
  "id": 1,
  "row_number": 1,
  "sort_name": "Коринна",
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
    ...все показатели
  },
  
  "years_tested": 3,
  "year_started": 2022,
  
  "decision": "pending",
  "decision_justification": "",
  "decision_date": null,
  "decided_by_name": null
}
```

---

## ✅ ПРАВИЛА

1. **Сорта берутся из TrialPlan** (не из Application напрямую)
2. **Группа спелости** из TrialPlanParticipant.maturity_group
3. **Данные агрегируются** из Trial → TrialParticipant → TrialResult
4. **Таблица finalized** = только просмотр, нельзя редактировать
5. **Решение автоматом** устанавливает decision_date и decided_by

---

## 🎯 ГОТОВО!

Всё реализовано и готово к интеграции! 🚀

