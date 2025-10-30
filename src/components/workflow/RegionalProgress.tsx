import React, { useState, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  PlayArrow as ContinueIcon,
  ErrorOutline as ErrorIcon,
  Timeline as TimelineIcon,
  HourglassEmpty as HourglassIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { OblastStatus, Oblast, OblastStatusType } from '@/types/api.types';

interface RegionalProgressProps {
  oblastStatuses: OblastStatus[];
  oblastData: Oblast[];
  isLoading?: boolean;
}

// Статус области → UI
const getOblastStatusConfig = (status: OblastStatusType) => {
  switch (status) {
    case 'planned':
      return { icon: <PendingIcon />, label: 'Запланировано', color: 'default' as const };
    case 'trial_plan_created':
      return { icon: <HourglassIcon />, label: 'План испытаний создан', color: 'info' as const };
    case 'trial_created':
      return { icon: <TimelineIcon />, label: 'Испытание создано', color: 'info' as const };
    case 'trial_completed':
      return { icon: <CheckIcon />, label: 'Испытание завершено', color: 'success' as const };
    case 'decision_pending':
      return { icon: <HourglassIcon />, label: 'Ожидает решения', color: 'warning' as const };
    case 'approved':
      return { icon: <CheckIcon />, label: 'Одобрено', color: 'success' as const };
    case 'continue':
      return { icon: <ContinueIcon />, label: 'Продолжить', color: 'info' as const };
    case 'rejected':
      return { icon: <ErrorIcon />, label: 'Отклонено', color: 'error' as const };
    default:
      return { icon: <PendingIcon />, label: 'Не определен', color: 'default' as const };
  }
};

export const RegionalProgress: React.FC<RegionalProgressProps> = ({
  oblastStatuses,
  oblastData,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OblastStatusType | 'all'>('all');

  // Filtered oblasts
  const filteredOblastStatuses = useMemo(() => {
    if (!oblastStatuses) return [];

    return oblastStatuses.filter((oblastStatus) => {
      const oblast = oblastData.find(o => o.id === oblastStatus.oblast_id);
      const matchesSearch = !searchQuery ||
        oblast?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || oblastStatus.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [oblastStatuses, oblastData, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  if (!oblastStatuses || oblastStatuses.length === 0) {
    return (
      <Alert severity="info">
        Заявка еще не распределена по областям. Необходимо распределить заявку для создания испытаний.
      </Alert>
    );
  }

  // Подсчет статистики
  const stats = {
    total: oblastStatuses.length,
    planned: oblastStatuses.filter(o => o.status === 'planned').length,
    trialPlanCreated: oblastStatuses.filter(o => o.status === 'trial_plan_created').length,
    trialCreated: oblastStatuses.filter(o => o.status === 'trial_created').length,
    trialCompleted: oblastStatuses.filter(o => o.status === 'trial_completed').length,
    decisionPending: oblastStatuses.filter(o => o.status === 'decision_pending').length,
    approved: oblastStatuses.filter(o => o.status === 'approved').length,
    rejected: oblastStatuses.filter(o => o.status === 'rejected').length,
  };

  return (
    <Box>
      {/* Статистика */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Распределено по <strong>{stats.total}</strong> област(ям).
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {stats.planned > 0 && (
            <Chip label={`Запланировано: ${stats.planned}`} size="small" />
          )}
          {stats.trialPlanCreated > 0 && (
            <Chip label={`План создан: ${stats.trialPlanCreated}`} size="small" color="info" />
          )}
          {stats.trialCreated > 0 && (
            <Chip label={`Испытание создано: ${stats.trialCreated}`} size="small" color="info" />
          )}
          {stats.trialCompleted > 0 && (
            <Chip label={`Завершено: ${stats.trialCompleted}`} size="small" color="success" />
          )}
          {stats.decisionPending > 0 && (
            <Chip label={`Ожидает решения: ${stats.decisionPending}`} size="small" color="warning" />
          )}
          {stats.approved > 0 && (
            <Chip label={`Одобрено: ${stats.approved}`} size="small" color="success" />
          )}
          {stats.rejected > 0 && (
            <Chip label={`Отклонено: ${stats.rejected}`} size="small" color="error" />
          )}
        </Box>
      </Alert>

      {/* Search and Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          placeholder="Поиск по названию области..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, value) => value && setStatusFilter(value)}
            size="small"
            fullWidth
          >
            <ToggleButton value="all">
              Все ({stats.total})
            </ToggleButton>
            <ToggleButton value="trial_created">
              В работе ({stats.trialCreated})
            </ToggleButton>
            <ToggleButton value="approved">
              Одобрено ({stats.approved})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>

      {/* Filtered Results Info */}
      {filteredOblastStatuses.length !== oblastStatuses.length && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Найдено областей: {filteredOblastStatuses.length} из {oblastStatuses.length}
        </Alert>
      )}

      {/* Карточки областей */}
      {filteredOblastStatuses.length === 0 ? (
        <Alert severity="warning">
          Ничего не найдено. Попробуйте изменить параметры поиска или фильтра.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredOblastStatuses.map((oblastStatus) => {
          const statusConfig = getOblastStatusConfig(oblastStatus.status);
          const oblast = oblastData.find(o => o.id === oblastStatus.oblast_id);

          return (
            <Grid item xs={12} md={6} lg={4} key={oblastStatus.oblast_id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid',
                  borderColor:
                    oblastStatus.status === 'approved'
                      ? 'success.main'
                      : oblastStatus.status === 'rejected'
                      ? 'error.main'
                      : oblastStatus.status === 'trial_created' || oblastStatus.status === 'trial_completed'
                      ? 'info.main'
                      : 'divider',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Заголовок - Область */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" color="primary">
                      {oblast?.name || `Область #${oblastStatus.oblast_id}`}
                    </Typography>
                    {statusConfig.icon}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Статус */}
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      icon={statusConfig.icon}
                      label={statusConfig.label}
                      color={statusConfig.color}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  {/* Информация о плане испытаний */}
                  {oblastStatus.trial_plan_id && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        ПЛАН ИСПЫТАНИЙ
                      </Typography>
                      <Typography variant="body2">
                        ID плана: <strong>#{oblastStatus.trial_plan_id}</strong>
                      </Typography>
                    </Box>
                  )}

                  {/* Информация об испытании */}
                  {oblastStatus.trial_id && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        ИСПЫТАНИЕ
                      </Typography>
                      <Typography variant="body2">
                        ID испытания: <strong>#{oblastStatus.trial_id}</strong>
                      </Typography>
                    </Box>
                  )}

                  {/* Информация о решении */}
                  {oblastStatus.decision_date && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.selected', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        РЕШЕНИЕ
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Дата: <strong>{new Date(oblastStatus.decision_date).toLocaleDateString('ru-RU')}</strong>
                      </Typography>
                      {oblastStatus.decision_year && (
                        <Typography variant="body2" gutterBottom>
                          Год: <strong>{oblastStatus.decision_year}</strong>
                        </Typography>
                      )}
                      {oblastStatus.decision_justification && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {oblastStatus.decision_justification}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Если нет дополнительной информации */}
                  {!oblastStatus.trial_plan_id && !oblastStatus.trial_id && !oblastStatus.decision_date && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Ожидается создание плана испытаний
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  {oblastStatus.trial_id ? (
                    <Button
                      size="small"
                      onClick={() => navigate(`/trials/${oblastStatus.trial_id}`)}
                    >
                      Открыть испытание
                    </Button>
                  ) : oblastStatus.trial_plan_id ? (
                    <Button
                      size="small"
                      onClick={() => navigate(`/trial-plans/${oblastStatus.trial_plan_id}`)}
                    >
                      Открыть план
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                      Ожидается создание
                    </Typography>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      )}
    </Box>
  );
};
