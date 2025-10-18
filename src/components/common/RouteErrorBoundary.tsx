import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Stack,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface RouteErrorProps {
  error?: Error;
}

const RouteErrorBoundary: React.FC<RouteErrorProps> = ({ error }) => {
  const routeError = useRouteError() as Error;
  const navigate = useNavigate();
  
  const actualError = error || routeError;

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Stack spacing={3}>
          <Box>
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />
            <Typography variant="h4" gutterBottom color="error">
              Ошибка загрузки страницы
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Не удалось загрузить запрашиваемую страницу. Проверьте правильность URL или попробуйте позже.
            </Typography>
          </Box>

          <Alert severity="error" sx={{ textAlign: 'left' }}>
            <AlertTitle>Ошибка маршрута</AlertTitle>
            {actualError?.message || 'Страница не найдена или произошла ошибка'}
          </Alert>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              color="primary"
            >
              На главную
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Обновить страницу
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RouteErrorBoundary;

