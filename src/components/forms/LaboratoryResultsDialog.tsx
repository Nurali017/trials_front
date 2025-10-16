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
import { useIndicators, useCultures } from '@/hooks/useDictionaries';
import { getTodayISO } from '@/utils/dateHelpers';
import type { Trial, TrialParticipant, Indicator } from '@/types/api.types';

interface Props {
  open: boolean;
  onClose: () => void;
  trial: Trial;
  participant: TrialParticipant;
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
  
  // Получаем культуру, чтобы узнать её группу
  const { data: cultures } = useCultures();
  const currentCulture = cultures?.find((c: any) => c.id === trial.culture);
  const cultureGroupId = currentCulture?.culture_group;
  
  // Запрашиваем показатели по группе культур
  const { data: allIndicators } = useIndicators({ 
    is_quality: true, 
    culture_group: cultureGroupId 
  });

  const [analysisDate, setAnalysisDate] = useState(getTodayISO());
  const [values, setValues] = useState<Record<number, number>>({});

  // Фильтруем только качественные показатели
  const qualityIndicators = (allIndicators || []).filter(
    (ind: Indicator) => ind.is_quality
  );

  const handleValueChange = (indicatorId: number, value: string) => {
    setValues((prev) => ({
      ...prev,
      [indicatorId]: value === '' ? 0 : Number(value),
    }));
  };

  const handleSubmit = () => {
    if (!trial.laboratory_code) {
      enqueueSnackbar('Испытание не имеет кода лаборатории', { variant: 'error' });
      return;
    }

    const results = Object.entries(values)
      .filter(([_, value]) => value > 0)
      .map(([indicatorId, value]) => ({
        indicator: Number(indicatorId),
        value,
      }));

    if (results.length === 0) {
      enqueueSnackbar('Введите хотя бы один показатель', { variant: 'warning' });
      return;
    }

    mutate(
      {
        id: trial.id,
        payload: {
          laboratory_code: trial.laboratory_code,
          analysis_date: analysisDate,
          participant_id: participant.id,
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
            {qualityIndicators.map((indicator: Indicator) => (
              <TableRow key={indicator.id}>
                <TableCell>{indicator.name}</TableCell>
                <TableCell>{indicator.unit}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    value={values[indicator.id] || ''}
                    onChange={(e) => handleValueChange(indicator.id, e.target.value)}
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </TableCell>
              </TableRow>
            ))}
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
          disabled={isPending || !trial.laboratory_code}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

