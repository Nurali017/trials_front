import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Container,
  Stack,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AssessmentOutlined as AssessmentIcon,
  LocationOnOutlined as LocationIcon,
  CalendarTodayOutlined as CalendarIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useMethodologyTable } from '@/hooks/useMethodology';
import { MethodologyTable } from '@/components/methodology';

export const MethodologyView: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Получаем параметры из URL
  const year = parseInt(searchParams.get('year') || '2025');
  const oblastId = parseInt(searchParams.get('oblast_id') || '17');
  const cultureId = parseInt(searchParams.get('culture_id') || '720');

  // Хуки для данных
  const { data: methodologyData, isLoading, error, refetch } = useMethodologyTable({
    year,
    oblast_id: oblastId,
    culture_id: cultureId,
  });

  // Обработчик обновления
  const handleRefresh = () => {
    refetch();
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
      <Alert severity="error" sx={{ m: 2 }}>
        Ошибка загрузки таблицы методологии: {error.message}
      </Alert>
    );
  }

  if (!methodologyData) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Таблица методологии не найдена
      </Alert>
    );
  }

  // Подсчет статистики
  const totalRegions = Object.keys(methodologyData.methodology_table).length;
  const totalGroups = Object.values(methodologyData.methodology_table)
    .reduce((acc, regionGroups) => acc + Object.keys(regionGroups).length, 0);
  const totalSorts = Object.values(methodologyData.methodology_table)
    .reduce((acc, regionGroups) => 
      acc + Object.values(regionGroups).reduce((groupAcc, group) => 
        groupAcc + group.sorts.length + 1, 0), 0); // +1 для стандарта

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#fafafa',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Заголовок */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 1,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    mb: 2,
                  }}
                >
                  Таблица методологии сортоиспытаний
                </Typography>

                <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="center" sx={{ mb: 1 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body1" color="text.primary">
                      {methodologyData.oblast.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body1" color="text.primary">
                      {methodologyData.year} год
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="caption" color="text.secondary" display="block">
                  Сформирована: {new Date(methodologyData.generated_at).toLocaleString('ru-RU')}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isLoading}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.lighter',
                  },
                }}
              >
                Обновить
              </Button>
            </Box>

            {/* Статистика */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
                      {totalRegions}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Регионов
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
                      {totalGroups}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Групп спелости
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
                      {totalSorts}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Всего сортов
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
                      {methodologyData.years_range.length}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      Лет испытаний
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* Информация о регионах */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 1,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" gutterBottom fontWeight={600} color="text.primary">
            Регионы в отчете
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
            {methodologyData.regions.map((region) => (
              <Chip
                key={region.id}
                label={region.name}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Основная таблица */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 1,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <AssessmentIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
            <Typography variant="h6" component="h2" fontWeight={600} color="text.primary">
              Данные по регионам и группам спелости
            </Typography>
          </Stack>

          <MethodologyTable data={methodologyData} />
        </Paper>
      </Container>
    </Box>
  );
};
