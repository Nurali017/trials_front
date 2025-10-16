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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '@/hooks/useApplications';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { getApplicationStatusMuiColor, getApplicationStatusLabel, calculateProgress } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';
import type { ApplicationStatus } from '@/types/api.types';

export const ApplicationsList: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: applications, isLoading } = useApplications();

  // Handle both array and object responses
  const applicationsArray = Array.isArray(applications)
    ? applications
    : applications?.results || [];

  const filteredApplications = applicationsArray.filter((app) => {
    const matchesStatus = !statusFilter || app.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      app.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.sort_record_data.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2}>
          <TextField
            label="Поиск"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1 }}
            placeholder="Поиск по номеру заявки или наименованию сорта"
            helperText="Можно искать сорт по наименованию или селекционному номеру"
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={statusFilter}
              label="Статус"
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus)}
            >
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="draft">Черновик</MenuItem>
              <MenuItem value="submitted">Создана</MenuItem>
              <MenuItem value="distributed">Распределена</MenuItem>
              <MenuItem value="in_progress">В испытаниях</MenuItem>
              <MenuItem value="completed">Завершена</MenuItem>
              <MenuItem value="registered">Включен в реестр</MenuItem>
              <MenuItem value="rejected">Отклонен</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

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
            {filteredApplications?.map((app) => {
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

      {filteredApplications?.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Заявки не найдены
          </Typography>
        </Box>
      )}
    </Box>
  );
};
