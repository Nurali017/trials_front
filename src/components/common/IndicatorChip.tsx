import React from 'react';
import { Chip, Tooltip, Box, Typography } from '@mui/material';
import type { Indicator, IndicatorCategory } from '@/types/api.types';

interface IndicatorChipProps {
  indicator: Indicator;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium';
  showCode?: boolean;
  showUnit?: boolean;
  showCategory?: boolean;
  onClick?: () => void;
}

/**
 * A reusable component to display indicator information as a chip
 * with optional tooltip showing additional details
 */
export const IndicatorChip: React.FC<IndicatorChipProps> = ({
  indicator,
  variant = 'filled',
  size = 'small',
  showCode = false,
  showUnit = true,
  showCategory = false,
  onClick,
}) => {
  const getCategoryColor = (category: IndicatorCategory): 'default' | 'primary' | 'secondary' | 'success' => {
    switch (category) {
      case 'common':
        return 'primary';
      case 'quality':
        return 'secondary';
      case 'specific':
        return 'success';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: IndicatorCategory): string => {
    const labels: Record<IndicatorCategory, string> = {
      common: 'Общий',
      quality: 'Качество',
      specific: 'Специфический',
    };
    return labels[category];
  };

  const label = [
    indicator.name,
    showUnit && `(${indicator.unit})`,
    showCode && `[${indicator.code}]`,
  ]
    .filter(Boolean)
    .join(' ');

  const tooltipContent = (
    <Box>
      <Typography variant="body2" fontWeight="bold" gutterBottom>
        {indicator.name}
      </Typography>
      <Typography variant="caption" display="block">
        Код: {indicator.code}
      </Typography>
      <Typography variant="caption" display="block">
        Единица: {indicator.unit}
      </Typography>
      <Typography variant="caption" display="block">
        Категория: {getCategoryLabel(indicator.category)}
      </Typography>
      {indicator.is_universal && (
        <Typography variant="caption" display="block" color="primary.light">
          ⭐ Универсальный показатель
        </Typography>
      )}
      {indicator.is_quality && (
        <Typography variant="caption" display="block" color="secondary.light">
          ✓ Показатель качества
        </Typography>
      )}
    </Box>
  );

  const chipColor = showCategory ? getCategoryColor(indicator.category) : 'default';

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        label={label}
        color={chipColor}
        variant={variant}
        size={size}
        onClick={onClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          ...(indicator.is_universal && {
            borderColor: 'warning.main',
            borderWidth: 2,
          }),
        }}
      />
    </Tooltip>
  );
};

interface IndicatorChipListProps {
  indicators: Indicator[];
  showCategory?: boolean;
  max?: number;
  onIndicatorClick?: (indicator: Indicator) => void;
}

/**
 * Display a list of indicator chips with optional overflow handling
 */
export const IndicatorChipList: React.FC<IndicatorChipListProps> = ({
  indicators,
  showCategory = false,
  max,
  onIndicatorClick,
}) => {
  const displayIndicators = max ? indicators.slice(0, max) : indicators;
  const remainingCount = max && indicators.length > max ? indicators.length - max : 0;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {displayIndicators.map((indicator) => (
        <IndicatorChip
          key={indicator.id}
          indicator={indicator}
          showCategory={showCategory}
          onClick={onIndicatorClick ? () => onIndicatorClick(indicator) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <Chip
          label={`+${remainingCount} еще`}
          size="small"
          variant="outlined"
        />
      )}
    </Box>
  );
};

