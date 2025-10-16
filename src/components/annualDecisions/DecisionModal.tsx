import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useMakeDecision, useAnnualDecisionItem } from '@/hooks/useAnnualDecisions';
import type { AnnualDecisionItem, AnnualDecisionFormData } from '@/types/api.types';

interface DecisionModalProps {
  open: boolean;
  onClose: () => void;
  item: AnnualDecisionItem;
  readOnly?: boolean;
  onSuccess: () => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  open,
  onClose,
  item,
  readOnly = false,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: makeDecision, isPending } = useMakeDecision();
  const { data: itemDetail } = useAnnualDecisionItem(item.id, open);

  // Form state
  const [formData, setFormData] = useState<AnnualDecisionFormData>({
    decision: item.decision,
    decision_justification: item.decision_justification || '',
    decision_recommendations: item.decision_recommendations || '',
    continue_reason: item.continue_reason || '',
    continue_until_year: item.continue_until_year || new Date().getFullYear() + 1,
    removal_reason: item.removal_reason || '',
  });

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        decision: item.decision,
        decision_justification: item.decision_justification || '',
        decision_recommendations: item.decision_recommendations || '',
        continue_reason: item.continue_reason || '',
        continue_until_year: item.continue_until_year || new Date().getFullYear() + 1,
        removal_reason: item.removal_reason || '',
      });
    }
  }, [item]);

  const handleInputChange = (field: keyof AnnualDecisionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.decision_justification.trim()) {
      enqueueSnackbar('Обоснование решения обязательно', { variant: 'warning' });
      return;
    }

    if (formData.decision === 'continue' && !formData.continue_reason.trim()) {
      enqueueSnackbar('Укажите причину продления испытаний', { variant: 'warning' });
      return;
    }

    if (formData.decision === 'removed' && !formData.removal_reason.trim()) {
      enqueueSnackbar('Укажите причину снятия с испытаний', { variant: 'warning' });
      return;
    }

    makeDecision(
      { itemId: item.id, data: formData },
      {
        onSuccess: (response) => {
          enqueueSnackbar('Решение успешно сохранено', { variant: 'success' });
          onSuccess();
        },
        onError: (error: any) => {
          enqueueSnackbar(
            `Ошибка сохранения решения: ${error.response?.data?.message || error.message}`,
            { variant: 'error' }
          );
        },
      }
    );
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'success';
      case 'continue':
        return 'warning';
      case 'removed':
        return 'error';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved':
        return '✅';
      case 'continue':
        return '🔄';
      case 'removed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {readOnly ? 'Просмотр решения' : 'Принятие решения'}: {item.sort_name}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Trial Data Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Данные испытаний
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Годы испытаний
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {item.years_tested} год{item.years_tested !== 1 ? 'а' : ''} ({item.year_started} - {item.year_started + item.years_tested - 1})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Средняя урожайность
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {item.average_yield} ц/га
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Отклонение от стандарта
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight={500}
                    color={item.deviation_from_standard > 0 ? 'success.main' : 'text.primary'}
                  >
                    {item.deviation_from_standard > 0 
                      ? `+${item.deviation_from_standard} ц/га` 
                      : item.deviation_from_standard === 0 
                      ? 'На уровне стандарта' 
                      : `${item.deviation_from_standard} ц/га`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Группа спелости
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {item.maturity_group}
                  </Typography>
                </Grid>
              </Grid>

              {/* Yields by Year Table */}
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Урожайность по годам:
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Год</TableCell>
                        <TableCell align="right">Урожайность (ц/га)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(item.yields_by_year).map(([year, yield_value]) => (
                        <TableRow key={year}>
                          <TableCell>{year}</TableCell>
                          <TableCell align="right">{yield_value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Current Decision Status */}
          {item.decision !== 'pending' && (
            <Alert 
              severity={getDecisionColor(item.decision) === 'success' ? 'success' : 
                        getDecisionColor(item.decision) === 'warning' ? 'warning' : 
                        getDecisionColor(item.decision) === 'error' ? 'error' : 'info'}
              sx={{ mb: 3 }}
            >
              <Typography variant="body2">
                <strong>Текущее решение:</strong> {getDecisionIcon(item.decision)} {item.decision_display}
              </Typography>
              {item.decided_by_name && (
                <Typography variant="body2">
                  Принято: {item.decided_by_name} • {item.decision_date && new Date(item.decision_date).toLocaleDateString()}
                </Typography>
              )}
            </Alert>
          )}

          {/* Decision Form */}
          {!readOnly && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">
                  <Typography variant="h6" gutterBottom>
                    ⚖️ Решение
                  </Typography>
                </FormLabel>
                <RadioGroup
                  value={formData.decision}
                  onChange={(e) => handleInputChange('decision', e.target.value)}
                >
                  <FormControlLabel
                    value="approved"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">
                          ✅ Одобрить к включению в Госреестр
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Сорт показал хорошие результаты и рекомендуется для возделывания
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="continue"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">
                          🔄 Продолжить испытания
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Требуется дополнительный год испытаний для принятия решения
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="removed"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1">
                          ❌ Снять с испытаний
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Сорт не рекомендуется для возделывания в регионе
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Conditional Fields */}
              {formData.decision === 'continue' && (
                <Box mt={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Причина продления"
                        value={formData.continue_reason}
                        onChange={(e) => handleInputChange('continue_reason', e.target.value)}
                        multiline
                        rows={2}
                        placeholder="Например: Недостаточно данных, низкая устойчивость к болезням..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Продлить до года"
                        type="number"
                        value={formData.continue_until_year}
                        onChange={(e) => handleInputChange('continue_until_year', parseInt(e.target.value))}
                        inputProps={{
                          min: new Date().getFullYear(),
                          max: new Date().getFullYear() + 3,
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {formData.decision === 'removed' && (
                <Box mt={2}>
                  <TextField
                    fullWidth
                    label="Причина снятия"
                    value={formData.removal_reason}
                    onChange={(e) => handleInputChange('removal_reason', e.target.value)}
                    multiline
                    rows={2}
                    placeholder="Например: Урожайность ниже стандарта, нестабильные показатели..."
                  />
                </Box>
              )}

              <Box mt={2}>
                <TextField
                  fullWidth
                  label="Обоснование решения *"
                  value={formData.decision_justification}
                  onChange={(e) => handleInputChange('decision_justification', e.target.value)}
                  multiline
                  rows={4}
                  placeholder="Подробное обоснование принятого решения на основе данных испытаний..."
                  required
                />
              </Box>

              {formData.decision === 'approved' && (
                <Box mt={2}>
                  <TextField
                    fullWidth
                    label="Рекомендации по возделыванию"
                    value={formData.decision_recommendations}
                    onChange={(e) => handleInputChange('decision_recommendations', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Рекомендации по технологии возделывания, зонам выращивания..."
                  />
                </Box>
              )}
            </>
          )}

          {/* Read-only Decision Display */}
          {readOnly && item.decision !== 'pending' && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  ⚖️ Принятое решение
                </Typography>
                <Chip
                  icon={<span>{getDecisionIcon(item.decision)}</span>}
                  label={item.decision_display}
                  color={getDecisionColor(item.decision) as any}
                  sx={{ mb: 2 }}
                />
                
                {item.decision_justification && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Обоснование:
                    </Typography>
                    <Typography variant="body2">
                      {item.decision_justification}
                    </Typography>
                  </Box>
                )}

                {item.decision_recommendations && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Рекомендации:
                    </Typography>
                    <Typography variant="body2">
                      {item.decision_recommendations}
                    </Typography>
                  </Box>
                )}

                {item.continue_reason && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Причина продления:
                    </Typography>
                    <Typography variant="body2">
                      {item.continue_reason}
                    </Typography>
                  </Box>
                )}

                {item.removal_reason && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Причина снятия:
                    </Typography>
                    <Typography variant="body2">
                      {item.removal_reason}
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          {readOnly ? 'Закрыть' : 'Отмена'}
        </Button>
        {!readOnly && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} /> : undefined}
          >
            {isPending ? 'Сохранение...' : 'Сохранить решение'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};


