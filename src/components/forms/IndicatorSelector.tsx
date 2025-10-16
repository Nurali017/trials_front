import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  FormGroup,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useIndicators } from '@/hooks/useDictionaries';
import type { Indicator, IndicatorCategory } from '@/types/api.types';

interface IndicatorSelectorProps {
  cultureId?: number;
  selectedIndicators: number[];
  onChange: (indicators: number[]) => void;
  disabled?: boolean;
}

export const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  cultureId,
  selectedIndicators,
  onChange,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<IndicatorCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: indicators, isLoading, error } = useIndicators(
    cultureId ? { culture: cultureId } : undefined
  );

  const indicatorsArray = indicators || [];

  // Автоматически выбираем все показатели при загрузке (если ничего не выбрано)
  useEffect(() => {
    if (indicatorsArray.length > 0 && selectedIndicators.length === 0) {
      const allIndicatorIds = indicatorsArray.map(indicator => indicator.id);
      onChange(allIndicatorIds);
    }
  }, [indicatorsArray, selectedIndicators.length, onChange]);

  // Group indicators by category
  const groupedIndicators = useMemo(() => {
    const groups: Record<IndicatorCategory | 'all', Indicator[]> = {
      all: [],
      common: [],
      quality: [],
      specific: [],
    };

    indicatorsArray.forEach((indicator) => {
      groups.all.push(indicator);
      groups[indicator.category].push(indicator);
    });

    // Sort by sort_order within each group
    Object.keys(groups).forEach((key) => {
      groups[key as keyof typeof groups].sort((a, b) => a.sort_order - b.sort_order);
    });

    return groups;
  }, [indicatorsArray]);

  // Filter indicators by search query
  const filteredIndicators = useMemo(() => {
    const indicators = groupedIndicators[activeTab];
    if (!searchQuery) return indicators;

    return indicators.filter(
      (indicator) =>
        indicator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        indicator.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groupedIndicators, activeTab, searchQuery]);

  const handleToggleIndicator = (indicatorId: number) => {
    if (disabled) return;

    if (selectedIndicators.includes(indicatorId)) {
      onChange(selectedIndicators.filter((id) => id !== indicatorId));
    } else {
      onChange([...selectedIndicators, indicatorId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(filteredIndicators.map((ind) => ind.id));
  };

  const handleDeselectAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const getCategoryLabel = (category: IndicatorCategory | 'all'): string => {
    const labels: Record<IndicatorCategory | 'all', string> = {
      all: 'Все',
      common: 'Общие',
      quality: 'Качество',
      specific: 'Специфические',
    };
    return labels[category];
  };

  const getCategoryCount = (category: IndicatorCategory | 'all'): number => {
    return groupedIndicators[category]?.length || 0;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Ошибка загрузки показателей. Пожалуйста, попробуйте позже.
      </Alert>
    );
  }

  if (!cultureId) {
    return (
      <Alert severity="info">
        Сначала выберите культуру для отображения релевантных показателей
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Показатели для сбора ({selectedIndicators.length} выбрано)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Выберите показатели, которые будут собираться во время испытания
        </Typography>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Поиск показателей..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        disabled={disabled}
      />

      {/* Category Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          label={`${getCategoryLabel('all')} (${getCategoryCount('all')})`}
          value="all"
        />
        <Tab
          label={`${getCategoryLabel('common')} (${getCategoryCount('common')})`}
          value="common"
        />
        <Tab
          label={`${getCategoryLabel('quality')} (${getCategoryCount('quality')})`}
          value="quality"
        />
        <Tab
          label={`${getCategoryLabel('specific')} (${getCategoryCount('specific')})`}
          value="specific"
        />
      </Tabs>

      {/* Bulk actions */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Chip
          label="Выбрать все"
          onClick={handleSelectAll}
          size="small"
          clickable
          disabled={disabled}
        />
        <Chip
          label="Снять все"
          onClick={handleDeselectAll}
          size="small"
          clickable
          disabled={disabled}
        />
      </Box>

      {/* Indicators List */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {filteredIndicators.length === 0 ? (
          <Alert severity="info">
            {searchQuery ? 'Показатели не найдены' : 'Нет показателей для выбранной категории'}
          </Alert>
        ) : (
          <FormGroup>
            {filteredIndicators.map((indicator) => (
              <Box
                key={indicator.id}
                sx={{
                  p: 1.5,
                  mb: 1,
                  border: 1,
                  borderColor: selectedIndicators.includes(indicator.id)
                    ? 'primary.main'
                    : 'divider',
                  borderRadius: 1,
                  bgcolor: selectedIndicators.includes(indicator.id)
                    ? 'primary.50'
                    : 'background.paper',
                  '&:hover': {
                    bgcolor: disabled ? undefined : 'action.hover',
                  },
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedIndicators.includes(indicator.id)}
                      onChange={() => handleToggleIndicator(indicator.id)}
                      disabled={disabled}
                    />
                  }
                  label={
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {indicator.name}
                        </Typography>
                        {indicator.is_universal && (
                          <Chip label="Универсальный" size="small" color="default" />
                        )}
                        {indicator.is_quality && (
                          <Chip label="Качество" size="small" color="secondary" />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {indicator.code} • Единица: {indicator.unit}
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>
            ))}
          </FormGroup>
        )}
      </Box>

      {/* Selected Summary */}
      {selectedIndicators.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Выбрано показателей: {selectedIndicators.length}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};




