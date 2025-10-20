import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useApplication, useRegionalTrials, useRegionalStatus } from '@/hooks/useApplications';
import { ApplicationTimeline } from '@/components/workflow/ApplicationTimeline';
import { RegionalProgress } from '@/components/workflow/RegionalProgress';
import { ApplicationDocuments } from '@/components/documents/ApplicationDocuments';
import { getApplicationStatusMuiColor, getApplicationStatusLabel } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  const { data: application, isLoading } = useApplication(Number(id));
  const { data: trials } = useRegionalTrials(Number(id));


  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!application) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Заявка не найдена
        </Typography>
        <Button onClick={() => navigate('/applications')} sx={{ mt: 2 }}>
          Назад к списку
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Back Button */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/applications')}
        sx={{ mb: 2 }}
      >
        Назад к списку
      </Button>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {application.application_number}
          </Typography>
          <Chip
            label={getApplicationStatusLabel(application.status)}
            color={getApplicationStatusMuiColor(application.status)}
          />
        </Box>
        <Box>
          {/* Распределение теперь делается на уровне планов испытаний */}
        </Box>
      </Box>

      {/* Main Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Основная информация
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* Sort Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Сорт
            </Typography>
            <Typography variant="body1" fontWeight={500} gutterBottom>
              {application.sort_record_data.name}
            </Typography>
            {application.sort_record_data.culture_name && (
              <Typography variant="body2" color="text.secondary">
                Культура: {application.sort_record_data.culture_name}
              </Typography>
            )}
          </Grid>

          {/* Maturity Group */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Группа спелости
            </Typography>
            <Typography variant="body1">{application.maturity_group}</Typography>
          </Grid>

          {/* Applicant */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="text.secondary">
                Заявитель
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={500}>
              {application.applicant}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ИИН/БИН: {application.applicant_inn_bin}
            </Typography>
          </Grid>

          {/* Contact Person */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="text.secondary">
                Контактное лицо
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight={500}>
              {application.contact_person_name}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                {application.contact_person_phone}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <EmailIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                {application.contact_person_email}
              </Typography>
            </Box>
          </Grid>

          {/* Submission Date */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Дата подачи
            </Typography>
            <Typography variant="body1">{formatDate(application.submission_date)}</Typography>
          </Grid>

          {/* Regional Trials Count */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Создано испытаний
            </Typography>
            <Typography variant="body1">
              {trials?.length || 0} из {application.planned_distributions?.length || application.target_oblasts.length}
            </Typography>
          </Grid>

          {/* Target Oblasts */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Целевые области для испытаний ({application.target_oblasts_data.length})
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Для каждой области будет выбран конкретный ГСУ (сортоучасток)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {application.target_oblasts_data.map((oblast) => (
                <Chip
                  key={oblast.id}
                  label={oblast.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          {/* Purpose */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Дополнительные комментарии
            </Typography>
            <Typography variant="body1">
              {application.purpose || <em style={{ color: '#999' }}>Не указано</em>}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <DocumentIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Документы
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <ApplicationDocuments
          applicationId={application.id}
          missingMandatoryDocuments={application.missing_mandatory_documents}
        />
      </Paper>


      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
          <Tab label="Процесс" />
          <Tab label="Испытания по областям" />
          <Tab label="Показатели" />
        </Tabs>

        <Divider />

        {/* Tab 1: Timeline */}
        <TabPanel value={currentTab} index={0}>
          <ApplicationTimeline application={application} />
        </TabPanel>

        {/* Tab 2: Trials by Oblasts */}
        <TabPanel value={currentTab} index={1}>
          <RegionalProgress
            oblastStatuses={application.oblast_statuses || []}
            oblastData={application.target_oblasts_data || []}
            applicationId={application.id}
          />
        </TabPanel>

        {/* Tab 3: Indicators */}
        <TabPanel value={currentTab} index={2}>
          {!application.indicators_data || application.indicators_data.length === 0 ? (
            <Alert severity="info">
              Для этой заявки не указаны показатели испытаний.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {application.indicators_data.map((indicator) => (
                <Grid item xs={12} sm={6} md={4} key={indicator.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {indicator.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Единица: {indicator.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Код: {indicator.code} • Категория: {indicator.category}
                      </Typography>
                      {indicator.is_quality && (
                        <Chip label="Качество" size="small" color="secondary" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

    </Box>
  );
};
