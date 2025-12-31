/**
 * @file components/health/diet/diet-comparison.tsx
 * @description 건강 식단 vs 실제 식단 비교 UI
 *
 * 추천된 건강 식단과 사용자가 실제로 먹은 식단을 비교하여 시각화합니다.
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { NutritionInfo } from "@/types/health";
import { getActualDietRecordsByDate } from "@/lib/storage/actual-diet-storage";
import { getDietPlan } from "@/lib/storage/diet-storage";
import { useUser } from "@clerk/nextjs";

interface DietComparisonProps {
  date: string; // 'YYYY-MM-DD'
}

interface ComparisonData {
  recommended: NutritionInfo;
  actual: NutritionInfo;
  differences: Array<{
    nutrient: keyof NutritionInfo;
    name: string;
    recommended: number;
    actual: number;
    difference: number;
    percentage: number;
    status: "good" | "warning" | "excess";
  }>;
}

export function DietComparison({ date }: DietComparisonProps) {
  const { user } = useUser();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadComparison = async () => {
      try {
        // 추천 식단 조회 (로컬 스토리지)
        const recommendedPlan = await getDietPlan(user.id, date);

        // 실제 섭취 식단 조회 (로컬 스토리지)
        const actualRecords = await getActualDietRecordsByDate(user.id, date);

        if (!recommendedPlan || actualRecords.length === 0) {
          setLoading(false);
          return;
        }

        // 실제 섭취 영양소 집계
        const actualNutrition: NutritionInfo = actualRecords.reduce(
          (acc, record) => ({
            calories: (acc.calories || 0) + (record.nutrition.calories || 0),
            protein: (acc.protein || 0) + (record.nutrition.protein || 0),
            carbohydrates: (acc.carbohydrates || 0) + (record.nutrition.carbohydrates || 0),
            fat: (acc.fat || 0) + (record.nutrition.fat || 0),
            sodium: (acc.sodium || 0) + (record.nutrition.sodium || 0),
          }),
          {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            sodium: 0,
          }
        );

        // 추천 영양소
        const recommendedNutrition: NutritionInfo =
          recommendedPlan.totalNutrition || {
            calories: 0,
            protein: 0,
            carbohydrates: 0,
            fat: 0,
            sodium: 0,
          };

        // 차이 계산
        const nutrients: Array<{
          key: keyof NutritionInfo;
          name: string;
        }> = [
          { key: "calories", name: "칼로리" },
          { key: "protein", name: "단백질" },
          { key: "carbohydrates", name: "탄수화물" },
          { key: "fat", name: "지방" },
          { key: "sodium", name: "나트륨" },
        ];

        const differences = nutrients
          .filter((n) => recommendedNutrition[n.key] > 0)
          .map(({ key, name }) => {
            const recommended = recommendedNutrition[key] || 0;
            const actual = actualNutrition[key] || 0;
            const difference = actual - recommended;
            const percentage = recommended > 0 ? (actual / recommended) * 100 : 0;

            let status: "good" | "warning" | "excess";
            if (percentage >= 90 && percentage <= 110) {
              status = "good";
            } else if (percentage < 70 || percentage > 130) {
              status = "excess";
            } else {
              status = "warning";
            }

            return {
              nutrient: key,
              name,
              recommended,
              actual,
              difference,
              percentage: Math.round(percentage),
              status,
            };
          });

        setComparison({
          recommended: recommendedNutrition,
          actual: actualNutrition,
          differences,
        });
      } catch (error) {
        console.error("[DietComparison] 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [user, date]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            비교할 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: "good" | "warning" | "excess") => {
    switch (status) {
      case "good":
        return <Minus className="h-4 w-4 text-green-500" />;
      case "warning":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "excess":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: "good" | "warning" | "excess") => {
    switch (status) {
      case "good":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "excess":
        return "bg-red-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>건강 식단 vs 실제 식단 비교</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {comparison.differences.map((diff) => (
          <div key={diff.nutrient} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{diff.name}</span>
                {getStatusIcon(diff.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  실제: {Math.round(diff.actual)}
                </span>
                <span className="text-sm text-gray-400">/</span>
                <span className="text-sm text-gray-600">
                  목표: {Math.round(diff.recommended)}
                </span>
                <Badge
                  variant={
                    diff.status === "good"
                      ? "default"
                      : diff.status === "warning"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {diff.percentage}%
                </Badge>
              </div>
            </div>
            <Progress
              value={Math.min(diff.percentage, 150)}
              className="h-2"
            />
            {diff.difference !== 0 && (
              <p className="text-xs text-gray-500">
                {diff.difference > 0 ? "+" : ""}
                {Math.round(diff.difference)}{" "}
                {diff.difference > 0 ? "초과" : "부족"}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

