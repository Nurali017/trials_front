import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';

interface ErrorTestComponentProps {
  shouldThrow?: boolean;
}

const ErrorTestComponent: React.FC<ErrorTestComponentProps> = ({ shouldThrow = false }) => {
  const [count, setCount] = useState(0);

  if (shouldThrow) {
    throw new Error('This is a test error to demonstrate error boundary functionality');
  }

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Error Test Component
      </Typography>
      <Typography variant="body1" gutterBottom>
        Count: {count}
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => setCount(count + 1)}
        sx={{ mr: 1 }}
      >
        Increment
      </Button>
      <Button 
        variant="outlined" 
        color="error"
        onClick={() => {
          throw new Error('Manual error triggered');
        }}
      >
        Trigger Error
      </Button>
    </Box>
  );
};

export default ErrorTestComponent;

