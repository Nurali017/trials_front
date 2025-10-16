import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  CheckCircle as FinalizedIcon,
  Edit as DraftIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAnnualTables } from '@/hooks/useAnnualDecisions';
import { useOblasts, useCultures } from '@/hooks/useDictionaries';
import { CreateAnnualTableModal } from '@/components/annualDecisions/CreateAnnualTableModal';
import type { AnnualTableFilters } from '@/types/api.types';

export const AnnualTablesList: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [filters, setFilters] = useState<AnnualTableFilters>({
    year: new Date().getFullYear(),
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // API calls
  const { data: tablesResponse, isLoading, error } = useAnnualTables(filters);
  const { data: oblasts } = useOblasts();
  const { data: cultures } = useCultures();

  const tables = tablesResponse?.results || [];

  const handleFilterChange = (key: keyof AnnualTableFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'success';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finalized':
        return <FinalizedIcon fontSize="small" />;
      case 'draft':
        return <DraftIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const handleViewTable = (tableId: number) => {
    navigate(`/decisions/annual-tables/${tableId}`);
  };

  const handleExportExcel = (table: any) => {
    enqueueSnackbar('Функция экспорта будет доступна в деталях таблицы', { variant: 'info' });
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Ошибка загрузки таблиц: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Годовые таблицы решений
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Управление решениями по сортам на основе результатов испытаний
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateModal(true)}
        >
          Создать таблицу
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Фильтры
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Область</InputLabel>
              <Select
                value={filters.oblast_id || ''}
                label="Область"
                onChange={(e) => handleFilterChange('oblast_id', e.target.value)}
              >
                <MenuItem value="">Все области</MenuItem>
                {oblasts?.map((oblast) => (
                  <MenuItem key={oblast.id} value={oblast.id}>
                    {oblast.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Год</InputLabel>
              <Select
                value={filters.year || ''}
                label="Год"
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <MenuItem value="">Все годы</MenuItem>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Статус</InputLabel>
              <Select
                value={filters.status || ''}
                label="Статус"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Все статусы</MenuItem>
                <MenuItem value="draft">Черновик</MenuItem>
                <MenuItem value="finalized">Завершена</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Культура</InputLabel>
              <Select
                value={filters.culture_id || ''}
                label="Культура"
                onChange={(e) => handleFilterChange('culture_id', e.target.value)}
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
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      {tables.length > 0 && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {tables.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего таблиц
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {tables.filter(t => t.status === 'finalized').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Завершено
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {tables.filter(t => t.status === 'draft').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  В работе
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {tables.reduce((sum, t) => sum + t.items_count, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего сортов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tables List */}
      <Paper>
        {isLoading ? (
          <Box p={3} textAlign="center">
            <CircularProgress />
            <Typography variant="body2" mt={2}>
              Загрузка таблиц...
            </Typography>
          </Box>
        ) : tables.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Таблицы не найдены
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Попробуйте изменить фильтры или создайте новую таблицу
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
            >
              Создать первую таблицу
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Год</TableCell>
                  <TableCell>Область</TableCell>
                  <TableCell>Культура</TableCell>
                  <TableCell>Сортов</TableCell>
                  <TableCell>Прогресс</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id} hover>
                    <TableCell>{table.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {table.year}
                      </Typography>
                    </TableCell>
                    <TableCell>{table.oblast_name}</TableCell>
                    <TableCell>
                      {table.culture_name || (
                        <Typography variant="body2" color="text.secondary">
                          Все культуры
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {table.items_count}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <Typography variant="body2" sx={{ minWidth: 60 }}>
                            {table.decisions_count}/{table.items_count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" ml={1}>
                            ({table.progress_percentage.toFixed(1)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={table.progress_percentage}
                          color={
                            table.progress_percentage === 100
                              ? 'success'
                              : table.progress_percentage >= 50
                              ? 'primary'
                              : 'warning'
                          }
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(table.status)}
                        label={table.status_display}
                        color={getStatusColor(table.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Просмотр таблицы">
                        <IconButton
                          size="small"
                          onClick={() => handleViewTable(table.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {table.status === 'finalized' && (
                        <Tooltip title="Экспорт в Excel">
                          <IconButton
                            size="small"
                            onClick={() => handleExportExcel(table)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Modal */}
      <CreateAnnualTableModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(table) => {
          setShowCreateModal(false);
          navigate(`/decisions/annual-tables/${table.id}`);
        }}
      />
    </Box>
  );
};


