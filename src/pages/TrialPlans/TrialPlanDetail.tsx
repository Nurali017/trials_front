import React, { useState, useMemo } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useTrialPlan, useDeleteTrialPlan } from '../../hooks/useTrialPlans';
import { useDictionaries } from '../../hooks/useDictionaries';
import { AddParticipantsToPlanDialog } from '../../components/trialPlans/AddParticipantsToPlanDialog';
import { AddCultureToPlanDialog } from '../../components/trialPlans/AddCultureToPlanDialog';
import { AddTrialTypeToCultureDialog } from '../../components/trialPlans/AddTrialTypeToCultureDialog';

// Типы для новой структуры с типами испытаний
interface TrialData {
  id: number;
  region_id: number;
  region_name: string;
  predecessor: string | number;
  predecessor_culture_name?: string;
  seeding_rate: number;
  season: string;
}

interface ParticipantWithTrials {
  id: number;
  patents_sort_id: number;
  sort_name?: string;
  statistical_group: 0 | 1;
  seeds_provision: string;
  participant_number: number;
  maturity_group: string;
  application?: number;
  year_started?: number;
  application_id?: number;
  trials: TrialData[];
  application_submit_year?: number;
}

interface TrialTypeData {
  id: number;
  trial_type_id: number;
  trial_type_name: string;
  season: string;
  participants: ParticipantWithTrials[];
}

interface CultureData {
  id: number;
  culture: number;
  culture_name: string;
  culture_group: string;
  trial_types: TrialTypeData[];
}

const TrialPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const dictionaries = useDictionaries();

  const [filterCulture, setFilterCulture] = useState<number | ''>('');
  const [filterMaturityGroup, setFilterMaturityGroup] = useState<string>('');
  const [addParticipantsDialogOpen, setAddParticipantsDialogOpen] = useState(false);
  const [addCultureDialogOpen, setAddCultureDialogOpen] = useState(false);
  const [addTrialTypeDialogOpen, setAddTrialTypeDialogOpen] = useState(false);
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

  // Загружаем все уникальные patents_sort_id из участников плана для получения названий сортов
  const uniquePatentsSortIds = useMemo(() => {
    if (!trialPlan?.cultures) return [];
    const ids = new Set<number>();
    trialPlan.cultures.forEach((culture: any) => {
      culture.trial_types?.forEach((trialType: any) => {
        trialType.participants?.forEach((participant: any) => {
          if (participant.patents_sort_id) {
            ids.add(participant.patents_sort_id);
          }
        });
      });
    });
    const result = Array.from(ids);
    console.log('🔍 Найдены уникальные patents_sort_id:', result);
    console.log('📊 Данные плана испытаний (новая структура):', trialPlan);
    return result;
  }, [trialPlan]);

  // Загружаем названия сортов по patents_sort_id
  const { data: sortNamesMap = {}, isLoading: isLoadingSortNames } = useQuery({
    queryKey: ['sortNames', uniquePatentsSortIds],
    queryFn: async () => {
      if (uniquePatentsSortIds.length === 0) return {};
      
      console.log('🚀 Загружаем названия сортов для patents_sort_id:', uniquePatentsSortIds);
      
      const promises = uniquePatentsSortIds.map(async (patentsSortId) => {
        try {
          // Используем правильный endpoint для получения сорта по patents_sort_id
          const response = await apiClient.get(`/patents/sorts/${patentsSortId}/`);
          console.log(`✅ Загружен сорт ${patentsSortId}:`, response.data);
          return { [patentsSortId]: response.data?.name || null };
        } catch (error) {
          console.warn(`❌ Не удалось загрузить название сорта для patents_sort_id: ${patentsSortId}`, error);
          return { [patentsSortId]: null };
        }
      });
      
      const results = await Promise.all(promises);
      const finalMap = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      console.log('📋 Итоговая карта названий сортов:', finalMap);
      return finalMap;
    },
    enabled: uniquePatentsSortIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Получить название предшественника
  const getPredecessorName = (predecessor: string | number): string => {
    if (predecessor === 'fallow') return 'Пар';
    if (typeof predecessor === 'number') {
      const culture = dictionaries.cultures?.find((c: any) => c.id === predecessor);
      return culture?.name || `ID ${predecessor}`;
    }
    return predecessor;
  };

  // Получить название сорта
  const getSortName = (participant: ParticipantWithTrials): string => {
    // Сначала проверяем, есть ли sort_name у участника
    if (participant.sort_name) {
      console.log(`✅ Найдено sort_name для участника ${participant.id}:`, participant.sort_name);
      return participant.sort_name;
    }
    
    // Если нет, пытаемся получить из загруженной карты названий
    const sortName = sortNamesMap[participant.patents_sort_id];
    if (sortName) {
      console.log(`✅ Найдено название в sortNamesMap для patents_sort_id ${participant.patents_sort_id}:`, sortName);
      return sortName;
    }
    
    // Отладочная информация
    console.log(`❌ Не найдено название для patents_sort_id ${participant.patents_sort_id}:`, {
      participantId: participant.id,
      patentsSortId: participant.patents_sort_id,
      sortName: participant.sort_name,
      sortNamesMap: sortNamesMap,
      hasSortName: !!participant.sort_name
    });
    
    // Если ничего не найдено, возвращаем fallback
    return `Сорт #${participant.patents_sort_id}`;
  };

  // Берем культуры напрямую из trialPlan.cultures с новой структурой
  const cultureData: CultureData[] = useMemo(() => {
    const plan = trialPlan as any; // Временное приведение типа
    if (!plan?.cultures) return [];

    return plan.cultures.map((culture: any) => ({
      id: culture.id,
      culture: culture.culture,
      culture_name: culture.culture_name,
      culture_group: culture.culture_group,
      trial_types: culture.trial_types || [],
    }));
  }, [trialPlan]);

  // Функции-хелперы (обычные функции, не useMemo)
  // Получаем структуру: регионы с их предшественниками
  const getRegionsWithPredecessors = (participants: ParticipantWithTrials[]) => {
    // Map: region_id -> Set of predecessors
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
    
    // Конвертируем в массив с сортировкой
    const result = Array.from(regionPredMap.entries()).map(([region_id, data]) => ({
      region_id,
      region_name: data.name,
      predecessors: Array.from(data.predecessors).sort(),
    }));
    
    console.log('📍 Регионы с предшественниками:', result);
    return result;
  };

  const getCommonPredecessor = (participants: ParticipantWithTrials[], regionId: number): string => {
    // Получаем все trials для данного региона
    const regionTrials = participants
      .flatMap(p => p.trials)
      .filter(t => t.region_id === regionId);
    
    if (regionTrials.length === 0) return '—';
    
    // Подсчитываем частоту каждого предшественника
    const predecessorCounts = new Map<string, number>();
    regionTrials.forEach(trial => {
      const predName = trial.predecessor_culture_name || getPredecessorName(trial.predecessor);
      predecessorCounts.set(predName, (predecessorCounts.get(predName) || 0) + 1);
    });
    
    // Находим самый распространенный предшественник
    let mostCommon = '—';
    let maxCount = 0;
    predecessorCounts.forEach((count, predName) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = predName;
      }
    });
    
    // Если есть другие предшественники, добавляем их
    const allPredecessors = Array.from(predecessorCounts.keys());
    if (allPredecessors.length > 1) {
      return allPredecessors.join(' / ');
    }
    
    return mostCommon;
  };

  const getCommonSeedingRate = (participants: ParticipantWithTrials[], regionId: number): string => {
    const trial = participants
      .flatMap(p => p.trials)
      .find(t => t.region_id === regionId);
    return trial ? `${trial.seeding_rate}` : '—';
  };

  const groupByMaturity = (participants: ParticipantWithTrials[]) => {
    const groups = new Map<string, ParticipantWithTrials[]>();

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

  const getSeedsIcon = (provision: string) => {
    switch (provision) {
      case 'provided': return '✅';
      case 'imported': return '📦';
      case 'purchased': return '🛒';
      default: return '❌';
    }
  };

  // Функции-хелперы для вычислений (не useMemo)
  const getAllMaturityGroups = () => {
    const groups = new Set<string>();
    cultureData.forEach(c => {
      c.trial_types.forEach(tt => {
        tt.participants.forEach(p => {
          if (p.maturity_group) groups.add(p.maturity_group);
        });
      });
    });
    return Array.from(groups).sort();
  };

  const getStats = () => {
    let totalParticipants = 0;
    let standards = 0;
    let totalTrials = 0;
    
    cultureData.forEach(c => {
      c.trial_types.forEach(tt => {
        tt.participants.forEach(p => {
          totalParticipants++;
          if (p.statistical_group === 0) standards++;
          totalTrials += p.trials.length;
        });
      });
    });
    
    const tested = totalParticipants - standards;
    const cultures = cultureData.length;

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

  // Вычисляемые значения (не useMemo)
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
      {cultureData.length > 0 && (
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
                  {cultureData.map(c => (
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
      {cultureData.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              План пуст. Добавьте культуры для начала работы.
            </Alert>
          </CardContent>
        </Card>
      ) : (
        cultureData.map(culture => (
          <Card key={culture.culture} sx={{ mb: 3 }}>
            <CardContent>
              {/* Заголовок культуры */}
              <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h6">
                    🌾 {culture.culture_name}
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
                  const hasParticipants = trialType.participants.length > 0;
                  
                  // Подсчитываем общее количество столбцов
                  const totalPredColumns = regionsWithPreds.reduce((sum, r) => sum + r.predecessors.length, 0);

                  return (
                    <Box key={trialType.id} sx={{ mb: 3 }}>
                      {/* Заголовок типа испытания */}
                      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="h6" color="primary">
                            📋 {trialType.trial_type_name}
                          </Typography>
                          <Chip label={`Сезон: ${trialType.season}`} color="secondary" size="small" />
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

                      {/* Таблица участников */}
                      {!hasParticipants ? (
                        <Alert severity="info">
                          Участников пока нет. Нажмите "Добавить участников" выше.
                        </Alert>
                      ) : (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              {/* Первая строка - Названия регионов */}
                              <TableRow>
                                <TableCell rowSpan={3} sx={{ fontWeight: 'bold', minWidth: 50 }}>№</TableCell>
                                <TableCell rowSpan={3} sx={{ fontWeight: 'bold', minWidth: 200 }}>Сорт</TableCell>
                                <TableCell rowSpan={3} sx={{ fontWeight: 'bold', minWidth: 80 }}>Год</TableCell>
                                
                                {regionsWithPreds.map(region => (
                                  <TableCell 
                                    key={region.region_id} 
                                    colSpan={region.predecessors.length} 
                                    align="center" 
                                    sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'white' }}
                                  >
                                    {region.region_name}
                                  </TableCell>
                                ))}
                                
                                <TableCell rowSpan={3} align="center" sx={{ fontWeight: 'bold', minWidth: 80 }}>Всего</TableCell>
                                <TableCell rowSpan={3} align="center" sx={{ fontWeight: 'bold', minWidth: 100 }}>Семена</TableCell>
                              </TableRow>
                              
                              {/* Вторая строка - Предшественники */}
                              <TableRow>
                                {regionsWithPreds.map(region => 
                                  region.predecessors.map((pred, idx) => (
                                    <TableCell 
                                      key={`${region.region_id}-pred-${idx}`} 
                                      align="center" 
                                      sx={{ fontSize: '0.75rem', fontWeight: 600, bgcolor: 'grey.100' }}
                                    >
                                      {pred}
                                    </TableCell>
                                  ))
                                )}
                              </TableRow>
                              
                              {/* Третья строка - Норма высева */}
                              <TableRow>
                                {regionsWithPreds.map(region => 
                                  region.predecessors.map((pred, idx) => (
                                    <TableCell 
                                      key={`${region.region_id}-rate-${idx}`} 
                                      align="center" 
                                      sx={{ fontSize: '0.75rem', bgcolor: 'grey.50' }}
                                    >
                                      {getCommonSeedingRate(trialType.participants, region.region_id)}
                                    </TableCell>
                                  ))
                                )}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {maturityGroups.map(({ group, participants }) => (
                                <React.Fragment key={group}>
                                  {/* Заголовок группы спелости */}
                                  <TableRow>
                                    <TableCell 
                                      colSpan={totalPredColumns + 5} 
                                      sx={{
                                        bgcolor: 'grey.100', 
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        py: 0.5,
                                      }}
                                    >
                                      {group}
                                    </TableCell>
                                  </TableRow>

                                  {/* Участники */}
                                  {participants.map((participant, idx) => {
                                    return (
                                      <TableRow key={participant.id} hover>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body2" fontWeight={500}>
                                              {getSortName(participant)}
                                            </Typography>
                                            {isLoadingSortNames && !participant.sort_name && (
                                              <CircularProgress size={12} />
                                            )}
                                            {participant.application && (
                                              <Chip 
                                                label={`Заявка #${participant.application}`} 
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                              />
                                            )}
                                          </Box>
                                        </TableCell>
                                        <TableCell>{participant.application_submit_year || participant.year_started || '—'}</TableCell>

                                        {regionsWithPreds.map(region => 
                                          region.predecessors.map((pred, predIdx) => {
                                            // Проверяем, есть ли trial с этим регионом И этим предшественником
                                            const matchingTrial = participant.trials.find(t => {
                                              const predName = t.predecessor_culture_name || getPredecessorName(t.predecessor);
                                              return t.region_id === region.region_id && predName === pred;
                                            });
                                            
                                            return (
                                              <TableCell key={`${region.region_id}-${pred}-${predIdx}`} align="center">
                                                {matchingTrial ? (
                                                  <Typography variant="body2" fontWeight={600}>
                                                    Х {participant.statistical_group === 0 ? 'ст' : participant.statistical_group === 1 ? '' : 'б/ст'}
                                                  </Typography>
                                                ) : (
                                                  <Typography variant="body2" color="text.disabled">—</Typography>
                                                )}
                                              </TableCell>
                                            );
                                          })
                                        )}

                                        <TableCell align="center">{participant.trials.length}</TableCell>
                                        <TableCell align="center">{getSeedsIcon(participant.seeds_provision)}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Диалоги */}
      <AddCultureToPlanDialog
        open={addCultureDialogOpen}
        onClose={() => setAddCultureDialogOpen(false)}
        trialPlanId={Number(id)}
        existingCultureIds={cultureData.map(c => c.culture)}
      />

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
          existingTrialTypeIds={cultureData
            .find(c => c.culture === selectedCultureForTrialType.cultureId)
            ?.trial_types.map(tt => tt.trial_type_id) || []}
        />
      )}
    </Box>
  );
};

export default TrialPlanDetail;
