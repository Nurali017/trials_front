# Расширенная фильтрация заявок по группам культур

## Обзор

Добавлена расширенная система фильтрации заявок на испытания с возможностью фильтрации по группам культур, областям, годам и другим параметрам.

## Новые возможности

### 1. Расширенные фильтры

- **Поиск по номеру заявки или названию сорта** (`search`)
- **Поиск по группе культур** (`group_search`) - поиск по названию или коду группы
- **Фильтр по статусу заявки** (`status`)
- **Фильтр по области** (`oblast`)
- **Фильтр по году подачи** (`year`)
- **Фильтр по группе культур** (`culture_group`) - по ID группы
- **Фильтр по культуре** (`culture`) - по ID культуры

### 2. Статистика по группам культур

- **Общая статистика** - количество заявок и групп культур
- **Детальная статистика** - по каждой группе культур с прогресс-барами
- **Фильтрация статистики** - по году, статусу, области

## Компоненты

### ApplicationFiltersComponent

Компонент для расширенной фильтрации заявок с:
- Интуитивным интерфейсом фильтрации
- Отображением активных фильтров
- Возможностью сброса всех фильтров
- Поддержкой всех новых параметров фильтрации

### CultureGroupsStatsCard

Компонент для отображения статистики по группам культур с:
- Карточками для каждой группы культур
- Прогресс-барами для визуализации данных
- Информацией о количестве культур в группе
- Поддержкой фильтрации статистики

## API Endpoints

### Новый endpoint статистики

```
GET /api/v1/applications/culture-groups-stats/
```

**Параметры запроса:**
- `year` - фильтр по году
- `status` - фильтр по статусу
- `oblast` - фильтр по области

**Ответ:**
```json
{
  "total_applications": 150,
  "total_culture_groups": 5,
  "filters_applied": {
    "year": 2025,
    "status": "submitted"
  },
  "culture_groups": [
    {
      "id": 1,
      "name": "Зерновые",
      "code": "GRAIN",
      "applications_count": 80,
      "cultures_count": 12
    }
  ]
}
```

## Использование

### В ApplicationsList

```tsx
import ApplicationFiltersComponent from '@/components/forms/ApplicationFilters';

// Использование компонента фильтров
<ApplicationFiltersComponent
  filters={filters}
  onFiltersChange={handleFiltersChange}
  onReset={handleResetFilters}
/>
```

### В Dashboard

```tsx
import CultureGroupsStatsCard from '@/components/summary/CultureGroupsStatsCard';
import { useCultureGroupsStatistics } from '@/hooks/useApplications';

// Получение статистики
const { data: cultureGroupsStats, isLoading } = useCultureGroupsStatistics();

// Отображение статистики
<CultureGroupsStatsCard
  data={cultureGroupsStats}
  isLoading={isLoading}
  error={null}
/>
```

## Примеры фильтрации

```typescript
// Фильтрация по группе культур
const filters: ApplicationFilters = {
  culture_group: 1,
  page: 1,
  page_size: 20
};

// Поиск по группе культур
const filters: ApplicationFilters = {
  group_search: "зерновые",
  page: 1,
  page_size: 20
};

// Комбинированные фильтры
const filters: ApplicationFilters = {
  culture_group: 1,
  status: "submitted",
  year: 2025,
  oblast: 1,
  page: 1,
  page_size: 20
};
```

## Хуки

### useCultureGroupsStatistics

```typescript
const { data, isLoading, error } = useCultureGroupsStatistics({
  year: 2025,
  status: "submitted",
  oblast: 1
});
```

## Типы

### ApplicationFilters

```typescript
interface ApplicationFilters {
  status?: ApplicationStatus;
  patents_culture_id?: number;
  culture_group?: number;
  culture?: number;
  culture_group_name?: string;
  oblast?: number;
  year?: number;
  search?: string;
  group_search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}
```

### CultureGroupsStatisticsResponse

```typescript
interface CultureGroupsStatisticsResponse {
  total_applications: number;
  total_culture_groups: number;
  filters_applied?: {
    year?: number;
    status?: ApplicationStatus;
    oblast?: number;
  };
  culture_groups: CultureGroupStats[];
}
```

