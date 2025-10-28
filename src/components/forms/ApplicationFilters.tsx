import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Local state for search with debounce
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Sync external filter changes with local state (when coming back from detail page)
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  // Debounce search input (500ms delay)
  useEffect(() => {
    // Don't trigger if search hasn't actually changed
    if (searchValue === filters.search) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: searchValue === '' ? undefined : searchValue,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const handleFilterChange = useCallback((key: keyof ApplicationFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  }, [filters, onFiltersChange]);

  // Memoize active filters count
  const activeFiltersCount = useMemo(() => {
    const activeFilters = [
      filters.search,
      filters.year,
      filters.patents_group_id,
      filters.patents_culture_id,
    ].filter(value =>
      value !== undefined && value !== '' && value !== null
    );
    return activeFilters.length;
  }, [filters.search, filters.year, filters.patents_group_id, filters.patents_culture_id]);

  // Memoize culture groups list for Select
  const cultureGroupsList = useMemo(() => {
    if (dictionaries?.loading?.cultureGroups) {
      return <MenuItem disabled>Загрузка...</MenuItem>;
    }
    if (dictionaries?.cultureGroups?.length > 0) {
      return dictionaries.cultureGroups.map((group) => (
        <MenuItem key={group.id} value={group.id}>
          {group.name} ({group.code})
        </MenuItem>
      ));
    }
    return <MenuItem disabled>Нет данных ({dictionaries?.cultureGroups?.length || 0})</MenuItem>;
  }, [dictionaries?.cultureGroups, dictionaries?.loading?.cultureGroups]);

  // Memoize cultures list for Select
  const culturesList = useMemo(() => {
    return dictionaries?.cultures?.map((culture) => (
      <MenuItem key={culture.id} value={culture.id}>
        {culture.name}
      </MenuItem>
    ));
  }, [dictionaries?.cultures]);

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
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
          />

          {/* Фильтр по году */}
          <TextField
            label="Год"
            type="number"
            placeholder="2025"
            value={filters.year || ''}
            onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
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
              onChange={(e) => handleFilterChange('patents_group_id', e.target.value)}
            >
              <MenuItem value="">Все группы культур</MenuItem>
              {cultureGroupsList}
            </Select>
          </FormControl>

          {/* Фильтр по культуре (только выборка) */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Культура</InputLabel>
            <Select
              value={filters.patents_culture_id || ''}
              label="Культура"
              onChange={(e) => handleFilterChange('patents_culture_id', e.target.value)}
            >
              <MenuItem value="">Все культуры</MenuItem>
              {culturesList}
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
