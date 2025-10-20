import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  Map as MapIcon,
  Agriculture as AgricultureIcon,
} from '@mui/icons-material';
import { RegionData } from '@/types/summary.types';
import { getQualityIndicatorName, getResistanceIndicatorName } from '@/utils/indicators';

interface RegionsDataTableProps {
  regions: RegionData[];
  sortName?: string;
  cultureName?: string;
  applicationNumber?: string;
  maturityGroup?: string;
}

export const RegionsDataTable: React.FC<RegionsDataTableProps> = ({ 
  regions, 
  sortName, 
  cultureName, 
  applicationNumber, 
  maturityGroup 
}) => {
  if (regions.length === 0) {
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
        <Typography variant="body2" color="text.secondary">
          Нет данных по регионам
        </Typography>
      </Paper>
    );
  }

  // Получаем все годы из данных
  const allYears = new Set<string>();
  regions.forEach(region => {
    Object.keys(region.yields_by_year).forEach(year => allYears.add(year));
  });
  const sortedYears = Array.from(allYears).sort();

  const getDeviationColor = (deviation: number) => {
    if (deviation > 0) return 'success.main';
    if (deviation < 0) return 'error.main';
    return 'text.secondary';
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
      {/* Заголовок с информацией о сорте */}
      <Box mb={3}>
        <Box display="flex" alignItems="center" mb={2}>
          <AgricultureIcon sx={{ color: 'primary.main', fontSize: 28, mr: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="primary.main">
            ДАННЫЕ ПО РЕГИОНАМ
          </Typography>
        </Box>
        
        {(sortName || applicationNumber || maturityGroup) && (
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: 'grey.50', 
              borderRadius: 1, 
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Название сорта - самый верхний элемент */}
              {sortName && (
                <Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                    {sortName}
                  </Typography>
                </Box>
              )}
              
              {/* Заявка и группа спелости */}
              <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                {applicationNumber && (
                  <Box display="flex" alignItems="center" sx={{ 
                    px: 2, 
                    py: 1, 
                    bgcolor: 'primary.lighter', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.light'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      Заявка:
                    </Typography>
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      {applicationNumber}
                    </Typography>
                  </Box>
                )}
                {maturityGroup && (
                  <Box display="flex" alignItems="center" sx={{ 
                    px: 2, 
                    py: 1, 
                    bgcolor: 'success.lighter', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'success.light'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      Группа спелости:
                    </Typography>
                    <Typography variant="body1" fontWeight={700} color="success.main">
                      {maturityGroup}
                    </Typography>
                  </Box>
                )}
                {cultureName && (
                  <Box display="flex" alignItems="center" sx={{ 
                    px: 2, 
                    py: 1, 
                    bgcolor: 'grey.100', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.300'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      Культура:
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      {cultureName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <TableContainer>
        <Table size="medium" sx={{ border: '1px solid', borderColor: 'divider' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light', '& .MuiTableCell-head': { color: 'white' } }}>
              <TableCell sx={{ fontWeight: 700, py: 2, fontSize: '0.9rem' }}>
                Регион
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, py: 2, fontSize: '0.9rem' }}>
                Лет испытаний
              </TableCell>
              {sortedYears.map(year => (
                <TableCell key={year} align="center" sx={{ fontWeight: 700, py: 2, fontSize: '0.9rem' }}>
                  {year}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ 
                fontWeight: 700, 
                py: 2, 
                fontSize: '0.9rem',
                bgcolor: 'primary.dark',
                color: 'white'
              }}>
                Средняя урожайность
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {regions.map((region, index) => (
              <React.Fragment key={index}>
                {/* Основная строка с урожайностями */}
                <TableRow
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                    },
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                  }}
                >
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      {region.region_name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Typography variant="body1" fontWeight={600} color="primary.main">
                        {region.years_tested}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        с {region.year_started}
                      </Typography>
                    </Box>
                  </TableCell>
                  {sortedYears.map(year => (
                    <TableCell key={year} align="center" sx={{ py: 2 }}>
                      <Typography 
                        variant="body1" 
                        fontWeight={region.yields_by_year[year] ? 600 : 400}
                        color={region.yields_by_year[year] ? 'text.primary' : 'text.secondary'}
                      >
                        {region.yields_by_year[year]?.toFixed(1) || '—'}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ 
                    py: 2,
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    borderLeft: '2px solid',
                    borderLeftColor: 'primary.main'
                  }}>
                    <Typography variant="body1" fontWeight={700} color="primary.main">
                      {region.average_yield?.toFixed(1) || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ц/га
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* Строка с отклонением и стандартом */}
                <TableRow sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                  <TableCell colSpan={sortedYears.length + 3} sx={{ py: 2 }}>
                    <Box display="flex" gap={3} flexWrap="wrap" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Отклонение от стандарта:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={getDeviationColor(region.deviation_percent || 0)}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: `${getDeviationColor(region.deviation_percent || 0)}.lighter`,
                            border: '1px solid',
                            borderColor: `${getDeviationColor(region.deviation_percent || 0)}.main`
                          }}
                        >
                          {region.deviation_percent > 0 ? '+' : ''}
                          {region.deviation_percent?.toFixed(1) || '0.0'}%
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Стандарт:
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {region.standard_name}
                          {region.standard_current_year_yield !== null && ` (${region.standard_current_year_yield?.toFixed(1) || '0.0'} ц/га)`}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Строка с показателями устойчивости */}
                {Object.keys(region.resistance_indicators).length > 0 && (
                  <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.04)' }}>
                    <TableCell colSpan={sortedYears.length + 3} sx={{ py: 2 }}>
                      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          Показатели устойчивости:
                        </Typography>
                        {Object.entries(region.resistance_indicators).map(([key, value], idx) => (
                          <Box key={key} display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              {getResistanceIndicatorName(key)}:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="success.main"
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 0.5,
                                bgcolor: 'success.lighter',
                                border: '1px solid',
                                borderColor: 'success.light'
                              }}
                            >
                              {value?.toFixed(1) || '0.0'}
                            </Typography>
                            {idx < Object.entries(region.resistance_indicators).length - 1 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                                •
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Строка с показателями качества (если есть) */}
                {region.quality_indicators && Object.keys(region.quality_indicators).length > 0 && (
                  <TableRow sx={{ bgcolor: 'rgba(25, 118, 210, 0.04)' }}>
                    <TableCell colSpan={sortedYears.length + 3} sx={{ py: 2 }}>
                      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                          Показатели качества:
                        </Typography>
                        {Object.entries(region.quality_indicators).map(([key, value], idx) => (
                          <Box key={key} display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              {getQualityIndicatorName(key)}:
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="primary.main"
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 0.5,
                                bgcolor: 'primary.lighter',
                                border: '1px solid',
                                borderColor: 'primary.light'
                              }}
                            >
                              {value?.toFixed(1) || '0.0'}
                            </Typography>
                            {idx < Object.entries(region.quality_indicators).length - 1 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                                •
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Разделитель между регионами */}
                {index < regions.length - 1 && (
                  <TableRow>
                    <TableCell colSpan={sortedYears.length + 3} sx={{ py: 1 }}>
                      <Divider />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
