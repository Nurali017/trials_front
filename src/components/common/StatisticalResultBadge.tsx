import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import type { StatisticalResult } from '@/types/api.types';

interface StatisticalResultBadgeProps {
  result: StatisticalResult;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

/**
 * Компонент для отображения статистической оценки участника испытания
 * -1 = существенно ниже стандарта (❌ --)
 *  0 = несущественная разница (➖ 0)
 * +1 = существенно выше стандарта (✅ ++)
 */
export const StatisticalResultBadge: React.FC<StatisticalResultBadgeProps> = ({ 
  result, 
  size = 'small',
  showLabel = false,
}) => {
  if (result === null) {
    return (
      <Tooltip title="Статистический результат еще не рассчитан. Дождитесь внесения всех данных.">
        <Chip 
          label={showLabel ? "Ожидание данных" : "⏳"} 
          size={size} 
          color="default" 
          variant="outlined"
        />
      </Tooltip>
    );
  }

  const config = {
    1: { 
      color: 'success' as const, 
      label: 'Существенно выше', 
      icon: '✅ ++',
      shortLabel: '++',
      description: 'Урожайность значительно превышает стандарт (разница больше НСР)'
    },
    0: { 
      color: 'warning' as const, 
      label: 'В пределах нормы', 
      icon: '➖ 0',
      shortLabel: '0',
      description: 'Разница со стандартом статистически несущественна (в пределах НСР)'
    },
    '-1': { 
      color: 'error' as const, 
      label: 'Существенно ниже', 
      icon: '❌ --',
      shortLabel: '--',
      description: 'Урожайность значительно ниже стандарта (разница больше НСР)'
    }
  };

  const resultKey = result as 1 | 0 | -1;
  const { color, label, icon, shortLabel, description } = config[resultKey];
  const displayLabel = showLabel ? label : (size === 'medium' ? icon : shortLabel);

  return (
    <Tooltip title={`${label}: ${description}`} arrow>
      <Chip 
        label={displayLabel} 
        size={size} 
        color={color} 
        variant="filled"
      />
    </Tooltip>
  );
};

interface StatisticalResultLegendProps {
  compact?: boolean;
}

/**
 * Легенда для объяснения статистических оценок
 */
export const StatisticalResultLegend: React.FC<StatisticalResultLegendProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">Оценка:</Typography>
        <StatisticalResultBadge result={1} />
        <StatisticalResultBadge result={0} />
        <StatisticalResultBadge result={-1} />
        <StatisticalResultBadge result={null} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        Статистическая оценка:
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatisticalResultBadge result={1} size="medium" />
          <Typography variant="body2">
            Сорт существенно превосходит стандарт по урожайности
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatisticalResultBadge result={0} size="medium" />
          <Typography variant="body2">
            Разница со стандартом незначительная
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatisticalResultBadge result={-1} size="medium" />
          <Typography variant="body2">
            Сорт существенно уступает стандарту
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Re-export Box for Legend component
import { Box, Typography } from '@mui/material';




