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
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Grid,
  Button,
} from '@mui/material';
import { Visibility as ViewIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTrials, useTrialTypes } from '@/hooks/useTrials';
import { useOblasts } from '@/hooks/useDictionaries';
import {
  getTrialStatusMuiColor,
  getTrialStatusLabel,
  calculateProgress,
} from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import type { TrialStatus } from '@/types/api.types';

export const TrialsList: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TrialStatus | ''>('');
  const [oblastFilter, setOblastFilter] = useState<number | ''>('');
  const [trialTypeFilter, setTrialTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: trials, isLoading } = useTrials();
  const { data: oblasts } = useOblasts();
  const { data: trialTypes } = useTrialTypes();

  // Handle both array and object responses
  const trialsArray = Array.isArray(trials) ? trials : (trials as any)?.results || [];
  const oblastsArray = Array.isArray(oblasts) ? oblasts : (oblasts as any)?.results || [];
  const trialTypesArray = Array.isArray(trialTypes) ? trialTypes : [];

  const filteredTrials = trialsArray.filter((trial: any) => {
    const matchesStatus = !statusFilter || trial.status === statusFilter;
    const matchesOblast =
      !oblastFilter ||
      oblastsArray.find((o: any) => o.name === trial.oblast_name)?.id === oblastFilter;
    const matchesTrialType = !trialTypeFilter || trial.trial_type_data?.code === trialTypeFilter;
    const matchesSearch =
      !searchQuery ||
      trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.application_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trial.sort_record_data?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesOblast && matchesTrialType && matchesSearch;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Испытания по областям
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Список всех испытаний, созданных из планов
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/trials/my-tasks')}
          startIcon={<AddIcon />}
        >
          Мои задачи
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Поиск"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру заявки или наименованию сорта"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Область</InputLabel>
              <Select
                value={oblastFilter}
                label="Область"
                onChange={(e) => setOblastFilter(e.target.value as number)}
              >
                <MenuItem value="">Все</MenuItem>
                {oblastsArray.map((oblast: any) => (
                  <MenuItem key={oblast.id} value={oblast.id}>
                    {oblast.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Тип испытания</InputLabel>
              <Select
                value={trialTypeFilter}
                label="Тип испытания"
                onChange={(e) => setTrialTypeFilter(e.target.value)}
              >
                <MenuItem value="">Все</MenuItem>
                {trialTypesArray.map((type: any) => (
                  <MenuItem key={type.code} value={type.code}>
                    {type.name} - {type.category_display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                label="Статус"
                onChange={(e) => setStatusFilter(e.target.value as TrialStatus)}
              >
                <MenuItem value="">Все</MenuItem>
                <MenuItem value="planned">Запланировано</MenuItem>
                <MenuItem value="active">Проводится</MenuItem>
                <MenuItem value="completed">Завершено</MenuItem>
                <MenuItem value="approved">Одобрено</MenuItem>
                <MenuItem value="continue">Продолжить</MenuItem>
                <MenuItem value="rejected">Отклонено</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {filteredTrials.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Всего
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {filteredTrials.filter((t: any) => t.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Активных
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {filteredTrials.filter((t: any) => ['completed', 'completed_008'].includes(t.status)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Завершено
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Тип испытания</TableCell>
                <TableCell>Область</TableCell>
                <TableCell>ГСУ</TableCell>
                <TableCell>Период</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Прогресс</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTrials.map((trial: any) => {
                const progress = calculateProgress(
                  trial.results_count,
                  trial.indicators_data?.length || 0
                );

                return (
                  <TableRow key={trial.id} hover>
                    <TableCell>
                      {trial.trial_type_data ? (
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {trial.trial_type_data.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trial.trial_type_data.category_display}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{trial.oblast_name}</TableCell>
                    <TableCell>{trial.region_name}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trial.year || new Date(trial.start_date).getFullYear()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(trial.start_date)} - {trial.end_date ? formatDate(trial.end_date) : 'н.в.'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTrialStatusLabel(trial.status)}
                        color={getTrialStatusMuiColor(trial.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 60,
                            height: 6,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${progress}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {trial.results_count}/{trial.indicators_data?.length || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/trials/${trial.id}`)}
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
      )}

      {!isLoading && filteredTrials.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Испытания не найдены
          </Typography>
        </Box>
      )}
    </Box>
  );
};
