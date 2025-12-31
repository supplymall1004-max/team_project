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
import type { FamilyDietPlan, DailyDietPlan, RecipeNutrition } from "@/types/recipe";

interface DietNotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDiet: () => void;
  onDismissToday?: () => void;
  dontShowTodayChecked?: boolean;
  dietData?: {
    date?: string;
    plans?: Record<string, any>;
    shouldShow?: boolean;
    today?: string;
    dietsCount?: number;
    [key: string]: any; // 추가 속성 허용
  } | null;
  loading?: boolean;
}

// 식단 정보 추출 헬퍼 함수
const getMealInfo = (meal: any) => {
  if (!meal || typeof meal !== 'object') return { title: '준비된 식사', calories: '정보 없음' };

  // DailyDietPlan의 DietPlan 형식 (recipe와 calories가 직접 속성)
  const title = meal.recipe?.title || meal.title || '준비된 식사';
  const calories = meal.calories ? `${meal.calories}kcal` : (meal.nutrition?.calories ? `${meal.nutrition.calories}kcal` : '정보 없음');

  return { title, calories };
};

/**
 * 식단 알림 팝업 컴포넌트
 */
export function DietNotificationPopup({
  isOpen,
  onClose,
  onViewDiet,
  onDismissToday,
  dontShowTodayChecked = false,
  dietData,
  loading = false,
}: DietNotificationPopupProps) {

  // API 응답 형식을 DailyDietPlan으로 변환하는 헬퍼 함수
  const convertApiPlanToDailyDietPlan = (apiPlan: any, date: string): DailyDietPlan | null => {
    if (!apiPlan || typeof apiPlan !== 'object') return null;
    
    try {
      const totalNutrition: RecipeNutrition = {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        sodium: 0,
      };

      const breakfast = apiPlan.breakfast?.[0] ? {
        id: apiPlan.breakfast[0].recipe_id || 'breakfast',
        title: apiPlan.breakfast[0].title || '아침 식사',
        ingredients: [],
        nutrition: {
          calories: apiPlan.breakfast[0].nutrition?.calories || 0,
          carbs: apiPlan.breakfast[0].nutrition?.carbs || 0,
          protein: apiPlan.breakfast[0].nutrition?.protein || 0,
          fat: apiPlan.breakfast[0].nutrition?.fat || 0,
          sodium: apiPlan.breakfast[0].nutrition?.sodium || 0,
        },
        image: apiPlan.breakfast[0].image || null,
      } : null;

      const lunch = apiPlan.lunch?.[0] ? {
        id: apiPlan.lunch[0].recipe_id || 'lunch',
        title: apiPlan.lunch[0].title || '점심 식사',
        ingredients: [],
        nutrition: {
          calories: apiPlan.lunch[0].nutrition?.calories || 0,
          carbs: apiPlan.lunch[0].nutrition?.carbs || 0,
          protein: apiPlan.lunch[0].nutrition?.protein || 0,
          fat: apiPlan.lunch[0].nutrition?.fat || 0,
          sodium: apiPlan.lunch[0].nutrition?.sodium || 0,
        },
        image: apiPlan.lunch[0].image || null,
      } : null;

      const dinner = apiPlan.dinner?.[0] ? {
        id: apiPlan.dinner[0].recipe_id || 'dinner',
        title: apiPlan.dinner[0].title || '저녁 식사',
        ingredients: [],
        nutrition: {
          calories: apiPlan.dinner[0].nutrition?.calories || 0,
          carbs: apiPlan.dinner[0].nutrition?.carbs || 0,
          protein: apiPlan.dinner[0].nutrition?.protein || 0,
          fat: apiPlan.dinner[0].nutrition?.fat || 0,
          sodium: apiPlan.dinner[0].nutrition?.sodium || 0,
        },
        image: apiPlan.dinner[0].image || null,
      } : null;

      const snack = apiPlan.snack?.[0] ? {
        id: apiPlan.snack[0].recipe_id || 'snack',
        title: apiPlan.snack[0].title || '간식',
        ingredients: [],
        nutrition: {
          calories: apiPlan.snack[0].nutrition?.calories || 0,
          carbs: apiPlan.snack[0].nutrition?.carbs || 0,
          protein: apiPlan.snack[0].nutrition?.protein || 0,
          fat: apiPlan.snack[0].nutrition?.fat || 0,
          sodium: apiPlan.snack[0].nutrition?.sodium || 0,
        },
        image: apiPlan.snack[0].image || null,
      } : null;

      // 영양소 합산
      [breakfast, lunch, dinner, snack].forEach(meal => {
        if (meal) {
          totalNutrition.calories += meal.nutrition.calories || 0;
          totalNutrition.carbs += meal.nutrition.carbs || 0;
          totalNutrition.protein += meal.nutrition.protein || 0;
          totalNutrition.fat += meal.nutrition.fat || 0;
          totalNutrition.sodium += meal.nutrition.sodium || 0;
        }
      });

      return {
        date,
        breakfast,
        lunch,
        dinner,
        snack,
        totalNutrition,
      };
    } catch (error) {
      console.error("❌ [DietNotificationPopup] API 형식 변환 실패:", error);
      return null;
    }
  };

  // 표시할 식단 결정 (통합 식단 우선, 없으면 개인 식단)
  const displayDiet: DailyDietPlan | null = (() => {
    if (!dietData || !dietData.plans) return null;
    
    const date = dietData.date || dietData.today || new Date().toISOString().split("T")[0];
    
    // 통합 식단 우선
    if (dietData.plans.unified) {
      const unified = convertApiPlanToDailyDietPlan(dietData.plans.unified, date);
      if (unified) return unified;
    }
    
    // 개인 식단 (user)
    if (dietData.plans.user) {
      const user = convertApiPlanToDailyDietPlan(dietData.plans.user, date);
      if (user) return user;
    }
    
    // 다른 가족 구성원 식단
    const otherPlans = Object.entries(dietData.plans)
      .filter(([key]) => key !== 'unified' && key !== 'user')
      .map(([, plan]) => convertApiPlanToDailyDietPlan(plan, date))
      .find(plan => plan !== null);
    
    return otherPlans || null;
  })();

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
              {dietData?.date || dietData?.today
                ? new Date(dietData.date || dietData.today || new Date().toISOString().split("T")[0]).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })
                : '오늘'}
            </span>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-600">식단을 불러오는 중...</span>
            </div>
          )}

          {/* 식단 내용 - plans가 없으면 간단한 메시지 표시 */}
          {!loading && !displayDiet && dietData && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    오늘의 식단이 준비되었습니다!
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {dietData.dietsCount ? `${dietData.dietsCount}개의 식단이 준비되었습니다.` : '식단을 확인해보세요.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 식단 내용 */}
          {!loading && displayDiet && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">오늘의 식단</span>
                    {dietData?.plans?.unified && (
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
                        탄수화물 {(displayDiet.totalNutrition.carbs || 0).toFixed(1)}g •
                        단백질 {(displayDiet.totalNutrition.protein || 0).toFixed(1)}g •
                        지방 {(displayDiet.totalNutrition.fat || 0).toFixed(1)}g
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
                checked={dontShowTodayChecked}
                onChange={(e) => onDismissToday?.()}
                className="rounded border-gray-300"
              />
              <label htmlFor="dont-show-today" className="text-sm text-gray-600">
                오늘 하루 보지 않기
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                <EyeOff className="h-4 w-4 mr-1" />
                {dontShowTodayChecked ? "확인" : "나중에 보기"}
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
