/**
 * Utility functions for formatting indicators
 */

/**
 * Maps resistance indicator codes to human-readable Russian names
 */
export const getResistanceIndicatorName = (code: string): string => {
  const indicatorNames: Record<string, string> = {
    'shattering_resistance': 'Устойчивость к осыпанию',
    'lodging_resistance': 'Устойчивость к полеганию',
    'drought_resistance': 'Засухоустойчивость',
    'frost_resistance': 'Морозоустойчивость',
    'disease_resistance': 'Устойчивость к болезням',
    'pest_resistance': 'Устойчивость к вредителям',
    'heat_resistance': 'Жаростойкость',
    'salinity_resistance': 'Солеустойчивость',
    'waterlogging_resistance': 'Устойчивость к переувлажнению',
  };

  return indicatorNames[code] || code.replace(/_/g, ' ');
};

/**
 * Maps quality indicator codes to human-readable Russian names
 */
export const getQualityIndicatorName = (code: string): string => {
  const indicatorNames: Record<string, string> = {
    'protein_content': 'Содержание белка',
    'gluten_content': 'Содержание клейковины',
    'oil_content': 'Масличность',
    'starch_content': 'Содержание крахмала',
    'sugar_content': 'Сахаристость',
    'fiber_content': 'Содержание клетчатки',
    'grain_quality': 'Качество зерна',
    'test_weight': 'Натура зерна',
    'thousand_kernel_weight': 'Масса 1000 зерен',
  };

  return indicatorNames[code] || code.replace(/_/g, ' ');
};

/**
 * Formats coverage percentage as a fraction
 * Example: "28.57142857142857% (2/7)"
 */
export const formatCoverageAsFraction = (
  tested: number,
  total: number,
  percent: number
): string => {
  const cleanPercent = percent.toFixed(1);
  return `${cleanPercent}% (${tested}/${total})`;
};
