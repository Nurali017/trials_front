import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Alert,
  Button,
  Grid,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  AutoAwesome as AutoIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import type { AutoStatistics } from '@/types/api.types';

interface AutoStatisticsCardProps {
  autoStatistics?: AutoStatistics;
  onUseAutoCalculation?: (values: {
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
  }) => void;
  disabled?: boolean;
}

export const AutoStatisticsCard: React.FC<AutoStatisticsCardProps> = ({
  autoStatistics,
  onUseAutoCalculation,
  disabled = false,
}) => {
  if (!autoStatistics) {
    return null;
  }

  const handleUseAutoCalculation = () => {
    if (onUseAutoCalculation) {
      onUseAutoCalculation({
        lsd_095: autoStatistics.auto_lsd_095,
        error_mean: autoStatistics.auto_error_mean,
        accuracy_percent: autoStatistics.auto_accuracy_percent,
      });
    }
  };

  const handleCopyValue = (value: number | undefined, label: string) => {
    if (value !== undefined) {
      navigator.clipboard.writeText(value.toString());
    }
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <AutoIcon color="info" />
            <Typography variant="h6" color="info.main">
              Авторасчет статистики
            </Typography>
            <Chip 
              label="Для справки" 
              color="info" 
              size="small" 
              variant="outlined"
            />
          </Box>
        }
        action={
          <Tooltip title="Использовать авторасчет">
            <IconButton 
              onClick={handleUseAutoCalculation}
              disabled={disabled}
              color="info"
            >
              <CheckIcon />
            </IconButton>
          </Tooltip>
        }
      />
      
      <CardContent>
        {/* Предупреждение */}
        {autoStatistics.warning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon />
              <Typography variant="body2">
                {autoStatistics.warning}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Информация о расчете */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Параметры расчета:</strong>
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Участников: {autoStatistics.participants_count || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Повторений: {autoStatistics.replication_count || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Общее среднее: {autoStatistics.grand_mean ? `${autoStatistics.grand_mean.toFixed(2)} ц/га` : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Результаты авторасчета */}
        <Typography variant="subtitle2" gutterBottom color="info.main">
          Рассчитанные значения:
        </Typography>
        
        <Grid container spacing={2}>
          {/* НСР₀.₉₅ */}
          <Grid item xs={4}>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative'
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                НСР₀.₉₅
              </Typography>
              <Typography variant="h6" color="info.main" fontWeight="bold">
                {autoStatistics.auto_lsd_095 ? autoStatistics.auto_lsd_095.toFixed(2) : 'N/A'}
              </Typography>
              {autoStatistics.auto_lsd_095 && (
                <Tooltip title="Копировать значение">
                  <IconButton 
                    size="small" 
                    sx={{ position: 'absolute', top: 4, right: 4 }}
                    onClick={() => handleCopyValue(autoStatistics.auto_lsd_095, 'НСР₀.₉₅')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>

          {/* Ошибка средней */}
          <Grid item xs={4}>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative'
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                E (ошибка средней)
              </Typography>
              <Typography variant="h6" color="info.main" fontWeight="bold">
                {autoStatistics.auto_error_mean ? autoStatistics.auto_error_mean.toFixed(2) : 'N/A'}
              </Typography>
              {autoStatistics.auto_error_mean && (
                <Tooltip title="Копировать значение">
                  <IconButton 
                    size="small" 
                    sx={{ position: 'absolute', top: 4, right: 4 }}
                    onClick={() => handleCopyValue(autoStatistics.auto_error_mean, 'E')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>

          {/* Точность опыта */}
          <Grid item xs={4}>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative'
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                P% (точность)
              </Typography>
              <Typography variant="h6" color="info.main" fontWeight="bold">
                {autoStatistics.auto_accuracy_percent ? `${autoStatistics.auto_accuracy_percent.toFixed(1)}%` : 'N/A'}
              </Typography>
              {autoStatistics.auto_accuracy_percent && (
                <Tooltip title="Копировать значение">
                  <IconButton 
                    size="small" 
                    sx={{ position: 'absolute', top: 4, right: 4 }}
                    onClick={() => handleCopyValue(autoStatistics.auto_accuracy_percent, 'P%')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Примечание */}
        {autoStatistics.note && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <InfoIcon />
              <Typography variant="body2">
                {autoStatistics.note}
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Кнопка использования авторасчета */}
        <Box mt={2} display="flex" justifyContent="center">
          <Button
            variant="outlined"
            color="info"
            startIcon={<AutoIcon />}
            onClick={handleUseAutoCalculation}
            disabled={disabled}
            size="small"
          >
            Использовать авторасчет
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
