import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { useDictionaries } from '@/hooks/useDictionaries';
import { useTrialTypes } from '@/hooks/useTrials';
import type { DistributionItem, PlantingSeason } from '@/types/api.types';

interface DistributeApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (distributions: DistributionItem[]) => void;
  isSubmitting?: boolean;
  targetOblastIds?: number[];
  targetOblastsData?: Array<{ id: number; name: string; code: string }>;
}

interface DistributionFormData {
  oblast: number; // Целевая область (автоматически назначенная)
  region: number; // Выбранный ГСУ
  trial_type: string; // Тип испытания
  planting_season?: PlantingSeason; // Сезон посадки
}

const PLANTING_SEASON_OPTIONS = [
  { value: 'spring' as PlantingSeason, label: 'Весенняя' },
  { value: 'autumn' as PlantingSeason, label: 'Осенняя' },
];

export const DistributeApplicationDialog: React.FC<DistributeApplicationDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  targetOblastIds = [],
  targetOblastsData = [],
}) => {
  const { regions } = useDictionaries();
  const { data: trialTypes } = useTrialTypes();

  const trialTypesArray = trialTypes || [];

  // Инициализация: автоматически создаем распределения для всех целевых областей
  const initializeDistributions = (): DistributionFormData[] => {
    return targetOblastsData.map(oblast => ({
      oblast: oblast.id,
      region: 0,
      trial_type: 'competitive',
      planting_season: undefined,
    }));
  };

  const [distributions, setDistributions] = useState<DistributionFormData[]>(initializeDistributions());

  // Синхронизировать состояние при изменении целевых областей
  React.useEffect(() => {
    if (open && targetOblastsData.length > 0) {
      setDistributions(initializeDistributions());
    }
  }, [open, targetOblastsData.length]);

  const handleUpdateDistribution = (index: number, field: keyof DistributionFormData, value: any) => {
    const updated = [...distributions];
    updated[index] = { ...updated[index], [field]: value };
    setDistributions(updated);
  };

  const handleSubmit = () => {
    // Защита от двойного клика
    if (isSubmitting) return;

    // Валидация
    const errors: string[] = [];

    distributions.forEach((dist) => {
      const oblastName = targetOblastsData.find(o => o.id === dist.oblast)?.name || `Область #${dist.oblast}`;

      if (!dist.region || dist.region === 0) {
        errors.push(`${oblastName}: не выбран ГСУ`);
      }

      if (!dist.trial_type) {
        errors.push(`${oblastName}: не выбран тип испытания`);
      }
    });

    if (errors.length > 0) {
      alert(`Ошибки валидации:\n\n${errors.join('\n')}`);
      return;
    }

    // Формируем payload
    const payload: DistributionItem[] = distributions.map(dist => ({
      region: dist.region,
      trial_type: dist.trial_type,
      planting_season: dist.planting_season,
    }));

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Распределение заявки по областям
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Целевые области:</strong> Для каждой из {targetOblastIds.length} целевых областей выберите ГСУ, тип испытания и сезон посадки.
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {distributions.map((dist, index) => {
              const oblastData = targetOblastsData.find(o => o.id === dist.oblast);
              const availableRegions = regions.filter(r => Number(r.oblast) === Number(dist.oblast));
              const selectedRegion = regions.find(r => r.id === dist.region);

              return (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary">
                        {oblastData?.name || `Область #${dist.oblast}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Целевая область из заявки
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Autocomplete
                      options={availableRegions}
                      getOptionLabel={(option) => option.name}
                      value={selectedRegion || null}
                      onChange={(_, newValue) =>
                        handleUpdateDistribution(index, 'region', newValue?.id || 0)
                      }
                      renderInput={(params) => {
                        const gsuCount = availableRegions.length;

                        return (
                          <TextField
                            {...params}
                            label="ГСУ *"
                            placeholder="Выберите ГСУ"
                            helperText={
                              gsuCount === 0
                                ? `⚠️ В базе данных нет ГСУ для области "${oblastData?.name}". Обратитесь к администратору.`
                                : `Доступно ГСУ: ${gsuCount}`
                            }
                            error={gsuCount === 0}
                          />
                        );
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      noOptionsText="Нет доступных ГСУ для выбранной области"
                    />

                    {/* Тип испытания */}
                    <Autocomplete
                      options={trialTypesArray}
                      getOptionLabel={(option: any) => `${option.name} (${option.category_display})`}
                      value={trialTypesArray.find((t: any) => t.code === dist.trial_type) || null}
                      onChange={(_, newValue: any) =>
                        handleUpdateDistribution(index, 'trial_type', newValue?.code || 'competitive')
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Тип испытания *" />
                      )}
                      isOptionEqualToValue={(option: any, value: any) => option.code === value.code}
                    />

                    {/* Сезон посадки */}
                    <Autocomplete
                      options={PLANTING_SEASON_OPTIONS}
                      getOptionLabel={(option) => option.label}
                      value={PLANTING_SEASON_OPTIONS.find(s => s.value === dist.planting_season) || null}
                      onChange={(_, newValue) =>
                        handleUpdateDistribution(index, 'planting_season', newValue?.value)
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Сезон посадки" placeholder="Выберите сезон (опционально)" />
                      )}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                    />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || distributions.length === 0}
          >
            {isSubmitting ? 'Сохранение...' : 'Распределить'}
          </Button>
        </DialogActions>
      </Dialog>
  );
};
