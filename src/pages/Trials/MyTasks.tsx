import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PlayArrow as StartIcon } from '@mui/icons-material';
import { useOblasts, useRegions } from '@/hooks/useDictionaries';
import { useMyTasks } from '@/hooks/useTrialPlans';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { CreateTrialFromPlanDialog } from '@/components/forms/CreateTrialFromPlanDialog';

interface Task {
  plan_id: number;
  culture_id: number;
  culture_name: string;
  participants_count: number;
  trial_created: boolean;
  can_start: boolean;
}

export const MyTasks: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const [oblast, setOblast] = useState<number | ''>('');
  const [region, setRegion] = useState<number | ''>('');
  const [year, setYear] = useState<number>(currentYear);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: oblasts } = useOblasts();
  const { data: allRegions } = useRegions();
  const { data: tasksData, isLoading } = useMyTasks(
    { region_id: region ? Number(region) : undefined, year },
    !!region
  );

  const oblastsArray = oblasts || [];
  const regionsArray = allRegions?.filter(r => !oblast || r.oblast === oblast) || [];
  const tasks: Task[] = tasksData?.tasks || [];

  const handleStartTrial = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Мои задачи по ГСУ
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Выберите область и ГСУ для просмотра задач по планам испытаний
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth required>
              <InputLabel>Область</InputLabel>
              <Select
                value={oblast}
                label="Область"
                onChange={(e) => {
                  setOblast(e.target.value as number | '');
                  setRegion(''); // Сбросить регион при смене области
                }}
              >
                <MenuItem value="">Выберите область</MenuItem>
                {oblastsArray.map((obl: any) => (
                  <MenuItem key={obl.id} value={obl.id}>
                    {obl.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth required disabled={!oblast}>
              <InputLabel>ГСУ (Сортоучасток)</InputLabel>
              <Select
                value={region}
                label="ГСУ (Сортоучасток)"
                onChange={(e) => setRegion(e.target.value as number | '')}
              >
                <MenuItem value="">Выберите ГСУ</MenuItem>
                {regionsArray.map((reg: any) => (
                  <MenuItem key={reg.id} value={reg.id}>
                    {reg.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Год</InputLabel>
              <Select
                value={year}
                label="Год"
                onChange={(e) => setYear(e.target.value as number)}
              >
                {Array.from({ length: 31 }, (_, i) => 2000 + i).map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks Table */}
      {!region ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            👆 Выберите область и ГСУ для просмотра задач
          </Typography>
        </Paper>
      ) : isLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : tasks.length === 0 ? (
        <Alert severity="info">
          Нет задач для выбранного ГСУ и года. Все задачи уже выполнены или план не сформирован.
        </Alert>
      ) : (
        <>
          {/* Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {tasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего задач
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {tasks.filter(t => t.can_start).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Готовы к запуску
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {tasks.filter(t => t.trial_created).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Уже запущены
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {tasks.reduce((sum, t) => sum + t.participants_count, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего участников
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Культура</TableCell>
                  <TableCell align="center">Участников</TableCell>
                  <TableCell align="center">Статус</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.plan_id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {task.culture_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        План №{task.plan_id}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={task.participants_count}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {task.trial_created ? (
                        <Chip 
                          label="Испытание создано" 
                          color="success" 
                          size="small"
                        />
                      ) : task.can_start ? (
                        <Chip 
                          label="Готово к запуску" 
                          color="info" 
                          size="small"
                        />
                      ) : (
                        <Chip 
                          label="Не готово" 
                          color="default" 
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {!task.trial_created && task.can_start ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<StartIcon />}
                          onClick={() => handleStartTrial(task)}
                        >
                          Начать испытание
                        </Button>
                      ) : task.trial_created ? (
                        <Typography variant="body2" color="text.secondary">
                          Уже создано
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Недоступно
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Dialog for creating trial from plan */}
      {selectedTask && (
        <CreateTrialFromPlanDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          task={selectedTask}
          regionId={Number(region)}
        />
      )}
    </Box>
  );
};

