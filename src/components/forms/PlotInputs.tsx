import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { Form008Result } from '@/types/api.types';

interface PlotInputsProps {
  value: Form008Result | null;
  onChange: (value: Form008Result) => void;
  indicatorUnit: string;
  indicatorName: string;
  disabled?: boolean;
  validationRules?: {
    min_value?: number;
    max_value?: number;
    precision?: number;
    required?: boolean;
    type?: string;
    [key: string]: any;
  };
  // Навигация
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  participantId?: number;
  indicatorCode?: string;
  isActive?: boolean; // Является ли эта ячейка активной
}

export const PlotInputs: React.FC<PlotInputsProps> = ({
  value,
  onChange,
  indicatorUnit,
  indicatorName,
  disabled = false,
  validationRules,
  onNavigate,
  participantId,
  indicatorCode,
  isActive = false,
}) => {
  // Определяем, является ли показатель урожайностью (должно быть в начале компонента)
  const isYieldIndicator = indicatorName.toLowerCase().includes('урожайность') || 
                          indicatorName.toLowerCase().includes('yield') ||
                          indicatorName.toLowerCase().includes('урожай');

  const [usePlots, setUsePlots] = useState(false);
  const [plotValues, setPlotValues] = useState({
    plot_1: value?.plot_1 || '',
    plot_2: value?.plot_2 || '',
    plot_3: value?.plot_3 || '',
    plot_4: value?.plot_4 || '',
  });
  const [directValue, setDirectValue] = useState(value?.value || '');
  
  // Рефы для полей ввода
  const directInputRef = useRef<HTMLInputElement>(null);
  const plotInputRefs = {
    plot_1: useRef<HTMLInputElement>(null),
    plot_2: useRef<HTMLInputElement>(null),
    plot_3: useRef<HTMLInputElement>(null),
    plot_4: useRef<HTMLInputElement>(null),
  };

  // Автоматический фокус при активации ячейки - упрощенная версия
  useEffect(() => {
    if (isActive && !disabled) {
      const focusInput = () => {
        // Небольшая задержка для стабильности
        setTimeout(() => {
          if (usePlots && isYieldIndicator) {
            // Фокусируемся на первой делянке
            const firstPlotRef = plotInputRefs.plot_1.current;
            if (firstPlotRef && firstPlotRef.focus) {
              firstPlotRef.focus();
              // Проверяем, есть ли метод select
              if (typeof firstPlotRef.select === 'function') {
                firstPlotRef.select();
              }
              if (import.meta.env.DEV) {
              }
            }
          } else {
            // Фокусируемся на прямом вводе
            const directRef = directInputRef.current;
            if (directRef && directRef.focus) {
              directRef.focus();
              // Проверяем, есть ли метод select
              if (typeof directRef.select === 'function') {
                directRef.select();
              }
              if (import.meta.env.DEV) {
              }
            }
          }
        }, 50); // Уменьшенная задержка
      };
      
      focusInput();
      
      // Дополнительная проверка через больший интервал для надежности
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement === directInputRef.current ||
          Object.values(plotInputRefs).some(ref => activeElement === ref.current)
        );
        
        if (!isInputFocused) {
          if (import.meta.env.DEV) {
          }
          focusInput();
        }
      }, 300);
    }
  }, [isActive, usePlots, isYieldIndicator, disabled]);

  // Обработчики для предотвращения потери фокуса
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (import.meta.env.DEV) {
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Если ячейка активна, но фокус потерялся, пытаемся вернуть его
    if (isActive && !disabled) {
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isStillFocused = activeElement && (
          activeElement === directInputRef.current ||
          Object.values(plotInputRefs).some(ref => activeElement === ref.current)
        );
        
        if (!isStillFocused) {
          if (import.meta.env.DEV) {
          }
          // Пытаемся вернуть фокус
          if (usePlots && isYieldIndicator) {
            const firstPlotRef = plotInputRefs.plot_1.current;
            if (firstPlotRef && firstPlotRef.focus) {
              firstPlotRef.focus();
            }
          } else {
            const directRef = directInputRef.current;
            if (directRef && directRef.focus) {
              directRef.focus();
            }
          }
        }
      }, 10);
    }
  };

  // Периодическая проверка и восстановление фокуса
  useEffect(() => {
    if (isActive && !disabled) {
      const focusCheckInterval = setInterval(() => {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement === directInputRef.current ||
          Object.values(plotInputRefs).some(ref => activeElement === ref.current)
        );
        
        if (!isInputFocused) {
          if (import.meta.env.DEV) {
          }
          // Восстанавливаем фокус
          if (usePlots && isYieldIndicator) {
            const firstPlotRef = plotInputRefs.plot_1.current;
            if (firstPlotRef && firstPlotRef.focus) {
              firstPlotRef.focus();
              // Проверяем, есть ли метод select
              if (typeof firstPlotRef.select === 'function') {
                firstPlotRef.select();
              }
            }
          } else {
            const directRef = directInputRef.current;
            if (directRef && directRef.focus) {
              directRef.focus();
              // Проверяем, есть ли метод select
              if (typeof directRef.select === 'function') {
                directRef.select();
              }
            }
          }
        }
      }, 1000); // Проверяем каждую секунду

      return () => {
        clearInterval(focusCheckInterval);
      };
    }
  }, [isActive, disabled, usePlots, isYieldIndicator]);

  // Функция валидации значения
  const validateValue = (val: number): { isValid: boolean; error?: string } => {
    if (!validationRules) return { isValid: true };

    if (validationRules.min_value !== undefined && val < validationRules.min_value) {
      return { 
        isValid: false, 
        error: `Значение должно быть не менее ${validationRules.min_value}` 
      };
    }

    if (validationRules.max_value !== undefined && val > validationRules.max_value) {
      return { 
        isValid: false, 
        error: `Значение должно быть не более ${validationRules.max_value}` 
      };
    }

    return { isValid: true };
  };

  // Функция фильтрации ввода - не позволяет вводить некорректные значения
  const filterInputValue = (inputValue: string): string => {
    if (!validationRules || inputValue === '') return inputValue;

    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return inputValue;

    // Проверяем минимальное значение
    if (validationRules.min_value !== undefined && numValue < validationRules.min_value) {
      return validationRules.min_value.toString();
    }

    // Проверяем максимальное значение
    if (validationRules.max_value !== undefined && numValue > validationRules.max_value) {
      return validationRules.max_value.toString();
    }

    // Ограничиваем точность
    if (validationRules.precision !== undefined) {
      const multiplier = Math.pow(10, validationRules.precision);
      const rounded = Math.round(numValue * multiplier) / multiplier;
      return rounded.toString();
    }

    return inputValue;
  };

  // Обработчик клавиш для блокировки некорректного ввода и навигации
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Обработка навигации стрелками - ПРИОРИТЕТ
    if (onNavigate && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      if (import.meta.env.DEV) {
      }
      try {
        onNavigate(direction);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('PlotInputs: Error in onNavigate:', error);
        }
      }
      return;
    }

    if (!validationRules) return;

    // Разрешаем служебные клавиши (БЕЗ стрелок - они уже обработаны выше)
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;

    // Разрешаем Ctrl/Cmd комбинации
    if (e.ctrlKey || e.metaKey) return;

    const currentValue = (e.target as HTMLInputElement).value;
    const cursorPosition = (e.target as HTMLInputElement).selectionStart || 0;
    const newValue = currentValue.slice(0, cursorPosition) + e.key + currentValue.slice(cursorPosition);

    // Проверяем, будет ли новое значение корректным
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      // Проверяем минимальное значение
      if (validationRules.min_value !== undefined && numValue < validationRules.min_value) {
        e.preventDefault();
        return;
      }

      // Проверяем максимальное значение
      if (validationRules.max_value !== undefined && numValue > validationRules.max_value) {
        e.preventDefault();
        return;
      }
    }
  };

  // Получение параметров для TextField
  const getTextFieldProps = (val: number | string, isPlotField: boolean = false) => {
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    
    if (isNaN(numValue) || numValue === '') {
      return { error: false, helperText: '' };
    }

    const validation = validateValue(numValue);
    
    return {
      error: !validation.isValid,
      helperText: validation.error || getHelperText(isPlotField),
    };
  };

  // Получение текста подсказки
  const getHelperText = (isPlotField: boolean = false): string => {
    if (!validationRules) return '';
    
    // Для полей делянок не показываем подсказки о валидации
    if (isPlotField) return '';
    
    const parts = [];
    if (validationRules.min_value !== undefined) {
      parts.push(`мин: ${validationRules.min_value}`);
    }
    if (validationRules.max_value !== undefined) {
      parts.push(`макс: ${validationRules.max_value}`);
    }
    if (validationRules.precision !== undefined) {
      parts.push(`точность: ${validationRules.precision} знак${validationRules.precision === 1 ? '' : validationRules.precision < 5 ? 'а' : 'ов'}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : '';
  };

  // Инициализация состояния на основе существующих данных
  useEffect(() => {
    if (value) {
      const hasPlots = value.plot_1 !== undefined || value.plot_2 !== undefined || 
                      value.plot_3 !== undefined || value.plot_4 !== undefined;
      
      // Для урожайности используем делянки если они есть, иначе прямое значение
      // Для остальных показателей всегда используем прямое значение
      if (isYieldIndicator) {
        setUsePlots(hasPlots);
        
        if (hasPlots) {
          setPlotValues({
            plot_1: value.plot_1 || '',
            plot_2: value.plot_2 || '',
            plot_3: value.plot_3 || '',
            plot_4: value.plot_4 || '',
          });
        } else {
          setDirectValue(value.value || '');
        }
      } else {
        // Для не-урожайных показателей всегда используем прямое значение
        setUsePlots(false);
        setDirectValue(value.value || '');
      }
    }
  }, [value, isYieldIndicator]);

  // Автоматический расчет среднего значения из делянок
  const calculateAverage = (plots: typeof plotValues): number | null => {
    const values = Object.values(plots)
      .map(v => parseFloat(String(v)))
      .filter(v => !isNaN(v));
    
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  // Обработка изменения делянок
  const handlePlotChange = (plotKey: keyof typeof plotValues, newValue: string) => {
    const filteredValue = filterInputValue(newValue);
    const updatedPlots = {
      ...plotValues,
      [plotKey]: filteredValue,
    };
    setPlotValues(updatedPlots);

    const average = calculateAverage(updatedPlots);
    onChange({
      ...value,
      plot_1: updatedPlots.plot_1 ? parseFloat(updatedPlots.plot_1) : undefined,
      plot_2: updatedPlots.plot_2 ? parseFloat(updatedPlots.plot_2) : undefined,
      plot_3: updatedPlots.plot_3 ? parseFloat(updatedPlots.plot_3) : undefined,
      plot_4: updatedPlots.plot_4 ? parseFloat(updatedPlots.plot_4) : undefined,
      value: average,
      is_rejected: value?.is_rejected || false,
      is_restored: value?.is_restored || false,
    });
  };

  // Обработка изменения прямого значения
  const handleDirectValueChange = (newValue: string) => {
    const filteredValue = filterInputValue(newValue);
    setDirectValue(filteredValue);
    const numValue = filteredValue ? parseFloat(filteredValue) : undefined;
    onChange({
      ...value,
      value: numValue,
      // Для не-урожайных показателей всегда очищаем делянки
      plot_1: isYieldIndicator ? value?.plot_1 : undefined,
      plot_2: isYieldIndicator ? value?.plot_2 : undefined,
      plot_3: isYieldIndicator ? value?.plot_3 : undefined,
      plot_4: isYieldIndicator ? value?.plot_4 : undefined,
      is_rejected: value?.is_rejected || false,
      is_restored: value?.is_restored || false,
    });
  };

  // Переключение между режимами - только для урожайности
  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isYieldIndicator) return; // Защита от случайного вызова
    
    const newUsePlots = event.target.checked;
    setUsePlots(newUsePlots);

    if (newUsePlots) {
      // Переключаемся на делянки - очищаем прямое значение
      setDirectValue('');
      onChange({
        ...value,
        value: undefined,
        plot_1: undefined,
        plot_2: undefined,
        plot_3: undefined,
        plot_4: undefined,
        is_rejected: value?.is_rejected || false,
        is_restored: value?.is_restored || false,
      });
    } else {
      // Переключаемся на прямое значение - очищаем делянки
      setPlotValues({ plot_1: '', plot_2: '', plot_3: '', plot_4: '' });
      onChange({
        ...value,
        value: undefined,
        plot_1: undefined,
        plot_2: undefined,
        plot_3: undefined,
        plot_4: undefined,
        is_rejected: value?.is_rejected || false,
        is_restored: value?.is_restored || false,
      });
    }
  };

  const average = calculateAverage(plotValues);

  return (
    <Box>
      {/* Переключатель режима - только для урожайности */}
      {isYieldIndicator && (
        <FormControlLabel
          control={
            <Switch
              checked={usePlots}
              onChange={handleModeChange}
              disabled={disabled}
              size="small"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="caption">
                {usePlots ? 'Делянки' : 'Прямое значение'}
              </Typography>
              <Tooltip title="Для урожайности доступен ввод по делянкам с автоматическим расчетом среднего">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
          }
          sx={{ mb: 1 }}
        />
      )}

      {usePlots && isYieldIndicator ? (
        <Box>
          {/* Ввод делянок - только для урожайности */}
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={1}>
            {Object.entries(plotValues).map(([key, val]) => {
              const numVal = typeof val === 'string' ? parseFloat(val) : val;
              const textFieldProps = getTextFieldProps(numVal, true); // isPlotField = true
              
              return (
                <TextField
                  key={key}
                  ref={plotInputRefs[key as keyof typeof plotInputRefs]}
                  size="small"
                  type="number"
                  label={`Делянка ${key.split('_')[1]}`}
                  value={val}
                  onChange={(e) => handlePlotChange(key as keyof typeof plotValues, e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  disabled={disabled}
                  error={textFieldProps.error}
                  helperText={textFieldProps.helperText}
                  inputProps={{
                    step: validationRules?.precision === 0 ? 1 : validationRules?.precision === 1 ? 0.1 : 0.1,
                    min: validationRules?.min_value || 0,
                    max: validationRules?.max_value,
                    name: `plot_${key.split('_')[1]}`,
                  }}
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '8px',
                    textAlign: 'center',
                  },
                }}
                />
              );
            })}
          </Box>

          {/* Показ среднего значения */}
          {average !== null && (
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CalculateIcon fontSize="small" color="primary" />
              <Typography variant="caption" color="primary">
                Среднее: {average.toFixed(2)} {indicatorUnit}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* Прямой ввод значения - для всех показателей кроме урожайности в режиме делянок */
        <TextField
          ref={directInputRef}
          size="small"
          type="number"
          value={directValue}
          onChange={(e) => handleDirectValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          error={getTextFieldProps(parseFloat(directValue) || 0).error}
          helperText={getTextFieldProps(parseFloat(directValue) || 0).helperText}
          inputProps={{
            step: validationRules?.precision === 0 ? 1 : validationRules?.precision === 1 ? 0.1 : 0.1,
            min: validationRules?.min_value || 0,
            max: validationRules?.max_value,
            name: 'direct',
          }}
          sx={{
            '& .MuiInputBase-input': {
              padding: '8px',
              textAlign: 'center',
            },
          }}
          fullWidth
        />
      )}

      {/* Контроль качества */}
      {(value?.is_rejected || value?.is_restored) && (
        <Box display="flex" gap={0.5} mt={1}>
          {value.is_rejected && (
            <Chip
              label="Отклонен"
              color="error"
              size="small"
              variant="outlined"
            />
          )}
          {value.is_restored && (
            <Chip
              label="Восстановлен"
              color="success"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Box>
  );
};
