import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Box,
  Typography,
  Chip,
  TableContainer,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useLaboratoryBulkEntry, useGetIndicatorsByCulture, useAddIndicators, useRemoveIndicators } from '@/hooks/useTrials';
import { getTodayISO } from '@/utils/dateHelpers';
import type { Trial, TrialParticipant, Indicator } from '@/types/api.types';

interface Props {
  open: boolean;
  onClose: () => void;
  trial: Trial;
  participant?: TrialParticipant; // Опционально - для массового ввода
  onSuccess: () => void;
}

export const LaboratoryResultsDialog: React.FC<Props> = ({
  open,
  onClose,
  trial,
  participant,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate, isPending } = useLaboratoryBulkEntry();
  
  // Хуки для управления показателями
  const { data: availableIndicators } = useGetIndicatorsByCulture(trial.culture);
  const { mutate: addIndicators } = useAddIndicators();
  const { mutate: removeIndicators } = useRemoveIndicators();
  
  const [analysisDate, setAnalysisDate] = useState(getTodayISO());
  const [showIndicatorsManagement, setShowIndicatorsManagement] = useState(false);
  const [massValues, setMassValues] = useState<Record<number, Record<number, number>>>({}); // participantId -> indicatorId -> value

  // Получаем качественные показатели из самого trial
  const qualityIndicators = (trial.indicators_data || []).filter(
    (ind: Indicator) => ind.is_quality
  );

  // Функция валидации значения показателя
  const validateValue = (indicator: Indicator, value: number): { isValid: boolean; error?: string } => {
    const validationRules = indicator.validation_rules;
    if (!validationRules) return { isValid: true };

    if (validationRules.min_value !== undefined && value < validationRules.min_value) {
      return { 
        isValid: false, 
        error: `Значение должно быть не менее ${validationRules.min_value}` 
      };
    }

    if (validationRules.max_value !== undefined && value > validationRules.max_value) {
      return { 
        isValid: false, 
        error: `Значение должно быть не более ${validationRules.max_value}` 
      };
    }

    return { isValid: true };
  };


  const handleMassValueChange = (participantId: number, indicatorId: number, value: string) => {
    const indicator = qualityIndicators.find(ind => ind.id === indicatorId);
    const validationRules = indicator?.validation_rules;
    
    let processedValue = value;
    
    // Применяем валидацию, если есть правила
    if (validationRules && value !== '') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Проверяем минимальное значение
        if (validationRules.min_value !== undefined && numValue < validationRules.min_value) {
          processedValue = validationRules.min_value.toString();
        }
        
        // Проверяем максимальное значение
        if (validationRules.max_value !== undefined && numValue > validationRules.max_value) {
          processedValue = validationRules.max_value.toString();
        }
        
        // Ограничиваем точность
        if (validationRules.precision !== undefined) {
          const multiplier = Math.pow(10, validationRules.precision);
          const rounded = Math.round(numValue * multiplier) / multiplier;
          processedValue = rounded.toString();
        }
      }
    }
    
    setMassValues((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [indicatorId]: processedValue === '' ? 0 : Number(processedValue),
      },
    }));
  };

  const handleSubmit = () => {
    // Массовый ввод для всех участников
    const participants = trial.participants_data || [];
    let totalSaved = 0;
    let totalErrors = 0;

    const savePromises = participants.map(async (participant) => {
      const participantValues = massValues[participant.id] || {};
      const results = Object.entries(participantValues)
        .filter(([_, value]) => value !== null && value !== undefined && value !== 0)
        .map(([indicatorId, value]) => ({
          indicator: Number(indicatorId),
          value: Number(value),
        }));

      if (results.length === 0) return; // Пропускаем участников без данных

      try {
        await new Promise((resolve, reject) => {
          mutate(
            {
              id: trial.id,
              payload: {
                laboratory_code: trial.laboratory_code || '',
                analysis_date: analysisDate,
                participant_id: participant.id,
                results,
              },
            },
            {
              onSuccess: () => {
                totalSaved++;
                resolve(true);
              },
              onError: (error: any) => {
                totalErrors++;
                reject(error);
              },
            }
          );
        });
      } catch (error) {
        console.error(`Ошибка для участника ${participant.id}:`, error);
      }
    });

    Promise.allSettled(savePromises).then(() => {
      if (totalSaved > 0) {
        enqueueSnackbar(`Сохранено для ${totalSaved} участников`, { variant: 'success' });
        onSuccess();
        onClose();
        setAnalysisDate(getTodayISO());
        setMassValues({});
      } else {
        enqueueSnackbar('Нет данных для сохранения', { variant: 'warning' });
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Лабораторные результаты: Все участники ({trial.participants_data?.length || 0})
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowIndicatorsManagement(!showIndicatorsManagement)}
            >
              Управление показателями
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {trial.laboratory_code ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Код лаборатории: <strong>{trial.laboratory_code}</strong>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Образец еще не отправлен в лабораторию
          </Alert>
        )}

        {/* Управление показателями */}
        {showIndicatorsManagement && (
          <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Управление показателями
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Добавьте или удалите показатели для лабораторного анализа
            </Typography>
            
            {/* Текущие показатели */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Текущие показатели ({qualityIndicators.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {qualityIndicators.map((indicator) => (
                  <Chip
                    key={indicator.id}
                    label={`${indicator.name} (${indicator.unit})`}
                    onDelete={() => {
                      removeIndicators(
                        { trialId: trial.id, payload: { indicator_ids: [indicator.id] } },
                        {
                          onSuccess: () => {
                            enqueueSnackbar('Показатель удален', { variant: 'success' });
                            onSuccess();
                          },
                          onError: (error: any) => {
                            enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
                          },
                        }
                      );
                    }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>

            {/* Доступные показатели для добавления */}
            {availableIndicators && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Доступные показатели:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableIndicators?.quality_indicators
                    ?.filter((indicator: Indicator) => 
                      !qualityIndicators.some(qi => qi.id === indicator.id)
                    )
                    .map((indicator: Indicator) => (
                      <Chip
                        key={indicator.id}
                        label={`${indicator.name} (${indicator.unit})`}
                        onClick={() => {
                          addIndicators(
                            { trialId: trial.id, payload: { indicator_ids: [indicator.id] } },
                            {
                              onSuccess: () => {
                                enqueueSnackbar('Показатель добавлен', { variant: 'success' });
                                onSuccess();
                              },
                              onError: (error: any) => {
                                enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
                              },
                            }
                          );
                        }}
                        color="default"
                        variant="outlined"
                        icon={<AddIcon />}
                      />
                    ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        <TextField
          label="Дата анализа"
          type="date"
          fullWidth
          value={analysisDate}
          onChange={(e) => setAnalysisDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        {/* Массовый ввод */}
        {(
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Участник</TableCell>
                  {qualityIndicators.map((indicator) => (
                    <TableCell key={indicator.id} align="center">
                      {indicator.name}
                      <Typography variant="caption" display="block">
                        ({indicator.unit})
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(trial.participants_data || []).map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {participant.sort_record_data.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        №{participant.participant_number}
                      </Typography>
                    </TableCell>
                    {qualityIndicators.map((indicator) => {
                      const currentValue = massValues[participant.id]?.[indicator.id] || '';
                      const numValue = Number(currentValue);
                      const validation = validateValue(indicator, numValue);
                      const validationRules = indicator.validation_rules;
                      
                      return (
                        <TableCell key={indicator.id} align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={currentValue}
                            onChange={(e) => handleMassValueChange(participant.id, indicator.id, e.target.value)}
                            error={!validation.isValid}
                            helperText={
                              !validation.isValid 
                                ? validation.error 
                                : validationRules 
                                  ? `мин: ${validationRules.min_value || 0}, макс: ${validationRules.max_value || '∞'}`
                                  : ''
                            }
                            inputProps={{ 
                              step: validationRules?.precision === 0 ? 1 : validationRules?.precision === 1 ? 0.1 : 0.1,
                              min: validationRules?.min_value || 0,
                              max: validationRules?.max_value,
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {qualityIndicators.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Нет доступных качественных показателей для данной культуры
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={isPending || Object.keys(massValues).length === 0}
          title={
            Object.keys(massValues).length === 0
              ? 'Введите хотя бы одно значение' 
              : ''
          }
        >
          Сохранить для всех
        </Button>
      </DialogActions>
    </Dialog>
  );
};

