/**
 * @file components/diet/health-warnings-card.tsx
 * @description 주의사항 카드 컴포넌트
 *
 * 현재 건강 상태를 기반으로 식단 섭취 시 주의사항을 표시합니다.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import type { MfdsNutritionInfo } from '@/types/mfds-recipe';

interface HealthWarningsCardProps {
  healthProfile: {
    diseases: string[];
    allergies: string[];
    daily_calorie_goal: number;
  };
  mealNutrition: MfdsNutritionInfo | {
    calories: number | null;
    protein: number | null;
    carbohydrates: number | null;
    fat: number | null;
    sodium: number | null;
    fiber?: number | null;
  };
}

/**
 * 질병 코드를 한글명으로 변환
 */
function getDiseaseLabel(code: string): string {
  const diseaseMap: Record<string, string> = {
    diabetes: '당뇨',
    diabetes_type1: '1형 당뇨',
    diabetes_type2: '2형 당뇨',
    hypertension: '고혈압',
    high_blood_pressure: '고혈압',
    high_cholesterol: '고지혈증',
    hyperlipidemia: '고지혈증',
    kidney_disease: '신장질환',
    ckd: '만성 신장질환',
    obesity: '비만',
    gout: '통풍',
  };

  // 부분 일치 검색
  for (const [key, value] of Object.entries(diseaseMap)) {
    if (code.includes(key) || key.includes(code)) {
      return value;
    }
  }

  return code;
}

/**
 * 알레르기 코드를 한글명으로 변환
 */
function getAllergyLabel(code: string): string {
  const allergyMap: Record<string, string> = {
    milk: '우유',
    egg: '계란',
    peanut: '땅콩',
    tree_nut: '견과류',
    fish: '생선',
    shellfish: '조개류',
    wheat: '밀',
    soy: '대두',
  };

  return allergyMap[code] || code;
}

export function HealthWarningsCard({
  healthProfile,
  mealNutrition,
}: HealthWarningsCardProps) {
  const warnings: Array<{ type: 'disease' | 'allergy' | 'nutrition'; message: string; severity: 'low' | 'moderate' | 'high' }> = [];

  // 질병별 주의사항
  healthProfile.diseases.forEach((diseaseCode) => {
    const diseaseName = getDiseaseLabel(diseaseCode);

    // 당뇨
    if (diseaseCode.includes('diabetes')) {
      const carbs = mealNutrition.carbohydrates || 0;
      if (carbs > 50) {
        warnings.push({
          type: 'disease',
          message: `${diseaseName} 환자는 탄수화물 섭취량(${carbs.toFixed(1)}g)이 높을 수 있습니다. 혈당 관리를 위해 식사 후 운동을 권장합니다.`,
          severity: 'moderate',
        });
      }
    }

    // 고혈압
    if (diseaseCode.includes('hypertension') || diseaseCode.includes('high_blood_pressure')) {
      const sodium = mealNutrition.sodium || 0;
      if (sodium > 600) {
        warnings.push({
          type: 'disease',
          message: `${diseaseName} 환자는 나트륨 섭취량(${sodium.toFixed(0)}mg)이 높을 수 있습니다. 저염식 식단을 권장합니다.`,
          severity: 'high',
        });
      }
    }

    // 신장질환
    if (diseaseCode.includes('kidney') || diseaseCode === 'ckd') {
      const sodium = mealNutrition.sodium || 0;
      const protein = mealNutrition.protein || 0;
      if (sodium > 500) {
        warnings.push({
          type: 'disease',
          message: `${diseaseName} 환자는 나트륨 섭취량(${sodium.toFixed(0)}mg)을 주의해야 합니다. 신장 보호를 위해 저염식이 필요합니다.`,
          severity: 'high',
        });
      }
      if (protein > 30) {
        warnings.push({
          type: 'disease',
          message: `${diseaseName} 환자는 단백질 섭취량(${protein.toFixed(1)}g)이 높을 수 있습니다. 신장 기능에 따라 단백질 제한이 필요할 수 있습니다.`,
          severity: 'moderate',
        });
      }
    }

    // 고지혈증
    if (diseaseCode.includes('cholesterol') || diseaseCode.includes('hyperlipidemia')) {
      const fat = mealNutrition.fat || 0;
      if (fat > 20) {
        warnings.push({
          type: 'disease',
          message: `${diseaseName} 환자는 지방 섭취량(${fat.toFixed(1)}g)을 주의해야 합니다. 콜레스테롤 수치 관리가 필요합니다.`,
          severity: 'moderate',
        });
      }
    }

    // 통풍
    if (diseaseCode.includes('gout')) {
      warnings.push({
        type: 'disease',
        message: `${diseaseName} 환자는 퓨린 함량이 높은 식재료를 피해야 합니다. 과도한 단백질 섭취도 주의가 필요합니다.`,
        severity: 'moderate',
      });
    }
  });

  // 알레르기 주의사항
  healthProfile.allergies.forEach((allergyCode) => {
    const allergyName = getAllergyLabel(allergyCode);
    warnings.push({
      type: 'allergy',
      message: `${allergyName} 알레르기가 있으시면 이 식단의 재료를 확인하시기 바랍니다.`,
      severity: 'high',
    });
  });

  // 영양소 과다 섭취 경고
  const sodium = mealNutrition.sodium || 0;
  if (sodium > 1000) {
    warnings.push({
      type: 'nutrition',
      message: `나트륨 함량(${sodium.toFixed(0)}mg)이 높습니다. 하루 권장량(2000mg)의 절반을 초과합니다.`,
      severity: 'moderate',
    });
  }

  const calories = mealNutrition.calories || 0;
  const mealCalorieRatio = (calories / healthProfile.daily_calorie_goal) * 100;
  if (mealCalorieRatio > 40) {
    warnings.push({
      type: 'nutrition',
      message: `칼로리 함량(${calories.toFixed(0)}kcal)이 하루 권장량의 ${mealCalorieRatio.toFixed(0)}%를 차지합니다. 다른 식사와의 균형을 고려하세요.`,
      severity: 'low',
    });
  }

  if (warnings.length === 0) {
    return null;
  }

  const highSeverityWarnings = warnings.filter((w) => w.severity === 'high');
  const otherWarnings = warnings.filter((w) => w.severity !== 'high');

  return (
    <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
        <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          주의사항
        </CardTitle>
        <CardDescription className="text-slate-600">
          현재 건강 상태를 고려한 식단 섭취 시 주의사항입니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {highSeverityWarnings.length > 0 && (
          <div className="space-y-2">
            {highSeverityWarnings.map((warning, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{warning.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {otherWarnings.length > 0 && (
          <div className="space-y-2">
            {otherWarnings.map((warning, index) => (
              <Alert key={index}>
                <Info className="h-4 w-4" />
                <AlertDescription>{warning.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

