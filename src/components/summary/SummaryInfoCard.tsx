import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { SummaryStat } from '@/types/summary.types';
import { getQualityIndicatorName, getResistanceIndicatorName } from '@/utils/indicators';

interface SummaryInfoCardProps {
  summary: SummaryStat;
}

export const SummaryInfoCard: React.FC<SummaryInfoCardProps> = ({ summary }) => {
  const getCoverageColor = (percent: number) => {
    if (percent >= 50) return 'success.main';
    return 'warning.main';
  };

  const getYearsColor = (years: number) => {
    if (years >= 3) return 'success.main';
    return 'warning.main';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <AssessmentIcon sx={{ color: 'primary.main', fontSize: 28, mr: 1 }} />
        <Typography variant="h6" fontWeight={700}>
          СВОДНАЯ ИНФОРМАЦИЯ
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              ГСУ испытано:
            </Typography>
            <Typography variant="body2" fontWeight={600} color={getCoverageColor(summary.coverage_percent || 0)}>
              {summary.gsu_tested || 0} из {summary.gsu_total || 0} ({summary.coverage_percent?.toFixed(1) || '0.0'}%)
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Средняя урожайность:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {summary.oblast_avg_yield?.toFixed(1) || '0.0'} ц/га
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Мин. лет испытаний:
            </Typography>
            <Typography variant="body2" fontWeight={600} color={getYearsColor(summary.min_years_tested)}>
              {summary.min_years_tested}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Регионов с данными:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {summary.total_regions_with_data}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Значимых регионов:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {summary.statistically_significant_regions || 0} ({summary.significant_regions_percent?.toFixed(1) || '0.0'}%)
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Показатели качества */}
      {Object.keys(summary.quality_indicators).length > 0 && (
        <Box mt={3}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Показатели качества:
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(summary.quality_indicators).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {getQualityIndicatorName(key)}:
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {value?.average?.toFixed(1) || '—'} {value?.unit || ''} ({value?.min?.toFixed(1) || '—'} - {value?.max?.toFixed(1) || '—'})
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Показатели устойчивости */}
      {Object.keys(summary.resistance_indicators).length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Показатели устойчивости:
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(summary.resistance_indicators).map(([key, value]) => (
              <Grid item xs={12} sm={6} key={key}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {getResistanceIndicatorName(key)}:
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {value?.average?.toFixed(1) || '—'} {value?.unit || ''} ({value?.min?.toFixed(1) || '—'} - {value?.max?.toFixed(1) || '—'})
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};
