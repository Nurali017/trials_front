import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Autocomplete } from '@mui/material';
import { useOriginators } from '@/hooks/useDictionaries';
import type { Originator, OriginatorWithPercentage } from '@/types/api.types';

interface OriginatorDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (originator: OriginatorWithPercentage) => void;
}

interface FormData {
  originator: Originator | null;
  percentage: number;
}

export const OriginatorDialog: React.FC<OriginatorDialogProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const { data: originators } = useOriginators();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      originator: null,
      percentage: 100,
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: FormData) => {
    if (data.originator) {
      onAdd({
        ariginator_id: data.originator.id,
        percentage: data.percentage,
      });
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          Добавить
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Controller
                name="originator"
                control={control}
                rules={{ required: 'Выберите оригинатора' }}
                render={({ field }) => (
                  <Autocomplete<Originator>
                    options={originators || []}
                    value={field.value}
                    getOptionLabel={(option) => `${option.name}, ${option.country}`}
                    onChange={(_, value) => field.onChange(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="* Оригинатор"
                        error={!!errors.originator}
                        helperText={errors.originator?.message}
                        placeholder="Выберите оригинатора..."
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        {option.name}, {option.country}
                      </li>
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="percentage"
                control={control}
                rules={{ 
                  required: 'Процентное соотношение обязательно',
                  min: { value: 5, message: 'Минимум 5%' },
                  max: { value: 100, message: 'Максимум 100%' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="* Процентное соотношение (5% - 100%)"
                    fullWidth
                    error={!!errors.percentage}
                    helperText={errors.percentage?.message}
                    inputProps={{ min: 5, max: 100, step: 1 }}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" variant="contained">
            Добавить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
