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
  Typography,
  Alert,
  CircularProgress,
  Box,
  TextField,
  Card,
  CardContent,
  IconButton,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddParticipants, useSuggestApplications } from '../../hooks/useTrialPlans';
import { useDictionaries } from '../../hooks/useDictionaries';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useSnackbar } from 'notistack';

// Validation schema для региональных испытаний (верхний уровень)
const regionalTrialSchema = z.object({
  region_id: z.union([z.number().min(1, 'Выберите регион'), z.literal('')]),
  predecessor: z.union([z.string(), z.number()]),
  seeding_rate: z.number().min(0.1, 'Норма высева должна быть больше 0'),
  season: z.enum(['spring', 'autumn', 'summer', 'winter']),
  trial_type_id: z.number().optional(),
});

// Validation schema для участников
const participantSchema = z.object({
  source_type: z.enum(['application', 'registry']),
  application_id: z.union([z.number(), z.literal('')]).optional(),
  patents_sort_id: z.union([z.number(), z.literal('')]).optional(),
  statistical_group: z.union([z.literal(0), z.literal(1)]),
  seeds_provision: z.enum(['provided', 'imported', 'purchased']),
  maturity_group: z.string().optional(),
});

const addParticipantsSchema = z.object({
  regional_trials: z.array(regionalTrialSchema).min(1, 'Добавьте хотя бы одно региональное испытание'),
  participants: z.array(participantSchema).min(1, 'Добавьте хотя бы одного участника'),
});

type AddParticipantsFormData = z.infer<typeof addParticipantsSchema>;

interface AddParticipantsToPlanDialogProps {
  open: boolean;
  onClose: () => void;
  trialPlanId: number;
  oblastId: number; // ID области из плана
  cultureId: number; // ID культуры из Patents Service
  trialTypeId: number;
  cultureName?: string;
}

export const AddParticipantsToPlanDialog: React.FC<AddParticipantsToPlanDialogProps> = ({
  open,
  onClose,
  trialPlanId,
  oblastId,
  cultureId,
  cultureName,
}) => {
  const addParticipants = useAddParticipants();
  const dictionaries = useDictionaries();

  // Загружаем заявки для культуры и области
  const { data: applicationsData } = useSuggestApplications({
    oblast_id: typeof oblastId === 'number' ? oblastId : (oblastId as any)?.id,
    culture_id: cultureId,
  }, open);
  
  // API возвращает { applications: [...] }
  const suggestedApplications = applicationsData?.applications || [];

  // Загружаем регионы только для области плана (через бэк фильтр)
  const { data: regionsByOblast = [] } = useQuery({
    queryKey: ['regionsByOblast', oblastId],
    queryFn: () => apiClient.get('/regions/', { params: { oblast: oblastId } }).then(res => {
      // Может вернуться массив или объект с results
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }),
    enabled: open && !!oblastId,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const { enqueueSnackbar } = useSnackbar();

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<AddParticipantsFormData>({
    resolver: zodResolver(addParticipantsSchema),
    defaultValues: {
      regional_trials: [],
      participants: [],
    },
  });

  // Берем первый регион из региональных испытаний для фильтрации сортов
  const firstRegionId = watch('regional_trials.0.region_id');

  // Загружаем сорта из реестра для культуры и региона (только после выбора региона)
  const { data: registryData } = useQuery({
    queryKey: ['sortRecordsByCulture', cultureId, firstRegionId],
    queryFn: () => apiClient.get('/sort-records/by-culture/', { 
      params: { culture_id: cultureId, region_id: firstRegionId } 
    }).then(res => res.data),
    enabled: open && !!cultureId && !!firstRegionId && typeof firstRegionId === 'number', // Только после выбора региона
  });

  const registrySorts = registryData?.sorts || [];

  // Автоматическое заполнение maturity_group теперь происходит в onChange обработчиках Select компонентов

  const { fields: trialFields, append: appendTrial, remove: removeTrial } = useFieldArray({
    control,
    name: 'regional_trials',
  });

  const { fields: participantFields, append: appendParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: 'participants',
  });

  // Получить расшифровку предшественника
  const getPredecessorDisplayName = (predecessor: string | number) => {
    if (predecessor === 'fallow') return 'Пар';
    if (typeof predecessor === 'number') {
      const culture = dictionaries.cultures?.find((c: any) => c.id === predecessor);
      return culture?.name || `Культура #${predecessor}`;
    }
    return predecessor;
  };

  const onSubmit = async (data: AddParticipantsFormData) => {
    try {
    // Преобразуем данные в формат API
    const transformedData = {
      participants: data.participants.map((p) => {
        const baseData = {
          maturity_group: p.maturity_group || 'Авто', // Из формы или по умолчанию
          statistical_group: p.statistical_group,
          seeds_provision: p.seeds_provision,
          trials: data.regional_trials.map(trial => ({
            region_id: typeof trial.region_id === 'string' ? Number(trial.region_id) : trial.region_id,
            predecessor: trial.predecessor,
            seeding_rate: trial.seeding_rate,
            season: trial.season,
            ...(trial.trial_type_id && { trial_type_id: trial.trial_type_id })
          })), // Все участники получают все региональные испытания
        };

        // Для заявок
        if (p.source_type === 'application' && p.application_id && typeof p.application_id === 'number') {
          const application = suggestedApplications.find((app: any) => app.id === p.application_id);
          return {
            ...baseData,
            application: Number(p.application_id),
            // Если в заявке есть patents_sort_id, отправляем его тоже
            ...(application?.sort_record?.patents_sort_id && {
              patents_sort_id: application.sort_record.patents_sort_id,
              sort_name: application.sort_record?.name || application.sort_record_data?.name
            })
          };
        }

        // Для реестра
        if (p.source_type === 'registry' && p.patents_sort_id && typeof p.patents_sort_id === 'number') {
          // Находим название сорта из загруженных сортов реестра
          const sortFromRegistry = registrySorts.find((sort: any) => sort.id === p.patents_sort_id);
          return {
            ...baseData,
            patents_sort_id: p.patents_sort_id,
            sort_name: sortFromRegistry?.name
          };
        }

        return baseData;
      }),
    };

      await addParticipants.mutateAsync({
        id: trialPlanId,
        data: transformedData,
      });

      enqueueSnackbar(`Добавлено участников: ${data.participants.length}`, { variant: 'success' });
      reset();
      onClose();
    } catch (error: any) {
      console.error('Error adding participants:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Ошибка при добавлении участников';
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Добавить участников для культуры: {cultureName || `ID ${cultureId}`}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {/* РЕГИОНАЛЬНЫЕ ИСПЫТАНИЯ (верхний уровень) */}
          <Box mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">🌾 Региональные испытания (общие для всех участников)</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => appendTrial({ region_id: '', predecessor: 'fallow', seeding_rate: 5.0, season: 'spring' })}>
                Добавить регион
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Эти испытания автоматически применяются ко всем участникам ниже
            </Typography>

            {trialFields.length === 0 ? (
              <Alert severity="warning">Добавьте хотя бы одно региональное испытание</Alert>
            ) : (
              <Stack spacing={2}>
                {trialFields.map((field, index) => (
                  <Card key={field.id} variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1">Регион #{index + 1}</Typography>
                        <IconButton color="error" size="small" onClick={() => removeTrial(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Controller
                            name={`regional_trials.${index}.region_id`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth error={!!errors.regional_trials?.[index]?.region_id}>
                                <InputLabel>Регион (ГСУ)</InputLabel>
                                <Select 
                                  {...field} 
                                  value={field.value || ''} 
                                  label="Регион (ГСУ)"
                                  onChange={(e) => field.onChange(e.target.value || '')}
                                >
                                  <MenuItem value="">
                                    <em>Выберите регион</em>
                                  </MenuItem>
                                  {regionsByOblast.map((region: any) => (
                                    <MenuItem key={region.id} value={region.id}>
                                      {region.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        <Grid item xs={12} sm={3}>
                          <Controller
                            name={`regional_trials.${index}.predecessor`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel>Предшественник</InputLabel>
                                <Select {...field} label="Предшественник">
                                  <MenuItem value="fallow">Пар</MenuItem>
                                  {dictionaries.cultures?.slice(0, 20).map((culture: any) => (
                                    <MenuItem key={`pred-${index}-${culture.id}`} value={culture.id}>
                                      {culture.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        <Grid item xs={6} sm={2}>
                          <Controller
                            name={`regional_trials.${index}.seeding_rate`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Норма"
                                type="number"
                                fullWidth
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                inputProps={{ step: 0.1 }}
                              />
                            )}
                          />
                        </Grid>

                        <Grid item xs={6} sm={3}>
                          <Controller
                            name={`regional_trials.${index}.season`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
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
                      </Grid>

                      {/* Показываем расшифровку */}
                      {watch(`regional_trials.${index}.predecessor`) && (
                        <Box mt={1}>
                          <Chip
                            label={`Предшественник: ${getPredecessorDisplayName(watch(`regional_trials.${index}.predecessor`))}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {errors.regional_trials && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.regional_trials.message}
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* УЧАСТНИКИ */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">👥 Участники культуры</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => appendParticipant({ source_type: 'registry', application_id: '', patents_sort_id: '', statistical_group: 1, seeds_provision: 'provided' })}>
                Добавить участника
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Участники связываются со всеми региональными испытаниями выше. Номер участника генерируется на сервере, группа спелости заполняется автоматически.
            </Typography>

            {participantFields.length === 0 ? (
              <Alert severity="warning">Добавьте участников для продолжения</Alert>
            ) : (
              <Stack spacing={2}>
                {participantFields.map((field, index) => (
                  <Card key={field.id} variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1">Участник #{index + 1}</Typography>
                          <Chip label={`${trialFields.length} региональных испытаний`} size="small" variant="outlined" color="success" />
                        </Stack>
                        <IconButton color="error" size="small" onClick={() => removeParticipant(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Controller
                            name={`participants.${index}.source_type`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel>Источник сорта</InputLabel>
                                <Select {...field} label="Источник сорта">
                                  <MenuItem value="application">📋 Из заявки</MenuItem>
                                  <MenuItem value="registry">📚 Из реестра</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        {watch(`participants.${index}.source_type`) === 'application' ? (
                          <Grid item xs={12} sm={4}>
                            <Controller
                              name={`participants.${index}.application_id`}
                              control={control}
                              render={({ field }) => (
                                <FormControl fullWidth>
                                  <InputLabel>Заявка</InputLabel>
                                  <Select 
                                    {...field} 
                                    value={field.value || ''} 
                                    label="Заявка"
                                    onChange={(e) => {
                                      const selectedAppId = e.target.value;
                                      field.onChange(selectedAppId || '');
                                      
                                      // Автоматически устанавливаем maturity_group из выбранной заявки
                                      if (selectedAppId && typeof selectedAppId === 'number') {
                                        const application = suggestedApplications.find((app: any) => app.id === selectedAppId);
                                        if (application?.maturity_group) {
                                          setValue(`participants.${index}.maturity_group`, application.maturity_group);
                                        }
                                      }
                                    }}
                                  >
                                    <MenuItem value="">
                                      <em>Выберите заявку</em>
                                    </MenuItem>
                                    {suggestedApplications.length === 0 ? (
                                      <MenuItem value="" disabled>Нет доступных заявок</MenuItem>
                                    ) : (
                                      suggestedApplications.map((app: any) => (
                                        <MenuItem key={app.id} value={app.id}>
                                          {app.application_number} - {app.sort_record?.name}
                                        </MenuItem>
                                      ))
                                    )}
                                  </Select>
                                </FormControl>
                              )}
                            />
                          </Grid>
                        ) : (
                          <Grid item xs={12} sm={4}>
                            <Controller
                              name={`participants.${index}.patents_sort_id`}
                              control={control}
                              render={({ field }) => (
                                <FormControl fullWidth disabled={trialFields.length === 0}>
                                  <InputLabel>Сорт из реестра</InputLabel>
                                  <Select 
                                    {...field} 
                                    value={field.value || ''} 
                                    label="Сорт из реестра"
                                    onChange={(e) => {
                                      const selectedSortId = e.target.value;
                                      field.onChange(selectedSortId || '');
                                      
                                      // Автоматически устанавливаем maturity_group из выбранного сорта
                                      if (selectedSortId && typeof selectedSortId === 'number') {
                                        const sort = registrySorts.find((s: any) => s.id === selectedSortId);
                                        if (sort?.maturity_group) {
                                          setValue(`participants.${index}.maturity_group`, sort.maturity_group);
                                        }
                                      }
                                    }}
                                  >
                                    <MenuItem value="">
                                      <em>Выберите сорт</em>
                                    </MenuItem>
                                    {trialFields.length === 0 ? (
                                      <MenuItem value="" disabled>Сначала добавьте регион</MenuItem>
                                    ) : registrySorts.length === 0 ? (
                                      <MenuItem value="" disabled>Нет сортов для выбранного региона</MenuItem>
                                    ) : (
                                      registrySorts.map((sort: any) => (
                                        <MenuItem key={sort.id} value={sort.id}>
                                          {sort.name}
                                        </MenuItem>
                                      ))
                                    )}
                                  </Select>
                                </FormControl>
                              )}
                            />
                          </Grid>
                        )}

                        <Grid item xs={6} sm={2}>
                          <Controller
                            name={`participants.${index}.statistical_group`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel>Группа</InputLabel>
                                <Select {...field} label="Группа">
                                  <MenuItem value={0}>Стандарт</MenuItem>
                                  <MenuItem value={1}>Испытываемый</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>


                        <Grid item xs={6} sm={2}>
                          <Controller
                            name={`participants.${index}.seeds_provision`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel>Семена</InputLabel>
                                <Select {...field} label="Семена">
                                  <MenuItem value="provided">✅ Получены</MenuItem>
                                  <MenuItem value="imported">📦 Импорт</MenuItem>
                                  <MenuItem value="purchased">🛒 Куплены</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                      </Grid>

                      {/* Автоматически заполняемые поля */}
                      <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip label="Номер: будет назначен сервером" size="small" color="primary" variant="outlined" />
                          <Chip label="Группа спелости: из сорта (авто)" size="small" color="secondary" variant="outlined" />
                          <Chip label={watch(`participants.${index}.statistical_group`) === 0 ? 'Стандарт' : 'Испытываемый'} size="small" color={watch(`participants.${index}.statistical_group`) === 0 ? 'success' : 'primary'} />
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {errors.participants && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.participants.message}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={addParticipants.isPending || trialFields.length === 0 || participantFields.length === 0}
          >
            {addParticipants.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Сохранение...
              </>
            ) : (
              'Добавить участников'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
