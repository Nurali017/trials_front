import React, { useState } from 'react';
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
  CircularProgress,
  IconButton,
  LinearProgress,
  Pagination,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { getApplicationStatusMuiColor, getApplicationStatusLabel, calculateProgress } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';
import ApplicationFiltersComponent from '@/components/forms/ApplicationFilters';
import type { ApplicationStatus, ApplicationFilters } from '@/types/api.types';

export const ApplicationsList: React.FC = () => {
  const navigate = useNavigate();
  
  // Filter states
  const [filters, setFilters] = useState<ApplicationFilters>({
    page: 1,
    page_size: 20,
  });

  const { data: applicationsData, isLoading } = useApplications(filters);

  // Handle filters change
  const handleFiltersChange = (newFilters: ApplicationFilters) => {
    setFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
      page_size: filters.page_size,
    });
  };

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      page_size: 20,
    });
  };

  if (isLoading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Заявки на испытания
          </Typography>
        </Box>
        <TableSkeleton rows={8} columns={8} />
      </Box>
    );
  }

  const applications = applicationsData?.results || [];
  const totalCount = applicationsData?.count || 0;
  const totalPages = Math.ceil(totalCount / (filters.page_size || 20));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
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

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Номер заявки</TableCell>
              <TableCell>Дата подачи</TableCell>
              <TableCell>Сорт</TableCell>
              <TableCell>Культура</TableCell>
              <TableCell>Заявитель</TableCell>
              <TableCell>Статус</TableCell>
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
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {app.application_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(app.submission_date)}</TableCell>
                  <TableCell>{app.sort_record_data.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {app.sort_record_data.culture_name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{app.applicant}</TableCell>
                  <TableCell>
                    <Chip
                      label={getApplicationStatusLabel(app.status)}
                      color={getApplicationStatusMuiColor(app.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {app.decisions_summary?.with_decision || 0} / {app.decisions_summary?.total || 0}
                      </Typography>
                      <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.5 }} />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
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
