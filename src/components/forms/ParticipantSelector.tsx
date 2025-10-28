import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Alert,
  Autocomplete,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSortRecords } from '@/hooks/useDictionaries';
import type { StatisticalGroup } from '@/types/api.types';

interface ParticipantFormItem {
  id: string;
  sort_record: number | null;
  statistical_group: StatisticalGroup;
  participant_number: number;
  application?: number;
}

interface SuggestedParticipant {
  application_id: number;
  application_number: string;
  sort_record: number;
  sort_name: string;
}

interface ParticipantSelectorProps {
  cultureId: number;
  participants: ParticipantFormItem[];
  onChange: (participants: ParticipantFormItem[]) => void;
  disabled?: boolean;
  suggestedParticipants?: SuggestedParticipant[]; // Рекомендуемые из заявок
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  cultureId,
  participants,
  onChange,
  disabled = false,
  suggestedParticipants = [],
}) => {
  const { data: sortRecords } = useSortRecords({ culture: cultureId });
  
  // Deduplicate sorts by ID to avoid duplicate key warnings
  const sortsArray = React.useMemo(() => {
    if (!sortRecords) return [];
    const uniqueSorts = new Map();
    sortRecords.forEach((sort: any) => {
      if (!uniqueSorts.has(sort.id)) {
        uniqueSorts.set(sort.id, sort);
      }
    });
    return Array.from(uniqueSorts.values());
  }, [sortRecords]);

  // Валидация культуры отключена - можно добавлять любые сорта
  const validateCulture = (sortRecord: any): boolean => {
    return true; // Всегда разрешаем
  };

  const addParticipant = () => {
    const newNumber = participants.length > 0 
      ? Math.max(...participants.map(p => p.participant_number)) + 1 
      : 1;
    
    onChange([
      ...participants,
      {
        id: Math.random().toString(),
        sort_record: null,
        statistical_group: 1, // По умолчанию - испытываемый
        participant_number: newNumber,
      },
    ]);
  };

  const removeParticipant = (id: string) => {
    onChange(participants.filter(p => p.id !== id));
  };

  const updateParticipant = (id: string, field: keyof ParticipantFormItem, value: any) => {
    // Валидация при изменении sort_record
    if (field === 'sort_record' && value) {
      const sortRecord = sortsArray.find(s => s.id === value);
      if (sortRecord && !validateCulture(sortRecord)) {
        return;
      }
    }
    
    onChange(
      participants.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  // Добавить рекомендуемого участника из заявки
  const addSuggestedParticipant = (suggested: SuggestedParticipant, asStandard: boolean = false) => {
    const newNumber = participants.length > 0 
      ? Math.max(...participants.map(p => p.participant_number)) + 1 
      : 1;
    
    onChange([
      ...participants,
      {
        id: Math.random().toString(),
        sort_record: suggested.sort_record,
        statistical_group: asStandard ? 0 : 1, // 0 = Стандарт, 1 = Испытываемый
        participant_number: newNumber,
        application: suggested.application_id,
      },
    ]);
  };

  // Проверка наличия стандарта
  const standardsCount = participants.filter(p => p.statistical_group === 0).length;
  const hasStandard = standardsCount > 0;

  // Проверка какие заявки уже добавлены
  const addedApplicationIds = participants
    .filter(p => p.application)
    .map(p => p.application);

  return (
    <Box>
      {/* Рекомендуемые участники из заявок */}
      {suggestedParticipants.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.50', borderLeft: 4, borderColor: 'info.main' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Рекомендуемые сорта из заявок ({suggestedParticipants.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Эти сорта распределены для вашего ГСУ. Вы можете добавить их как <strong>испытываемые</strong> или как <strong>стандарты ⭐</strong>, либо пропустить.
          </Typography>

          <Box display="flex" flexDirection="column" gap={1}>
            {suggestedParticipants.map((suggested) => {
              const isAdded = addedApplicationIds.includes(suggested.application_id);
              
              return (
                <Box 
                  key={suggested.application_id}
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={1.5}
                  bgcolor="background.paper"
                  borderRadius={1}
                  border={1}
                  borderColor="divider"
                >
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {suggested.sort_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Заявка: {suggested.application_number}
                    </Typography>
                  </Box>
                  {isAdded ? (
                    <Chip label="✓ Добавлено" color="success" size="small" />
                  ) : (
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => addSuggestedParticipant(suggested, false)}
                        disabled={disabled}
                      >
                        Как испытываемый
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => addSuggestedParticipant(suggested, true)}
                        disabled={disabled}
                        startIcon={<span>⭐</span>}
                      >
                        Как стандарт
                      </Button>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Основная таблица участников */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Участники испытания ({participants.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasStandard ? (
                <span style={{ color: 'green' }}>✓ Стандартов: {standardsCount}</span>
              ) : (
                <span style={{ color: 'red' }}>⚠ Стандарт не выбран</span>
              )}
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={addParticipant}
            disabled={disabled}
          >
            Добавить участника
          </Button>
        </Box>

        {!hasStandard && participants.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>ОБЯЗАТЕЛЬНО:</strong> Выберите минимум 1 стандартный сорт (группа = Стандарт).
            Стандарт нужен для сравнения результатов всех остальных участников.
          </Alert>
        )}

        {participants.length < 3 && participants.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Рекомендуется минимум 3 участника для статистической достоверности
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>№</TableCell>
                <TableCell>Сорт</TableCell>
                <TableCell width={180}>Группа</TableCell>
                <TableCell width={150}>Заявка</TableCell>
                <TableCell width={60}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box py={4}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Нажмите "Добавить участника" для начала
                      </Typography>
                      {suggestedParticipants.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          или выберите из рекомендуемых сортов выше
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                participants
                  .sort((a, b) => a.participant_number - b.participant_number)
                  .map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={participant.participant_number}
                          onChange={(e) =>
                            updateParticipant(participant.id, 'participant_number', parseInt(e.target.value))
                          }
                          disabled={disabled}
                          sx={{ width: 60 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          options={sortsArray}
                          getOptionLabel={(option) => option.name}
                          value={(() => {
                            // Ищем сорт по ID, учитывая что participant.sort_record может быть Patents ID
                            const found = sortsArray.find(s => s.id === participant.sort_record);
                            if (found) {
                              return found;
                            }
                            
                            // Если не найден, возможно participant.sort_record это Patents ID
                            // Ищем по sort_id (если есть) или по name из suggestedParticipants
                            const suggested = suggestedParticipants.find(s => s.sort_record === participant.sort_record);
                            if (suggested) {
                              const foundByName = sortsArray.find(s => s.name === suggested.sort_name);
                              if (foundByName) {
                                return foundByName;
                              } else {
                              }
                            } else {
                            }
                            
                            return null;
                          })()}
                          onChange={(_, value) =>
                            updateParticipant(participant.id, 'sort_record', value?.id || null)
                          }
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Выберите сорт" />
                          )}
                          renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            // Извлекаем culture_name (может быть как прямое поле, так и в объекте culture)
                            const cultureName = option.culture_name 
                              || (typeof option.culture === 'object' ? option.culture.name : null);
                            
                            return (
                              <li key={`sort-${option.id}`} {...otherProps}>
                                <Box>
                                  <Typography variant="body2">{option.name}</Typography>
                                  {cultureName && (
                                    <Typography variant="caption" color="text.secondary">
                                      {cultureName}
                                    </Typography>
                                  )}
                                </Box>
                              </li>
                            );
                          }}
                          disabled={disabled || !!participant.application}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={participant.statistical_group}
                            onChange={(e) =>
                              updateParticipant(participant.id, 'statistical_group', e.target.value)
                            }
                            disabled={disabled}
                          >
                            <MenuItem value={0}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <span>⭐ Стандарт</span>
                              </Box>
                            </MenuItem>
                            <MenuItem value={1}>Испытываемый</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {participant.application ? (
                          <Typography variant="caption" color="primary">
                            {suggestedParticipants.find(s => s.application_id === participant.application)?.application_number || 'Из заявки'}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Вручную
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeParticipant(participant.id)}
                          disabled={disabled}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        {participants.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip 
                label={`Всего: ${participants.length}`} 
                size="small" 
              />
              <Chip 
                label={`Стандартов: ${standardsCount}`} 
                size="small" 
                color={hasStandard ? 'success' : 'error'}
              />
              <Chip 
                label={`Испытываемых: ${participants.filter(p => p.statistical_group === 1).length}`} 
                size="small" 
                color="primary"
              />
              <Chip 
                label={`Из заявок: ${participants.filter(p => p.application).length}`} 
                size="small" 
                color="info"
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
