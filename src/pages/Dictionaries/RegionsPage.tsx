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
import { useOblasts, useRegions } from '@/hooks/useDictionaries';

export const RegionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOblast, setSelectedOblast] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: oblasts = [], isLoading: oblastsLoading } = useOblasts();
  const { data: regions = [], isLoading: regionsLoading, error } = useRegions();

  const isLoading = oblastsLoading || regionsLoading;

  // Filter regions
  const filteredRegions = regions.filter((region) => {
    const matchesOblast = selectedOblast === '' || region.oblast === selectedOblast;
    const matchesSearch = searchTerm === '' || 
      region.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOblast && matchesSearch;
  });

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
          <Typography variant="h4">ГСУ (Регионы)</Typography>
          <Typography variant="body2" color="text.secondary">
            Всего записей: {filteredRegions.length} из {regions.length}
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Область</InputLabel>
            <Select
              value={selectedOblast}
              onChange={(e) => setSelectedOblast(e.target.value as number | '')}
              label="Область"
              disabled={oblastsLoading}
            >
              <MenuItem value="">
                <em>Все области</em>
              </MenuItem>
              {oblasts.map((oblast) => (
                <MenuItem key={oblast.id} value={oblast.id}>
                  {oblast.name}
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
                  <TableCell>Название ГСУ</TableCell>
                  <TableCell>Область</TableCell>
                  <TableCell>Климатическая зона</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRegions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary">
                        Нет данных
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegions.map((region) => (
                    <TableRow key={region.id} hover>
                      <TableCell>
                        <Chip label={region.id} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={500}>
                          {region.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={region.oblast_name} size="small" color="info" />
                      </TableCell>
                      <TableCell>
                        {region.climate_zone_name ? (
                          <Chip label={region.climate_zone_name} size="small" color="success" />
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

