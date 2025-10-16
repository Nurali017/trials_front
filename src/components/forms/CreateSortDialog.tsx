import React, { useState } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { usePatentsCultureGroups, usePatentsCultures } from '@/hooks/usePatents';
import { patentsService } from '@/api/patents';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

interface CreateSortDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateSortDialog: React.FC<CreateSortDialogProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [selectedCulture, setSelectedCulture] = useState<number | ''>('');
  const [applicant, setApplicant] = useState('');
  const [patentNis, setPatentNis] = useState(false);
  const [note, setNote] = useState('');

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const { data: cultureGroups = [], isLoading: groupsLoading } = usePatentsCultureGroups();
  const { data: cultures = [], isLoading: culturesLoading } = usePatentsCultures(
    selectedGroup ? { group: selectedGroup } : undefined
  );

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
        applicant: applicant.trim(),
        patent_nis: patentNis,
        note: note.trim() || null,
        status: 4, // Auto status
      };

      // Call API
      await patentsService.createSort(sortData);

      // Show success message
      enqueueSnackbar('Сорт успешно создан!', { variant: 'success' });

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['patents-sorts'] });

      // Reset form and close
      handleClose();
    } catch (err: any) {
      console.error('Error creating sort:', err);
      setError(err.response?.data?.message || 'Ошибка при создании сорта');
      enqueueSnackbar('Ошибка при создании сорта', { variant: 'error' });
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
    setApplicant('');
    setPatentNis(false);
    setNote('');
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
                disabled={groupsLoading}
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
                disabled={culturesLoading}
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

          {/* Applicant */}
          <TextField
            label="Заявитель"
            value={applicant}
            onChange={(e) => setApplicant(e.target.value)}
            fullWidth
            placeholder="Название организации"
          />

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
    </Dialog>
  );
};
