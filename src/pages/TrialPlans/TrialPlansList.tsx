import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTrialPlans, useDeleteTrialPlan, useCopyTrialPlan, useExportTrialPlan } from '../../hooks/useTrialPlans';
import { useDictionaries } from '../../hooks/useDictionaries';
import { CreateTrialPlanDialog } from '../../components/trialPlans/CreateTrialPlanDialog';
import type { TrialPlan, TrialPlanStatus } from '../../types/api.types';

const TrialPlansList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    year: '' as string,
    oblast: '' as string,
    status: '' as string,
  });
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<TrialPlan | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Queries
  const { data: trialPlansResponse, isLoading, error, refetch } = useTrialPlans(filters);
  
  // Extract trial plans array from response
  const trialPlans = trialPlansResponse?.results || trialPlansResponse || [];
  
  // Debug: log the response structure
  React.useEffect(() => {
    if (trialPlansResponse) {
    }
  }, [trialPlansResponse, trialPlans]);
  const dictionaries = useDictionaries();
  const deleteTrialPlan = useDeleteTrialPlan();
  const copyTrialPlan = useCopyTrialPlan();
  const exportTrialPlan = useExportTrialPlan();
  

  // Status colors
  const getStatusColor = (status: TrialPlanStatus) => {
    switch (status) {
      case 'planned': return 'default';
      case 'structured': return 'info';
      case 'distributed': return 'warning';
      case 'finalized': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: TrialPlanStatus) => {
    switch (status) {
      case 'planned': return 'Запланирован';
      case 'structured': return 'Структурирован';
      case 'distributed': return 'Распределен';
      case 'finalized': return 'Завершен';
      default: return status;
    }
  };

  // Filtered data
  const filteredPlans = useMemo(() => {
    if (!trialPlans || !Array.isArray(trialPlans)) return [];

    return trialPlans.filter((plan: TrialPlan) => {
      // Year
      if (filters.year && (plan.year?.toString() || '') !== filters.year) return false;
      // Oblast (guard if oblast missing)
      if (filters.oblast && (!plan.oblast || plan.oblast.id?.toString() !== filters.oblast)) return false;
      // Status
      if (filters.status && plan.status !== filters.status) return false;
      // Search across year, oblast name and status (guard oblast.name)
      if (search.trim()) {
        const oblastName = plan.oblast?.name || '';
        const haystack = `${plan.year || ''} ${oblastName} ${plan.status || ''}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [trialPlans, filters]);

  // Statistics для новой структуры
  const statistics = useMemo(() => {
    if (!filteredPlans || filteredPlans.length === 0) return null;

    const totalCultures = filteredPlans.reduce((sum: number, plan: TrialPlan) => {
      const cultures = (plan as any).cultures || [];
      return sum + (cultures.length || 0);
    }, 0);

    const totalParticipants = filteredPlans.reduce((sum: number, plan: TrialPlan) => {
      const cultures = (plan as any).cultures || [];
      return sum + cultures.reduce((cultureSum: number, culture: any) => {
        const trialTypes = culture?.trial_types || [];
        return cultureSum + trialTypes.reduce((typeSum: number, type: any) => {
          return typeSum + (type?.participants?.length || 0);
        }, 0);
      }, 0);
    }, 0);

    const totalTrials = filteredPlans.reduce((sum: number, plan: TrialPlan) => {
      const cultures = (plan as any).cultures || [];
      return sum + cultures.reduce((cultureSum: number, culture: any) => {
        const trialTypes = culture?.trial_types || [];
        return cultureSum + trialTypes.reduce((typeSum: number, type: any) => {
          return typeSum + (type?.participants?.reduce((participantSum: number, participant: any) => {
            return participantSum + (participant?.trials?.length || 0);
          }, 0) || 0);
        }, 0);
      }, 0);
    }, 0);

    return {
      totalPlans: filteredPlans.length,
      totalCultures,
      totalParticipants,
      totalTrials,
    };
  }, [filteredPlans]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, plan: TrialPlan) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlan(null);
  };

  const handleView = () => {
    if (selectedPlan) {
      navigate(`/trial-plans/${selectedPlan.id}`);
    }
    handleMenuClose();
  };

  // Edit plan disabled

  const handleDelete = () => {
    if (selectedPlan) {
      if (window.confirm(`Вы уверены, что хотите удалить план для ${selectedPlan.oblast.name} (${selectedPlan.year})?`)) {
        deleteTrialPlan.mutate(selectedPlan.id);
      }
    }
    handleMenuClose();
  };

  // Copy and Export actions disabled
  const handleCopy = () => {
    if (selectedPlan) {
      const targetYear = Number(prompt('Укажите год для копии', String(selectedPlan.year + 1)));
      if (!Number.isNaN(targetYear)) {
        copyTrialPlan.mutate({ id: selectedPlan.id, targetYear });
      }
    }
    handleMenuClose();
  };

  const handleExport = async () => {
    if (selectedPlan) {
      try {
        const blob = await exportTrialPlan.mutateAsync(selectedPlan.id);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `trial_plan_${selectedPlan.id}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } catch (e) {
        console.error('Export failed', e);
      }
    }
    handleMenuClose();
  };

  if (error) {
    return (
      <Alert severity="error">
        Ошибка при загрузке планов испытаний: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Планы испытаний
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Создать план
        </Button>
      </Box>

      {/* Statistics */}
      {statistics && (
        <Box display="flex" gap={2} mb={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего планов
              </Typography>
              <Typography variant="h5">
                {statistics.totalPlans}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Культур
              </Typography>
              <Typography variant="h5">
                {statistics.totalCultures}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Участников
              </Typography>
              <Typography variant="h5">
                {statistics.totalParticipants}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Испытаний
              </Typography>
              <Typography variant="h5">
                {statistics.totalTrials}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              label="Поиск планов"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Год</InputLabel>
              <Select
                value={filters.year}
                label="Год"
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              >
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="2024">2024</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
                <MenuItem value="2026">2026</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Область</InputLabel>
              <Select
                value={filters.oblast}
                label="Область"
                onChange={(e) => setFilters(prev => ({ ...prev, oblast: e.target.value }))}
              >
                <MenuItem value="">Все</MenuItem>
                {dictionaries?.oblasts?.map((oblast: any) => (
                  <MenuItem key={oblast.id} value={oblast.id.toString()}>
                    {oblast.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={filters.status}
                label="Статус"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="planned">Запланирован</MenuItem>
                <MenuItem value="structured">Структурирован</MenuItem>
                <MenuItem value="distributed">Распределен</MenuItem>
                <MenuItem value="finalized">Завершен</MenuItem>
              </Select>
            </FormControl>
            <Button variant="text" onClick={() => { setSearch(''); setFilters({ year: '', oblast: '', status: '' }); }}>Сбросить</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Год</TableCell>
                <TableCell>Область</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Культуры</TableCell>
                <TableCell>Участники</TableCell>
                <TableCell>Испытания</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      Планы испытаний не найдены
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan: TrialPlan) => {
                  const cultures = (plan as any).cultures || [];
                  const culturesCount = cultures.length;
                  const participantsCount = cultures.reduce((sum: number, culture: any) => 
                    sum + (culture?.trial_types || []).reduce((typeSum: number, type: any) => 
                      typeSum + (type?.participants?.length || 0), 0), 0);
                  const trialsCount = cultures.reduce((sum: number, culture: any) => 
                    sum + (culture?.trial_types || []).reduce((typeSum: number, type: any) => 
                      typeSum + (type?.participants?.reduce((participantSum: number, participant: any) => 
                        participantSum + (participant?.trials?.length || 0), 0) || 0), 0), 0);

                  return (
                    <TableRow key={plan.id} hover>
                      <TableCell>{plan.year}</TableCell>
                      <TableCell>{plan.oblast.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(plan.status)} 
                          size="small"
                          color={getStatusColor(plan.status)}
                        />
                      </TableCell>
                      <TableCell>{culturesCount}</TableCell>
                      <TableCell>{participantsCount}</TableCell>
                      <TableCell>{trialsCount}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Просмотр">
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/trial-plans/${plan.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {/* Редактирование плана отключено */}
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, plan)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Просмотр</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Дублировать</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Экспорт в Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Удалить</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Trial Plan Dialog */}
      <CreateTrialPlanDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          // Обновляем данные после создания плана
          refetch();
        }}
      />
    </Box>
  );
};

export default TrialPlansList;
