import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Calculate as CalculateIcon, Preview as PreviewIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { usePreviewStatistics } from '@/hooks/useTrials';
import type { 
  Form008StatisticsResponse, 
  StatisticsPreviewRequest,
  Form008Data,
  Form008Result,
  TrialStatistics,
} from '@/types/api.types';

interface StatisticsPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  trialId: number;
  formData: Record<number, Record<string, Form008Result>>;
  form008Data?: Form008Data;
  savedStatistics?: TrialStatistics;
}

export const StatisticsPreviewDialog: React.FC<StatisticsPreviewDialogProps> = ({
  open,
  onClose,
  trialId,
  formData,
  form008Data,
  savedStatistics,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: previewStatistics, data: previewData, isPending, isError, error } = usePreviewStatistics();

  const [lsd095, setLsd095] = useState<number | ''>('');
  const [errorMean, setErrorMean] = useState<number | ''>('');
  const [accuracyPercent, setAccuracyPercent] = useState<number | ''>('');

  // Инициализация значений из существующих данных
  useEffect(() => {
    // Приоритет у сохраненной статистики, затем у данных формы, затем у авторасчета
    const statistics = savedStatistics || form008Data?.statistics;
    const autoStats = form008Data?.auto_statistics;
    
    if (statistics) {
      setLsd095(statistics.lsd_095 || '');
      setErrorMean(statistics.error_mean || '');
      setAccuracyPercent(statistics.accuracy_percent || '');
    } else if (autoStats) {
      // Используем авторасчет если нет финальной статистики
      setLsd095(autoStats.auto_lsd_095 || '');
      setErrorMean(autoStats.auto_error_mean || '');
      setAccuracyPercent(autoStats.auto_accuracy_percent || '');
    }
  }, [form008Data, savedStatistics]);

  // Автоматически заполняем поля авторасчетами при открытии диалога
  useEffect(() => {
    if (open && form008Data?.auto_statistics && !savedStatistics && !form008Data?.statistics) {
      const autoStats = form008Data.auto_statistics;
      if (autoStats.auto_lsd_095 && !lsd095) {
        setLsd095(autoStats.auto_lsd_095);
      }
      if (autoStats.auto_error_mean && !errorMean) {
        setErrorMean(autoStats.auto_error_mean);
      }
      if (autoStats.auto_accuracy_percent && !accuracyPercent) {
        setAccuracyPercent(autoStats.auto_accuracy_percent);
      }
    }
  }, [open, form008Data, savedStatistics, lsd095, errorMean, accuracyPercent]);

  const handlePreview = () => {
    // Используем авторасчет если поле НСР₀.₉₅ не заполнено
    const lsdValue = lsd095 || form008Data?.auto_statistics?.auto_lsd_095;
    
    if (!lsdValue || !form008Data?.participants) {
      enqueueSnackbar('Введите НСР₀.₉₅ для расчета или убедитесь, что есть авторасчеты', { variant: 'warning' });
      return;
    }

    // Подготавливаем данные для предварительного просмотра
    const participants = form008Data.participants.map(participant => {
      const results: Record<string, number> = {};
      
      // Собираем результаты по всем показателям
      form008Data.indicators.forEach(indicator => {
        const result = formData[participant.id]?.[indicator.code];
        if (result?.value !== undefined) {
          results[indicator.code] = result.value;
        }
      });

      return {
        participant_id: participant.id,
        results,
      };
    });

    const payload: StatisticsPreviewRequest = {
      statistics: {
        lsd_095: Number(lsdValue),
        error_mean: errorMean ? Number(errorMean) : undefined,
        accuracy_percent: accuracyPercent ? Number(accuracyPercent) : undefined,
      },
      participants,
    };

    previewStatistics({ trialId, payload });
  };

  const renderStatisticsCard = (title: string, value: number | undefined | null, unit: string) => (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value !== undefined && value !== null ? value.toFixed(2) : '—'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {unit}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderComparisonTable = (data: Form008StatisticsResponse) => (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Участник</TableCell>
            <TableCell align="center">Урожайность</TableCell>
            <TableCell align="center">Код группы</TableCell>
            <TableCell align="center">Отклонение</TableCell>
            <TableCell align="center">% от стандарта</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Стандарт */}
          <TableRow sx={{ backgroundColor: 'action.hover' }}>
            <TableCell>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">{data.standard?.sort_name || '—'}</Typography>
                <Chip label="Стандарт" color="warning" size="small" />
              </Box>
            </TableCell>
            <TableCell align="center">
              <Typography fontWeight="bold">
                {data.standard?.yield?.toFixed(2) || '—'}
              </Typography>
            </TableCell>
            <TableCell align="center">—</TableCell>
            <TableCell align="center">—</TableCell>
            <TableCell align="center">100%</TableCell>
          </TableRow>

          {/* Остальные участники */}
          {data.comparison?.map((participant) => (
            <TableRow key={participant.participant_id} hover>
              <TableCell>{participant.sort_name}</TableCell>
              <TableCell align="center">
                {participant.yield?.toFixed(2) || '—'}
              </TableCell>
              <TableCell align="center">
                {participant.statistical_result !== undefined ? (
                  <Chip
                    label={participant.statistical_result > 0 ? `+${participant.statistical_result}` : participant.statistical_result}
                    color={participant.statistical_result > 0 ? 'success' : participant.statistical_result < 0 ? 'error' : 'default'}
                    size="small"
                  />
                ) : '—'}
              </TableCell>
              <TableCell align="center">
                {participant.difference_from_standard !== undefined ? (
                  <Typography color={participant.difference_from_standard > 0 ? 'success.main' : 'error.main'}>
                    {participant.difference_from_standard > 0 ? '+' : ''}{participant.difference_from_standard.toFixed(2)}
                  </Typography>
                ) : '—'}
              </TableCell>
              <TableCell align="center">
                {participant.percent_difference !== undefined ? (
                  <Typography color={participant.percent_difference > 100 ? 'success.main' : 'error.main'}>
                    {participant.percent_difference.toFixed(1)}%
                  </Typography>
                ) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CalculateIcon color="primary" />
         <Typography variant="h6">
           {savedStatistics ? 'Результаты расчетов' : 
            form008Data?.auto_statistics ? 'Авторасчеты для справки' : 
            'Предварительный просмотр расчетов'}
         </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Ошибка: {error?.message || 'Неизвестная ошибка'}
            </Typography>
          </Alert>
        )}

        {/* Информация о сохраненных данных */}
         {savedStatistics && (
           <Alert severity="success" sx={{ mb: 3 }}>
             <Typography variant="body2">
               <strong>Данные сохранены и рассчитаны!</strong> Показаны результаты автоматических расчетов на основе сохраненной урожайности.
             </Typography>
           </Alert>
         )}
         
         {!savedStatistics && !previewData && form008Data?.auto_statistics && (
           <Alert severity="warning" sx={{ mb: 3 }}>
             <Typography variant="body2">
               <strong>Показаны авторасчеты для справки.</strong> {form008Data.auto_statistics.note}
               {form008Data.auto_statistics.warning && (
                 <>
                   <br />
                   <strong>Внимание:</strong> {form008Data.auto_statistics.warning}
                 </>
               )}
             </Typography>
           </Alert>
         )}

        {/* Ввод статистических параметров */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Статистические параметры
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="НСР₀.₉₅"
                type="number"
                fullWidth
                value={lsd095}
                onChange={(e) => setLsd095(e.target.value ? parseFloat(e.target.value) : '')}
                inputProps={{ step: 0.1, min: 0 }}
                helperText="Обязательный параметр для расчета"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="E (ошибка средней)"
                type="number"
                fullWidth
                value={errorMean}
                onChange={(e) => setErrorMean(e.target.value ? parseFloat(e.target.value) : '')}
                inputProps={{ step: 0.1, min: 0 }}
                helperText="Опционально"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="P% (точность опыта)"
                type="number"
                fullWidth
                value={accuracyPercent}
                onChange={(e) => setAccuracyPercent(e.target.value ? parseFloat(e.target.value) : '')}
                inputProps={{ step: 0.1, min: 0, max: 100 }}
                helperText="Опционально"
              />
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Результаты расчетов */}
         {(previewData || savedStatistics || form008Data?.auto_statistics) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Результаты расчетов
            </Typography>

             {/* Статистические показатели */}
             <Grid container spacing={2} sx={{ mb: 3 }}>
               <Grid item xs={12} sm={4}>
                 {renderStatisticsCard(
                   'НСР₀.₉₅', 
                   previewData?.statistics?.lsd_095 || savedStatistics?.lsd_095 || form008Data?.auto_statistics?.auto_lsd_095, 
                   'ц/га'
                 )}
               </Grid>
               <Grid item xs={12} sm={4}>
                 {renderStatisticsCard(
                   'E (ошибка)', 
                   previewData?.statistics?.error_mean || savedStatistics?.error_mean || form008Data?.auto_statistics?.auto_error_mean, 
                   'ц/га'
                 )}
               </Grid>
               <Grid item xs={12} sm={4}>
                 {renderStatisticsCard(
                   'P% (точность)', 
                   previewData?.statistics?.accuracy_percent || savedStatistics?.accuracy_percent || form008Data?.auto_statistics?.auto_accuracy_percent, 
                   '%'
                 )}
               </Grid>
             </Grid>

            {/* Таблица сравнения - показываем только если есть previewData */}
            {previewData && (
              <>
                <Typography variant="h6" gutterBottom>
                  Сравнение с стандартом
                </Typography>
                {renderComparisonTable(previewData)}
              </>
            )}

            {/* Примечание */}
            {(previewData?.statistics?.note || savedStatistics?.note || form008Data?.auto_statistics?.note) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Примечание:</strong> {previewData?.statistics?.note || savedStatistics?.note || form008Data?.auto_statistics?.note}
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Информация о расчетах */}
        {!previewData && !savedStatistics && (
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Как работают расчеты:</strong>
              <br />
              • Код группы = int((У_сорта - У_стандарта) / НСР₀.₉₅)
              <br />
              • Код ≥1: превышение над стандартом на N НСР
              <br />
              • Код 0: отклонение &lt; НСР (статистически равен стандарту)
              <br />
              • Код ≤-1: отставание от стандарта на N НСР
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Закрыть
        </Button>
        <Button
          onClick={handlePreview}
          variant="contained"
          startIcon={isPending ? <CircularProgress size={20} /> : <PreviewIcon />}
          disabled={isPending || !lsd095}
        >
          {isPending ? 'Расчет...' : 'Рассчитать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
