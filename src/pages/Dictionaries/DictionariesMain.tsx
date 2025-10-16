import React from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import {
  Grass as GrassIcon,
  LocalFlorist as LocalFloristIcon,
  Map as MapIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDictionaries } from '@/hooks/useDictionaries';

interface DictionaryCard {
  title: string;
  icon: React.ReactElement;
  path: string;
  description: string;
  count?: number;
}

export const DictionariesMain: React.FC = () => {
  const navigate = useNavigate();
  const { cultureGroups, cultures, oblasts, regions, indicators } = useDictionaries();

  const dictionaries: DictionaryCard[] = [
    {
      title: 'Группы культур',
      icon: <GrassIcon sx={{ fontSize: 40 }} />,
      path: '/dictionaries/culture-groups',
      description: 'Группировка сельскохозяйственных культур',
      count: cultureGroups.length,
    },
    {
      title: 'Культуры',
      icon: <LocalFloristIcon sx={{ fontSize: 40 }} />,
      path: '/dictionaries/cultures',
      description: 'Справочник сельскохозяйственных культур',
      count: cultures.length,
    },
    {
      title: 'Области',
      icon: <MapIcon sx={{ fontSize: 40 }} />,
      path: '/dictionaries/oblasts',
      description: 'Административные области Казахстана',
      count: oblasts.length,
    },
    {
      title: 'ГСУ (Регионы)',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      path: '/dictionaries/regions',
      description: 'Государственные сортоиспытательные участки',
      count: regions.length,
    },
    {
      title: 'Показатели',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      path: '/dictionaries/indicators',
      description: 'Показатели для измерений и анализа',
      count: indicators.length,
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Справочники
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление справочными данными системы
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {dictionaries.map((dict) => (
          <Grid item xs={12} sm={6} md={4} key={dict.path}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => navigate(dict.path)}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      gap: 2,
                    }}
                  >
                    <Box sx={{ color: 'primary.main' }}>{dict.icon}</Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div">
                        {dict.title}
                      </Typography>
                      {dict.count !== undefined && (
                        <Chip
                          label={`${dict.count} записей`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {dict.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

