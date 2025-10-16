import React from 'react';
import {
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';

interface EmptyPlanStateProps {
  onAddCulture: () => void;
}

const EmptyPlanState: React.FC<EmptyPlanStateProps> = ({ onAddCulture }) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 6,
        textAlign: 'center',
        bgcolor: 'grey.50',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: 'grey.300',
      }}
    >
      <FolderOpenIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
      <Typography variant="h6" gutterBottom color="text.secondary">
        План пуст
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        Добавьте культуры и типы испытаний, чтобы начать работу с планом.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onAddCulture}
      >
        Добавить культуру
      </Button>
    </Paper>
  );
};

export default EmptyPlanState;
