import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
  Card,
  CircularProgress,
  Alert,
  Chip,
  FormControlLabel,
  Checkbox,
  Paper,
  Stack,
  Divider,
  IconButton,
  Collapse,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { usePatentsCultureGroups, usePatentsCultures, usePatentsSorts } from '@/hooks/usePatents';
import { SortCard } from '@/components/common/SortCard';
import { CreateSortDialog } from '@/components/forms/CreateSortDialog';

export const SortsList: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [selectedCulture, setSelectedCulture] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [patentNis, setPatentNis] = useState<boolean | undefined>(undefined);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: cultureGroups = [], isLoading: groupsLoading } = usePatentsCultureGroups();
  
  // Load cultures for selected group
  const { data: cultures = [], isLoading: culturesLoading } = usePatentsCultures(
    selectedGroup ? { group: selectedGroup } : undefined
  );

  // Build search parameters
  const searchParams = {
    search: searchTerm || undefined,
    culture: selectedCulture || undefined,
    group: selectedGroup || undefined,
    patent_nis: patentNis,
  };

  // Load sorts from patents service
  const {
    data: sorts,
    isLoading: sortsLoading,
    error,
  } = usePatentsSorts(searchParams);

  const totalCount = sorts?.length || 0;

  const isLoading = groupsLoading || culturesLoading || sortsLoading;

  const handleClearFilters = () => {
    setSelectedGroup('');
    setSelectedCulture('');
    setSearchTerm('');
    setPatentNis(undefined);
  };

  const hasFilters = selectedGroup !== '' || selectedCulture !== '' || searchTerm !== '' || patentNis !== undefined;

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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'white' }}>
              Реестр селекционных достижений
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
              Справочник сортов и селекционных достижений сельскохозяйственных культур
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' }
              }}
            >
              Создать сорт
            </Button>
            <IconButton
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Badge badgeContent={hasFilters ? 1 : 0} color="error">
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Фильтры
            </Button>
          </Badge>
          {hasFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ color: 'white' }}
            >
              Очистить
            </Button>
          )}
          <Chip
            label={`${totalCount} сортов`}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 600
            }}
          />
        </Stack>
      </Paper>

      {/* Filters */}
      <Collapse in={filtersExpanded}>
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Stack spacing={3}>
              {/* Search */}
              <TextField
                placeholder="Поиск по названию, коду, заявителю..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                  }
                }}
              />

              {/* Filters Row */}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel>Группа культур</InputLabel>
                  <Select
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value as number | '');
                      setSelectedCulture('');
                    }}
                    label="Группа культур"
                    disabled={groupsLoading}
                    sx={{ bgcolor: 'white' }}
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

                <FormControl sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel>Культура</InputLabel>
                  <Select
                    value={selectedCulture}
                    onChange={(e) => setSelectedCulture(e.target.value as number | '')}
                    label="Культура"
                    disabled={culturesLoading}
                    sx={{ bgcolor: 'white' }}
                  >
                    <MenuItem value="">
                      <em>Все культуры</em>
                    </MenuItem>
                    {cultures.map((culture) => (
                      <MenuItem key={culture.id} value={culture.id}>
                        {culture.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={patentNis === true}
                      onChange={(e) => setPatentNis(e.target.checked ? true : undefined)}
                    />
                  }
                  label="Только патенты НИС"
                  sx={{ alignSelf: 'center' }}
                />
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Collapse>

      {/* Results */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : !sorts || sorts.length === 0 ? (
        <Paper elevation={1} sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {hasFilters ? 'Сорта не найдены по заданным критериям' : 'Введите критерии поиска для просмотра сортов'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Попробуйте изменить параметры поиска или очистить фильтры
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sorts.map((sort) => (
            <Grid 
              item 
              xs={12} 
              sm={viewMode === 'grid' ? 6 : 12} 
              md={viewMode === 'grid' ? 4 : 12} 
              lg={viewMode === 'grid' ? 3 : 12} 
              key={sort.id}
            >
              <SortCard sort={sort} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Sort Dialog */}
      <CreateSortDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </Container>
  );
};

