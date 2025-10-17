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
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useLaboratoryBulkEntry } from '@/hooks/useTrials';
import { getTodayISO } from '@/utils/dateHelpers';
import type { Trial, TrialParticipant, Indicator } from '@/types/api.types';

interface Props {
  open: boolean;
  onClose: () => void;
  trial: Trial;
  participant: TrialParticipant; // Обязательно - для конкретного участника
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
  
  const [analysisDate, setAnalysisDate] = useState(getTodayISO());
  const [values, setValues] = useState<Record<number, number>>({});

  // Проверяем, есть ли хотя бы одно заполненное значение
  const hasValues = Object.values(values).some(value => value !== null && value !== undefined && value !== '');

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

  const handleValueChange = (indicatorId: number, value: string) => {
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
    
    setValues((prev) => ({
      ...prev,
      [indicatorId]: processedValue === '' ? 0 : Number(processedValue),
    }));
  };

  const handleSubmit = () => {

    // Валидация всех введенных значений
    const validationErrors: string[] = [];
    const results = Object.entries(values)
      .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      .map(([indicatorId, value]) => {
        const indicator = qualityIndicators.find(ind => ind.id === Number(indicatorId));
        const numValue = Number(value);
        
        if (indicator) {
          const validation = validateValue(indicator, numValue);
          if (!validation.isValid && validation.error) {
            validationErrors.push(`${indicator.name}: ${validation.error}`);
          }
        }
        
        return {
          indicator: Number(indicatorId),
          value: numValue,
        };
      });

    if (validationErrors.length > 0) {
      enqueueSnackbar(`Ошибки валидации: ${validationErrors.join('; ')}`, { variant: 'error' });
      return;
    }

    if (results.length === 0) {
      enqueueSnackbar('Введите хотя бы один показатель', { variant: 'warning' });
      return;
    }

    mutate(
      {
        id: trial.id,
        payload: {
          laboratory_code: trial.laboratory_code || '', // Может быть пустым
          analysis_date: analysisDate,
          participant_id: participant.id, // Обязательно для конкретного участника
          results,
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar('Лабораторные результаты сохранены', { variant: 'success' });
          onSuccess();
          onClose();
          // Reset form
          setAnalysisDate(getTodayISO());
          setValues({});
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Лабораторные результаты: {participant.sort_record_data.name}
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

        <TextField
          label="Дата анализа"
          type="date"
          fullWidth
          value={analysisDate}
          onChange={(e) => setAnalysisDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Показатель</TableCell>
              <TableCell>Единица</TableCell>
              <TableCell width={150}>Значение</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {qualityIndicators.map((indicator: Indicator) => {
              const currentValue = values[indicator.id] || '';
              const numValue = Number(currentValue);
              const validation = validateValue(indicator, numValue);
              const validationRules = indicator.validation_rules;
              
              return (
                <TableRow key={indicator.id}>
                  <TableCell>{indicator.name}</TableCell>
                  <TableCell>{indicator.unit}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      value={currentValue}
                      onChange={(e) => handleValueChange(indicator.id, e.target.value)}
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
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

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
          disabled={isPending || !hasValues}
          title={
            !hasValues 
              ? 'Введите хотя бы одно значение' 
              : ''
          }
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

