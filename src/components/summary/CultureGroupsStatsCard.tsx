import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon, Category as CategoryIcon } from '@mui/icons-material';
import type { CultureGroupsStatisticsResponse } from '@/types/api.types';
import { CardSkeleton } from '@/components/common/CardSkeleton';

interface CultureGroupsStatsCardProps {
  data?: CultureGroupsStatisticsResponse;
  isLoading: boolean;
  error?: Error | null;
}

const CultureGroupsStatsCard: React.FC<CultureGroupsStatsCardProps> = ({
  data,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return <CardSkeleton count={1} variant="standard" />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Ошибка загрузки статистики по группам культур: {error.message}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info">
        Нет данных для отображения статистики по группам культур
      </Alert>
    );
  }

  const { total_applications, total_culture_groups, culture_groups, filters_applied } = data;

  // Memoize culture groups with percentages to avoid recalculation on every render
  const cultureGroupsWithPercentages = useMemo(() => {
    return culture_groups.map((group) => ({
      ...group,
      percentage: total_applications > 0
        ? (group.applications_count / total_applications) * 100
        : 0
    }));
  }, [culture_groups, total_applications]);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Статистика по группам культур
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<CategoryIcon />}
              label={`${total_culture_groups} групп`}
              color="primary"
              size="small"
            />
            <Chip
              icon={<TrendingUpIcon />}
              label={`${total_applications} заявок`}
              color="secondary"
              size="small"
            />
          </Box>
        </Box>

        {filters_applied && Object.keys(filters_applied).length > 0 && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Примененные фильтры:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {filters_applied.year && (
                <Chip label={`Год: ${filters_applied.year}`} size="small" />
              )}
              {filters_applied.status && (
                <Chip label={`Статус: ${filters_applied.status}`} size="small" />
              )}
              {filters_applied.oblast && (
                <Chip label={`Область: ${filters_applied.oblast}`} size="small" />
              )}
            </Box>
          </Box>
        )}

        <Grid container spacing={2}>
          {cultureGroupsWithPercentages.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {group.name}
                    </Typography>
                    <Chip
                      label={group.code}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {group.cultures_count} культур
                  </Typography>

                  <Box mb={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">
                        Заявок: {group.applications_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={group.percentage}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {culture_groups.length === 0 && (
          <Alert severity="info">
            Нет данных по группам культур для отображения
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CultureGroupsStatsCard;


