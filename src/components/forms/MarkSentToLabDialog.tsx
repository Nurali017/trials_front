import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useMarkSentToLab } from '@/hooks/useTrials';
import { getTodayISO } from '@/utils/dateHelpers';
import type { Trial } from '@/types/api.types';

interface Props {
  open: boolean;
  onClose: () => void;
  trial: Trial;
  onSuccess: () => void;
}

export const MarkSentToLabDialog: React.FC<Props> = ({ open, onClose, trial, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate, isPending } = useMarkSentToLab();

  const [laboratoryCode, setLaboratoryCode] = useState('');
  const [sampleWeightKg, setSampleWeightKg] = useState<number>(2.0);
  const [sentDate, setSentDate] = useState(getTodayISO());

  const participantsCount = trial.participants_data?.length || 0;

  const handleSubmit = () => {
    if (!laboratoryCode) {
      enqueueSnackbar('Укажите код лаборатории', { variant: 'warning' });
      return;
    }

    if (participantsCount === 0) {
      enqueueSnackbar('В испытании нет участников', { variant: 'error' });
      return;
    }

    mutate(
      {
        id: trial.id,
        payload: {
          laboratory_code: laboratoryCode,
          sample_weight_kg: sampleWeightKg,
          sent_date: sentDate,
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar(
            `Образцы всех участников (${participantsCount} шт.) отправлены в лабораторию`,
            { variant: 'success' }
          );
          onSuccess();
          onClose();
          // Reset form
          setLaboratoryCode('');
          setSampleWeightKg(2.0);
          setSentDate(getTodayISO());
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Отправить образцы в лабораторию</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Информация о количестве участников */}
          <Grid item xs={12}>
            <TextField
              label="Количество участников"
              fullWidth
              value={`${participantsCount} участников будут отправлены на анализ`}
              disabled
              helperText="Образцы всех участников испытания отправляются в лабораторию для анализа качественных показателей"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Код лаборатории *"
              fullWidth
              value={laboratoryCode}
              onChange={(e) => setLaboratoryCode(e.target.value)}
              placeholder="LAB-2025-001-ALM"
              helperText="Уникальный идентификатор партии образцов"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Вес образца (кг) *"
              type="number"
              fullWidth
              value={sampleWeightKg}
              onChange={(e) => setSampleWeightKg(Number(e.target.value))}
              inputProps={{ step: 0.1, min: 0 }}
              helperText="Средний вес одного образца"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Дата отправки *"
              type="date"
              fullWidth
              value={sentDate}
              onChange={(e) => setSentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isPending}>
          Отправить все образцы
        </Button>
      </DialogActions>
    </Dialog>
  );
};

