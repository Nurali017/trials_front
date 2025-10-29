import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { usePatentsCultureGroups, usePatentsCultures } from '@/hooks/usePatents';
import { useOriginators } from '@/hooks/useDictionaries';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { OriginatorDialog } from './OriginatorDialog';
import apiClient from '@/api/client';
import type { OriginatorWithPercentage } from '@/types/api.types';
import { invalidateSortQueries } from '@/utils/queryKeys';

interface CreateSortDialogProps {
  open: boolean;
  onClose: () => void;
  culture?: any;
  cultureGroup?: any;
  onSuccess?: (newSortId: number) => void;
}

export const CreateSortDialog: React.FC<CreateSortDialogProps> = ({ open, onClose, culture, cultureGroup, onSuccess }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [selectedCulture, setSelectedCulture] = useState<number | ''>('');
  const [patentNis, setPatentNis] = useState(false);
  const [note, setNote] = useState('');

  // Originators state
  const [originators, setOriginators] = useState<OriginatorWithPercentage[]>([]);
  const [originatorDialogOpen, setOriginatorDialogOpen] = useState(false);

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const { data: cultureGroups = [], isLoading: groupsLoading } = usePatentsCultureGroups();
  const { data: cultures = [], isLoading: culturesLoading } = usePatentsCultures(
    selectedGroup ? { group: selectedGroup } : undefined
  );
  const { data: originatorsList = [] } = useOriginators();

  // Автовыбор группы культуры и культуры при открытии диалога
  useEffect(() => {
    if (open && cultureGroup && culture) {
      setSelectedGroup(cultureGroup.id);
      setSelectedCulture(culture.id);
    }
  }, [open, cultureGroup, culture]);

  const handleAddOriginator = (originator: OriginatorWithPercentage) => {
    // Check if total percentage would exceed 100%
    const currentTotal = originators.reduce((sum, o) => sum + o.percentage, 0);
    if (currentTotal + originator.percentage > 100) {
      setError('Общий процент оригинаторов не может превышать 100%');
      return;
    }

    // Check if originator already exists
    if (originators.some(o => o.ariginator_id === originator.ariginator_id)) {
      setError('Этот оригинатор уже добавлен');
      return;
    }

    setOriginators([...originators, originator]);
    setError(null);
  };

  const handleRemoveOriginator = (index: number) => {
    setOriginators(originators.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Название сорта обязательно');
      return;
    }

    if (!selectedCulture) {
      setError('Выберите культуру');
      return;
    }

    // Validate originators percentage
    const totalPercentage = originators.reduce((sum, o) => sum + o.percentage, 0);
    if (originators.length > 0 && totalPercentage !== 100) {
      setError('Общий процент оригинаторов должен составлять 100%');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Prepare data for API
      const sortData = {
        name: name.trim(),
        code: code.trim() || '',
        culture: selectedCulture as number,
        lifestyle: 1, // Default value
        characteristic: 1, // Default value
        development_cycle: 1, // Default value
        patent_nis: patentNis,
        note: note.trim() || null,
        status: 4, // Auto status
        ariginators: originators.length > 0 ? originators : undefined,
      };

      // Подготавливаем данные для отправки
      const requestData = {
        name: sortData.name,
        code: sortData.code || null,
        patents_culture_id: sortData.culture,
        patent_nis: sortData.patent_nis || false,
        note: sortData.note || '',
        // Передаем оригинаторов, если Django API поддерживает
        originators: originators.length > 0 ? originators.map(o => ({
          originator_id: o.ariginator_id,
          percentage: o.percentage
        })) : []
      };

      // Call Django API to create sort
      const response = await apiClient.post('/sort-records/', requestData);
      const createdSort = response.data;

      console.log('✨ [CreateSortDialog] Sort created successfully:', {
        django_id: createdSort.id,
        patents_sort_id: createdSort.sort_id,
        name: createdSort.name,
        full_response: createdSort
      });

      // Show success message
      enqueueSnackbar('Сорт успешно создан!', { variant: 'success' });

      // Invalidate queries to refresh the available sorts list
      invalidateSortQueries(queryClient);

      // Call onSuccess callback if provided
      if (onSuccess && createdSort?.sort_id) {
        console.log('📤 [CreateSortDialog] Calling onSuccess with patents_sort_id:', createdSort.sort_id);
        onSuccess(createdSort.sort_id); // Передаем patents_sort_id вместо id записи
      } else if (onSuccess && !createdSort?.sort_id) {
        console.warn('⚠️ [CreateSortDialog] sort_id is missing in response!', createdSort);
      }

      // Reset form and close
      handleClose();
    } catch (err: any) {
      // Обработка ошибок Django REST Framework
      let errorMessage = 'Ошибка при создании сорта';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Если есть общие ошибки
        if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          errorMessage = errorData.non_field_errors.join(', ');
        }
        // Если есть ошибки полей
        else if (typeof errorData === 'object') {
          const fieldErrors = Object.entries(errorData)
            .map(([field, messages]) => {
              const fieldName = field === 'patents_culture_id' ? 'Культура' : 
                              field === 'code' ? 'Код сорта' :
                              field === 'name' ? 'Название' : field;
              return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            })
            .join('; ');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
        // Если есть простое сообщение
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        // Если есть message поле
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setCode('');
    setSelectedGroup('');
    setSelectedCulture('');
    setPatentNis(false);
    setNote('');
    setOriginators([]);
    setOriginatorDialogOpen(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Создать новый сорт
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Name */}
          <TextField
            label="Название сорта"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            placeholder="Например: Казахстанский 70"
          />

          {/* Code */}
          <TextField
            label="Код сорта"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            fullWidth
            placeholder="Например: KZ-70"
          />

          {/* Culture Group and Culture */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Группа культур</InputLabel>
              <Select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value as number | '');
                  setSelectedCulture('');
                }}
                label="Группа культур"
                disabled={groupsLoading || (cultureGroup && cultureGroup.id)}
              >
                <MenuItem value="">
                  <em>Выберите группу</em>
                </MenuItem>
                {cultureGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Культура *</InputLabel>
              <Select
                value={selectedCulture}
                onChange={(e) => setSelectedCulture(e.target.value as number | '')}
                label="Культура *"
                disabled={culturesLoading || (culture && culture.id)}
              >
                <MenuItem value="">
                  <em>Выберите культуру</em>
                </MenuItem>
                {cultures.map((culture) => (
                  <MenuItem key={culture.id} value={culture.id}>
                    {culture.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>


          {/* Patent NIS */}
          <FormControlLabel
            control={
              <Checkbox
                checked={patentNis}
                onChange={(e) => setPatentNis(e.target.checked)}
              />
            }
            label="Патент НИС"
          />

          {/* Note */}
          <TextField
            label="Примечание"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Дополнительная информация о сорте"
          />

          {/* Originators Section */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="div">
                Оригинаторы
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setOriginatorDialogOpen(true)}
                size="small"
              >
                Добавить оригинатора
              </Button>
            </Box>

            {originators.length > 0 ? (
              <List>
                {originators.map((originator, index) => {
                  const originatorData = originatorsList.find(o => o.id === originator.ariginator_id);
                  return (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={originatorData?.name || `Оригинатор #${originator.ariginator_id}`}
                        secondary={`${originator.percentage}%`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveOriginator(index)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Общий процент"
                    secondary={`${originators.reduce((sum, o) => sum + o.percentage, 0)}%`}
                  />
                </ListItem>
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Оригинаторы не добавлены
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Создание...' : 'Создать сорт'}
        </Button>
      </DialogActions>

      {/* Originator Dialog */}
      <OriginatorDialog
        open={originatorDialogOpen}
        onClose={() => setOriginatorDialogOpen(false)}
        onAdd={handleAddOriginator}
      />
    </Dialog>
  );
};
