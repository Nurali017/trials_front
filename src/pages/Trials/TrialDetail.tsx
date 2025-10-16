import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ScienceOutlined as LabIcon,
  EditNote as Form008Icon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTrial, useLaboratoryComplete, useCompleteTrial } from '@/hooks/useTrials';
import { MarkSentToLabDialog } from '@/components/forms/MarkSentToLabDialog';
import { LaboratoryResultsDialog } from '@/components/forms/LaboratoryResultsDialog';
import { IndicatorChipList } from '@/components/common/IndicatorChip';
import { StatisticalResultBadge } from '@/components/common/StatisticalResultBadge';
import type { TrialParticipant } from '@/types/api.types';
import {
  getTrialStatusMuiColor,
  getTrialStatusLabel,
  calculateProgress,
} from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';

export const TrialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [labResultsDialogOpen, setLabResultsDialogOpen] = useState(false);
  const [selectedParticipantForLab, setSelectedParticipantForLab] = useState<TrialParticipant | null>(null);

  const { data: trial, isLoading, refetch } = useTrial(Number(id));
  const { mutate: completeLab } = useLaboratoryComplete();
  const { mutate: completeTrial } = useCompleteTrial();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!trial) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Испытание не найдено
        </Typography>
        <Button onClick={() => navigate('/trials')} sx={{ mt: 2 }}>
          Назад к списку
        </Button>
      </Box>
    );
  }

  const progress = calculateProgress(trial.results_count, trial.indicators_data?.length || 0);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {trial.title}
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              label={getTrialStatusLabel(trial.status)}
              color={getTrialStatusMuiColor(trial.status)}
              size="small"
            />
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          {/* Кнопка для формы 008 */}
          {trial.status === 'active' && (
            <Button
              startIcon={<Form008Icon />}
              variant="contained"
              color="primary"
              onClick={() => navigate(`/trials/${id}/form008`)}
            >
              Заполнить форму 008
            </Button>
          )}

          {/* Laboratory Workflow Buttons */}
          {trial.status === 'completed_008' && !trial.laboratory_code && (
            <Button
              startIcon={<LabIcon />}
              variant="outlined"
              color="secondary"
              onClick={() => setLabDialogOpen(true)}
            >
              Отправить в лабораторию
            </Button>
          )}

          {trial.status === 'lab_sample_sent' && trial.participants_data && (
            <>
              <Button
                startIcon={<LabIcon />}
                variant="outlined"
                color="info"
                onClick={() => {
                  setSelectedParticipantForLab(trial.participants_data![0]);
                  setLabResultsDialogOpen(true);
                }}
              >
                Внести лабораторные результаты
              </Button>
              <Button
                variant="outlined"
                color="success"
                onClick={() => {
                  completeLab(
                    { id: trial.id, payload: { completed_date: new Date().toISOString().split('T')[0] } },
                    {
                      onSuccess: () => {
                        enqueueSnackbar('Лабораторные анализы завершены', { variant: 'success' });
                        refetch();
                      },
                      onError: (error: any) => {
                        enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
                      },
                    }
                  );
                }}
              >
                Завершить лабораторные анализы
              </Button>
            </>
          )}

          {trial.status === 'lab_completed' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                if (window.confirm('Завершить испытание? Все данные будут зафиксированы.')) {
                  completeTrial(trial.id, {
                    onSuccess: () => {
                      enqueueSnackbar('Испытание завершено', { variant: 'success' });
                      refetch();
                    },
                    onError: (error: any) => {
                      enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
                    },
                  });
                }
              }}
            >
              Завершить испытание
            </Button>
          )}

        </Box>
      </Box>

      {/* Main Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Область
            </Typography>
            <Typography variant="body1">{trial.oblast_name}</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Регион
            </Typography>
            <Typography variant="body1">{trial.region_name}</Typography>
            {trial.climate_zone_name && (
              <Typography variant="body2" color="text.secondary">
                {trial.climate_zone_name}
              </Typography>
            )}
          </Grid>

          {trial.trial_type_data && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Тип испытания
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {trial.trial_type_data.name_full}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {trial.trial_type_data.category_display}
              </Typography>
            </Grid>
          )}

          {trial.area_ha && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Площадь
              </Typography>
              <Typography variant="body1">{trial.area_ha} га</Typography>
            </Grid>
          )}

          {trial.planting_season && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Сезон посева
              </Typography>
              <Typography variant="body1">
                {trial.planting_season === 'spring' ? 'Весна' : 'Осень'}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Период проведения
            </Typography>
            <Typography variant="body1">
              {formatDate(trial.start_date)}
              {trial.end_date && ` - ${formatDate(trial.end_date)}`}
            </Typography>
          </Grid>

          {trial.responsible_person && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Ответственный
              </Typography>
              <Typography variant="body1">{trial.responsible_person}</Typography>
            </Grid>
          )}

          {trial.planting_season && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Сезон посадки
              </Typography>
              <Typography variant="body1">
                {trial.planting_season === 'spring' ? 'Весенний' : 'Осенний'}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Прогресс сбора результатов
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box flexGrow={1}>
                <Box
                  sx={{
                    width: '100%',
                    height: 10,
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${progress}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                      transition: 'width 0.3s',
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" fontWeight={500}>
                {trial.results_count} / {trial.indicators_data?.length || 0}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Indicators */}
      {trial.indicators_data && trial.indicators_data.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Показатели для сбора ({trial.indicators_data.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Показатели, которые собираются в рамках этого испытания
          </Typography>
          <IndicatorChipList 
            indicators={trial.indicators_data} 
            showCategory={true}
          />
        </Paper>
      )}

      {/* Participants */}
      {trial.participants_data && trial.participants_data.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Участники испытания ({trial.participants_data.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Сорта, участвующие в испытании
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>№</TableCell>
                  <TableCell>Сорт</TableCell>
                  <TableCell>Группа</TableCell>
                  <TableCell>Заявка</TableCell>
                  <TableCell>Статистическая оценка</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trial.participants_data
                  .sort((a, b) => a.participant_number - b.participant_number)
                  .map(participant => (
                    <TableRow key={participant.id}>
                      <TableCell>{participant.participant_number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {participant.sort_record_data.name}
                        </Typography>
                        {participant.sort_record_data.culture_name && (
                          <Typography variant="caption" color="text.secondary">
                            {participant.sort_record_data.culture_name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={participant.statistical_group === 0 ? '⭐ Стандарт' : 'Испытываемый'}
                          color={participant.statistical_group === 0 ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {participant.application_number ? (
                          <Typography
                            variant="body2"
                            sx={{ cursor: 'pointer', color: 'primary.main' }}
                            onClick={() => navigate(`/applications/${participant.application}`)}
                          >
                            {participant.application_number}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatisticalResultBadge result={participant.statistical_result} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Trial Statistics */}
      {trial.trial_statistics && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Статистика опыта
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Sx (стандартное отклонение)
              </Typography>
              <Typography variant="h6">{trial.trial_statistics.sx.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Точность опыта (P%)
              </Typography>
              <Typography variant="h6" color={
                trial.trial_statistics.accuracy_percent <= 3 ? 'success.main' : 
                trial.trial_statistics.accuracy_percent <= 5 ? 'warning.main' : 
                'error.main'
              }>
                {trial.trial_statistics.accuracy_percent.toFixed(1)}%
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                НСР (наименьшая существенная разница)
              </Typography>
              <Typography variant="h6">{trial.trial_statistics.lsd.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Ошибка средней
              </Typography>
              <Typography variant="h6">{trial.trial_statistics.error_mean.toFixed(2)}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Completion Status */}
      {trial.completion_status && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Заполненность данных
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box flexGrow={1}>
              <Box
                sx={{
                  width: '100%',
                  height: 12,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${trial.completion_status.filled_percent}%`,
                    height: '100%',
                    bgcolor: trial.completion_status.is_complete ? 'success.main' : 'primary.main',
                    transition: 'width 0.3s',
                  }}
                />
              </Box>
            </Box>
            <Chip 
              label={`${trial.completion_status.filled_percent.toFixed(1)}%`}
              color={trial.completion_status.is_complete ? 'success' : 'warning'}
            />
          </Box>
          
          {!trial.completion_status.is_complete && trial.completion_status.missing_data.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Не заполнено ({trial.completion_status.missing_data.length}):
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {trial.completion_status.missing_data.slice(0, 5).map((item, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">{item}</Typography>
                  </li>
                ))}
                {trial.completion_status.missing_data.length > 5 && (
                  <li>
                    <Typography variant="body2" color="text.secondary">
                      ... и еще {trial.completion_status.missing_data.length - 5}
                    </Typography>
                  </li>
                )}
              </Box>
            </Alert>
          )}
        </Paper>
      )}

      {/* Decision */}
      {trial.decision && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Принятое решение
          </Typography>
          <Alert severity={getDecisionMuiColor(trial.decision)} sx={{ mb: 2 }}>
            <Typography variant="body1" fontWeight={500} gutterBottom>
              {getDecisionLabel(trial.decision)}
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Обоснование
              </Typography>
              <Typography variant="body1">{trial.decision_justification}</Typography>
            </Grid>

            {trial.decision_recommendations && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Рекомендации
                </Typography>
                <Typography variant="body1">{trial.decision_recommendations}</Typography>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Дата решения
              </Typography>
              <Typography variant="body1">
                {trial.decision_date ? formatDate(trial.decision_date) : '-'}
              </Typography>
            </Grid>

            {trial.decided_by_name && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Принял решение
                </Typography>
                <Typography variant="body1">{trial.decided_by_name}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}



      {/* Laboratory Workflow Dialogs */}
      <MarkSentToLabDialog
        open={labDialogOpen}
        onClose={() => setLabDialogOpen(false)}
        trial={trial}
        onSuccess={refetch}
      />

      {selectedParticipantForLab && (
        <LaboratoryResultsDialog
          open={labResultsDialogOpen}
          onClose={() => {
            setLabResultsDialogOpen(false);
            setSelectedParticipantForLab(null);
          }}
          trial={trial}
          participant={selectedParticipantForLab}
          onSuccess={refetch}
        />
      )}
    </Box>
  );
};
