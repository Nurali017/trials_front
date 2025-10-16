import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCultureGroups } from '@/hooks/useDictionaries';
import { useQuery } from '@tanstack/react-query';
import { dictionariesService } from '@/api';

export const CulturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: cultureGroups = [], isLoading: groupsLoading } = useCultureGroups();
  
  // Load cultures with server-side filtering
  const { data: filteredCultures = [], isLoading: culturesLoading, error } = useQuery({
    queryKey: ['cultures', selectedGroup, searchTerm],
    queryFn: () => dictionariesService.cultures.getAll({
      culture_group: selectedGroup || undefined,
      search: searchTerm || undefined,
    }),
    staleTime: 1000 * 60 * 5, // 5 минут
  });

  // Load all cultures for total count
  const { data: allCultures = [] } = useQuery({
    queryKey: ['cultures', 'total'],
    queryFn: () => dictionariesService.cultures.getAll(),
    staleTime: 1000 * 60 * 60,
  });

  const isLoading = groupsLoading || culturesLoading;

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
          <Typography variant="h4">Культуры</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего записей: {filteredCultures.length} из {allCultures.length}
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Группа культур</InputLabel>
            <Select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as number | '')}
              label="Группа культур"
              disabled={groupsLoading}
            >
              <MenuItem value="">
                <em>Все группы</em>
              </MenuItem>
              {cultureGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder="Поиск по названию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Группа культур</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCultures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary">
                        Нет данных
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCultures.map((culture) => (
                    <TableRow key={culture.id} hover>
                      <TableCell>
                        <Chip label={culture.id} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={500}>
                          {culture.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {culture.group?.name ? (
                          <Chip label={culture.group.name} size="small" color="info" />
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
        )}
      </Card>
    </Container>
  );
};

