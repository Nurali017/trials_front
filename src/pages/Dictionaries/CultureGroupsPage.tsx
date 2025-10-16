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
import { useCultureGroups } from '@/hooks/useDictionaries';
import { format } from 'date-fns';

export const CultureGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: cultureGroups = [], isLoading, error } = useCultureGroups();


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
          <Typography variant="h4">Группы культур</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего записей: {cultureGroups.length}
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
                <TableCell>Описание</TableCell>
                <TableCell>Дата синхронизации</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cultureGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">
                      Нет данных
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cultureGroups.map((group) => (
                  <TableRow key={group.id} hover>
                    <TableCell>
                      <Chip label={group.id} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {group.name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {group.code && (
                        <Chip label={group.code} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {group.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {group.synced_at ? (
                        <Typography variant="body2">
                          {format(new Date(group.synced_at), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
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

