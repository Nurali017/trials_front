import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Divider,
  Stack,
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  Add as AddIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useDictionaries, useCultures } from '../../hooks/useDictionaries';

interface AddCultureDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (cultureId: number) => void;
  existingCultureIds: number[];
}

const AddCultureDialog: React.FC<AddCultureDialogProps> = ({
  open,
  onClose,
  onAdd,
  existingCultureIds,
}) => {
  const [selectedCultureGroupId, setSelectedCultureGroupId] = useState<number | ''>('');
  const [selectedCultureId, setSelectedCultureId] = useState<number | ''>('');
  const dictionaries = useDictionaries();

  // Загружаем культуры по выбранной группе
  const { data: culturesInGroup = [], isLoading: loadingCultures } = useCultures(
    typeof selectedCultureGroupId === 'number' ? selectedCultureGroupId : undefined
  );

  const availableCultures = (selectedCultureGroupId ? culturesInGroup : dictionaries.cultures).filter(
    (culture: any) => !existingCultureIds.includes(culture.id)
  );

  const handleAdd = () => {
    if (selectedCultureId && typeof selectedCultureId === 'number') {
      onAdd(selectedCultureId);
      setSelectedCultureGroupId('');
      setSelectedCultureId('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedCultureGroupId('');
    setSelectedCultureId('');
    onClose();
  };

  const handleCultureGroupChange = (groupId: number | '') => {
    setSelectedCultureGroupId(groupId);
    setSelectedCultureId(''); // Сбрасываем выбранную культуру при смене группы
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AgricultureIcon />
          <Typography variant="h6">Добавить культуру</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Сначала выберите группу культур, затем конкретную культуру для добавления в план. После добавления культуры вы сможете настроить типы испытаний и добавить участников.
          </Typography>

          <Stack spacing={3}>
            {/* Шаг 1: Выбор группы культур */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CategoryIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2">Шаг 1: Выберите группу культур</Typography>
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Группа культур</InputLabel>
                <Select
                  value={selectedCultureGroupId}
                  onChange={(e) => handleCultureGroupChange(e.target.value as number | '')}
                  label="Группа культур"
                >
                  <MenuItem value="">
                    <em>Все культуры</em>
                  </MenuItem>
                  {dictionaries.cultureGroups.map((group: any) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Шаг 2: Выбор культуры */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AgricultureIcon fontSize="small" color="secondary" />
                <Typography variant="subtitle2">Шаг 2: Выберите культуру</Typography>
              </Stack>
              {loadingCultures ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    Загрузка культур...
                  </Typography>
                </Box>
              ) : availableCultures.length === 0 ? (
                <Alert severity="warning">
                  {selectedCultureGroupId
                    ? 'В выбранной группе нет доступных культур или все уже добавлены в план'
                    : 'Все доступные культуры уже добавлены в план'}
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Культура</InputLabel>
                  <Select
                    value={selectedCultureId}
                    onChange={(e) => setSelectedCultureId(e.target.value as number)}
                    label="Культура"
                    disabled={!selectedCultureGroupId && dictionaries.cultureGroups.length > 0}
                  >
                    {availableCultures.map((culture: any) => (
                      <MenuItem key={culture.id} value={culture.id}>
                        {culture.name}
                        {culture.culture_group_name && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            ({culture.culture_group_name})
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Отмена
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!selectedCultureId || availableCultures.length === 0}
        >
          Добавить культуру
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCultureDialog;
