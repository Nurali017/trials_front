import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Alert,
  Box,
  Divider,
  Stack,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  PlayArrow as ContinueIcon,
  ErrorOutline as ErrorIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { RegionalStatusItem, PlannedDistributionStatus } from '@/types/api.types';
import {
  getTrialStatusMuiColor,
  getDecisionMuiColor,
  getDecisionLabel,
} from '@/utils/statusHelpers';

interface RegionalProgressProps {
  regionalStatus: RegionalStatusItem[];
  applicationId?: number;
  isLoading?: boolean;
}

// Статус PlannedDistribution → UI
const getDistributionStatusConfig = (status: PlannedDistributionStatus) => {
  switch (status) {
    case 'planned':
      return { icon: <PendingIcon />, label: 'Запланировано', color: 'default' as const };
    case 'in_progress':
      return { icon: <TimelineIcon />, label: 'Испытания идут', color: 'info' as const };
    case 'approved':
      return { icon: <CheckIcon />, label: 'Одобрено', color: 'success' as const };
    case 'rejected':
      return { icon: <ErrorIcon />, label: 'Отклонено', color: 'error' as const };
    case 'cancelled':
      return { icon: <CancelIcon />, label: 'Отменено', color: 'default' as const };
    default:
      return { icon: <PendingIcon />, label: 'Не определен', color: 'default' as const };
  }
};

export const RegionalProgress: React.FC<RegionalProgressProps> = ({
  regionalStatus,
  applicationId,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  if (!regionalStatus || regionalStatus.length === 0) {
    return (
      <Alert severity="info">
        Заявка еще не распределена по регионам. Необходимо распределить заявку для создания испытаний.
      </Alert>
    );
  }

  // Подсчет статистики
  const stats = {
    total: regionalStatus.length,
    planned: regionalStatus.filter(r => r.status === 'planned').length,
    inProgress: regionalStatus.filter(r => r.status === 'in_progress').length,
    approved: regionalStatus.filter(r => r.status === 'approved').length,
    rejected: regionalStatus.filter(r => r.status === 'rejected').length,
    totalTrials: regionalStatus.reduce((sum, r) => sum + r.trials.length, 0),
  };

  return (
    <Box>
      {/* Статистика */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Распределено по <strong>{stats.total}</strong> регион(ам). 
          Создано испытаний: <strong>{stats.totalTrials}</strong>
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {stats.planned > 0 && (
            <Chip label={`Запланировано: ${stats.planned}`} size="small" />
          )}
          {stats.inProgress > 0 && (
            <Chip label={`В процессе: ${stats.inProgress}`} size="small" color="info" />
          )}
          {stats.approved > 0 && (
            <Chip label={`Одобрено: ${stats.approved}`} size="small" color="success" />
          )}
          {stats.rejected > 0 && (
            <Chip label={`Отклонено: ${stats.rejected}`} size="small" color="error" />
          )}
        </Box>
      </Alert>

      {/* Карточки регионов */}
      <Grid container spacing={2}>
        {regionalStatus.map((region) => {
          const statusConfig = getDistributionStatusConfig(region.status);
          const hasTrials = region.trials.length > 0;
          const latestTrial = region.trials.length > 0 
            ? region.trials[region.trials.length - 1] 
            : null;

          return (
            <Grid item xs={12} md={6} lg={4} key={region.region_id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid',
                  borderColor:
                    region.status === 'approved'
                      ? 'success.main'
                      : region.status === 'rejected'
                      ? 'error.main'
                      : region.status === 'in_progress'
                      ? 'info.main'
                      : 'divider',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Заголовок - Регион */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" color="primary">
                      {region.oblast_name}
                    </Typography>
                    {statusConfig.icon}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>ГСУ:</strong> {region.region_name}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Статус PlannedDistribution */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      icon={statusConfig.icon}
                      label={statusConfig.label}
                      color={statusConfig.color}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  {/* Период испытаний */}
                  {(region.year_started || region.year_completed) && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        ПЕРИОД ИСПЫТАНИЙ
                      </Typography>
                      <Typography variant="body2">
                        {region.year_started && region.year_completed && region.year_started !== region.year_completed ? (
                          <>
                            <strong>{region.year_started}-{region.year_completed}</strong>
                            {region.years_count && ` (${region.years_count} ${region.years_count === 1 ? 'год' : region.years_count < 5 ? 'года' : 'лет'})`}
                          </>
                        ) : region.year_started && region.year_completed && region.year_started === region.year_completed ? (
                          <>
                            <strong>{region.year_started}</strong> (1 год)
                          </>
                        ) : region.year_started ? (
                          <>Начато: <strong>{region.year_started}</strong></>
                        ) : null}
                      </Typography>
                    </Box>
                  )}

                  {/* История испытаний по годам */}
                  {hasTrials && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        ИСТОРИЯ ИСПЫТАНИЙ
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {region.trials.map((trial, index) => {
                          const isLast = index === region.trials.length - 1;
                          return (
                            <Paper
                              key={trial.trial_id}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                bgcolor: isLast ? 'action.selected' : 'background.paper',
                                borderLeft: '4px solid',
                                borderLeftColor: trial.decision
                                  ? trial.decision === 'approved'
                                    ? 'success.main'
                                    : trial.decision === 'rejected'
                                    ? 'error.main'
                                    : 'info.main'
                                  : 'grey.300',
                              }}
                            >
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="body2" fontWeight="medium">
                                  📅 {trial.year || new Date(trial.start_date).getFullYear()} год
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Trial #{trial.trial_id}
                                </Typography>
                              </Box>

                              <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                                <Chip
                                  label={trial.status}
                                  color={getTrialStatusMuiColor(trial.status)}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                {trial.decision && (
                                  <Chip
                                    icon={
                                      trial.decision === 'approved' ? <CheckIcon /> :
                                      trial.decision === 'rejected' ? <ErrorIcon /> :
                                      <ContinueIcon />
                                    }
                                    label={getDecisionLabel(trial.decision)}
                                    color={getDecisionMuiColor(trial.decision)}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                                {trial.laboratory_status === 'completed' && (
                                  <Chip
                                    label="🔬 Лаб. анализ"
                                    color="success"
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                              </Box>

                              {isLast && (
                                <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
                                  Текущее испытание
                                </Typography>
                              )}
                            </Paper>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Параметры распределения (если нет испытаний) */}
                  {!hasTrials && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        ПАРАМЕТРЫ РАСПРЕДЕЛЕНИЯ
                      </Typography>
                      {region.trial_type && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Тип:</strong> {region.trial_type}
                        </Typography>
                      )}
                      {region.planting_season && (
                        <Typography variant="body2">
                          <strong>Сезон:</strong>{' '}
                          {region.planting_season === 'spring' ? 'Весенний' : 'Осенний'}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  {latestTrial ? (
                    <Button
                      size="small"
                      onClick={() => navigate(`/trials/${latestTrial.trial_id}`)}
                    >
                      Открыть Trial #{latestTrial.trial_id}
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                      Ожидается создание испытания
                    </Typography>
                  )}

                  {/* Кнопка создания нового Trial для следующего года */}
                  {region.status === 'in_progress' && latestTrial?.decision === 'continue' && (
                    <Button
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={() => navigate(`/trials/new?region=${region.region_id}&application=${applicationId}`)}
                    >
                      + Создать {(latestTrial.year || new Date().getFullYear()) + 1}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
