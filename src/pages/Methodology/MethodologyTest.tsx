import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { IndicatorsTest } from '@/components/methodology';

export const MethodologyTest: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#fafafa',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 1,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Тестирование показателей в методологической таблице
          </Typography>
          
          <IndicatorsTest />
        </Paper>
      </Container>
    </Box>
  );
};