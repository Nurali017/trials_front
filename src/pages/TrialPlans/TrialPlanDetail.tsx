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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTrialPlan, useDeleteTrialPlan } from '../../hooks/useTrialPlans';
import { useDictionaries } from '../../hooks/useDictionaries';
import { AddCultureToPlanDialog } from '../../components/trialPlans/AddCultureToPlanDialog';
import { AddTrialTypeToCultureDialog } from '../../components/trialPlans/AddTrialTypeToCultureDialog';
import { AddParticipantsToPlanDialog } from '../../components/trialPlans/AddParticipantsToPlanDialog';
import type { TrialPlanParticipant } from '../../api/trialPlans';

const TrialPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const dictionaries = useDictionaries();

  const [filterCulture, setFilterCulture] = useState<number | ''>('');
  const [filterMaturityGroup, setFilterMaturityGroup] = useState<string>('');
  const [addCultureDialogOpen, setAddCultureDialogOpen] = useState(false);
  const [addTrialTypeDialogOpen, setAddTrialTypeDialogOpen] = useState(false);
  const [addParticipantsDialogOpen, setAddParticipantsDialogOpen] = useState(false);
  const [selectedCultureForParticipants, setSelectedCultureForParticipants] = useState<{
    oblastId: number;
    cultureId: number;
    cultureName: string;
    trialTypeId: number;
  } | null>(null);
  const [selectedCultureForTrialType, setSelectedCultureForTrialType] = useState<{
    cultureId: number;
    cultureName: string;
  } | null>(null);

  const { data: trialPlan, isLoading, error } = useTrialPlan(Number(id));
  const deleteTrialPlan = useDeleteTrialPlan();

  // Названия сортов уже приходят в поле sort_name из API

  // Получить название предшественника
  const getPredecessorName = (predecessor: string | number): string => {
    if (predecessor === 'fallow') return 'Пар';
    if (typeof predecessor === 'number') {
      const culture = dictionaries.cultures?.find((c: any) => c.id === predecessor);
      return culture?.name || `ID ${predecessor}`;
    }
    return predecessor;
  };

  // Получить название сезона на русском
  const getSeasonLabel = (season: string): string => {
    const seasonLabels = {
      spring: 'Весна',
      autumn: 'Осень',
      summer: 'Лето',
      winter: 'Зима',
    };
    return seasonLabels[season as keyof typeof seasonLabels] || season;
  };

  // Получить название сорта
  const getSortName = (participant: TrialPlanParticipant): string => {
    return participant.sort_name || `Сорт #${participant.patents_sort_id}`;
  };


  // Получаем структуру: регионы с их предшественниками
  const getRegionsWithPredecessors = (participants: TrialPlanParticipant[]) => {
    const regionPredMap = new Map<number, { name: string; predecessors: Set<string> }>();
    
    participants.forEach(p => {
      p.trials.forEach(t => {
        const predName = t.predecessor_culture_name || getPredecessorName(t.predecessor);
        
        if (!regionPredMap.has(t.region_id)) {
          regionPredMap.set(t.region_id, {
            name: t.region_name,
            predecessors: new Set(),
          });
        }
        
        regionPredMap.get(t.region_id)!.predecessors.add(predName);
      });
    });
    
    return Array.from(regionPredMap.entries()).map(([region_id, data]) => ({
      region_id,
      region_name: data.name,
      predecessors: Array.from(data.predecessors).sort(),
    }));
  };

  const getCommonSeedingRate = (participants: TrialPlanParticipant[], regionId: number): string => {
    const trial = participants
      .flatMap(p => p.trials)
      .find(t => t.region_id === regionId);
    return trial ? `${trial.seeding_rate}` : '—';
  };

  const groupByMaturity = (participants: TrialPlanParticipant[]) => {
    const groups = new Map<string, TrialPlanParticipant[]>();

    participants.forEach(p => {
      const group = p.maturity_group || 'Не указана';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(p);
    });

    return Array.from(groups.entries()).map(([group, items]) => ({
      group,
      participants: items.sort((a, b) => a.participant_number - b.participant_number),
    }));
  };

  const getAllMaturityGroups = () => {
    const groups = new Set<string>();
    if (trialPlan?.cultures) {
      trialPlan.cultures.forEach(c => {
        c.trial_types.forEach(tt => {
          tt.participants.forEach(p => {
            if (p.maturity_group) groups.add(p.maturity_group);
          });
        });
      });
    }
    return Array.from(groups).sort();
  };

  const getStats = () => {
    if (!trialPlan?.cultures) return { totalParticipants: 0, standards: 0, tested: 0, totalTrials: 0, cultures: 0 };
    
    let totalParticipants = 0;
    let standards = 0;
    let totalTrials = 0;
    
    trialPlan.cultures.forEach(c => {
      c.trial_types.forEach(tt => {
        tt.participants.forEach(p => {
          totalParticipants++;
          if (p.statistical_group === 0) standards++;
          totalTrials += p.trials.length;
        });
      });
    });
    
    const tested = totalParticipants - standards;
    const cultures = trialPlan.cultures.length;

    return { totalParticipants, standards, tested, totalTrials, cultures };
  };

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
  const allMaturityGroups = getAllMaturityGroups();
  const stats = getStats();

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
              Культур: {stats.cultures} | 
              Участников: {stats.totalParticipants} (Ст:{stats.standards} | Исп:{stats.tested}) | 
              Trials: {stats.totalTrials}
            </Typography>
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
            <Tooltip title="Экспорт в Excel">
              <IconButton>
                <ExportIcon />
              </IconButton>
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

      {/* Фильтры */}
      {cultures.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Культура</InputLabel>
                <Select
                  value={filterCulture}
                  label="Культура"
                  onChange={(e) => setFilterCulture(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <MenuItem value="">Все культуры</MenuItem>
                  {cultures.map(c => (
                    <MenuItem key={c.culture} value={c.culture}>
                      {c.culture_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Группа спелости</InputLabel>
                <Select
                  value={filterMaturityGroup}
                  label="Группа спелости"
                  onChange={(e) => setFilterMaturityGroup(e.target.value)}
                >
                  <MenuItem value="">Все группы</MenuItem>
                  {allMaturityGroups.map(g => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                size="small"
                onClick={() => {
                  setFilterCulture('');
                  setFilterMaturityGroup('');
                }}
              >
                Сбросить
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Таблицы по культурам и типам испытаний */}
      {cultures.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              План пуст. Добавьте культуры для начала работы.
            </Alert>
          </CardContent>
        </Card>
      ) : (
        cultures.map(culture => (
          <Card key={culture.culture} sx={{ mb: 3 }}>
            <CardContent>
              {/* Заголовок культуры */}
              <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h5" fontWeight="bold">
                    Культура: {culture.culture_name.toLowerCase()}
                  </Typography>
                  <Chip label={culture.culture_group} color="info" size="small" />
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedCultureForTrialType({
                      cultureId: culture.culture,
                      cultureName: culture.culture_name,
                    });
                    setAddTrialTypeDialogOpen(true);
                  }}
                >
                  Добавить тип испытания
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Таблицы по типам испытаний */}
              {culture.trial_types.length === 0 ? (
                <Alert severity="info">
                  Типы испытаний не добавлены. Нажмите "Добавить тип испытания" выше.
                </Alert>
              ) : (
                culture.trial_types.map(trialType => {
                  const regionsWithPreds = getRegionsWithPredecessors(trialType.participants);
                  const maturityGroups = groupByMaturity(trialType.participants);
                  
                  // Подсчитываем общее количество столбцов
                  const totalPredColumns = regionsWithPreds.reduce((sum, r) => sum + r.predecessors.length, 0);

                  return (
                    <Box key={trialType.id} sx={{ mb: 3 }}>
                      {/* Заголовок типа испытания */}
                      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            А) {trialType.trial_type_name.toLowerCase()}
                          </Typography>
                          <Chip label={`Сезон: ${getSeasonLabel(trialType.season)}`} color="secondary" size="small" />
                          <Chip label={`Участников: ${trialType.participants.length}`} variant="outlined" size="small" />
                        </Stack>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedCultureForParticipants({
                              oblastId: typeof trialPlan.oblast === 'number' ? trialPlan.oblast : trialPlan.oblast.id,
                              cultureId: culture.culture,
                              cultureName: culture.culture_name,
                              trialTypeId: trialType.trial_type_id,
                            });
                            setAddParticipantsDialogOpen(true);
                          }}
                        >
                          Добавить участников
                        </Button>
                      </Box>

                      {/* Таблица участников в формате Excel */}
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                          <TableHead>
                            {/* Заголовок таблицы */}
                            <TableRow>
                              <TableCell 
                                colSpan={totalPredColumns + 5} 
                                align="center" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  fontSize: '1.1rem',
                                  bgcolor: '#4A90E2', 
                                  color: 'white',
                                  border: '1px solid #333',
                                  py: 2
                                }}
                              >
                                Культура: {culture.culture_name.toLowerCase()}
                              </TableCell>
                            </TableRow>
                            
                            <TableRow>
                              <TableCell 
                                colSpan={totalPredColumns + 5} 
                                align="left" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  fontSize: '1rem',
                                  bgcolor: '#4A90E2', 
                                  color: 'white',
                                  border: '1px solid #333',
                                  py: 1
                                }}
                              >
                                А) {trialType.trial_type_name.toLowerCase()}
                              </TableCell>
                            </TableRow>
                            
                            {/* Строка с заголовками колонок */}
                            <TableRow>
                              <TableCell 
                                rowSpan={3} 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  minWidth: 50, 
                                  border: '1px solid #333',
                                  bgcolor: '#E8F4FD',
                                  textAlign: 'center',
                                  fontSize: '0.9rem'
                                }}
                              >
                                № п/п
                              </TableCell>
                              <TableCell 
                                rowSpan={3} 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  minWidth: 200, 
                                  border: '1px solid #333',
                                  bgcolor: '#E8F4FD',
                                  fontSize: '0.9rem'
                                }}
                              >
                                сорт
                              </TableCell>
                              <TableCell 
                                rowSpan={3} 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  minWidth: 120, 
                                  border: '1px solid #333',
                                  bgcolor: '#E8F4FD',
                                  fontSize: '0.9rem'
                                }}
                              >
                                год начало испытания по области
                              </TableCell>
                              
                              {regionsWithPreds.map(region => (
                                <TableCell 
                                  key={region.region_id} 
                                  colSpan={region.predecessors.length} 
                                  align="center" 
                                  sx={{ 
                                    fontWeight: 'bold', 
                                    bgcolor: '#4A90E2', 
                                    color: 'white',
                                    border: '1px solid #333',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  {region.region_name}
                                </TableCell>
                              ))}
                              
                              <TableCell 
                                rowSpan={3} 
                                align="center" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  minWidth: 100, 
                                  border: '1px solid #333',
                                  bgcolor: '#E8F4FD',
                                  fontSize: '0.9rem'
                                }}
                              >
                                всего сортоопытов
                              </TableCell>
                              <TableCell 
                                rowSpan={3} 
                                align="center" 
                                sx={{ 
                                  fontWeight: 'bold', 
                                  minWidth: 120, 
                                  border: '1px solid #333',
                                  bgcolor: '#E8F4FD',
                                  fontSize: '0.9rem'
                                }}
                              >
                                обеспеченность семенами
                              </TableCell>
                            </TableRow>
                            
                            {/* Строка с предшественниками */}
                            <TableRow>
                              {regionsWithPreds.map(region => 
                                region.predecessors.map((pred, idx) => (
                                  <TableCell 
                                    key={`${region.region_id}-pred-${idx}`} 
                                    align="center" 
                                    sx={{ 
                                      fontSize: '0.8rem', 
                                      fontWeight: 600, 
                                      bgcolor: '#D1E7F7',
                                      border: '1px solid #333'
                                    }}
                                  >
                                    {pred}
                                  </TableCell>
                                ))
                              )}
                            </TableRow>
                            
                            {/* Строка с коэффициентами высева */}
                            <TableRow>
                              {regionsWithPreds.map(region => 
                                region.predecessors.map((_, idx) => (
                                  <TableCell 
                                    key={`${region.region_id}-rate-${idx}`} 
                                    align="center" 
                                    sx={{ 
                                      fontSize: '0.8rem', 
                                      bgcolor: '#E8F4FD',
                                      border: '1px solid #333'
                                    }}
                                  >
                                    {getCommonSeedingRate(trialType.participants, region.region_id)}
                                  </TableCell>
                                ))
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {maturityGroups.length === 0 ? (
                              <TableRow>
                                <TableCell 
                                  colSpan={totalPredColumns + 5} 
                                  align="center" 
                                  sx={{ 
                                    py: 4,
                                    border: '1px solid #333',
                                    bgcolor: '#F0F8FF'
                                  }}
                                >
                                  <Typography variant="body1" color="text.secondary">
                                    Нет участников. Нажмите "Добавить участников" выше.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              maturityGroups.map(({ group, participants }) => (
                              <React.Fragment key={group}>
                                {/* Заголовок группы спелости */}
                                <TableRow>
                                  <TableCell 
                                    colSpan={totalPredColumns + 5} 
                                    sx={{
                                      bgcolor: '#B8D4F0', 
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem',
                                      py: 1,
                                      border: '1px solid #333',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {group}
                                  </TableCell>
                                </TableRow>

                                {/* Участники */}
                                {participants.map((participant) => {
                                  const participantNumber = participants.findIndex(p => p.id === participant.id) + 1;
                                  const globalNumber = maturityGroups
                                    .slice(0, maturityGroups.findIndex(g => g.group === group))
                                    .reduce((sum, g) => sum + g.participants.length, 0) + participantNumber;
                                  
                                  // Проверяем, есть ли стандарты в этой группе спелости
                                  const hasStandardsInGroup = participants.some(p => p.statistical_group === 0);
                                  
                                  return (
                                    <TableRow key={participant.id} hover>
                                      <TableCell 
                                        align="center"
                                        sx={{ 
                                          border: '1px solid #333',
                                          bgcolor: '#F0F8FF',
                                          fontSize: '0.9rem'
                                        }}
                                      >
                                        {globalNumber}
                                      </TableCell>
                                      <TableCell sx={{ 
                                        border: '1px solid #333',
                                        bgcolor: '#F0F8FF',
                                        fontSize: '0.9rem'
                                      }}>
                                        <Typography variant="body2" fontWeight={500}>
                                          {getSortName(participant)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell 
                                        align="center"
                                        sx={{ 
                                          border: '1px solid #333',
                                          bgcolor: '#F0F8FF',
                                          fontSize: '0.9rem'
                                        }}
                                      >
                                        {participant.application_submit_year || '—'}
                                      </TableCell>

                                      {regionsWithPreds.map(region => 
                                        region.predecessors.map((pred, predIdx) => {
                                          // Проверяем, есть ли trial с этим регионом И этим предшественником
                                          const matchingTrial = participant.trials.find(t => {
                                            const predName = t.predecessor_culture_name || getPredecessorName(t.predecessor);
                                            return t.region_id === region.region_id && predName === pred;
                                          });
                                          
                                          return (
                                            <TableCell
                                              key={`${region.region_id}-${pred}-${predIdx}`}
                                              align="center"
                                              sx={{
                                                border: '1px solid #333',
                                                bgcolor: '#F0F8FF',
                                                fontSize: '0.9rem'
                                              }}
                                            >
                                              {matchingTrial ? (
                                                <Typography variant="body2" fontWeight={600}>
                                                  {participant.statistical_group === 0 && hasStandardsInGroup ? 'Х ст' : (hasStandardsInGroup ? 'Х' : 'Х б/ст')}
                                                </Typography>
                                              ) : (
                                                <Typography variant="body2" color="text.disabled">
                                                  {participant.trials.length > 0 ? 'Нет испытания' : '—'}
                                                </Typography>
                                              )}
                                            </TableCell>
                                          );
                                        })
                                      )}

                                      <TableCell 
                                        align="center"
                                        sx={{ 
                                          border: '1px solid #333',
                                          bgcolor: '#F0F8FF',
                                          fontSize: '0.9rem'
                                        }}
                                      >
                                        {participant.trials.length}
                                      </TableCell>
                                      <TableCell 
                                        align="center"
                                        sx={{ 
                                          border: '1px solid #333',
                                          bgcolor: '#F0F8FF',
                                          fontSize: '0.9rem'
                                        }}
                                      >
                                        {participant.seeds_provision === 'provided' ? 'Предоставлены' : 'Не предоставлены'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </React.Fragment>
                            ))
                            )}
                            
                            {/* Итоговая строка */}
                            {maturityGroups.length > 0 && (
                            <TableRow>
                              <TableCell 
                                colSpan={totalPredColumns + 3}
                                align="right"
                                sx={{ 
                                  fontWeight: 'bold',
                                  border: '1px solid #333',
                                  bgcolor: '#E8F4FD',
                                  fontSize: '0.9rem'
                                }}
                              >
                                Итого:
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{ 
                                  fontWeight: 'bold',
                                  border: '1px solid #333',
                                  bgcolor: '#E8F4FD',
                                  fontSize: '0.9rem'
                                }}
                              >
                                {trialType.participants.reduce((sum, p) => sum + p.trials.length, 0)}
                              </TableCell>
                              <TableCell sx={{ 
                                border: '1px solid #333',
                                bgcolor: '#E8F4FD'
                              }}></TableCell>
                            </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
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

      {selectedCultureForTrialType && (
        <AddTrialTypeToCultureDialog
          open={addTrialTypeDialogOpen}
          onClose={() => {
            setAddTrialTypeDialogOpen(false);
            setSelectedCultureForTrialType(null);
          }}
          trialPlanId={Number(id)}
          cultureId={selectedCultureForTrialType.cultureId}
          cultureName={selectedCultureForTrialType.cultureName}
          existingTrialTypeIds={cultures
            .find(c => c.culture === selectedCultureForTrialType.cultureId)
            ?.trial_types.map(tt => tt.trial_type_id) || []}
        />
      )}

      {selectedCultureForParticipants && (
        <AddParticipantsToPlanDialog
          open={addParticipantsDialogOpen}
          onClose={() => {
            setAddParticipantsDialogOpen(false);
            setSelectedCultureForParticipants(null);
          }}
          trialPlanId={Number(id)}
          oblastId={selectedCultureForParticipants.oblastId}
          cultureId={selectedCultureForParticipants.cultureId}
          trialTypeId={selectedCultureForParticipants.trialTypeId}
          cultureName={selectedCultureForParticipants.cultureName}
        />
      )}
    </Box>
  );
};

export default TrialPlanDetail;

