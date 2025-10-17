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
  // Убираем неиспользуемые импорты для таблицы
  Chip,
  Alert,
  // Убираем CircularProgress - не используется
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
// Убираем usePreviewStatistics - не нужен
import type { 
  Form008Data,
  TrialStatistics,
} from '@/types/api.types';

interface StatisticsPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  // Убираем неиспользуемые пропсы
  form008Data?: Form008Data;
  savedStatistics?: TrialStatistics;
  manualStatistics?: {
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
  } | null;
  onUseManualStatistics?: (values: {
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
  }) => void;
  onResetToAutoStatistics?: () => void;
}

export const StatisticsPreviewDialog: React.FC<StatisticsPreviewDialogProps> = ({
  open,
  onClose,
  form008Data,
  savedStatistics,
  manualStatistics,
  onUseManualStatistics,
  onResetToAutoStatistics,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  // Убираем previewStatistics - не нужен после сохранения данных

  const [lsd095, setLsd095] = useState<number | ''>('');
  const [errorMean, setErrorMean] = useState<number | ''>('');
  const [accuracyPercent, setAccuracyPercent] = useState<number | ''>('');

  // Инициализация значений из существующих данных
  useEffect(() => {
    // Приоритет: ручные значения > сохраненная статистика > авторасчет
    if (manualStatistics) {
      setLsd095(manualStatistics.lsd_095 || '');
      setErrorMean(manualStatistics.error_mean || '');
      setAccuracyPercent(manualStatistics.accuracy_percent || '');
    } else {
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
    }
  }, [form008Data, savedStatistics, manualStatistics]);

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

  // Убираем handlePreview - не нужен после сохранения данных

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

  // Убираем renderComparisonTable - не нужна без previewData

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
        {/* Убираем обработку ошибок - не нужна без previewStatistics */}

        {/* Информация о сохраненных данных */}
         {savedStatistics && (
           <Alert severity="success" sx={{ mb: 3 }}>
             <Typography variant="body2">
               <strong>Данные сохранены и рассчитаны!</strong> Показаны результаты автоматических расчетов на основе сохраненной урожайности.
             </Typography>
           </Alert>
         )}
         
         {!savedStatistics && form008Data?.auto_statistics && (
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

         {/* Индикатор текущего режима */}
         {!savedStatistics && (
           <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
             <Typography variant="body2" color="text.secondary" gutterBottom>
               Текущий режим расчетов:
             </Typography>
             <Box display="flex" alignItems="center" gap={2}>
               <Chip 
                 label={manualStatistics ? "Ручной ввод" : "Автоматический расчет"} 
                 color={manualStatistics ? "primary" : "default"}
                 size="small"
               />
               {manualStatistics && onResetToAutoStatistics && (
                 <Button 
                   size="small" 
                   variant="outlined"
                   onClick={onResetToAutoStatistics}
                 >
                   Сбросить к авторасчету
                 </Button>
               )}
             </Box>
           </Box>
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
          
          {/* Кнопки управления */}
          {!savedStatistics && onUseManualStatistics && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Валидация
                  if (!lsd095 || (typeof lsd095 === 'number' && lsd095 <= 0)) {
                    enqueueSnackbar('НСР₀.₉₅ должен быть положительным числом', { variant: 'error' });
                    return;
                  }
                  
                  if (errorMean && typeof errorMean === 'number' && errorMean < 0) {
                    enqueueSnackbar('Ошибка средней не может быть отрицательной', { variant: 'error' });
                    return;
                  }
                  
                  if (accuracyPercent && typeof accuracyPercent === 'number' && (accuracyPercent < 0 || accuracyPercent > 100)) {
                    enqueueSnackbar('Точность должна быть от 0 до 100%', { variant: 'error' });
                    return;
                  }
                  
                  if (onUseManualStatistics) {
                    onUseManualStatistics({
                      lsd_095: typeof lsd095 === 'number' ? lsd095 : undefined,
                      error_mean: typeof errorMean === 'number' ? errorMean : undefined,
                      accuracy_percent: typeof accuracyPercent === 'number' ? accuracyPercent : undefined,
                    });
                  }
                }}
                disabled={!lsd095}
              >
                Использовать эти значения
              </Button>
              {/* Убираем кнопку предварительного просмотра - не нужна после сохранения */}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Результаты расчетов */}
         {(savedStatistics || form008Data?.auto_statistics) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Результаты расчетов
            </Typography>

             {/* Статистические показатели */}
             <Grid container spacing={2} sx={{ mb: 3 }}>
               <Grid item xs={12} sm={4}>
                 {renderStatisticsCard(
                   'НСР₀.₉₅', 
                   savedStatistics?.lsd_095 || form008Data?.auto_statistics?.auto_lsd_095, 
                   'ц/га'
                 )}
               </Grid>
               <Grid item xs={12} sm={4}>
                 {renderStatisticsCard(
                   'E (ошибка)', 
                   savedStatistics?.error_mean || form008Data?.auto_statistics?.auto_error_mean, 
                   'ц/га'
                 )}
               </Grid>
               <Grid item xs={12} sm={4}>
                 {renderStatisticsCard(
                   'P% (точность)', 
                   savedStatistics?.accuracy_percent || form008Data?.auto_statistics?.auto_accuracy_percent, 
                   '%'
                 )}
               </Grid>
             </Grid>

            {/* Убираем таблицу сравнения - не нужна без previewData */}

            {/* Примечание */}
            {(savedStatistics?.note || form008Data?.auto_statistics?.note) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Примечание:</strong> {savedStatistics?.note || form008Data?.auto_statistics?.note}
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Информация о расчетах */}
        {!savedStatistics && (
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
        <Button onClick={onClose}>
          Закрыть
        </Button>
        {/* Убираем кнопку предварительного просмотра - не нужна после сохранения */}
      </DialogActions>
    </Dialog>
  );
};
