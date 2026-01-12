/**
 * @file app/api/health/meal-impact/route.ts
 * @description 식단 효과 예측 API - 특정 식사를 섭취했을 때의 건강 변화를 간단히 예측
 *
 * 주의:
 * - 현재는 ML/의학 모델이 아닌 "설명 가능한 단순 모델"입니다.
 * - 실제 서비스 고도화 시, 임상 근거/개인 데이터/전문의 검증이 필요합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type {
  GoalProgress,
  HealthImprovement,
  HealthMetrics,
  MealData,
  MealImpactPrediction,
} from '@/types/health-visualization';

interface MealImpactRequestBody {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealData: MealData;
  currentHealth: HealthMetrics;
  previousMeals?: MealData[];
  dailyCalorieGoal?: number;
}

export async function POST(request: NextRequest) {
  console.group('[MealImpact API] 요청 시작');
  try {
    const { userId } = await auth();
    if (!userId) {
      console.warn('[MealImpact API] 인증 실패');
      console.groupEnd();
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as MealImpactRequestBody;

    if (!body?.mealType || !body?.mealData || !body?.currentHealth) {
      console.warn('[MealImpact API] 요청 바디 누락', {
        hasMealType: !!body?.mealType,
        hasMealData: !!body?.mealData,
        hasCurrentHealth: !!body?.currentHealth,
      });
      console.groupEnd();
      return NextResponse.json(
        { error: '요청 데이터가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    console.log('[MealImpact API] 입력 요약', {
      userId,
      mealType: body.mealType,
      mealName: body.mealData.name,
      mealCalories: body.mealData.calories,
    });

    const prediction = calculateMealImpact(body);

    console.log('[MealImpact API] 예측 완료', {
      mealType: prediction.mealType,
      beforeScore: prediction.beforeMetrics.overallHealthScore,
      afterScore: prediction.afterMetrics.overallHealthScore,
    });
    console.groupEnd();

    return NextResponse.json({ success: true, prediction });
  } catch (error) {
    console.error('[MealImpact API] 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      { error: '식단 효과 예측 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

function calculateMealImpact(input: MealImpactRequestBody): MealImpactPrediction {
  const { mealType, mealData, currentHealth, previousMeals = [] } = input;

  const beforeMetrics = currentHealth;
  const afterMetrics = simulateMealConsumption(beforeMetrics, mealData, previousMeals);

  const improvements = analyzeHealthImprovements(beforeMetrics, afterMetrics);
  const goalProgress = calculateGoalProgress(afterMetrics, input.dailyCalorieGoal ?? 2000);
  const insights = generateMealInsights(mealType, mealData, improvements);
  const recommendations = generateRecommendations(mealType, mealData, improvements);

  return {
    mealType,
    mealData,
    beforeMetrics,
    afterMetrics,
    improvements,
    goalProgress,
    insights,
    recommendations,
  };
}

function simulateMealConsumption(
  currentHealth: HealthMetrics,
  mealData: MealData,
  previousMeals: MealData[],
): HealthMetrics {
  const after: HealthMetrics = {
    ...currentHealth,
    nutritionBalance: { ...currentHealth.nutritionBalance },
    vitaminLevels: { ...currentHealth.vitaminLevels },
    mineralLevels: { ...currentHealth.mineralLevels },
    diseaseRiskScores: { ...currentHealth.diseaseRiskScores },
    dailyActivity: { ...currentHealth.dailyActivity },
  };

  const n = mealData.nutrition as unknown as {
    carbohydrates?: number;
    protein?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
  };

  after.nutritionBalance = {
    ...after.nutritionBalance,
    carbohydrates: after.nutritionBalance.carbohydrates + (n.carbohydrates ?? 0),
    protein: after.nutritionBalance.protein + (n.protein ?? 0),
    fat: after.nutritionBalance.fat + (n.fat ?? 0),
    fiber: after.nutritionBalance.fiber + (n.fiber ?? 0),
    sugar: after.nutritionBalance.sugar + (n.sugar ?? 0),
    sodium: after.nutritionBalance.sodium + (n.sodium ?? 0),
    cholesterol: after.nutritionBalance.cholesterol + (n.cholesterol ?? 0),
  };

  // 매우 단순한 가중치 모델(설명용): 나트륨/당이 높으면 점수 하락, 단백질/식이섬유가 높으면 점수 상승
  const totalSodium = after.nutritionBalance.sodium;
  const totalSugar = after.nutritionBalance.sugar;
  const totalProtein = after.nutritionBalance.protein;
  const totalFiber = after.nutritionBalance.fiber;

  const baseScore = currentHealth.overallHealthScore;
  const sodiumPenalty = Math.min(12, Math.max(0, (totalSodium - 2000) / 500)); // 2000mg 초과 시 패널티
  const sugarPenalty = Math.min(10, Math.max(0, (totalSugar - 50) / 10)); // 50g 초과 시 패널티
  const proteinBonus = Math.min(10, Math.max(0, (totalProtein - 70) / 10)); // 70g 이상 보너스
  const fiberBonus = Math.min(10, Math.max(0, (totalFiber - 20) / 5)); // 20g 이상 보너스

  const mealCalories = Math.max(0, mealData.calories || 0);
  const prevCalories = previousMeals.reduce((sum, m) => sum + (m?.calories || 0), 0);
  const totalCalories = prevCalories + mealCalories;
  const caloriePenalty = Math.min(10, Math.max(0, (totalCalories - 2200) / 300)); // 2200 초과 시 패널티

  const nextScore = clampNumber(
    baseScore - sodiumPenalty - sugarPenalty - caloriePenalty + proteinBonus + fiberBonus,
    0,
    100,
  );

  after.overallHealthScore = Math.round(nextScore);
  after.healthStatus = getHealthStatus(after.overallHealthScore);

  return after;
}

function analyzeHealthImprovements(before: HealthMetrics, after: HealthMetrics): HealthImprovement[] {
  const deltaScore = after.overallHealthScore - before.overallHealthScore;
  const scorePct = before.overallHealthScore === 0 ? 0 : (deltaScore / before.overallHealthScore) * 100;

  const toStatus = (delta: number): HealthImprovement['status'] =>
    delta > 0 ? 'improved' : delta < 0 ? 'declined' : 'maintained';

  return [
    {
      metric: '전체 건강 점수',
      beforeValue: before.overallHealthScore,
      afterValue: after.overallHealthScore,
      improvement: scorePct,
      status: toStatus(deltaScore),
      description:
        deltaScore > 0
          ? '식사 후 건강 점수가 개선될 것으로 예상돼요.'
          : deltaScore < 0
            ? '식사 후 건강 점수가 약간 낮아질 수 있어요.'
            : '건강 점수는 크게 변하지 않을 것으로 보여요.',
      priority: 'high',
    },
    {
      metric: '단백질 섭취',
      beforeValue: before.nutritionBalance.protein,
      afterValue: after.nutritionBalance.protein,
      improvement:
        before.nutritionBalance.protein === 0
          ? 0
          : ((after.nutritionBalance.protein - before.nutritionBalance.protein) /
              before.nutritionBalance.protein) *
            100,
      status: toStatus(after.nutritionBalance.protein - before.nutritionBalance.protein),
      description: '단백질 섭취량 변화입니다.',
      priority: 'medium',
    },
    {
      metric: '식이섬유 섭취',
      beforeValue: before.nutritionBalance.fiber,
      afterValue: after.nutritionBalance.fiber,
      improvement:
        before.nutritionBalance.fiber === 0
          ? 0
          : ((after.nutritionBalance.fiber - before.nutritionBalance.fiber) /
              before.nutritionBalance.fiber) *
            100,
      status: toStatus(after.nutritionBalance.fiber - before.nutritionBalance.fiber),
      description: '식이섬유 섭취량 변화입니다.',
      priority: 'medium',
    },
  ];
}

function calculateGoalProgress(after: HealthMetrics, dailyCalorieGoal: number): GoalProgress {
  const estimatedCalories =
    after.nutritionBalance.carbohydrates * 4 +
    after.nutritionBalance.protein * 4 +
    after.nutritionBalance.fat * 9;

  const pct = dailyCalorieGoal > 0 ? (estimatedCalories / dailyCalorieGoal) * 100 : 0;
  const percentage = Math.round(clampNumber(pct, 0, 300));

  const status: GoalProgress['dailyCalories']['status'] =
    percentage >= 110 ? 'exceeded' : percentage >= 100 ? 'completed' : percentage >= 60 ? 'in-progress' : 'not-started';

  const macroTargets = {
    carbohydrates: 250,
    protein: 80,
    fat: 70,
  };

  const macro = {
    carbohydrates: toGoalItem(after.nutritionBalance.carbohydrates, macroTargets.carbohydrates),
    protein: toGoalItem(after.nutritionBalance.protein, macroTargets.protein),
    fat: toGoalItem(after.nutritionBalance.fat, macroTargets.fat),
  };

  return {
    dailyCalories: {
      current: Math.round(estimatedCalories),
      target: dailyCalorieGoal,
      percentage,
      status,
    },
    macroBalance: macro,
    micronutrients: {
      vitaminC: toGoalItem(after.vitaminLevels.vitaminC, 100),
    },
  };
}

function toGoalItem(current: number, target: number): GoalProgress['macroBalance']['carbohydrates'] {
  const pct = target > 0 ? (current / target) * 100 : 0;
  const percentage = Math.round(clampNumber(pct, 0, 300));
  const status: GoalProgress['dailyCalories']['status'] =
    percentage >= 110 ? 'exceeded' : percentage >= 100 ? 'completed' : percentage >= 60 ? 'in-progress' : 'not-started';
  return {
    current,
    target,
    percentage,
    status,
  };
}

function generateMealInsights(
  mealType: MealImpactPrediction['mealType'],
  mealData: MealData,
  improvements: HealthImprovement[],
): string[] {
  const insights: string[] = [];

  if (mealType === 'breakfast') {
    insights.push('아침은 하루 컨디션을 좌우하는 첫 식사예요.');
  } else if (mealType === 'lunch') {
    insights.push('점심은 하루의 주요 에너지원이 되는 식사예요.');
  } else if (mealType === 'dinner') {
    insights.push('저녁은 과식만 피하면 회복과 수면에 도움이 돼요.');
  }

  insights.push(`이번 식사의 칼로리는 약 ${Math.round(mealData.calories)}kcal 입니다.`);

  const score = improvements.find((i) => i.metric === '전체 건강 점수');
  if (score?.status === 'improved') insights.push('예상 건강 점수가 좋아지는 방향이에요.');
  if (score?.status === 'declined') insights.push('나트륨/당/총칼로리 측면에서 조절 여지가 있어요.');

  return insights;
}

function generateRecommendations(
  mealType: MealImpactPrediction['mealType'],
  mealData: MealData,
  improvements: HealthImprovement[],
): string[] {
  const recs: string[] = [];

  const score = improvements.find((i) => i.metric === '전체 건강 점수');
  if (score?.status === 'declined') {
    recs.push('국/찌개가 있다면 국물 섭취를 줄여 나트륨을 관리해보세요.');
    recs.push('후식/음료의 당(설탕) 섭취를 줄이면 혈당 스파이크를 줄이는 데 도움이 돼요.');
  }

  const protein = (mealData.nutrition as any)?.protein;
  if (typeof protein === 'number' && protein < 15) {
    recs.push('단백질이 조금 낮을 수 있어요. 달걀/두부/살코기/콩류를 추가해보세요.');
  }

  if (mealType === 'dinner') {
    recs.push('저녁은 식후 2~3시간 뒤 취침을 권장해요.');
  }

  return recs;
}

function getHealthStatus(score: number): HealthMetrics['healthStatus'] {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 35) return 'poor';
  return 'critical';
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

