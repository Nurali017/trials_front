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
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCreateAnnualTable } from '@/hooks/useAnnualDecisions';
import { useOblasts, useCultures } from '@/hooks/useDictionaries';
import type { CreateAnnualTableRequest } from '@/types/api.types';

interface CreateAnnualTableModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (table: any) => void;
}

export const CreateAnnualTableModal: React.FC<CreateAnnualTableModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createTable, isPending } = useCreateAnnualTable();
  
  // API calls
  const { data: oblasts } = useOblasts();
  const { data: cultures } = useCultures();

  // Form state
  const [formData, setFormData] = useState<CreateAnnualTableRequest>({
    year: new Date().getFullYear(),
    oblast: 0,
    culture: undefined,
    auto_populate: true,
    include_year_3: true,
    include_year_2: true,
    include_year_1: false,
  });

  const handleInputChange = (field: keyof CreateAnnualTableRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.oblast) {
      enqueueSnackbar('Выберите область', { variant: 'warning' });
      return;
    }

    if (formData.year < 2020 || formData.year > new Date().getFullYear() + 1) {
      enqueueSnackbar('Выберите корректный год', { variant: 'warning' });
      return;
    }

    createTable(formData, {
      onSuccess: (newTable) => {
        enqueueSnackbar(
          `Таблица создана! Добавлено ${newTable.items_count} сортов для рассмотрения`,
          { variant: 'success' }
        );
        onSuccess(newTable);
      },
      onError: (error: any) => {
        enqueueSnackbar(
          `Ошибка создания таблицы: ${error.response?.data?.message || error.message}`,
          { variant: 'error' }
        );
      },
    });
  };

  const handleClose = () => {
    if (!isPending) {
      // Reset form
      setFormData({
        year: new Date().getFullYear(),
        oblast: 0,
        culture: undefined,
        auto_populate: true,
        include_year_3: true,
        include_year_2: true,
        include_year_1: false,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Создать годовую таблицу решений
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Система автоматически найдет сорта из планов испытаний и создаст таблицу для принятия решений.
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Область</InputLabel>
                <Select
                  value={formData.oblast}
                  label="Область"
                  onChange={(e) => handleInputChange('oblast', e.target.value)}
                >
                  {oblasts?.map((oblast) => (
                    <MenuItem key={oblast.id} value={oblast.id}>
                      {oblast.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Год"
                type="number"
                fullWidth
                required
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                inputProps={{
                  min: 2020,
                  max: new Date().getFullYear() + 1,
                }}
                helperText="Год испытаний для создания таблицы"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Культура (опционально)</InputLabel>
                <Select
                  value={formData.culture || ''}
                  label="Культура (опционально)"
                  onChange={(e) => handleInputChange('culture', e.target.value || undefined)}
                >
                  <MenuItem value="">Все культуры</MenuItem>
                  {cultures?.map((culture) => (
                    <MenuItem key={culture.id} value={culture.id}>
                      {culture.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Настройки автоматического заполнения
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.auto_populate}
                    onChange={(e) => handleInputChange('auto_populate', e.target.checked)}
                  />
                }
                label="Автоматически добавить сорта из планов испытаний"
              />
            </Grid>

            {formData.auto_populate && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Включить сорта по годам испытаний:
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.include_year_3}
                        onChange={(e) => handleInputChange('include_year_3', e.target.checked)}
                      />
                    }
                    label="3-й год испытаний"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.include_year_2}
                        onChange={(e) => handleInputChange('include_year_2', e.target.checked)}
                      />
                    }
                    label="2-й год испытаний"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.include_year_1}
                        onChange={(e) => handleInputChange('include_year_1', e.target.checked)}
                      />
                    }
                    label="1-й год испытаний"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Внимание:</strong> После создания таблицы вы сможете принимать решения по каждому сорту.
                  Таблица будет заблокирована для редактирования только после завершения всех решений.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isPending}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isPending || !formData.oblast}
          startIcon={isPending ? <CircularProgress size={16} /> : undefined}
        >
          {isPending ? 'Создание...' : 'Создать таблицу'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


