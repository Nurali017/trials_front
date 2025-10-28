import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Clear as ClearIcon, FilterList as FilterIcon } from '@mui/icons-material';
import type { ApplicationFilters } from '@/types/api.types';
import { useDictionaries } from '@/hooks/useDictionaries';

interface ApplicationFiltersProps {
  filters: ApplicationFilters;
  onFiltersChange: (filters: ApplicationFilters) => void;
  onReset: () => void;
}

const ApplicationFiltersComponent: React.FC<ApplicationFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const dictionaries = useDictionaries();

  // Отладочная информация
  React.useEffect(() => {
    console.log('🔍 ApplicationFilters - состояние словарей:', {
      cultureGroups: dictionaries?.cultureGroups,
      cultures: dictionaries?.cultures,
      loading: dictionaries?.loading,
      errors: dictionaries?.errors,
    });
    
    if (dictionaries?.cultureGroups) {
      console.log('📋 Группы культур для селекта:', dictionaries.cultureGroups.map(g => ({ id: g.id, name: g.name, code: g.code })));
      console.log('📋 Первая группа культур:', dictionaries.cultureGroups[0]);
      console.log('📋 Структура первой группы:', {
        id: dictionaries.cultureGroups[0]?.id,
        name: dictionaries.cultureGroups[0]?.name,
        code: dictionaries.cultureGroups[0]?.code,
        keys: Object.keys(dictionaries.cultureGroups[0] || {})
      });
    }
    
    console.log('🔍 Текущий фильтр patents_group_id:', filters.patents_group_id);
    console.log('🔍 Текущий фильтр patents_culture_id:', filters.patents_culture_id);
  }, [dictionaries]);

  const handleFilterChange = (key: keyof ApplicationFilters, value: any) => {
    console.log('🔧 Изменение фильтра:', { key, value, oldValue: filters[key] });
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  const getActiveFiltersCount = () => {
    // Считаем только те фильтры, которые отображаются в интерфейсе
    const activeFilters = [
      filters.search,
      filters.year,
      filters.patents_group_id,  // Используем patents_group_id вместо culture_group
      filters.patents_culture_id, // Используем patents_culture_id вместо culture
    ].filter(value => 
      value !== undefined && value !== '' && value !== null
    );
    return activeFilters.length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Фильтры заявок
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount} активных фильтров`}
                color="primary"
                size="small"
                icon={<FilterIcon />}
              />
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={onReset}
              disabled={activeFiltersCount === 0}
            >
              Сбросить
            </Button>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* Поиск по номеру заявки или названию сорта */}
          <TextField
            label="Поиск"
            placeholder="Номер заявки или название сорта"
            value={filters.search || ''}
            onChange={(e) => {
              console.log('🎯 Search onChange вызван:', e.target.value);
              handleFilterChange('search', e.target.value);
            }}
            size="small"
            sx={{ minWidth: 300 }}
          />

          {/* Фильтр по году */}
          <TextField
            label="Год"
            type="number"
            placeholder="2025"
            value={filters.year || ''}
            onChange={(e) => {
              console.log('🎯 Year onChange вызван:', e.target.value);
              handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined);
            }}
            size="small"
            sx={{ minWidth: 120 }}
            inputProps={{ min: 2020, max: 2030 }}
          />

          {/* Фильтр по группе культур (только выборка) */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Группа культур</InputLabel>
            <Select
              value={filters.patents_group_id || ''}
              label="Группа культур"
              onChange={(e) => {
                console.log('🎯 Select onChange вызван:', e.target.value);
                handleFilterChange('patents_group_id', e.target.value);
              }}
            >
              <MenuItem value="">Все группы культур</MenuItem>
              {dictionaries?.loading?.cultureGroups ? (
                <MenuItem disabled>Загрузка...</MenuItem>
              ) : dictionaries?.cultureGroups?.length > 0 ? (
                dictionaries.cultureGroups.map((group) => {
                  console.log('🎯 Рендеринг группы культур:', { id: group.id, name: group.name, code: group.code });
                  return (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name} ({group.code})
                    </MenuItem>
                  );
                })
              ) : (
                <MenuItem disabled>Нет данных ({dictionaries?.cultureGroups?.length || 0})</MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Фильтр по культуре (только выборка) */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Культура</InputLabel>
            <Select
              value={filters.patents_culture_id || ''}
              label="Культура"
              onChange={(e) => {
                console.log('🎯 Select onChange вызван для культур:', e.target.value);
                handleFilterChange('patents_culture_id', e.target.value);
              }}
            >
              <MenuItem value="">Все культуры</MenuItem>
              {dictionaries?.cultures?.map((culture) => (
                <MenuItem key={culture.id} value={culture.id}>
                  {culture.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Отображение активных фильтров */}
        {activeFiltersCount > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Активные фильтры:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {filters.search && (
                <Chip
                  label={`Поиск: ${filters.search}`}
                  onDelete={() => handleFilterChange('search', undefined)}
                  size="small"
                />
              )}
              {filters.year && (
                <Chip
                  label={`Год: ${filters.year}`}
                  onDelete={() => handleFilterChange('year', undefined)}
                  size="small"
                />
              )}
              {filters.patents_group_id && (
                <Chip
                  label={`Группа культур: ${dictionaries?.cultureGroups?.find(g => g.id === filters.patents_group_id)?.name || filters.patents_group_id}`}
                  onDelete={() => handleFilterChange('patents_group_id', undefined)}
                  size="small"
                />
              )}
              {filters.patents_culture_id && (
                <Chip
                  label={`Культура: ${dictionaries?.cultures?.find(c => c.id === filters.patents_culture_id)?.name || filters.patents_culture_id}`}
                  onDelete={() => handleFilterChange('patents_culture_id', undefined)}
                  size="small"
                />
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationFiltersComponent;
