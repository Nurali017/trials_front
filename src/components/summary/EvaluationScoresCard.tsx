import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Collapse,
  IconButton,
  Grid,
  Divider,
} from '@mui/material';
import {
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { EvaluationScores, ScoreCriteria } from '@/types/summary.types';

interface EvaluationScoresCardProps {
  scores: EvaluationScores;
}

export const EvaluationScoresCard: React.FC<EvaluationScoresCardProps> = ({ scores }) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'grey';
    if (score >= 4.5) return 'success';
    if (score >= 3.5) return 'warning';
    if (score >= 2.5) return 'orange';
    return 'error';
  };

  const getScoreValue = (score: number | null, maxScore: number) => {
    if (score === null) return 0;
    return (score / maxScore) * 100;
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const stars = [];

    for (let i = 0; i < 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          sx={{
            fontSize: 20,
            color: i < fullStars ? 'warning.main' : 'grey.300',
          }}
        />
      );
    }

    return <Box display="flex">{stars}</Box>;
  };

  const renderCriteria = (criteria: Record<string, ScoreCriteria> | null | undefined) => {
    if (!criteria) return null;
    return Object.entries(criteria).map(([key, criterion]) => (
      <Grid container key={key} spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={8}>
          <Typography variant="body2" color="text.secondary">
            • {criterion?.description || 'Нет описания'}
          </Typography>
        </Grid>
        <Grid item xs={4} textAlign="right">
          <Typography variant="body2" fontWeight={600}>
            {criterion?.score ?? '—'}/{criterion?.max_score ?? '—'}
          </Typography>
        </Grid>
      </Grid>
    ));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <StarIcon sx={{ color: 'warning.main', fontSize: 28, mr: 1 }} />
        <Typography variant="h6" fontWeight={700}>
          БАЛЛЬНАЯ ОЦЕНКА
        </Typography>
      </Box>

      {/* Общий балл */}
      <Box
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 1,
          bgcolor: 'rgba(255, 152, 0, 0.08)',
          border: '1px solid',
          borderColor: 'warning.light',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h5" fontWeight={700} color="warning.main">
            Общий балл: {scores.overall_score.toFixed(1)} / 5.0
          </Typography>
          {renderStars(scores.overall_score)}
        </Box>
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          {scores.score_interpretation}
        </Typography>
      </Box>

      {/* Урожайность */}
      <Box mb={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            Урожайность
          </Typography>
          <Typography variant="body2" fontWeight={700} color={`${getScoreColor(scores.yield_score)}.main`}>
            {scores.yield_score !== null ? `${scores.yield_score.toFixed(1)}/5` : '—'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={getScoreValue(scores.yield_score, 5)}
          sx={{
            height: 8,
            borderRadius: 1,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: scores.yield_score !== null ? `${getScoreColor(scores.yield_score)}.main` : 'grey.400',
            },
          }}
        />
      </Box>

      {/* Качество */}
      <Box mb={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            Качество
          </Typography>
          <Typography variant="body2" fontWeight={700} color={`${getScoreColor(scores.quality_score)}.main`}>
            {scores.quality_score !== null ? `${scores.quality_score.toFixed(1)}/5` : '—'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={getScoreValue(scores.quality_score, 5)}
          sx={{
            height: 8,
            borderRadius: 1,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: scores.quality_score !== null ? `${getScoreColor(scores.quality_score)}.main` : 'grey.400',
            },
          }}
        />
      </Box>

      {/* Устойчивость */}
      <Box mb={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Typography variant="subtitle2" fontWeight={600}>
            Устойчивость
          </Typography>
          <Typography variant="body2" fontWeight={700} color={`${getScoreColor(scores.resistance_score)}.main`}>
            {scores.resistance_score !== null ? `${scores.resistance_score.toFixed(1)}/5` : '—'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={getScoreValue(scores.resistance_score, 5)}
          sx={{
            height: 8,
            borderRadius: 1,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: scores.resistance_score !== null ? `${getScoreColor(scores.resistance_score)}.main` : 'grey.400',
            },
          }}
        />
      </Box>

      {/* Развернуть детали */}
      <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
        <IconButton
          onClick={() => setExpanded(!expanded)}
          size="small"
          sx={{
            color: 'primary.main',
            '&:hover': { bgcolor: 'primary.lighter' },
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: 'pointer', ml: 1 }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Скрыть детали' : 'Развернуть детали'}
        </Typography>
      </Box>

      <Collapse in={expanded}>
        <Box mt={2}>
          <Divider sx={{ mb: 2 }} />

          {/* Детали урожайности */}
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              УРОЖАЙНОСТЬ ({scores.detailed_scores.yield.score !== null ? scores.detailed_scores.yield.score.toFixed(1) : '—'}/{scores.detailed_scores.yield.max_score}):
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              {scores.detailed_scores.yield.interpretation}
            </Typography>
            {renderCriteria(scores.detailed_scores.yield.criteria)}
          </Box>

          {/* Детали качества */}
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              КАЧЕСТВО ({scores.detailed_scores.quality.score !== null ? scores.detailed_scores.quality.score.toFixed(1) : '—'}/{scores.detailed_scores.quality.max_score}):
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              {scores.detailed_scores.quality.interpretation}
            </Typography>
            {renderCriteria(scores.detailed_scores.quality.criteria)}
          </Box>

          {/* Детали устойчивости */}
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              УСТОЙЧИВОСТЬ ({scores.detailed_scores.resistance.score !== null ? scores.detailed_scores.resistance.score.toFixed(1) : '—'}/{scores.detailed_scores.resistance.max_score}):
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
              {scores.detailed_scores.resistance.interpretation}
            </Typography>
            {renderCriteria(scores.detailed_scores.resistance.criteria)}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};
