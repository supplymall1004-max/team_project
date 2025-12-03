/**
 * @file components/diet/weekly-nutrition-chart.tsx
 * @description 주간 영양 밸런스 차트 컴포넌트
 * 
 * 7일간의 영양소 섭취량을 시각화
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NutritionStat {
  day_of_week: number;
  date: string;
  total_calories: number;
  total_carbohydrates: number;
  total_protein: number;
  total_fat: number;
  total_sodium: number;
  meal_count: number;
}

interface WeeklyNutritionChartProps {
  stats: NutritionStat[];
  goalCalories?: number;
  className?: string;
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function WeeklyNutritionChart({
  stats,
  goalCalories = 2000,
  className,
}: WeeklyNutritionChartProps) {
  // 통계 계산
  const weeklyAverage = calculateWeeklyAverage(stats);
  const maxCalories = Math.max(...stats.map((s) => s.total_calories), goalCalories);

  return (
    <div className={cn("space-y-4", className)}>
      {/* 주간 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 칼로리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(weeklyAverage.calories)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                kcal
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {weeklyAverage.calories > goalCalories ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">
                    목표 +{Math.round(weeklyAverage.calories - goalCalories)}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">
                    목표 -{Math.round(goalCalories - weeklyAverage.calories)}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 탄수화물
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(weeklyAverage.carbs)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                g
              </span>
            </div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {Math.round((weeklyAverage.carbs * 4) / weeklyAverage.calories * 100)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 단백질
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(weeklyAverage.protein)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                g
              </span>
            </div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {Math.round((weeklyAverage.protein * 4) / weeklyAverage.calories * 100)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              평균 지방
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(weeklyAverage.fat)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                g
              </span>
            </div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {Math.round((weeklyAverage.fat * 9) / weeklyAverage.calories * 100)}%
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* 일별 칼로리 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>일별 칼로리 섭취량</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.map((stat) => {
              const percentage = (stat.total_calories / maxCalories) * 100;
              const isOverGoal = stat.total_calories > goalCalories;
              const dayLabel = WEEKDAYS[stat.day_of_week - 1];

              return (
                <div key={stat.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium w-8">{dayLabel}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(stat.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        isOverGoal ? "text-red-500" : "text-green-600"
                      )}>
                        {Math.round(stat.total_calories)}kcal
                      </span>
                      {stat.meal_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {stat.meal_count}끼
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                    {/* 목표 칼로리 표시선 */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10"
                      style={{ left: `${(goalCalories / maxCalories) * 100}%` }}
                    />

                    {/* 실제 칼로리 바 */}
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        isOverGoal
                          ? "bg-gradient-to-r from-red-400 to-red-500"
                          : "bg-gradient-to-r from-green-400 to-green-500"
                      )}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />

                    {/* 텍스트 오버레이 */}
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                      <span className="drop-shadow-md">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">목표 이하</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-0.5 h-4 bg-orange-400" />
              <span className="text-muted-foreground">목표 ({goalCalories}kcal)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">목표 초과</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 영양소 비율 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>평균 영양소 비율</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <NutrientBar
              label="탄수화물"
              value={weeklyAverage.carbs}
              calories={weeklyAverage.carbs * 4}
              totalCalories={weeklyAverage.calories}
              color="bg-blue-500"
              unit="g"
            />
            <NutrientBar
              label="단백질"
              value={weeklyAverage.protein}
              calories={weeklyAverage.protein * 4}
              totalCalories={weeklyAverage.calories}
              color="bg-green-500"
              unit="g"
            />
            <NutrientBar
              label="지방"
              value={weeklyAverage.fat}
              calories={weeklyAverage.fat * 9}
              totalCalories={weeklyAverage.calories}
              color="bg-orange-500"
              unit="g"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 영양소 바 컴포넌트
 */
function NutrientBar({
  label,
  value,
  calories,
  totalCalories,
  color,
  unit,
}: {
  label: string;
  value: number;
  calories: number;
  totalCalories: number;
  color: string;
  unit: string;
}) {
  const percentage = (calories / totalCalories) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {Math.round(value)}{unit} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * 주간 평균 계산
 */
function calculateWeeklyAverage(stats: NutritionStat[]) {
  if (stats.length === 0) {
    return { calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 };
  }

  const total = stats.reduce(
    (acc, stat) => ({
      calories: acc.calories + stat.total_calories,
      carbs: acc.carbs + stat.total_carbohydrates,
      protein: acc.protein + stat.total_protein,
      fat: acc.fat + stat.total_fat,
      sodium: acc.sodium + stat.total_sodium,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 }
  );

  return {
    calories: total.calories / stats.length,
    carbs: total.carbs / stats.length,
    protein: total.protein / stats.length,
    fat: total.fat / stats.length,
    sodium: total.sodium / stats.length,
  };
}

/**
 * 날짜 포맷팅
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}
























