import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useSummary } from '@/hooks/useSummary';
import {
  RecommendationCard,
  EvaluationScoresCard,
  SummaryInfoCard,
  RegionsDataTable,
  StatisticalAnalysis,
} from '@/components/summary';

interface SummaryViewProps {
  year: number;
  oblastId: number;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ year, oblastId }) => {
  const { data: summaryData, isLoading, error } = useSummary({
    year,
    oblast_id: oblastId,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Ошибка загрузки сводного отчета: {(error as Error).message}
      </Alert>
    );
  }

  if (!summaryData || summaryData.summary_items.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Нет данных для отображения сводного отчета
      </Alert>
    );
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'continue':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDecisionText = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'ОДОБРЕНО';
      case 'rejected':
        return 'ОТКЛОНЕНО';
      case 'continue':
        return 'ПРОДОЛЖИТЬ';
      default:
        return 'НА РАССМОТРЕНИИ';
    }
  };

  // Подсчет статистики
  const approvedCount = summaryData.summary_items.filter(item => item.recommendation.decision === 'approved').length;
  const rejectedCount = summaryData.summary_items.filter(item => item.recommendation.decision === 'rejected').length;
  const avgScore = summaryData.summary_items.reduce((acc, item) => acc + item.evaluation_scores.overall_score, 0) / summaryData.summary_items.length;

  return (
    <Box>
      {/* Статистические карточки */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Box
          flex={1}
          sx={{
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={700} color="primary">
            {summaryData.summary_items.length}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Сортов всего
          </Typography>
        </Box>

        <Box
          flex={1}
          sx={{
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'success.light',
            bgcolor: 'rgba(76, 175, 80, 0.04)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={700} color="success.main">
            {approvedCount}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Одобрено
          </Typography>
        </Box>

        <Box
          flex={1}
          sx={{
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'error.light',
            bgcolor: 'rgba(244, 67, 54, 0.04)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={700} color="error.main">
            {rejectedCount}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Отклонено
          </Typography>
        </Box>

        <Box
          flex={1}
          sx={{
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'warning.light',
            bgcolor: 'rgba(255, 152, 0, 0.04)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={700} color="warning.main">
            {avgScore.toFixed(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Средний балл
          </Typography>
        </Box>
      </Stack>

      {/* Список сортов */}
      {summaryData.summary_items.map((item, index) => (
        <Accordion
          key={item.application_id}
          defaultExpanded={false}
          sx={{
            mb: 2,
            borderRadius: 1,
            border: '2px solid',
            borderColor: `${getDecisionColor(item.recommendation.decision)}.main`,
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              margin: '0 0 16px 0',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              bgcolor: `${getDecisionColor(item.recommendation.decision)}.lighter`,
              '&:hover': {
                bgcolor: `${getDecisionColor(item.recommendation.decision)}.light`,
              },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {item.sort_record?.name ||
                   (item.sort_record?.culture_name ? `${item.sort_record.culture_name} (Заявка ${item.application_number})` :
                   `Заявка №${item.application_number}`)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Заявка: {item.application_number} • Группа: {item.maturity_group_code}
                  {item.maturity_group_name && ` (${item.maturity_group_name})`}
                  {item.sort_record?.originator_name && ` • Оригинатор: ${item.sort_record.originator_name}`}
                </Typography>
              </Box>
              <Chip
                label={getDecisionText(item.recommendation.decision)}
                color={getDecisionColor(item.recommendation.decision) as any}
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 3 }}>
            {/* Рекомендация - ПЕРВАЯ */}
            <RecommendationCard
              recommendation={item.recommendation}
              gsuTested={item.summary.gsu_tested}
              gsuTotal={item.summary.gsu_total}
            />

            {/* Балльная оценка */}
            <EvaluationScoresCard scores={item.evaluation_scores} />

            {/* Сводная информация */}
            <SummaryInfoCard summary={item.summary} />

            {/* Данные по регионам */}
            <RegionsDataTable
              regions={item.regions_data}
              sortName={item.sort_record.name}
              cultureName={item.sort_record.culture_name}
              applicationNumber={item.application_number}
              maturityGroup={item.maturity_group_code}
            />

            {/* Статистический анализ (свернут по умолчанию) */}
            <StatisticalAnalysis analysis={item.statistical_analysis} />

            {/* Зоны */}
            {(item.zones_recommended.length > 0 || item.zones_not_recommended.length > 0) && (
              <Box>
                {item.zones_recommended.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Зоны рекомендуются:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {item.zones_recommended.map((zone, idx) => (
                        <Chip
                          key={idx}
                          label={zone}
                          color="success"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {item.zones_not_recommended.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Зоны не рекомендуются:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {item.zones_not_recommended.map((zone, idx) => (
                        <Chip
                          key={idx}
                          label={zone}
                          color="error"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
