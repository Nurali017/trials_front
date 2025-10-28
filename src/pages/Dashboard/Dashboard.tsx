import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import {
  Description as ApplicationIcon,
  Science as TrialIcon,
  CheckCircle as SuccessIcon,
  Cancel as ErrorIcon,
} from '@mui/icons-material';
import { useApplications, useApplicationStatistics, useCultureGroupsStatistics } from '@/hooks/useApplications';
import { useTrials } from '@/hooks/useTrials';
import { getApplicationStatusMuiColor, getApplicationStatusLabel } from '@/utils/statusHelpers';
import { CardSkeleton } from '@/components/common/CardSkeleton';
import CultureGroupsStatsCard from '@/components/summary/CultureGroupsStatsCard';
import { useNavigate } from 'react-router-dom';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color?: string;
}> = ({ title, value, icon, color = 'primary.main' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.9,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 32, color: 'white' } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Get recent applications for display (limited to 10)
  const { data: recentApplications, isLoading: loadingApplications } = useApplications({
    page_size: 10,
  });

  // Get statistics for accurate counts
  const { data: statistics, isLoading: loadingStatistics } = useApplicationStatistics();

  // Get culture groups statistics
  const { data: cultureGroupsStats, isLoading: loadingCultureGroupsStats } = useCultureGroupsStatistics();

  const { data: activeTrials, isLoading: loadingTrials } = useTrials({
    status: 'active',
  });

  // Handle both array and object responses
  const applicationsArray = Array.isArray(recentApplications)
    ? recentApplications
    : recentApplications?.results || [];

  const trialsArray = Array.isArray(activeTrials)
    ? activeTrials
    : (activeTrials as any)?.results || [];

  // Use statistics data for accurate counts
  const totalApplications = statistics?.total || 0;
  const totalActiveTrials = trialsArray.length || 0;
  const registeredCount = statistics?.by_status?.registered || 0;
  const rejectedCount = statistics?.by_status?.rejected || 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Обзор системы сортоиспытаний
      </Typography>

      {/* Main Statistics */}
      {loadingApplications || loadingTrials || loadingStatistics || loadingCultureGroupsStats ? (
        <CardSkeleton count={4} variant="standard" />
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Всего заявок"
              value={totalApplications}
              icon={<ApplicationIcon />}
              color="#2196F3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Активных испытаний"
              value={totalActiveTrials}
              icon={<TrialIcon />}
              color="#FF9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Включено в реестр"
              value={registeredCount}
              icon={<SuccessIcon />}
              color="#4CAF50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Отклонено"
              value={rejectedCount}
              icon={<ErrorIcon />}
              color="#F44336"
            />
          </Grid>
        </Grid>
      )}

      {/* Recent Applications */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Последние заявки
              </Typography>

              {loadingApplications ? (
                <Box>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Box key={index} sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ width: '60%' }}>
                          <Box
                            sx={{
                              height: 16,
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                              mb: 0.5,
                            }}
                          />
                          <Box
                            sx={{
                              height: 14,
                              width: '70%',
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            width: 60,
                            height: 24,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : !applicationsArray || applicationsArray.length === 0 ? (
                <Alert severity="info">Заявок пока нет</Alert>
              ) : (
                <Box>
                  {applicationsArray.slice(0, 5).map((app) => (
                    <Box
                      key={app.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        px: 1,
                        borderRadius: 1,
                      }}
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {app.application_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.sort_record_data.name}
                        </Typography>
                      </Box>
                      <Chip
                        label={getApplicationStatusLabel(app.status)}
                        color={getApplicationStatusMuiColor(app.status)}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Активные испытания
              </Typography>

              {loadingTrials ? (
                <Box>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Box key={index} sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ width: '70%' }}>
                          <Box
                            sx={{
                              height: 16,
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                              mb: 0.5,
                            }}
                          />
                          <Box
                            sx={{
                              height: 14,
                              width: '80%',
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                        <Box
                          sx={{
                            width: 40,
                            height: 16,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : !trialsArray || trialsArray.length === 0 ? (
                <Alert severity="info">Активных испытаний нет</Alert>
              ) : (
                <Box>
                  {trialsArray.slice(0, 5).filter((trial: any) => trial && trial.sort_record_data).map((trial: any) => (
                    <Box
                      key={trial.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        px: 1,
                        borderRadius: 1,
                      }}
                      onClick={() => navigate(`/trials/${trial.id}`)}
                    >
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {trial.sort_record_data?.name || 'Сорт не указан'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {trial.oblast_name} - {trial.region_name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {trial.results_count} / {trial.indicators_data?.length || 0}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Culture Groups Statistics */}
      <Box sx={{ mt: 4 }}>
        <CultureGroupsStatsCard
          data={cultureGroupsStats}
          isLoading={loadingCultureGroupsStats}
          error={null}
        />
      </Box>
    </Box>
  );
};
