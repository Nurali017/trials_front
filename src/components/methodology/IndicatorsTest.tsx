import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { MethodologyTable } from './MethodologyTable';
import { MethodologyTableResponse } from '@/types/methodology.types';

// Тестовые данные для проверки отображения показателей
const testData: MethodologyTableResponse = {
  oblast: {
    id: 17,
    name: "Алматинская область"
  },
  year: 2025,
  years_range: [2023, 2024, 2025],
  generated_at: new Date().toISOString(),
  regions: [
    { id: 1, name: "Алматинский регион" },
    { id: 2, name: "Талдыкорганский регион" }
  ],
  methodology_table: {
    "Алматинский регион": {
      "Раннеспелая группа": {
        group_code: "EARLY",
        group_name: "Раннеспелая группа",
        sorts: [
          {
            sort_name: "Патриция",
            application_number: "5",
            is_standard: false,
            is_comparison_standard: false,
            yields_by_year: { "2023": 8.5, "2024": 9.1, "2025": 9.2 },
            average_yield: 8.9,
            deviation_percent: 12.2,
            years_tested: 3,
            year_started: 2023,
            main_indicators: {
              "plant_height": {
                value: 51.0,
                unit: "см",
                name: "Высота растений",
                description: "Высота растения или стеблестоя"
              },
              "vegetation_period": {
                value: 80.0,
                unit: "дней",
                name: "Вегетационный период",
                description: "Период от посева/всходов до созревания"
              },
              "yield": {
                value: 9.2,
                unit: "ц/га",
                name: "Урожайность",
                description: "Общий показатель урожайности для большинства культур"
              },
              "thousand_seed_weight": {
                value: 24.4,
                unit: "г",
                name: "Масса 1000 зёрен/семян",
                description: "Масса 1000 семян или зёрен"
              },
              "emergence_completeness": {
                value: 77.0,
                unit: "%",
                name: "Полнота всходов",
                description: "Полнота всходов, определяется после полных всходов"
              },
              "tillering": {
                value: 1.1,
                unit: "шт. продуктивных стеблей",
                name: "Продуктивная кустистость",
                description: "Количество продуктивных стеблей на растении"
              }
            },
            quality_indicators: {
              "protein_content": {
                value: 14.5,
                unit: "%",
                name: "Содержание белка/протеина",
                description: "Количество белка в зерне"
              },
              "gluten_content": {
                value: 32.0,
                unit: "%",
                name: "Содержание клейковины",
                description: "Количество клейковины в зерне"
              },
              "grain_nature": {
                value: 780.0,
                unit: "г/л",
                name: "Натура зерна",
                description: "Масса зерна в единице объема"
              }
            },
            decision_status: "decision_pending",
            latest_decision: null
          },
          {
            sort_name: "Стандарт",
            application_number: "СТАНДАРТ",
            is_standard: true,
            is_comparison_standard: true,
            yields_by_year: { "2023": 7.8, "2024": 8.2, "2025": 8.1 },
            average_yield: 8.0,
            deviation_percent: 0,
            years_tested: 3,
            year_started: 2023,
            main_indicators: {
              "plant_height": {
                value: 48.0,
                unit: "см",
                name: "Высота растений"
              },
              "vegetation_period": {
                value: 85.0,
                unit: "дней",
                name: "Вегетационный период"
              },
              "yield": {
                value: 8.1,
                unit: "ц/га",
                name: "Урожайность"
              }
            },
            quality_indicators: {
              "protein_content": {
                value: 13.2,
                unit: "%",
                name: "Содержание белка/протеина"
              }
            },
            decision_status: "approved",
            latest_decision: null
          }
        ]
      }
    }
  },
  standards_by_group: {},
  quality_indicators: {},
  warnings: [],
  has_warnings: false
};

export const IndicatorsTest: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Тест отображения показателей в методологической таблице
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Этот компонент демонстрирует новую функциональность отображения основных и лабораторных показателей 
          в методологической таблице с использованием вкладок. Нажмите на кнопку "Показатели" в строке сорта, 
          чтобы увидеть детальную информацию с переключением между типами показателей.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Новые возможности:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 📊 <strong>Вкладки</strong> - переключение между основными и лабораторными показателями
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 🎨 <strong>Улучшенный дизайн</strong> - каждый показатель в отдельной карточке
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 📝 <strong>Описания</strong> - подробные описания для каждого показателя
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • 🔄 <strong>Интерактивность</strong> - плавное переключение между вкладками
        </Typography>
      </Paper>

      <MethodologyTable data={testData} />
    </Box>
  );
};
