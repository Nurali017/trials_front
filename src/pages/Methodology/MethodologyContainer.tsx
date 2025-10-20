import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Container,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocationOnOutlined as LocationIcon,
  CalendarTodayOutlined as CalendarIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useMethodologyTable } from '@/hooks/useMethodology';
import { useSummary } from '@/hooks/useSummary';
import { MethodologyTable } from '@/components/methodology';
import { SummaryView } from './SummaryView';

export const MethodologyContainer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Получаем параметры из URL
  const year = parseInt(searchParams.get('year') || '2025');
  const oblastId = parseInt(searchParams.get('oblast_id') || '17');
  const cultureId = parseInt(searchParams.get('culture_id') || '720');
  const tabParam = searchParams.get('tab') || 'methodology';

  // Состояние активной вкладки
  const [activeTab, setActiveTab] = useState(tabParam === 'summary' ? 1 : 0);

  // Хуки для данных
  const { data: methodologyData, refetch: refetchMethodology } = useMethodologyTable({
    year,
    oblast_id: oblastId,
    culture_id: cultureId,
  });

  const { refetch: refetchSummary } = useSummary({
    year,
    oblast_id: oblastId,
  });

  // Обработчик смены вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Обновляем URL параметр tab
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newValue === 0 ? 'methodology' : 'summary');
    setSearchParams(newParams);
  };

  // Обработчик обновления
  const handleRefresh = () => {
    if (activeTab === 0) {
      refetchMethodology();
    } else {
      refetchSummary();
    }
  };

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
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
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
                Методология сортоиспытаний
              </Typography>

              {methodologyData && (
                <Box display="flex" gap={3} alignItems="center" mb={1}>
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
                </Box>
              )}

              {methodologyData && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Сформирована: {new Date(methodologyData.generated_at).toLocaleString('ru-RU')}
                </Typography>
              )}
            </Box>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
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

          {/* Вкладки */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                minHeight: 48,
              },
            }}
          >
            <Tab label="Таблица методологии" />
            <Tab label="Сводный отчет" />
          </Tabs>
        </Paper>

        {/* Контент вкладок */}
        <Box role="tabpanel" hidden={activeTab !== 0}>
          {activeTab === 0 && methodologyData && (
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
              <MethodologyTable data={methodologyData} />
            </Paper>
          )}
        </Box>

        <Box role="tabpanel" hidden={activeTab !== 1}>
          {activeTab === 1 && (
            <SummaryView year={year} oblastId={oblastId} />
          )}
        </Box>
      </Container>
    </Box>
  );
};
