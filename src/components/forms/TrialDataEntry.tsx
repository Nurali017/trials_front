import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  RestoreFromTrash as RestoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useBulkEntry } from '@/hooks/useResults';
import { getTodayISO } from '@/utils/dateHelpers';
import type { Trial, Indicator, BulkEntryDataItem } from '@/types/api.types';

interface TrialDataEntryProps {
  trial: Trial;
  onSuccess: () => void;
}

// Структура данных для ввода - поддерживает и делянки, и единичные значения
interface IndicatorData {
  plots?: number[];  // Для показателей с делянками (например, урожайность)
  value?: number;    // Для остальных показателей
  text_value?: string; // Опциональное текстовое значение
}

interface ParticipantData {
  [indicatorId: number]: IndicatorData;
}

interface AllData {
  [participantId: number]: ParticipantData;
}

const AUTOSAVE_KEY_PREFIX = 'trial_data_autosave_';
const AUTOSAVE_DELAY = 3000; // 3 секунды

export const TrialDataEntry: React.FC<TrialDataEntryProps> = ({ trial, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [measurementDate, setMeasurementDate] = useState(getTodayISO());
  const [data, setData] = useState<AllData>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const inputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  const bulkEntry = useBulkEntry();

  const participants = trial.participants_data || [];
  // Показываем только ОСНОВНЫЕ показатели (is_quality=false) для сортопыта
  // Качественные показатели (is_quality=true) заполняются лабораторией
  const indicators = (trial.indicators_data || []).filter(ind => !ind.is_quality);
  
  // Находим стандарт
  const standardParticipant = participants.find(p => p.statistical_group === 0);

  const storageKey = `${AUTOSAVE_KEY_PREFIX}${trial.id}`;

  // Определяем, какие показатели используют делянки (только урожайность)
  const indicatorUsesPlots = (indicator: Indicator) => {
    return indicator.code === 'yield';
  };

  // Определяем, какие показатели рассчитываются автоматически
  const indicatorIsAutoCalculated = (indicator: Indicator) => {
    // Показатели отклонения рассчитываются автоматически на основе урожайности
    return indicator.code === 'deviation_standard' || 
           indicator.code === 'deviation_abs' ||
           indicator.code === 'deviation_pct' ||
           indicator.name.includes('Отклонение от стандарта');
  };
  
  // 🔍 DEBUG: Выводим информацию о показателях в консоль для проверки
  React.useEffect(() => {
    if (indicators.length > 0) {
      // Показатели загружены успешно
    }
  }, [indicators.length]);

  // Загрузка автосохраненных данных при монтировании
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed.data);
        setMeasurementDate(parsed.measurementDate);
        enqueueSnackbar('Восстановлены несохраненные данные', { 
          variant: 'info',
          action: (
            <Button color="inherit" size="small" onClick={handleClearDraft}>
              Очистить
            </Button>
          ),
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки автосохранения:', error);
    }
  }, [trial.id]);

  // Автосохранение с debounce
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setHasUnsavedChanges(true);
      
      // Очищаем предыдущий таймер
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }

      // Устанавливаем новый таймер
      autosaveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            data,
            measurementDate,
            timestamp: new Date().toISOString(),
          }));
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Ошибка автосохранения:', error);
        }
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [data, measurementDate, storageKey]);

  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setData({});
    setLastSaved(null);
    setHasUnsavedChanges(false);
    enqueueSnackbar('Черновик удален', { variant: 'info' });
  }, [storageKey, enqueueSnackbar]);

  // Обновление значения делянки
  const updatePlotValue = (
    participantId: number,
    indicatorId: number,
    plotIndex: number,
    value: string
  ) => {
    setData(prev => {
      const newData = { ...prev };
      if (!newData[participantId]) {
        newData[participantId] = {};
      }
      if (!newData[participantId][indicatorId]) {
        newData[participantId][indicatorId] = { plots: [] };
      }
      if (!newData[participantId][indicatorId].plots) {
        newData[participantId][indicatorId].plots = [];
      }
      
      const plots = [...(newData[participantId][indicatorId].plots || [])];
      plots[plotIndex] = value ? parseFloat(value) : undefined as any;
      newData[participantId][indicatorId].plots = plots;
      
      return newData;
    });
  };

  // Обновление единичного значения
  const updateSingleValue = (
    participantId: number,
    indicatorId: number,
    value: string
  ) => {
    setData(prev => {
      const newData = { ...prev };
      if (!newData[participantId]) {
        newData[participantId] = {};
      }
      if (!newData[participantId][indicatorId]) {
        newData[participantId][indicatorId] = {};
      }
      
      newData[participantId][indicatorId].value = value ? parseFloat(value) : undefined;
      
      return newData;
    });
  };

  // Keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent,
    participantId: number,
    indicatorId: number,
    plotIndex?: number
  ) => {
    const participantIdx = participants.findIndex(p => p.id === participantId);
    const indicatorIdx = indicators.findIndex(i => i.id === indicatorId);

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Переход к следующему показателю
      if (indicatorIdx < indicators.length - 1) {
        const nextIndicator = indicators[indicatorIdx + 1];
        const key = plotIndex !== undefined 
          ? `${participantId}-${nextIndicator.id}-${plotIndex}`
          : `${participantId}-${nextIndicator.id}`;
        inputRefs.current[key]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Переход к предыдущему показателю
      if (indicatorIdx > 0) {
        const prevIndicator = indicators[indicatorIdx - 1];
        const key = plotIndex !== undefined 
          ? `${participantId}-${prevIndicator.id}-${plotIndex}`
          : `${participantId}-${prevIndicator.id}`;
        inputRefs.current[key]?.focus();
      }
    } else if (e.key === 'ArrowRight' && plotIndex !== undefined) {
      e.preventDefault();
      // Переход к следующей делянке или участнику
      if (plotIndex < 3) {
        const key = `${participantId}-${indicatorId}-${plotIndex + 1}`;
        inputRefs.current[key]?.focus();
      } else if (participantIdx < participants.length - 1) {
        const nextParticipant = participants[participantIdx + 1];
        const key = `${nextParticipant.id}-${indicatorId}-0`;
        inputRefs.current[key]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && plotIndex !== undefined) {
      e.preventDefault();
      // Переход к предыдущей делянке или участнику
      if (plotIndex > 0) {
        const key = `${participantId}-${indicatorId}-${plotIndex - 1}`;
        inputRefs.current[key]?.focus();
      } else if (participantIdx > 0) {
        const prevParticipant = participants[participantIdx - 1];
        const key = `${prevParticipant.id}-${indicatorId}-3`;
        inputRefs.current[key]?.focus();
      }
    }
  };

  // Проверка валидности делянок
  const getPlotValidation = (participantId: number, indicatorId: number) => {
    const plots = data[participantId]?.[indicatorId]?.plots || [];
    const filledPlots = plots.filter(p => p !== undefined && !isNaN(p as number));
    
    if (filledPlots.length === 0) return { isValid: true, message: '' };
    if (filledPlots.length === 4) return { isValid: true, message: '' };
    
    return {
      isValid: false,
      message: `Заполнено ${filledPlots.length}/4 делянок`,
    };
  };

  // Вычисление средних и отклонений для отображения
  const calculatedData = useMemo(() => {
    const result: {
      [participantId: number]: {
        [indicatorId: number]: {
          avg?: number;
          overStdAbs?: number;
          overStdPct?: number;
        };
      };
    } = {};

    // Сначала вычисляем все обычные показатели
    participants.forEach(participant => {
      result[participant.id] = {};

      indicators.forEach(indicator => {
        // Пропускаем автоматически рассчитываемые показатели на первом проходе
        if (indicatorIsAutoCalculated(indicator)) {
          return;
        }

        const indicatorData = data[participant.id]?.[indicator.id];
        
        if (!indicatorData) {
          return;
        }

        // Если есть делянки, вычисляем среднее
        if (indicatorData.plots && indicatorData.plots.length > 0) {
          const validPlots = indicatorData.plots.filter(p => p !== undefined && !isNaN(p));
          if (validPlots.length > 0) {
            const avg = validPlots.reduce((sum, val) => sum + val, 0) / validPlots.length;
            result[participant.id][indicator.id] = { avg };

            // Вычисляем отклонение от стандарта
            if (standardParticipant && participant.statistical_group !== 0) {
              const standardData = data[standardParticipant.id]?.[indicator.id];
              if (standardData?.plots) {
                const validStdPlots = standardData.plots.filter(p => p !== undefined && !isNaN(p));
                if (validStdPlots.length > 0) {
                  const stdAvg = validStdPlots.reduce((sum, val) => sum + val, 0) / validStdPlots.length;
                  const overStdAbs = avg - stdAvg;
                  const overStdPct = (overStdAbs / stdAvg) * 100;
                  result[participant.id][indicator.id].overStdAbs = overStdAbs;
                  result[participant.id][indicator.id].overStdPct = overStdPct;
                }
              }
            }
          }
        }
        // Если есть единичное значение, используем его
        else if (indicatorData.value !== undefined) {
          result[participant.id][indicator.id] = { avg: indicatorData.value };
        }
      });
    });

    // Второй проход: рассчитываем показатели отклонения от стандарта на основе yield
    const yieldIndicator = indicators.find(ind => ind.code === 'yield');
    
    // Ищем показатели отклонения по разным возможным кодам и названиям
    const deviationAbsIndicator = indicators.find(ind => 
      ind.code === 'deviation_abs' || 
      ind.code === 'deviation_standard' ||
      ind.name.includes('Отклонение от стандарта (абсолютное)')
    );
    
    const deviationPctIndicator = indicators.find(ind => 
      ind.code === 'deviation_pct' ||
      ind.name.includes('Отклонение от стандарта (%)')
    );
    
    if (yieldIndicator && standardParticipant) {
      const stdYieldAvg = result[standardParticipant.id]?.[yieldIndicator.id]?.avg;
      
      if (stdYieldAvg !== undefined && stdYieldAvg > 0) {
        participants.forEach(participant => {
          const participantYieldAvg = result[participant.id]?.[yieldIndicator.id]?.avg;
          
          if (participantYieldAvg !== undefined) {
            if (participant.statistical_group === 0) {
              // Для стандарта отклонение = 0
              if (deviationAbsIndicator) {
                result[participant.id][deviationAbsIndicator.id] = { avg: 0 };
              }
              if (deviationPctIndicator) {
                result[participant.id][deviationPctIndicator.id] = { avg: 0 };
              }
            } else {
              // Для испытываемых: рассчитываем отклонения
              const deviationAbs = participantYieldAvg - stdYieldAvg;
              const deviationPct = (deviationAbs / stdYieldAvg) * 100;
              
              if (deviationAbsIndicator) {
                result[participant.id][deviationAbsIndicator.id] = { avg: deviationAbs };
              }
              if (deviationPctIndicator) {
                result[participant.id][deviationPctIndicator.id] = { avg: deviationPct };
              }
            }
          }
        });
      }
    }

    return result;
  }, [data, participants, indicators, standardParticipant, indicatorIsAutoCalculated]);

  // Подсчет заполненных показателей (без автоматически рассчитываемых)
  const { filledCount, totalCount, filledPercent } = useMemo(() => {
    let filled = 0;
    const manualIndicators = indicators.filter(ind => !indicatorIsAutoCalculated(ind));
    const total = participants.length * manualIndicators.length;
    
    participants.forEach(participant => {
      manualIndicators.forEach(indicator => {
        const indicatorData = data[participant.id]?.[indicator.id];
        if (indicatorData) {
          // Если есть делянки
          if (indicatorData.plots) {
            const validPlots = indicatorData.plots.filter(p => p !== undefined && !isNaN(p));
            if (validPlots.length === 4) {
              filled++;
            }
          }
          // Если есть единичное значение
          else if (indicatorData.value !== undefined && !isNaN(indicatorData.value)) {
            filled++;
          }
        }
      });
    });
    
    return {
      filledCount: filled,
      totalCount: total,
      filledPercent: total > 0 ? (filled / total) * 100 : 0,
    };
  }, [data, participants, indicators, indicatorIsAutoCalculated]);

  const handleSave = async () => {
    if (filledCount === 0) {
      enqueueSnackbar('Заполните хотя бы одно значение', { variant: 'warning' });
      return;
    }

    try {
      // Сохраняем результаты для каждого участника отдельно через bulk-entry API
      let totalCreated = 0;
      let totalUpdated = 0;
      let participantsSaved = 0;

      for (const participant of participants) {
        const participantData = data[participant.id];
        if (!participantData) continue;

        // Формируем массив данных для этого участника
        const entryData: BulkEntryDataItem[] = [];

        for (const indicator of indicators) {
          const indicatorData = participantData[indicator.id];
          if (!indicatorData) continue;

          const dataItem: BulkEntryDataItem = {
            indicator: indicator.id,
          };

          // Если показатель использует делянки
          if (indicatorUsesPlots(indicator) && indicatorData.plots) {
            const validPlots = indicatorData.plots.filter(p => p !== undefined && !isNaN(p));
            if (validPlots.length === 4) {
              dataItem.plots = indicatorData.plots as [number, number, number, number];
            } else if (validPlots.length > 0) {
              // Показываем предупреждение для неполных делянок
              continue; // Пропускаем этот показатель
            }
          }
          // Если показатель использует единичное значение
          else if (indicatorData.value !== undefined && !isNaN(indicatorData.value)) {
            dataItem.value = indicatorData.value;
            if (indicatorData.text_value) {
              dataItem.text_value = indicatorData.text_value;
            }
          }

          // Добавляем только если есть данные
          if (dataItem.plots || dataItem.value !== undefined) {
            entryData.push(dataItem);
          }
        }
        
        // ✨ Автоматически добавляем рассчитанные показатели отклонения
        const calculatedResults = calculatedData[participant.id];
        if (calculatedResults) {
          indicators.forEach(indicator => {
            if (indicatorIsAutoCalculated(indicator)) {
              const autoValue = calculatedResults[indicator.id]?.avg;
              if (autoValue !== undefined && !isNaN(autoValue)) {
                entryData.push({
                  indicator: indicator.id,
                  value: autoValue,
                });
              }
            }
          });
        }

        // Если есть данные для сохранения
        if (entryData.length > 0) {
          const response = await bulkEntry.mutateAsync({
            participant: participant.id,
            measurement_date: measurementDate,
            data: entryData,
          });

          if (response.success) {
            totalCreated += response.created;
            totalUpdated += response.updated;
            participantsSaved++;
          }
        }
      }

      if (participantsSaved > 0) {
        enqueueSnackbar(
          `✅ Сохранено для ${participantsSaved} участников (создано: ${totalCreated}, обновлено: ${totalUpdated})`,
          { variant: 'success' }
        );
        
        // Очищаем форму и localStorage после успешного сохранения
        setData({});
        setHasUnsavedChanges(false);
        localStorage.removeItem(storageKey);
        onSuccess();
      } else {
        enqueueSnackbar('Нет данных для сохранения', { variant: 'warning' });
      }
    } catch (error: any) {
      console.error('Ошибка при сохранении:', error);
      enqueueSnackbar(
        `Ошибка: ${error.response?.data?.error || error.message}`,
        { variant: 'error' }
      );
    }
  };

  if (participants.length === 0) {
    return (
      <Alert severity="warning">
        Нет участников испытания. Добавьте участников для ввода данных.
      </Alert>
    );
  }

  if (indicators.length === 0) {
    return (
      <Alert severity="warning">
        Нет показателей для измерения. Добавьте показатели в настройках испытания.
      </Alert>
    );
  }

  // Мобильный вид (карточки)
  if (isMobile) {
    return (
      <Box>
        {/* Статистика */}
        <Paper sx={{ p: 2, mb: 2, position: 'sticky', top: 0, zIndex: 10 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              Ввод результатов
            </Typography>
            <Chip 
              label={`${filledCount}/${totalCount}`}
              color={filledPercent > 80 ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={filledPercent} 
            sx={{ height: 8, borderRadius: 1, mb: 1 }}
          />
          {lastSaved && (
            <Typography variant="caption" color="text.secondary">
              Автосохранение: {lastSaved.toLocaleTimeString()}
            </Typography>
          )}
        </Paper>

        {/* Дата */}
        <TextField
          label="Дата измерения"
          type="date"
          value={measurementDate}
          onChange={(e) => setMeasurementDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Карточки участников */}
        {participants.map(participant => (
          <Card key={participant.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                {participant.statistical_group === 0 && <Chip label="⭐ Стандарт" color="primary" size="small" />}
                <Typography variant="h6">
                  {participant.sort_record_data.name}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {indicators.map(indicator => {
                  const usesPlots = indicatorUsesPlots(indicator);
                  const indicatorData = data[participant.id]?.[indicator.id];
                  const validation = usesPlots ? getPlotValidation(participant.id, indicator.id) : { isValid: true, message: '' };

                  return (
                    <Grid item xs={12} key={indicator.id}>
                      <Typography variant="body2" fontWeight={500} gutterBottom>
                        {indicator.name} ({indicator.unit})
                      </Typography>
                      
                      {usesPlots ? (
                        <Box>
                          <Grid container spacing={1}>
                            {[0, 1, 2, 3].map(plotIndex => (
                              <Grid item xs={3} key={plotIndex}>
                                <TextField
                                  size="small"
                                  label={`Д${plotIndex + 1}`}
                                  type="number"
                                  value={indicatorData?.plots?.[plotIndex] ?? ''}
                                  onChange={(e) => updatePlotValue(participant.id, indicator.id, plotIndex, e.target.value)}
                                  error={!validation.isValid}
                                  inputProps={{ step: '0.1' }}
                                  fullWidth
                                />
                              </Grid>
                            ))}
                          </Grid>
                          {!validation.isValid && (
                            <Typography variant="caption" color="error">
                              {validation.message}
                            </Typography>
                          )}
                          {calculatedData[participant.id]?.[indicator.id]?.avg !== undefined && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Среднее: {calculatedData[participant.id][indicator.id].avg!.toFixed(2)} {indicator.unit}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Значение"
                          value={indicatorData?.value ?? ''}
                          onChange={(e) => updateSingleValue(participant.id, indicator.id, e.target.value)}
                          inputProps={{ step: '0.1' }}
                          fullWidth
                        />
                      )}
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        ))}

        {/* Кнопка сохранения */}
        <Box position="sticky" bottom={16} display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={bulkEntry.isPending || filledCount === 0}
            sx={{ minWidth: 200 }}
          >
            {bulkEntry.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </Box>
      </Box>
    );
  }

  // Десктопный вид (таблица)
  return (
    <Paper sx={{ p: 3 }}>
      {/* Sticky заголовок со статистикой */}
      <Box 
        sx={{ 
          position: 'sticky', 
          top: 0, 
          bgcolor: 'background.paper', 
          zIndex: 10,
          pb: 2,
          mb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Ввод данных испытания
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trial.title}
            </Typography>
          </Box>
          
          <Box display="flex" gap={1} alignItems="center">
            {lastSaved && (
              <Tooltip title={`Последнее автосохранение: ${lastSaved.toLocaleTimeString()}`}>
                <Chip 
                  icon={<InfoIcon />}
                  label={hasUnsavedChanges ? 'Сохранение...' : 'Сохранено'}
                  size="small"
                  color={hasUnsavedChanges ? 'warning' : 'success'}
                  variant="outlined"
                />
              </Tooltip>
            )}
            {Object.keys(data).length > 0 && (
              <Tooltip title="Очистить все данные">
                <IconButton size="small" onClick={handleClearDraft} color="error">
                  <RestoreIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Прогресс бар */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Прогресс заполнения
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {filledCount} / {totalCount} ({filledPercent.toFixed(0)}%)
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={filledPercent} 
            sx={{ height: 8, borderRadius: 1 }}
            color={filledPercent === 100 ? 'success' : 'primary'}
          />
        </Box>

        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Дата измерения"
            type="date"
            value={measurementDate}
            onChange={(e) => setMeasurementDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ maxWidth: 200 }}
          />
          
          <Box display="flex" gap={1}>
            <Chip 
              label={`Участников: ${participants.length}`} 
              size="small" 
            />
            <Chip 
              label={`Показателей: ${indicators.length}`} 
              size="small" 
            />
          </Box>
        </Box>

        {/* Статистика опыта */}
        {trial.trial_statistics && (
          <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            <Box display="flex" gap={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Sx:</strong> {trial.trial_statistics.sx.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <strong>P%:</strong> {trial.trial_statistics.accuracy_percent.toFixed(2)}%
                {trial.trial_statistics.accuracy_percent < 3 && ' ✅'}
                {trial.trial_statistics.accuracy_percent >= 3 && trial.trial_statistics.accuracy_percent < 5 && ' ⚠️'}
                {trial.trial_statistics.accuracy_percent >= 5 && ' ❌'}
              </Typography>
              <Typography variant="body2">
                <strong>НСР:</strong> {trial.trial_statistics.lsd.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <strong>Ошибка средней:</strong> {trial.trial_statistics.error_mean.toFixed(2)}
              </Typography>
            </Box>
          </Alert>
        )}
      </Box>

      {/* Таблица ввода данных */}
      <TableContainer sx={{ mb: 3 }}>
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            {/* Заголовки участников */}
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold', 
                  minWidth: 180,
                  position: 'sticky',
                  left: 0,
                  bgcolor: 'background.paper',
                  zIndex: 2,
                }}
              >
                Показатель
              </TableCell>
              {participants.map((participant, index) => {
                return (
                  <TableCell 
                    key={participant.id} 
                    align="center"
                    sx={{ 
                      fontWeight: 'bold',
                      bgcolor: participant.statistical_group === 0 ? 'primary.light' : 'grey.100',
                      color: participant.statistical_group === 0 ? 'primary.contrastText' : 'text.primary',
                      padding: '12px 8px',
                      minWidth: 180,
                      borderLeft: index > 0 ? '2px solid' : 'none',
                      borderLeftColor: 'divider',
                    }}
                  >
                    <Box>
                      {participant.statistical_group === 0 && (
                        <Chip 
                          label="⭐ Стандарт" 
                          size="small" 
                          color="primary"
                          sx={{ mb: 0.5 }}
                        />
                      )}
                      <Typography variant="body2" fontWeight="bold">
                        {participant.sort_record_data.name}
                      </Typography>
                      <Typography variant="caption" display="block">
                        №{participant.participant_number}
                      </Typography>
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {indicators.map(indicator => {
              const usesPlots = indicatorUsesPlots(indicator);
              
              return (
                <React.Fragment key={indicator.id}>
                  {/* Строка ввода */}
                  <TableRow>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'background.paper',
                        zIndex: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1rem' }}>
                          {indicator.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {indicator.unit}
                        </Typography>
                      </Box>
                    </TableCell>
                    {participants.map((participant, index) => {
                      const indicatorData = data[participant.id]?.[indicator.id];
                      const validation = usesPlots ? getPlotValidation(participant.id, indicator.id) : { isValid: true, message: '' };
                      const isAutoCalc = indicatorIsAutoCalculated(indicator);
                      const autoValue = isAutoCalc ? calculatedData[participant.id]?.[indicator.id]?.avg : undefined;

                      if (usesPlots) {
                        // 4 делянки для урожайности в 2 строки по 2
                        return (
                          <TableCell 
                            key={participant.id} 
                            sx={{ 
                              p: 1, 
                              minWidth: 180,
                              borderLeft: index > 0 ? '2px solid' : 'none',
                              borderLeftColor: 'divider',
                            }}
                          >
                            <Grid container spacing={0.5}>
                              {/* Первая строка: Д1, Д2 */}
                              {[0, 1].map(plotIndex => {
                                const inputKey = `${participant.id}-${indicator.id}-${plotIndex}`;
                                return (
                                  <Grid item xs={6} key={plotIndex}>
                                    <Box>
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          fontSize: '0.7rem', 
                                          color: 'text.secondary', 
                                          display: 'block',
                                          textAlign: 'center',
                                          mb: 0.5,
                                          fontWeight: 500,
                                        }}
                                      >
                                        Д{plotIndex + 1}
                                      </Typography>
                                      <TextField
                                        inputRef={(ref) => {
                                          if (ref) inputRefs.current[inputKey] = ref;
                                        }}
                                        size="small"
                                        type="number"
                                        placeholder="0.0"
                                        value={indicatorData?.plots?.[plotIndex] ?? ''}
                                        onChange={(e) => 
                                          updatePlotValue(participant.id, indicator.id, plotIndex, e.target.value)
                                        }
                                        onKeyDown={(e) => handleKeyDown(e, participant.id, indicator.id, plotIndex)}
                                        error={!validation.isValid}
                                        inputProps={{ 
                                          step: '0.1',
                                          style: { textAlign: 'center' }
                                        }}
                                        sx={{ 
                                          width: '100%',
                                          '& input': { 
                                            padding: '8px 6px',
                                            fontSize: '0.875rem',
                                          },
                                          '& .MuiOutlinedInput-root': {
                                            '&.Mui-error fieldset': {
                                              borderWidth: 2,
                                            },
                                          },
                                        }}
                                      />
                                    </Box>
                                  </Grid>
                                );
                              })}
                              {/* Вторая строка: Д3, Д4 */}
                              {[2, 3].map(plotIndex => {
                                const inputKey = `${participant.id}-${indicator.id}-${plotIndex}`;
                                return (
                                  <Grid item xs={6} key={plotIndex}>
                                    <Box>
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          fontSize: '0.7rem', 
                                          color: 'text.secondary', 
                                          display: 'block',
                                          textAlign: 'center',
                                          mb: 0.5,
                                          fontWeight: 500,
                                        }}
                                      >
                                        Д{plotIndex + 1}
                                      </Typography>
                                      <TextField
                                        inputRef={(ref) => {
                                          if (ref) inputRefs.current[inputKey] = ref;
                                        }}
                                        size="small"
                                        type="number"
                                        placeholder="0.0"
                                        value={indicatorData?.plots?.[plotIndex] ?? ''}
                                        onChange={(e) => 
                                          updatePlotValue(participant.id, indicator.id, plotIndex, e.target.value)
                                        }
                                        onKeyDown={(e) => handleKeyDown(e, participant.id, indicator.id, plotIndex)}
                                        error={!validation.isValid}
                                        inputProps={{ 
                                          step: '0.1',
                                          style: { textAlign: 'center' }
                                        }}
                                        sx={{ 
                                          width: '100%',
                                          '& input': { 
                                            padding: '8px 6px',
                                            fontSize: '0.875rem',
                                          },
                                          '& .MuiOutlinedInput-root': {
                                            '&.Mui-error fieldset': {
                                              borderWidth: 2,
                                            },
                                          },
                                        }}
                                      />
                                    </Box>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </TableCell>
                        );
                      } else {
                        // Одно поле для остальных показателей
                        const inputKey = `${participant.id}-${indicator.id}`;
                        const displayValue = isAutoCalc 
                          ? (autoValue !== undefined ? autoValue.toFixed(2) : '')
                          : (indicatorData?.value ?? '');
                        
                        return (
                          <TableCell 
                            key={participant.id} 
                            sx={{ 
                              p: 0.75, 
                              textAlign: 'center',
                              borderLeft: index > 0 ? '2px solid' : 'none',
                              borderLeftColor: 'divider',
                            }}
                          >
                            <TextField
                              inputRef={(ref) => {
                                if (ref) inputRefs.current[inputKey] = ref;
                              }}
                              size="small"
                              type="number"
                              placeholder={isAutoCalc ? 'Авто' : 'Значение'}
                              value={displayValue}
                              onChange={(e) => 
                                updateSingleValue(participant.id, indicator.id, e.target.value)
                              }
                              onKeyDown={(e) => handleKeyDown(e, participant.id, indicator.id)}
                              disabled={isAutoCalc}
                              inputProps={{ 
                                step: '0.1',
                                style: { textAlign: 'center' }
                              }}
                              sx={{ 
                                width: '100%',
                                maxWidth: 140,
                                margin: '0 auto',
                                display: 'block',
                                '& input': { 
                                  padding: '8px 12px',
                                  fontSize: '0.875rem',
                                  textAlign: 'center',
                                },
                                ...(isAutoCalc && {
                                  bgcolor: 'grey.50',
                                  '& .Mui-disabled': {
                                    WebkitTextFillColor: autoValue !== undefined 
                                      ? (autoValue >= 0 ? 'green' : 'red')
                                      : 'rgba(0, 0, 0, 0.38)',
                                    fontWeight: autoValue !== undefined ? 600 : 400,
                                  },
                                }),
                              }}
                            />
                          </TableCell>
                        );
                      }
                    })}
                  </TableRow>

                  {/* Строка средних значений */}
                  {usesPlots && (
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          bgcolor: 'grey.50',
                          zIndex: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          ↳ Среднее
                        </Typography>
                      </TableCell>
                      {participants.map((participant, index) => {
                        const avg = calculatedData[participant.id]?.[indicator.id]?.avg;
                        
                        return (
                          <TableCell 
                            key={participant.id} 
                            align="center"
                            sx={{ 
                              fontWeight: 500, 
                              bgcolor: 'grey.50',
                              borderLeft: index > 0 ? '2px solid' : 'none',
                              borderLeftColor: 'divider',
                            }}
                          >
                            {avg !== undefined ? (
                              <Typography variant="body2" fontWeight="bold">
                                {avg.toFixed(2)} {indicator.unit}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}

                  {/* Строка отклонения от стандарта */}
                  {usesPlots && standardParticipant && (
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          bgcolor: 'grey.100',
                          zIndex: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          ↳ ± от стандарта
                        </Typography>
                      </TableCell>
                      {participants.map((participant, index) => {
                        const isStandard = participant.statistical_group === 0;
                        const overStdAbs = calculatedData[participant.id]?.[indicator.id]?.overStdAbs;
                        const overStdPct = calculatedData[participant.id]?.[indicator.id]?.overStdPct;
                        
                        return (
                          <TableCell 
                            key={participant.id} 
                            align="center"
                            sx={{ 
                              fontWeight: 500, 
                              bgcolor: 'grey.100',
                              borderLeft: index > 0 ? '2px solid' : 'none',
                              borderLeftColor: 'divider',
                            }}
                          >
                            {isStandard ? (
                              <Chip label="Стандарт" size="small" color="primary" variant="outlined" />
                            ) : overStdAbs !== undefined ? (
                              <Box>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="bold"
                                  color={overStdAbs >= 0 ? 'success.main' : 'error.main'}
                                >
                                  {overStdAbs >= 0 ? '+' : ''}{overStdAbs.toFixed(2)} {indicator.unit}
                                </Typography>
                                <Typography 
                                  variant="caption"
                                  color={overStdPct! >= 0 ? 'success.main' : 'error.main'}
                                >
                                  ({overStdPct! >= 0 ? '+' : ''}{overStdPct?.toFixed(1)}%)
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.disabled">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}

                  <TableRow>
                    <TableCell colSpan={1 + participants.length * (usesPlots ? 4 : 1)} sx={{ p: 0 }}>
                      <Divider />
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Подсказки */}
      {filledCount === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          💡 <strong>Подсказка:</strong> Используйте Tab/Enter для быстрой навигации между полями. 
          Стрелки ←→↑↓ для перемещения по делянкам. Данные автоматически сохраняются каждые 3 секунды.
        </Alert>
      )}

      {/* Статус заполнения */}
      {trial.completion_status && (
        <Alert 
          severity={trial.completion_status.is_complete ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Общее заполнение: {trial.completion_status.filled_percent.toFixed(1)}%
          </Typography>
          {trial.completion_status.missing_data.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Не заполнено: {trial.completion_status.missing_data.slice(0, 5).join(', ')}
              {trial.completion_status.missing_data.length > 5 && ` и еще ${trial.completion_status.missing_data.length - 5}`}
            </Typography>
          )}
        </Alert>
      )}

      {/* Кнопка сохранения */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleClearDraft}
          disabled={Object.keys(data).length === 0}
        >
          Очистить все
        </Button>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={bulkEntry.isPending || filledCount === 0}
        >
          {bulkEntry.isPending ? 'Сохранение...' : `Сохранить (${filledCount}/${totalCount})`}
        </Button>
      </Box>
    </Paper>
  );
};
