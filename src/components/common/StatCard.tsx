import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  icon,
  color = 'primary',
  subtitle
}) => {
  const theme = useTheme();

  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      case 'success':
        return theme.palette.success.main;
      case 'default':
        return theme.palette.grey[600];
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: getColor(),
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.9,
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 32, color: 'white' } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
