import React from 'react';
import { Card, CardContent, Skeleton, Grid, Box } from '@mui/material';

interface CardSkeletonProps {
  count?: number;
  variant?: 'standard' | 'detailed';
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3, variant = 'standard' }) => {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
              {variant === 'detailed' && (
                <>
                  <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                  <Box display="flex" gap={1}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="50%" />
                  </Box>
                </>
              )}
              {variant === 'standard' && (
                <>
                  <Skeleton variant="text" width="90%" />
                  <Skeleton variant="text" width="70%" />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
