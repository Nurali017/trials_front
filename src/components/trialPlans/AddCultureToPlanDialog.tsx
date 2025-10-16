import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddCultureToPlan } from '../../hooks/useTrialPlans';
import { useDictionaries } from '../../hooks/useDictionaries';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useSnackbar } from 'notistack';

// Validation schema
const addCultureSchema = z.object({
  culture_group_id: z.number().min(1, 'Выберите группу культур'),
  culture_id: z.number().min(1, 'Выберите культуру'),
});

type AddCultureFormData = z.infer<typeof addCultureSchema>;

interface AddCultureToPlanDialogProps {
  open: boolean;
  onClose: () => void;
  trialPlanId: number;
  existingCultureIds: number[];
}

export const AddCultureToPlanDialog: React.FC<AddCultureToPlanDialogProps> = ({
  open,
  onClose,
  trialPlanId,
  existingCultureIds,
}) => {
  const addCultureToPlan = useAddCultureToPlan();
  const { enqueueSnackbar } = useSnackbar();

  // Form
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<AddCultureFormData>({
    resolver: zodResolver(addCultureSchema),
    defaultValues: {
      culture_group_id: 0,
      culture_id: 0,
    },
  });

  const watchedGroupId = watch('culture_group_id');

  const onSubmit = async (data: AddCultureFormData) => {
    try {
      await addCultureToPlan.mutateAsync({
        id: trialPlanId,
        cultureId: data.culture_id,
      });
      enqueueSnackbar('Культура успешно добавлена в план', { variant: 'success' });
      reset();
      onClose();
    } catch (error: any) {
      console.error('Error adding culture to plan:', error);
      enqueueSnackbar(error?.response?.data?.detail || 'Ошибка при добавлении культуры', { variant: 'error' });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Загружаем группы культур отдельно
  const { data: cultureGroups = [] } = useQuery({
    queryKey: ['cultureGroups'],
    queryFn: () => apiClient.get('/patents/group-cultures/').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Загружаем культуры для выбранной группы
  const { data: culturesInGroup = [] } = useQuery({
    queryKey: ['culturesByGroup', watchedGroupId],
    queryFn: () => watchedGroupId
      ? apiClient.get('/patents/cultures/', { params: { group: watchedGroupId } }).then(res => res.data)
      : Promise.resolve([]),
    enabled: !!watchedGroupId,
    staleTime: 5 * 60 * 1000,
  });

  // Фильтруем культуры, которые уже добавлены в план
  const availableCultureGroups = useMemo(() => {
    return cultureGroups.filter((group: any) =>
      group.cultures_count > 0
    );
  }, [cultureGroups]);

  // Фильтруем культуры в выбранной группе
  const availableCulturesInGroup = useMemo(() => {
    return culturesInGroup.filter((culture: any) =>
      !existingCultureIds.includes(culture.id)
    );
  }, [culturesInGroup, existingCultureIds]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Добавить культуру в план
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary">
              Выберите сначала группу культур, а затем конкретную культуру из этой группы
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Выбор группы культур */}
            <Grid item xs={12} md={6}>
              <Controller
                name="culture_group_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.culture_group_id}>
                    <InputLabel>Группа культур</InputLabel>
                    <Select {...field} label="Группа культур">
                      <MenuItem value={0}>Выберите группу...</MenuItem>
                      {availableCultureGroups.map((group: any) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name} ({group.cultures_count} культур)
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.culture_group_id && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {errors.culture_group_id.message}
                      </Alert>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Выбор культуры */}
            <Grid item xs={12} md={6}>
              <Controller
                name="culture_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.culture_id} disabled={!watchedGroupId}>
                    <InputLabel>Культура</InputLabel>
                    <Select {...field} label="Культура">
                      <MenuItem value={0}>Сначала выберите группу...</MenuItem>
                      {availableCulturesInGroup.map((culture: any) => (
                        <MenuItem key={culture.id} value={culture.id}>
                          {culture.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.culture_id && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {errors.culture_id.message}
                      </Alert>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>


          {watchedGroupId && availableCulturesInGroup.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Все культуры из этой группы уже добавлены в план
            </Alert>
          )}

          {availableCultureGroups.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Все доступные культуры уже добавлены в план
            </Alert>
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
            disabled={addCultureToPlan.isPending || !watchedGroupId || availableCulturesInGroup.length === 0}
          >
            {addCultureToPlan.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Добавление...
              </>
            ) : (
              'Добавить культуру'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
