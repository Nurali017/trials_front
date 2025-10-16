import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Autocomplete,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useAvailableSorts } from '@/hooks/useTrials';
import { useCultureGroups, useCultures, useOblasts } from '@/hooks/useDictionaries';
import { useCreateApplication } from '@/hooks/useApplications';
import { useDocuments } from '@/hooks/useDocuments';
import { getTodayISO } from '@/utils/dateHelpers';
import { AvailableSort, CreateApplicationRequest, CultureGroup, Culture, DocumentType } from '@/types/api.types';
import { CreateSortDialog } from '@/components/forms/CreateSortDialog';
import { DocumentUpload } from '@/components/forms/DocumentUpload';

interface FormData {
  sort_record: number | null;
  application_number: string;
  submission_date: string;
  applicant: string;
  applicant_inn_bin: string;
  contact_person_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  maturity_group: string;
  purpose: string;
  target_oblasts: number[];
}

const steps = ['Выбор сорта', 'Информация о заявке', 'Загрузка документов', 'Выбор целевых областей'];

export const ApplicationCreate: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [createSortDialogOpen, setCreateSortDialogOpen] = useState(false);
  
  // Cascade selection states
  const [selectedCultureGroup, setSelectedCultureGroup] = useState<CultureGroup | null>(null);
  const [selectedCulture, setSelectedCulture] = useState<Culture | null>(null);
  const [selectedSort, setSelectedSort] = useState<AvailableSort | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; type: DocumentType; title: string }>>([]);
  const [hasAllRequiredDocs, setHasAllRequiredDocs] = useState(false);

  const { data: cultureGroups, isLoading: loadingCultureGroups } = useCultureGroups();
  const { data: cultures, isLoading: loadingCultures } = useCultures(selectedCultureGroup?.id);
  const { data: availableSorts, isLoading: loadingSorts } = useAvailableSorts(searchQuery, selectedCulture?.id);
  const { data: oblasts, isLoading: loadingOblasts } = useOblasts();
  const { mutate: createApplication, isPending } = useCreateApplication();
  const { uploadDocument } = useDocuments();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      sort_record: null,
      application_number: '',
      submission_date: getTodayISO(),
      applicant: '',
      applicant_inn_bin: '',
      contact_person_name: '',
      contact_person_phone: '',
      contact_person_email: '',
      maturity_group: '',
      purpose: '',
      target_oblasts: [],
    },
  });

  const sortRecord = watch('sort_record');
  const selectedOblasts = watch('target_oblasts');

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: FormData) => {
    if (!data.sort_record) {
      enqueueSnackbar('Пожалуйста, выберите сорт', { variant: 'warning' });
      return;
    }

    if (data.target_oblasts.length === 0) {
      enqueueSnackbar('Выберите хотя бы одну область', { variant: 'warning' });
      return;
    }

    const payload: CreateApplicationRequest = {
      sort_id: data.sort_record, // sort_id из Patents Service - бэкенд сам создаст SortRecord
      application_number: data.application_number,
      submission_date: data.submission_date,
      applicant: data.applicant,
      applicant_inn_bin: data.applicant_inn_bin,
      contact_person_name: data.contact_person_name,
      contact_person_phone: data.contact_person_phone,
      contact_person_email: data.contact_person_email,
      maturity_group: data.maturity_group,
      purpose: data.purpose,
      target_oblasts: data.target_oblasts,
      status: 'submitted', // Заявка создается сразу как поданная
      // created_by устанавливается автоматически на бэкенде
    };

    createApplication(payload, {
      onSuccess: (application) => {
        enqueueSnackbar('Заявка успешно создана!', { variant: 'success' });

        // Загружаем документы
        if (uploadedFiles.length > 0) {
          let uploadedCount = 0;
          uploadedFiles.forEach((uploadedFile) => {
            uploadDocument({
              documentType: uploadedFile.type,
              file: uploadedFile.file,
              applicationId: application.id,
              customTitle: uploadedFile.title,
            });
            uploadedCount++;
            
            if (uploadedCount === uploadedFiles.length) {
              enqueueSnackbar(`Загружено ${uploadedCount} документов`, { variant: 'success' });
              navigate(`/applications/${application.id}`);
            }
          });
        } else {
          navigate(`/applications/${application.id}`);
        }
      },
      onError: (error: any) => {
        enqueueSnackbar(
          `Ошибка: ${error.response?.data?.message || error.message}`,
          { variant: 'error' }
        );
      },
    });
  };

  const handleOblastToggle = (oblastId: number) => {
    const currentOblasts = selectedOblasts || [];
    const newOblasts = currentOblasts.includes(oblastId)
      ? currentOblasts.filter((id) => id !== oblastId)
      : [...currentOblasts, oblastId];
    setValue('target_oblasts', newOblasts);
  };

  const handleSortCreated = (newSortId: number) => {
    // После создания сорта, обновляем список и выбираем новый сорт
    // Список обновится автоматически через invalidateQueries
    setValue('sort_record', newSortId);
    
    // Найдем созданный сорт в обновленном списке после короткой задержки
    setTimeout(() => {
      const newSort = availableSorts?.find((s: AvailableSort) => s.id === newSortId);
      if (newSort) {
        setSelectedSort(newSort);
        enqueueSnackbar('Сорт создан и выбран успешно! Переходим к следующему шагу.', { variant: 'success' });
        
        // Автоматически переходим к следующему шагу
        setTimeout(() => {
          handleNext();
        }, 1000);
      }
    }, 500);
  };

  // Step 1: Sort Selection
  const renderSortSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Выберите сорт для испытаний
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Сначала выберите группу культуры, затем культуру, затем сорт
      </Typography>

      <Grid container spacing={3}>
        {/* Culture Group Selection */}
        <Grid item xs={12}>
          <Autocomplete<CultureGroup>
            options={cultureGroups || []}
            loading={loadingCultureGroups}
            value={selectedCultureGroup}
            getOptionLabel={(option) => option.name || ''}
            onChange={(_, value) => {
              setSelectedCultureGroup(value);
              setSelectedCulture(null);
              setSelectedSort(null);
              setValue('sort_record', null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="1. Группа культуры *"
                placeholder="Выберите группу культуры..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingCultureGroups ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Culture Selection */}
        <Grid item xs={12}>
          <Autocomplete<Culture>
            options={cultures || []}
            loading={loadingCultures}
            value={selectedCulture}
            disabled={!selectedCultureGroup}
            getOptionLabel={(option) => option.name || ''}
            onChange={(_, value) => {
              setSelectedCulture(value);
              setSelectedSort(null);
              setValue('sort_record', null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="2. Культура *"
                placeholder={selectedCultureGroup ? "Выберите культуру..." : "Сначала выберите группу культуры"}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingCultures ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Sort Selection */}
        <Grid item xs={12}>
          <Controller
            name="sort_record"
            control={control}
            rules={{ required: 'Выберите сорт' }}
            render={({ field }) => (
              <Autocomplete<AvailableSort>
                options={availableSorts || []}
                loading={loadingSorts}
                value={selectedSort}
                disabled={!selectedCulture}
                getOptionLabel={(option) => option.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  
                  const searchTerm = inputValue.toLowerCase();
                  return options.filter(option => 
                    option.name.toLowerCase().includes(searchTerm) ||
                    (option.code && option.code.toLowerCase().includes(searchTerm))
                  );
                }}
                noOptionsText={
                  !selectedCulture ? 'Сначала выберите культуру' :
                  loadingSorts ? 'Загрузка...' : 'Сорта не найдены'
                }
                onInputChange={(_, value) => setSearchQuery(value)}
                onChange={(_, value) => {
                  setSelectedSort(value);
                  field.onChange(value?.id || null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="3. Сорт *"
                    placeholder={selectedCulture ? "Введите наименование или селекционный номер..." : "Сначала выберите культуру"}
                    error={!!errors.sort_record}
                    helperText={errors.sort_record?.message || 'Можно искать сорт по наименованию или селекционному номеру'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingSorts ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body1" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Селекционный номер: {option.code}
                      </Typography>
                      {option.originators && option.originators.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Оригинаторы: {option.originators.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
              />
            )}
          />
        </Grid>

        {/* Create New Sort Button - только если сорт не выбран */}
        {!selectedSort && (
          <Grid item xs={12}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateSortDialogOpen(true)}
              disabled={!selectedCulture}
              fullWidth
            >
              Не нашли нужный сорт? Создайте новый
            </Button>
          </Grid>
        )}
      </Grid>

      {selectedSort && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Выбранный сорт:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Группа культуры
                </Typography>
                <Typography variant="body1">{selectedCultureGroup?.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Культура
                </Typography>
                <Typography variant="body1">{selectedCulture?.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Название сорта
                </Typography>
                <Typography variant="body1">{selectedSort.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Селекционный номер
                </Typography>
                <Typography variant="body1">{selectedSort.code}</Typography>
              </Grid>
              {selectedSort.originators && selectedSort.originators.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Оригинаторы
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {selectedSort.originators.map((orig: string, idx: number) => (
                      <Chip key={idx} label={orig} size="small" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => navigate('/applications')} sx={{ mr: 1 }}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleNext} disabled={!sortRecord}>
          Далее
        </Button>
      </Box>
    </Box>
  );

  // Step 2: Application Info
  const renderApplicationInfo = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Информация о заявке
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="application_number"
            control={control}
            rules={{ 
              required: 'Номер заявки обязателен',
              pattern: {
                value: /^\d+$/,
                message: 'Номер заявки должен содержать только цифры'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Номер заявки *"
                fullWidth
                error={!!errors.application_number}
                helperText={errors.application_number?.message || 'Только цифры'}
                placeholder="24505241"
                type="tel"
                inputProps={{ 
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  field.onChange(value);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="submission_date"
            control={control}
            rules={{ required: 'Дата подачи обязательна' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Дата подачи *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.submission_date}
                helperText={errors.submission_date?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="maturity_group"
            control={control}
            rules={{ required: 'Группа спелости обязательна' }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.maturity_group}>
                <InputLabel>Группа спелости *</InputLabel>
                <Select
                  {...field}
                  label="Группа спелости *"
                >
                  <MenuItem value="D01">D01</MenuItem>
                  <MenuItem value="D02">D02</MenuItem>
                  <MenuItem value="D03">D03</MenuItem>
                  <MenuItem value="D04">D04</MenuItem>
                  <MenuItem value="D05">D05</MenuItem>
                  <MenuItem value="D06">D06</MenuItem>
                  <MenuItem value="D07">D07</MenuItem>
                  <MenuItem value="D08">D08</MenuItem>
                  <MenuItem value="D09">D09</MenuItem>
                  <MenuItem value="D10">D10</MenuItem>
                </Select>
                {errors.maturity_group && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.maturity_group.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="applicant"
            control={control}
            rules={{ required: 'Заявитель обязателен' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Заявитель (организация) *"
                fullWidth
                error={!!errors.applicant}
                helperText={errors.applicant?.message}
                placeholder="ТОО Агрофирма"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="applicant_inn_bin"
            control={control}
            rules={{ 
              required: 'ИНН/БИН обязателен',
              pattern: {
                value: /^\d{12}$/,
                message: 'ИНН/БИН должен содержать ровно 12 цифр'
              },
              minLength: {
                value: 12,
                message: 'ИНН/БИН должен содержать ровно 12 цифр'
              },
              maxLength: {
                value: 12,
                message: 'ИНН/БИН должен содержать ровно 12 цифр'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="ИНН/БИН *"
                fullWidth
                error={!!errors.applicant_inn_bin}
                helperText={errors.applicant_inn_bin?.message || 'Ровно 12 цифр'}
                placeholder="123456789012"
                type="tel"
                inputProps={{ 
                  maxLength: 12,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  field.onChange(value);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="contact_person_name"
            control={control}
            rules={{ required: 'ФИО контактного лица обязательно' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="ФИО контактного лица *"
                fullWidth
                error={!!errors.contact_person_name}
                helperText={errors.contact_person_name?.message}
                placeholder="Иванов Иван Иванович"
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="contact_person_phone"
            control={control}
            rules={{ 
              required: 'Телефон обязателен',
              pattern: {
                value: /^[\d\s\+\-\(\)]+$/,
                message: 'Некорректный формат телефона'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Телефон *"
                fullWidth
                error={!!errors.contact_person_phone}
                helperText={errors.contact_person_phone?.message || '+7 (701) 234-56-78'}
                placeholder="+7 (701) 234-56-78"
                type="tel"
                inputProps={{
                  inputMode: 'tel'
                }}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d\+]/g, '');
                  
                  // Форматирование для казахстанского номера
                  if (value.startsWith('+7')) {
                    value = value.slice(0, 12); // +7 + 10 цифр
                    if (value.length > 2) {
                      value = `+7 (${value.slice(2, 5)}${value.length > 5 ? `) ${value.slice(5, 8)}` : ''}${value.length > 8 ? `-${value.slice(8, 10)}` : ''}${value.length > 10 ? `-${value.slice(10, 12)}` : ''}`;
                    }
                  } else if (value.startsWith('8') || value.startsWith('7')) {
                    value = '+7' + value.slice(1);
                  } else if (value && !value.startsWith('+')) {
                    value = '+7' + value;
                  }
                  
                  field.onChange(value);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="contact_person_email"
            control={control}
            rules={{ 
              required: 'Email обязателен',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Введите корректный email'
              }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email *"
                fullWidth
                error={!!errors.contact_person_email}
                helperText={errors.contact_person_email?.message || 'Пример: ivanov@example.com'}
                placeholder="ivanov@example.com"
                type="email"
                inputProps={{
                  inputMode: 'email',
                  autoCapitalize: 'none',
                  autoCorrect: 'off'
                }}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().trim();
                  field.onChange(value);
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
              <Controller
                name="purpose"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Дополнительные комментарии"
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Дополнительная информация о заявке..."
                  />
                )}
              />
        </Grid>

      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleBack}>Назад</Button>
        <Box>
          <Button onClick={() => navigate('/applications')} sx={{ mr: 1 }}>
            Отмена
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={activeStep === 2 && !hasAllRequiredDocs}
          >
            Далее
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // Step 3: Document Upload
  const renderDocumentUpload = () => (
    <Box>
      <DocumentUpload
        onFilesChange={setUploadedFiles}
        onValidationChange={setHasAllRequiredDocs}
        initialFiles={uploadedFiles}
      />
      
      {/* Navigation buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleBack}>Назад</Button>
        <Box>
          <Button onClick={() => navigate('/applications')} sx={{ mr: 1 }}>
            Отмена
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!hasAllRequiredDocs}
          >
            Далее
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // Step 4: Oblasts Selection
  const renderOblastsSelection = () => {
    const allOblasts = Array.isArray(oblasts) ? oblasts : [];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Выбор целевых областей
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
          Выберите области, в которых планируется проведение сортоиспытаний
        </Typography>

        {loadingOblasts ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : !allOblasts || allOblasts.length === 0 ? (
          <Alert severity="warning">
            Не удалось загрузить список областей. Проверьте подключение к серверу.
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                onClick={() => setValue('target_oblasts', allOblasts?.map((o) => o.id) || [])}
              >
                Выбрать все
              </Button>
              <Button size="small" onClick={() => setValue('target_oblasts', [])} sx={{ ml: 1 }}>
                Снять все
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Выбрано: {selectedOblasts?.length || 0} из {allOblasts?.length || 0}
              </Typography>
            </Box>

            <FormControl component="fieldset" fullWidth>
              <FormGroup>
                <Grid container spacing={2}>
                  {allOblasts?.map((oblast) => (
                    <Grid item xs={12} sm={6} md={4} key={oblast.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          bgcolor: selectedOblasts?.includes(oblast.id)
                            ? 'primary.light'
                            : 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleOblastToggle(oblast.id)}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedOblasts?.includes(oblast.id) || false}
                                readOnly
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {oblast.name}
                                </Typography>
                                {oblast.code && (
                                  <Typography variant="caption" color="text.secondary">
                                    Код: {oblast.code}
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{ m: 0, pointerEvents: 'none' }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </FormControl>

            {selectedOblasts?.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Выберите хотя бы одну область для проведения испытаний
              </Alert>
            )}
          </>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack}>Назад</Button>
          <Box>
            <Button onClick={() => navigate('/applications')} sx={{ mr: 1 }}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              disabled={isPending || (selectedOblasts?.length === 0 && allOblasts && allOblasts.length > 0)}
            >
              {isPending ? 'Создание...' : 'Создать заявку'}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Создать заявку на испытание
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Заполните форму для подачи заявки на сортоиспытание
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {activeStep === 0 && renderSortSelection()}
          {activeStep === 1 && renderApplicationInfo()}
          {activeStep === 2 && renderDocumentUpload()}
          {activeStep === 3 && renderOblastsSelection()}
        </Box>
      </Paper>

      {/* Create Sort Dialog */}
      <CreateSortDialog
        open={createSortDialogOpen}
        onClose={() => setCreateSortDialogOpen(false)}
        culture={selectedCulture}
        onSuccess={handleSortCreated}
      />
    </Box>
  );
};
