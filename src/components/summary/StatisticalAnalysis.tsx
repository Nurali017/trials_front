import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Collapse,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  BarChart as ChartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { StatisticalAnalysis as StatisticalAnalysisType } from '@/types/summary.types';

interface StatisticalAnalysisProps {
  analysis: StatisticalAnalysisType;
}

export const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ analysis }) => {
  const [expanded, setExpanded] = useState(false);

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
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center">
          <ChartIcon sx={{ color: 'info.main', fontSize: 28, mr: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            СТАТИСТИЧЕСКИЙ АНАЛИЗ
          </Typography>
          {analysis.statistical_significance ? (
            <Chip
              label="Значимо"
              color="success"
              size="small"
              sx={{ ml: 2, fontWeight: 600 }}
            />
          ) : (
            <Chip
              label="Не значимо"
              color="default"
              size="small"
              sx={{ ml: 2, fontWeight: 600 }}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box mt={2}>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  НСР₀.₉₅:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysis.nsr_095 !== null && analysis.nsr_095 !== undefined ? analysis.nsr_095.toFixed(2) : '—'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Уровень доверия:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysis.confidence_level !== null && analysis.confidence_level !== undefined ? (analysis.confidence_level * 100).toFixed(0) : '—'}%
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Степени свободы:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysis.degrees_of_freedom ?? '—'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Дисперсия ошибки:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysis.error_variance !== null && analysis.error_variance !== undefined ? analysis.error_variance.toFixed(2) : '—'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Количество повторностей:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysis.repetitions_count ?? '—'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Достаточно данных:
                </Typography>
                <Box display="flex" alignItems="center">
                  {analysis.sufficient_data ? (
                    <>
                      <CheckIcon sx={{ color: 'success.main', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        Да
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CancelIcon sx={{ color: 'error.main', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        Нет
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Значимых регионов:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {analysis.significant_regions} ({analysis.significant_percent.toFixed(1)}%)
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {analysis.regions_analysis.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Анализ по регионам:
              </Typography>
              <Box sx={{ mt: 1 }}>
                {analysis.regions_analysis.map((region, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: region.is_significant ? 'success.light' : 'divider',
                      bgcolor: region.is_significant ? 'rgba(76, 175, 80, 0.04)' : 'transparent',
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={0.5}>
                      {region.is_significant ? (
                        <CheckIcon sx={{ color: 'success.main', fontSize: 18, mr: 1 }} />
                      ) : (
                        <CancelIcon sx={{ color: 'text.disabled', fontSize: 18, mr: 1 }} />
                      )}
                      <Typography variant="body2" fontWeight={600}>
                        {region.region_name}
                      </Typography>
                      <Chip
                        label={region.is_significant ? 'Значимо' : 'Не значимо'}
                        size="small"
                        color={region.is_significant ? 'success' : 'default'}
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Grid container spacing={1} sx={{ pl: 3 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Лет испытаний: <Typography component="span" variant="caption" fontWeight={600}>{region.years_count}</Typography>
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Отклонение:{' '}
                          <Typography
                            component="span"
                            variant="caption"
                            fontWeight={600}
                            color={region.deviation_percent > 0 ? 'success.main' : region.deviation_percent < 0 ? 'error.main' : 'text.secondary'}
                          >
                            {region.deviation_percent > 0 ? '+' : ''}
                            {region.deviation_percent?.toFixed(1) || '0.0'}%
                          </Typography>
                        </Typography>
                      </Grid>
                      {region.f_statistic !== null && region.f_statistic !== undefined && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            F-статистика: <Typography component="span" variant="caption" fontWeight={600}>{region.f_statistic.toFixed(2)}</Typography>
                          </Typography>
                        </Grid>
                      )}
                      {region.p_value !== null && region.p_value !== undefined && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            p-value: <Typography component="span" variant="caption" fontWeight={600}>{region.p_value.toFixed(4)}</Typography>
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};
