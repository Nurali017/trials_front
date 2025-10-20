// Типы для API /api/annual-reports/summary/

export interface SummaryResponse {
  oblast: {
    id: number;
    name: string;
  };
  year: number;
  summary_items: SummaryItem[];
}

export interface SummaryItem {
  application_id: number;
  application_number: string;
  sort_record: SortRecord;
  maturity_group_code: string;
  maturity_group_name?: string;
  standard_for_group: string | null;
  statistical_analysis: StatisticalAnalysis;
  evaluation_scores: EvaluationScores;
  summary: SummaryStat;
  regions_data: RegionData[];
  zones_recommended: string[];
  zones_not_recommended: string[];
  decision_status: 'decision_pending' | 'approved' | 'rejected' | 'continue';
  latest_decision: any | null;
  recommendation: Recommendation;
}

export interface SortRecord {
  id: number;
  name: string;
  culture_name: string | null;
  culture_id?: number;
  originator_name?: string;
}

export interface StatisticalAnalysis {
  nsr_095: number;
  statistical_significance: boolean;
  confidence_level: number;
  degrees_of_freedom: number;
  error_variance: number;
  repetitions_count: number;
  sufficient_data: boolean;
  significant_regions: number;
  significant_percent: number;
  regions_analysis: RegionAnalysis[];
}

export interface RegionAnalysis {
  region_id: number;
  region_name: string;
  is_significant: boolean;
  f_statistic: number | null;
  p_value: number | null;
  years_count: number;
  deviation_from_standard: number;
  deviation_percent: number;
}

export interface EvaluationScores {
  yield_score: number | null;
  quality_score: number | null;
  resistance_score: number | null;
  overall_score: number;
  score_interpretation: string;
  detailed_scores: {
    yield: DetailedScore;
    quality: DetailedScore;
    resistance: DetailedScore;
  };
}

export interface DetailedScore {
  score: number | null;
  max_score: number;
  criteria: Record<string, ScoreCriteria>;
  interpretation: string;
}

export interface ScoreCriteria {
  value: number | string | boolean | null;
  score: number;
  max_score: number;
  description: string;
}

export interface SummaryStat {
  gsu_tested: number;
  gsu_total: number;
  coverage_percent: number;
  oblast_avg_yield: number;
  min_years_tested: number;
  total_regions_with_data: number;
  statistically_significant_regions: number;
  significant_regions_percent: number;
  quality_indicators: Record<string, IndicatorStat>;
  resistance_indicators: Record<string, IndicatorStat>;
}

export interface IndicatorStat {
  average: number;
  min: number;
  max: number;
  unit: string;
}

export interface RegionData {
  region_id: number;
  region_name: string;
  years_tested: number;
  year_started: number;
  yields_by_year: Record<string, number>;
  average_yield: number;
  current_year_yield: number | null;
  has_data: boolean;
  deviation_from_standard: number;
  deviation_percent: number;
  standard_name: string;
  standard_current_year_yield: number | null;
  resistance_indicators: Record<string, number>;
  quality_indicators?: Record<string, number>;
}

export interface Recommendation {
  decision: 'approved' | 'rejected' | 'continue';
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  can_approve: boolean;
  justification: {
    statistical_criteria: CriteriaResult;
    quality_criteria: CriteriaResult;
    resistance_criteria: CriteriaResult;
    coverage_criteria: CriteriaResult;
  };
  improvement_recommendations: string[];
}

export interface CriteriaResult {
  met: boolean;
  description: string;
}

export interface SummaryFilters {
  year: number;
  oblast_id: number;
}
