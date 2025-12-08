/**
 * 주간 식단 달력 컴포넌트
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { DailyDietView } from "./daily-diet-view";
import { cn } from "@/lib/utils";

export interface WeeklyDietCalendarProps {
  weekYear: number;
  weekNumber: number;
  dailyPlans: any[];
  weekStartDate?: string | Date;
  onWeekChange: (direction: 'prev' | 'next') => void;
  onShowShoppingList: () => void;
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function WeeklyDietCalendar({
  weekYear,
  weekNumber,
  dailyPlans,
  weekStartDate,
  onWeekChange,
  onShowShoppingList,
}: WeeklyDietCalendarProps) {
  // 일별 식단 그룹화
  const plansByDate = dailyPlans.reduce((acc, plan) => {
    const date = plan.plan_date;
    if (!acc[date]) {
      acc[date] = {
        date,
        breakfast: null,
        lunch: null,
        dinner: null,
        snack: null,
        totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
      };
    }
    
    // 식사 타입별로 그룹화
    const mealType = plan.meal_type?.toLowerCase();
    if (mealType === 'breakfast' && !acc[date].breakfast) {
      acc[date].breakfast = plan;
    } else if (mealType === 'lunch' && !acc[date].lunch) {
      acc[date].lunch = plan;
    } else if (mealType === 'dinner' && !acc[date].dinner) {
      acc[date].dinner = plan;
    } else if (mealType === 'snack' && !acc[date].snack) {
      acc[date].snack = plan;
    }
    
    // 영양 정보 누적
    acc[date].totalNutrition.calories += plan.calories || 0;
    acc[date].totalNutrition.protein += plan.protein || 0;
    acc[date].totalNutrition.carbs += plan.carbohydrates || 0;
    acc[date].totalNutrition.fat += plan.fat || 0;
    acc[date].totalNutrition.sodium += plan.sodium || 0;
    
    return acc;
  }, {} as Record<string, any>);

  // 주간 시작 날짜 계산
  const startDate = weekStartDate 
    ? new Date(weekStartDate) 
    : new Date();
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {weekYear}년 {weekNumber}주차 주간 식단
          </h3>
          {weekStartDate && (
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 font-medium">
              {new Date(weekStartDate).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} ~ {weekDates[6].toLocaleDateString('ko-KR', { 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWeekChange('prev')}
            className="gap-2 font-semibold"
          >
            <ChevronLeft className="h-4 w-4" />
            이전 주
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWeekChange('next')}
            className="gap-2 font-semibold"
          >
            다음 주
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShowShoppingList}
            className="gap-2 font-semibold"
          >
            <ShoppingCart className="h-4 w-4" />
            장보기 리스트
          </Button>
        </div>
      </div>

      {/* 일별 식단 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayPlan = plansByDate[dateStr];
          const dayOfWeek = WEEKDAYS[index];
          const hasPlan = dayPlan && (
            dayPlan.breakfast || dayPlan.lunch || dayPlan.dinner || dayPlan.snack
          );

          return (
            <Card key={dateStr} className={cn(
              "h-full flex flex-col",
              !hasPlan && "opacity-50"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {dayOfWeek}
                  </CardTitle>
                  <Badge variant={hasPlan ? "default" : "secondary"} className="text-sm font-semibold px-2 py-1">
                    {date.getDate()}일
                  </Badge>
                </div>
                {dayPlan?.totalNutrition && (
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
                    {Math.round(dayPlan.totalNutrition.calories)}kcal
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {hasPlan ? (
                  <div className="space-y-3">
                    {dayPlan.breakfast && (
                      <div className="text-sm">
                        <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">아침</div>
                        <div className="text-gray-700 dark:text-gray-300 font-medium">{dayPlan.breakfast.recipe_title || '식단 없음'}</div>
                      </div>
                    )}
                    {dayPlan.lunch && (
                      <div className="text-sm">
                        <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">점심</div>
                        <div className="text-gray-700 dark:text-gray-300 font-medium">{dayPlan.lunch.recipe_title || '식단 없음'}</div>
                      </div>
                    )}
                    {dayPlan.dinner && (
                      <div className="text-sm">
                        <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">저녁</div>
                        <div className="text-gray-700 dark:text-gray-300 font-medium">{dayPlan.dinner.recipe_title || '식단 없음'}</div>
                      </div>
                    )}
                    {dayPlan.snack && (
                      <div className="text-sm">
                        <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">간식</div>
                        <div className="text-gray-700 dark:text-gray-300 font-medium">{dayPlan.snack.recipe_title || '식단 없음'}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-500 dark:text-gray-400 text-center py-4 font-medium">
                    식단 없음
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 총 식단 수 표시 */}
      <div className="text-base text-gray-700 dark:text-gray-300 text-center font-semibold">
        총 {dailyPlans.length}개의 식단이 계획되어 있습니다.
      </div>
    </div>
  );
}