import React from 'react';
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
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddParticipants } from '../../hooks/useTrialPlans';

// Validation schema
const participantSchema = z.object({
  patents_sort_id: z.number().min(1, 'Введите ID сорта'),
  statistical_group: z.union([z.literal(0), z.literal(1)]),
  seeds_provision: z.enum(['provided', 'not_provided'], { required_error: 'Выберите статус семян' }),
  participant_number: z.number().min(1, 'Введите номер участника'),
  maturity_group: z.string().min(1, 'Введите группу спелости'),
  application: z.number().optional(),
});

const participantsSchema = z.object({
  participants: z.array(participantSchema).min(1, 'Добавьте хотя бы одного участника'),
});

type ParticipantsFormData = z.infer<typeof participantsSchema>;

interface AddParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  trialPlanId: number;
  cultureId: number;
  trialTypeId: number;
}

const AddParticipantsDialog: React.FC<AddParticipantsDialogProps> = ({
  open,
  onClose,
  trialPlanId,
  cultureId,
  trialTypeId,
}) => {
  // Queries
  const addParticipants = useAddParticipants();

  // Form
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<ParticipantsFormData>({
    resolver: zodResolver(participantsSchema),
    defaultValues: {
      participants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants',
  });

  const watchedParticipants = watch('participants');

  const handleAddParticipant = () => {
    append({
      patents_sort_id: 0,
      statistical_group: 0,
      seeds_provision: 'provided',
      participant_number: watchedParticipants.length + 1,
      maturity_group: '',
      application: undefined,
    });
  };

  const handleRemoveParticipant = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: ParticipantsFormData) => {
    try {
      await addParticipants.mutateAsync({
        id: trialPlanId,
        data: {
          culture_id: cultureId,
          trial_type_id: trialTypeId,
          participants: data.participants,
        },
      });
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding participants:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Добавить участников
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Добавление участников для культуры ID: {cultureId}, тип испытания ID: {trialTypeId}
          </Alert>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Участники ({fields.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddParticipant}
            >
              Добавить участника
            </Button>
          </Box>

          {fields.length === 0 ? (
            <Alert severity="warning">
              Добавьте участников для продолжения
            </Alert>
          ) : (
            <List>
              {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">
                        Участник #{index + 1}
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveParticipant(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`participants.${index}.patents_sort_id`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="ID сорта (Patents)"
                              type="number"
                              fullWidth
                              error={!!errors.participants?.[index]?.patents_sort_id}
                              helperText={errors.participants?.[index]?.patents_sort_id?.message}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`participants.${index}.participant_number`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Номер участника"
                              type="number"
                              fullWidth
                              error={!!errors.participants?.[index]?.participant_number}
                              helperText={errors.participants?.[index]?.participant_number?.message}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`participants.${index}.statistical_group`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.participants?.[index]?.statistical_group}>
                              <InputLabel>Статистическая группа</InputLabel>
                              <Select {...field} label="Статистическая группа">
                                <MenuItem value={0}>Стандарт</MenuItem>
                                <MenuItem value={1}>Испытываемый</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`participants.${index}.seeds_provision`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.participants?.[index]?.seeds_provision}>
                              <InputLabel>Статус семян</InputLabel>
                              <Select {...field} label="Статус семян">
                                <MenuItem value="provided">Предоставлены</MenuItem>
                                <MenuItem value="not_provided">Не предоставлены</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`participants.${index}.maturity_group`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Группа спелости"
                              fullWidth
                              error={!!errors.participants?.[index]?.maturity_group}
                              helperText={errors.participants?.[index]?.maturity_group?.message}
                              placeholder="Например: M02, M03"
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name={`participants.${index}.application`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="ID заявки (опционально)"
                              type="number"
                              fullWidth
                              error={!!errors.participants?.[index]?.application}
                              helperText={errors.participants?.[index]?.application?.message}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </ListItem>
                  {index < fields.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {errors.participants && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.participants.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={addParticipants.isPending || fields.length === 0}
          >
            {addParticipants.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Сохранение...
              </>
            ) : (
              'Добавить участников'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddParticipantsDialog;
