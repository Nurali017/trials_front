import React from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTrialPlan } from '../../hooks/useTrialPlans';
import { useDictionaries } from '../../hooks/useDictionaries';
import { useSnackbar } from 'notistack';

// Validation schema - только год и область
const trialPlanSchema = z.object({
  year: z.number().min(2000).max(2030),
  oblast: z.number().min(1, 'Выберите область'),
});

type TrialPlanFormData = z.infer<typeof trialPlanSchema>;

interface CreateTrialPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateTrialPlanDialog: React.FC<CreateTrialPlanDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const dictionaries = useDictionaries();
  const createTrialPlan = useCreateTrialPlan();
  const { enqueueSnackbar } = useSnackbar();

  // Form
  const { control, handleSubmit, formState: { errors }, reset } = useForm<TrialPlanFormData>({
    resolver: zodResolver(trialPlanSchema),
    defaultValues: {
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = async (data: TrialPlanFormData) => {
    try {
      await createTrialPlan.mutateAsync({ 
        ...data, 
        status: 'planned' 
      });
      
      reset();
      onSuccess?.();
      onClose();
      enqueueSnackbar('План испытаний успешно создан', { variant: 'success' });
    } catch (error) {
      console.error('Error creating trial plan:', error);
      enqueueSnackbar('Ошибка при создании плана испытаний', { variant: 'error' });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Создать план испытаний
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.year}>
                <InputLabel>Год</InputLabel>
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Год"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {Array.from({ length: 31 }, (_, i) => 2030 - i).map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
              {errors.year && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.year.message}
                </Alert>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.oblast}>
                <InputLabel>Область</InputLabel>
                <Controller
                  name="oblast"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Область">
                      {dictionaries?.oblasts?.map((oblast: any) => (
                        <MenuItem key={oblast.id} value={oblast.id}>
                          {oblast.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
              {errors.oblast && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.oblast.message}
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleClose}
            disabled={createTrialPlan.isPending}
          >
            Отмена
          </Button>
          <Button 
            type="submit"
            variant="contained"
            disabled={createTrialPlan.isPending}
            startIcon={createTrialPlan.isPending ? <CircularProgress size={16} /> : null}
          >
            {createTrialPlan.isPending ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
