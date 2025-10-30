import type { ApplicationStatus, TrialStatus, DecisionType } from '@/types/api.types';

// Application status colors
export const getApplicationStatusColor = (status: ApplicationStatus): string => {
  const colors: Record<ApplicationStatus, string> = {
    draft: '#9E9E9E',
    submitted: '#2196F3',
    distributed: '#9C27B0',
    in_progress: '#FF9800',
    completed: '#2196F3',
    registered: '#4CAF50',
    rejected: '#F44336',
  };
  return colors[status];
};

// Trial status colors
export const getTrialStatusColor = (status: TrialStatus): string => {
  const colors: Record<TrialStatus, string> = {
    planned: '#9E9E9E',
    active: '#FF9800',
    completed_008: '#2196F3',
    completed: '#2196F3',
    lab_sample_sent: '#9C27B0',
    lab_completed: '#00BCD4',
    approved: '#4CAF50',
    continue: '#FFC107',
    rejected: '#F44336',
  };
  return colors[status];
};

// MUI color for status
export const getApplicationStatusMuiColor = (
  status: ApplicationStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  const colors: Record<ApplicationStatus, any> = {
    draft: 'default',
    submitted: 'info',
    distributed: 'secondary',
    in_progress: 'warning',
    completed: 'primary',  // Changed from 'info' to 'primary' for better distinction
    registered: 'success',
    rejected: 'error',
  };
  return colors[status];
};

export const getTrialStatusMuiColor = (
  status: TrialStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  const colors: Record<TrialStatus, any> = {
    planned: 'default',
    active: 'warning',
    completed_008: 'info',
    completed: 'info',
    lab_sample_sent: 'secondary',
    lab_completed: 'info',
    approved: 'success',
    continue: 'warning',
    rejected: 'error',
  };
  return colors[status];
};

export const getDecisionMuiColor = (
  decision: DecisionType
): 'success' | 'warning' | 'error' => {
  const colors: Record<DecisionType, any> = {
    approved: 'success',
    continue: 'warning',
    rejected: 'error',
  };
  return colors[decision];
};

// Status labels in Russian
export const getApplicationStatusLabel = (status: ApplicationStatus): string => {
  const labels: Record<ApplicationStatus, string> = {
    draft: 'Черновик',
    submitted: 'Создана',
    distributed: 'Распределена',
    in_progress: 'В испытаниях',
    completed: 'Завершена',
    registered: 'Включен в реестр',
    rejected: 'Отклонен',
  };
  return labels[status];
};

export const getTrialStatusLabel = (status: TrialStatus): string => {
  const labels: Record<TrialStatus, string> = {
    planned: 'Запланировано',
    active: 'Проводится',
    completed_008: 'Уборка завершена',
    completed: 'Завершено',
    lab_sample_sent: 'Образец в лаборатории',
    lab_completed: 'Лабораторный анализ завершен',
    approved: 'Одобрено',
    continue: 'Продолжить',
    rejected: 'Отклонено',
  };
  return labels[status];
};

export const getDecisionLabel = (decision: DecisionType): string => {
  const labels: Record<DecisionType, string> = {
    approved: 'Одобрено ✅',
    continue: 'Продолжить 🔄',
    rejected: 'Отклонено ❌',
  };
  return labels[decision];
};

// Decision descriptions
export const getDecisionDescription = (decision: DecisionType): string => {
  const descriptions: Record<DecisionType, string> = {
    approved: 'Рекомендовать к включению в Государственный реестр',
    continue: 'Требуются дополнительные данные',
    rejected: 'Не соответствует требованиям',
  };
  return descriptions[decision];
};

// Calculate progress percentage
export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// Get progress bar color based on percentage
export const getProgressColor = (
  progress: number
): 'error' | 'warning' | 'success' => {
  if (progress < 30) return 'error';
  if (progress < 70) return 'warning';
  return 'success';
};
