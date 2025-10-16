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
} from '@mui/material';
import type { PlanCulture } from '../../api/trialPlans';

interface PlanFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  filterCultureId: number | '';
  onCultureFilterChange: (value: number | '') => void;
  filterTrialTypeCode: string;
  onTrialTypeFilterChange: (value: string) => void;
  cultures: PlanCulture[];
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onReset: () => void;
}

const PlanFilters: React.FC<PlanFiltersProps> = ({
  searchText,
  onSearchChange,
  filterCultureId,
  onCultureFilterChange,
  filterTrialTypeCode,
  onTrialTypeFilterChange,
  cultures,
  onExpandAll,
  onCollapseAll,
  onReset,
}) => {
  // Получаем уникальные типы испытаний
  const uniqueTrialTypes = Array.from(
    new Set(
      cultures.flatMap(c => c.trial_types || []).map(tt => tt.code)
    )
  );

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            label="🔍 Поиск по плану"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>🌾 Культура</InputLabel>
            <Select
              label="🌾 Культура"
              value={filterCultureId}
              onChange={(e) => onCultureFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <MenuItem value="">Все</MenuItem>
              {cultures.map(c => (
                <MenuItem key={c.culture} value={c.culture}>
                  {c.culture_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>📋 Тип</InputLabel>
            <Select
              label="📋 Тип"
              value={filterTrialTypeCode}
              onChange={(e) => onTrialTypeFilterChange(e.target.value)}
            >
              <MenuItem value="">Все</MenuItem>
              {uniqueTrialTypes.map(code => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            <Button size="small" variant="outlined" onClick={onCollapseAll}>
              Свернуть все
            </Button>
            <Button size="small" variant="outlined" onClick={onExpandAll}>
              Развернуть все
            </Button>
            <Button size="small" variant="text" onClick={onReset}>
              Сбросить
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PlanFilters;
