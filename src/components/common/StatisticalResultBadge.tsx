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
 * Положительные значения = существенно выше стандарта (✅ +N)
 * 0 = несущественная разница (➖ 0)
 * Отрицательные значения = существенно ниже стандарта (❌ -N)
 * null = результат еще не рассчитан (⏳)
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

  // Функция для определения конфигурации на основе числового значения
  const getConfigForResult = (resultValue: number) => {
    if (resultValue > 0) {
      return {
        color: 'success' as const,
        label: `Существенно выше (+${resultValue})`,
        icon: `✅ +${resultValue}`,
        shortLabel: `+${resultValue}`,
        description: `Урожайность превышает стандарт на ${resultValue} НСР`
      };
    } else if (resultValue < 0) {
      return {
        color: 'error' as const,
        label: `Существенно ниже (${resultValue})`,
        icon: `❌ ${resultValue}`,
        shortLabel: `${resultValue}`,
        description: `Урожайность ниже стандарта на ${Math.abs(resultValue)} НСР`
      };
    } else {
      return {
        color: 'warning' as const,
        label: 'В пределах нормы (0)',
        icon: '➖ 0',
        shortLabel: '0',
        description: 'Разница со стандартом статистически несущественна (в пределах НСР)'
      };
    }
  };

  // Преобразуем result в число
  const numericResult = typeof result === 'string' ? parseFloat(result) : result;
  
  // Проверяем, что это валидное число
  if (isNaN(numericResult)) {
    console.warn('StatisticalResultBadge: Invalid numeric result:', { result, type: typeof result });
    return (
      <Tooltip title={`Неверное статистическое значение: ${result} (тип: ${typeof result})`}>
        <Chip 
          label={showLabel ? `Ошибка (${result})` : "?"} 
          size={size} 
          color="default" 
          variant="outlined"
        />
      </Tooltip>
    );
  }
  
  const { color, label, icon, shortLabel, description } = getConfigForResult(numericResult);
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
        <StatisticalResultBadge result={2} />
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
          <StatisticalResultBadge result={2} size="medium" />
          <Typography variant="body2">
            Сорт существенно превосходит стандарт по урожайности (положительные значения)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatisticalResultBadge result={0} size="medium" />
          <Typography variant="body2">
            Разница со стандартом незначительная (в пределах НСР)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatisticalResultBadge result={-1} size="medium" />
          <Typography variant="body2">
            Сорт существенно уступает стандарту (отрицательные значения)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Re-export Box for Legend component
import { Box, Typography } from '@mui/material';




