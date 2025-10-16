import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useCreateTrialFromPlan } from '@/hooks/useTrialPlans';
import { getTodayISO } from '@/utils/dateHelpers';
import type { HarvestTiming } from '@/types/api.types';

interface Task {
  plan_id: number;
  culture_id: number;
  culture_name: string;
  participants_count: number;
  trial_created: boolean;
  can_start: boolean;
}

interface CreateTrialFromPlanDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task;
  regionId: number;
}

export const CreateTrialFromPlanDialog: React.FC<CreateTrialFromPlanDialogProps> = ({
  open,
  onClose,
  task,
  regionId,
}) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createTrial, isPending } = useCreateTrialFromPlan();

  const [startDate, setStartDate] = useState(getTodayISO());
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [harvestTiming, setHarvestTiming] = useState<HarvestTiming | ''>('');

  const handleSubmit = () => {
    if (!startDate) {
      enqueueSnackbar('Укажите дату начала испытания', { variant: 'warning' });
      return;
    }

    if (!responsiblePerson.trim()) {
      enqueueSnackbar('Укажите ответственное лицо', { variant: 'warning' });
      return;
    }

    createTrial(
      {
        planId: task.plan_id,
        data: {
          region_id: regionId,
          culture_id: task.culture_id,
          start_date: startDate,
          responsible_person: responsiblePerson,
          harvest_timing: harvestTiming || undefined,
        },
      },
      {
        onSuccess: (response: any) => {
          enqueueSnackbar('Испытание успешно создано!', { variant: 'success' });
          onClose();
          
          // Переход на страницу деталей Trial
          if (response.trial_id) {
            navigate(`/trials/${response.trial_id}`);
          }
        },
        onError: (error: any) => {
          enqueueSnackbar(
            `Ошибка: ${error.response?.data?.message || error.message}`,
            { variant: 'error' }
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Начать испытание
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Info about task */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Культура:</strong> {task.culture_name}
            </Typography>
            <Typography variant="body2">
              <strong>Участников:</strong> {task.participants_count}
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Дата начала испытания"
                type="date"
                fullWidth
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Укажите планируемую дату начала полевых работ"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="ФИО ответственного"
                fullWidth
                required
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="Иванов Иван Иванович"
                helperText="Агроном или специалист, ответственный за испытание"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Срок созревания</InputLabel>
                <Select
                  value={harvestTiming}
                  label="Срок созревания"
                  onChange={(e) => setHarvestTiming(e.target.value as HarvestTiming | '')}
                >
                  <MenuItem value="">Не указан</MenuItem>
                  <MenuItem value="very_early">Очень ранний</MenuItem>
                  <MenuItem value="early">Ранний</MenuItem>
                  <MenuItem value="medium_early">Среднеранний</MenuItem>
                  <MenuItem value="medium">Средний</MenuItem>
                  <MenuItem value="medium_late">Среднепоздний</MenuItem>
                  <MenuItem value="late">Поздний</MenuItem>
                  <MenuItem value="very_late">Очень поздний</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              После создания испытания вы сможете заполнить форму 008 с результатами полевых наблюдений.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? <CircularProgress size={24} /> : 'Создать испытание'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

