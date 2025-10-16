import React, { useState } from 'react';
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
  Typography,
  Alert,
  CircularProgress,
  Box,
  Autocomplete,
  IconButton,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import { 
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { trialPlansService } from '@/api/trialPlans';
import { useRegions, useCultures } from '@/hooks/useDictionaries';
import apiClient from '@/api/client';

interface BulkAddParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  trialPlanId: number;
  oblastId: number;
  cultureId: number;
  trialTypeId: number;
  cultureName?: string;
}

interface RegionData {
  region_id: number;
  region_name?: string;
  predecessor: string | number;
  seeding_rate: number;
}

interface ParticipantData {
  patents_sort_id: number;
  sort_name?: string;
  participant_number: number;
  maturity_group: string;
  statistical_group: 0 | 1;
  seeds_provision: 'provided' | 'imported' | 'purchased';
  application_id?: number;
  source: 'registry' | 'applications'; // Источник для этого участника
}

export const AddParticipantsToPlanDialog: React.FC<BulkAddParticipantsDialogProps> = ({
  open,
  onClose,
  trialPlanId,
  oblastId,
  cultureId,
  trialTypeId,
  cultureName,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  
  const [selectedRegions, setSelectedRegions] = useState<RegionData[]>([]); // Общие регионы для всех
  const [participants, setParticipants] = useState<ParticipantData[]>([]);

  const { data: regions = [] } = useRegions(oblastId);
  
  // Load sorts from Applications (заявки)
  const { data: applicationSortsData = [], isLoading: loadingApplicationSorts } = useQuery({
    queryKey: ['suggest-applications', oblastId, cultureId],
    queryFn: async () => {
      const response = await apiClient.get('/trial-plans/suggest-applications/', {
        params: { 
          oblast_id: oblastId,
          culture_id: cultureId,
        }
      });
      
      console.log('📝 Ответ suggest-applications:', response.data);
      const applications = response.data.applications || [];
      console.log('📝 Найдено заявок:', applications.length, applications);
      
      // Преобразуем заявки в формат для выбора
      const mapped = applications.map((app: any) => {
        console.log('📝 Обработка заявки:', {
          id: app.id,
          application_number: app.application_number,
          sort_record: app.sort_record,
          maturity_group: app.maturity_group,
        });
        
        const result = {
          id: app.id, // ID заявки для внутреннего использования
          name: app.sort_record?.name || `Сорт из заявки #${app.application_number}`,
          application_id: app.id,
          application_number: app.application_number,
          maturity_group: app.maturity_group,
          patents_sort_id: app.sort_record?.patents_sort_id || app.sort_record?.id || app.sort_record,
          source: 'applications',
        };
        
        console.log('📝 Преобразовано в:', result);
        return result;
      });
      
      console.log('📝 Итого преобразованных заявок:', mapped.length, mapped);
      return mapped;
    },
    enabled: !!cultureId && !!oblastId && open,
    staleTime: 1000 * 60 * 5,
  });

  // Load sorts from Registry (реестр) - через suggest-applications с region_id
  const { data: registrySortsData = [], isLoading: loadingRegistrySorts } = useQuery({
    queryKey: ['registry-sorts', cultureId, selectedRegions.map(r => r.region_id)],
    queryFn: async () => {
      // Если регионы не выбраны, не загружаем
      if (selectedRegions.length === 0) return [];
      
      const allSorts: any[] = [];
      
      // Загружаем сорта для каждого выбранного региона
      for (const region of selectedRegions) {
        if (!region.region_id) continue;
        
        try {
          const response = await apiClient.get('/sort-records/by-culture/', {
            params: { 
              culture_id: cultureId,
              region_id: region.region_id, // ⭐ Опционально - для конкретного региона
            }
          });
          
          console.log(`📋 Полный ответ для региона ${region.region_id}:`, response.data);
          console.log(`📋 Ключи в ответе:`, Object.keys(response.data));
          
          // Проверяем все возможные варианты ответа
          const sorts = response.data.sorts || 
                       response.data.registry_sorts || 
                       response.data.registry || 
                       response.data.available_sorts || 
                       [];
          
          console.log(`📋 Найдено сортов из реестра для региона ${region.region_id}:`, sorts.length, sorts);
          allSorts.push(...sorts);
        } catch (error) {
          console.warn(`Ошибка загрузки сортов для региона ${region.region_id}:`, error);
        }
      }
      
      // Убираем дубликаты по patents_sort_id
      const uniqueSorts = Array.from(
        new Map(allSorts.map(s => [s.patents_sort_id || s.id, s])).values()
      );
      
      return uniqueSorts.map((sort: any) => ({
        id: sort.id,
        name: sort.name,
        patents_sort_id: sort.patents_sort_id || sort.id,
        source: 'registry',
      }));
    },
    enabled: !!cultureId && open && selectedRegions.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const applicationSorts = applicationSortsData;
  const registrySorts = registrySortsData;

  // Load cultures for predecessor
  const { data: cultures = [] } = useCultures();

  const addParticipantsMutation = useMutation({
    mutationFn: async (participantsData: ParticipantData[]) => {
      // ⭐ НОВЫЙ ПОДХОД: Отправляем всех участников одним запросом
      const transformedData = {
        participants: participantsData.map(participantData => ({
          patents_sort_id: participantData.patents_sort_id,
          sort_name: participantData.sort_name,
          statistical_group: participantData.statistical_group,
          seeds_provision: participantData.seeds_provision,
          maturity_group: participantData.maturity_group,
          application: participantData.application_id,
          trials: selectedRegions.map(region => ({
            region_id: region.region_id,
            predecessor: region.predecessor,
            seeding_rate: region.seeding_rate,
            season: 'spring' as 'spring' | 'autumn' | 'summer' | 'winter', // Сезон берется с уровня типа испытания
          }))
        }))
      };

      // Используем новый API endpoint
      const response = await trialPlansService.addParticipantsToTrialType(
        trialPlanId,
        cultureId,
        trialTypeId,
        transformedData
      );
      
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trialPlan', trialPlanId] });
      const participantsCount = data?.participants?.length || data?.length || 0;
      enqueueSnackbar(`Добавлено участников: ${participantsCount}`, { variant: 'success' });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Error adding participants:', error);
      enqueueSnackbar(
        error?.response?.data?.detail || 'Ошибка при добавлении участников',
        { variant: 'error' }
      );
    },
  });

  const handleAddRegion = () => {
    setSelectedRegions([...selectedRegions, {
      region_id: 0,
      predecessor: 'fallow',
      seeding_rate: 5.0,
    }]);
  };

  const handleRemoveRegion = (index: number) => {
    setSelectedRegions(selectedRegions.filter((_, i) => i !== index));
  };

  const handleUpdateRegion = (index: number, field: keyof RegionData, value: any) => {
    const updated = [...selectedRegions];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedRegions(updated);
  };

  const handleAddParticipant = () => {
    const newParticipant: ParticipantData = {
      patents_sort_id: 0,
      participant_number: 0, // Будет установлено автоматически на бэке
      maturity_group: '',
      statistical_group: 1,
      seeds_provision: 'provided',
      source: 'registry', // По умолчанию из реестра
    };
    setParticipants([...participants, newParticipant]);
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleUpdateParticipant = (index: number, field: keyof ParticipantData, value: any) => {
    console.log(`🔧 Обновление участника ${index}, поле: ${field}, значение:`, value);
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    console.log(`🔧 Обновленный участник:`, updated[index]);
    setParticipants(updated);
  };

  const handleSubmit = () => {
    // Валидация регионов
    if (selectedRegions.length === 0) {
      enqueueSnackbar('Добавьте хотя бы один регион', { variant: 'error' });
      return;
    }
    for (const region of selectedRegions) {
      if (!region.region_id) {
        enqueueSnackbar('Выберите регион для всех испытаний', { variant: 'error' });
        return;
      }
    }

    // Валидация участников
    if (participants.length === 0) {
      enqueueSnackbar('Добавьте хотя бы одного участника', { variant: 'error' });
      return;
    }
    for (const participant of participants) {
      if (!participant.patents_sort_id) {
        enqueueSnackbar('Выберите сорт для всех участников', { variant: 'error' });
        return;
      }
      if (!participant.maturity_group) {
        enqueueSnackbar('Укажите группу спелости для всех участников', { variant: 'error' });
        return;
      }
    }

    addParticipantsMutation.mutate(participants);
  };

  const handleClose = () => {
    setSelectedRegions([]);
    setParticipants([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Массовое добавление участников
      </DialogTitle>

      <DialogContent>
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary">
            Культура: <strong>{cultureName || `ID ${cultureId}`}</strong> → Тип испытания: <strong>ID {trialTypeId}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Добавьте участников с их испытаниями по регионам
          </Typography>
        </Box>

        {/* ШАГ 1: РЕГИОНЫ */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
          <Typography variant="h6" gutterBottom>
            Шаг 1: Выберите регионы (ГСУ)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Эти регионы будут применены ко ВСЕМ участникам
          </Typography>

          {selectedRegions.length === 0 ? (
            <Alert severity="info">
              Нажмите "Добавить регион" для начала
            </Alert>
          ) : (
            <Stack spacing={1} mb={2}>
              {selectedRegions.map((region, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Регион *</InputLabel>
                        <Select
                          value={region.region_id}
                          label="Регион *"
                          onChange={(e) => handleUpdateRegion(index, 'region_id', Number(e.target.value))}
                        >
                          <MenuItem value={0}>Выберите...</MenuItem>
                          {regions.map((r: any) => (
                            <MenuItem key={r.id} value={r.id}>
                              {r.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Предшественник</InputLabel>
                        <Select
                          value={region.predecessor}
                          label="Предшественник"
                          onChange={(e) => handleUpdateRegion(index, 'predecessor', e.target.value)}
                        >
                          <MenuItem value="fallow">Пар</MenuItem>
                          {cultures.map((culture: any) => (
                            <MenuItem key={culture.id} value={culture.id}>
                              {culture.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <TextField
                        label="Норма высева"
                        type="number"
                        size="small"
                        fullWidth
                        value={region.seeding_rate}
                        onChange={(e) => handleUpdateRegion(index, 'seeding_rate', Number(e.target.value))}
                        inputProps={{ step: 0.1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={2}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveRegion(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRegion}
            fullWidth
          >
            Добавить регион
          </Button>
        </Paper>

        {/* ШАГ 2: УЧАСТНИКИ */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'success.50' }}>
          <Typography variant="h6" gutterBottom>
            Шаг 2: Добавьте участников (сорта)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Каждый участник будет испытываться во ВСЕХ выбранных регионах
          </Typography>

          {participants.length === 0 ? (
            <Alert severity="info">
              Нажмите "Добавить участника" для начала
            </Alert>
          ) : (
          <Stack spacing={2}>
            {participants.map((participant, participantIndex) => (
              <Paper key={participantIndex} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Участник #{participantIndex + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveParticipant(participantIndex)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                <Grid container spacing={2}>
                  {/* Источник сорта */}
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Источник сорта</InputLabel>
                      <Select
                        value={participant.source}
                        label="Источник сорта"
                        onChange={(e) => {
                          const newSource = e.target.value as 'registry' | 'applications';
                          console.log(`🔄 Смена источника участника ${participantIndex}: ${participant.source} → ${newSource}`);
                          
                          // Обновляем все поля за один раз
                          const updated = [...participants];
                          updated[participantIndex] = {
                            ...updated[participantIndex],
                            source: newSource,
                            patents_sort_id: 0,
                            sort_name: '',
                            maturity_group: '',
                            application_id: undefined,
                          };
                          console.log(`🔄 Обновленный участник после смены источника:`, updated[participantIndex]);
                          setParticipants(updated);
                          
                          console.log(`🔄 Источник изменен. Доступно сортов:`, 
                            newSource === 'registry' ? `Реестр: ${registrySorts.length}` : `Заявки: ${applicationSorts.length}`
                          );
                        }}
                      >
                        <MenuItem value="registry">📋 Реестр сортов ({registrySorts.length})</MenuItem>
                        <MenuItem value="applications">📝 Из заявок ({applicationSorts.length})</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Выбор сорта */}
                  <Grid item xs={12}>
                    <Autocomplete
                      key={`sort-select-${participantIndex}-${participant.source}`}
                      options={participant.source === 'registry' ? registrySorts : applicationSorts}
                      getOptionLabel={(option: any) => {
                        if (participant.source === 'applications' && option.application_number) {
                          return `${option.name} (Заявка #${option.application_number})`;
                        }
                        return option.name || '';
                      }}
                      loading={participant.source === 'registry' ? loadingRegistrySorts : loadingApplicationSorts}
                      onOpen={() => {
                        console.log(`📋 Открыт выбор сорта для участника ${participantIndex}`);
                        console.log(`📋 Источник: ${participant.source}`);
                        console.log(`📋 Доступно опций:`, participant.source === 'registry' ? registrySorts.length : applicationSorts.length);
                        console.log(`📋 Опции:`, participant.source === 'registry' ? registrySorts : applicationSorts);
                      }}
                      value={
                        participant.source === 'registry'
                          ? registrySorts.find((s: any) => (s.patents_sort_id || s.id) === participant.patents_sort_id) || null
                          : applicationSorts.find((s: any) => s.application_id === participant.application_id) || null
                      }
                      onChange={(_, value) => {
                        console.log(`🎯 Выбран сорт для участника ${participantIndex}:`, value);
                        console.log(`🎯 Источник: ${participant.source}`);
                        
                        // Обновляем все поля за один раз
                        const updated = [...participants];
                        const currentParticipant = updated[participantIndex];
                        
                        if (!value) {
                          updated[participantIndex] = {
                            ...currentParticipant,
                            patents_sort_id: 0,
                            sort_name: '',
                            maturity_group: '',
                            application_id: undefined,
                          };
                        } else {
                          // Для обоих источников
                          const patentsSortId = value.patents_sort_id || value.id || 0;
                          console.log(`🎯 patents_sort_id для отправки:`, patentsSortId);
                          
                          const updates: any = {
                            patents_sort_id: patentsSortId,
                            sort_name: value.name || '',
                          };
                          
                          // Автоматически заполняем данные из заявки
                          if (participant.source === 'applications') {
                            console.log('📝 Автозаполнение из заявки:', {
                              maturity_group: value.maturity_group,
                              application_id: value.application_id,
                            });
                            
                            if (value.maturity_group) {
                              updates.maturity_group = value.maturity_group;
                            }
                            if (value.application_id) {
                              updates.application_id = value.application_id;
                            }
                          } else {
                            // Для реестра очищаем application_id
                            updates.application_id = undefined;
                          }
                          
                          updated[participantIndex] = {
                            ...currentParticipant,
                            ...updates,
                          };
                        }
                        
                        console.log(`🎯 Обновленный участник после выбора сорта:`, updated[participantIndex]);
                        setParticipants(updated);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Сорт *"
                          size="small"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {(participant.source === 'registry' ? loadingRegistrySorts : loadingApplicationSorts) ? 
                                  <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Группа спелости *"
                      size="small"
                      fullWidth
                      value={participant.maturity_group}
                      onChange={(e) =>
                        handleUpdateParticipant(participantIndex, 'maturity_group', e.target.value)
                      }
                      disabled={participant.source === 'applications' && !!participant.maturity_group}
                      helperText={
                        participant.source === 'applications' && participant.maturity_group
                          ? 'Автоматически из заявки'
                          : ''
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Стат. группа</InputLabel>
                      <Select
                        value={participant.statistical_group}
                        label="Стат. группа"
                        onChange={(e) =>
                          handleUpdateParticipant(participantIndex, 'statistical_group', e.target.value as 0 | 1)
                        }
                      >
                        <MenuItem value={0}>Стандарт</MenuItem>
                        <MenuItem value={1}>Испытываемый</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Семена</InputLabel>
                      <Select
                        value={participant.seeds_provision}
                        label="Семена"
                        onChange={(e) =>
                          handleUpdateParticipant(
                            participantIndex,
                            'seeds_provision',
                            e.target.value as 'provided' | 'imported' | 'purchased'
                          )
                        }
                      >
                        <MenuItem value="provided">Предоставлено</MenuItem>
                        <MenuItem value="imported">Импорт</MenuItem>
                        <MenuItem value="purchased">Куплено</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Информация о регионах */}
                {selectedRegions.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Будет испытываться в регионах:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedRegions.map((region, idx) => {
                        const regionInfo = regions.find((r: any) => r.id === region.region_id);
                        return (
                          <Chip
                            key={idx}
                            label={regionInfo?.name || 'Регион не выбран'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddParticipant}
            fullWidth
            sx={{ mt: 2 }}
          >
            Добавить участника
          </Button>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={addParticipantsMutation.isPending || participants.length === 0}
        >
          {addParticipantsMutation.isPending ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Добавление...
            </>
          ) : (
            `Добавить (${participants.length})`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

