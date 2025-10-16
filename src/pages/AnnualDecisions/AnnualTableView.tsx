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
  LinearProgress,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  CheckCircle as FinalizeIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAnnualTable, useFinalizeAnnualTable, useExportAnnualTableExcel } from '@/hooks/useAnnualDecisions';
import { DecisionModal } from '@/components/annualDecisions/DecisionModal';
import type { AnnualDecisionItem } from '@/types/api.types';

export const AnnualTableView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tableId = Number(id);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [selectedItem, setSelectedItem] = useState<AnnualDecisionItem | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // API calls
  const { data: table, isLoading, error } = useAnnualTable(tableId);
  const { mutate: finalizeTable, isPending: isFinalizing } = useFinalizeAnnualTable();
  const { mutate: exportExcel, isPending: isExporting } = useExportAnnualTableExcel();

  const items = table?.items || [];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesDecision = decisionFilter === 'all' || item.decision === decisionFilter;
    const matchesSearch = searchTerm === '' || 
      item.sort_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sort_public_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDecision && matchesSearch;
  });

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'success';
      case 'continue':
        return 'warning';
      case 'removed':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved':
        return '✅';
      case 'continue':
        return '🔄';
      case 'removed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '';
    }
  };

  const handleOpenDecisionModal = (item: AnnualDecisionItem) => {
    setSelectedItem(item);
    setShowDecisionModal(true);
  };

  const handleCloseDecisionModal = () => {
    setSelectedItem(null);
    setShowDecisionModal(false);
  };

  const handleFinalizeTable = () => {
    finalizeTable(tableId, {
      onSuccess: (response) => {
        if (response.success) {
          enqueueSnackbar('Таблица успешно завершена и заблокирована для редактирования', {
            variant: 'success'
          });
          setShowFinalizeDialog(false);
        }
      },
      onError: (error: any) => {
        if (error.response?.data?.error === 'Не все решения приняты') {
          const details = error.response.data.details;
          enqueueSnackbar(
            `Невозможно завершить таблицу. Принято решений: ${details.decided}/${details.total}. Ожидают решения: ${details.pending} сортов.`,
            { variant: 'warning' }
          );
        } else {
          enqueueSnackbar('Ошибка завершения таблицы', { variant: 'error' });
        }
      },
    });
  };

  const handleExportExcel = () => {
    exportExcel(tableId, {
      onSuccess: () => {
        enqueueSnackbar('Файл Excel скачан', { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(`Ошибка экспорта: ${error.message}`, { variant: 'error' });
      },
    });
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Ошибка загрузки таблицы: {error.message}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/decisions/annual-tables')}
          sx={{ mt: 2 }}
        >
          Назад к списку
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p={3} textAlign="center">
        <CircularProgress />
        <Typography variant="body2" mt={2}>
          Загрузка таблицы...
        </Typography>
      </Box>
    );
  }

  if (!table) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Таблица не найдена
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/decisions/annual-tables')}
          sx={{ mt: 2 }}
        >
          Назад к списку
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/decisions/annual-tables')}
            sx={{ mb: 2 }}
          >
            Назад к списку
          </Button>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {table.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Создана: {new Date(table.created_at).toLocaleDateString()} • 
            Автор: {table.created_by_name}
          </Typography>
          {table.finalized_date && (
            <Typography variant="body2" color="text.secondary">
              Завершена: {new Date(table.finalized_date).toLocaleDateString()} • 
              {table.finalized_by_name}
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={handleExportExcel}
            disabled={isExporting}
          >
            {isExporting ? 'Экспорт...' : 'Экспорт Excel'}
          </Button>
          {table.status === 'draft' && (
            <Button
              startIcon={<FinalizeIcon />}
              variant="contained"
              color="success"
              onClick={() => setShowFinalizeDialog(true)}
            >
              Завершить таблицу
            </Button>
          )}
        </Box>
      </Box>

      {/* Progress Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {table.items_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего сортов
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {table.statistics.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Одобрено
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {table.statistics.continue}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Продолжить
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {table.statistics.removed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Снято
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box mt={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">
                Прогресс: {table.decisions_count}/{table.items_count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {table.progress_percentage.toFixed(1)}%
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
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск по названию сорта или коду..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Решение</InputLabel>
              <Select
                value={decisionFilter}
                label="Решение"
                onChange={(e) => setDecisionFilter(e.target.value)}
              >
                <MenuItem value="all">Все решения</MenuItem>
                <MenuItem value="pending">Ожидают</MenuItem>
                <MenuItem value="approved">Одобрено</MenuItem>
                <MenuItem value="continue">Продолжить</MenuItem>
                <MenuItem value="removed">Снято</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>№</TableCell>
                <TableCell>Сорт</TableCell>
                <TableCell>Код</TableCell>
                <TableCell>Группа</TableCell>
                <TableCell>Годы испытаний</TableCell>
                <TableCell>Средняя урожайность</TableCell>
                <TableCell>Отклонение</TableCell>
                <TableCell>Решение</TableCell>
                <TableCell>Дата решения</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.row_number}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.sort_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.sort_public_code}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.maturity_group}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.years_tested} год{item.years_tested !== 1 ? 'а' : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.year_started} - {item.year_started + item.years_tested - 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.average_yield} ц/га
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={item.deviation_from_standard > 0 ? 'success.main' : 'text.secondary'}
                    >
                      {item.deviation_from_standard > 0 
                        ? `+${item.deviation_from_standard}` 
                        : item.deviation_from_standard === 0 
                        ? 'ст' 
                        : item.deviation_from_standard}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<span>{getDecisionIcon(item.decision)}</span>}
                      label={item.decision_display}
                      color={getDecisionColor(item.decision) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {item.decision_date ? (
                      <Typography variant="body2">
                        {new Date(item.decision_date).toLocaleDateString()}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {table.status === 'draft' ? (
                      <Tooltip title="Принять решение">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDecisionModal(item)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Просмотр решения">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDecisionModal(item)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredItems.length === 0 && (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Сорта не найдены по заданным фильтрам
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Decision Modal */}
      {selectedItem && (
        <DecisionModal
          open={showDecisionModal}
          onClose={handleCloseDecisionModal}
          item={selectedItem}
          readOnly={table.status === 'finalized'}
          onSuccess={() => {
            handleCloseDecisionModal();
            // Table will be refetched automatically via React Query
          }}
        />
      )}

      {/* Finalize Dialog */}
      <Dialog open={showFinalizeDialog} onClose={() => setShowFinalizeDialog(false)}>
        <DialogTitle>Завершить таблицу</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Вы уверены, что хотите завершить таблицу? После завершения:
          </Typography>
          <ul>
            <li>Все решения будут заблокированы для редактирования</li>
            <li>Таблица будет доступна только для просмотра и экспорта</li>
            <li>Можно будет создать официальный документ</li>
          </ul>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Прогресс: {table.decisions_count}/{table.items_count} ({table.progress_percentage.toFixed(1)}%)
            </Typography>
            {table.progress_percentage < 100 && (
              <Typography variant="body2">
                Не все решения приняты. Завершение может быть недоступно.
              </Typography>
            )}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFinalizeDialog(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleFinalizeTable}
            variant="contained"
            color="success"
            disabled={isFinalizing}
          >
            {isFinalizing ? 'Завершение...' : 'Завершить таблицу'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


