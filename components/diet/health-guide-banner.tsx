/**
 * @file components/diet/health-guide-banner.tsx
 * @description 건강 상태별 안내 시스템 - 구성원별 건강 상태 안내 및 권장사항
 *
 * 주요 기능:
 * - 구성원별 건강 상태에 따른 안내 문구
 * - 영양소 부족 경고
 * - 맞춤 권장사항 표시
 *
 * @dependencies
 * - components/ui/alert: Alert 컴포넌트
 * - lucide-react: 아이콘
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info, TrendingUp } from "lucide-react";
import type { FamilyMember } from "@/types/family";
import type { DailyDietPlan } from "@/types/recipe";
import { calculateAge } from "@/lib/utils/age-calculator";

interface HealthGuideBannerProps {
  member: FamilyMember | { id: "user"; name: string; age?: number | null };
  dietPlan: DailyDietPlan;
  nutritionGap?: {
    protein?: number;
    calcium?: number;
    iron?: number;
    vitaminD?: number;
  };
}

/**
 * 건강 상태별 안내 배너
 */
export function HealthGuideBanner({
  member,
  dietPlan,
  nutritionGap,
}: HealthGuideBannerProps) {
  const age = "age" in member && member.age 
    ? member.age 
    : "birth_date" in member && member.birth_date
      ? calculateAge(member.birth_date).years
      : null;

  const isAdolescent = age !== null && age >= 13 && age < 18;
  const isChild = age !== null && age < 13;
  const hasDiseases = "diseases" in member && member.diseases && member.diseases.length > 0;
  const hasAllergies = "allergies" in member && member.allergies && member.allergies.length > 0;

  // 안내 메시지 생성
  const messages: Array<{
    type: "info" | "warning" | "success";
    icon: React.ReactNode;
    title: string;
    description: string;
  }> = [];

  // 청소년 특별 안내
  if (isAdolescent) {
    messages.push({
      type: "info",
      icon: <TrendingUp className="h-4 w-4" />,
      title: "성장기 청소년 맞춤 식단",
      description: "단백질과 칼슘이 풍부한 반찬이 추가되었습니다. 성장기 골격 발달과 근육 형성을 위해 충분한 영양소를 섭취하세요.",
    });

    if (nutritionGap) {
      if (nutritionGap.protein && nutritionGap.protein > 0) {
        messages.push({
          type: "warning",
          icon: <AlertCircle className="h-4 w-4" />,
          title: "단백질 보완 필요",
          description: `단백질이 ${Math.round(nutritionGap.protein)}g 부족합니다. 고등어구이, 닭가슴살, 두부 등 단백질이 풍부한 반찬을 추가로 섭취하세요.`,
        });
      }

      if (nutritionGap.calcium && nutritionGap.calcium > 0) {
        messages.push({
          type: "warning",
          icon: <AlertCircle className="h-4 w-4" />,
          title: "칼슘 보완 필요",
          description: `칼슘이 ${Math.round(nutritionGap.calcium)}mg 부족합니다. 브로콜리, 우유, 치즈 등 칼슘이 풍부한 음식을 섭취하세요.`,
        });
      }
    }
  }

  // 어린이 안내
  if (isChild) {
    messages.push({
      type: "info",
      icon: <Info className="h-4 w-4" />,
      title: "어린이 맞춤 식단",
      description: "성장기 어린이를 위해 부드럽고 영양이 풍부한 반찬이 선택되었습니다.",
    });
  }

  // 질병별 안내
  if (hasDiseases && "diseases" in member) {
    const diseaseNames = member.diseases.map(d => {
      // 질병 코드를 한글명으로 변환 (간단한 매핑)
      const diseaseMap: Record<string, string> = {
        diabetes: "당뇨",
        hypertension: "고혈압",
        kidney_disease: "신장질환",
        heart_disease: "심장질환",
      };
      return diseaseMap[d] || d;
    }).join(", ");

    messages.push({
      type: "warning",
      icon: <AlertCircle className="h-4 w-4" />,
      title: "질병 고려 식단",
      description: `${diseaseNames}을 고려하여 저당/저나트륨 반찬이 선택되었습니다.`,
    });
  }

  // 알레르기 안내
  if (hasAllergies && "allergies" in member) {
    messages.push({
      type: "success",
      icon: <CheckCircle className="h-4 w-4" />,
      title: "알레르기 안전 식단",
      description: "알레르기 유발 식품이 제외된 안전한 식단입니다.",
    });
  }

  // 영양소 충족 안내
  if (messages.length === 0 || (!nutritionGap || Object.values(nutritionGap).every(v => !v || v <= 0))) {
    messages.push({
      type: "success",
      icon: <CheckCircle className="h-4 w-4" />,
      title: "영양소 요구사항 충족",
      description: "모든 구성원의 영양소 요구사항을 충족하는 식단입니다.",
    });
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {messages.map((message, index) => (
        <Alert
          key={index}
          variant={
            message.type === "warning"
              ? "destructive"
              : message.type === "success"
                ? "default"
                : "default"
          }
          className={
            message.type === "warning"
              ? "border-orange-200 bg-orange-50"
              : message.type === "success"
                ? "border-green-200 bg-green-50"
                : "border-blue-200 bg-blue-50"
          }
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {message.type === "warning" ? (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              ) : message.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Info className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                {message.title}
                {isAdolescent && (
                  <Badge variant="outline" className="text-xs">
                    청소년
                  </Badge>
                )}
                {isChild && (
                  <Badge variant="outline" className="text-xs">
                    어린이
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription className="mt-1">
                {message.description}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}

