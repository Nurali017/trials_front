import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  Grid,
  Divider,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DocumentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useApplication, useRegionalTrials } from '@/hooks/useApplications';
import { ApplicationTimeline } from '@/components/workflow/ApplicationTimeline';
import { RegionalProgress } from '@/components/workflow/RegionalProgress';
import { ApplicationDocuments } from '@/components/documents/ApplicationDocuments';
import { getApplicationStatusMuiColor, getApplicationStatusLabel } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';
import { MetricCard } from '@/components/common/MetricCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState(0);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const { data: application, isLoading, error, refetch } = useApplication(Number(id));
  const { data: trials } = useRegionalTrials(Number(id));

  const handleCopyApplicationNumber = () => {
    if (application) {
      navigator.clipboard.writeText(application.application_number);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ошибка загрузки заявки
          </Typography>
          <Typography variant="body2">
            {error instanceof Error ? error.message : 'Не удалось загрузить данные заявки'}
          </Typography>
        </Alert>
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            startIcon={<RefreshIcon />}
            variant="contained"
            onClick={() => refetch()}
          >
            Повторить попытку
          </Button>
          <Button onClick={() => navigate('/applications')}>
            К списку заявок
          </Button>
        </Box>
      </Box>
    );
  }

  // Not found state
  if (!application) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Заявка не найдена
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Возможно, заявка была удалена или у вас нет прав на её просмотр
        </Typography>
        <Button onClick={() => navigate('/applications')} variant="contained">
          К списку заявок
        </Button>
      </Box>
    );
  }

  const hasMissingDocuments = application.missing_mandatory_documents.length > 0;

  const getProgressColor = () => {
    const completed = trials?.length || 0;
    const total = application.target_oblasts_data.length;
    if (completed === 0) return '#9e9e9e';
    if (completed === total) return '#4caf50';
    return '#ff9800';
  };

  const getDocumentsColor = () => {
    return hasMissingDocuments ? '#f44336' : '#4caf50';
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 1.5, fontSize: '0.875rem' }}>
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          sx={{ color: '#424242', fontWeight: 500, '&:hover': { color: '#1976d2' } }}
        >
          Главная
        </Link>
        <Link
          component={RouterLink}
          to="/applications"
          underline="hover"
          sx={{ color: '#424242', fontWeight: 500, '&:hover': { color: '#1976d2' } }}
        >
          Заявки
        </Link>
        <Typography sx={{ color: '#000', fontWeight: 600 }}>
          {application.application_number}
        </Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate(-1)}
        size="small"
        sx={{
          mb: 2,
          textTransform: 'none',
          fontWeight: 600,
          color: '#424242',
          '&:hover': { bgcolor: 'action.hover', color: '#1976d2' }
        }}
      >
        Назад
      </Button>

      {/* Critical Warning */}
      {hasMissingDocuments && (
        <Alert
          severity="error"
          icon={<WarningIcon />}
          sx={{
            mb: 2,
            fontWeight: 600,
            '& .MuiAlert-message': {
              color: '#000',
            }
          }}
          action={
            <Button
              size="small"
              onClick={() => setCurrentTab(2)}
              sx={{ fontWeight: 700 }}
            >
              Загрузить
            </Button>
          }
        >
          Не хватает {application.missing_mandatory_documents.length} обязательных документов
        </Alert>
      )}

      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#000' }}>
            {application.application_number}
          </Typography>
          <Tooltip title={copiedToClipboard ? "Скопировано!" : "Копировать"}>
            <IconButton size="small" onClick={handleCopyApplicationNumber}>
              {copiedToClipboard ? <CheckCircleIcon color="success" /> : <CopyIcon />}
            </IconButton>
          </Tooltip>
          <Chip
            label={getApplicationStatusLabel(application.status)}
            color={getApplicationStatusMuiColor(application.status)}
            sx={{ fontWeight: 700, fontSize: '0.85rem' }}
          />
        </Box>
        <Typography variant="body1" sx={{ color: '#424242', fontWeight: 500 }}>
          {application.sort_record_data.name}
          {application.sort_record_data.culture_name && (
            <> • {application.sort_record_data.culture_name}</>
          )}
        </Typography>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Прогресс испытаний"
            value={`${trials?.length || 0}/${application.target_oblasts_data.length}`}
            icon={<SpeedIcon />}
            color={getProgressColor()}
            onClick={() => setCurrentTab(1)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Целевые области"
            value={application.target_oblasts_data.length}
            icon={<LocationIcon />}
            color="#2196f3"
            onClick={() => setCurrentTab(1)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Документы"
            value={hasMissingDocuments ? 'Неполные' : 'Загружены'}
            icon={<DocumentIcon />}
            color={getDocumentsColor()}
            onClick={() => setCurrentTab(2)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Дата подачи"
            value={formatDate(application.submission_date)}
            icon={<CalendarIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Main Info - Two Column Layout */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Left Column - Details */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#000' }} gutterBottom>
              Детали заявки
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#1976d2',
                    letterSpacing: 1
                  }}
                >
                  Группа спелости
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, color: '#212121' }}>
                  {application.maturity_group}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#1976d2',
                    letterSpacing: 1
                  }}
                >
                  Целевые области
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                  {application.target_oblasts_data.map((oblast) => (
                    <Chip
                      key={oblast.id}
                      label={oblast.name}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24, fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Grid>

              {application.purpose && (
                <Grid item xs={12}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#1976d2',
                      letterSpacing: 1
                    }}
                  >
                    Комментарии
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#424242', lineHeight: 1.6 }}>
                    {application.purpose}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column - Contacts */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#000' }} gutterBottom>
              Контакты
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                <BusinessIcon sx={{ fontSize: 20, color: '#1976d2' }} />
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#1976d2',
                    letterSpacing: 1
                  }}
                >
                  Заявитель
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#000', mb: 0.5 }}>
                {application.applicant}
              </Typography>
              <Typography variant="caption" sx={{ color: '#616161', fontWeight: 500 }}>
                ИИН/БИН: {application.applicant_inn_bin}
              </Typography>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                <PersonIcon sx={{ fontSize: 20, color: '#1976d2' }} />
                <Typography
                  variant="overline"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#1976d2',
                    letterSpacing: 1
                  }}
                >
                  Контактное лицо
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#000', mb: 1 }}>
                {application.contact_person_name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={0.75}>
                <PhoneIcon sx={{ fontSize: 16, color: '#424242' }} />
                <Typography variant="body2" sx={{ color: '#212121', fontWeight: 500 }}>
                  {application.contact_person_phone}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon sx={{ fontSize: 16, color: '#424242' }} />
                <Typography variant="body2" sx={{ color: '#212121', fontWeight: 500, wordBreak: 'break-word' }}>
                  {application.contact_person_email}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              minHeight: 48,
              color: '#424242',
              '&.Mui-selected': {
                color: '#1976d2',
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
            }
          }}
        >
          <Tab label="Процесс" />
          <Tab label={`Области (${application.target_oblasts_data.length})`} />
          <Tab label="Документы" />
        </Tabs>

        {/* Tab 1: Process Timeline */}
        <TabPanel value={currentTab} index={0}>
          <ApplicationTimeline application={application} />
        </TabPanel>

        {/* Tab 2: Regional Progress */}
        <TabPanel value={currentTab} index={1}>
          <RegionalProgress
            oblastStatuses={application.oblast_statuses || []}
            oblastData={application.target_oblasts_data || []}
          />
        </TabPanel>

        {/* Tab 3: Documents */}
        <TabPanel value={currentTab} index={2}>
          <ApplicationDocuments
            applicationId={application.id}
            missingMandatoryDocuments={application.missing_mandatory_documents}
          />
        </TabPanel>
      </Paper>

    </Box>
  );
};
