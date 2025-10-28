import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  title,
  value,
  icon,
  color = 'primary.main'
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: color,
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
));

StatCard.displayName = 'StatCard';
