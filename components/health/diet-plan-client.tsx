/**
 * @file diet-plan-client.tsx
 * @description 식단 추천 클라이언트 컴포넌트
 *
 * 주요 기능:
 * 1. 건강 정보 확인
 * 2. 식단 추천 생성/조회
 * 3. 식단 카드 표시
 * 4. 식자재 구매 기능
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ShoppingCart, AlertCircle, Heart, AlertTriangle } from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";
import { NutritionInfo, DietPlan, DailyDietPlan } from "@/types/health";
import { FamilyDietPlan, MealComposition, RecipeDetailForDiet } from "@/types/recipe";
import { DietCard } from "./diet-card";
import { SafetyWarning } from "@/components/diet/safety-warning";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FamilyDietTabs } from "@/components/diet/family-diet-tabs";
import type { FamilyMember } from "@/types/family";
import { PremiumGuardButton } from "@/components/premium/premium-guard-button";
import type { UserHealthProfile } from "@/types/health";
import {
  clearDietPlanCache,
  getCachedDietPlan,
  setCachedDietPlan,
} from "@/lib/cache/diet-plan-cache";
import { checkHealthProfile } from "@/actions/health/check";
import { getHealthProfile } from "@/actions/health/profile";

export function DietPlanClient() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<DailyDietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasHealthProfile, setHasHealthProfile] = useState(false);
  const [healthProfileError, setHealthProfileError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userHealthProfile, setUserHealthProfile] = useState<UserHealthProfile | null>(null);
  const [includeFavorites, setIncludeFavorites] = useState(false); // 찜한 식단 포함 여부
  const [calorieWarning, setCalorieWarning] = useState<{
    isValid: boolean;
    severity: "critical" | "warning" | "info" | "none";
    message: string;
    recommendedCalories: number;
    currentCalories: number;
    minRequiredCalories: number;
    details: string[];
  } | null>(null);

  // 가족 구성원 관련 상태
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyDietData, setFamilyDietData] = useState<any>(null);
  const [isFamilyMode, setIsFamilyMode] = useState(false);

  // 날짜를 동적으로 계산하는 함수
  const getToday = () => new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const [today, setToday] = useState<string>(getToday());

  // 가족 구성원 및 식단 데이터 병렬 로드
  const loadFamilyData = useCallback(async (targetDate?: string) => {
    if (!user) return;

    const dateToUse = targetDate || today;
    console.log("[DietPlanClient] 가족 데이터 병렬 로드 시작");

    try {
      const token = await getToken();
      const [membersResponse, dietResponse] = await Promise.all([
        fetch("/api/family/members", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => ({ ok: false, json: () => Promise.resolve({ members: [] }) })),
        fetch(`/api/family/diet/${dateToUse}`, {
          credentials: 'include',
        }).catch(() => ({ ok: false, status: 404, json: () => Promise.resolve(null) }))
      ]);

      // 가족 구성원 처리
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        console.log("[DietPlanClient] 가족 구성원 API 응답:", membersData);
        setFamilyMembers(membersData.members || []);
        console.log(`[DietPlanClient] ${membersData.members?.length || 0}명의 가족 구성원 로드됨`);
      } else {
        console.warn("[DietPlanClient] 가족 구성원 로드 실패, 빈 배열로 설정");
        setFamilyMembers([]);
      }

      // 가족 식단 처리
      if (dietResponse.ok) {
        const dietData = await dietResponse.json();
        console.log("[DietPlanClient] 가족 식단 API 응답:", dietData);
        setFamilyDietData(dietData);
        console.log("[DietPlanClient] 가족 식단 데이터 로드됨");
      } else if (dietResponse.status === 404) {
        console.log("[DietPlanClient] 가족 식단 데이터 없음 (404)");
        setFamilyDietData(null);
      } else {
        console.warn("[DietPlanClient] 가족 식단 데이터 로드 실패, null로 설정");
        setFamilyDietData(null);
      }

      console.log("[DietPlanClient] 가족 데이터 병렬 로드 완료");
    } catch (err) {
      console.error("[DietPlanClient] 가족 데이터 로드 에러:", err);
      setFamilyMembers([]);
      setFamilyDietData(null);
    }
  }, [user, today, getToken]);

  const loadDietPlan = useCallback(async (options: { forceRefresh?: boolean; targetDate?: string } = {}) => {
    if (!user) {
      setIsLoading(false);
      setDietPlan(null);
      return;
    }

    const dateToUse = options.targetDate || today;
    setError(null);

    const shouldUseCache = !options.forceRefresh;
    if (shouldUseCache) {
      const cached = getCachedDietPlan(user.id, dateToUse);
      if (cached) {
        console.groupCollapsed("[DietPlanClient] 캐시 적중");
        console.log("userId", user.id);
        console.log("date", dateToUse);
        console.log("AI 생성 여부:", cached.isAiGenerated);
        console.log("생성 날짜:", cached.creationDate);
        console.log("만료 시간:", new Date(cached.expiresAt).toLocaleString());
        console.groupEnd();
        setDietPlan(cached.dietPlan);
        setHasHealthProfile(true);
        setHealthProfileError(null);
        setIsLoading(false);
        return;
      }
      console.log("[DietPlanClient] 캐시 미적중, API 호출 진행");
    }

    setIsLoading(true);

    try {
      console.groupCollapsed("[DietPlanClient] 식단 로드");
      console.log("userId", user.id);
      console.log("date", dateToUse);

      // 병렬로 건강 정보 확인 및 프로필 로드
      console.log("🔍 건강 정보 확인 중...");
      console.log("사용자 ID:", user.id);
      const [healthCheck, profile] = await Promise.all([
        checkHealthProfile(),
        getHealthProfile().catch(() => null),
      ]);

      console.log("📋 건강 정보 확인 결과:", healthCheck);

      if (!healthCheck.hasProfile) {
        console.warn("⚠️ 건강 정보가 없습니다");
        setHasHealthProfile(false);
        setIsLoading(false);
        clearDietPlanCache(user.id, dateToUse);
        console.groupEnd();
        return;
      }

      if (!healthCheck.hasValidCalorieGoal) {
        console.warn("⚠️ 일일 칼로리 목표가 설정되지 않았습니다");
        setHasHealthProfile(false);
        setHealthProfileError("일일 칼로리 목표가 설정되지 않았습니다. 건강 정보를 업데이트해주세요.");
        setIsLoading(false);
        clearDietPlanCache(user.id, dateToUse);
        console.groupEnd();
        return;
      }

      console.log("✅ 건강 정보 확인됨");
      setHasHealthProfile(true);

      // 프로필 정보 로드 결과 처리
      if (profile) {
        console.log("✅ 건강 프로필 정보 로드 성공");
        setUserHealthProfile(profile);
      }

      // 식단 조회 또는 생성
      console.log("🍽️ 식단 조회/생성 중...");
      const res = await fetch(`/api/diet/plan?date=${dateToUse}`);
      console.log("📡 식단 API 응답 상태:", res.status);

      let data;
      try {
        data = await res.json();
        console.log("📋 식단 API 응답 데이터:", data);
      } catch (jsonError) {
        console.error("❌ 식단 API 응답 파싱 실패:", jsonError);
        console.error("📡 응답 텍스트 (디버깅용):", await res.text());
        throw new Error("식단을 불러오는데 실패했습니다");
      }

      if (!res.ok) {
        // 404는 식단이 없는 것으로 정상적인 상황 (사용자가 생성 버튼을 눌러야 함)
        if (res.status === 404) {
          console.log("[DietPlanClient] 해당 날짜의 식단이 없습니다 (404)");
          clearDietPlanCache(user.id, dateToUse);
          setDietPlan(null);
          setIsLoading(false);
          console.groupEnd();
          return;
        }
        
        const errorMessage = data.error || "식단을 불러오는데 실패했습니다";
        const errorDetails = data.details ? ` (${data.details})` : "";
        clearDietPlanCache(user.id, dateToUse);
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      setDietPlan(data.dietPlan);
      // 칼로리 경고 정보 설정
      if (data.calorieWarning) {
        setCalorieWarning(data.calorieWarning);
        console.log("⚠️ 칼로리 경고:", data.calorieWarning);
      } else if (data.dietPlan?.calorieValidation) {
        setCalorieWarning(data.dietPlan.calorieValidation);
        console.log("⚠️ 칼로리 검증 결과:", data.dietPlan.calorieValidation);
      } else {
        setCalorieWarning(null);
      }
      // API에서 로드한 식단은 AI 생성으로 간주 (크론 작업이나 수동 생성)
      setCachedDietPlan(user.id, dateToUse, data.dietPlan, undefined, true);
      console.log("diet plan loaded", data.dietPlan);
      console.groupEnd();
    } catch (err) {
      console.error("load error", err);
      setError(err instanceof Error ? err.message : "식단을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [user, today]);

  // 날짜 변경 감지 및 자동 새로고침 (건강 맞춤 식단 캐시 유지)
  useEffect(() => {
    // 매 분마다 현재 날짜를 확인하여 날짜가 바뀌었는지 체크
    const checkDateChange = () => {
      const currentDate = getToday();
      if (currentDate !== today) {
        console.group("[DietPlanClient] 날짜 변경 감지");
        console.log("이전 날짜:", today);
        console.log("새 날짜:", currentDate);
        console.log("건강 맞춤 식단 캐시 유지 - 수동 생성 식단만 무효화");
        console.groupEnd();

        // 건강 맞춤 식단은 캐시 유지, 수동 생성 식단만 무효화
        if (user) {
          // 수동 생성 식단의 경우에만 이전 날짜 캐시 무효화
          // 건강 맞춤 식단은 getCachedDietPlan에서 자동으로 처리됨
          console.log("[DietPlanClient] 수동 생성 식단 캐시 무효화:", today);
        }

        // 새 날짜로 업데이트
        setToday(currentDate);

        // 새 식단 로드 (캐시 우선 확인)
        if (user && isLoaded) {
          loadDietPlan({ targetDate: currentDate }); // forceRefresh 제거하여 캐시 우선 사용
          loadFamilyData(currentDate);
        }
      }
    };

    // 초기 체크
    checkDateChange();

    // 매 분마다 날짜 변경 체크 (60초 = 60000ms)
    const intervalId = setInterval(checkDateChange, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user, isLoaded, today, loadDietPlan, loadFamilyData]);

  // 사용자 로드 및 날짜 변경 시 식단 로드
  useEffect(() => {
    if (isLoaded) {
      loadDietPlan();
      loadFamilyData();
    }
  }, [user, isLoaded, today, loadDietPlan, loadFamilyData]);

  const handleRefresh = () => {
    loadDietPlan({ forceRefresh: true });
    loadFamilyData();
  };

  const handleGenerateDiet = async () => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);

    try {
      const currentDate = getToday();
      console.groupCollapsed("[DietPlanClient] 건강 맞춤 식단 생성");
      console.log("사용자:", user.id);
      console.log("날짜:", currentDate);

      // 식단 생성 요청
      console.log("📡 식단 생성 API 호출:", `/api/diet/plan?date=${currentDate}&force=true`);
      console.log("⭐ 찜한 식단 포함:", includeFavorites);
      const res = await fetch(`/api/diet/plan?date=${currentDate}&force=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          includeFavorites,
        }),
      });

      console.log("📡 API 응답 상태:", res.status, res.statusText);
      const data = await res.json();
      console.log("📡 API 응답 데이터:", data);

      if (!res.ok) {
        const errorMessage = data.error || "식단을 생성하는데 실패했습니다";
        const errorDetails = data.details ? ` (${data.details})` : "";
        console.error("❌ 식단 생성 실패:", errorMessage, errorDetails);
        console.error("❌ API 응답 상태:", res.status);
        console.error("❌ 전체 응답 데이터:", data);
        
        // 건강 정보가 없는 경우 특별 처리
        if (res.status === 404 && errorMessage.includes("건강 정보")) {
          setError(`${errorMessage}${errorDetails}`);
          setHasHealthProfile(false);
          setIsGenerating(false);
          return;
        }
        
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      setDietPlan(data.dietPlan);
      // 칼로리 경고 정보 설정
      if (data.calorieWarning) {
        setCalorieWarning(data.calorieWarning);
        console.log("⚠️ 칼로리 경고:", data.calorieWarning);
      } else if (data.dietPlan?.calorieValidation) {
        setCalorieWarning(data.dietPlan.calorieValidation);
        console.log("⚠️ 칼로리 검증 결과:", data.dietPlan.calorieValidation);
      } else {
        setCalorieWarning(null);
      }
      if (user) {
        const currentDate = getToday();
        // 건강 맞춤 식단 생성 시 isAiGenerated 플래그 설정
        setCachedDietPlan(user.id, currentDate, data.dietPlan, undefined, true);
        // 날짜가 바뀌었을 수 있으므로 상태 업데이트
        if (currentDate !== today) {
          setToday(currentDate);
        }
      }
      console.log("✅ 건강 맞춤 식단 생성 성공:", data.dietPlan);
      console.groupEnd();
    } catch (err) {
      console.error("❌ 건강 맞춤 식단 생성 실패:", err);
      setError(err instanceof Error ? err.message : "식단을 생성하는데 실패했습니다");
      console.groupEnd();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBuyIngredients = () => {
    if (!dietPlan) return;

    // 추천 식단의 재료 목록 추출
    const ingredients: string[] = [];
    [dietPlan.breakfast, dietPlan.lunch, dietPlan.dinner, dietPlan.snack].forEach(
      (meal) => {
        if (meal) {
          // DietPlan 타입인 경우 (types/health)
          if ('recipe' in meal && meal.recipe) {
            ingredients.push(meal.recipe.title);
          } else if ('compositionSummary' in meal && meal.compositionSummary) {
            // compositionSummary가 있는 경우 사용
            const summaryItems = meal.compositionSummary.map(item =>
              typeof item === "string" ? item : item.title
            );
            ingredients.push(...summaryItems);
          }
        }
      }
    );

    console.groupCollapsed("[DietPlanClient] 식자재 구매");
    console.log("ingredients", ingredients);

    // 식자재 마켓플레이스 링크 생성 (예: 네이버 쇼핑)
    const searchQuery = ingredients.join(" ");
    const marketplaceUrl = `https://shopping.naver.com/search/all?query=${encodeURIComponent(
      searchQuery
    )}`;

    // 새 창에서 열기
    window.open(marketplaceUrl, "_blank");
    console.log("marketplaceUrl", marketplaceUrl);
    console.groupEnd();
  };

  if (!isLoaded) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          로그인 후 맞춤 식단을 확인하세요
        </p>
        <Button onClick={() => router.push("/sign-in")}>로그인하기</Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">식단을 불러오는 중...</div>;
  }

  if (!hasHealthProfile) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        {healthProfileError ? (
          <>
            <p className="text-red-600 mb-4">{healthProfileError}</p>
            <p className="text-muted-foreground mb-4">
              건강 정보를 확인하고 일일 칼로리 목표를 설정해주세요
            </p>
          </>
        ) : (
          <p className="text-muted-foreground mb-4">
            건강 정보를 입력하면 맞춤 식단을 추천해드립니다
          </p>
        )}
        <Button asChild>
          <Link href="/health/profile">건강 정보 입력하기</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <Button onClick={handleRefresh}>다시 시도</Button>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <div className="mb-6">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">
            건강 맞춤 식단 큐레이션
          </h3>
          <p className="text-muted-foreground">
            당신의 건강 정보와 식이 취향을 분석하여<br />
            최적의 식단을 큐레이션해드립니다
          </p>
        </div>
        <div className="space-y-4">
          {/* 찜한 식단 포함 체크박스 */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeFavorites}
              onChange={(e) => setIncludeFavorites(e.target.checked)}
              disabled={isGenerating}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex items-center gap-2">
              <Heart className={`h-4 w-4 ${includeFavorites ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                찜한 식단 포함하기
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-500 text-left">
            체크 시 찜한 식단 중 건강 정보에 맞는 식단이 우선적으로 포함됩니다.
            <br />
            (알레르기 및 질병 필터를 통과한 식단만 포함됩니다)
          </p>
          
          <Button
            onClick={handleGenerateDiet}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                식단을 큐레이션하는 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                건강 맞춤 식단 큐레이션 생성하기
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // DietPlan | RecipeDetailForDiet | MealComposition을 DietPlan 형태로 변환하는 함수
  const convertToDietPlan = (
    meal: DietPlan | RecipeDetailForDiet | MealComposition | null | undefined,
    mealType: "breakfast" | "lunch" | "dinner" | "snack"
  ): DietPlan | null => {
    if (!meal) return null;

    // 이미 DietPlan 타입인 경우 (types/health)
    if ('user_id' in meal && 'plan_date' in meal && 'meal_type' in meal) {
      return meal as DietPlan;
    }

    // MealComposition 타입인 경우
    if ('rice' in meal && 'sides' in meal) {
      const mealComp = meal as MealComposition;
      // 간단하게 첫 번째 반찬이나 국을 대표로 사용
      const representativeRecipe = mealComp.rice || mealComp.sides[0] || mealComp.soup;
      if (!representativeRecipe) return null;

      return {
        id: `meal-${Date.now()}-${mealType}`,
        user_id: "ai-generated",
        plan_date: today,
        meal_type: mealType,
        recipe_id: representativeRecipe.id || null,
        calories: representativeRecipe.nutrition.calories || null,
        carbohydrates: representativeRecipe.nutrition.carbs || null,
        protein: representativeRecipe.nutrition.protein || null,
        fat: representativeRecipe.nutrition.fat || null,
        sodium: representativeRecipe.nutrition.sodium || null,
        created_at: new Date().toISOString(),
        compositionSummary: mealComp.compositionSummary,
        recipe: {
          id: representativeRecipe.id || `fallback-${mealType}`,
          title: representativeRecipe.title,
          thumbnail_url: representativeRecipe.image || null,
          slug: representativeRecipe.title.toLowerCase().replace(/\s+/g, '-')
        }
      };
    } else {
      // RecipeDetailForDiet 타입인 경우
      const recipeDetail = meal as RecipeDetailForDiet;
      return {
        id: `meal-${Date.now()}-${mealType}`,
        user_id: "ai-generated",
        plan_date: today,
        meal_type: mealType,
        recipe_id: recipeDetail.id || null,
        calories: recipeDetail.nutrition?.calories || null,
        carbohydrates: recipeDetail.nutrition?.carbs || null,
        protein: recipeDetail.nutrition?.protein || null,
        fat: recipeDetail.nutrition?.fat || null,
        sodium: recipeDetail.nutrition?.sodium || null,
        created_at: new Date().toISOString(),
        compositionSummary: recipeDetail.compositionSummary,
        recipe: {
          id: recipeDetail.id || `fallback-${mealType}`,
          title: recipeDetail.title || "",
          thumbnail_url: recipeDetail.image || null,
          slug: (recipeDetail.title || "").toLowerCase().replace(/\s+/g, '-')
        }
      };
    }
  };

  // 가족 식단 플랜 생성
  // 주의: FamilyDietPlan은 types/recipe의 DailyDietPlan을 기대하지만,
  // 현재 types/health의 DailyDietPlan을 사용하므로 타입 단언 필요
  const familyDietPlan: FamilyDietPlan | null = familyDietData ? {
    date: familyDietData.date || today,
    individualPlans: Object.fromEntries(
      Object.entries(familyDietData.plans || {}).filter(([key]) => key !== 'unified')
    ) as { [memberId: string]: import("@/types/recipe").DailyDietPlan },
    unifiedPlan: (familyDietData.plans?.unified as import("@/types/recipe").DailyDietPlan | null) || undefined,
  } : null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold text-foreground whitespace-nowrap">오늘의 추천 식단</h2>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* 주간 식단 버튼 */}
          <Link href="/diet/weekly">
            <Button variant="outline" size="sm" className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              주간 식단
            </Button>
          </Link>

          {/* 개인/가족 모드 토글 */}
          {familyMembers.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <Button
                variant={!isFamilyMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log("[DietPlanClient] 개인 식단 모드로 전환");
                  setIsFamilyMode(false);
                }}
              >
                개인 식단
              </Button>
              <PremiumGuardButton
                featureId="family_diet"
                variant={isFamilyMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log("[DietPlanClient] 가족 식단 모드로 전환", {
                    familyMembers: familyMembers.length,
                    familyDietData: !!familyDietData
                  });
                  setIsFamilyMode(true);
                }}
              >
                가족 식단 ({familyMembers.length + 1}명)
              </PremiumGuardButton>
            </div>
          )}

          {/* 디버깅 정보 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="ml-4 text-xs text-gray-500">
              가족 구성원: {familyMembers.length}명 |
              가족 데이터: {familyDietData ? '있음' : '없음'} |
              가족 모드: {isFamilyMode ? 'ON' : 'OFF'}
            </div>
          )}
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 식단 표시 */}
      {isFamilyMode && familyDietPlan ? (
        <>
          {console.log("[DietPlanClient] FamilyDietTabs 렌더링", {
            familyMembersCount: familyMembers.length,
            familyDietPlan: !!familyDietPlan
          })}
          <FamilyDietTabs
            familyDiet={familyDietPlan}
            familyMembers={familyMembers}
            userName={user?.firstName || user?.username || "사용자"}
            onRegenerate={handleGenerateDiet}
            regenerating={isGenerating}
            onMemberIncludeChange={(memberId, include) => {
              // 가족 구성원 포함 상태 변경 시 데이터 새로고침
              console.log(`[DietPlanClient] 가족 구성원 ${memberId} 포함 상태 변경: ${include}`);
              loadFamilyData();
            }}
          />
        </>
      ) : (
        /* 개인 식단 카드 그리드 */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DietCard mealType="breakfast" dietPlan={convertToDietPlan(dietPlan.breakfast, "breakfast")} date={today} />
          <DietCard mealType="lunch" dietPlan={convertToDietPlan(dietPlan.lunch, "lunch")} date={today} />
          <DietCard mealType="dinner" dietPlan={convertToDietPlan(dietPlan.dinner, "dinner")} date={today} />
          <DietCard mealType="snack" dietPlan={convertToDietPlan(dietPlan.snack, "snack")} date={today} />
        </div>
      )}

      {/* 칼로리 경고 메시지 (최우선 표시) */}
      {!isFamilyMode && calorieWarning && calorieWarning.severity !== "none" && (
        <Alert 
          variant={calorieWarning.severity === "critical" ? "destructive" : "default"}
          className="mb-6"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">
            {calorieWarning.severity === "critical" ? "🚨 치명적 경고" : 
             calorieWarning.severity === "warning" ? "⚠️ 주의" : "💡 안내"}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <div className="whitespace-pre-line text-sm">
              {calorieWarning.message}
            </div>
            {calorieWarning.details.length > 0 && (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="font-semibold">상세 정보:</div>
                {calorieWarning.details.map((detail, index) => (
                  <div key={index}>• {detail}</div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 알레르기 안전 안내 (알레르기가 있는 경우에만 표시) */}
      {!isFamilyMode && userHealthProfile && userHealthProfile.allergies && userHealthProfile.allergies.length > 0 && (
        <div className="space-y-4">
          <SafetyWarning />
          <div className="flex justify-center">
            <Link href="/health/emergency">
              <Button variant="destructive" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                응급 상황 시 대처 방법 (아나필락시스 등)
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 총 영양소 정보 (개인 모드에서만 표시) */}
      {!isFamilyMode && dietPlan.totalNutrition && (
        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">총 영양소 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">칼로리</p>
              <p className="text-xl font-bold">
                {Math.round(dietPlan.totalNutrition?.calories || 0)}kcal
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">탄수화물</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition?.carbohydrates?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">단백질</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition?.protein?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">지방</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition?.fat?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">나트륨</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition?.sodium?.toFixed(0) || 0}mg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 식자재 구매 버튼 */}
      <div className="flex justify-center">
        <Button size="lg" onClick={handleBuyIngredients}>
          <ShoppingCart className="h-5 w-5 mr-2" />
          식자재 한 번에 구매하기
        </Button>
      </div>
    </div>
  );
}

