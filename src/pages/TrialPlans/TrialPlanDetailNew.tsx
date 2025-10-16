import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Science as TrialTypeIcon,
  Person as ParticipantIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTrialPlan, useDeleteTrialPlan } from '../../hooks/useTrialPlans';
import { AddCultureToPlanDialog } from '../../components/trialPlans/AddCultureToPlanDialog';
import { AddTrialTypeToCultureDialog } from '../../components/trialPlans/AddTrialTypeToCultureDialog';
import { BulkAddParticipantsDialog } from '../../components/trialPlans/BulkAddParticipantsDialog';
import type { PlanCulture, PlanCultureTrialType, TrialPlanParticipant } from '../../api/trialPlans';

const TrialPlanDetailNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [addCultureDialogOpen, setAddCultureDialogOpen] = useState(false);
  const [addTrialTypeDialogOpen, setAddTrialTypeDialogOpen] = useState(false);
  const [addParticipantsDialogOpen, setAddParticipantsDialogOpen] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState<PlanCulture | null>(null);
  const [selectedTrialType, setSelectedTrialType] = useState<{ 
    trialType: PlanCultureTrialType; 
    culture: PlanCulture 
  } | null>(null);

  const { data: trialPlan, isLoading, error } = useTrialPlan(Number(id));
  const deleteTrialPlan = useDeleteTrialPlan();

  const handleDelete = () => {
    if (trialPlan && window.confirm(`Удалить план "${trialPlan.oblast_name} ${trialPlan.year}"?`)) {
      deleteTrialPlan.mutate(Number(id), {
        onSuccess: () => {
          enqueueSnackbar('План удален', { variant: 'success' });
          navigate('/trial-plans');
        },
      });
    }
  };

  const handleAddTrialType = (culture: PlanCulture) => {
    setSelectedCulture(culture);
    setAddTrialTypeDialogOpen(true);
  };

  const handleAddParticipants = (culture: PlanCulture, trialType: PlanCultureTrialType) => {
    setSelectedTrialType({ culture, trialType });
    setAddParticipantsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !trialPlan) {
    return <Alert severity="error">Ошибка при загрузке плана</Alert>;
  }

  const cultures = trialPlan.cultures || [];

  // Подсчет статистики
  const totalParticipants = cultures.reduce((sum, culture) => {
    return sum + culture.trial_types.reduce((tSum, tt) => tSum + tt.participants.length, 0);
  }, 0);

  const totalTrials = cultures.reduce((sum, culture) => {
    return sum + culture.trial_types.reduce((tSum, tt) => {
      return tSum + tt.participants.reduce((pSum, p) => pSum + p.trials.length, 0);
    }, 0);
  }, 0);

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/trial-plans')}
          sx={{ mb: 2 }}
        >
          Назад к списку
        </Button>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" gutterBottom>
              📋 План {trialPlan.year} | {typeof trialPlan.oblast === 'number' ? trialPlan.oblast_name : trialPlan.oblast.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Культур: {cultures.length} | 
              Участников: {totalParticipants} | 
              Испытаний: {totalTrials}
            </Typography>
            {trialPlan.season && (
              <Chip 
                label={`Сезон: ${trialPlan.season}`} 
                size="small" 
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Добавить культуру">
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddCultureDialogOpen(true)}
              >
                Добавить культуру
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Удалить план
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Cultures List */}
      {cultures.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              План пуст. Добавьте культуры для начала работы.
            </Alert>
          </CardContent>
        </Card>
      ) : (
        cultures.map((culture) => (
          <Card key={culture.id} sx={{ mb: 3 }}>
            <CardContent>
              {/* Culture Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h6">
                    🌾 {culture.culture_name}
                  </Typography>
                  <Chip label={culture.culture_group} color="primary" size="small" />
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TrialTypeIcon />}
                  onClick={() => handleAddTrialType(culture)}
                >
                  Добавить тип испытания
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Trial Types */}
              {culture.trial_types.length === 0 ? (
                <Alert severity="info">
                  Типы испытаний не добавлены. Нажмите "Добавить тип испытания" выше.
                </Alert>
              ) : (
                culture.trial_types.map((trialType) => {
                  const seasonLabels = {
                    spring: 'Весна',
                    autumn: 'Осень',
                    summer: 'Лето',
                    winter: 'Зима',
                  };
                  
                  return (
                  <Accordion key={trialType.id} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        <TrialTypeIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {trialType.trial_type_name}
                        </Typography>
                        <Chip 
                          label={`Сезон: ${seasonLabels[trialType.season]}`} 
                          size="small" 
                          color="info"
                          variant="outlined"
                        />
                        <Chip 
                          label={`Участников: ${trialType.participants.length}`} 
                          size="small" 
                          color="secondary"
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {/* Participants */}
                      {trialType.participants.length === 0 ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Участников пока нет.
                        </Alert>
                      ) : (
                        <Box>
                          {trialType.participants.map((participant) => (
                            <Paper 
                              key={participant.id} 
                              variant="outlined" 
                              sx={{ p: 2, mb: 2 }}
                            >
                              <Stack direction="row" spacing={2} alignItems="flex-start">
                                <Box flex={1}>
                                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                    <ParticipantIcon fontSize="small" color="action" />
                                    <Typography variant="body1" fontWeight={500}>
                                      #{participant.participant_number} - {participant.sort_name || `Сорт ID: ${participant.patents_sort_id}`}
                                    </Typography>
                                  </Stack>
                                  
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip 
                                      label={`Группа: ${participant.maturity_group}`} 
                                      size="small" 
                                    />
                                    <Chip 
                                      label={participant.statistical_group === 0 ? 'Стандарт' : 'Испытываемый'} 
                                      size="small"
                                      color={participant.statistical_group === 0 ? 'default' : 'primary'}
                                    />
                                    <Chip 
                                      label={`Семена: ${participant.seeds_provision}`} 
                                      size="small"
                                      variant="outlined"
                                    />
                                    {participant.application_id && (
                                      <Chip 
                                        label={`Заявка #${participant.application_id}`} 
                                        size="small"
                                        color="info"
                                      />
                                    )}
                                  </Stack>

                                  {/* Trials (Regions) */}
                                  {participant.trials.length > 0 && (
                                    <Box mt={2}>
                                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                        Регионы ({participant.trials.length}):
                                      </Typography>
                                      <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {participant.trials.map((trial) => (
                                          <Chip
                                            key={trial.id}
                                            label={`${trial.region_name} (${trial.seeding_rate})`}
                                            size="small"
                                            variant="outlined"
                                            color="success"
                                          />
                                        ))}
                                      </Stack>
                                    </Box>
                                  )}
                                </Box>
                              </Stack>
                            </Paper>
                          ))}
                        </Box>
                      )}

                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                        onClick={() => handleAddParticipants(culture, trialType)}
                      >
                        Добавить участников
                      </Button>
                    </AccordionDetails>
                  </Accordion>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialogs */}
      <AddCultureToPlanDialog
        open={addCultureDialogOpen}
        onClose={() => setAddCultureDialogOpen(false)}
        trialPlanId={Number(id)}
        existingCultureIds={cultures.map(c => c.culture)}
      />

      {selectedCulture && (
        <AddTrialTypeToCultureDialog
          open={addTrialTypeDialogOpen}
          onClose={() => {
            setAddTrialTypeDialogOpen(false);
            setSelectedCulture(null);
          }}
          trialPlanId={Number(id)}
          cultureId={selectedCulture.culture}
          cultureName={selectedCulture.culture_name}
          existingTrialTypeIds={selectedCulture.trial_types.map(tt => tt.trial_type_id)}
        />
      )}

      {selectedTrialType && (
        <BulkAddParticipantsDialog
          open={addParticipantsDialogOpen}
          onClose={() => {
            setAddParticipantsDialogOpen(false);
            setSelectedTrialType(null);
          }}
          trialPlanId={Number(id)}
          cultureId={selectedTrialType.culture.culture}
          cultureName={selectedTrialType.culture.culture_name}
          trialTypeId={selectedTrialType.trialType.trial_type_id}
          trialTypeName={selectedTrialType.trialType.trial_type_name}
          oblastId={typeof trialPlan.oblast === 'number' ? trialPlan.oblast : trialPlan.oblast.id}
        />
      )}
    </Box>
  );
};

export default TrialPlanDetailNew;

