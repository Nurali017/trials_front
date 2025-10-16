import React from 'react';
import {
  Box,
  Card,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOblasts } from '@/hooks/useDictionaries';

export const OblastsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: oblasts = [], isLoading, error } = useOblasts();

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Ошибка загрузки данных: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dictionaries')}
          variant="outlined"
        >
          Назад
        </Button>
        <Box>
          <Typography variant="h4">Области</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего записей: {oblasts.length}
          </Typography>
        </Box>
      </Box>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Код</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {oblasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography color="text.secondary">
                      Нет данных
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                oblasts.map((oblast) => (
                  <TableRow key={oblast.id} hover>
                    <TableCell>
                      <Chip label={oblast.id} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {oblast.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={oblast.code} size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
};

