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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
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

  const { data: cultureGroups = [], isLoading: groupsLoading } = useCultureGroups();
  
  // Build query params for backend filtering
  const queryParams = useMemo(() => {
    const params: any = {};
    if (selectedGroup !== '') params.culture_group = selectedGroup;
    if (filterCategory !== '') params.category = filterCategory;
    if (filterQuality === 'quality') params.is_quality = true;
    if (filterQuality === 'basic') params.is_quality = false;
    if (filterQuality === 'universal') params.is_universal = true;
    if (searchTerm !== '') params.search = searchTerm;
    return params;
  }, [selectedGroup, filterCategory, filterQuality, searchTerm]);

  const { data: indicators = [], isLoading: indicatorsLoading, error } = useIndicators(queryParams);

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
          onClick={() => navigate('/dictionaries')}
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
                </TableRow>
              </TableHead>
              <TableBody>
                {indicators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Container>
  );
};

