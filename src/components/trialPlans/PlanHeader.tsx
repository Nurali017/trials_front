import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { TrialPlan } from '../../api/trialPlans';

interface PlanHeaderProps {
  plan: TrialPlan;
  onBack: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const PlanHeader: React.FC<PlanHeaderProps> = ({
  plan,
  onBack,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'warning';
      case 'structured': return 'info';
      case 'distributed': return 'primary';
      case 'finalized': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Запланирован';
      case 'structured': return 'Структурирован';
      case 'distributed': return 'Распределен';
      case 'finalized': return 'Завершен';
      default: return status;
    }
  };

  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
      <Box flex={1}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mb: 1 }}
        >
          Назад к списку
        </Button>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4" component="h1">
            📋 План: {plan.oblast.name} {plan.year}
          </Typography>
          <Chip
            label={getStatusLabel(plan.status)}
            size="medium"
            color={getStatusColor(plan.status) as any}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Создан: {new Date(plan.created_at).toLocaleDateString('ru-RU')} •
          Обновлен: {new Date(plan.updated_at).toLocaleDateString('ru-RU')}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        {onEdit && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onEdit}
          >
            Редактировать
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
          disabled={isDeleting}
        >
          Удалить
        </Button>
      </Stack>
    </Box>
  );
};

export default PlanHeader;
