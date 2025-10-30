import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactElement;
  color?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  color = '#1976d2',
  onClick
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `3px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? {
          borderColor: color,
          transform: 'translateY(-2px)',
          boxShadow: 1,
        } : {},
      }}
      onClick={onClick}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: 0.8,
              color: color,
              opacity: 0.85,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              mt: 0.5,
              lineHeight: 1.2,
              color: '#000',
            }}
          >
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box
            sx={{
              color: color,
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 32 } })}
          </Box>
        )}
      </Box>
    </Paper>
  );
};
