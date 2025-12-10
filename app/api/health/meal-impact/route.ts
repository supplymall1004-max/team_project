/**
 * @file app/api/health/meal-impact/route.ts
 * @description 식단 효과 예측 API - 특정 식사를 섭취했을 때의 건강 변화를 예측
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  MealImpactPrediction,
  HealthImprovement,
  GoalProgress,
  HealthMetrics,
  MealData
} from '@/types/health-visualization';

export async function POST(request: NextRequest) {
  try {
    console.log('[Meal Impact API] 요청 시작');

    const supabase = await createClerkSupabaseClient();

    // 요청 데이터 파싱
    const body = await request.json();
    console.log('[Meal Impact API] 받은 데이터:', JSON.stringify(body, null, 2));

    const {
      mealType,
      mealData,
      currentHealth,
      previousMeals = []
    }: {
      mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      mealData: MealData;
      currentHealth: HealthMetrics;
      previousMeals: MealData[];
    } = body;

    console.log('[Meal Impact API] 파싱된 데이터:', {
      mealType,
      hasMealData: !!mealData,
      hasCurrentHealth: !!currentHealth,
      previousMealsCount: previousMeals.length
    });

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Meal Impact API] 인증 결과:', {
      hasUser: !!user,
      hasAuthError: !!authError,
      authErrorMessage: authError?.message
    });

    if (authError || !user) {
      console.log('[Meal Impact API] 인증 실패, 401 반환');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 식단 효과 예측 계산
    const prediction = await calculateMealImpact(
      mealType,
      mealData,
      currentHealth,
      previousMeals
    );

    return NextResponse.json({
      success: true,
      prediction
    });

  } catch (error) {
    console.error('[Meal Impact API] 오류:', error);
    return NextResponse.json(
      { error: '식단 효과 예측 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 식단 효과 예측 계산
 */
async function calculateMealImpact(
  mealType: string,
  mealData: MealData,
  currentHealth: HealthMetrics,
  previousMeals: MealData[]
): Promise<MealImpactPrediction> {

  // 식사 섭취 후 건강 상태 계산
  const afterMetrics = await simulateMealConsumption(currentHealth, mealData, previousMeals);

  // 개선사항 분석
  const improvements = analyzeHealthImprovements(currentHealth, afterMetrics, mealData);

  // 목표 달성도 계산
  const goalProgress = calculateGoalProgress(afterMetrics, mealData);

  // 개인화된 인사이트 생성
  const insights = generateMealInsights(mealType, mealData, improvements, currentHealth);
  const recommendations = generateRecommendations(mealType, mealData, improvements);

  return {
    mealType: mealType as any,
    mealData,
    beforeMetrics: currentHealth,
    afterMetrics,
    improvements,
    goalProgress,
    insights,
    recommendations
  };
}

/**
 * 식사 섭취 후 건강 상태 시뮬레이션
 */
async function simulateMealConsumption(
  currentHealth: HealthMetrics,
  mealData: MealData,
  previousMeals: MealData[]
): Promise<HealthMetrics> {

  // 현재 건강 상태 복사
  const afterMetrics: HealthMetrics = { ...currentHealth };

  // 식단 영양 정보 추출
  const mealNutrition = mealData.nutrition;

  // 칼로리 균형 조정
  const mealCalories = mealData.calories;
  // 실제로는 하루 총 칼로리 목표와 비교하여 조정

  // 영양 균형 업데이트
  afterMetrics.nutritionBalance = {
    ...afterMetrics.nutritionBalance,
    carbohydrates: afterMetrics.nutritionBalance.carbohydrates + (mealNutrition.carbohydrates || 0),
    protein: afterMetrics.nutritionBalance.protein + (mealNutrition.protein || 0),
    fat: afterMetrics.nutritionBalance.fat + (mealNutrition.fat || 0),
    fiber: afterMetrics.nutritionBalance.fiber + (mealNutrition.fiber || 0),
    sugar: afterMetrics.nutritionBalance.sugar + (mealNutrition.sugar || 0),
    sodium: afterMetrics.nutritionBalance.sodium + (mealNutrition.sodium || 0),
    cholesterol: afterMetrics.nutritionBalance.cholesterol + (mealNutrition.cholesterol || 0)
  };

  // 비타민 및 미네랄 레벨 업데이트 (추정치)
  afterMetrics.vitaminLevels = updateVitaminLevels(afterMetrics.vitaminLevels, mealData);
  afterMetrics.mineralLevels = updateMineralLevels(afterMetrics.mineralLevels, mealData);

  // 건강 점수 재계산
  afterMetrics.overallHealthScore = recalculateHealthScore(afterMetrics);

  // 건강 상태 재평가
  afterMetrics.healthStatus = getHealthStatus(afterMetrics.overallHealthScore);

  return afterMetrics;
}

/**
 * 건강 개선사항 분석
 */
function analyzeHealthImprovements(
  before: HealthMetrics,
  after: HealthMetrics,
  mealData: MealData
): HealthImprovement[] {

  const improvements: HealthImprovement[] = [];

  // 칼로리 균형 개선
  const calorieImprovement = ((after.overallHealthScore - before.overallHealthScore) / before.overallHealthScore) * 100;
  improvements.push({
    metric: '전체 건강 점수',
    beforeValue: before.overallHealthScore,
    afterValue: after.overallHealthScore,
    improvement: calorieImprovement,
    status: calorieImprovement > 0 ? 'improved' : 'maintained',
    description: `식사로 인해 건강 점수가 ${calorieImprovement > 0 ? '향상' : '유지'}되었습니다.`,
    priority: 'high'
  });

  // 단백질 섭취 개선
  const proteinBefore = before.nutritionBalance.protein;
  const proteinAfter = after.nutritionBalance.protein;
  const proteinImprovement = ((proteinAfter - proteinBefore) / proteinBefore) * 100;

  improvements.push({
    metric: '단백질 섭취',
    beforeValue: proteinBefore,
    afterValue: proteinAfter,
    improvement: proteinImprovement,
    status: proteinImprovement > 0 ? 'improved' : 'maintained',
    description: `단백질 섭취량이 ${proteinImprovement.toFixed(1)}% 증가했습니다.`,
    priority: 'medium'
  });

  // 탄수화물 균형
  const carbBefore = before.nutritionBalance.carbohydrates;
  const carbAfter = after.nutritionBalance.carbohydrates;
  const carbImprovement = Math.abs(carbAfter - carbBefore) < 10 ? 0 :
    ((carbAfter - carbBefore) / carbBefore) * 100;

  improvements.push({
    metric: '탄수화물 균형',
    beforeValue: carbBefore,
    afterValue: carbAfter,
    improvement: carbImprovement,
    status: Math.abs(carbImprovement) < 5 ? 'maintained' : 'improved',
    description: `탄수화물 섭취 균형이 ${Math.abs(carbImprovement).toFixed(1)}% 조정되었습니다.`,
    priority: 'medium'
  });

  return improvements;
}

/**
 * 목표 달성도 계산
 */
function calculateGoalProgress(afterMetrics: HealthMetrics, mealData: MealData): GoalProgress {

  // 임시 목표 값 (실제로는 사용자 설정값 사용)
  const dailyCalorieGoal = 2000;
  const currentCalories = afterMetrics.nutritionBalance.carbohydrates * 4 +
                         afterMetrics.nutritionBalance.protein * 4 +
                         afterMetrics.nutritionBalance.fat * 9;

  const calorieProgress = Math.min(100, (currentCalories / dailyCalorieGoal) * 100);

  return {
    dailyCalories: {
      current: Math.round(currentCalories),
      target: dailyCalorieGoal,
      percentage: Math.round(calorieProgress),
      status: calorieProgress >= 100 ? 'completed' :
              calorieProgress >= 75 ? 'in-progress' : 'not-started'
    },
    macroBalance: {
      carbohydrates: {
        current: afterMetrics.nutritionBalance.carbohydrates,
        target: 250, // g
        percentage: Math.round((afterMetrics.nutritionBalance.carbohydrates / 250) * 100),
        status: 'in-progress'
      },
      protein: {
        current: afterMetrics.nutritionBalance.protein,
        target: 80, // g
        percentage: Math.round((afterMetrics.nutritionBalance.protein / 80) * 100),
        status: 'in-progress'
      },
      fat: {
        current: afterMetrics.nutritionBalance.fat,
        target: 70, // g
        percentage: Math.round((afterMetrics.nutritionBalance.fat / 70) * 100),
        status: 'in-progress'
      }
    },
    micronutrients: {
      vitaminC: {
        current: afterMetrics.vitaminLevels.vitaminC,
        target: 100,
        percentage: afterMetrics.vitaminLevels.vitaminC,
        status: afterMetrics.vitaminLevels.vitaminC >= 80 ? 'completed' : 'in-progress'
      }
    }
  };
}

/**
 * 식사별 인사이트 생성
 */
function generateMealInsights(
  mealType: string,
  mealData: MealData,
  improvements: HealthImprovement[],
  currentHealth: HealthMetrics
): string[] {

  const insights: string[] = [];

  // 식사 유형별 기본 인사이트
  switch (mealType) {
    case 'breakfast':
      insights.push('아침 식사는 하루 에너지의 기초가 됩니다.');
      if (improvements.some(i => i.metric === '단백질 섭취' && i.improvement > 0)) {
        insights.push('단백질이 풍부한 아침 식사로 근육 유지에 도움이 됩니다.');
      }
      break;

    case 'lunch':
      insights.push('점심 식사는 주요 영양 공급원입니다.');
      if (currentHealth.diseaseRiskScores.diabetes > 50) {
        insights.push('저GI 식품으로 혈당 관리에 유리합니다.');
      }
      break;

    case 'dinner':
      insights.push('저녁 식사는 가벼운 식사가 권장됩니다.');
      if (mealData.calories < 600) {
        insights.push('적정 칼로리의 저녁 식사로 수면 질 향상에 도움이 됩니다.');
      }
      break;
  }

  // 개선사항 기반 인사이트
  const positiveImprovements = improvements.filter(i => i.status === 'improved');
  if (positiveImprovements.length > 0) {
    insights.push(`총 ${positiveImprovements.length}개의 건강 지표가 개선되었습니다.`);
  }

  return insights;
}

/**
 * 개인화된 추천사항 생성
 */
function generateRecommendations(
  mealType: string,
  mealData: MealData,
  improvements: HealthImprovement[]
): string[] {

  const recommendations: string[] = [];

  // 칼로리 균형에 따른 추천
  const calorieImprovement = improvements.find(i => i.metric === '전체 건강 점수');
  if (calorieImprovement && calorieImprovement.improvement < 5) {
    recommendations.push('더 다양한 영양소를 포함한 식단 구성을 고려해보세요.');
  }

  // 식사 유형별 추천
  if (mealType === 'breakfast') {
    recommendations.push('아침 식사 후 2-3시간 간격으로 간식을 섭취하는 것을 권장합니다.');
  } else if (mealType === 'dinner') {
    recommendations.push('저녁 식사 후 3시간 이내에 잠자리에 들지 않도록 하세요.');
  }

  return recommendations;
}

/**
 * 비타민 레벨 업데이트 (추정치)
 */
function updateVitaminLevels(current: any, mealData: MealData): any {
  // 식단의 재료를 기반으로 비타민 섭취 추정
  // 실제로는 더 정교한 계산 필요
  const boost = mealData.ingredients?.some(ing =>
    ing.name.includes('과일') || ing.name.includes('채소')
  ) ? 5 : 2;

  return {
    ...current,
    vitaminC: Math.min(100, current.vitaminC + boost)
  };
}

/**
 * 미네랄 레벨 업데이트 (추정치)
 */
function updateMineralLevels(current: any, mealData: MealData): any {
  const boost = 3; // 기본 증가량

  return {
    ...current,
    calcium: Math.min(100, current.calcium + boost),
    iron: Math.min(100, current.iron + boost)
  };
}

/**
 * 건강 점수 재계산
 */
function recalculateHealthScore(metrics: HealthMetrics): number {
  // 간단한 재계산 로직
  let score = metrics.overallHealthScore;

  // 영양 균형 개선에 따른 점수 조정
  const nutritionScore = (
    metrics.nutritionBalance.protein / 80 * 25 +
    Math.min(metrics.nutritionBalance.fiber / 30 * 25, 25) +
    Math.min(metrics.vitaminLevels.vitaminC / 100 * 25, 25) +
    Math.min(metrics.mineralLevels.iron / 100 * 25, 25)
  );

  score = score * 0.7 + nutritionScore * 0.3;

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

 
 2 0 2 5 D�  1 2 ��  1 0 |�  �|�  $���  3 : 2 6 : 5 0 
 
 
 
 
 
 