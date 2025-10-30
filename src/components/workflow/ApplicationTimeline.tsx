import React from 'react';
import { Stepper, Step, StepLabel, StepContent, Typography, Box, Chip } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import type { Application } from '@/types/api.types';
import { formatDate } from '@/utils/dateHelpers';

interface ApplicationTimelineProps {
  application: Application;
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ application }) => {
  const getActiveStep = () => {
    switch (application.status) {
      case 'draft':
        return 0;
      case 'submitted':
        return 1;
      case 'distributed':
        return 2;
      case 'in_progress':
        return 3;
      case 'completed':
        return 4;
      case 'registered':
      case 'rejected':
        return 5;
      default:
        return 0;
    }
  };

  const steps = [
    {
      label: 'Черновик',
      description: 'Заявка создана',
      date: formatDate(application.created_at),
      completed: application.status !== 'draft',
    },
    {
      label: 'Заявка подана',
      description: `Принята в обработку`,
      date: formatDate(application.submission_date),
      completed: !['draft', 'submitted'].includes(application.status),
    },
    {
      label: 'Распределена по областям',
      description: `Создано планов испытаний для ${application.target_oblasts_data.length} областей`,
      date: application.status !== 'draft' && application.status !== 'submitted' ? formatDate(application.updated_at) : undefined,
      completed: !['draft', 'submitted', 'distributed'].includes(application.status),
    },
    {
      label: 'Испытания проводятся',
      description: (
        <Box>
          <Typography variant="body2" color="text.secondary">
            Завершено: {application.decisions_summary?.with_decision || 0} из {application.decisions_summary?.total || 0}
          </Typography>
          {application.decisions_summary && application.decisions_summary.with_decision > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              {application.decisions_summary.approved > 0 && (
                <Chip label={`Одобрено: ${application.decisions_summary.approved}`} size="small" color="success" />
              )}
              {application.decisions_summary.continue > 0 && (
                <Chip label={`Продолжить: ${application.decisions_summary.continue}`} size="small" color="info" />
              )}
              {application.decisions_summary.rejected > 0 && (
                <Chip label={`Отклонено: ${application.decisions_summary.rejected}`} size="small" color="error" />
              )}
            </Box>
          )}
        </Box>
      ),
      completed: ['completed', 'registered', 'rejected'].includes(application.status),
    },
    {
      label: 'Испытания завершены',
      description: 'Все региональные испытания завершены, принимается итоговое решение',
      completed: ['registered', 'rejected'].includes(application.status),
    },
    {
      label: (
        <Box display="flex" alignItems="center" gap={1}>
          {application.status === 'registered' ? (
            <>
              <CheckIcon color="success" />
              <span>Включен в реестр</span>
            </>
          ) : application.status === 'rejected' ? (
            <>
              <RejectIcon color="error" />
              <span>Отклонен</span>
            </>
          ) : (
            'Итоговое решение'
          )}
        </Box>
      ),
      description:
        application.status === 'registered'
          ? 'Сорт рекомендован к включению в Государственный реестр'
          : application.status === 'rejected'
          ? 'Заявка отклонена по результатам испытаний'
          : 'Ожидание итогового решения комиссии',
      completed: ['registered', 'rejected'].includes(application.status),
    },
  ];

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Stepper activeStep={getActiveStep()} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={index} completed={step.completed}>
            <StepLabel>
              <Box>
                <Typography variant="subtitle1" fontWeight={step.completed ? 600 : 400}>
                  {step.label}
                </Typography>
                {step.date && (
                  <Typography variant="caption" color="text.secondary">
                    {step.date}
                  </Typography>
                )}
              </Box>
            </StepLabel>
            <StepContent>
              {typeof step.description === 'string' ? (
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              ) : (
                step.description
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
