/**
 * @file components/family/family-diet-comparison.tsx
 * @description 가족 구성원별 식단 비교 뷰 컴포넌트
 *
 * 주요 기능:
 * - 가족 구성원별 식단 나란히 비교
 * - 영양소 차이 시각화 (차트/바)
 * - 변형 이유 설명 표시
 *
 * @dependencies
 * - components/ui/card: 카드 컴포넌트
 * - components/ui/badge: 배지 컴포넌트
 * - lucide-react: 아이콘
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { FamilyDietPlan } from "@/types/recipe";
import type { FamilyMember } from "@/types/family";

interface FamilyDietComparisonProps {
  familyDiet: FamilyDietPlan;
  familyMembers: FamilyMember[];
  userName: string;
}

/**
 * 가족 식단 비교 뷰
 */
export function FamilyDietComparison({
  familyDiet,
  familyMembers,
  userName,
}: FamilyDietComparisonProps) {
  // 구성원별 영양소 계산
  const nutritionData = useMemo(() => {
    const data: Array<{
      memberId: string;
      memberName: string;
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        sodium: number;
      };
    }> = [];

    // 사용자 본인
    if (familyDiet.individualPlans["user"]) {
      const plan = familyDiet.individualPlans["user"];
      data.push({
        memberId: "user",
        memberName: userName,
        nutrition: plan.totalNutrition,
      });
    }

    // 가족 구성원
    for (const member of familyMembers) {
      const plan = familyDiet.individualPlans[member.id];
      if (plan) {
        data.push({
          memberId: member.id,
          memberName: member.name,
          nutrition: plan.totalNutrition,
        });
      }
    }

    return data;
  }, [familyDiet, familyMembers, userName]);

  // 평균 영양소 계산
  const averageNutrition = useMemo(() => {
    if (nutritionData.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sodium: 0,
      };
    }

    const sum = nutritionData.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutrition.calories,
        protein: acc.protein + item.nutrition.protein,
        carbs: acc.carbs + item.nutrition.carbs,
        fat: acc.fat + item.nutrition.fat,
        sodium: acc.sodium + item.nutrition.sodium,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0 }
    );

    const count = nutritionData.length;
    return {
      calories: Math.round(sum.calories / count),
      protein: Math.round(sum.protein / count),
      carbs: Math.round(sum.carbs / count),
      fat: Math.round(sum.fat / count),
      sodium: Math.round(sum.sodium / count),
    };
  }, [nutritionData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-orange-500" />
        <h2 className="text-2xl font-bold">가족 식단 비교</h2>
      </div>

      {/* 구성원별 식단 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nutritionData.map((member) => (
          <MemberDietCard
            key={member.memberId}
            memberName={member.memberName}
            nutrition={member.nutrition}
            averageNutrition={averageNutrition}
          />
        ))}
      </div>

      {/* 영양소 차이 요약 */}
      <NutritionDifferenceSummary
        nutritionData={nutritionData}
        averageNutrition={averageNutrition}
      />
    </div>
  );
}

/**
 * 구성원별 식단 카드
 */
function MemberDietCard({
  memberName,
  nutrition,
  averageNutrition,
}: {
  memberName: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
  averageNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
}) {
  const getDifference = (value: number, average: number) => {
    const diff = value - average;
    const percent = average > 0 ? (diff / average) * 100 : 0;
    return { diff, percent };
  };

  const caloriesDiff = getDifference(nutrition.calories, averageNutrition.calories);
  const proteinDiff = getDifference(nutrition.protein, averageNutrition.protein);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{memberName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 칼로리 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">칼로리</span>
            <div className="flex items-center gap-1">
              {caloriesDiff.diff > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : caloriesDiff.diff < 0 ? (
                <TrendingDown className="h-4 w-4 text-blue-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  caloriesDiff.diff > 0
                    ? "text-red-500"
                    : caloriesDiff.diff < 0
                      ? "text-blue-500"
                      : "text-gray-500"
                }`}
              >
                {caloriesDiff.diff > 0 ? "+" : ""}
                {Math.round(caloriesDiff.diff)}kcal
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold">{nutrition.calories}kcal</div>
        </div>

        {/* 영양소 요약 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">단백질</span>
            <div className="font-semibold">{Math.round(nutrition.protein)}g</div>
          </div>
          <div>
            <span className="text-gray-600">탄수화물</span>
            <div className="font-semibold">{Math.round(nutrition.carbs)}g</div>
          </div>
          <div>
            <span className="text-gray-600">지방</span>
            <div className="font-semibold">{Math.round(nutrition.fat)}g</div>
          </div>
          <div>
            <span className="text-gray-600">나트륨</span>
            <div className="font-semibold">{Math.round(nutrition.sodium)}mg</div>
          </div>
        </div>

        {/* 변형 이유 배지 (임시) */}
        {proteinDiff.diff > 5 && (
          <Badge variant="outline" className="text-xs">
            단백질 강화
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 영양소 차이 요약
 */
function NutritionDifferenceSummary({
  nutritionData,
  averageNutrition,
}: {
  nutritionData: Array<{
    memberId: string;
    memberName: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      sodium: number;
    };
  }>;
  averageNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sodium: number;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">영양소 차이 요약</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nutritionData.map((member) => {
            const caloriesDiff = member.nutrition.calories - averageNutrition.calories;
            const proteinDiff = member.nutrition.protein - averageNutrition.protein;

            return (
              <div key={member.memberId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{member.memberName}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    칼로리:{" "}
                    <span className={caloriesDiff > 0 ? "text-red-500" : "text-blue-500"}>
                      {caloriesDiff > 0 ? "+" : ""}
                      {Math.round(caloriesDiff)}kcal
                    </span>
                  </span>
                  <span>
                    단백질:{" "}
                    <span className={proteinDiff > 0 ? "text-red-500" : "text-blue-500"}>
                      {proteinDiff > 0 ? "+" : ""}
                      {Math.round(proteinDiff)}g
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

