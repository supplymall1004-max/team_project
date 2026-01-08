/**
 * @file components/family/family-diet-view.tsx
 * @description 가족 식단 메인 뷰 컴포넌트
 *
 * 이 컴포넌트는 가족 식단의 메인 인터페이스를 제공합니다:
 * - 식단 데이터 조회 및 표시
 * - 개인별/통합 식단 전환
 * - 식단 생성 트리거
 *
 * @dependencies
 * - FamilyDietTabs 컴포넌트 (개인별/통합 탭 전환)
 * - 가족 식단 API 연동
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { FamilyDietTabs } from "@/components/diet/family-diet-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RefreshCw, Calendar, Users, Settings2 } from "lucide-react";
import { PremiumGuardButton } from "@/components/premium/premium-guard-button";
import type { FamilyDietPlan } from "@/types/recipe";
import type { FamilyMember } from "@/types/family";

interface FamilyDietViewProps {
  targetDate: string;
  userName: string;
  familyMembers: FamilyMember[];
}

interface DietResponse {
  date: string;
  plans: Record<string, any>;
}

export function FamilyDietView({
  targetDate,
  userName,
  familyMembers,
}: FamilyDietViewProps) {
  const [dietData, setDietData] = useState<DietResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberStates, setMemberStates] = useState<FamilyMember[]>(Array.isArray(familyMembers) ? familyMembers : []);
  const [useVariation, setUseVariation] = useState(false); // 변형 모드
  const [variationLevel, setVariationLevel] = useState<1 | 2 | 3>(2); // 변형 레벨

  useEffect(() => {
    setMemberStates(Array.isArray(familyMembers) ? familyMembers : []);
  }, [familyMembers]);

  const includedCount = useMemo(
    () => memberStates.filter((m) => m.include_in_unified_diet !== false).length,
    [memberStates],
  );

  // 식단 데이터 조회
  const fetchDietData = useCallback(async () => {
    console.group("📋 가족 식단 데이터 조회");
    console.log("대상 날짜:", targetDate);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/family/diet/${targetDate}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DietResponse = await response.json();
      console.log("조회된 식단 데이터:", data);
      setDietData(data);

    } catch (err) {
      console.error("❌ 식단 조회 실패:", err);
      setError(err instanceof Error ? err.message : "식단을 불러올 수 없습니다");
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, [targetDate]);

  const handleMemberIncludeSync = (memberId: string, include: boolean) => {
    setMemberStates((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, include_in_unified_diet: include } : member,
      ),
    );
  };

  // 식단 생성
  const generateDiet = async () => {
    console.group("🍽️ 가족 식단 생성");
    console.log("대상 날짜:", targetDate);

    try {
      setGenerating(true);
      setError(null);

      const response = await fetch("/api/family/diet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate,
          includeUnified: true,
          useVariation, // 변형 모드
          variationLevel, // 변형 레벨
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("생성된 식단:", result);

      // 생성 후 데이터 다시 조회
      await fetchDietData();

    } catch (err) {
      console.error("❌ 식단 생성 실패:", err);
      setError(err instanceof Error ? err.message : "식단 생성에 실패했습니다");
    } finally {
      setGenerating(false);
      console.groupEnd();
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchDietData();
  }, [fetchDietData]);

  // API 응답을 DailyDietPlan 형식으로 변환하는 헬퍼 함수
  const convertApiMealToDailyDietPlan = (apiMeal: any): import("@/types/recipe").MealComposition | import("@/types/recipe").RecipeDetailForDiet | null => {
    if (!apiMeal) return null;
    
    // 배열인 경우 첫 번째 항목 사용 (또는 MealComposition으로 변환)
    if (Array.isArray(apiMeal)) {
      if (apiMeal.length === 0) return null;
      
      // 여러 항목이 있으면 MealComposition으로 변환
      if (apiMeal.length > 1) {
        const rice = apiMeal.find((m: any) => m.title?.includes("밥"));
        const sides = apiMeal.filter((m: any) => !m.title?.includes("밥") && !m.title?.includes("국") && !m.title?.includes("찌개"));
        const soup = apiMeal.find((m: any) => m.title?.includes("국") || m.title?.includes("찌개"));
        
        const totalNutrition = apiMeal.reduce((acc: any, meal: any) => ({
          calories: acc.calories + (meal.nutrition?.calories || 0),
          protein: acc.protein + (meal.nutrition?.protein || 0),
          carbs: acc.carbs + (meal.nutrition?.carbs || 0),
          fat: acc.fat + (meal.nutrition?.fat || 0),
          sodium: acc.sodium + (meal.nutrition?.sodium || 0),
          fiber: acc.fiber + (meal.nutrition?.fiber || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 });
        
        return {
          rice: rice ? {
            id: rice.recipe_id || undefined,
            title: rice.title,
            description: rice.description || "",
            source: "database",
            ingredients: Array.isArray(rice.ingredients) ? rice.ingredients : [],
            instructions: rice.instructions || "",
            nutrition: rice.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
          } : undefined,
          sides: sides.map((side: any) => ({
            id: side.recipe_id || undefined,
            title: side.title,
            description: side.description || "",
            source: "database",
            ingredients: Array.isArray(side.ingredients) ? side.ingredients : [],
            instructions: side.instructions || "",
            nutrition: side.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
          })),
          soup: soup ? {
            id: soup.recipe_id || undefined,
            title: soup.title,
            description: soup.description || "",
            source: "database",
            ingredients: Array.isArray(soup.ingredients) ? soup.ingredients : [],
            instructions: soup.instructions || "",
            nutrition: soup.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
          } : undefined,
          totalNutrition,
        };
      }
      
      // 단일 항목인 경우 RecipeDetailForDiet로 변환
      const meal = apiMeal[0];
      return {
        id: meal.recipe_id || undefined,
        title: meal.title,
        description: meal.description || "",
        source: "database",
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
        instructions: meal.instructions || "",
        nutrition: meal.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
      };
    }
    
    // 이미 객체인 경우 그대로 반환 (nutrition이 있는지 확인)
    if (apiMeal.nutrition) {
      return apiMeal;
    }
    
    // nutrition이 없는 경우 기본값 추가
    return {
      ...apiMeal,
      nutrition: apiMeal.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
    };
  };

  // snack 전용 변환 함수 (RecipeDetailForDiet만 반환)
  const convertApiSnackToRecipeDetail = (apiSnack: any): import("@/types/recipe").RecipeDetailForDiet | undefined => {
    if (!apiSnack) return undefined;
    
    // 배열인 경우 첫 번째 항목만 사용
    if (Array.isArray(apiSnack)) {
      if (apiSnack.length === 0) return undefined;
      const snack = apiSnack[0];
      return {
        id: snack.recipe_id || undefined,
        title: snack.title,
        description: snack.description || "",
        source: "database",
        ingredients: Array.isArray(snack.ingredients) ? snack.ingredients : [],
        instructions: snack.instructions || "",
        nutrition: snack.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
      };
    }
    
    // 이미 객체인 경우 그대로 반환 (nutrition이 있는지 확인)
    if (apiSnack.nutrition) {
      return apiSnack;
    }
    
    // nutrition이 없는 경우 기본값 추가
    return {
      ...apiSnack,
      nutrition: apiSnack.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
    };
  };

  // API 응답을 DailyDietPlan 형식으로 변환
  const convertApiPlanToDailyDietPlan = (apiPlan: any, date: string): import("@/types/recipe").DailyDietPlan | null => {
    if (!apiPlan || typeof apiPlan !== 'object') return null;
    
    // 영양소 합산
    const calculateTotalNutrition = () => {
      const meals = [apiPlan.breakfast, apiPlan.lunch, apiPlan.dinner, apiPlan.snack].filter(Boolean);
      const allMeals = meals.flatMap((meal: any) => Array.isArray(meal) ? meal : [meal]);
      
      return allMeals.reduce((acc: any, meal: any) => {
        const nutrition = meal.nutrition || {};
        return {
          calories: acc.calories + (nutrition.calories || 0),
          protein: acc.protein + (nutrition.protein || 0),
          carbs: acc.carbs + (nutrition.carbs || 0),
          fat: acc.fat + (nutrition.fat || 0),
          sodium: acc.sodium + (nutrition.sodium || 0),
          fiber: acc.fiber + (nutrition.fiber || 0),
        };
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 });
    };
    
    return {
      date,
      breakfast: convertApiMealToDailyDietPlan(apiPlan.breakfast) || undefined,
      lunch: convertApiMealToDailyDietPlan(apiPlan.lunch) || undefined,
      dinner: convertApiMealToDailyDietPlan(apiPlan.dinner) || undefined,
      snack: convertApiSnackToRecipeDetail(apiPlan.snack),
      totalNutrition: calculateTotalNutrition(),
    };
  };

  // FamilyDietPlan 형식으로 변환
  const familyDietPlan: FamilyDietPlan = dietData && dietData.plans && typeof dietData.plans === 'object' ? {
    date: dietData.date || targetDate,
    individualPlans: Object.fromEntries(
      Object.entries(dietData.plans || {})
        .filter(([key]) => key !== 'unified')
        .map(([memberId, plan]: [string, any]) => [
          memberId,
          convertApiPlanToDailyDietPlan(plan, dietData.date || targetDate) || {
            date: dietData.date || targetDate,
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null,
            totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fiber: 0 },
          }
        ])
    ) as { [memberId: string]: import("@/types/recipe").DailyDietPlan },
    unifiedPlan: dietData.plans?.unified 
      ? convertApiPlanToDailyDietPlan(dietData.plans.unified, dietData.date || targetDate)
      : null,
  } : {
    date: targetDate,
    individualPlans: {},
    unifiedPlan: null,
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">식단을 불러오는 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <RefreshCw className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              식단을 불러올 수 없습니다
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDietData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 식단이 없는 경우
  const hasDietData = dietData && dietData.plans && Object.keys(dietData.plans).length > 0;

  if (!hasDietData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            식단이 없습니다
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              아직 식단이 생성되지 않았습니다
            </h3>
            <p className="text-gray-600 mb-6">
              가족 구성원 모두를 고려한 맞춤 식단을 생성해보세요.
            </p>
            <PremiumGuardButton
              featureId="family_diet"
              onClick={generateDiet}
              disabled={generating}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  🍽️ 식단 생성하기
                </>
              )}
            </PremiumGuardButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 변형 모드 설정 */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-5 w-5 text-blue-600" />
                <Label className="text-base font-semibold text-gray-900">
                  변형 모드
                </Label>
              </div>
              <p className="text-sm text-gray-600">
                같은 메인 재료로 구성원별 맞춤 변형 식단을 생성합니다.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="variation-mode"
                  checked={useVariation}
                  onChange={(e) => setUseVariation(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <Label htmlFor="variation-mode" className="text-sm font-medium cursor-pointer">
                  변형 모드 사용
                </Label>
              </div>
              {useVariation && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">레벨:</Label>
                  <select
                    value={variationLevel}
                    onChange={(e) => setVariationLevel(Number(e.target.value) as 1 | 2 | 3)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={1}>Level 1 (기본)</option>
                    <option value={2}>Level 2 (중급)</option>
                    <option value={3}>Level 3 (고급)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
        <PremiumGuardButton
          featureId="family_diet"
          onClick={generateDiet}
          disabled={generating}
          variant="outline"
          size="sm"
        >
          {generating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              식단 재생성
            </>
          )}
        </PremiumGuardButton>
      </div>

      {/* 식단 탭 인터페이스 */}
      <FamilyDietTabs
        familyDiet={familyDietPlan}
        familyMembers={memberStates}
        userName={userName}
        onRegenerate={generateDiet}
        regenerating={generating}
        onMemberIncludeChange={handleMemberIncludeSync}
        includedCount={includedCount}
      />
    </div>
  );
}
