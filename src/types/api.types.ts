// API Types for Trials Service

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'distributed'
  | 'in_progress'
  | 'completed'
  | 'registered'
  | 'rejected';

export type TrialStatus =
  | 'planned'
  | 'active'
  | 'completed_008'
  | 'completed'
  | 'lab_sample_sent'
  | 'lab_completed'
  | 'approved'
  | 'continue'
  | 'rejected';

export type DecisionType = 'approved' | 'continue' | 'rejected';

export interface SortRecord {
  id: number;
  sort_id?: number; // Patents sort ID (optional для совместимости)
  name: string;
  code?: string; // Patents поле (public_code в Trials)
  public_code?: string;
  culture?: number | { id: number; name: string; code?: string; group?: any }; // Может быть ID или объект (Patents)
  culture_name?: string;
  lifestyle?: number;
  characteristic?: number;
  development_cycle?: number;
  applicant?: string;
  patent_nis?: boolean; // Patents поле
  ariginators?: any[]; // Patents поле
  images?: any[]; // Patents поле
  note?: string;
  synced_at?: string;
  created_at: string;
}

export type IndicatorCategory = 'common' | 'quality' | 'specific';

export interface Indicator {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: IndicatorCategory;
  is_quality: boolean;
  is_universal: boolean;
  is_auto_calculated?: boolean;
  sort_order: number;
  cultures?: number[];
  cultures_data?: Culture[];
  validation_rules?: {
    min_value?: number;
    max_value?: number;
    precision?: number;
    required?: boolean;
    type?: string;
    [key: string]: any;
  };
}

export interface Oblast {
  id: number;
  name: string;
  code: string;
}

export interface ClimateZone {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface Region {
  id: number;
  name: string;
  oblast: number;
  oblast_name: string;
  climate_zone?: number;
  climate_zone_name?: string;
}

export interface DecisionsSummary {
  total: number;
  with_decision: number;
  approved: number;
  continue: number;
  rejected: number;
}

export type PlannedDistributionStatus = 'planned' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';

export interface PlannedDistribution {
  id?: number;
  region: number;
  region_name?: string;
  trial_type: string;
  planting_season?: PlantingSeason;
  indicators?: number[];
  
  // ⭐ Новые поля для многолетних испытаний
  status?: PlannedDistributionStatus;
  year_started?: number;      // Год начала испытаний
  year_completed?: number;    // Год завершения (если завершено)
}

export type OblastStatusType = 'planned' | 'trial_plan_created' | 'trial_created' | 'trial_completed' | 'decision_pending' | 'approved' | 'continue' | 'rejected';

export interface OblastStatus {
  oblast_id: number;
  status: OblastStatusType;
  trial_plan_id: number | null;
  trial_id: number | null;
  decision_date: string | null;
  decision_justification: string | null;
  decided_by_id: number | null;
  decision_year: number | null;
}

export interface OblastStatusSummary {
  total_oblasts: number;
  planned: number;
  trial_plan_created: number;
  trial_created: number;
  trial_completed: number;
  decision_pending: number;
  approved: number;
  continue: number;
  rejected: number;
}

export interface Application {
  id: number;
  application_number: string;
  submission_date: string;
  sort_record: number;
  sort_record_data: SortRecord;
  applicant: string;
  applicant_inn_bin: string;
  contact_person_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  maturity_group: string;
  purpose?: string;
  target_oblasts: number[];
  target_oblasts_data: Oblast[];
  indicators_data?: Indicator[];
  status: ApplicationStatus;
  regional_trials_count: number;
  decisions_summary?: DecisionsSummary;
  missing_mandatory_documents: string[];
  is_ready_for_submission: boolean;
  planned_distributions?: PlannedDistribution[];
  oblast_statuses?: OblastStatus[];
  oblast_status_summary?: OblastStatusSummary;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export type TrialCategory = 'mandatory' | 'additional' | 'special' | 'reproduction' | 'demonstration';
export type PlantingSeason = 'spring' | 'autumn';

export interface TrialType {
  id: number;
  code: string;
  name: string;
  name_full: string;
  category: TrialCategory;
  category_display: string;
  description?: string;
  requires_area: boolean;
  requires_standard: boolean;
  default_area_ha?: string;
  sort_order: number;
}

export type StatisticalGroup = 0 | 1; // 0 = стандарт, 1 = испытываемый
export type StatisticalResult = number | null; // Автоматически рассчитанный код группы (+3, -2, 0, +1...)

export type AgroBackground = 'favorable' | 'moderate' | 'unfavorable';
export type GrowingConditions = 'rainfed' | 'irrigated' | 'drained' | 'mixed';
export type CultivationTechnology = 'traditional' | 'minimal' | 'no_till' | 'organic';
export type GrowingMethod = 'soil_traditional' | 'hydroponics' | 'greenhouse' | 'container' | 'raised_beds';
export type HarvestTiming = 'very_early' | 'early' | 'medium_early' | 'medium' | 'medium_late' | 'late' | 'very_late';

export interface TrialParticipant {
  id: number;
  trial: number;
  sort_record: number;
  sort_record_data: SortRecord;
  statistical_group: StatisticalGroup;
  statistical_result: StatisticalResult;
  statistical_result_display?: string; // Человекочитаемое описание (например: "Превышение на 3 НСР (код +3)")
  maturity_group_code?: string; // Организационный код группы спелости (1, 2, 3...)
  participant_number: number;
  application?: number;
  application_number?: string;
  created_at: string;
  updated_at: string;
}

export interface TrialStatistics {
  sx: number; // Стандартное отклонение
  accuracy_percent: number; // Точность опыта (P%)
  lsd: number; // НСР
  error_mean: number; // Ошибка средней
}

export interface CompletionStatus {
  is_complete: boolean;
  filled_percent: number;
  missing_data: string[];
}

export interface Trial {
  id: number;
  application?: number;
  application_number?: string;
  title: string;
  description?: string;
  year?: number; // ⭐ Год испытания (автоматически из start_date или явно)
  culture: number;
  culture_name?: string;
  region: number;
  region_name: string;
  oblast_name: string;
  climate_zone_name?: string;
  status: TrialStatus;
  decision?: DecisionType;
  decision_justification?: string;
  decision_recommendations?: string;
  decision_date?: string;
  decided_by_name?: string;
  start_date: string;
  end_date?: string;
  responsible_person?: string; // ФИО ответственного
  planting_season?: PlantingSeason;
  
  // Агрономические параметры
  predecessor_culture?: number;
  predecessor_culture_name?: string;
  agro_background?: AgroBackground;
  growing_conditions?: GrowingConditions;
  cultivation_technology?: CultivationTechnology;
  growing_method?: GrowingMethod;
  harvest_timing?: HarvestTiming;
  harvest_date?: string;
  additional_info?: string;
  
  // Лабораторный workflow
  laboratory_code?: string;
  laboratory_status?: 'not_sent' | 'sent' | 'completed';
  sample_sent_date?: string;
  sample_weight_kg?: number;
  laboratory_analysis_date?: string;
  laboratory_completed_date?: string;
  
  // Показатели
  indicators: number[];
  indicators_data: Indicator[];
  
  // Участники (новая логика)
  participants_data?: TrialParticipant[];
  
  // Старое поле (для обратной совместимости, deprecated)
  sort_record_data?: SortRecord | null;
  
  // Статистика
  trial_statistics?: TrialStatistics;
  completion_status?: CompletionStatus;
  results_count: number;
  
  trial_type?: number;
  trial_type_data?: TrialType;
  area_ha?: string;
  created_at: string;
  updated_at: string;
}

export interface TrialResult {
  id: number;
  trial: number;
  trial_title?: string;
  participant: number;
  participant_data?: TrialParticipant;
  indicator: number;
  indicator_name?: string;
  indicator_data?: Indicator;
  
  // Результаты
  plot_1?: number;
  plot_2?: number;
  plot_3?: number;
  plot_4?: number;
  value?: number; // Среднее или единичное значение
  text_value?: string;
  
  // Контроль качества
  is_rejected?: boolean; // Отклонен ли результат
  is_restored?: boolean; // Восстановлен ли результат
  
  measurement_date: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface CultureGroup {
  id: number;
  group_culture_id: number;
  name: string;
  description?: string;
  code?: string;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Culture {
  id: number;
  name: string;
  culture_group?: number;
  culture_group_name?: string;
}

export interface Originator {
  id: number;
  originator_id: number;
  name: string;
  code: number | null;
  is_foreign: boolean;
  is_nanoc: boolean;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

// Request types
export interface CreateApplicationRequest {
  application_number: string;
  submission_date: string;
  sort_id: number;  // ID из Patents Service
  applicant: string;
  applicant_inn_bin: string;
  contact_person_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  maturity_group: string;
  purpose?: string;
  target_oblasts: number[];
  status?: ApplicationStatus;
  // created_by устанавливается автоматически на бэкенде из request.user
}

// Document types
export type DocumentType = 
  | 'application_for_testing'
  | 'breeding_questionnaire'
  | 'variety_description'
  | 'plant_photo_with_ruler'
  | 'right_to_submit'
  | 'gmo_free'
  | 'report'
  | 'protocol'
  | 'certificate'
  | 'decision'
  | 'other';

export interface Document {
  id: number;
  title: string;
  document_type: DocumentType;
  file: string;
  application?: number;
  trial?: number;
  is_mandatory: boolean;
  uploaded_by: number;
  uploaded_by_name?: string;
  uploaded_at: string;
}

export interface CreateDocumentRequest {
  title: string;
  document_type: DocumentType;
  application?: number;
  trial?: number;
  file: File;
  is_mandatory: boolean;
  // uploaded_by устанавливается автоматически на бэкенде
}

export interface UpdateApplicationRequest extends Partial<CreateApplicationRequest> {}

// ✅ Новая логика распределения
export interface DistributionItem {
  region: number;
  trial_type: string; // Код типа испытания (competitive, production, etc)
  planting_season?: PlantingSeason;
  indicators?: number[]; // Будут выбраны при создании Trial
}

export interface DistributeApplicationRequest {
  distributions: DistributionItem[];
}

// Для получения заявок по ГСУ
export interface PendingApplicationsForRegion {
  total: number;
  region_id: number;
  region_name: string;
  culture_id?: number;
  applications: Array<{
    id: number;
    application_number: string;
    sort_record: {
      id: number;
      sort_id?: number; // Patents sort ID
      name: string;
      culture: {
        id: number;
        name: string;
      };
    };
    already_in_trial: boolean;
    planned_distribution?: PlannedDistribution;
  }>;
}

// Для получения культур с заявками для ГСУ
export interface CultureForRegion {
  culture_id: number;
  culture_name: string;
  applications_count: number;
  pending_count: number;
  in_trial_count: number;
  sample_applications: string[];
}

export interface CulturesForRegionResponse {
  region_id: number;
  region_name: string;
  oblast_id: number;
  oblast_name: string;
  cultures: CultureForRegion[];
}

export interface MakeDecisionRequest {
  decision: DecisionType;
  justification: string;
  recommendations?: string;
  decision_date: string;
}

export interface CreateTrialResultRequest {
  trial: number;
  participant: number;
  indicator: number;
  plot_1?: number;
  plot_2?: number;
  plot_3?: number;
  plot_4?: number;
  value?: number;
  text_value?: string;
  measurement_date: string;
  notes?: string;
}

export interface BatchCreateTrialResultsRequest {
  results: CreateTrialResultRequest[];
}

export interface BulkEntryDataItem {
  indicator: number;
  plots?: [number, number, number, number];
  value?: number;
  text_value?: string;
}

export interface BulkEntryRequest {
  participant: number;
  measurement_date: string;
  data: BulkEntryDataItem[];
}

export interface CreateTrialParticipantRequest {
  trial: number;
  sort_record: number;
  statistical_group: StatisticalGroup;
  participant_number: number;
  application?: number;
}

export interface BulkCreateParticipantsRequest {
  trial: number;
  participants: Array<{
    sort_record: number;
    statistical_group: StatisticalGroup;
    participant_number: number;
    application?: number;
  }>;
}

export interface CreateTrialRequest {
  culture: number;
  region: number;
  trial_type?: number;
  description?: string;
  year?: number; // ⭐ Год испытания (для многолетних испытаний)

  // Агрономические параметры
  predecessor_culture?: number;
  agro_background?: AgroBackground;
  growing_conditions?: GrowingConditions;
  cultivation_technology?: CultivationTechnology;
  growing_method?: GrowingMethod;
  harvest_timing?: HarvestTiming;
  harvest_date?: string;

  start_date: string;
  end_date?: string;
  responsible_person?: string; // ФИО ответственного
  planting_season?: PlantingSeason;
  area_ha?: number;

  // Участники
  participants: Array<{
    sort_record?: number; // Trials ID (для рекомендуемых из заявок)
    patents_sort_id?: number; // Patents ID (для Autocomplete)
    statistical_group: StatisticalGroup;
    participant_number: number;
    application?: number;
  }>;

  // Показатели (опционально - бэкенд автоматически загрузит все показатели для культуры)
  indicators?: number[];
}

// Statistics types
export interface ApplicationStatistics {
  total: number;
  by_status: Record<ApplicationStatus, number>;
  by_year: Record<string, number>;
  success_rate: number;
}

export interface TrialStatistics {
  total: number;
  active: number;
  by_oblast: Record<string, number>;
  success_rate: number;
}

// Available sorts from Patents Service (API V2)
export interface AvailableSort {
  id: number;
  name: string;
  code: string; // Обновлено: public_code → code (max 128 chars)
  culture: number;
  culture_name: string;
  originators: string[];
}


// Originator with percentage
export interface OriginatorWithPercentage {
  ariginator_id: number;
  percentage: number;
}

// Create sort request
export interface CreateSortRequest {
  name: string;
  code?: string;
  culture: number;
  applicant?: string;
  ariginators?: OriginatorWithPercentage[];
  lifestyle?: number;
  characteristic?: number;
  development_cycle?: number;
  patent_nis?: boolean;
  note?: string;
  image_data?: any;
}

// Laboratory workflow types
export interface MarkSentToLabRequest {
  sample_weight_kg: number;
  sample_source: string; // Источник образца (правильное имя поля для бэкенда)
  // sent_date убран - бэкенд устанавливает автоматически
}

export interface LaboratoryResultItem {
  indicator: number;
  value: number;
}

export interface LaboratoryBulkEntryRequest {
  laboratory_code: string;
  analysis_date: string;
  participant_id?: number; // Опционально - для конкретного участника
  results: LaboratoryResultItem[];
}

export interface LaboratoryCompleteRequest {
  completed_date: string;
}

// ⭐ Региональный статус для многолетних испытаний
export interface RegionalTrialInfo {
  trial_id: number;
  year?: number;
  start_date: string;
  end_date?: string;
  status: TrialStatus;
  decision?: DecisionType;
  decision_date?: string;
  participants_count: number;
  laboratory_status?: 'not_sent' | 'sent' | 'completed';
}

export interface RegionalStatusItem {
  // PlannedDistribution info
  region_id: number;
  region_name: string;
  oblast_name: string;
  trial_type?: string;
  planting_season?: PlantingSeason;
  
  // PlannedDistribution status для многолетних
  status: PlannedDistributionStatus;
  year_started?: number;
  year_completed?: number;
  years_count?: number; // Количество лет испытаний
  
  // Последний Trial (для быстрого доступа)
  latest_trial_id?: number;
  latest_decision?: DecisionType;
  
  // ⭐ Массив всех Trial по годам (ключевое изменение!)
  trials: RegionalTrialInfo[];
}

export interface RegionalStatusResponse {
  application_id: number;
  application_status: ApplicationStatus;
  total_regions: number;
  regions: RegionalStatusItem[];
}

// Trial Plans Types - НОВАЯ СТРУКТУРА с типами испытаний
export interface TrialPlanTrial {
  id: number;
  region_id: number;
  region_name: string;
  predecessor: string | number;
  predecessor_culture_name?: string;
  seeding_rate: number;
  season: 'spring' | 'autumn' | 'summer' | 'winter';
}

export interface TrialPlanParticipant {
  id: number;
  patents_sort_id: number;
  sort_name?: string;
  statistical_group: 0 | 1; // 0 = стандарт, 1 = испытываемый
  seeds_provision: 'provided' | 'not_provided';
  participant_number: number;
  maturity_group: string;
  application?: number | null;
  application_id?: number;
  year_started?: number;
  application_submit_year?: number;
  trials: TrialPlanTrial[];
}

export interface TrialPlanTrialType {
  id: number;
  trial_type_id: number;
  trial_type_name: string;
  season: 'spring' | 'autumn' | 'summer' | 'winter';
  participants: TrialPlanParticipant[];
}

export interface TrialPlanCulture {
  id: number;
  culture: number;
  culture_name: string;
  culture_group: string;
  trial_types: TrialPlanTrialType[];
}

export type TrialPlanStatus = 'planned' | 'structured' | 'distributed' | 'finalized';

export interface TrialPlan {
  id: number;
  year: number;
  oblast: number | { id: number; name: string };
  oblast_name?: string; // Для обратной совместимости
  status: TrialPlanStatus;
  cultures: TrialPlanCulture[];
  created_at: string;
  updated_at: string;
}

export interface CreateTrialPlanRequest {
  year: number;
  oblast: number;
  status?: TrialPlanStatus;
}

export interface UpdateTrialPlanRequest extends Partial<CreateTrialPlanRequest> {}

export interface AddParticipantsRequest {
  culture_id: number;
  trial_type_id: number;
  participants: Array<{
    patents_sort_id: number;
    participant_number: number;
    maturity_group: string;
    statistical_group: 0 | 1;
    seeds_provision: 'provided' | 'not_provided';
    application_id?: number;
  }>;
}

// Новые типы запросов для новой структуры
export interface AddTrialTypeToCultureRequest {
  trial_type_id: number;
  season: 'spring' | 'autumn' | 'summer' | 'winter';
}

export interface AddTrialToParticipantRequest {
  region_id: number;
  predecessor: string | number;
  seeding_rate: number;
  season: 'spring' | 'autumn' | 'summer' | 'winter';
}

export interface DistributePlanRequest {
  regions?: number[];
  trial_types?: string[];
}

export interface TrialPlanStatistics {
  total_cultures: number;
  total_trial_types: number;
  total_participants: number;
  total_trials: number;
  total_regions: number;
}

export interface TrialPlansByYear {
  year: number;
  plans: TrialPlan[];
  statistics: TrialPlanStatistics;
}

// ============ ANNUAL DECISIONS TYPES ============

export interface AnnualDecisionTable {
  id: number;
  year: number;
  oblast: number;
  oblast_name: string;
  culture: number | null;
  culture_name: string | null;
  status: 'draft' | 'finalized';
  status_display: string;
  title: string;
  created_by: number;
  created_by_name: string;
  finalized_by: number | null;
  finalized_by_name: string | null;
  finalized_date: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
  decisions_count: number;
  progress_percentage: number;
  statistics: AnnualTableStatistics;
}

export interface AnnualDecisionTableDetail extends AnnualDecisionTable {
  items: AnnualDecisionItem[];
}

export interface AnnualDecisionItem {
  id: number;
  row_number: number;
  sort_record: number;
  sort_name: string;
  sort_public_code: string;
  sort_id: number;
  maturity_group: string;
  yields_by_year: YieldsByYear;
  average_yield: number;
  deviation_from_standard: number;
  last_year_data: LastYearData;
  years_tested: number;
  year_started: number;
  decision: 'pending' | 'approved' | 'continue' | 'removed';
  decision_display: string;
  decision_justification: string;
  decision_recommendations: string;
  recommended_zones: RecommendedZone[];
  continue_reason: string | null;
  continue_until_year: number | null;
  removal_reason: string | null;
  decision_date: string | null;
  decided_by: number | null;
  decided_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnualDecisionItemDetail extends AnnualDecisionItem {
  sort_record_detail: AnnualSortRecordDetail;
  trials_data: AnnualTrialData[];
}

export interface YieldsByYear {
  [year: string]: number; // {"2022": 125, "2023": 210, "2024": 97}
}

export interface LastYearData {
  tuber_weight?: number;
  taste_score?: number;
  marketable_percentage?: number;
  damage_resistance?: number;
  hollow_heart?: number;
  diseases?: {
    dry_rot?: number;
    scab?: number;
    brown_spot?: number;
  };
  pests?: {
    wireworm?: number;
    wet_rot?: number;
  };
  biochemistry?: {
    starch_content?: { [year: string]: number };
    dry_matter?: { [year: string]: number };
    vitamin_c?: { [year: string]: number };
  };
}

export interface RecommendedZone {
  climate_zone_id: number;
  climate_zone_name: string;
  region_ids: number[];
}

export interface AnnualTableStatistics {
  total: number;
  approved: number;
  removed: number;
  continue: number;
  pending: number;
}

export interface AnnualTrialData {
  id: number;
  year: number;
  region_name: string;
  status: string;
  status_display: string;
}

export interface AnnualSortRecordDetail {
  id: number;
  name: string;
  culture: {
    id: number;
    name: string;
  };
  originators: Array<{
    name: string;
    percentage: number;
  }>;
}

// Request types
export interface CreateAnnualTableRequest {
  year: number;
  oblast: number;
  culture?: number;
  auto_populate?: boolean;
  include_year_3?: boolean;
  include_year_2?: boolean;
  include_year_1?: boolean;
}

export interface AnnualDecisionFormData {
  decision: 'approved' | 'continue' | 'removed';
  decision_justification: string;
  decision_recommendations?: string;
  recommended_zones?: RecommendedZone[];
  continue_reason?: string;
  continue_until_year?: number;
  removal_reason?: string;
}

export interface AnnualTableFilters {
  oblast_id?: number;
  year?: number;
  status?: 'draft' | 'finalized';
  culture_id?: number;
}

// Response types
export interface AnnualTablesListResponse {
  count: number;
  results: AnnualDecisionTable[];
}

export interface MakeDecisionResponse {
  success: boolean;
  message: string;
  item: AnnualDecisionItem;
  table_progress: number;
}

export interface FinalizeTableResponse {
  success: boolean;
  message: string;
  table: AnnualDecisionTable;
}

export interface FinalizeTableErrorResponse {
  success: false;
  error: string;
  details: {
    total: number;
    decided: number;
    pending: number;
  };
}

export interface StatisticsResponse {
  table_id: number;
  year: number;
  oblast: string;
  statistics: AnnualTableStatistics;
  progress_percentage: number;
  is_complete: boolean;
}

// ============ FORM 008 TYPES ============

export interface Form008Warning {
  level: 'error' | 'warning' | 'info';
  message: string;
}

export interface Form008Statistics {
  lsd_095: number;
  error_mean: number;
  accuracy_percent: number;
  has_data: boolean;
}

export interface Form008Participant {
  id: number;
  participant_number: number;
  sort_name: string;
  statistical_group: StatisticalGroup;
  is_standard: boolean;
  maturity_group_code?: string;
  statistical_result?: number;
  statistical_result_display?: string;
  current_results: Record<string, Form008Result>;
}

export interface Form008Result {
  value?: number;
  plot_1?: number;
  plot_2?: number;
  plot_3?: number;
  plot_4?: number;
  is_rejected?: boolean;
  is_restored?: boolean;
}

export interface Form008Trial {
  id: number;
  culture_name: string;
  region_name: string;
  harvest_date: string | null;
  status: string;
  // Организационная информация
  maturity_group_code?: string;
  maturity_group_name?: string;
  trial_code?: string;
  culture_code?: string;
  culture_id?: number;
  predecessor_code?: string;
  lsd_095?: number;
  error_mean?: number;
  accuracy_percent?: number;
  // Условия испытания
  agro_background?: AgroBackground;
  growing_conditions?: GrowingConditions;
  cultivation_technology?: CultivationTechnology;
  growing_method?: GrowingMethod;
  harvest_timing?: HarvestTiming;
  additional_info?: string;
}

export interface Form008Data {
  trial: Form008Trial;
  statistics?: Form008Statistics;
  participants: Form008Participant[];
  indicators: Indicator[];
  warnings?: Form008Warning[];
  auto_statistics?: AutoStatistics;
  standard?: StandardParticipant;
  comparison?: ComparisonResult[];
  min_max?: MinMaxValues;
}

export interface Form008SaveRequest {
  is_final: boolean;
  harvest_date?: string;
  statistics?: {
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
    use_auto_calculation?: boolean;
  };
  participants: Array<{
    participant_id: number;
    results: Record<string, Form008Result>;
  }>;
}

export interface Form008SaveResponse {
  success: boolean;
  is_final: boolean;
  statistics?: TrialStatistics;
  participants_codes?: Array<{
    participant_id: number;
    statistical_result: number;
    statistical_result_display: string;
  }>;
}

export interface Form008UpdateConditionsRequest {
  agro_background?: AgroBackground;
  growing_conditions?: GrowingConditions;
  cultivation_technology?: CultivationTechnology;
  growing_method?: GrowingMethod;
  harvest_timing?: HarvestTiming;
  harvest_date?: string;
  additional_info?: string;
}

// ============ INDICATORS MANAGEMENT TYPES ============

export interface AddIndicatorsRequest {
  by_culture?: boolean;
  include_recommended?: boolean;
  indicator_ids?: number[];
}

export interface RemoveIndicatorsRequest {
  indicator_ids: number[];
}

export interface IndicatorsByCultureResponse {
  culture_id: number;
  culture_name: string;
  required_indicators: Indicator[];
  recommended_indicators: Indicator[];
  quality_indicators: Indicator[];
}

// ============ STATISTICS AND CALCULATIONS TYPES ============

export interface TrialStatistics {
  lsd_095?: number;
  error_mean?: number;
  accuracy_percent?: number;
  replication_count?: number;
  has_data?: boolean;
  note?: string;
}

export interface StandardParticipant {
  participant_id: number;
  sort_name: string;
  yield?: number;
}

export interface ComparisonResult {
  participant_id: number;
  sort_name: string;
  yield?: number;
  statistical_result?: number;
  statistical_result_display?: string;
  difference_from_standard?: number;
  percent_difference?: number;
}

export interface MinMaxValues {
  [indicatorCode: string]: {
    min: number;
    max: number;
  };
}

export interface AutoStatistics {
  auto_lsd_095?: number;
  auto_error_mean?: number;
  auto_accuracy_percent?: number;
  replication_count?: number;
  participants_count?: number;
  grand_mean?: number;
  note?: string;
  manual_required?: boolean;
  warning?: string;
}

export interface Form008StatisticsResponse {
  trial_id: number;
  has_data: boolean;
  has_manual_data?: boolean;
  has_auto_data?: boolean;
  statistics?: TrialStatistics;
  manual_statistics?: TrialStatistics;
  auto_statistics?: AutoStatistics;
  standard?: StandardParticipant;
  comparison?: ComparisonResult[];
  min_max?: MinMaxValues;
}

export interface StatisticsPreviewRequest {
  statistics: {
    lsd_095?: number;
    error_mean?: number;
    accuracy_percent?: number;
  };
  participants: Array<{
    participant_id: number;
    results: Record<string, number>;
  }>;
}
