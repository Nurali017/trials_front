import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowRight as ExpandLessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { MethodologyTableResponse, SortData, MaturityGroupData } from '@/types/methodology.types';

interface MethodologyTableProps {
  data: MethodologyTableResponse;
}

interface RegionTableProps {
  regionName: string;
  maturityGroups: Record<string, MaturityGroupData>;
  yearsRange: number[];
}

interface MaturityGroupTableProps {
  groupCode: string;
  groupName: string;
  groupData: MaturityGroupData;
  yearsRange: number[];
}

const SortRow: React.FC<{
  sort: SortData;
  yearsRange: number[];
  isStandard?: boolean;
  indicatorKeys: string[];
}> = ({
  sort,
  yearsRange,
  isStandard = false,
  indicatorKeys,
}) => {
  // Проверяем наличие данных
  if (!sort) {
    return (
      <TableRow>
        <TableCell colSpan={6 + yearsRange.length + indicatorKeys.length}>
          <Alert severity="error">Данные о сорте отсутствуют</Alert>
        </TableCell>
      </TableRow>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'continue': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'decision_pending': return 'Ожидает решения';
      case 'approved': return 'Одобрено';
      case 'rejected': return 'Отклонено';
      case 'continue': return 'Продолжить';
      default: return status;
    }
  };

  return (
    <TableRow
      sx={{
        backgroundColor: isStandard ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
        '&:hover': {
          backgroundColor: isStandard ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.02)',
        },
        transition: 'background-color 0.15s',
        borderLeft: isStandard ? '3px solid' : 'none',
        borderLeftColor: isStandard ? 'primary.main' : 'transparent',
      }}
    >
      <TableCell sx={{ py: 2, pl: isStandard ? 2 : 2 }}>
        <Box>
          {isStandard && (
            <Chip
              label={sort.is_comparison_standard ? "ОСНОВНОЙ СТАНДАРТ" : "СТАНДАРТ"}
              size="small"
              variant="outlined"
              color="primary"
              sx={{
                fontWeight: 600,
                fontSize: '0.8rem',
                mb: 0.5,
                height: 24,
              }}
            />
          )}
          <Typography variant="body1" fontWeight={isStandard ? 600 : 500} sx={{ fontSize: '1rem' }}>
            {sort.sort_name || 'Не указано'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Заявка: {sort.application_number || 'Не указано'}
          </Typography>
        </Box>
      </TableCell>

      <TableCell align="center" sx={{ py: 2 }}>
        <Typography variant="body1" fontWeight={500} sx={{ fontSize: '1rem' }}>
          {sort.years_tested || 0}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          с {sort.year_started || 'Не указано'}
        </Typography>
      </TableCell>

      {yearsRange.map(year => (
        <TableCell key={year} align="center" sx={{ py: 2, minWidth: 80 }}>
          <Typography
            variant="body1"
            fontWeight={sort.yields_by_year?.[year.toString()] ? 600 : 400}
            sx={{
              color: sort.yields_by_year?.[year.toString()] ? 'text.primary' : 'text.disabled',
              fontSize: '1rem',
            }}
          >
            {sort.yields_by_year?.[year.toString()]?.toFixed(1) || '—'}
          </Typography>
        </TableCell>
      ))}

      <TableCell align="center" sx={{ py: 2, bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ fontSize: '1.1rem' }}>
          {sort.average_yield?.toFixed(1) || '0.0'}
        </Typography>
      </TableCell>

      <TableCell align="center" sx={{ py: 2 }}>
        {sort.is_standard ? (
          <Chip
            label="СТАНДАРТ"
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontWeight: 600, borderRadius: 1, fontSize: '0.8rem' }}
          />
        ) : (
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                color: typeof sort.deviation_percent === 'number' && sort.deviation_percent > 0
                  ? 'success.main'
                  : typeof sort.deviation_percent === 'number' && sort.deviation_percent < 0
                  ? 'error.main'
                  : 'text.secondary',
                fontSize: '1.1rem',
              }}
            >
              {sort.deviation_percent === '' || sort.deviation_percent === null || sort.deviation_percent === undefined
                ? '—'
                : `${typeof sort.deviation_percent === 'number' && sort.deviation_percent > 0 ? '+' : ''}${sort.deviation_percent}%`}
            </Typography>
            {sort.deviation_percent !== '' && sort.deviation_percent !== null && sort.deviation_percent !== undefined && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                от стандарта
              </Typography>
            )}
          </Box>
        )}
      </TableCell>

      {/* Показатели */}
      {indicatorKeys.map(indicatorKey => {
        const indicator = sort.main_indicators?.[indicatorKey] || sort.quality_indicators?.[indicatorKey];
        return (
          <TableCell key={indicatorKey} align="center" sx={{ py: 2 }}>
            {indicator ? (
              <Typography variant="body1" fontWeight={500} sx={{ fontSize: '1rem' }}>
                {indicator.value}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.disabled">
                —
              </Typography>
            )}
          </TableCell>
        );
      })}

      <TableCell align="center" sx={{ py: 2 }}>
        <Chip
          label={getStatusText(sort.decision_status || 'decision_pending')}
          color={getStatusColor(sort.decision_status || 'decision_pending') as any}
          size="small"
          variant="outlined"
          sx={{
            fontWeight: 500,
            borderRadius: 1,
          }}
        />
      </TableCell>
    </TableRow>
  );
};

const MaturityGroupTable: React.FC<MaturityGroupTableProps> = ({
  groupCode,
  groupName,
  groupData,
  yearsRange,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Проверяем наличие данных
  if (!groupData || !groupData.sorts || groupData.sorts.length === 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            p: 1.5,
            bgcolor: 'error.lighter',
            borderRadius: 1,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'error.light',
            transition: 'all 0.15s',
            '&:hover': {
              borderColor: 'error.main',
              bgcolor: 'error.light',
            },
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <IconButton size="small" sx={{ mr: 1 }}>
            {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
          <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
            {groupName} ({groupCode})
          </Typography>
          <Chip
            label="Нет данных"
            size="small"
            color="error"
            variant="outlined"
            sx={{ ml: 2, fontWeight: 600, fontSize: '0.7rem', height: 20 }}
          />
        </Box>
        <Collapse in={expanded}>
          <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }} variant="outlined">
            В данной группе спелости отсутствуют данные о сортах
          </Alert>
        </Collapse>
      </Box>
    );
  }

  // Находим основной стандарт для сравнения
  const comparisonStandard = groupData.sorts.find(sort => sort.is_comparison_standard);
  const standardName = comparisonStandard?.sort_name || 'Не определен';

  // Собираем основные и качественные показатели отдельно
  const mainIndicatorKeys = new Set<string>();
  const qualityIndicatorKeys = new Set<string>();

  groupData.sorts.forEach(sort => {
    if (sort.main_indicators) {
      Object.keys(sort.main_indicators).forEach(key => mainIndicatorKeys.add(key));
    }
    if (sort.quality_indicators) {
      Object.keys(sort.quality_indicators).forEach(key => qualityIndicatorKeys.add(key));
    }
  });

  const mainIndicators = Array.from(mainIndicatorKeys);
  const qualityIndicators = Array.from(qualityIndicatorKeys);
  const allIndicatorKeys = [...mainIndicators, ...qualityIndicators];

  return (
    <Box sx={{ mb: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            p: 1.5,
            bgcolor: 'rgba(25, 118, 210, 0.04)',
            borderRadius: 1,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'divider',
            mb: 1,
            transition: 'all 0.15s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'rgba(25, 118, 210, 0.08)',
            },
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <IconButton size="small" sx={{ mr: 1 }}>
            {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
          <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.9rem' }}>
            {groupName} ({groupCode})
          </Typography>
          <Chip
            label={`Стандарт: ${standardName}`}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ ml: 2, fontWeight: 600, fontSize: '0.7rem', height: 20 }}
          />
          {mainIndicators.length === 0 && qualityIndicators.length === 0 && (
            <Chip
              label="Нет показателей"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ ml: 2, fontWeight: 600, fontSize: '0.7rem', height: 20 }}
            />
          )}
        </Box>

      <Collapse in={expanded}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
          }}
        >
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            {/* Верхняя строка заголовка - группировка */}
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell rowSpan={3} sx={{ fontWeight: 700, py: 1.5, fontSize: '0.85rem', color: 'text.primary', borderRight: '1px solid', borderColor: 'divider' }}>
                Сорт
              </TableCell>
              <TableCell rowSpan={3} align="center" sx={{ fontWeight: 700, py: 1.5, fontSize: '0.85rem', color: 'text.primary', minWidth: 100, borderRight: '1px solid', borderColor: 'divider' }}>
                Лет испытаний
              </TableCell>
              <TableCell colSpan={yearsRange.length} align="center" sx={{ fontWeight: 700, py: 1, fontSize: '0.85rem', color: 'text.primary', borderRight: '1px solid', borderColor: 'divider' }}>
                Урожайность по годам
              </TableCell>
              <TableCell rowSpan={3} align="center" sx={{ fontWeight: 700, py: 1.5, fontSize: '0.85rem', color: 'text.primary', minWidth: 110, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRight: '1px solid', borderColor: 'divider' }}>
                Средняя урожайность
              </TableCell>
              <TableCell rowSpan={3} align="center" sx={{ fontWeight: 700, py: 1.5, fontSize: '0.85rem', color: 'text.primary', minWidth: 120, borderRight: '2px solid', borderColor: 'divider' }}>
                Отклонение
              </TableCell>
              {mainIndicators.length > 0 && (
                <TableCell colSpan={mainIndicators.length} align="center" sx={{ fontWeight: 700, py: 1, fontSize: '0.85rem', color: 'primary.main', bgcolor: 'rgba(25, 118, 210, 0.05)', borderRight: '2px solid', borderColor: 'divider' }}>
                  Основные показатели
                </TableCell>
              )}
              {qualityIndicators.length > 0 && (
                <TableCell colSpan={qualityIndicators.length} align="center" sx={{ fontWeight: 700, py: 1, fontSize: '0.85rem', color: 'success.main', bgcolor: 'rgba(76, 175, 80, 0.05)', borderRight: '1px solid', borderColor: 'divider' }}>
                  Качественные показатели
                </TableCell>
              )}
              <TableCell rowSpan={3} align="center" sx={{ fontWeight: 700, py: 1.5, fontSize: '0.85rem', color: 'text.primary', minWidth: 120 }}>
                Статус
              </TableCell>
            </TableRow>

            {/* Средняя строка заголовка - названия показателей */}
            <TableRow sx={{ bgcolor: '#fafafa' }}>
              {yearsRange.map(year => (
                <TableCell key={year} align="center" sx={{ fontWeight: 700, py: 1, fontSize: '0.85rem', color: 'text.primary', minWidth: 75 }}>
                  {year}
                </TableCell>
              ))}
              {mainIndicators.map(indicatorKey => {
                const firstSort = groupData.sorts.find(s => s.main_indicators?.[indicatorKey]);
                const indicator = firstSort?.main_indicators?.[indicatorKey];
                return (
                  <TableCell key={indicatorKey} align="center" sx={{ fontWeight: 600, py: 1, fontSize: '0.8rem', color: 'text.primary', minWidth: 100, bgcolor: 'rgba(25, 118, 210, 0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {indicator?.name || indicatorKey}
                  </TableCell>
                );
              })}
              {qualityIndicators.map(indicatorKey => {
                const firstSort = groupData.sorts.find(s => s.quality_indicators?.[indicatorKey]);
                const indicator = firstSort?.quality_indicators?.[indicatorKey];
                return (
                  <TableCell key={indicatorKey} align="center" sx={{ fontWeight: 600, py: 1, fontSize: '0.8rem', color: 'text.primary', minWidth: 100, bgcolor: 'rgba(76, 175, 80, 0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {indicator?.name || indicatorKey}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Нижняя строка заголовка - единицы измерения */}
            <TableRow sx={{ bgcolor: '#fafafa' }}>
              {yearsRange.map(year => (
                <TableCell key={`unit-${year}`} align="center" sx={{ py: 0.5, fontSize: '0.7rem', color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                  год
                </TableCell>
              ))}
              {mainIndicators.map(indicatorKey => {
                const firstSort = groupData.sorts.find(s => s.main_indicators?.[indicatorKey]);
                const indicator = firstSort?.main_indicators?.[indicatorKey];
                return (
                  <TableCell
                    key={`unit-${indicatorKey}`}
                    align="center"
                    sx={{
                      py: 0.5,
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                      bgcolor: 'rgba(25, 118, 210, 0.02)',
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      fontStyle: 'italic'
                    }}
                  >
                    {indicator?.unit || 'балл'}
                  </TableCell>
                );
              })}
              {qualityIndicators.map(indicatorKey => {
                const firstSort = groupData.sorts.find(s => s.quality_indicators?.[indicatorKey]);
                const indicator = firstSort?.quality_indicators?.[indicatorKey];
                return (
                  <TableCell
                    key={`unit-${indicatorKey}`}
                    align="center"
                    sx={{
                      py: 0.5,
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                      bgcolor: 'rgba(76, 175, 80, 0.02)',
                      borderBottom: '2px solid',
                      borderColor: 'divider',
                      fontStyle: 'italic'
                    }}
                  >
                    {indicator?.unit || '—'}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Все сорты (включая стандарты) */}
            {groupData.sorts && groupData.sorts.map((sort, index) => (
              <SortRow
                key={index}
                sort={sort}
                yearsRange={yearsRange}
                isStandard={sort.is_standard}
                indicatorKeys={allIndicatorKeys}
              />
            ))}
          </TableBody>
         </Table>
       </TableContainer>
      </Collapse>
     </Box>
   );
 };

const RegionTable: React.FC<RegionTableProps> = ({ regionName, maturityGroups, yearsRange }) => {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box
        display="flex"
        alignItems="center"
        sx={{
          p: 2,
          bgcolor: 'white',
          borderRadius: 1,
          cursor: 'pointer',
          border: '2px solid',
          borderColor: 'primary.main',
          mb: 2,
          transition: 'all 0.15s',
          '&:hover': {
            bgcolor: 'rgba(25, 118, 210, 0.04)',
            borderColor: 'primary.dark',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <IconButton size="small" sx={{ mr: 1.5 }}>
          {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
        <Typography variant="h6" fontWeight={700} color="primary" sx={{ fontSize: '1.1rem' }}>
          {regionName}
        </Typography>
        <Chip
          label={`${Object.keys(maturityGroups).length} групп спелости`}
          variant="outlined"
          color="primary"
          size="small"
          sx={{
            ml: 2,
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 22,
          }}
        />
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ pl: 2 }}>
          {Object.entries(maturityGroups).map(([groupCode, groupData]) => (
            <MaturityGroupTable
              key={groupCode}
              groupCode={groupCode}
              groupName={groupData.group_name}
              groupData={groupData}
              yearsRange={yearsRange}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export const MethodologyTable: React.FC<MethodologyTableProps> = ({ data }) => {
  return (
    <Box>
      {/* Предупреждения */}
      {data.has_warnings && data.warnings.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 1,
            bgcolor: 'warning.lighter',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Предупреждения:
          </Typography>
          {data.warnings.map((warning, index) => (
            <Typography key={index} variant="body2" sx={{ mt: 1 }}>
              • {warning.message}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Таблица по регионам */}
      {Object.entries(data.methodology_table).map(([regionName, maturityGroups]) => (
        <RegionTable
          key={regionName}
          regionName={regionName}
          maturityGroups={maturityGroups}
          yearsRange={data.years_range}
        />
      ))}

      {Object.keys(data.methodology_table).length === 0 && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{
            borderRadius: 1,
            bgcolor: 'info.lighter',
          }}
        >
          <Typography variant="body2">
            Нет данных для отображения
          </Typography>
        </Alert>
      )}
    </Box>
  );
};
