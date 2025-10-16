import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrial } from '@/hooks/useTrials';
import { TrialDataEntry } from '@/components/forms/TrialDataEntry';

export const ResultsEntry: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trial, isLoading, refetch } = useTrial(Number(id));

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!trial) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Испытание не найдено
        </Typography>
        <Button onClick={() => navigate('/trials')} sx={{ mt: 2 }}>
          Назад к списку
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Ввод результатов измерений
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Испытание: {trial.title}
          </Typography>
        </Box>
        <Button onClick={() => navigate(`/trials/${id}`)}>
          Назад к испытанию
        </Button>
      </Box>

      {/* Trial Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Культура
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {trial.culture_name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Область
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {trial.oblast_name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              ГСУ
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {trial.region_name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              Год
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {trial.year}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Entry - Unified Table */}
      <TrialDataEntry
        trial={trial}
        onSuccess={() => {
          refetch();
        }}
      />
    </Box>
  );
};
