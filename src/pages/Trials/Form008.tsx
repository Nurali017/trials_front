import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { useForm008, useSaveForm008 } from '@/hooks/useTrials';
import { Form008StatisticsDialog } from '@/components/forms/Form008StatisticsDialog';
import { debounce } from '@/utils/debounce';

interface Indicator {
  code: string;
  name: string;
  unit: string;
}

interface Participant {
  id: number;
  participant_number: number;
  sort_name: string;
  statistical_group: 0 | 1;
  is_standard: boolean;
  current_results: Record<string, number | null>;
}

interface Form008Data {
  trial: {
    id: number;
    culture_name: string;
    region_name: string;
    harvest_date: string | null;
    status: string;
  };
  participants: Participant[];
  indicators: Indicator[];
}

export const Form008: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const trialId = Number(id);
  const { data: form008Data, isLoading } = useForm008(trialId);
  const { mutate: saveForm, isPending: isSaving } = useSaveForm008();

  // State для данных формы
  const [formData, setFormData] = useState<Record<number, Record<string, number | null>>>({});
  const [harvestDate, setHarvestDate] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [statisticsData, setStatisticsData] = useState<any>(null);
  const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false);

  // Инициализация данных формы
  useEffect(() => {
    if (form008Data) {
      const data = form008Data as Form008Data;
      const initialData: Record<number, Record<string, number | null>> = {};
      
      data.participants.forEach((participant) => {
        // Убедимся что все значения - числа или null
        const cleanResults: Record<string, number | null> = {};
        Object.entries(participant.current_results || {}).forEach(([key, value]) => {
          // Конвертируем в число или null
          if (value === null || value === undefined || value === '') {
            cleanResults[key] = null;
          } else if (typeof value === 'number') {
            cleanResults[key] = value;
          } else {
            // Попытка конвертировать в число
            const numValue = parseFloat(String(value));
            cleanResults[key] = isNaN(numValue) ? null : numValue;
          }
        });
        initialData[participant.id] = cleanResults;
      });
      
      setFormData(initialData);
      setHarvestDate(data.trial.harvest_date || '');
    }
  }, [form008Data]);

  // Автосохранение с debounce
  const autoSave = useCallback(
    debounce((data: Record<number, Record<string, number | null>>, harvest: string) => {
      if (!form008Data) return;

      const participants = Object.entries(data).map(([participantId, results]) => ({
        participant_id: Number(participantId),
        results,
      }));

      saveForm(
        {
          trialId,
          payload: {
            is_final: false,
            harvest_date: harvest || undefined,
            participants,
          },
        },
        {
          onSuccess: () => {
            setLastSaved(new Date());
          },
          onError: (error: any) => {
            console.error('Автосохранение не удалось:', error);
          },
        }
      );
    }, 2000), // 2 секунды debounce
    [trialId, form008Data, saveForm]
  );

  // Обработчик изменения ячейки
  const handleCellChange = (participantId: number, indicatorCode: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    setFormData((prev) => {
      const updated = {
        ...prev,
        [participantId]: {
          ...prev[participantId],
          [indicatorCode]: numValue,
        },
      };
      
      // Автосохранение
      autoSave(updated, harvestDate);
      
      return updated;
    });
  };

  // Сохранить черновик
  const handleSaveDraft = () => {
    if (!form008Data) return;

    const participants = Object.entries(formData).map(([participantId, results]) => ({
      participant_id: Number(participantId),
      results,
    }));

    saveForm(
      {
        trialId,
        payload: {
          is_final: false,
          harvest_date: harvestDate || undefined,
          participants,
        },
      },
      {
        onSuccess: (response) => {
          enqueueSnackbar('Черновик сохранён', { variant: 'success' });
          setLastSaved(new Date());
          
          // Показать статистику
          if (response.statistics) {
            setStatisticsData(response);
            setStatisticsDialogOpen(true);
          }
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  // Отправить форму (финал)
  const handleSubmitFinal = () => {
    if (!form008Data) return;

    if (!harvestDate) {
      enqueueSnackbar('Укажите дату уборки урожая', { variant: 'warning' });
      return;
    }

    const participants = Object.entries(formData).map(([participantId, results]) => ({
      participant_id: Number(participantId),
      results,
    }));

    saveForm(
      {
        trialId,
        payload: {
          is_final: true,
          harvest_date: harvestDate,
          participants,
        },
      },
      {
        onSuccess: (response) => {
          enqueueSnackbar('Форма 008 успешно отправлена!', { variant: 'success' });
          
          // Инвалидация кэша после финального сохранения
          queryClient.invalidateQueries({ queryKey: ['trials', trialId] });
          queryClient.invalidateQueries({ queryKey: ['trials', trialId, 'form008'] });
          queryClient.invalidateQueries({ queryKey: ['trials'] });
          
          // Показать статистику
          if (response.statistics) {
            setStatisticsData(response);
            setStatisticsDialogOpen(true);
          }
          
          // Переход на страницу деталей через 2 секунды
          setTimeout(() => {
            navigate(`/trials/${trialId}`);
          }, 2000);
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!form008Data) {
    return (
      <Alert severity="error">
        Не удалось загрузить форму 008. Возможно, испытание не найдено.
      </Alert>
    );
  }

  const data = form008Data as Form008Data;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <IconButton size="small" onClick={() => navigate(`/trials/${trialId}`)}>
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">
              Форма 008
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {data.trial.culture_name} • {data.trial.region_name}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} alignItems="center">
          {lastSaved && (
            <Chip
              icon={<CheckIcon />}
              label={`Сохранено в ${lastSaved.toLocaleTimeString()}`}
              color="success"
              size="small"
              variant="outlined"
            />
          )}
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveDraft}
            disabled={isSaving}
          >
            Сохранить черновик
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitFinal}
            disabled={isSaving}
            color="primary"
          >
            Отправить форму
          </Button>
        </Box>
      </Box>

      {/* Harvest Date */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          label="Дата уборки урожая"
          type="date"
          value={harvestDate}
          onChange={(e) => {
            setHarvestDate(e.target.value);
            autoSave(formData, e.target.value);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 250 }}
          helperText="Обязательно для финальной отправки"
        />
      </Paper>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          ℹ️ <strong>Автосохранение включено:</strong> Данные автоматически сохраняются через 2 секунды после изменения ячейки.
          Участников: <strong>{data.participants.length}</strong>, Показателей: <strong>{data.indicators.length}</strong>
        </Typography>
      </Alert>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  minWidth: 80, 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                №
              </TableCell>
              <TableCell 
                sx={{ 
                  minWidth: 200, 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  position: 'sticky',
                  left: 80,
                  zIndex: 3,
                }}
              >
                Сорт
              </TableCell>
              {data.indicators.map((indicator) => (
                <TableCell
                  key={indicator.code}
                  sx={{ 
                    minWidth: 150, 
                    fontWeight: 'bold', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                  }}
                >
                  <Tooltip title={indicator.name}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {indicator.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        ({indicator.unit})
                      </Typography>
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.participants
              .sort((a, b) => a.participant_number - b.participant_number)
              .map((participant) => (
                <TableRow key={participant.id} hover>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: participant.is_standard ? 'warning.50' : 'inherit',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                    }}
                  >
                    {participant.participant_number}
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 80,
                      zIndex: 1,
                      bgcolor: participant.is_standard ? 'warning.50' : 'background.paper',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {participant.sort_name}
                      </Typography>
                      {participant.is_standard && (
                        <Chip label="Стандарт" color="warning" size="small" />
                      )}
                    </Box>
                  </TableCell>
                  {data.indicators.map((indicator) => (
                    <TableCell
                      key={indicator.code}
                      sx={{ bgcolor: participant.is_standard ? 'warning.50' : 'inherit' }}
                    >
                      <TextField
                        type="number"
                        size="small"
                        value={
                          formData[participant.id]?.[indicator.code] !== null &&
                          formData[participant.id]?.[indicator.code] !== undefined
                            ? formData[participant.id][indicator.code]
                            : ''
                        }
                        onChange={(e) =>
                          handleCellChange(participant.id, indicator.code, e.target.value)
                        }
                        inputProps={{
                          step: indicator.unit === 'балл' ? 1 : 0.1,
                          min: 0,
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            padding: '8px',
                            textAlign: 'center',
                          },
                        }}
                        fullWidth
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Statistics Dialog */}
      <Form008StatisticsDialog
        open={statisticsDialogOpen}
        onClose={() => setStatisticsDialogOpen(false)}
        data={statisticsData}
      />
    </Box>
  );
};

