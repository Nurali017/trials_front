import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCultureGroups, useIndicators } from '@/hooks/useDictionaries';
import { useQuery } from '@tanstack/react-query';
import { dictionariesService } from '@/api';
import type { Indicator } from '@/types/api.types';

export const IndicatorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterQuality, setFilterQuality] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCalculation, setFilterCalculation] = useState<string>('');
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data: cultureGroups = [], isLoading: groupsLoading } = useCultureGroups();
  
  // Build query params for backend filtering
  const queryParams = useMemo(() => {
    const params: any = {};
    if (selectedGroup !== '') params.culture_group = selectedGroup;
    if (filterCategory !== '') params.category = filterCategory;
    if (filterQuality === 'quality') params.is_quality = true;
    if (filterQuality === 'basic') params.is_quality = false;
    if (filterQuality === 'universal') params.is_universal = true;
    if (filterStatus === 'required') params.is_required = true;
    if (filterStatus === 'recommended') params.is_recommended = true;
    // Фильтрация по расчету делается на клиенте, так как бэкенд может не поддерживать is_auto_calculated
    if (searchTerm !== '') params.search = searchTerm;
    return params;
  }, [selectedGroup, filterCategory, filterQuality, filterStatus, filterCalculation, searchTerm]);

  const { data: allIndicators = [], isLoading: indicatorsLoading, error } = useIndicators(queryParams);

  // Клиентская фильтрация для автоматических и ручных показателей
  const indicators = useMemo(() => {
    if (filterCalculation === 'auto') {
      // Фильтруем по кодам авторасчетов
      return allIndicators.filter(indicator => 
        indicator.is_auto_calculated || 
        indicator.code === 'deviation_standard' || 
        indicator.code === 'deviation_abs' ||
        indicator.code === 'deviation_pct' ||
        indicator.name.includes('Отклонение от стандарта')
      );
    }
    if (filterCalculation === 'manual') {
      return allIndicators.filter(indicator => 
        !indicator.is_auto_calculated && 
        indicator.code !== 'deviation_standard' && 
        indicator.code !== 'deviation_abs' &&
        indicator.code !== 'deviation_pct' &&
        !indicator.name.includes('Отклонение от стандарта')
      );
    }
    return allIndicators;
  }, [allIndicators, filterCalculation]);

  // Load all cultures for display purposes only
  const { data: allCultures = [], isLoading: culturesLoading } = useQuery({
    queryKey: ['cultures', 'all'],
    queryFn: () => dictionariesService.cultures.getAll(),
    staleTime: 1000 * 60 * 60,
  });

  const isLoading = groupsLoading || indicatorsLoading || culturesLoading;

  // Get culture names for an indicator
  const getCultureNames = (indicator: Indicator): string => {
    if (indicator.cultures_data && indicator.cultures_data.length > 0) {
      return indicator.cultures_data.map((c) => c.name).join(', ');
    }
    if (!indicator.cultures || indicator.cultures.length === 0) {
      return '—';
    }
    const names = indicator.cultures
      .map((cultureId) => {
        const culture = allCultures.find((c) => c.id === cultureId);
        return culture ? culture.name : `ID: ${cultureId}`;
      })
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : '—';
  };

  // Get category display text
  const getCategoryDisplay = (category: string): { text: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' } => {
    switch (category) {
      case 'common':
        return { text: 'Общие', color: 'primary' };
      case 'quality':
        return { text: 'Качественные', color: 'success' };
      case 'specific':
        return { text: 'Специфические', color: 'info' };
      default:
        return { text: category, color: 'default' };
    }
  };

  // Validate indicator value (if validation rules exist)
  const validateIndicatorValue = (indicator: any, value: number) => {
    const rules = indicator.validation_rules;
    if (!rules) return null;
    
    if (rules.min_value && value < rules.min_value) {
      return `Минимальное значение: ${rules.min_value}`;
    }
    if (rules.max_value && value > rules.max_value) {
      return `Максимальное значение: ${rules.max_value}`;
    }
    return null;
  };

  // Get auto-calculation type
  const getAutoCalculationType = (indicator: any) => {
    if (indicator.is_auto_calculated) {
      if (indicator.code === 'deviation_standard' || indicator.name.includes('Отклонение от стандарта')) {
        return { type: 'deviation', label: 'Отклонение', color: 'info' as const };
      }
      if (indicator.code === 'deviation_abs' || indicator.name.includes('абсолютное')) {
        return { type: 'deviation_abs', label: 'Отклонение (абс.)', color: 'info' as const };
      }
      if (indicator.code === 'deviation_pct' || indicator.name.includes('%')) {
        return { type: 'deviation_pct', label: 'Отклонение (%)', color: 'info' as const };
      }
      return { type: 'other', label: 'Авто', color: 'default' as const };
    }
    return null;
  };

  // Handle details modal
  const handleShowDetails = (indicator: Indicator) => {
    setSelectedIndicator(indicator);
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedIndicator(null);
  };


  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Ошибка загрузки данных: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('http://localhost:3000/dictionaries/indicators')}
          variant="outlined"
        >
          Назад
        </Button>
        <Box>
          <Typography variant="h4">Показатели</Typography>
          <Typography variant="body2" color="text.secondary">
            Найдено записей: {indicators.length}
          </Typography>
        </Box>
      </Box>

      {/* Information Section */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Информация о показателях</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                📊 Категории показателей:
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2">• <strong>Общие</strong> - урожайность, устойчивость</Typography>
                <Typography variant="body2">• <strong>Качественные</strong> - белок, крахмал, витамины (лабораторные)</Typography>
                <Typography variant="body2">• <strong>Специфические</strong> - для конкретных культур</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🏷️ Статусы показателей:
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2">• <strong>Обязательный</strong> - по методике</Typography>
                <Typography variant="body2">• <strong>Рекомендуемый</strong> - дополнительный</Typography>
                <Typography variant="body2">• <strong>Авто</strong> - рассчитывается автоматически</Typography>
                <Typography variant="body2">• <strong>Текст</strong> - нечисловой показатель</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🔗 Группы культур:
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2">
                  Показатели привязаны к группам культур (GRAIN, LEGUMES, OILSEEDS, FORAGE, VEGETABLES, melons, FRUITS, BERRY). 
                  Универсальные показатели применяются ко всем культурам.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🧮 Авторасчеты:
              </Typography>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2">• <strong>deviation_standard</strong> - Отклонение от стандарта</Typography>
                <Typography variant="body2">• <strong>deviation_abs</strong> - Отклонение от стандарта (абсолютное)</Typography>
                <Typography variant="body2">• <strong>deviation_pct</strong> - Отклонение от стандарта (%)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Рассчитываются автоматически на основе урожайности
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Группа культур</InputLabel>
            <Select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as number | '')}
              label="Группа культур"
              disabled={groupsLoading}
            >
              <MenuItem value="">
                <em>Все группы</em>
              </MenuItem>
              {cultureGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Категория</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Категория"
            >
              <MenuItem value="">
                <em>Все категории</em>
              </MenuItem>
              <MenuItem value="common">Общие</MenuItem>
              <MenuItem value="quality">Качественные</MenuItem>
              <MenuItem value="specific">Специфические</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Тип</InputLabel>
            <Select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              label="Тип"
            >
              <MenuItem value="">
                <em>Все типы</em>
              </MenuItem>
              <MenuItem value="basic">Основные</MenuItem>
              <MenuItem value="quality">Лабораторные</MenuItem>
              <MenuItem value="universal">Универсальные</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Статус"
            >
              <MenuItem value="">
                <em>Все статусы</em>
              </MenuItem>
              <MenuItem value="required">Обязательные</MenuItem>
              <MenuItem value="recommended">Рекомендуемые</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Расчет</InputLabel>
            <Select
              value={filterCalculation}
              onChange={(e) => setFilterCalculation(e.target.value)}
              label="Расчет"
            >
              <MenuItem value="">
                <em>Все</em>
              </MenuItem>
              <MenuItem value="auto">Автоматические</MenuItem>
              <MenuItem value="manual">Ручные</MenuItem>
            </Select>
          </FormControl>

          <TextField
            placeholder="Поиск по названию или коду..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Код</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Единицы</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell align="center">Тип</TableCell>
                  <TableCell>Культуры</TableCell>
                  <TableCell align="center">Порядок</TableCell>
                  <TableCell align="center">Статус</TableCell>
                  <TableCell align="center">Авторасчет</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {indicators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="text.secondary">
                        Нет данных
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  indicators
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((indicator) => {
                      const categoryInfo = getCategoryDisplay(indicator.category);
                      return (
                        <TableRow key={indicator.id} hover>
                          <TableCell>
                            <Chip
                              label={indicator.code}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" fontWeight={500}>
                              {indicator.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {indicator.unit || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={categoryInfo.text}
                              size="small"
                              color={categoryInfo.color}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {indicator.is_quality && (
                                <Tooltip title="Лабораторный показатель">
                                  <Chip
                                    icon={<ScienceIcon />}
                                    label="Лаб"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                              {indicator.is_universal && (
                                <Tooltip title="Универсальный показатель">
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Универ"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                              {!indicator.is_quality && !indicator.is_universal && (
                                <Typography variant="body2" color="text.secondary">
                                  Основной
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={getCultureNames(indicator)}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 250,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {indicator.is_universal
                                  ? 'Все культуры'
                                  : getCultureNames(indicator)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.secondary">
                              {indicator.sort_order}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {indicator.is_required && (
                                <Tooltip title="Обязательный показатель">
                                  <Chip
                                    icon={<WarningIcon />}
                                    label="Обязательный"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                              {indicator.is_recommended && (
                                <Tooltip title="Рекомендуемый показатель">
                                  <Chip
                                    icon={<InfoIcon />}
                                    label="Рекомендуемый"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                              {indicator.is_numeric === false && (
                                <Tooltip title="Текстовый показатель">
                                  <Chip
                                    label="Текст"
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {(() => {
                              const autoCalcType = getAutoCalculationType(indicator);
                              if (autoCalcType) {
                                return (
                                  <Tooltip title={`Автоматически рассчитывается: ${autoCalcType.label}`}>
                                    <Chip
                                      label={autoCalcType.label}
                                      size="small"
                                      color={autoCalcType.color}
                                      variant="filled"
                                    />
                                  </Tooltip>
                                );
                              }
                              return (
                                <Typography variant="body2" color="text.secondary">
                                  Ручной
                                </Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleShowDetails(indicator)}
                            >
                              Детали
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Details Modal */}
      <Dialog 
        open={detailsModalOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6">
              Детальная информация о показателе
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIndicator && (
            <Box>
              {/* Основная информация */}
              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Основная информация
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Код показателя
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedIndicator.code}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Название
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedIndicator.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Единица измерения
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedIndicator.unit || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Порядок сортировки
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedIndicator.sort_order}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              {/* Категория и тип */}
              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Классификация
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Категория
                    </Typography>
                    <Chip
                      label={getCategoryDisplay(selectedIndicator.category).text}
                      color={getCategoryDisplay(selectedIndicator.category).color}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Тип расчета
                    </Typography>
                    {(() => {
                      const autoCalcType = getAutoCalculationType(selectedIndicator);
                      if (autoCalcType) {
                        return (
                          <Chip
                            label={autoCalcType.label}
                            color={autoCalcType.color}
                            size="small"
                          />
                        );
                      }
                      return (
                        <Chip
                          label="Ручной"
                          color="default"
                          size="small"
                        />
                      );
                    })()}
                  </Grid>
                </Grid>
              </Card>

              {/* Статусы */}
              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Статусы и свойства
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedIndicator.is_quality && (
                    <Chip
                      icon={<ScienceIcon />}
                      label="Лабораторный"
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {selectedIndicator.is_universal && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Универсальный"
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {selectedIndicator.is_required && (
                    <Chip
                      icon={<WarningIcon />}
                      label="Обязательный"
                      color="error"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {selectedIndicator.is_recommended && (
                    <Chip
                      icon={<InfoIcon />}
                      label="Рекомендуемый"
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {selectedIndicator.is_numeric === false && (
                    <Chip
                      label="Текстовый"
                      color="default"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Card>

              {/* Культуры */}
              <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Применимость к культурам
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedIndicator.is_universal 
                    ? 'Применяется ко всем культурам'
                    : getCultureNames(selectedIndicator)
                  }
                </Typography>
              </Card>

              {/* Дополнительная информация */}
              {(selectedIndicator.description || selectedIndicator.validation_rules) && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Дополнительная информация
                  </Typography>
                  {selectedIndicator.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Описание
                      </Typography>
                      <Typography variant="body1">
                        {selectedIndicator.description}
                      </Typography>
                    </Box>
                  )}
                  {selectedIndicator.validation_rules && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Правила валидации
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {JSON.stringify(selectedIndicator.validation_rules, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} variant="outlined">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

