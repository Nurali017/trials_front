import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { StatisticalResultBadge } from '@/components/common/StatisticalResultBadge';
import { AutoStatisticsCard } from './AutoStatisticsCard';
import type { Form008StatisticsResponse } from '@/types/api.types';

interface Statistics {
  accuracy_percent: number;
  lsd: number;
  error_mean: number;
}

interface MinMax {
  [indicator: string]: {
    min: number;
    max: number;
  };
}

interface ParticipantStatisticalResult {
  participant_number: number;
  sort_name: string;
  yield: number;
  statistical_result: -1 | 0 | 1;
  statistical_result_display: string;
}

interface Form008StatisticsDialogProps {
  open: boolean;
  onClose: () => void;
  data: Form008StatisticsResponse | null;
  onUseAutoCalculation?: (values: {
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
  }) => void;
}

export const Form008StatisticsDialog: React.FC<Form008StatisticsDialogProps> = ({
  open,
  onClose,
  data,
  onUseAutoCalculation,
}) => {
  if (!data || !open) return null;

  const { statistics, manual_statistics, auto_statistics, min_max, comparison } = data;

  // Используем manual_statistics если есть, иначе statistics
  const currentStatistics = manual_statistics || statistics;

  // Защита от undefined значений
  if (!currentStatistics) return null;

  // Определение цвета для точности опыта
  const getAccuracyColor = (percent: number) => {
    if (percent <= 3) return 'success.main';
    if (percent <= 5) return 'warning.main';
    return 'error.main';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        📊 Статистика формы 008
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Success Message */}
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight={500}>
              {data.message}
            </Typography>
            <Typography variant="body2">
              Статус испытания: <strong>{data.trial_status}</strong>
            </Typography>
          </Alert>

          {/* Statistics */}
          {currentStatistics && (
            <Box mb={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Статистические показатели
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Точность опыта (P%)
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={
                        currentStatistics.accuracy_percent != null
                          ? getAccuracyColor(currentStatistics.accuracy_percent)
                          : 'text.primary'
                      }
                    >
                      {currentStatistics.accuracy_percent != null
                        ? `${currentStatistics.accuracy_percent.toFixed(1)}%`
                        : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentStatistics.accuracy_percent != null
                        ? currentStatistics.accuracy_percent <= 3
                          ? 'Отличная точность'
                          : currentStatistics.accuracy_percent <= 5
                          ? 'Приемлемая точность'
                          : 'Низкая точность'
                        : 'Нет данных'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      НСР (наименьшая существенная разница)
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {currentStatistics.lsd_095 != null ? currentStatistics.lsd_095.toFixed(2) : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ц/га
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ошибка средней (E)
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {currentStatistics.error_mean != null ? currentStatistics.error_mean.toFixed(2) : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ц/га
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Auto Statistics */}
          {auto_statistics && (
            <Box mb={3}>
              <AutoStatisticsCard
                autoStatistics={auto_statistics}
                onUseAutoCalculation={onUseAutoCalculation}
              />
            </Box>
          )}

          {/* Min/Max Values */}
          {min_max && Object.keys(min_max).length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Диапазоны значений
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(min_max).map(([indicator, values]) => (
                  <Grid item xs={12} sm={6} key={indicator}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight={500} gutterBottom>
                        {indicator === 'yield' ? 'Урожайность' : indicator}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Минимум
                          </Typography>
                          <Typography variant="h6" color="error.main">
                            {values.min != null ? values.min.toFixed(1) : '-'}
                          </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Максимум
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {values.max != null ? values.max.toFixed(1) : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Participants Statistical Results */}
          {comparison && comparison.length > 0 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Статистическая оценка участников
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>№</TableCell>
                      <TableCell>Сорт</TableCell>
                      <TableCell align="center">Урожайность (ц/га)</TableCell>
                      <TableCell align="center">Оценка</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparison
                      .sort((a, b) => a.participant_id - b.participant_id)
                      .map((participant) => (
                        <TableRow key={participant.participant_id} hover>
                          <TableCell>{participant.participant_id}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {participant.sort_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={participant.yield != null ? participant.yield.toFixed(1) : '-'}
                              color={
                                participant.statistical_result === 1
                                  ? 'success'
                                  : participant.statistical_result === -1
                                  ? 'error'
                                  : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <StatisticalResultBadge result={participant.statistical_result} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Legend */}
              <Box mt={2} display="flex" gap={2} justifyContent="center">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingUpIcon color="success" fontSize="small" />
                  <Typography variant="caption">Существенно выше</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <RemoveIcon color="action" fontSize="small" />
                  <Typography variant="caption">Несущественное отклонение</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingDownIcon color="error" fontSize="small" />
                  <Typography variant="caption">Существенно ниже</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

