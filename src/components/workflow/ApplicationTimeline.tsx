import React from 'react';
import { Stepper, Step, StepLabel, StepContent, Typography, Box } from '@mui/material';
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
      completed: application.status !== 'draft',
    },
    {
      label: 'Заявка создана',
      description: `Создана ${formatDate(application.submission_date)}`,
      completed: !['draft', 'submitted'].includes(application.status),
    },
    {
      label: 'Распределена по областям',
      description: `Областей: ${application.regional_trials_count}`,
      completed: !['draft', 'submitted', 'distributed'].includes(application.status),
    },
    {
      label: 'Испытания проводятся',
      description: `Завершено: ${application.decisions_summary?.with_decision || 0} из ${application.decisions_summary?.total || 0}`,
      completed: ['completed', 'registered', 'rejected'].includes(application.status),
    },
    {
      label: 'Испытания завершены',
      description: `Одобрено: ${application.decisions_summary?.approved || 0}, Продолжить: ${application.decisions_summary?.continue || 0}, Отклонено: ${application.decisions_summary?.rejected || 0}`,
      completed: ['registered', 'rejected'].includes(application.status),
    },
    {
      label:
        application.status === 'registered'
          ? 'Включен в реестр ✅'
          : application.status === 'rejected'
          ? 'Отклонен ❌'
          : 'Итоговое решение',
      description:
        application.status === 'registered'
          ? 'Сорт рекомендован к включению в Государственный реестр'
          : application.status === 'rejected'
          ? 'Заявка отклонена'
          : 'Ожидание итогового решения',
      completed: ['registered', 'rejected'].includes(application.status),
    },
  ];

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Stepper activeStep={getActiveStep()} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={index} completed={step.completed}>
            <StepLabel>
              <Typography variant="subtitle1" fontWeight={step.completed ? 600 : 400}>
                {step.label}
              </Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
