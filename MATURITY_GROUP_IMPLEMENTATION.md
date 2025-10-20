# Реализация группировки по группам спелости в API Annual Reports

## ✅ Исправления выполнены

### 🔧 Что было исправлено:

1. **Фильтрация стандартов по группам спелости**
   - Для каждой группы спелости (`maturity_group_code`) определяется свой стандарт
   - Стандарты группируются: `D01` → стандарт D01, `D03` → стандарт D03

2. **Сравнение только внутри групп**
   - Испытываемые сорта сравниваются ТОЛЬКО со стандартом своей группы
   - Отклонения рассчитываются относительно соответствующего стандарта

3. **Группировка данных для UI**
   - Добавлена структура `detailed_items_by_group` для отображения в таблицах
   - Добавлена структура `summary_items_by_group` для сводных данных
   - Добавлен список `maturity_groups` с информацией о группах

## 📊 Структура ответа API

### GET `/api/annual-reports/?year=2024&oblast_id=17`

```json
{
  "oblast": {
    "id": 17,
    "name": "Алматинская область"
  },
  "year": 2024,
  "years_range": [2022, 2023, 2024],
  "generated_at": "2024-10-18T10:30:00Z",
  "regions": [
    {"id": 1, "name": "ГСУ-1"},
    {"id": 2, "name": "ГСУ-2"}
  ],
  
  // === НОВОЕ: Список групп спелости ===
  "maturity_groups": [
    {
      "group_code": "D01",
      "group_name": "Ранняя группа",
      "standard": "Стандарт-Ранний",
      "items_count": 5
    },
    {
      "group_code": "D03",
      "group_name": "Средняя группа (среднеспелая)",
      "standard": "Стандарт-Средний",
      "items_count": 8
    }
  ],
  
  // === Плоский список (для обратной совместимости) ===
  "detailed_items": [
    {
      "row_number": 1,
      "region": {
        "id": 1,
        "name": "ГСУ-1"
      },
      "sort_record": {
        "id": 123,
        "name": "Стандарт-Ранний",
        "culture_name": "Пшеница мягкая"
      },
      "maturity_group_code": "D01",
      "maturity_group_name": "Ранняя группа",
      "is_standard": true,
      "standard_for_group": "Стандарт-Ранний",
      "trial_data": {
        "years_tested": 3,
        "year_started": 2022,
        "yields_by_year": {
          "2022": 45.2,
          "2023": 47.8,
          "2024": 46.1
        },
        "average_yield": 46.4,
        "has_data": true
      },
      "can_make_decision": false
    },
    {
      "row_number": 2,
      "region": {
        "id": 1,
        "name": "ГСУ-1"
      },
      "sort_record": {
        "id": 124,
        "name": "Новый-Ранний",
        "culture_name": "Пшеница мягкая"
      },
      "maturity_group_code": "D01",
      "maturity_group_name": "Ранняя группа",
      "is_standard": false,
      "application_id": 456,
      "application_number": "APP-2024-001",
      "standard_for_group": "Стандарт-Ранний",
      "trial_data": {
        "years_tested": 2,
        "year_started": 2023,
        "yields_by_year": {
          "2023": 52.1,
          "2024": 51.3
        },
        "average_yield": 51.7,
        "deviation_from_standard": 5.3,
        "deviation_percent": 11.4,
        "standard_name": "Стандарт-Ранний",
        "has_data": true
      },
      "can_make_decision": true,
      "decision_status": "planned",
      "latest_decision": null
    }
  ],
  
  // === НОВОЕ: Группировка по группам спелости для UI ===
  "detailed_items_by_group": {
    "D01": {
      "group_code": "D01",
      "group_name": "Ранняя группа",
      "standard": "Стандарт-Ранний",
      "items": [
        {
          "row_number": 1,
          "sort_record": {...},
          "is_standard": true,
          "trial_data": {...}
        },
        {
          "row_number": 2,
          "sort_record": {...},
          "is_standard": false,
          "trial_data": {...}
        }
      ]
    },
    "D03": {
      "group_code": "D03",
      "group_name": "Средняя группа (среднеспелая)",
      "standard": "Стандарт-Средний",
      "items": [...]
    }
  },
  
  // === Сводная таблица (плоский список) ===
  "summary_items": [
    {
      "application_id": 456,
      "application_number": "APP-2024-001",
      "sort_record": {
        "id": 124,
        "name": "Новый-Ранний",
        "culture_name": "Пшеница мягкая"
      },
      "maturity_group_code": "D01",
      "maturity_group_name": "Ранняя группа",
      "standard_for_group": "Стандарт-Ранний",
      "summary": {
        "gsu_tested": 5,
        "gsu_total": 8,
        "coverage_percent": 62.5,
        "oblast_avg_yield": 51.2,
        "avg_deviation_percent": 10.8,
        "advantage_on_majority": true,
        "advantage_percent": 80.0,
        "min_years_tested": 2,
        "positive_regions": 4,
        "total_regions_with_data": 5
      },
      "regions_data": [...],
      "zones_recommended": ["ГСУ-1", "ГСУ-2", "ГСУ-3", "ГСУ-4"],
      "zones_not_recommended": ["ГСУ-5"],
      "decision_status": "planned",
      "latest_decision": null,
      "recommendation": {
        "decision": "approved",
        "reason": "Превышает стандарт D01 на 10.8% в среднем. Преимущество на 80% ГСУ.",
        "confidence": "high",
        "can_approve": true
      }
    }
  ],
  
  // === НОВОЕ: Сводная таблица с группировкой ===
  "summary_items_by_group": {
    "D01": {
      "group_code": "D01",
      "group_name": "Ранняя группа",
      "standard": "Стандарт-Ранний",
      "items": [...]
    },
    "D03": {
      "group_code": "D03",
      "group_name": "Средняя группа (среднеспелая)",
      "standard": "Стандарт-Средний",
      "items": [...]
    }
  },
  
  "statistics": {
    "total_sorts": 15,
    "approved": 3,
    "rejected": 2,
    "continue": 5,
    "pending": 5,
    "decided": 10,
    "decided_percent": 66.7
  }
}
```

## 🎯 Как использовать в UI

### Вариант 1: Таблица с группировкой (рекомендуется)

```typescript
// Использовать detailed_items_by_group
const groupedData = response.detailed_items_by_group;

// Отобразить группы
Object.values(groupedData).forEach(group => {
  // Заголовок группы
  console.log(`Группа: ${group.group_name} (${group.group_code})`);
  console.log(`Стандарт: ${group.standard}`);
  
  // Таблица сортов в группе
  group.items.forEach(item => {
    console.log(`  ${item.sort_record.name} - ${item.trial_data.average_yield} ц/га`);
    if (!item.is_standard) {
      console.log(`    Отклонение: ${item.trial_data.deviation_percent}%`);
    }
  });
});
```

### Вариант 2: Единая таблица с разделителями

```typescript
// Использовать maturity_groups для заголовков
response.maturity_groups.forEach(group => {
  // Вставить заголовок группы
  insertGroupHeader(group.group_name, group.standard);
  
  // Отфильтровать items по группе
  const groupItems = response.detailed_items.filter(
    item => item.maturity_group_code === group.group_code
  );
  
  // Отобразить items
  groupItems.forEach(item => renderRow(item));
});
```

### Вариант 3: Вкладки по группам

```typescript
// Создать вкладку для каждой группы
response.maturity_groups.forEach(group => {
  createTab({
    label: `${group.group_name} (${group.items_count})`,
    content: response.detailed_items_by_group[group.group_code].items
  });
});
```

## ✅ Соответствие Методике ГСИ

### Требование:
> "Если в опыте участвуют сорта РАЗНЫХ групп спелости, для каждой такой группы должен быть предусмотрен свой стандарт."

### Реализация:
- ✅ Стандарты группируются по `maturity_group_code`
- ✅ Сравнение происходит только внутри групп
- ✅ Отклонения рассчитываются от соответствующего стандарта
- ✅ UI может отображать группы отдельно

### Пример корректного сравнения:
```
Группа D01 (Ранняя):
  - Стандарт-Ранний (стандарт) - 46.4 ц/га
  - Новый-Ранний (испытываемый) - 51.7 ц/га (+11.4% от Стандарт-Ранний)
  
Группа D03 (Средняя):
  - Стандарт-Средний (стандарт) - 52.1 ц/га
  - Новый-Средний (испытываемый) - 58.3 ц/га (+11.9% от Стандарт-Средний)
```

❌ **НЕПРАВИЛЬНО** (старая реализация):
```
Новый-Ранний (D01) - 51.7 ц/га (+11.9% от Стандарт-Средний D03) // ОШИБКА!
```

✅ **ПРАВИЛЬНО** (новая реализация):
```
Новый-Ранний (D01) - 51.7 ц/га (+11.4% от Стандарт-Ранний D01) // ОК!
```

## 📝 Изменения в коде

### Файл: `trials_app/views/annual_report.py`

**Основные изменения:**

1. Добавлены параметры `maturity_group_code` в методы:
   - `_get_trial_data_by_sort()`
   - `_get_trial_data_by_application()`

2. Группировка стандартов по группам спелости:
   ```python
   standards_by_group = {}
   for participant in standard_participants:
       group_code = participant.maturity_group_code or 'unknown'
       if group_code not in standards_by_group:
           if participant.sort_record.patents_status == 1:
               standards_by_group[group_code] = participant.sort_record
   ```

3. Сравнение с правильным стандартом:
   ```python
   region_standard = standards_by_group.get(group_code)
   if region_standard and trial_data.get('average_yield'):
       standard_data = self._get_trial_data_by_sort(
           region_standard, region, years_range, group_code
       )
   ```

4. Добавлены вспомогательные методы:
   - `_group_summary_by_maturity()` - группировка сводной таблицы
   - `_get_maturity_group_name()` - названия групп спелости

## 🧪 Тестирование

### Проверить:
1. Разные группы спелости имеют разные стандарты
2. Отклонения считаются от правильного стандарта
3. UI корректно группирует данные
4. Обратная совместимость (`detailed_items` работает)

### Тестовый сценарий:
```bash
# 1. Создать испытания с разными группами спелости
# 2. Запросить отчет
GET /api/annual-reports/?year=2024&oblast_id=17

# 3. Проверить что в ответе:
# - maturity_groups содержит все группы
# - detailed_items_by_group разделен по группам
# - standard_for_group указан для каждого сорта
# - deviation_percent считается от правильного стандарта
```

## 📚 Справочник групп спелости

| Код | Название |
|-----|----------|
| D01 | Ранняя группа |
| D02 | Среднеранняя группа |
| D03 | Средняя группа (среднеспелая) |
| D04 | Среднепоздняя группа |
| D05 | Поздняя группа |
| D06 | Очень ранняя группа |
| D07 | Среднеранняя |

## ⚠️ Важно для фронтенда

1. **Всегда проверяйте `maturity_group_code`** при отображении данных
2. **Используйте `standard_for_group`** для указания с каким стандартом сравнивается сорт
3. **Группируйте данные по группам спелости** в UI для соответствия Методике
4. **Показывайте стандарт первым** в каждой группе
5. **Указывайте группу спелости** в заголовках таблиц

## 🎨 Пример UI таблицы

```
┌─────────────────────────────────────────────────────────────┐
│ Группа: Ранняя группа (D01)                                 │
│ Стандарт: Стандарт-Ранний                                   │
├──────┬────────────────────┬──────────┬────────────┬─────────┤
│ №    │ Сорт               │ Урожай   │ Отклонение │ Решение │
├──────┼────────────────────┼──────────┼────────────┼─────────┤
│ 1    │ Стандарт-Ранний ⭐ │ 46.4     │ —          │ —       │
│ 2    │ Новый-Ранний       │ 51.7     │ +11.4%     │ ✅ Одобр│
├──────┴────────────────────┴──────────┴────────────┴─────────┤
│ Группа: Средняя группа (D03)                                │
│ Стандарт: Стандарт-Средний                                  │
├──────┬────────────────────┬──────────┬────────────┬─────────┤
│ №    │ Сорт               │ Урожай   │ Отклонение │ Решение │
├──────┼────────────────────┼──────────┼────────────┼─────────┤
│ 3    │ Стандарт-Средний ⭐│ 52.1     │ —          │ —       │
│ 4    │ Новый-Средний      │ 58.3     │ +11.9%     │ ✅ Одобр│
└──────┴────────────────────┴──────────┴────────────┴─────────┘
```

---

**Дата реализации:** 18.10.2024  
**Версия API:** v1  
**Статус:** ✅ Готово к использованию

