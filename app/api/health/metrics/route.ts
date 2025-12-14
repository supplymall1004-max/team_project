/**
 * @file app/api/health/metrics/route.ts
 * @description 건강 메트릭스 API - 사용자의 현재 건강 상태를 계산하여 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';
import {
  HealthMetrics,
  NutritionBalance,
  VitaminLevels,
  MineralLevels,
  DiseaseRiskScores,
  DailyActivity
} from '@/types/health-visualization';
import { UserHealthProfile } from '@/types/health';

export async function GET(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();

    // 사용자의 Supabase user_id 조회 (없으면 자동 동기화)
    console.log('[Health Metrics API] 사용자 확인 및 동기화 시도...');
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error('[Health Metrics API] 사용자 동기화 실패:', {
        clerkId: userId
      });
      return NextResponse.json(
        { 
          error: '사용자 정보를 동기화할 수 없습니다. 잠시 후 다시 시도해주세요.',
          details: 'Clerk 사용자 정보를 Supabase에 동기화하는 중 오류가 발생했습니다.'
        },
        { status: 500 }
      );
    }

    console.log('[Health Metrics API] 사용자 확인 완료:', userData.id);

    // 건강 프로필 조회
    const { data: healthProfile, error: profileError } = await supabase
      .from('user_health_profiles')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    // 건강 프로필이 없는 경우 기본값으로 메트릭스 계산
    if (profileError || !healthProfile) {
      console.log('[Health Metrics API] 건강 프로필이 없습니다. 기본값으로 계산합니다.');
      
      // 기본 건강 프로필 생성
      const defaultHealthProfile: Partial<UserHealthProfile> = {
        user_id: userData.id,
        age: null,
        gender: null,
        height_cm: null,
        weight_kg: null,
        activity_level: null,
        diseases: null,
        allergies: null,
      };

      // 기본값으로 메트릭스 계산
      const healthMetrics = await calculateHealthMetrics(defaultHealthProfile as UserHealthProfile);
      
      return NextResponse.json({
        success: true,
        metrics: healthMetrics,
        message: '건강 정보가 없어 기본값으로 계산되었습니다.'
      });
    }

    // 건강 메트릭스 계산
    const healthMetrics = await calculateHealthMetrics(healthProfile);

    return NextResponse.json({
      success: true,
      metrics: healthMetrics
    });

  } catch (error) {
    console.error('[Health Metrics API] 오류:', error);
    return NextResponse.json(
      { error: '건강 메트릭스 계산 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 건강 프로필을 기반으로 건강 메트릭스 계산
 */
async function calculateHealthMetrics(profile: UserHealthProfile): Promise<HealthMetrics> {
  // 기본 건강 지표 계산 (null 값 처리)
  const bmi = (profile.weight_kg && profile.height_cm) 
    ? calculateBMI(profile.weight_kg, profile.height_cm)
    : 22; // 기본 BMI 값
  const bodyFatPercentage = estimateBodyFatPercentage(profile);
  const muscleMass = estimateMuscleMass(profile);
  const basalMetabolicRate = calculateBMR(profile);

  // 영양 균형 계산 (현재 날짜 기준 최근 식단 데이터 활용)
  const nutritionBalance = await calculateCurrentNutritionBalance(profile);

  // 비타민 및 미네랄 레벨 추정
  const vitaminLevels = estimateVitaminLevels(nutritionBalance);
  const mineralLevels = estimateMineralLevels(nutritionBalance);

  // 질병 위험도 계산
  const diseaseRiskScores = calculateDiseaseRiskScores(profile, bmi, nutritionBalance);

  // 일일 활동량 (기본값, 실제로는 웨어러블 데이터 연동 가능)
  const dailyActivity = getDefaultDailyActivity();

  // 전체 건강 점수 계산
  const overallHealthScore = calculateOverallHealthScore({
    bmi,
    bodyFatPercentage,
    muscleMass,
    basalMetabolicRate,
    nutritionBalance,
    diseaseRiskScores,
    dailyActivity
  });

  return {
    bmi,
    bodyFatPercentage,
    muscleMass,
    basalMetabolicRate,
    nutritionBalance,
    vitaminLevels,
    mineralLevels,
    diseaseRiskScores,
    dailyActivity,
    overallHealthScore,
    healthStatus: getHealthStatus(overallHealthScore)
  };
}

/**
 * BMI 계산
 */
function calculateBMI(weight: number, height: number): number {
  return weight / Math.pow(height / 100, 2);
}

/**
 * 체지방률 추정 (간단한 공식 기반)
 */
function estimateBodyFatPercentage(profile: UserHealthProfile): number {
  const { gender, age, weight_kg, height_cm } = profile;

  if (!gender || !age || !weight_kg || !height_cm) return 20; // 기본값

  // 간단한 추정 공식 (실제로는 더 정교한 계산 필요)
  const baseFat = gender === 'female' ? 18 : 10;
  const ageAdjustment = Math.max(0, (age - 30) * 0.1);
  const bmiAdjustment = Math.max(0, calculateBMI(weight_kg, height_cm) - 22) * 0.5;

  return Math.min(40, Math.max(5, baseFat + ageAdjustment + bmiAdjustment));
}

/**
 * 근육량 추정
 */
function estimateMuscleMass(profile: UserHealthProfile): number {
  const { gender, weight_kg } = profile;

  if (!gender || !weight_kg) return 25; // 기본값

  // 체중의 약 40-50% 정도 근육량으로 추정
  const baseMuscleRatio = gender === 'male' ? 0.45 : 0.40;
  return weight_kg * baseMuscleRatio;
}

/**
 * 기초대사율 계산 (Mifflin-St Jeor 공식)
 */
function calculateBMR(profile: UserHealthProfile): number {
  const { gender, age, weight_kg, height_cm } = profile;

  if (!gender || !age || !weight_kg || !height_cm) return 1500; // 기본값

  if (gender === 'male') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
}

/**
 * 현재 영양 균형 계산 (최근 식단 데이터 기반)
 */
async function calculateCurrentNutritionBalance(profile: UserHealthProfile): Promise<NutritionBalance> {
  // 실제로는 최근 식단 데이터를 조회하여 계산
  // 현재는 기본값으로 설정

  return {
    carbohydrates: 250, // g
    protein: 80,        // g
    fat: 70,           // g
    fiber: 25,         // g
    sugar: 45,         // g
    sodium: 2800,      // mg
    cholesterol: 250   // mg
  };
}

/**
 * 비타민 레벨 추정
 */
function estimateVitaminLevels(nutrition: NutritionBalance): VitaminLevels {
  // 영양 데이터 기반으로 비타민 섭취량 추정
  // 실제로는 더 정교한 계산 필요
  return {
    vitaminA: 85,
    vitaminB: 78,
    vitaminC: 92,
    vitaminD: 45,
    vitaminE: 67
  };
}

/**
 * 미네랄 레벨 추정
 */
function estimateMineralLevels(nutrition: NutritionBalance): MineralLevels {
  return {
    calcium: 78,
    iron: 82,
    magnesium: 65,
    potassium: 88,
    zinc: 71
  };
}

/**
 * 질병 위험도 점수 계산
 */
function calculateDiseaseRiskScores(
  profile: UserHealthProfile,
  bmi: number,
  nutrition: NutritionBalance
): DiseaseRiskScores {
  const scores: DiseaseRiskScores = {
    cardiovascular: 20,
    diabetes: 15,
    kidney: 10,
    obesity: 25,
    hypertension: 18
  };

  // BMI 기반 조정
  if (bmi > 30) {
    scores.cardiovascular += 30;
    scores.diabetes += 25;
    scores.hypertension += 20;
  } else if (bmi > 25) {
    scores.cardiovascular += 15;
    scores.diabetes += 15;
    scores.hypertension += 10;
  }

  // 나이 기반 조정
  if (profile.age && profile.age > 50) {
    scores.cardiovascular += 10;
    scores.hypertension += 8;
  }

  // 질병 이력 기반 조정
  if (profile.diseases?.some(d => d.code === 'diabetes')) {
    scores.diabetes += 40;
    scores.kidney += 15;
  }

  if (profile.diseases?.some(d => d.code === 'hypertension')) {
    scores.cardiovascular += 25;
    scores.kidney += 20;
  }

  // 범위 제한 (0-100)
  Object.keys(scores).forEach(key => {
    scores[key as keyof DiseaseRiskScores] = Math.min(100, Math.max(0, scores[key as keyof DiseaseRiskScores]));
  });

  return scores;
}

/**
 * 기본 일일 활동량
 */
function getDefaultDailyActivity(): DailyActivity {
  return {
    steps: 8000,
    activeMinutes: 45,
    caloriesBurned: 320,
    exerciseIntensity: 'moderate'
  };
}

/**
 * 전체 건강 점수 계산
 */
function calculateOverallHealthScore(metrics: {
  bmi: number;
  bodyFatPercentage: number;
  muscleMass: number;
  basalMetabolicRate: number;
  nutritionBalance: NutritionBalance;
  diseaseRiskScores: DiseaseRiskScores;
  dailyActivity: DailyActivity;
}): number {
  let score = 100;

  // BMI 점수
  if (metrics.bmi < 18.5 || metrics.bmi > 30) score -= 15;
  else if (metrics.bmi > 25) score -= 8;

  // 질병 위험도 평균
  const avgDiseaseRisk = Object.values(metrics.diseaseRiskScores)
    .reduce((sum, risk) => sum + risk, 0) / Object.values(metrics.diseaseRiskScores).length;
  score -= avgDiseaseRisk * 0.5;

  // 활동량 점수
  if (metrics.dailyActivity.steps < 5000) score -= 10;
  else if (metrics.dailyActivity.steps > 10000) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * 건강 상태 분류
 */
function getHealthStatus(score: number): HealthMetrics['healthStatus'] {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 35) return 'poor';
  return 'critical';
}
