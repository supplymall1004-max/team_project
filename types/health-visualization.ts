/**
 * 건강 시각화 관련 타입 정의
 */

// 건강 메트릭스 인터페이스
export interface HealthMetrics {
  // 기본 건강 지표
  bmi: number;
  bodyFatPercentage: number;
  muscleMass: number;
  basalMetabolicRate: number;

  // 영양 상태
  nutritionBalance: NutritionBalance;
  vitaminLevels: VitaminLevels;
  mineralLevels: MineralLevels;

  // 건강 위험도 점수 (0-100, 높을수록 위험)
  diseaseRiskScores: DiseaseRiskScores;

  // 일일 활동량
  dailyActivity: DailyActivity;

  // 현재 건강 상태 평가
  overallHealthScore: number; // 0-100 점수
  healthStatus: HealthStatus;
}

// 영양 균형 (일일 섭취량 기준)
export interface NutritionBalance {
  carbohydrates: number; // g
  protein: number;       // g
  fat: number;           // g
  fiber: number;         // g
  sugar: number;         // g
  sodium: number;        // mg
  cholesterol: number;   // mg
}

// 비타민 레벨 (0-100, 권장 섭취량 대비)
export interface VitaminLevels {
  vitaminA: number;
  vitaminB: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
}

// 미네랄 레벨 (0-100, 권장 섭취량 대비)
export interface MineralLevels {
  calcium: number;
  iron: number;
  magnesium: number;
  potassium: number;
  zinc: number;
}

// 질병별 위험도 점수
export interface DiseaseRiskScores {
  cardiovascular: number;    // 심혈관 질환 위험도
  diabetes: number;          // 당뇨 위험도
  kidney: number;            // 신장 질환 위험도
  obesity: number;           // 비만 위험도
  hypertension: number;      // 고혈압 위험도
}

// 일일 활동량
export interface DailyActivity {
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
  exerciseIntensity: 'low' | 'moderate' | 'high';
}

// 건강 상태 등급
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// 식단 효과 예측 인터페이스
export interface MealImpactPrediction {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealData: MealData;

  // 예측 계산 결과
  beforeMetrics: HealthMetrics;
  afterMetrics: HealthMetrics;

  // 구체적인 개선사항
  improvements: HealthImprovement[];

  // 목표 달성도
  goalProgress: GoalProgress;

  // 개인화된 추천 메시지
  insights: string[];
  recommendations: string[];
}

// 식단 데이터
export interface MealData {
  id: string;
  name: string;
  calories: number;
  nutrition: NutritionInfo;
  ingredients: Ingredient[];
}

// 건강 개선 항목
export interface HealthImprovement {
  metric: string;           // 개선 지표명 (예: "칼로리 균형")
  beforeValue: number;      // 개선 전 값
  afterValue: number;       // 개선 후 값
  improvement: number;      // 개선율 (%)
  status: 'improved' | 'maintained' | 'declined';
  description: string;      // 설명 (예: "하루 칼로리 목표의 25% 달성")
  priority: 'high' | 'medium' | 'low';
}

// 목표 달성도
export interface GoalProgress {
  dailyCalories: {
    current: number;
    target: number;
    percentage: number;
    status: GoalStatus;
  };
  macroBalance: {
    carbohydrates: GoalProgressItem;
    protein: GoalProgressItem;
    fat: GoalProgressItem;
  };
  micronutrients: {
    [key: string]: GoalProgressItem;
  };
}

export interface GoalProgressItem {
  current: number;
  target: number;
  percentage: number;
  status: GoalStatus;
}

export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'exceeded';

// 건강 목표 설정
export interface HealthGoals {
  dailyCalories: number;
  macroTargets: {
    carbohydrates: number; // %
    protein: number;       // %
    fat: number;           // %
  };
  micronutrientTargets: {
    [key: string]: number;
  };
  healthPriorities: HealthPriority[];
}

export type HealthPriority = 'weight-loss' | 'muscle-gain' | 'heart-health' | 'diabetes-management' | 'kidney-health' | 'general-health';

// 시각화 컴포넌트용 설정
export interface VisualizationConfig {
  theme: 'light' | 'dark';
  animationDuration: number;
  showPercentages: boolean;
  showComparisons: boolean;
  colorScheme: ColorScheme;
}

export interface ColorScheme {
  excellent: string;
  good: string;
  fair: string;
  poor: string;
  critical: string;
  primary: string;
  secondary: string;
}

// 차트 데이터 포맷
export interface ChartDataPoint {
  label: string;
  value: number;
  target?: number;
  color?: string;
  status?: HealthStatus;
}

export interface ComparisonDataPoint {
  label: string;
  before: number;
  after: number;
  improvement: number;
}

// 건강 인사이트
export interface HealthInsight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

// 수면 데이터
export interface SleepData {
  id: string;
  user_id: string;
  family_member_id: string | null;
  date: string;
  sleep_duration_minutes: number | null;
  sleep_quality_score: number | null; // 1-10
  deep_sleep_minutes: number | null;
  light_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  bedtime: string | null;
  wake_time: string | null;
  source: 'manual' | 'fitbit' | 'apple_health' | 'samsung_health';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 활동량 데이터
export interface ActivityData {
  id: string;
  user_id: string;
  family_member_id: string | null;
  date: string;
  steps: number;
  exercise_minutes: number;
  calories_burned: number;
  activity_type: string | null;
  source: 'manual' | 'google_fit' | 'apple_health' | 'samsung_health';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 혈압/혈당 데이터
export interface VitalSigns {
  id: string;
  user_id: string;
  family_member_id: string | null;
  measured_at: string;
  systolic_bp: number | null; // 수축기 혈압 (mmHg)
  diastolic_bp: number | null; // 이완기 혈압 (mmHg)
  fasting_glucose: number | null; // 공복 혈당 (mg/dL)
  postprandial_glucose: number | null; // 식후 혈당 (mg/dL)
  heart_rate: number | null; // 심박수 (bpm)
  source: 'manual' | 'health_checkup' | 'health_highway' | 'mydata';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 체중 기록
export interface WeightLog {
  id: string;
  user_id: string;
  family_member_id: string | null;
  date: string;
  weight_kg: number;
  body_fat_percentage: number | null;
  muscle_mass_kg: number | null;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 통합 건강 대시보드 데이터
export interface IntegratedHealthDashboard {
  summary: {
    healthScore: number;
    bmi: number;
    dailySteps: number;
    sleepHours: number;
  };
  healthIndicators: HealthMetrics;
  lifestylePatterns: {
    activity: ActivityData[];
    sleep: SleepData[];
  };
  healthMonitoring: {
    vitalSigns: VitalSigns[];
    weightTrend: WeightLog[];
  };
  healthTrends: {
    healthScoreTrend: { date: string; score: number }[];
    nutritionTrend: { date: string; nutrition: NutritionBalance }[];
  };
  insights: HealthInsight[];
}

// 기존 타입들과의 호환성
import { NutritionInfo } from './health';
import { Ingredient } from './recipe';

// MealData의 nutrition 필드 타입 재정의
declare module './health-visualization' {
  interface MealData {
    nutrition: NutritionInfo;
  }
}
