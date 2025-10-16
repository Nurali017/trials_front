import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Typography,
  Alert,
  Chip,
  Box,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDictionaries } from '../../hooks/useDictionaries';
import type { TrialPlanTrial } from '../../types/api.types';

// Validation schema
const trialSchema = z.object({
  region_id: z.number().min(1, 'Выберите регион'),
  predecessor: z.string().min(1, 'Введите предшественника'),
  seeding_rate: z.number().min(0.1, 'Норма высева должна быть больше 0'),
  season: z.enum(['spring', 'autumn', 'summer', 'winter'], { required_error: 'Выберите сезон' }),
});

const trialsSchema = z.object({
  trials: z.array(trialSchema).min(1, 'Добавьте хотя бы одно испытание'),
});

type TrialsFormData = z.infer<typeof trialsSchema>;

interface TrialManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (trials: TrialPlanTrial[]) => void;
  initialTrials?: TrialPlanTrial[];
  cultureId: number;
  trialTypeId: number;
}

const TrialManagementDialog: React.FC<TrialManagementDialogProps> = ({
  open,
  onClose,
  onSave,
  initialTrials = [],
  cultureId,
  trialTypeId,
}) => {
  // Queries
  const dictionaries = useDictionaries();

  // Form
  const { control, handleSubmit, formState: { errors }, reset } = useForm<TrialsFormData>({
    resolver: zodResolver(trialsSchema),
    defaultValues: {
      trials: initialTrials,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'trials',
  });

  const handleAddTrial = () => {
    append({
      region_id: 0,
      predecessor: '',
      seeding_rate: 0,
      season: 'spring',
    });
  };

  const handleRemoveTrial = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: TrialsFormData) => {
    try {
      onSave(data.trials);
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving trials:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getSeasonLabel = (season: string) => {
    switch (season) {
      case 'spring': return 'Весна';
      case 'autumn': return 'Осень';
      case 'summer': return 'Лето';
      case 'winter': return 'Зима';
      default: return 'Весна';
    }
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'spring': return 'primary';
      case 'autumn': return 'secondary';
      case 'summer': return 'warning';
      case 'winter': return 'info';
      default: return 'primary';
    }
  };

  const getRegionName = (regionId: number) => {
    return dictionaries.regions.find((r: any) => r.id === regionId)?.name || `Регион ${regionId}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Управление испытаниями
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Управление испытаниями для культуры ID: {cultureId}, тип испытания ID: {trialTypeId}
          </Alert>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Испытания ({fields.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddTrial}
            >
              Добавить испытание
            </Button>
          </Box>

          {fields.length === 0 ? (
            <Alert severity="warning">
              Добавьте испытания для продолжения
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {fields.map((field, index) => (
                <Grid item xs={12} key={field.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1">
                          Испытание #{index + 1}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small">
                            <DragIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveTrial(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name={`trials.${index}.region_id`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth error={!!errors.trials?.[index]?.region_id}>
                                <InputLabel>Регион</InputLabel>
                                <Select {...field} label="Регион">
                                  {dictionaries.regions.map((region: any) => (
                                    <MenuItem key={region.id} value={region.id}>
                                      {region.name} ({region.oblast_name})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name={`trials.${index}.season`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth error={!!errors.trials?.[index]?.season}>
                                <InputLabel>Сезон</InputLabel>
                                <Select {...field} label="Сезон">
                                  <MenuItem value="spring">Весна</MenuItem>
                                  <MenuItem value="autumn">Осень</MenuItem>
                                  <MenuItem value="summer">Лето</MenuItem>
                                  <MenuItem value="winter">Зима</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name={`trials.${index}.predecessor`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Предшественник"
                                fullWidth
                                error={!!errors.trials?.[index]?.predecessor}
                                helperText={errors.trials?.[index]?.predecessor?.message}
                                placeholder="Например: fallow, wheat, barley"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Controller
                            name={`trials.${index}.seeding_rate`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Норма высева (ц/га)"
                                type="number"
                                fullWidth
                                error={!!errors.trials?.[index]?.seeding_rate}
                                helperText={errors.trials?.[index]?.seeding_rate?.message}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                inputProps={{ step: 0.1, min: 0 }}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>

                      {/* Trial Summary */}
                      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Сводка:
                          </Typography>
                          <Chip
                            label={getRegionName(field.region_id || 0)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Предшественник: ${field.predecessor || 'не указан'}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Норма: ${field.seeding_rate || 0} ц/га`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={getSeasonLabel(field.season || 'spring')}
                            size="small"
                            color={getSeasonColor(field.season || 'spring')}
                          />
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {errors.trials && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.trials.message}
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
            disabled={fields.length === 0}
          >
            Сохранить испытания
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TrialManagementDialog;
