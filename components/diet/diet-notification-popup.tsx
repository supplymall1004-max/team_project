/**
 * @file components/diet/diet-notification-popup.tsx
 * @description 일일 식단 알림 팝업 컴포넌트
 *
 * 사용자가 사이트에 접속했을 때 오늘의 추천 식단을 모달로 표시
 */

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Bell, Calendar, ChefHat, Eye, EyeOff } from "lucide-react";
import { DailyDietView } from "./daily-diet-view";
import type { FamilyDietPlan, DailyDietPlan } from "@/types/recipe";

interface DietNotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDiet: () => void;
  dietData?: {
    date: string;
    plans: Record<string, any>;
  };
  loading?: boolean;
}

// 식단 정보 추출 헬퍼 함수
const getMealInfo = (meal: any) => {
  if (!meal || typeof meal !== 'object') return { title: '준비된 식사', calories: '정보 없음' };

  const title = meal.recipe?.title || '준비된 식사';
  const calories = meal.nutrition?.calories ? `${meal.nutrition.calories}kcal` : '정보 없음';

  return { title, calories };
};

/**
 * 식단 알림 팝업 컴포넌트
 */
export function DietNotificationPopup({
  isOpen,
  onClose,
  onViewDiet,
  dietData,
  loading = false,
}: DietNotificationPopupProps) {
  const [dontShowToday, setDontShowToday] = useState(false);

  // 팝업이 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setDontShowToday(false);
    }
  }, [isOpen]);

  // 오늘 닫기 처리
  const handleDismissToday = async () => {
    try {
      const response = await fetch("/api/diet/notifications/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        console.log("✅ 오늘 알림 닫기 성공");
        onClose();
      } else {
        console.error("❌ 오늘 알림 닫기 실패");
      }
    } catch (error) {
      console.error("❌ 오늘 알림 닫기 오류:", error);
    }
  };

  // FamilyDietPlan 형식으로 변환
  const familyDietPlan: FamilyDietPlan | null = dietData ? {
    date: dietData.date,
    individualPlans: Object.fromEntries(
      Object.entries(dietData.plans).filter(([key]) => key !== 'unified')
    ),
    unifiedPlan: dietData.plans.unified || null,
  } : null;

  // 표시할 식단 결정 (통합 식단 우선, 없으면 첫 번째 개인 식단)
  const displayDiet: DailyDietPlan | null = familyDietPlan?.unifiedPlan ||
    (familyDietPlan && Object.values(familyDietPlan.individualPlans).find(plan => plan !== null)) ||
    null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            오늘의 추천 식단이 준비되었습니다! 🍽️
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 날짜 표시 */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {dietData ? new Date(dietData.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              }) : '오늘'}
            </span>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-600">식단을 불러오는 중...</span>
            </div>
          )}

          {/* 식단 내용 */}
          {!loading && displayDiet && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">오늘의 식단</span>
                    {familyDietPlan?.unifiedPlan && (
                      <Badge variant="outline" className="text-xs">
                        가족 통합 식단
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={onViewDiet}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    자세히 보기
                  </Button>
                </div>

                {/* 간단한 식단 요약 */}
                <div className="space-y-3">
                  {displayDiet.breakfast && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-900">아침</span>
                        <span className="text-sm text-blue-700 truncate max-w-[200px]">
                          {getMealInfo(displayDiet.breakfast).title}
                        </span>
                      </div>
                        <span className="text-sm text-blue-600">
                          {getMealInfo(displayDiet.breakfast).calories}
                        </span>
                    </div>
                  )}

                  {displayDiet.lunch && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-green-900">점심</span>
                        <span className="text-sm text-green-700 truncate max-w-[200px]">
                          {getMealInfo(displayDiet.lunch).title}
                        </span>
                      </div>
                      <span className="text-sm text-green-600">
                        {getMealInfo(displayDiet.lunch).calories}
                      </span>
                    </div>
                  )}

                  {displayDiet.dinner && (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-purple-900">저녁</span>
                        <span className="text-sm text-purple-700 truncate max-w-[200px]">
                          {getMealInfo(displayDiet.dinner).title}
                        </span>
                      </div>
                      <span className="text-sm text-purple-600">
                        {getMealInfo(displayDiet.dinner).calories}
                      </span>
                    </div>
                  )}

                  {displayDiet.snack && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-yellow-900">간식</span>
                        <span className="text-sm text-yellow-700 truncate max-w-[200px]">
                          {getMealInfo(displayDiet.snack).title}
                        </span>
                      </div>
                      <span className="text-sm text-yellow-600">
                        {getMealInfo(displayDiet.snack).calories}
                      </span>
                    </div>
                  )}
                </div>

                {/* 총 칼로리 표시 */}
                {displayDiet.totalNutrition && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        총 {displayDiet.totalNutrition.calories}kcal
                      </p>
                      <p className="text-sm text-gray-600">
                        탄수화물 {displayDiet.totalNutrition.carbs}g •
                        단백질 {displayDiet.totalNutrition.protein}g •
                        지방 {displayDiet.totalNutrition.fat}g
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 식단이 없는 경우 */}
          {!loading && !displayDiet && (
            <Card>
              <CardContent className="p-8 text-center">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  식단을 불러올 수 없습니다
                </h3>
                <p className="text-gray-600">
                  잠시 후 다시 시도해주세요.
                </p>
              </CardContent>
            </Card>
          )}

          {/* 액션 버튼들 */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dont-show-today"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="dont-show-today" className="text-sm text-gray-600">
                오늘 하루 보지 않기
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={dontShowToday ? handleDismissToday : onClose}
                variant="outline"
                size="sm"
              >
                <EyeOff className="h-4 w-4 mr-1" />
                {dontShowToday ? "확인" : "나중에 보기"}
              </Button>
              <Button
                onClick={onViewDiet}
                className="bg-orange-500 hover:bg-orange-600"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                식단 보기
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
