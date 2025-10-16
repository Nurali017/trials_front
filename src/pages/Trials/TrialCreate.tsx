import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useRegions, useOblasts, useSortRecords } from '@/hooks/useDictionaries';
import { useTrialTypes } from '@/hooks/useTrials';
import { useCulturesForRegion, usePendingApplicationsForRegion } from '@/hooks/useApplications';
import { trialsService } from '@/api';
import { getTodayISO } from '@/utils/dateHelpers';
import { ParticipantSelector } from '@/components/forms/ParticipantSelector';
import type {
  StatisticalGroup,
  PlantingSeason,
  AgroBackground,
  GrowingConditions,
  CultivationTechnology,
  GrowingMethod,
  HarvestTiming,
} from '@/types/api.types';

interface SuggestedParticipant {
  application_id: number;
  application_number: string;
  sort_record: number; // Trials ID
  patents_sort_id?: number; // Patents ID
  sort_name: string;
}

interface ParticipantFormItem {
  id: string;
  sort_record: number | null;
  statistical_group: StatisticalGroup;
  participant_number: number;
  application?: number;
}

const steps = ['Основная информация', 'Участники'];

export const TrialCreate: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic info - НОВЫЙ ПОРЯДОК!
  const [oblast, setOblast] = useState<number | ''>('');
  const [region, setRegion] = useState<number | ''>('');
  const [culture, setCulture] = useState<number | ''>('');
  const [trialType, setTrialType] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [areaHa, setAreaHa] = useState<number | ''>(0.025);
  const [plantingSeason, setPlantingSeason] = useState<PlantingSeason | ''>('');
  const [responsiblePerson, setResponsiblePerson] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Агрономические параметры
  const [agroBackground, setAgroBackground] = useState<AgroBackground | ''>('');
  const [growingConditions, setGrowingConditions] = useState<GrowingConditions | ''>('');
  const [cultivationTechnology, setCultivationTechnology] = useState<CultivationTechnology | ''>('');
  const [growingMethod, setGrowingMethod] = useState<GrowingMethod | ''>('');
  const [harvestTiming, setHarvestTiming] = useState<HarvestTiming | ''>('');

  // Step 2: Participants
  const [participants, setParticipants] = useState<ParticipantFormItem[]>([]);
  const [suggestedParticipants, setSuggestedParticipants] = useState<SuggestedParticipant[]>([]);

  // Data fetching
  const { data: oblasts } = useOblasts();
  const { data: allRegions } = useRegions();
  const { data: trialTypes } = useTrialTypes();
  const { data: sortRecords } = useSortRecords(
    culture ? { culture: Number(culture) } : undefined,
    !!culture // enabled только когда culture выбрана
  );
  
  // Новые запросы
  const { data: culturesData, isLoading: loadingCultures } = useCulturesForRegion(
    region ? Number(region) : null
  );
  const { data: pendingApplications } = usePendingApplicationsForRegion(
    region ? Number(region) : null,
    culture ? Number(culture) : null
  );

  const oblastsArray = oblasts || [];
  const trialTypesArray = trialTypes || [];
  const sortsArray = sortRecords || [];
  
  // Фильтр регионов по области
  const regionsArray = allRegions?.filter(r => !oblast || r.oblast === oblast) || [];

  // При выборе области сбросить регион
  useEffect(() => {
    if (oblast) {
      setRegion('');
      setCulture('');
    }
  }, [oblast]);

  // При выборе региона сбросить культуру
  useEffect(() => {
    if (region) {
      setCulture('');
    }
  }, [region]);

  // При получении заявок - формируем рекомендуемых участников
  useEffect(() => {
    if (pendingApplications?.applications) {
      const suggested: SuggestedParticipant[] = pendingApplications.applications
        .filter(app => !app.already_in_trial && 
          (typeof app.sort_record.culture === 'object' 
            ? app.sort_record.culture.id === Number(culture)
            : app.sort_record.culture === Number(culture)))
        .map(app => {
          const sortRecord = app.sort_record as any;
          return {
            application_id: app.id,
            application_number: app.application_number,
            sort_record: sortRecord.id, // Trials ID
            patents_sort_id: sortRecord.sort_id, // Patents ID
            sort_name: sortRecord.name,
          };
        });
      
      setSuggestedParticipants(suggested);
    }
  }, [pendingApplications, culture]);


  const handleNext = () => {
    // Validation for each step
    if (activeStep === 0) {
      if (!oblast || !region || !culture) {
        enqueueSnackbar('Заполните область, ГСУ и культуру', { variant: 'warning' });
        return;
      }
    }

    if (activeStep === 1) {
      if (participants.length === 0) {
        enqueueSnackbar('Добавьте минимум 1 участника', { variant: 'warning' });
        return;
      }

      const hasStandard = participants.some(p => p.statistical_group === 0);
      if (!hasStandard) {
        enqueueSnackbar('Выберите минимум 1 стандартный сорт', { variant: 'error' });
        return;
      }

      const hasInvalidSort = participants.some(p => !p.sort_record);
      if (hasInvalidSort) {
        enqueueSnackbar('Выберите сорт для всех участников', { variant: 'warning' });
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Формируем участников: Autocomplete → sort_record, Рекомендуемые → sort_id
      const allParticipants = participants.map((p) => {
        // Проверяем что sort_record не null
        if (!p.sort_record) {
          throw new Error(`Участник №${p.participant_number} не имеет выбранного сорта`);
        }

        // Если участник из заявки (есть application) - отправляем patents_sort_id (Patents ID)
        if (p.application) {
          // Находим в suggestedParticipants для получения Patents ID
          const suggested = suggestedParticipants.find(s => s.application_id === p.application);
          if (!suggested) {
            throw new Error(`Не найдена заявка для участника №${p.participant_number}`);
          }
          return {
            patents_sort_id: suggested.patents_sort_id, // Patents ID из заявки
            statistical_group: p.statistical_group,
            participant_number: p.participant_number,
            application: p.application,
          };
        }

        // Если участник выбран вручную через Autocomplete - отправляем patents_sort_id (Patents ID)
        const sortData = sortsArray.find(s => s.id === p.sort_record);
        if (!sortData) {
          throw new Error(`Сорт с ID ${p.sort_record} не найден в доступных сортах`);
        }
        
        return {
          patents_sort_id: p.sort_record, // Patents ID из Autocomplete
          statistical_group: p.statistical_group,
          participant_number: p.participant_number,
        };
      });

      const payload = {
        culture: Number(culture),
        region: Number(region),
        trial_type: trialType ? Number(trialType) : undefined,
        start_date: startDate,
        area_ha: areaHa === '' ? undefined : areaHa,
        planting_season: plantingSeason || undefined,
        responsible_person: responsiblePerson || undefined,
        description: description || undefined,

        // Агрономические параметры
        agro_background: agroBackground || undefined,
        growing_conditions: growingConditions || undefined,
        cultivation_technology: cultivationTechnology || undefined,
        growing_method: growingMethod || undefined,
        harvest_timing: harvestTiming || undefined,

        participants: allParticipants,
        // indicators не передаем - бэкенд автоматически загрузит все показатели для культуры
        indicators: undefined,
      };

      console.log('🚀 Отправляем payload:', JSON.stringify(payload, null, 2));
      const trial = await trialsService.create(payload);

      enqueueSnackbar('Сортоопыт успешно создан!', { variant: 'success' });
      navigate(`/trials/${trial.id}`);
    } catch (error: any) {
      enqueueSnackbar(
        `Ошибка: ${error.response?.data?.message || error.message}`,
        { variant: 'error' }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Создать сортоопыт
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Создание испытания с участниками и показателями
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Basic Info - НОВАЯ СТРУКТУРА */}
        {activeStep === 0 && (
          <Box>
            <Grid container spacing={3}>
              {/* ОБЛАСТЬ - ПЕРВОЕ ПОЛЕ */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Область</InputLabel>
                  <Select
                    value={oblast}
                    label="Область"
                    onChange={(e) => setOblast(e.target.value as number | '')}
                  >
                    <MenuItem value="">Выберите...</MenuItem>
                    {oblastsArray.map((obl) => (
                      <MenuItem key={obl.id} value={obl.id}>
                        {obl.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ГСУ - ВТОРОЕ ПОЛЕ */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required disabled={!oblast}>
                  <InputLabel>ГСУ (Сортоучасток)</InputLabel>
                  <Select
                    value={region}
                    label="ГСУ (Сортоучасток)"
                    onChange={(e) => setRegion(e.target.value as number | '')}
                  >
                    <MenuItem value="">Выберите...</MenuItem>
                    {regionsArray.map((reg) => (
                      <MenuItem key={reg.id} value={reg.id}>
                        {reg.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* КУЛЬТУРА - ТРЕТЬЕ ПОЛЕ (из API) */}
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={!region}>
                  <Typography variant="subtitle2" gutterBottom>
                    Культура *
                  </Typography>
                  {loadingCultures ? (
                    <Box display="flex" alignItems="center" gap={2}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Загрузка культур...</Typography>
                    </Box>
                  ) : culturesData && culturesData.cultures.length > 0 ? (
                    <RadioGroup
                      value={culture}
                      onChange={(e) => setCulture(Number(e.target.value))}
                    >
                      {culturesData.cultures.map((cult) => (
                        <Card 
                          key={cult.culture_id} 
                          variant="outlined" 
                          onClick={() => setCulture(cult.culture_id)}
                          sx={{ 
                            mb: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: culture === cult.culture_id ? 2 : 1,
                            borderColor: culture === cult.culture_id ? 'primary.main' : 'divider',
                            bgcolor: culture === cult.culture_id ? 'primary.50' : 'transparent',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: culture === cult.culture_id ? 'primary.50' : 'action.hover',
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <FormControlLabel
                              value={cult.culture_id}
                              control={<Radio />}
                              label={
                                <Box>
                                  <Typography variant="body1" fontWeight={500}>
                                    {cult.culture_name}
                                  </Typography>
                                  <Box display="flex" gap={1} mt={0.5}>
                                    <Chip 
                                      label={`Всего заявок: ${cult.applications_count}`} 
                                      size="small" 
                                    />
                                    <Chip 
                                      label={`Ожидают: ${cult.pending_count}`} 
                                      size="small"
                                      color="primary"
                                    />
                                    {cult.in_trial_count > 0 && (
                                      <Chip 
                                        label={`В испытаниях: ${cult.in_trial_count}`} 
                                        size="small"
                                        color="success"
                                      />
                                    )}
                                  </Box>
                                  {cult.sample_applications.length > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      Примеры: {cult.sample_applications.join(', ')}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </RadioGroup>
                  ) : region ? (
                    <Alert severity="warning">
                      Нет распределенных заявок для выбранного ГСУ. Сначала распределите заявки через раздел "Заявки".
                    </Alert>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Выберите ГСУ для загрузки доступных культур
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Остальные поля */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Тип испытания</InputLabel>
                  <Select
                    value={trialType}
                    label="Тип испытания"
                    onChange={(e) => setTrialType(e.target.value as number | '')}
                  >
                    <MenuItem value="">Не указан</MenuItem>
                    {trialTypesArray.map((type: any) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} ({type.category_display})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Дата начала"
                  type="date"
                  fullWidth
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Площадь (га)"
                  type="number"
                  fullWidth
                  value={areaHa}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAreaHa(value === '' ? '' : parseFloat(value));
                  }}
                  inputProps={{ step: 0.001, min: 0 }}
                  helperText="Рекомендуемая площадь: 0.025 га"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Сезон посадки</InputLabel>
                  <Select
                    value={plantingSeason}
                    label="Сезон посадки"
                    onChange={(e) => setPlantingSeason(e.target.value as PlantingSeason | '')}
                  >
                    <MenuItem value="">Не указан</MenuItem>
                    <MenuItem value="spring">Весенний</MenuItem>
                    <MenuItem value="autumn">Осенний</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="ФИО ответственного"
                  fullWidth
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  helperText="Лицо, ответственное за проведение испытания"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Описание испытания"
                  fullWidth
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание целей и задач испытания"
                />
              </Grid>
            </Grid>

            {/* Агрономические параметры */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Агрономические параметры
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Агрофон</InputLabel>
                    <Select
                      value={agroBackground}
                      label="Агрофон"
                      onChange={(e) => setAgroBackground(e.target.value as AgroBackground | '')}
                    >
                      <MenuItem value="">Не указан</MenuItem>
                      <MenuItem value="favorable">Благоприятный</MenuItem>
                      <MenuItem value="moderate">Умеренный</MenuItem>
                      <MenuItem value="unfavorable">Неблагоприятный</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Условия выращивания</InputLabel>
                    <Select
                      value={growingConditions}
                      label="Условия выращивания"
                      onChange={(e) => setGrowingConditions(e.target.value as GrowingConditions | '')}
                    >
                      <MenuItem value="">Не указаны</MenuItem>
                      <MenuItem value="rainfed">Богара</MenuItem>
                      <MenuItem value="irrigated">Орошение</MenuItem>
                      <MenuItem value="mixed">Смешанные</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Технология возделывания</InputLabel>
                    <Select
                      value={cultivationTechnology}
                      label="Технология возделывания"
                      onChange={(e) => setCultivationTechnology(e.target.value as CultivationTechnology | '')}
                    >
                      <MenuItem value="">Не указана</MenuItem>
                      <MenuItem value="traditional">Традиционная</MenuItem>
                      <MenuItem value="minimal">Минимальная обработка</MenuItem>
                      <MenuItem value="no_till">No-till (нулевая)</MenuItem>
                      <MenuItem value="organic">Органическая</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Метод выращивания</InputLabel>
                    <Select
                      value={growingMethod}
                      label="Метод выращивания"
                      onChange={(e) => setGrowingMethod(e.target.value as GrowingMethod | '')}
                    >
                      <MenuItem value="">Не указан</MenuItem>
                      <MenuItem value="soil_traditional">Традиционное в почве</MenuItem>
                      <MenuItem value="hydroponics">Гидропоника</MenuItem>
                      <MenuItem value="greenhouse">Защищенный грунт</MenuItem>
                      <MenuItem value="raised_beds">Приподнятые грядки</MenuItem>
                      <MenuItem value="container">Контейнерное</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
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
            </Box>
          </Box>
        )}

        {/* Step 2: Participants */}
        {activeStep === 1 && culture && (
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Участники испытания
            </Typography>
            <ParticipantSelector
              cultureId={Number(culture)}
              participants={participants}
              onChange={setParticipants}
              suggestedParticipants={suggestedParticipants}
            />
          </Box>
        )}


        {/* Navigation buttons */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            onClick={() => navigate('/trials')}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Box display="flex" gap={2}>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={isSubmitting}>
                Назад
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Далее
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Создать сортоопыт'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Summary */}
      {activeStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Сводка
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Область</Typography>
              <Typography variant="body1" fontWeight={500}>
                {oblastsArray.find(o => o.id === oblast)?.name || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">ГСУ</Typography>
              <Typography variant="body1" fontWeight={500}>
                {regionsArray.find(r => r.id === region)?.name || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Культура</Typography>
              <Typography variant="body1" fontWeight={500}>
                {culturesData?.cultures.find(c => c.culture_id === culture)?.culture_name || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Участников</Typography>
              <Typography variant="body1" fontWeight={500}>
                {participants.length}
                {' '}(испытываемых: {participants.filter(p => p.statistical_group === 1).length}, 
                стандартов: {participants.filter(p => p.statistical_group === 0).length})
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  📊 <strong>Показатели:</strong> Автоматически загрузятся все показатели для культуры "{culturesData?.cultures.find(c => c.culture_id === culture)?.culture_name}". Основные показатели заполняются сортопытом, качественные - лабораторией.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};
