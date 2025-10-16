import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import type { Trial, DecisionType, MakeDecisionRequest } from '@/types/api.types';
import { useMakeDecision } from '@/hooks/useTrials';
import { getTodayISO } from '@/utils/dateHelpers';

interface DecisionFormProps {
  trial: Trial;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  decision: DecisionType;
  justification: string;
  recommendations: string;
  decision_date: string;
}

export const DecisionForm: React.FC<DecisionFormProps> = ({ trial, open, onClose, onSuccess }) => {
  const { mutate: makeDecision, isPending } = useMakeDecision();
  const { enqueueSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      decision: 'approved',
      justification: '',
      recommendations: '',
      decision_date: getTodayISO(),
    },
  });

  const selectedDecision = watch('decision');

  const onSubmit = (data: FormData) => {
    makeDecision(
      {
        trialId: trial.id,
        data: {
          decision: data.decision,
          justification: data.justification,
          recommendations: data.recommendations || undefined,
          decision_date: data.decision_date,
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar('Решение успешно принято', { variant: 'success' });
          onClose();
          onSuccess?.();
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка: ${error.response?.data?.message || error.message}`, { 
            variant: 'error' 
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          Принятие решения по испытанию
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {trial.oblast_name} - {trial.region_name}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Результатов собрано: {trial.results_count} из {trial.indicators_data?.length || 0}
          </Alert>

          <Controller
            name="decision"
            control={control}
            rules={{ required: 'Выберите решение' }}
            render={({ field }) => (
              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel component="legend">Решение комиссии</FormLabel>
                <RadioGroup {...field}>
                  <FormControlLabel
                    value="approved"
                    control={<Radio />}
                    label={
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          ✅ Одобрено
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Рекомендовать к включению в Государственный реестр
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="continue"
                    control={<Radio />}
                    label={
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          🔄 Продолжить испытания
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Требуются дополнительные данные
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="rejected"
                    control={<Radio />}
                    label={
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          ❌ Отклонить
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Не соответствует требованиям
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            )}
          />

          <Controller
            name="justification"
            control={control}
            rules={{
              required: 'Обоснование обязательно',
              minLength: {
                value: 50,
                message: 'Минимум 50 символов',
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Обоснование решения *"
                multiline
                rows={4}
                fullWidth
                error={!!errors.justification}
                helperText={errors.justification?.message}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Controller
            name="recommendations"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Рекомендации"
                multiline
                rows={3}
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />

          <Controller
            name="decision_date"
            control={control}
            rules={{ required: 'Дата обязательна' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Дата решения *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.decision_date}
                helperText={errors.decision_date?.message}
              />
            )}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Сохранение...' : 'Принять решение'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
