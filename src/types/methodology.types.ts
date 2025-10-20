// Типы для API /api/annual-reports/methodology_table/

export interface MethodologyTableResponse {
  oblast: {
    id: number;
    name: string;
  };
  year: number;
  years_range: number[];
  generated_at: string;
  regions: Array<{
    id: number;
    name: string;
  }>;
  methodology_table: Record<string, Record<string, MaturityGroupData>>;
  standards_by_group: Record<string, StandardInfo[]>;
  quality_indicators: Record<string, QualityIndicator>;
  warnings: Warning[];
  has_warnings: boolean;
}

export interface MaturityGroupData {
  group_code: string;
  group_name: string;
  sorts: SortData[];
}

export interface SortData {
  sort_name: string;
  application_number: string;
  is_standard: boolean;
  is_comparison_standard: boolean;
  yields_by_year: Record<string, number>;
  average_yield: number;
  deviation_percent: string | number;
  years_tested: number;
  year_started: number;
  main_indicators: Record<string, IndicatorValue>;
  quality_indicators: Record<string, IndicatorValue>;
  decision_status: 'decision_pending' | 'approved' | 'rejected' | 'continue';
  latest_decision: any;
}

export interface IndicatorValue {
  value: number;
  unit: string;
  name: string;
  description?: string;
}

export interface StandardInfo {
  sort_name: string;
  average_yield: number;
  is_comparison_standard: boolean;
  region: string;
}

export interface QualityIndicator {
  name: string;
  unit: string;
  description: string;
}

export interface Warning {
  type: string;
  severity: 'error' | 'warning' | 'info';
  group_code: string;
  group_name: string;
  message: string;
  standards?: string[];
  selected_standard?: string;
}

export interface MethodologyTableFilters {
  year: number;
  oblast_id: number;
  culture_id: number;
}