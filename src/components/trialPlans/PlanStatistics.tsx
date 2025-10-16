import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

interface PlanStatisticsProps {
  totalCultures: number;
  totalParticipants: number;
  totalTrialTypes: number;
  regionsCount: number;
  seasonCounts: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
  seedsProvided: number;
  seedsNotProvided: number;
}

const PlanStatistics: React.FC<PlanStatisticsProps> = ({
  totalCultures,
  totalParticipants,
  totalTrialTypes,
  regionsCount,
  seasonCounts,
  seedsProvided,
  seedsNotProvided,
}) => {
  const StatCard: React.FC<{ label: string; value: string | number; fontSize?: string }> = ({
    label,
    value,
    fontSize = 'h4',
  }) => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant={fontSize as any} color="primary">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard label="Культур" value={totalCultures} />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard label="Участников" value={totalParticipants} />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard label="Испытаний" value={totalTrialTypes} />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard label="Регионов" value={regionsCount} />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard
          label="Сезоны (В/Л/О/З)"
          value={`${seasonCounts.spring}/${seasonCounts.summer}/${seasonCounts.autumn}/${seasonCounts.winter}`}
          fontSize="h6"
        />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard
          label="Семена (✓/✗)"
          value={`${seedsProvided}/${seedsNotProvided}`}
          fontSize="h6"
        />
      </Grid>
    </Grid>
  );
};

export default PlanStatistics;
