import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useCreateTrialFromPlan, useTrialPlan } from '@/hooks/useTrialPlans';

interface Task {
  plan_id: number;
  culture_id: number;
  culture_name: string;
  participants_count: number;
  trial_created: boolean;
  can_start: boolean;
}

interface CreateTrialFromPlanDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task;
  regionId: number;
}

export const CreateTrialFromPlanDialog: React.FC<CreateTrialFromPlanDialogProps> = ({
  open,
  onClose,
  task,
  regionId,
}) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createTrial, isPending } = useCreateTrialFromPlan();
  const { data: trialPlan, isLoading: planLoading } = useTrialPlan(task.plan_id);

  const [areaHa, setAreaHa] = useState<number>(0.5);
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [excludeParticipants, setExcludeParticipants] = useState<number[]>([]);

  // Получаем всех участников для данной культуры
  const getParticipantsForCulture = () => {
    if (!trialPlan?.cultures) return [];
    
    const culture = trialPlan.cultures.find(c => c.culture === task.culture_id);
    if (!culture) return [];
    
    const allParticipants: any[] = [];
    culture.trial_types.forEach(trialType => {
      trialType.participants.forEach(participant => {
        if (!allParticipants.find(p => p.patents_sort_id === participant.patents_sort_id)) {
          allParticipants.push(participant);
        }
      });
    });
    
    return allParticipants;
  };

  // Получаем всех участников для данной культуры
  const participants = getParticipantsForCulture();

  const handleParticipantToggle = (participantId: number) => {
    setExcludeParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSubmit = () => {
    if (areaHa <= 0) {
      enqueueSnackbar('Укажите площадь испытания больше 0', { variant: 'warning' });
      return;
    }

    if (!responsiblePerson.trim()) {
      enqueueSnackbar('Укажите ответственное лицо', { variant: 'warning' });
      return;
    }

    createTrial(
      {
        planId: task.plan_id,
        data: {
          region_id: regionId,
          culture_id: task.culture_id,
          area_ha: areaHa,
          responsible_person: responsiblePerson,
          exclude_participants: excludeParticipants.length > 0 ? excludeParticipants : undefined,
        },
      },
      {
        onSuccess: (response: any) => {
          enqueueSnackbar('Испытание успешно создано!', { variant: 'success' });
          onClose();
          
          // Переход на страницу деталей Trial
          if (response.trial_id) {
            navigate(`/trials/${response.trial_id}`);
          }
        },
        onError: (error: any) => {
          enqueueSnackbar(
            `Ошибка: ${error.response?.data?.message || error.message}`,
            { variant: 'error' }
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Начать испытание
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Info about task */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Культура:</strong> {task.culture_name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Участников в плане:</strong> {task.participants_count}
            </Typography>
            <Typography variant="body2">
              <strong>Год испытания:</strong> {trialPlan?.year || 'Не указан'}
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Площадь испытания (га)"
                type="number"
                fullWidth
                required
                value={areaHa}
                onChange={(e) => setAreaHa(Number(e.target.value))}
                inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                helperText="Укажите площадь в гектарах"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="ФИО ответственного"
                fullWidth
                required
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                placeholder="Иванов Иван Иванович"
                helperText="Агроном или специалист, ответственный за испытание"
              />
            </Grid>

            {/* Участники для исключения */}
            {planLoading ? (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              </Grid>
            ) : participants.length > 0 ? (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Участники для исключения (опционально)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Выберите участников, которых нужно исключить из испытания:
                </Typography>
                
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <List dense>
                    {participants.map((participant, index) => (
                      <React.Fragment key={participant.patents_sort_id}>
                        <ListItem>
                          <ListItemIcon>
                            <Checkbox
                              checked={excludeParticipants.includes(participant.patents_sort_id)}
                              onChange={() => handleParticipantToggle(participant.patents_sort_id)}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box>
                                <Typography variant="body1" fontWeight={500}>
                                  {participant.sort_name || `Сорт #${participant.patents_sort_id}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {participant.patents_sort_id}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Группа: {participant.statistical_group === 0 ? 'Стандарт' : 'Испытываемый'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Семена: {participant.seeds_provision === 'provided' ? 'Предоставлены' : 'Не предоставлены'}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Группа спелости: {participant.maturity_group}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < participants.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
                
                {excludeParticipants.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Исключено участников: {excludeParticipants.length} из {participants.length}
                    </Typography>
                  </Alert>
                )}
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    Участники для данной культуры не найдены в плане
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              После создания испытания вы сможете заполнить форму 008 с результатами полевых наблюдений.
              Год испытания будет взят из плана.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? <CircularProgress size={24} /> : 'Создать испытание'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

