import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Warning as WarningIcon,
  Science as ScienceIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useGetIndicatorsByCulture, 
  useAddIndicators, 
  useRemoveIndicators,
} from '@/hooks/useTrials';
import type { 
  Indicator,
  Form008Data,
} from '@/types/api.types';

interface Form008IndicatorsManagementDialogProps {
  open: boolean;
  onClose: () => void;
  trialId: number;
  form008Data?: Form008Data;
}

export const Form008IndicatorsManagementDialog: React.FC<Form008IndicatorsManagementDialogProps> = ({
  open,
  onClose,
  trialId,
  form008Data,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  
  // Получаем культуру из данных формы 008
  const cultureId = (form008Data?.trial as any)?.culture_id;
  
  const { data: indicatorsData, isLoading: isLoadingIndicators, isError: isErrorIndicators, error: errorIndicators } = useGetIndicatorsByCulture(
    cultureId || 0,
    { enabled: !!cultureId && open }
  );
  
  
  const { mutate: addIndicators, isPending: isAdding } = useAddIndicators();
  const { mutate: removeIndicators, isPending: isRemoving } = useRemoveIndicators();

  // Получаем текущие показатели из формы 008
  const currentIndicators = form008Data?.indicators || [];

  // Функция для определения авторасчитываемых показателей (как в TrialDataEntry)
  const indicatorIsAutoCalculated = (indicator: Indicator) => {
    // Показатели отклонения рассчитываются автоматически на основе урожайности
    return indicator.code === 'deviation_standard' || 
           indicator.code === 'deviation_abs' ||
           indicator.code === 'deviation_pct' ||
           indicator.name.includes('Отклонение от стандарта') ||
           indicator.is_auto_calculated === true; // Используем и серверное поле, если есть
  };

  // Мемоизируем currentIndicatorIds чтобы избежать бесконечных ререндеров
  const currentIndicatorIds = useMemo(() =>
    currentIndicators.map(ind => ind.id),
    [currentIndicators]
  );

  // Отладочная информация
  useEffect(() => {
    if (open) {
      
      // Анализ текущих показателей из Form008Data
      if (form008Data?.indicators) {
          count: form008Data.indicators.length,
          indicators: form008Data.indicators.map(ind => ({
            id: ind.id,
            name: ind.name,
            code: ind.code,
            is_auto_calculated: ind.is_auto_calculated,
            category: ind.category,
            is_quality: ind.is_quality
          }))
        });
        
        const autoCalcInForm008 = form008Data.indicators.filter(ind => ind.is_auto_calculated);
        if (autoCalcInForm008.length > 0) {
        }
        
        // Анализ валидации для каждого показателя
        if (form008Data.min_max) {
          
          form008Data.indicators.forEach(indicator => {
            const validation = form008Data.min_max?.[indicator.code];
          });
        } else {
        }
      }
    }
  }, [open, form008Data, cultureId]);

  // Отладочная информация для indicatorsData
  useEffect(() => {
    if (indicatorsData) {
      
      // Анализ авторасчитываемых показателей
      const allIndicators = [
        ...((indicatorsData as any).required_indicators || []),
        ...(indicatorsData.recommended_indicators || [])
      ];
      
      const autoCalculated = allIndicators.filter(ind => ind.is_auto_calculated);
        total: autoCalculated.length,
        list: autoCalculated.map(ind => ({ 
          id: ind.id, 
          name: ind.name, 
          code: ind.code,
          is_auto_calculated: ind.is_auto_calculated 
        }))
      });
      
      // Дополнительная проверка структуры показателей
      if (allIndicators.length > 0) {
        const sampleIndicator = allIndicators[0];
          id: sampleIndicator.id,
          name: sampleIndicator.name,
          code: sampleIndicator.code,
          is_auto_calculated: sampleIndicator.is_auto_calculated,
          allFields: Object.keys(sampleIndicator),
          fullObject: sampleIndicator
        });
        
        // Проверяем поля валидации
        const validationFields = ['validation', 'rules', 'constraints', 'min', 'max', 'required', 'type'];
        const foundValidationFields = validationFields.filter(field => field in sampleIndicator);
        
        if (foundValidationFields.length === 0) {
        }
      }
      
      // Анализ валидации для определения авторасчитываемых показателей
      if (form008Data?.warnings) {
          warningsCount: form008Data.warnings.length,
          warnings: form008Data.warnings.map(w => ({
            level: w.level,
            message: w.message
          }))
        });
        
        // Поиск авторасчитываемых показателей в валидации
        const autoCalcWarnings = form008Data.warnings.filter(w => 
          w.message.toLowerCase().includes('авторасчет') || 
          w.message.toLowerCase().includes('автоматически') ||
          w.message.toLowerCase().includes('calculated')
        );
        
        if (autoCalcWarnings.length > 0) {
        }
      }
    }
  }, [indicatorsData]);

  // Функция для добавления одного показателя
  const handleAddSingleIndicator = (indicatorId: number) => {
    addIndicators(
      {
        trialId,
        payload: {
          indicator_ids: [indicatorId],
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar('Показатель добавлен', { variant: 'success' });
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка при добавлении показателя: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  // Функция для удаления одного показателя
  const handleRemoveSingleIndicator = (indicatorId: number) => {
    removeIndicators(
      {
        trialId,
        payload: {
          indicator_ids: [indicatorId],
        },
      },
      {
        onSuccess: () => {
          enqueueSnackbar('Показатель удален', { variant: 'success' });
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка при удалении показателя: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  // Функция для отображения справочной информации о показателях (только чтение)
  const renderReferenceIndicatorList = (
    title: string,
    indicators: Indicator[],
    isMandatory: boolean = false
  ) => {
    // Фильтруем авторасчитываемые показатели
    const autoCalculatedIndicators = indicators.filter(indicator => indicatorIsAutoCalculated(indicator));
    const filteredIndicators = indicators.filter(indicator => !indicatorIsAutoCalculated(indicator));
    
      total: indicators.length,
      autoCalculated: autoCalculatedIndicators.length,
      filtered: filteredIndicators.length,
      autoCalculatedList: autoCalculatedIndicators.map(ind => ({ id: ind.id, name: ind.name, code: ind.code }))
    });
    
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="h6">{title}</Typography>
            {isMandatory && (
              <Chip label="Обязательные" color="error" size="small" />
            )}
            <Chip label="Справочник" color="info" size="small" />
          </Box>
          
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredIndicators.map((indicator) => (
              <ListItem key={indicator.id} divider>
                <ListItemText
                  primary={indicator.name}
                  secondary={
                    <Box component="span">
                      <Typography variant="caption" color="text.secondary" component="span">
                        {indicator.unit} • {indicator.code}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  // Функция для отображения текущих показателей с возможностью удаления
  const renderCurrentIndicatorsList = () => {
    // Фильтруем авторасчитываемые показатели
    const autoCalculatedCurrent = currentIndicators.filter(indicator => indicatorIsAutoCalculated(indicator));
    const filteredCurrentIndicators = currentIndicators.filter(indicator => !indicatorIsAutoCalculated(indicator));
    
      total: currentIndicators.length,
      autoCalculated: autoCalculatedCurrent.length,
      filtered: filteredCurrentIndicators.length,
      autoCalculatedList: autoCalculatedCurrent.map(ind => ({ id: ind.id, name: ind.name, code: ind.code }))
    });
    
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="h6">Текущие показатели</Typography>
            <Chip label="Управление" color="primary" size="small" />
          </Box>
          
          <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredCurrentIndicators.map((indicator) => {
              const isMandatory = ((indicatorsData as any)?.required_indicators || []).some((mandatory: any) => mandatory.id === indicator.id);
              
              return (
                <ListItem key={indicator.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {indicator.name}
                        {isMandatory && (
                          <Chip label="Обязательный" color="error" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="caption" color="text.secondary" component="span">
                          {indicator.unit} • {indicator.code}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!isMandatory ? (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<RemoveIcon />}
                        onClick={() => handleRemoveSingleIndicator(indicator.id)}
                        disabled={isRemoving}
                      >
                        Удалить
                      </Button>
                    ) : (
                      <Chip 
                        label="Нельзя удалить" 
                        color="default" 
                        size="small" 
                      />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Card>
    );
  };

  // Функция для отображения доступных для добавления показателей
  const renderAvailableIndicatorsList = () => {
    const allRecommended = indicatorsData?.recommended_indicators || [];
    const autoCalculatedRecommended = allRecommended.filter(ind => ind.is_auto_calculated);
    const availableRecommended = allRecommended
      .filter(ind => !currentIndicatorIds.includes(ind.id) && !ind.is_auto_calculated);
    
      total: allRecommended.length,
      autoCalculated: autoCalculatedRecommended.length,
      alreadyAdded: allRecommended.filter(ind => currentIndicatorIds.includes(ind.id)).length,
      available: availableRecommended.length,
      autoCalculatedList: autoCalculatedRecommended.map(ind => ({ id: ind.id, name: ind.name, code: ind.code }))
    });

    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="h6">Доступные показатели</Typography>
            <Chip label="Добавление" color="success" size="small" />
          </Box>
          
          <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
            {/* Рекомендуемые для добавления */}
            {availableRecommended.length > 0 && (
              <>
                <ListItem>
                  <ListItemText>
                    <Typography variant="subtitle2" color="primary">
                      Рекомендуемые для добавления
                    </Typography>
                  </ListItemText>
                </ListItem>
                {availableRecommended.map((indicator) => (
                  <ListItem key={indicator.id} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {indicator.name}
                          <Chip label="Рекомендуемый" color="warning" size="small" />
                        </Box>
                      }
                      secondary={
                        <Box component="span">
                          <Typography variant="caption" color="text.secondary" component="span">
                            {indicator.unit} • {indicator.code}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddSingleIndicator(indicator.id)}
                        disabled={isAdding}
                      >
                        Добавить
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </>
            )}

            {availableRecommended.length === 0 && (
              <ListItem>
                <ListItemText>
                  <Typography variant="body2" color="text.secondary">
                    Все доступные показатели уже добавлены
                  </Typography>
                </ListItemText>
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    );
  };


  const renderWarningsSection = () => {
    const warnings = form008Data?.warnings || [];
    
    if (warnings.length === 0) {
      return null;
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom color="error">
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Предупреждения системы
        </Typography>
        {warnings.map((warning, index) => (
          <Alert 
            key={index} 
            severity={warning.level === 'error' ? 'error' : warning.level === 'warning' ? 'warning' : 'info'}
            sx={{ mb: 1 }}
          >
            {warning.message}
          </Alert>
        ))}
      </Box>
    );
  };

  const renderTrialInfoSection = () => {
    const trial = form008Data?.trial;
    if (!trial) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Информация об испытании
        </Typography>
        <Grid container spacing={2}>
          {trial.maturity_group_code && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Код группы спелости
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {trial.maturity_group_code}
                  </Typography>
                  {trial.maturity_group_name && (
                    <Typography variant="caption" color="text.secondary">
                      {trial.maturity_group_name}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
          {trial.trial_code && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Код испытания
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {trial.trial_code}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {trial.culture_code && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Код культуры
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {trial.culture_code}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {trial.predecessor_code && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Код предшественника
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {trial.predecessor_code}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  if (!cultureId) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Управление показателями (Форма 008)</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            <Typography variant="body2">
              Не удалось определить культуру для загрузки показателей
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ScienceIcon color="primary" />
          <Typography variant="h6">Управление показателями (Форма 008)</Typography>
          {indicatorsData && (
            <Chip 
              label={indicatorsData.culture_name} 
              color="primary" 
              size="small" 
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ maxHeight: '80vh', overflow: 'auto' }}>
        {isLoadingIndicators ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : isErrorIndicators ? (
          <Alert severity="error">
            <Typography variant="body2">
              Ошибка загрузки показателей: {errorIndicators?.message || 'Неизвестная ошибка'}
              <br />
              cultureId: {cultureId}
            </Typography>
          </Alert>
        ) : indicatorsData ? (
          <Box>
            {/* Предупреждения системы */}
            {renderWarningsSection()}
            
            {form008Data?.warnings && form008Data.warnings.length > 0 && <Divider sx={{ my: 3 }} />}

            {/* Информация об испытании */}
            {renderTrialInfoSection()}
            <Divider sx={{ my: 3 }} />


            {/* Справочная информация о показателях */}
            <Typography variant="h6" gutterBottom>
              Справочная информация о показателях
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Обязательные показатели</strong> - показатели, которые должны быть в каждом испытании данной культуры.
                <br />
                <strong>Рекомендуемые показатели</strong> - показатели, рекомендуемые для данной культуры.
                <br />
                <strong>Отладка:</strong> cultureId: {cultureId}, обязательных: {(indicatorsData as any)?.required_indicators?.length || 0}, 
                рекомендуемых: {indicatorsData?.recommended_indicators?.length || 0}
              </Typography>
            </Alert>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Обязательные показатели - справочник */}
              <Grid item xs={12} md={6}>
                {renderReferenceIndicatorList(
                  'Обязательные',
                  (indicatorsData as any)?.required_indicators || [],
                  true
                )}
              </Grid>

              {/* Рекомендуемые показатели - справочник */}
              <Grid item xs={12} md={6}>
                {renderReferenceIndicatorList(
                  'Рекомендуемые',
                  indicatorsData.recommended_indicators || []
                )}
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Управление показателями */}
            <Typography variant="h6" gutterBottom>
              Управление показателями
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Здесь вы можете добавлять и удалять показатели по одному. Обязательные показатели нельзя удалить.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              {/* Текущие показатели */}
              <Grid item xs={12} md={6}>
                {renderCurrentIndicatorsList()}
              </Grid>

              {/* Доступные для добавления */}
              <Grid item xs={12} md={6}>
                {renderAvailableIndicatorsList()}
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Alert severity="error">
            <Typography variant="body2">
              Не удалось загрузить показатели для культуры
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isAdding || isRemoving}>
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};
