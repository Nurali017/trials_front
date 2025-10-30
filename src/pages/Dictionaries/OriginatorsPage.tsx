import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useOriginators, useCreateOriginator, useUpdateOriginator, useDeleteOriginator } from '@/hooks/useDictionaries';
import type { Originator } from '@/types/api.types';

interface OriginatorFormData {
  name: string;
  code: string;
  is_foreign: boolean;
  is_nanoc: boolean;
}

export const OriginatorsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOriginator, setEditingOriginator] = useState<Originator | null>(null);
  const [formData, setFormData] = useState<OriginatorFormData>({
    name: '',
    code: '',
    is_foreign: false,
    is_nanoc: false,
  });

  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterForeign, setFilterForeign] = useState<boolean | null>(null);
  const [filterNanoc, setFilterNanoc] = useState<boolean | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setPage(0); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const { data: originators = [], isLoading, error } = useOriginators();
  const { mutate: createOriginator, isPending: isCreating } = useCreateOriginator();
  const { mutate: updateOriginator, isPending: isUpdating } = useUpdateOriginator();
  const { mutate: deleteOriginator, isPending: isDeleting } = useDeleteOriginator();

  // Memoized filtered data
  const filteredOriginators = useMemo(() => {
    return originators.filter((originator) => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
          originator.name.toLowerCase().includes(searchLower) ||
          originator.code?.toString().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Foreign filter
      if (filterForeign !== null && originator.is_foreign !== filterForeign) {
        return false;
      }

      // Nanoc filter
      if (filterNanoc !== null && originator.is_nanoc !== filterNanoc) {
        return false;
      }

      return true;
    });
  }, [originators, debouncedSearch, filterForeign, filterNanoc]);

  // Memoized paginated data
  const paginatedOriginators = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredOriginators.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredOriginators, page, rowsPerPage]);

  // Pagination handlers
  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Filter handlers
  const handleForeignFilterChange = useCallback((value: boolean | null) => {
    setFilterForeign(value);
    setPage(0);
  }, []);

  const handleNanocFilterChange = useCallback((value: boolean | null) => {
    setFilterNanoc(value);
    setPage(0);
  }, []);

  const handleOpenDialog = (originator?: Originator) => {
    if (originator) {
      setEditingOriginator(originator);
      setFormData({
        name: originator.name,
        code: originator.code?.toString() || '',
        is_foreign: originator.is_foreign,
        is_nanoc: originator.is_nanoc,
      });
    } else {
      setEditingOriginator(null);
      setFormData({
        name: '',
        code: '',
        is_foreign: false,
        is_nanoc: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOriginator(null);
    setFormData({
      name: '',
      code: '',
      is_foreign: false,
      is_nanoc: false,
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      enqueueSnackbar('Название оригинатора обязательно', { variant: 'error' });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() ? parseInt(formData.code.trim()) : null,
      is_foreign: formData.is_foreign,
      is_nanoc: formData.is_nanoc,
    };

    if (editingOriginator) {
      updateOriginator(
        { id: editingOriginator.id, data: payload },
        {
          onSuccess: () => {
            enqueueSnackbar('Оригинатор успешно обновлен', { variant: 'success' });
            handleCloseDialog();
          },
          onError: (error: any) => {
            enqueueSnackbar(error.response?.data?.message || 'Ошибка при обновлении оригинатора', { variant: 'error' });
          },
        }
      );
    } else {
      createOriginator(payload, {
        onSuccess: () => {
          enqueueSnackbar('Оригинатор успешно создан', { variant: 'success' });
          handleCloseDialog();
        },
        onError: (error: any) => {
          enqueueSnackbar(error.response?.data?.message || 'Ошибка при создании оригинатора', { variant: 'error' });
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого оригинатора?')) {
      deleteOriginator(id, {
        onSuccess: () => {
          enqueueSnackbar('Оригинатор успешно удален', { variant: 'success' });
        },
        onError: (error: any) => {
          enqueueSnackbar(error.response?.data?.message || 'Ошибка при удалении оригинатора', { variant: 'error' });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Ошибка при загрузке оригинаторов: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Оригинаторы
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Добавить оригинатора
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Поиск по названию или коду..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label="Все"
                onClick={() => handleForeignFilterChange(null)}
                color={filterForeign === null ? 'primary' : 'default'}
                variant={filterForeign === null ? 'filled' : 'outlined'}
              />
              <Chip
                label="Иностранные"
                onClick={() => handleForeignFilterChange(true)}
                color={filterForeign === true ? 'warning' : 'default'}
                variant={filterForeign === true ? 'filled' : 'outlined'}
              />
              <Chip
                label="Местные"
                onClick={() => handleForeignFilterChange(false)}
                color={filterForeign === false ? 'success' : 'default'}
                variant={filterForeign === false ? 'filled' : 'outlined'}
              />
              <Chip
                label="НАНОЦ"
                onClick={() => handleNanocFilterChange(filterNanoc === true ? null : true)}
                color={filterNanoc === true ? 'primary' : 'default'}
                variant={filterNanoc === true ? 'filled' : 'outlined'}
              />
            </Box>
          </Grid>
        </Grid>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Показано: {filteredOriginators.length} из {originators.length} оригинаторов
          </Typography>
        </Box>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Код</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOriginators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      {isLoading ? 'Загрузка...' : 'Оригинаторы не найдены'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOriginators.map((originator) => (
                  <TableRow key={originator.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {originator.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {originator.code ? (
                      <Chip label={originator.code} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {originator.is_foreign && (
                        <Chip label="Иностранный" size="small" color="warning" />
                      )}
                      {originator.is_nanoc && (
                        <Chip label="НАНОЦ" size="small" color="primary" />
                      )}
                      {!originator.is_foreign && !originator.is_nanoc && (
                        <Chip label="Местный" size="small" color="success" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Активный"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(originator)}
                      disabled={isUpdating || isDeleting}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(originator.id)}
                      disabled={isUpdating || isDeleting}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredOriginators.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} из ${count !== -1 ? count : `более чем ${to}`}`
          }
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingOriginator ? 'Редактировать оригинатора' : 'Добавить оригинатора'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Название оригинатора"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                placeholder="Введите название оригинатора"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Код"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                fullWidth
                placeholder="Введите код (необязательно)"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_foreign}
                    onChange={(e) => setFormData({ ...formData, is_foreign: e.target.checked })}
                  />
                }
                label="Иностранный оригинатор"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_nanoc}
                    onChange={(e) => setFormData({ ...formData, is_nanoc: e.target.checked })}
                  />
                }
                label="НАНОЦ"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isCreating || isUpdating}
            startIcon={(isCreating || isUpdating) ? <CircularProgress size={20} /> : null}
          >
            {isCreating || isUpdating ? 'Сохранение...' : editingOriginator ? 'Обновить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
