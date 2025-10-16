import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useSnackbar } from 'notistack';

// Validation schema
const addTrialTypeSchema = z.object({
  trial_type_id: z.number().min(1, 'Выберите тип испытания'),
  season: z.enum(['spring', 'autumn', 'summer', 'winter'], {
    required_error: 'Выберите сезон посадки',
  }),
});

type AddTrialTypeFormData = z.infer<typeof addTrialTypeSchema>;

interface AddTrialTypeToCultureDialogProps {
  open: boolean;
  onClose: () => void;
  trialPlanId: number;
  cultureId: number;
  cultureName: string;
  existingTrialTypeIds: number[];
}

export const AddTrialTypeToCultureDialog: React.FC<AddTrialTypeToCultureDialogProps> = ({
  open,
  onClose,
  trialPlanId,
  cultureId,
  cultureName,
  existingTrialTypeIds,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Form
  const { control, handleSubmit, formState: { errors }, reset } = useForm<AddTrialTypeFormData>({
    resolver: zodResolver(addTrialTypeSchema),
    defaultValues: {
      trial_type_id: 0,
      season: 'spring',
    },
  });

  // Загружаем типы испытаний
  const { data: trialTypes = [], isLoading: isLoadingTrialTypes } = useQuery({
    queryKey: ['trialTypes'],
    queryFn: () => apiClient.get('/trial-types/').then(res => res.data),
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Фильтруем типы испытаний, которые еще не добавлены
  const availableTrialTypes = trialTypes.filter((type: any) => 
    !existingTrialTypeIds.includes(type.id)
  );

  // Мутация для добавления типа испытания
  const addTrialTypeMutation = useMutation({
    mutationFn: async (data: AddTrialTypeFormData) => {
      const response = await apiClient.post(
        `/trial-plans/${trialPlanId}/cultures/${cultureId}/add-trial-type/`,
        {
          trial_type_id: data.trial_type_id,
          season: data.season,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      enqueueSnackbar('Тип испытания успешно добавлен', { variant: 'success' });
      // Обновляем кэш плана испытаний
      queryClient.invalidateQueries({ queryKey: ['trialPlan', trialPlanId] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error adding trial type:', error);
      enqueueSnackbar(
        error?.response?.data?.detail || 'Ошибка при добавлении типа испытания',
        { variant: 'error' }
      );
    },
  });

  const onSubmit = async (data: AddTrialTypeFormData) => {
    await addTrialTypeMutation.mutateAsync(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getSeasonLabel = (season: string) => {
    const labels = {
      spring: 'Весна',
      autumn: 'Осень',
      summer: 'Лето',
      winter: 'Зима',
    };
    return labels[season as keyof typeof labels] || season;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Добавить тип испытания для культуры: {cultureName}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary">
              Выберите тип испытания и сезон посадки для культуры "{cultureName}"
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Выбор типа испытания */}
            <Grid item xs={12}>
              <Controller
                name="trial_type_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.trial_type_id}>
                    <InputLabel>Тип испытания</InputLabel>
                    <Select {...field} label="Тип испытания">
                      <MenuItem value={0}>Выберите тип испытания...</MenuItem>
                      {availableTrialTypes.map((type: any) => (
                        <MenuItem key={type.id} value={type.id}>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {type.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.description || type.name_full}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.trial_type_id && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {errors.trial_type_id.message}
                      </Alert>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Выбор сезона */}
            <Grid item xs={12}>
              <Controller
                name="season"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.season}>
                    <InputLabel>Сезон посадки</InputLabel>
                    <Select {...field} label="Сезон посадки">
                      <MenuItem value="spring">🌱 Весна</MenuItem>
                      <MenuItem value="autumn">🍂 Осень</MenuItem>
                      <MenuItem value="summer">☀️ Лето</MenuItem>
                      <MenuItem value="winter">❄️ Зима</MenuItem>
                    </Select>
                    {errors.season && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {errors.season.message}
                      </Alert>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          {availableTrialTypes.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Все доступные типы испытаний уже добавлены для этой культуры
            </Alert>
          )}

          {isLoadingTrialTypes && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={addTrialTypeMutation.isPending || availableTrialTypes.length === 0}
          >
            {addTrialTypeMutation.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Добавление...
              </>
            ) : (
              'Добавить тип испытания'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};