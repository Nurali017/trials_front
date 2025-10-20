import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { Recommendation } from '@/types/summary.types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  gsuTested?: number;
  gsuTotal?: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  gsuTested,
  gsuTotal
}) => {
  // Форматируем причину - убираем длинные проценты и добавляем дроби
  const formatReason = (reason: string) => {
    // Сначала заменяем длинные проценты типа "42.857142857142854%" на округленные "42.9%"
    let formatted = reason.replace(/(\d+\.\d{10,})%/g, (match, number) => {
      return `${parseFloat(number).toFixed(1)}%`;
    });

    // Если в тексте есть "Покрытие ГСУ: X.X%" и есть данные, заменяем на дробь
    if (gsuTested !== undefined && gsuTotal !== undefined) {
      formatted = formatted.replace(/Покрытие ГСУ:\s*(\d+\.?\d*)%/gi, () => {
        return `Покрытие ГСУ: ${gsuTested}/${gsuTotal}`;
      });
    } else {
      // Если данных нет, просто убираем длинные проценты
      formatted = formatted.replace(/Покрытие ГСУ:\s*(\d+\.?\d*)%/gi, (match, percent) => {
        return `Покрытие ГСУ: ${percent}%`;
      });
    }

    return formatted;
  };

  const getDecisionSeverity = () => {
    switch (recommendation.decision) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'continue':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getDecisionText = () => {
    switch (recommendation.decision) {
      case 'approved':
        return 'ОДОБРЕНО';
      case 'rejected':
        return 'ОТКЛОНЕНО';
      case 'continue':
        return 'ПРОДОЛЖИТЬ ИСПЫТАНИЯ';
      default:
        return 'НА РАССМОТРЕНИИ';
    }
  };

  const getConfidenceColor = () => {
    switch (recommendation.confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getConfidenceText = () => {
    switch (recommendation.confidence) {
      case 'high':
        return 'ВЫСОКАЯ';
      case 'medium':
        return 'СРЕДНЯЯ';
      case 'low':
        return 'НИЗКАЯ';
      default:
        return 'НЕИЗВЕСТНО';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 2,
        borderRadius: 1,
        border: '2px solid',
        borderColor: `${getDecisionSeverity()}.main`,
        bgcolor: `${getDecisionSeverity()}.lighter`,
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <LightbulbIcon sx={{ color: `${getDecisionSeverity()}.main`, fontSize: 28, mr: 1 }} />
        <Typography variant="h6" fontWeight={700} color={`${getDecisionSeverity()}.main`}>
          РЕКОМЕНДАЦИЯ
        </Typography>
      </Box>

      <Alert
        severity={getDecisionSeverity()}
        icon={false}
        sx={{
          mb: 2,
          fontWeight: 600,
          fontSize: '1rem',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Typography variant="h6" fontWeight={700}>
            {getDecisionText()}
          </Typography>
          <Chip
            label={`Уверенность: ${getConfidenceText()}`}
            color={getConfidenceColor() as any}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Alert>

      <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
        {formatReason(recommendation.reason)}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ mt: 2 }}>
        Обоснование:
      </Typography>

      <Box sx={{ pl: 2 }}>
        <Box display="flex" alignItems="center" mb={1}>
          {recommendation.justification.statistical_criteria.met ? (
            <CheckIcon sx={{ color: 'success.main', fontSize: 20, mr: 1 }} />
          ) : (
            <CancelIcon sx={{ color: 'error.main', fontSize: 20, mr: 1 }} />
          )}
          <Typography variant="body2">
            Статистическая значимость: {formatReason(recommendation.justification.statistical_criteria.description)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          {recommendation.justification.quality_criteria.met ? (
            <CheckIcon sx={{ color: 'success.main', fontSize: 20, mr: 1 }} />
          ) : (
            <CancelIcon sx={{ color: 'error.main', fontSize: 20, mr: 1 }} />
          )}
          <Typography variant="body2">
            Качество: {formatReason(recommendation.justification.quality_criteria.description)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          {recommendation.justification.resistance_criteria.met ? (
            <CheckIcon sx={{ color: 'success.main', fontSize: 20, mr: 1 }} />
          ) : (
            <CancelIcon sx={{ color: 'error.main', fontSize: 20, mr: 1 }} />
          )}
          <Typography variant="body2">
            Устойчивость: {formatReason(recommendation.justification.resistance_criteria.description)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          {recommendation.justification.coverage_criteria.met ? (
            <CheckIcon sx={{ color: 'success.main', fontSize: 20, mr: 1 }} />
          ) : (
            <CancelIcon sx={{ color: 'error.main', fontSize: 20, mr: 1 }} />
          )}
          <Typography variant="body2">
            Покрытие ГСУ: {formatReason(recommendation.justification.coverage_criteria.description)}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" mb={1}>
          <CheckIcon sx={{ color: 'info.main', fontSize: 20, mr: 1 }} />
          <Typography variant="body2">
            Патент ООС: испытание идет
          </Typography>
        </Box>
      </Box>

      {recommendation.improvement_recommendations.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Рекомендации по улучшению:
          </Typography>
          <List dense>
            {recommendation.improvement_recommendations.map((rec, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <LightbulbIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={formatReason(rec)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};
