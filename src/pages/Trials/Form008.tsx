import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Agriculture as AgricultureIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useForm008, 
  useSaveForm008, 
  useSaveForm008Yield, 
  useUpdateTrialConditions,
  useForm008Statistics,
  trialKeys
} from '@/hooks/useTrials';
import { StatisticsPreviewDialog } from '@/components/forms/StatisticsPreviewDialog';
import { Form008IndicatorsManagementDialog } from '@/components/forms/Form008IndicatorsManagementDialog';
import { PlotInputs } from '@/components/forms/PlotInputs';
import { debounce } from '@/utils/debounce';
import type { 
  Form008Data, 
  Form008Result, 
  Form008Warning,
  Form008UpdateConditionsRequest,
  TrialStatistics,
} from '@/types/api.types';

// Константы опций для условий испытания
const AGRO_BACKGROUND_OPTIONS = [
  { value: 'favorable', label: 'Благоприятный' },
  { value: 'moderate', label: 'Умеренный' },
  { value: 'unfavorable', label: 'Неблагоприятный' },
];

const GROWING_CONDITIONS_OPTIONS = [
  { value: 'rainfed', label: 'Богара' },
  { value: 'irrigated', label: 'Орошение' },
  { value: 'drained', label: 'На осушенных почвах' },
  { value: 'mixed', label: 'Смешанное' },
];

const CULTIVATION_TECHNOLOGY_OPTIONS = [
  { value: 'traditional', label: 'Обычная' },
  { value: 'minimal', label: 'Минимальная' },
  { value: 'no_till', label: 'No-till' },
  { value: 'organic', label: 'Органическая' },
];

const GROWING_METHOD_OPTIONS = [
  { value: 'soil_traditional', label: 'В почве' },
  { value: 'hydroponics', label: 'Гидропоника' },
  { value: 'greenhouse', label: 'Защищенный грунт' },
  { value: 'container', label: 'Контейнеры' },
  { value: 'raised_beds', label: 'Приподнятые грядки' },
];

const HARVEST_TIMING_OPTIONS = [
  { value: 'very_early', label: 'Очень ранний' },
  { value: 'early', label: 'Ранний' },
  { value: 'medium_early', label: 'Среднеранний' },
  { value: 'medium', label: 'Средний' },
  { value: 'medium_late', label: 'Среднепоздний' },
  { value: 'late', label: 'Поздний' },
  { value: 'very_late', label: 'Очень поздний' },
];

// Функция для преобразования русских названий в английские коды
const translateValueToCode = <T extends string>(value: string | undefined, options: Array<{value: T, label: string}>): T | undefined => {
  if (!value) return undefined;
  
  // Если значение уже является кодом, возвращаем его
  if (options.some(opt => opt.value === value)) {
    return value as T;
  }
  
  // Ищем по русскому названию (точное совпадение)
  const exactOption = options.find(opt => opt.label === value);
  if (exactOption) {
    return exactOption.value;
  }
  
  // Ищем по частичному совпадению (на случай если есть лишние пробелы или регистр)
  const partialOption = options.find(opt => 
    opt.label.toLowerCase().trim() === value.toLowerCase().trim()
  );
  if (partialOption) {
    return partialOption.value;
  }
  
  // Ищем по ключевым словам (для более гибкого поиска)
  const keywordOption = options.find(opt => {
    const labelWords = opt.label.toLowerCase().split(/\s+/);
    const valueWords = value.toLowerCase().split(/\s+/);
    // Проверяем, есть ли общие ключевые слова длиннее 3 символов
    return labelWords.some(word => valueWords.includes(word) && word.length > 3);
  });
  if (keywordOption) {
    return keywordOption.value;
  }
  
  // Специальные случаи для API значений
  const specialMappings: Record<string, string> = {
    'Минимальная обработка': 'minimal',
    'Среднеранняя': 'medium_early',
  };
  
  if (specialMappings[value]) {
    const mappedValue = specialMappings[value];
    const option = options.find(opt => opt.value === mappedValue);
    if (option) {
      return option.value;
    }
  }
  
  console.warn(`❌ Не найдено соответствие для значения "${value}" в опциях:`, options.map(o => o.label));
  return undefined;
};

export const Form008: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const trialId = Number(id);
  const { data: form008Data, isLoading } = useForm008(trialId);
  const { data: form008Statistics } = useForm008Statistics(trialId);
  // const { data: validationRules, isLoading: isLoadingValidation } = useForm008ValidationRules(trialId);
  const { mutate: saveForm, isPending: isSaving } = useSaveForm008();
  const { mutate: saveYield, isPending: isSavingYield } = useSaveForm008Yield();
  const { mutate: updateConditions } = useUpdateTrialConditions();

  // Определяем режим только для чтения на основе статуса испытания
  const isReadOnly = useMemo(() => {
    if (!form008Data?.trial?.status) return false;
    return ['completed_008', 'lab_sample_sent', 'lab_completed', 'completed', 'approved', 'continue'].includes(form008Data.trial.status);
  }, [form008Data?.trial?.status]);

  // State для данных формы
  const [formData, setFormData] = useState<Record<number, Record<string, Form008Result>>>({});
  const [harvestDate, setHarvestDate] = useState<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [statisticsPreviewDialogOpen, setStatisticsPreviewDialogOpen] = useState(false);
  const [indicatorsManagementDialogOpen, setIndicatorsManagementDialogOpen] = useState(false);
  const [warnings, setWarnings] = useState<Form008Warning[]>([]);
  const [participantCodes, setParticipantCodes] = useState<Record<number, { statistical_result: number; statistical_result_display: string }>>({});
  const [savedStatistics, setSavedStatistics] = useState<TrialStatistics | undefined>(undefined);
  const [manualStatistics, setManualStatistics] = useState<{
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
  } | null>(null);
  const [needsStatisticsRecalculation, setNeedsStatisticsRecalculation] = useState(false);
  
  // Навигация по ячейкам
  const [currentCell, setCurrentCell] = useState<{participantId: number, indicatorCode: string} | null>(null);
  
  // Дополнительная защита фокуса
  useEffect(() => {
    if (currentCell) {
      const focusProtection = setInterval(() => {
        const activeElement = document.activeElement as HTMLInputElement;
        const isInputFocused = activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'number';
        
        if (!isInputFocused) {
          // Пытаемся найти и сфокусировать активную ячейку
          const cellElement = document.querySelector(`[data-participant-id="${currentCell.participantId}"][data-indicator-code="${currentCell.indicatorCode}"]`);
          if (cellElement) {
            const inputElement = cellElement.querySelector('input[type="number"]') as HTMLInputElement;
            if (inputElement) {
              inputElement.focus();
              inputElement.select();
              if (import.meta.env.DEV) {
              }
            }
          }
        }
      }, 2000); // Проверяем каждые 2 секунды

      return () => {
        clearInterval(focusProtection);
      };
    }
  }, [currentCell]);

  // Обработчик клика для предотвращения потери фокуса
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (currentCell) {
        const target = e.target as HTMLElement;
        const isInputClick = target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number';
        const isCellClick = target.closest(`[data-participant-id="${currentCell.participantId}"][data-indicator-code="${currentCell.indicatorCode}"]`);
        
        // Если клик не по полю ввода и не по активной ячейке, восстанавливаем фокус
        if (!isInputClick && !isCellClick) {
          setTimeout(() => {
            const cellElement = document.querySelector(`[data-participant-id="${currentCell.participantId}"][data-indicator-code="${currentCell.indicatorCode}"]`);
            if (cellElement) {
              const inputElement = cellElement.querySelector('input[type="number"]') as HTMLInputElement;
              if (inputElement) {
                inputElement.focus();
                inputElement.select();
                if (import.meta.env.DEV) {
                }
              }
            }
          }, 100);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [currentCell]);
  
  // Функция навигации по ячейкам
  const handleCellNavigation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (import.meta.env.DEV) {
    }
    
    if (!data?.participants || !data?.indicators) {
      if (import.meta.env.DEV) {
      }
      return;
    }
    
    const participants = data.participants;
    const indicators = data.indicators;
    
    if (!currentCell) {
      // Если нет текущей ячейки, начинаем с первой
      setCurrentCell({ participantId: participants[0].id, indicatorCode: indicators[0].code });
      // Прокручиваем к первой ячейке
      setTimeout(() => scrollToCurrentCell(participants[0].id, indicators[0].code), 100);
      return;
    }
    
    const currentParticipantIndex = participants.findIndex(p => p.id === currentCell.participantId);
    const currentIndicatorIndex = indicators.findIndex(i => i.code === currentCell.indicatorCode);
    
    if (currentParticipantIndex === -1 || currentIndicatorIndex === -1) return;
    
    let newParticipantIndex = currentParticipantIndex;
    let newIndicatorIndex = currentIndicatorIndex;
    
    switch (direction) {
      case 'up':
        newParticipantIndex = Math.max(0, currentParticipantIndex - 1);
        break;
      case 'down':
        newParticipantIndex = Math.min(participants.length - 1, currentParticipantIndex + 1);
        break;
      case 'left':
        newIndicatorIndex = Math.max(0, currentIndicatorIndex - 1);
        break;
      case 'right':
        newIndicatorIndex = Math.min(indicators.length - 1, currentIndicatorIndex + 1);
        break;
    }
    
    const newParticipantId = participants[newParticipantIndex].id;
    const newIndicatorCode = indicators[newIndicatorIndex].code;
    
    // Сначала снимаем фокус с текущей ячейки
    if (currentCell) {
      const oldCellElement = document.querySelector(`[data-participant-id="${currentCell.participantId}"][data-indicator-code="${currentCell.indicatorCode}"]`);
      if (oldCellElement) {
        const oldInputElement = oldCellElement.querySelector('input[type="number"]') as HTMLInputElement;
        if (oldInputElement) {
          oldInputElement.blur();
        }
      }
    }
    
    setCurrentCell({
      participantId: newParticipantId,
      indicatorCode: newIndicatorCode
    });
    
    if (import.meta.env.DEV) {
      // console.log('Form008: Navigation completed', {
      //   from: currentCell,
      //   to: { participantId: newParticipantId, indicatorCode: newIndicatorCode },
      //   direction
      // });
    }
    
    // Прокручиваем к новой ячейке с небольшой задержкой
    setTimeout(() => scrollToCurrentCell(newParticipantId, newIndicatorCode), 150);
    
    // Дополнительно принудительно фокусируемся на новой ячейке
    setTimeout(() => {
      const cellElement = document.querySelector(`[data-participant-id="${newParticipantId}"][data-indicator-code="${newIndicatorCode}"]`);
      if (cellElement) {
        const inputElement = cellElement.querySelector('input[type="number"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          inputElement.select();
          if (import.meta.env.DEV) {
          }
        }
      }
    }, 200);
  };

  // Функция прокрутки к текущей ячейке
  const scrollToCurrentCell = (participantId: number, indicatorCode: string) => {
    const cellElement = document.querySelector(`[data-participant-id="${participantId}"][data-indicator-code="${indicatorCode}"]`);
    if (cellElement) {
      cellElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
      
      // Убираем дублирующую логику фокуса - это делает PlotInputs
      if (import.meta.env.DEV) {
      }
    }
  };

  // Объединяем данные формы с данными статистики
  const enhancedForm008Data = useMemo(() => {
    if (!form008Data) return undefined;
    
    // Если есть данные статистики, добавляем их к данным формы
    if (form008Statistics) {
      return {
        ...form008Data,
        auto_statistics: form008Statistics.auto_statistics,
        standard: form008Statistics.standard,
        comparison: form008Statistics.comparison,
      };
    }
    
    return form008Data;
  }, [form008Data, form008Statistics]);
  
  // Состояние для условий испытания
  const [conditionsData, setConditionsData] = useState<Form008UpdateConditionsRequest>({
    agro_background: undefined,
    growing_conditions: undefined,
    cultivation_technology: undefined,
    growing_method: undefined,
    harvest_timing: undefined,
    harvest_date: '',
    additional_info: '',
  });

  // Инициализация данных формы
  useEffect(() => {
    if (form008Data) {
      const data = form008Data as Form008Data;
      
      // 🔍 Логирование валидации показателей в Form008
      
      if (data.indicators && data.indicators.length > 0) {
        // Анализ каждого показателя
        data.indicators.forEach(indicator => {
          const validation = data.min_max?.[indicator.code];
          const validationRules = indicator.validation_rules;
          
          // console.log(`🔍 Показатель "${indicator.name}" (${indicator.code}):`, {
          //   id: indicator.id,
          //   name: indicator.name,
          //   code: indicator.code,
          //   unit: indicator.unit,
          //   category: indicator.category,
          //   is_quality: indicator.is_quality,
          //   is_auto_calculated: indicator.is_auto_calculated,
          //   validation_min_max: validation,
          //   validation_rules: validationRules,
          //   allFields: Object.keys(indicator)
          // });
          
          // Детальный анализ валидационных правил
          if (validationRules) {
            // console.log(`📋 Валидационные правила для "${indicator.name}":`, validationRules);
          }
        });
        
        // Проверка полей валидации в показателях
        const validationFields = ['validation', 'validation_rules', 'rules', 'constraints', 'min', 'max', 'required', 'type'];
        const sampleIndicator = data.indicators[0];
        const foundValidationFields = validationFields.filter(field => field in sampleIndicator);
        // console.log('✅ Поля валидации в показателях:', foundValidationFields);
        
        if (foundValidationFields.length === 0) {
          // console.log('❌ Поля валидации НЕ найдены в структуре показателей');
        } else {
          // console.log('✅ Найдены поля валидации:', foundValidationFields);
          
          // Показываем пример валидационных правил
          const exampleValidation = sampleIndicator.validation_rules;
          if (exampleValidation) {
            // console.log('📋 Пример validation_rules:', exampleValidation);
          }
        }
      }
      
      if (data.min_max) {
        // console.log('📊 Валидация min_max доступна для показателей:', Object.keys(data.min_max));
      } else {
        // console.log('❌ Валидация min_max НЕ получена');
      }
      const initialData: Record<number, Record<string, Form008Result>> = {};
      
      data.participants.forEach((participant) => {
        const cleanResults: Record<string, Form008Result> = {};
        Object.entries(participant.current_results || {}).forEach(([key, value]) => {
          // Конвертируем в Form008Result
          if (value && typeof value === 'object') {
            cleanResults[key] = value as Form008Result;
          } else {
            // Для обратной совместимости с простыми числами
            const numValue = value === null || value === undefined || value === '' 
              ? null 
              : typeof value === 'number' 
                ? value 
                : parseFloat(String(value));
            
            cleanResults[key] = {
              value: isNaN(numValue as number) ? undefined : numValue as number,
              is_rejected: false,
              is_restored: false,
            };
          }
        });
        initialData[participant.id] = cleanResults;
      });
      
      setFormData(initialData);
      setHarvestDate(data.trial.harvest_date || '');
      setWarnings(data.warnings || []);
      
      // Инициализация данных условий испытания с преобразованием значений
      const initialConditions: Form008UpdateConditionsRequest = {
        agro_background: translateValueToCode(data.trial.agro_background, AGRO_BACKGROUND_OPTIONS) as any,
        growing_conditions: translateValueToCode(data.trial.growing_conditions, GROWING_CONDITIONS_OPTIONS) as any,
        cultivation_technology: translateValueToCode(data.trial.cultivation_technology, CULTIVATION_TECHNOLOGY_OPTIONS) as any,
        growing_method: translateValueToCode(data.trial.growing_method, GROWING_METHOD_OPTIONS) as any,
        harvest_timing: translateValueToCode(data.trial.harvest_timing, HARVEST_TIMING_OPTIONS) as any,
        harvest_date: data.trial.harvest_date || '',
        additional_info: data.trial.additional_info || '',
      };
      
      // console.log('🔍 Инициализация условий испытания:');
      // console.log('- Исходные данные из API:', {
      //   agro_background: data.trial.agro_background,
      //   growing_conditions: data.trial.growing_conditions,
      //   cultivation_technology: data.trial.cultivation_technology,
      //   growing_method: data.trial.growing_method,
      //   harvest_timing: data.trial.harvest_timing,
      //   harvest_date: data.trial.harvest_date,
      //   additional_info: data.trial.additional_info,
      // });
      // console.log('- Преобразованные данные:', initialConditions);
      
      // Проверяем, какие поля не удалось преобразовать
      const failedConversions = [];
      if (data.trial.agro_background && !initialConditions.agro_background) {
        failedConversions.push(`agro_background: "${data.trial.agro_background}"`);
      }
      if (data.trial.growing_conditions && !initialConditions.growing_conditions) {
        failedConversions.push(`growing_conditions: "${data.trial.growing_conditions}"`);
      }
      if (data.trial.cultivation_technology && !initialConditions.cultivation_technology) {
        failedConversions.push(`cultivation_technology: "${data.trial.cultivation_technology}"`);
      }
      if (data.trial.growing_method && !initialConditions.growing_method) {
        failedConversions.push(`growing_method: "${data.trial.growing_method}"`);
      }
      if (data.trial.harvest_timing && !initialConditions.harvest_timing) {
        failedConversions.push(`harvest_timing: "${data.trial.harvest_timing}"`);
      }
      
      if (failedConversions.length > 0) {
        console.warn('⚠️ Не удалось преобразовать следующие поля:', failedConversions);
      } else {
        // console.log('✅ Все поля успешно преобразованы');
      }
      
      setConditionsData(initialConditions);
      
      // Инициализация кодов групп
      const codes: Record<number, { statistical_result: number; statistical_result_display: string }> = {};
      data.participants.forEach((participant) => {
        if (participant.statistical_result !== undefined && participant.statistical_result_display) {
          codes[participant.id] = {
            statistical_result: participant.statistical_result,
            statistical_result_display: participant.statistical_result_display,
          };
        }
      });
      setParticipantCodes(codes);
    }
  }, [form008Data]);

  // 🔍 Эндпоинт /form008.indicators.validation_rules/ не существует (404)
  // Валидация доступна в form008Data.min_max

  // Автосохранение с debounce
  const autoSave = useCallback(
    debounce((data: Record<number, Record<string, Form008Result>>, harvest: string) => {
      if (!form008Data) return;

      const participants = Object.entries(data).map(([participantId, results]) => ({
        participant_id: Number(participantId),
        results,
      }));

      saveForm(
        {
          trialId,
          payload: {
            is_final: false,
            harvest_date: harvest || undefined,
            participants,
          },
        },
        {
          onSuccess: () => {
            setLastSaved(new Date());
          },
          onError: (error: any) => {
            console.error('Автосохранение не удалось:', error);
          },
        }
      );
    }, 2000), // 2 секунды debounce
    [trialId, form008Data, saveForm]
  );

  // Обработчик изменения ячейки
  const handleCellChange = (participantId: number, indicatorCode: string, result: Form008Result) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [participantId]: {
          ...prev[participantId],
          [indicatorCode]: result,
        },
      };
      
      // Если изменилась урожайность, отмечаем что нужен пересчет статистики
      if (indicatorCode === 'yield' && (savedStatistics || participantCodes && Object.keys(participantCodes).length > 0)) {
        setNeedsStatisticsRecalculation(true);
      }
      
      // Автосохранение
      autoSave(updated, harvestDate);
      
      return updated;
    });
  };

  // Обработчик изменения условий испытания
  const handleConditionsChange = (field: keyof Form008UpdateConditionsRequest, value: any) => {
    // console.log(`🔄 Изменение поля "${field}":`, value);
    
    setConditionsData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // console.log('📝 Обновленные условия испытания:', updated);
      
      // Автосохранение условий испытания с debounce
      autoSaveConditions(updated);
      
      return updated;
    });
  };

  // Автосохранение условий испытания с debounce
  const autoSaveConditions = useCallback(
    debounce((data: Form008UpdateConditionsRequest) => {
      // Проверяем, что есть хотя бы одно заполненное поле для сохранения
      const hasAnyData = data.agro_background !== undefined || 
                        data.growing_conditions !== undefined || 
                        data.cultivation_technology !== undefined || 
                        data.growing_method !== undefined || 
                        data.harvest_timing !== undefined || 
                        data.harvest_date !== undefined || 
                        data.additional_info !== undefined;
      
      if (hasAnyData) {
        // console.log('🔄 Автосохранение условий испытания:', data);
        updateConditions(
          {
            trialId,
            payload: data,
          },
          {
            onSuccess: (response) => {
              setLastSaved(new Date());
              // console.log('✅ Условия испытания успешно сохранены');
              
              // Обновляем локальное состояние с данными из ответа сервера
              if (response?.trial) {
                // console.log('📥 Данные из ответа автосохранения:', {
                //   agro_background: response.trial.agro_background,
                //   growing_conditions: response.trial.growing_conditions,
                //   cultivation_technology: response.trial.cultivation_technology,
                //   growing_method: response.trial.growing_method,
                //   harvest_timing: response.trial.harvest_timing,
                //   harvest_date: response.trial.harvest_date,
                //   additional_info: response.trial.additional_info,
                // });
                
                const updatedConditions: Form008UpdateConditionsRequest = {
                  agro_background: translateValueToCode(response.trial.agro_background, AGRO_BACKGROUND_OPTIONS) as any,
                  growing_conditions: translateValueToCode(response.trial.growing_conditions, GROWING_CONDITIONS_OPTIONS) as any,
                  cultivation_technology: translateValueToCode(response.trial.cultivation_technology, CULTIVATION_TECHNOLOGY_OPTIONS) as any,
                  growing_method: translateValueToCode(response.trial.growing_method, GROWING_METHOD_OPTIONS) as any,
                  harvest_timing: translateValueToCode(response.trial.harvest_timing, HARVEST_TIMING_OPTIONS) as any,
                  harvest_date: response.trial.harvest_date || '',
                  additional_info: response.trial.additional_info || '',
                };
                
                // console.log('🔄 Обновление локального состояния после автосохранения:', updatedConditions);
                setConditionsData(updatedConditions);
              } else {
                console.warn('⚠️ Ответ автосохранения не содержит данных trial:', response);
              }
            },
            onError: (error: any) => {
              console.error('❌ Автосохранение условий не удалось:', error);
            },
          }
        );
      } else {
        // console.log('⏭️ Пропуск автосохранения - нет данных для сохранения');
      }
    }, 2000), // Уменьшаем debounce до 2 секунд для более быстрого сохранения
    [trialId, updateConditions]
  );

  // Сохранение условий испытания
  const handleSaveConditions = () => {
    // console.log('💾 Принудительное сохранение условий испытания:', conditionsData);
    
    // Валидация обязательных полей
    const missingFields = [];
    if (!conditionsData.agro_background) missingFields.push('агрономический фон');
    if (!conditionsData.growing_conditions) missingFields.push('условия возделывания');
    if (!conditionsData.cultivation_technology) missingFields.push('технология возделывания');
    if (!conditionsData.growing_method) missingFields.push('способ выращивания');
    
    if (missingFields.length > 0) {
      enqueueSnackbar(`Заполните обязательные поля: ${missingFields.join(', ')}`, { variant: 'warning' });
      return;
    }

    updateConditions(
      {
        trialId,
        payload: conditionsData,
      },
      {
        onSuccess: (response) => {
          // console.log('✅ Условия испытания успешно сохранены:', response);
          enqueueSnackbar('Условия испытания обновлены', { variant: 'success' });
          
          // Обновляем локальное состояние с данными из ответа сервера
          if (response.trial) {
            // console.log('📥 Данные из ответа сервера:', {
            //   agro_background: response.trial.agro_background,
            //   growing_conditions: response.trial.growing_conditions,
            //   cultivation_technology: response.trial.cultivation_technology,
            //   growing_method: response.trial.growing_method,
            //   harvest_timing: response.trial.harvest_timing,
            //   harvest_date: response.trial.harvest_date,
            //   additional_info: response.trial.additional_info,
            // });
            
            const updatedConditions: Form008UpdateConditionsRequest = {
              agro_background: translateValueToCode(response.trial.agro_background, AGRO_BACKGROUND_OPTIONS) as any,
              growing_conditions: translateValueToCode(response.trial.growing_conditions, GROWING_CONDITIONS_OPTIONS) as any,
              cultivation_technology: translateValueToCode(response.trial.cultivation_technology, CULTIVATION_TECHNOLOGY_OPTIONS) as any,
              growing_method: translateValueToCode(response.trial.growing_method, GROWING_METHOD_OPTIONS) as any,
              harvest_timing: translateValueToCode(response.trial.harvest_timing, HARVEST_TIMING_OPTIONS) as any,
              harvest_date: response.trial.harvest_date || '',
              additional_info: response.trial.additional_info || '',
            };
            
            // console.log('🔄 Обновление локального состояния после сохранения:', updatedConditions);
            setConditionsData(updatedConditions);
            
            // Принудительно обновляем данные формы из API
            queryClient.invalidateQueries({ queryKey: [...trialKeys.detail(trialId), 'form008'] });
          } else {
            console.warn('⚠️ Ответ сервера не содержит данных trial:', response);
          }
        },
        onError: (error: any) => {
          console.error('❌ Ошибка сохранения условий:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Неизвестная ошибка';
          enqueueSnackbar(`Ошибка сохранения: ${errorMessage}`, { variant: 'error' });
        },
      }
    );
  };


  // Сохранить урожайность и показать расчеты
  const handleSaveYield = () => {
    if (!form008Data) return;

    const participants = Object.entries(formData).map(([participantId, results]) => ({
      participant_id: Number(participantId),
      results,
    }));

    // Подготавливаем статистические параметры для расчета кодов групп
    const autoStats = enhancedForm008Data?.auto_statistics;
    
    // Проверяем, есть ли ручные изменения статистики
    const hasManualStats = manualStatistics !== null;
    
    const statistics = autoStats ? {
      lsd_095: hasManualStats ? manualStatistics?.lsd_095 : autoStats.auto_lsd_095,
      error_mean: hasManualStats ? manualStatistics?.error_mean : autoStats.auto_error_mean,
      accuracy_percent: hasManualStats ? manualStatistics?.accuracy_percent : autoStats.auto_accuracy_percent,
      use_auto_calculation: !hasManualStats, // Используем авторасчет только если нет ручных изменений
    } : undefined;

    saveYield(
      {
        trialId,
        participants,
        statistics, // Передаем статистические параметры
      },
      {
        onSuccess: (response) => {
          enqueueSnackbar('Урожайность сохранена', { variant: 'success' });
          setLastSaved(new Date());
          setNeedsStatisticsRecalculation(false); // Сбрасываем флаг после пересчета
          
          // Обновить коды групп
          if (response.participants_codes && response.participants_codes.length > 0) {
            const newCodes: Record<number, { statistical_result: number; statistical_result_display: string }> = {};
            response.participants_codes.forEach((code) => {
              newCodes[code.participant_id] = {
                statistical_result: code.statistical_result,
                statistical_result_display: code.statistical_result_display,
              };
            });
            setParticipantCodes(prev => ({ ...prev, ...newCodes }));
            
            enqueueSnackbar(
              `Рассчитаны коды групп для ${response.participants_codes.length} участников`, 
              { variant: 'info' }
            );
          }

          // Сохранить статистику и показать диалог с результатами расчетов
          if (response.statistics) {
            setSavedStatistics(response.statistics);
            setStatisticsPreviewDialogOpen(true);
          }
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  // Функции для управления ручными статистиками
  const handleUseManualStatistics = (values: {
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
  }) => {
    setManualStatistics(values);
    enqueueSnackbar('Используются ручные параметры статистики', { variant: 'info' });
  };

  const handleResetToAutoStatistics = () => {
    setManualStatistics(null);
    enqueueSnackbar('Сброшено к авторасчетам', { variant: 'info' });
  };

  // Отправить форму (финал)
  const handleSubmitFinal = () => {
    if (!form008Data) return;

    if (!harvestDate) {
      enqueueSnackbar('Укажите дату уборки урожая', { variant: 'warning' });
      return;
    }

    // Проверка предупреждений
    const criticalWarnings = warnings.filter(w => w.level === 'error');
    if (criticalWarnings.length > 0) {
      enqueueSnackbar('Исправьте критические ошибки перед отправкой', { variant: 'error' });
      return;
    }

    const participants = Object.entries(formData).map(([participantId, results]) => ({
      participant_id: Number(participantId),
      results,
    }));

    saveForm(
      {
        trialId,
        payload: {
          is_final: true,
          harvest_date: harvestDate,
          participants,
        },
      },
      {
        onSuccess: (response) => {
          enqueueSnackbar('Форма 008 успешно отправлена!', { variant: 'success' });
          
          // Инвалидация кэша после финального сохранения
          queryClient.invalidateQueries({ queryKey: ['trials', trialId] });
          queryClient.invalidateQueries({ queryKey: ['trials', trialId, 'form008'] });
          queryClient.invalidateQueries({ queryKey: ['trials'] });
          
          // Показать статистику
          if (response.statistics) {
            setStatisticsPreviewDialogOpen(true);
          }
          
          // Переход на страницу деталей через 2 секунды
          setTimeout(() => {
            navigate(`/trials/${trialId}`);
          }, 2000);
        },
        onError: (error: any) => {
          enqueueSnackbar(`Ошибка: ${error.message}`, { variant: 'error' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!form008Data) {
    return (
      <Alert severity="error">
        Не удалось загрузить форму 008. Возможно, испытание не найдено.
      </Alert>
    );
  }

  const data = form008Data as Form008Data;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <IconButton size="small" onClick={() => navigate(`/trials/${trialId}`)}>
              <BackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="bold">
              Форма 008 {isReadOnly && '(Просмотр)'}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {data.trial.culture_name} • {data.trial.region_name}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} alignItems="center">
          {lastSaved && (
            <Chip
              icon={<CheckIcon />}
              label={`Сохранено в ${lastSaved.toLocaleTimeString()}`}
              color="success"
              size="small"
              variant="outlined"
            />
          )}

            <Button
              variant="outlined"
              onClick={() => setIndicatorsManagementDialogOpen(true)}
              disabled={isSaving || isReadOnly}
            >
              Управление показателями
            </Button>

            {/* Кнопка сохранения урожайности с расчетами */}
            <Button
              variant="outlined"
              startIcon={isSavingYield ? <CircularProgress size={16} /> : <AgricultureIcon />}
              onClick={handleSaveYield}
              disabled={isSaving || isSavingYield || isReadOnly}
              color={needsStatisticsRecalculation ? "warning" : "success"}
            >
              {needsStatisticsRecalculation ? "🔄 Пересчитать статистику" : "Сохранить урожайность и рассчитать"}
            </Button>



          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitFinal}
            disabled={isSaving || isReadOnly}
            color="primary"
          >
            {isReadOnly ? 'Форма отправлена' : 'Отправить форму'}
          </Button>
        </Box>
      </Box>

      {/* Harvest Date and Trial Conditions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🌱 Условия испытания и дата уборки урожая
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Заполните условия проведения испытания согласно форме 008. 
            Эти данные используются для статистической обработки и отчетности.
            <strong>Автосохранение:</strong> условия автоматически сохраняются через 2 секунды после изменения любого поля.
            Дополнительная информация находится в конце формы после таблицы с данными.
          </Typography>
        </Alert>

        {/* Уведомление о необходимости пересчета статистики */}
        {needsStatisticsRecalculation && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>⚠️ Требуется пересчет статистики!</strong> 
              <br />
              Данные урожайности были изменены. Нажмите "🔄 Пересчитать статистику" для обновления кодов групп участников.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Дата уборки урожая */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Дата уборки урожая"
              type="date"
              value={harvestDate}
              onChange={(e) => {
                setHarvestDate(e.target.value);
                // Синхронизируем с conditionsData
                handleConditionsChange('harvest_date', e.target.value);
                autoSave(formData, e.target.value);
              }}
              disabled={isReadOnly}
              InputLabelProps={{ shrink: true }}
              helperText="Обязательно для финальной отправки"
            />
          </Grid>

          {/* Агрономический фон */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Агрономический фон</InputLabel>
              <Select
                value={conditionsData.agro_background || ''}
                onChange={(e) => handleConditionsChange('agro_background', e.target.value)}
                label="Агрономический фон"
                disabled={isReadOnly}
              >
                {AGRO_BACKGROUND_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Условия возделывания */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Условия возделывания</InputLabel>
              <Select
                value={conditionsData.growing_conditions || ''}
                onChange={(e) => handleConditionsChange('growing_conditions', e.target.value)}
                label="Условия возделывания"
                disabled={isReadOnly}
              >
                {GROWING_CONDITIONS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Технология возделывания */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Технология возделывания</InputLabel>
              <Select
                value={conditionsData.cultivation_technology || ''}
                onChange={(e) => handleConditionsChange('cultivation_technology', e.target.value)}
                label="Технология возделывания"
                disabled={isReadOnly}
              >
                {CULTIVATION_TECHNOLOGY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Способ выращивания */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Способ выращивания</InputLabel>
              <Select
                value={conditionsData.growing_method || ''}
                onChange={(e) => handleConditionsChange('growing_method', e.target.value)}
                label="Способ выращивания"
                disabled={isReadOnly}
              >
                {GROWING_METHOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Сроки уборки */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Сроки уборки</InputLabel>
              <Select
                value={conditionsData.harvest_timing || ''}
                onChange={(e) => handleConditionsChange('harvest_timing', e.target.value)}
                label="Сроки уборки"
                disabled={isReadOnly}
              >
                {HARVEST_TIMING_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Кнопка сохранения условий */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  💾 Автосохранение: {conditionsData.agro_background || conditionsData.growing_conditions || conditionsData.cultivation_technology || conditionsData.growing_method ? 'Активно' : 'Ожидание данных'}
                </Typography>
                {lastSaved && (
                  <Typography variant="caption" color="text.secondary">
                    Последнее сохранение: {lastSaved.toLocaleTimeString()}
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                onClick={handleSaveConditions}
                disabled={isSaving || isReadOnly}
                color="primary"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить условия испытания'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Panel */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {lastSaved && (
            <Box display="flex" alignItems="center" gap={1}>
              <CheckIcon color="success" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Последнее сохранение: {lastSaved.toLocaleTimeString()}
              </Typography>
            </Box>
          )}
          
          {Object.keys(participantCodes).length > 0 && (
            <Box display="flex" alignItems="center" gap={1}>
              <CheckIcon color="primary" fontSize="small" />
              <Typography variant="body2" color="primary">
                Рассчитаны коды для {Object.keys(participantCodes).length} участников
              </Typography>
            </Box>
          )}
          
          {(isSaving || isSavingYield) && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Сохранение...
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {warnings.map((warning, index) => (
            <Alert 
              key={index} 
              severity={warning.level === 'error' ? 'error' : warning.level === 'warning' ? 'warning' : 'info'}
              sx={{ mb: 1 }}
            >
              {warning.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          ℹ️ <strong>Автосохранение включено:</strong> Данные автоматически сохраняются через 2 секунды после изменения ячейки, 
          условия испытания сохраняются через 2 секунды после изменения любого поля.
          Участников: <strong>{data.participants.length}</strong>, Показателей: <strong>{data.indicators.length}</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          ⌨️ <strong>Навигация:</strong> Используйте стрелки ↑↓←→ для перемещения между ячейками или кликните на любую ячейку. 
          Поле ввода автоматически получает фокус для немедленного ввода значений. Текущая ячейка выделена синей рамкой.
        </Typography>
      </Alert>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  minWidth: 80, 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                }}
              >
                №
              </TableCell>
              <TableCell 
                sx={{ 
                  minWidth: 200, 
                  fontWeight: 'bold', 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  position: 'sticky',
                  left: 80,
                  zIndex: 3,
                }}
              >
                Сорт
              </TableCell>
              {data.indicators.map((indicator) => (
                <TableCell
                  key={indicator.code}
                  sx={{ 
                    minWidth: 150, 
                    fontWeight: 'bold', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                  }}
                >
                  <Tooltip title={indicator.name}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {indicator.name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        ({indicator.unit})
                      </Typography>
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.participants
              .sort((a, b) => a.participant_number - b.participant_number)
              .map((participant) => (
                <TableRow key={participant.id} hover>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: participant.is_standard ? 'warning.50' : 'inherit',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                    }}
                  >
                    {participant.participant_number}
                  </TableCell>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 80,
                      zIndex: 1,
                      bgcolor: participant.is_standard ? 'warning.50' : 'background.paper',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {participant.sort_name}
                      </Typography>
                      {participant.is_standard && (
                        <Chip label="Стандарт" color="warning" size="small" />
                      )}
                      {participant.maturity_group_code && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Группа: {participant.maturity_group_code}
                        </Typography>
                      )}
                      {/* Показываем код группы из локального состояния или из данных участника */}
                      {(participantCodes[participant.id]?.statistical_result_display || participant.statistical_result_display) && (
                        <Typography variant="caption" color="primary" display="block" fontWeight="bold">
                          {participantCodes[participant.id]?.statistical_result_display || participant.statistical_result_display}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {data.indicators.map((indicator) => (
                    <TableCell
                      key={indicator.code}
                      data-participant-id={participant.id}
                      data-indicator-code={indicator.code}
                      onClick={() => {
                        setCurrentCell({ participantId: participant.id, indicatorCode: indicator.code });
                        setTimeout(() => scrollToCurrentCell(participant.id, indicator.code), 100);
                      }}
                      sx={{ 
                        bgcolor: participant.is_standard ? 'warning.50' : 'inherit',
                        cursor: 'pointer',
                        ...(currentCell?.participantId === participant.id && currentCell?.indicatorCode === indicator.code && {
                          border: '2px solid',
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50',
                        })
                      }}
                    >
                      <PlotInputs
                        value={formData[participant.id]?.[indicator.code] || null}
                        onChange={(result) => handleCellChange(participant.id, indicator.code, result)}
                        indicatorUnit={indicator.unit}
                        indicatorName={indicator.name}
                        disabled={isSaving || isReadOnly}
                        validationRules={indicator.validation_rules}
                        onNavigate={handleCellNavigation}
                        participantId={participant.id}
                        indicatorCode={indicator.code}
                        isActive={currentCell?.participantId === participant.id && currentCell?.indicatorCode === indicator.code}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Дополнительная информация */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📝 Дополнительная информация
        </Typography>
        
        <TextField
          fullWidth
          label="Дополнительная информация"
          multiline
          rows={4}
          value={conditionsData.additional_info}
          onChange={(e) => handleConditionsChange('additional_info', e.target.value)}
          placeholder="Дополнительные примечания о условиях проведения испытания, особенностях выращивания, погодных условиях и т.д..."
          disabled={isReadOnly}
          helperText="Любая дополнительная информация, которая может быть полезна для анализа результатов испытания"
        />
      </Paper>

        {/* Statistics Preview Dialog */}
        <StatisticsPreviewDialog
          open={statisticsPreviewDialogOpen}
          onClose={() => setStatisticsPreviewDialogOpen(false)}
          form008Data={enhancedForm008Data}
          savedStatistics={savedStatistics}
          manualStatistics={manualStatistics}
          onUseManualStatistics={handleUseManualStatistics}
          onResetToAutoStatistics={handleResetToAutoStatistics}
        />

        {/* Form 008 Indicators Management Dialog */}
        <Form008IndicatorsManagementDialog
          open={indicatorsManagementDialogOpen}
          onClose={() => setIndicatorsManagementDialogOpen(false)}
          trialId={trialId}
          form008Data={enhancedForm008Data}
        />
      </Box>
    );
  };

