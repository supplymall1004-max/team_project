/**
 * @file components/diet/disease-feedback-card.tsx
 * @description 질병별 식단 피드백 및 개선점 표시 컴포넌트
 * 
 * 주요 기능:
 * 1. 사용자의 질병 정보에 따른 식단 피드백 제공
 * 2. 식단이 질병에 미치는 긍정적/부정적 영향 분석
 * 3. 개선 방향 제시
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';

interface DiseaseFeedbackCardProps {
  diseases: string[];
  mealNutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    sodium: number;
    potassium?: number | null;
    phosphorus?: number | null;
    gi_index?: number | null;
  };
  mealName: string;
  className?: string;
}

interface DiseaseFeedback {
  disease: string;
  status: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  improvements: string[];
  concerns: string[];
}

const DISEASE_LABELS: Record<string, string> = {
  diabetes: '당뇨병',
  kidney_disease: '신장질환',
  cardiovascular_disease: '심혈관질환',
  hypertension: '고혈압',
  gout: '통풍',
  gastritis: '위염',
  liver_disease: '간질환',
};

export function DiseaseFeedbackCard({
  diseases,
  mealNutrition,
  mealName,
  className,
}: DiseaseFeedbackCardProps) {
  if (!diseases || diseases.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            건강 정보
          </CardTitle>
          <CardDescription>
            등록된 질병 정보가 없습니다. 건강 정보를 등록하면 맞춤형 피드백을 받을 수 있습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const feedbacks: DiseaseFeedback[] = diseases.map((disease) => {
    const feedback = analyzeDiseaseImpact(disease, mealNutrition, mealName);
    return feedback;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          질병별 식단 피드백
        </CardTitle>
        <CardDescription>
          이 식단이 귀하의 건강 상태에 미치는 영향 분석
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbacks.map((feedback, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              feedback.status === 'positive'
                ? 'bg-green-50 border-green-200'
                : feedback.status === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="font-semibold">
                {DISEASE_LABELS[feedback.disease] || feedback.disease}
              </Badge>
              {feedback.status === 'positive' && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              {feedback.status === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              {feedback.status === 'neutral' && (
                <Info className="h-5 w-5 text-blue-600" />
              )}
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">{feedback.title}</h4>
            <p className="text-sm text-gray-700 mb-3">{feedback.description}</p>

            {feedback.improvements.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">긍정적 영향</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {feedback.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-gray-700 list-disc">
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.concerns.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">주의사항</span>
                </div>
                <ul className="space-y-1 ml-6">
                  {feedback.concerns.map((concern, idx) => (
                    <li key={idx} className="text-sm text-gray-700 list-disc">
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            이 정보는 참고용이며 의료 진단을 대체하지 않습니다. 건강 문제가 있다면 전문의와 상담하세요.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

function analyzeDiseaseImpact(
  disease: string,
  nutrition: DiseaseFeedbackCardProps['mealNutrition'],
  mealName: string
): DiseaseFeedback {
  switch (disease) {
    case 'diabetes':
      return analyzeDiabetes(nutrition, mealName);
    case 'kidney_disease':
      return analyzeKidneyDisease(nutrition, mealName);
    case 'cardiovascular_disease':
    case 'hypertension':
      return analyzeCardiovascular(nutrition, mealName);
    case 'gout':
      return analyzeGout(nutrition, mealName);
    case 'gastritis':
      return analyzeGastritis(nutrition, mealName);
    default:
      return {
        disease,
        status: 'neutral',
        title: '일반적인 식단',
        description: '이 식단은 일반적인 건강한 식단입니다.',
        improvements: [],
        concerns: [],
      };
  }
}

function analyzeDiabetes(
  nutrition: DiseaseFeedbackCardProps['mealNutrition'],
  mealName: string
): DiseaseFeedback {
  const improvements: string[] = [];
  const concerns: string[] = [];
  let status: 'positive' | 'warning' | 'neutral' = 'neutral';

  // 탄수화물 분석
  if (nutrition.carbohydrates > 60) {
    concerns.push(`탄수화물 함량이 높습니다 (${nutrition.carbohydrates.toFixed(1)}g). 혈당 관리에 주의가 필요합니다.`);
    status = 'warning';
  } else if (nutrition.carbohydrates < 30) {
    improvements.push(`탄수화물 함량이 적절합니다 (${nutrition.carbohydrates.toFixed(1)}g).`);
  }

  // GI 지수 분석
  if (nutrition.gi_index !== null && nutrition.gi_index !== undefined) {
    if (nutrition.gi_index < 55) {
      improvements.push(`저GI 식품으로 혈당 상승이 완만합니다 (GI: ${nutrition.gi_index}).`);
      status = 'positive';
    } else if (nutrition.gi_index > 70) {
      concerns.push(`고GI 식품입니다 (GI: ${nutrition.gi_index}). 혈당 급상승에 주의하세요.`);
      status = 'warning';
    }
  }

  // 식이섬유 분석 (간접적으로)
  if (nutrition.carbohydrates > 0 && nutrition.carbohydrates < 50) {
    improvements.push('탄수화물 함량이 적절하여 혈당 관리에 도움이 됩니다.');
  }

  return {
    disease: 'diabetes',
    status: status === 'neutral' ? 'positive' : status,
    title: '당뇨병 관리 관점에서의 식단 분석',
    description: `이 식단은 당뇨병 관리에 ${status === 'positive' ? '도움이 됩니다' : status === 'warning' ? '주의가 필요합니다' : '일반적입니다'}.`,
    improvements,
    concerns,
  };
}

function analyzeKidneyDisease(
  nutrition: DiseaseFeedbackCardProps['mealNutrition'],
  mealName: string
): DiseaseFeedback {
  const improvements: string[] = [];
  const concerns: string[] = [];
  let status: 'positive' | 'warning' | 'neutral' = 'neutral';

  // 단백질 분석
  if (nutrition.protein > 30) {
    concerns.push(`단백질 함량이 높습니다 (${nutrition.protein.toFixed(1)}g). 신장 부담을 줄이기 위해 단백질 섭취를 제한하는 것이 좋습니다.`);
    status = 'warning';
  } else if (nutrition.protein < 20) {
    improvements.push(`단백질 함량이 적절합니다 (${nutrition.protein.toFixed(1)}g).`);
    status = 'positive';
  }

  // 나트륨 분석
  if (nutrition.sodium > 1000) {
    concerns.push(`나트륨 함량이 높습니다 (${nutrition.sodium.toFixed(0)}mg). 부종과 혈압 상승에 주의하세요.`);
    status = 'warning';
  } else if (nutrition.sodium < 500) {
    improvements.push(`나트륨 함량이 적절합니다 (${nutrition.sodium.toFixed(0)}mg).`);
  }

  // 칼륨 분석
  if (nutrition.potassium !== null && nutrition.potassium !== undefined) {
    if (nutrition.potassium > 500) {
      concerns.push(`칼륨 함량이 높습니다 (${nutrition.potassium.toFixed(0)}mg). 신장 기능에 따라 제한이 필요할 수 있습니다.`);
      status = 'warning';
    }
  }

  // 인 분석
  if (nutrition.phosphorus !== null && nutrition.phosphorus !== undefined) {
    if (nutrition.phosphorus > 300) {
      concerns.push(`인 함량이 높습니다 (${nutrition.phosphorus.toFixed(0)}mg). 신장 질환에서는 인 섭취 제한이 필요합니다.`);
      status = 'warning';
    }
  }

  return {
    disease: 'kidney_disease',
    status: status === 'neutral' ? 'positive' : status,
    title: '신장질환 관리 관점에서의 식단 분석',
    description: `이 식단은 신장질환 관리에 ${status === 'positive' ? '도움이 됩니다' : status === 'warning' ? '주의가 필요합니다' : '일반적입니다'}.`,
    improvements,
    concerns,
  };
}

function analyzeCardiovascular(
  nutrition: DiseaseFeedbackCardProps['mealNutrition'],
  mealName: string
): DiseaseFeedback {
  const improvements: string[] = [];
  const concerns: string[] = [];
  let status: 'positive' | 'warning' | 'neutral' = 'neutral';

  // 나트륨 분석
  if (nutrition.sodium > 1000) {
    concerns.push(`나트륨 함량이 높습니다 (${nutrition.sodium.toFixed(0)}mg). 혈압 상승에 주의하세요.`);
    status = 'warning';
  } else if (nutrition.sodium < 500) {
    improvements.push(`나트륨 함량이 적절합니다 (${nutrition.sodium.toFixed(0)}mg).`);
    status = 'positive';
  }

  // 지방 분석
  const fatCalories = nutrition.fat * 9;
  const fatPercentage = (fatCalories / nutrition.calories) * 100;
  if (fatPercentage > 35) {
    concerns.push(`지방 함량이 높습니다 (${nutrition.fat.toFixed(1)}g, ${fatPercentage.toFixed(1)}%). 콜레스테롤 관리에 주의하세요.`);
    status = 'warning';
  } else if (fatPercentage < 25) {
    improvements.push(`지방 함량이 적절합니다 (${nutrition.fat.toFixed(1)}g).`);
  }

  return {
    disease: 'cardiovascular_disease',
    status: status === 'neutral' ? 'positive' : status,
    title: '심혈관질환 관리 관점에서의 식단 분석',
    description: `이 식단은 심혈관 건강에 ${status === 'positive' ? '도움이 됩니다' : status === 'warning' ? '주의가 필요합니다' : '일반적입니다'}.`,
    improvements,
    concerns,
  };
}

function analyzeGout(
  nutrition: DiseaseFeedbackCardProps['mealNutrition'],
  mealName: string
): DiseaseFeedback {
  const improvements: string[] = [];
  const concerns: string[] = [];
  let status: 'positive' | 'warning' | 'neutral' = 'neutral';

  // 단백질 분석 (퓨린 함량과 관련)
  if (nutrition.protein > 30) {
    concerns.push(`단백질 함량이 높습니다 (${nutrition.protein.toFixed(1)}g). 고퓨린 식품일 수 있어 통풍 악화에 주의하세요.`);
    status = 'warning';
  }

  return {
    disease: 'gout',
    status: status === 'neutral' ? 'positive' : status,
    title: '통풍 관리 관점에서의 식단 분석',
    description: `이 식단은 통풍 관리에 ${status === 'positive' ? '도움이 됩니다' : status === 'warning' ? '주의가 필요합니다' : '일반적입니다'}.`,
    improvements,
    concerns,
  };
}

function analyzeGastritis(
  nutrition: DiseaseFeedbackCardProps['mealNutrition'],
  mealName: string
): DiseaseFeedback {
  const improvements: string[] = [];
  const concerns: string[] = [];
  let status: 'positive' | 'warning' | 'neutral' = 'neutral';

  // 나트륨 분석 (짠 음식은 위염 악화)
  if (nutrition.sodium > 1000) {
    concerns.push(`나트륨 함량이 높습니다 (${nutrition.sodium.toFixed(0)}mg). 짠 음식은 위염을 악화시킬 수 있습니다.`);
    status = 'warning';
  }

  return {
    disease: 'gastritis',
    status: status === 'neutral' ? 'positive' : status,
    title: '위염 관리 관점에서의 식단 분석',
    description: `이 식단은 위염 관리에 ${status === 'positive' ? '도움이 됩니다' : status === 'warning' ? '주의가 필요합니다' : '일반적입니다'}.`,
    improvements,
    concerns,
  };
}

