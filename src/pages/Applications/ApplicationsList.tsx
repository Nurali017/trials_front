import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { getApplicationStatusMuiColor, getApplicationStatusLabel, calculateProgress, getProgressColor } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';
import ApplicationFiltersComponent from '@/components/forms/ApplicationFilters';
import type { ApplicationFilters } from '@/types/api.types';

export const ApplicationsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Always get filters from URL (single source of truth)
  const filters = useMemo((): ApplicationFilters => {
    return {
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '20'),
      search: searchParams.get('search') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      patents_group_id: searchParams.get('patents_group_id') ? parseInt(searchParams.get('patents_group_id')!) : undefined,
      patents_culture_id: searchParams.get('patents_culture_id') ? parseInt(searchParams.get('patents_culture_id')!) : undefined,
      ordering: searchParams.get('ordering') || undefined,
    };
  }, [searchParams]);

  const { data: applicationsData, isLoading, isFetching } = useApplications(filters);

  // Update URL params directly
  const handleFiltersChange = useCallback((newFilters: ApplicationFilters) => {
    const params = new URLSearchParams();

    params.set('page', '1'); // Reset to first page when filters change
    params.set('page_size', '20');
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.year) params.set('year', newFilters.year.toString());
    if (newFilters.patents_group_id) params.set('patents_group_id', newFilters.patents_group_id.toString());
    if (newFilters.patents_culture_id) params.set('patents_culture_id', newFilters.patents_culture_id.toString());

    setSearchParams(params);
  }, [setSearchParams]);

  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleResetFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('page_size', '20');
    setSearchParams(params);
  }, [setSearchParams]);

  const handleSort = useCallback((field: string) => {
    const params = new URLSearchParams(searchParams);
    const currentOrdering = filters.ordering;

    let newOrdering: string;
    if (currentOrdering === field) {
      // Currently ascending, switch to descending
      newOrdering = `-${field}`;
    } else if (currentOrdering === `-${field}`) {
      // Currently descending, remove sorting
      params.delete('ordering');
      setSearchParams(params);
      return;
    } else {
      // Not sorted or different field, sort ascending
      newOrdering = field;
    }

    params.set('ordering', newOrdering);
    setSearchParams(params);
  }, [searchParams, filters.ordering, setSearchParams]);

  const getSortIcon = useCallback((field: string) => {
    const currentOrdering = filters.ordering;
    if (currentOrdering === field) {
      return <ArrowUpwardIcon fontSize="small" />;
    } else if (currentOrdering === `-${field}`) {
      return <ArrowDownwardIcon fontSize="small" />;
    }
    return null;
  }, [filters.ordering]);

  // Memoize computed values
  const applications = useMemo(() => applicationsData?.results || [], [applicationsData?.results]);
  const totalCount = applicationsData?.count || 0;
  const totalPages = useMemo(() => Math.ceil(totalCount / (filters.page_size || 20)), [totalCount, filters.page_size]);

  // Show skeleton only on initial load (no data yet)
  if (isLoading && !applicationsData) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            Заявки на испытания
          </Typography>
        </Box>
        <TableSkeleton rows={8} columns={8} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Заявки на испытания
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/applications/create')}
        >
          Создать заявку
        </Button>
      </Box>

      {/* Filters */}
      <ApplicationFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Loading indicator when fetching new data */}
      {isFetching && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Table */}
      <TableContainer component={Paper} sx={{ position: 'relative', opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('application_number')}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  Номер заявки
                  {getSortIcon('application_number')}
                </Box>
              </TableCell>
              <TableCell
                sx={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('submission_date')}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  Дата подачи
                  {getSortIcon('submission_date')}
                </Box>
              </TableCell>
              <TableCell>Сорт</TableCell>
              <TableCell>Культура</TableCell>
              <TableCell>Заявитель</TableCell>
              <TableCell
                sx={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('status')}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  Статус
                  {getSortIcon('status')}
                </Box>
              </TableCell>
              <TableCell>Прогресс</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications?.map((app) => {
              const progress = calculateProgress(
                app.decisions_summary?.with_decision || 0,
                app.decisions_summary?.total || 0
              );

              return (
                <TableRow
                  key={app.id}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'pointer'
                    },
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {app.application_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(app.submission_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {app.sort_record_data.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {app.sort_record_data.culture_name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {app.applicant}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getApplicationStatusLabel(app.status)}
                      color={getApplicationStatusMuiColor(app.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Прогресс
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={getProgressColor(progress)}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {app.decisions_summary?.with_decision || 0} / {app.decisions_summary?.total || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={filters.page || 1}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Empty state */}
      {applications?.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Заявки не найдены
          </Typography>
        </Box>
      )}

      {/* Results info */}
      {totalCount > 0 && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Показано {applications.length} из {totalCount} заявок
          </Typography>
        </Box>
      )}
    </Box>
  );
};
