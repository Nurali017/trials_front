import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Nature as NatureIcon } from '@mui/icons-material';
import type { SortRecord } from '@/types/api.types';
import type { PatentsSort } from '@/api/patents';
import { format } from 'date-fns';

interface SortCardProps {
  sort: SortRecord | PatentsSort;
  onClick?: () => void;
}

export const SortCard: React.FC<SortCardProps> = ({ sort, onClick }) => {
  // Type guard to check if it's PatentsSort
  const isPatentsSort = (s: SortRecord | PatentsSort): s is PatentsSort => {
    return 'status' in s && 'applicant_data' in s;
  };

  const getCultureName = () => {
    if (isPatentsSort(sort)) {
      return sort.culture.name || '—';
    } else {
      if (!sort.culture) return '—';
      if (typeof sort.culture === 'object') {
        return sort.culture.name;
      }
      return sort.culture_name || '—';
    }
  };


  const getCultureGroupName = () => {
    if (isPatentsSort(sort)) {
      return sort.culture.group.name;
    }
    return null;
  };

  const getSortCode = () => {
    if (isPatentsSort(sort)) {
      return sort.code;
    } else {
      return sort.public_code || sort.code;
    }
  };

  const getOriginators = () => {
    if (isPatentsSort(sort)) {
      return sort.ariginators || [];
    }
    return [];
  };

  return (
    <Card
      elevation={1}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
        } : {
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          }
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'grey.200',
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1, minHeight: 380 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)',
            }}
          >
            <NatureIcon />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                lineHeight: 1.3,
                fontSize: '1.15rem',
                color: 'text.primary',
                wordBreak: 'break-word',
              }}
            >
              {sort.name}
            </Typography>
            {getSortCode() && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Код: {getSortCode()}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Culture */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, mb: 1 }}>
              Культура
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                label={getCultureName()}
                size="small"
                sx={{
                  bgcolor: 'success.light',
                  color: 'success.contrastText',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                }}
              />
              {getCultureGroupName() && (
                <Chip
                  label={getCultureGroupName()}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    alignSelf: 'flex-start',
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Applicant */}
          {sort.applicant && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, mb: 1 }}>
                Заявитель
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0.5,
                  lineHeight: 1.4,
                  color: 'text.primary',
                }}
              >
                {sort.applicant}
              </Typography>
            </Box>
          )}

          {/* Originators */}
          {getOriginators().length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, mb: 1 }}>
                Оригинаторы
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {getOriginators().map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        flex: 1,
                        lineHeight: 1.4,
                        color: 'text.primary',
                      }}
                    >
                      {item.ariginator.name}
                    </Typography>
                    {item.percentage && (
                      <Chip
                        label={`${item.percentage}%`}
                        size="small"
                        sx={{
                          bgcolor: 'secondary.light',
                          color: 'secondary.contrastText',
                          fontWeight: 600,
                          height: 24,
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Patent NIS */}
          {sort.patent_nis && (
            <Box>
              <Chip label="Патент НИС" size="small" color="info" />
            </Box>
          )}

          {/* Notes */}
          {sort.note && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Примечание
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {sort.note}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ 
          mt: 3, 
          pt: 2, 
          borderTop: '1px solid', 
          borderColor: 'grey.200',
          bgcolor: 'grey.50',
          mx: -2,
          px: 2,
          pb: 2,
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Создано: {format(new Date(sort.created_at), 'dd.MM.yyyy')}
          </Typography>
          {!isPatentsSort(sort) && sort.synced_at && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
              Синхронизировано: {format(new Date(sort.synced_at), 'dd.MM.yyyy HH:mm')}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

