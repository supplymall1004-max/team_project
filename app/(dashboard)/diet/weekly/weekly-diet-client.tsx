/**
 * @file app/(dashboard)/diet/weekly/weekly-diet-client.tsx
 * @description 주간 식단 클라이언트 컴포넌트
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WeeklyDietCalendar } from "@/components/diet/weekly-diet-calendar";
import { WeeklyNutritionChart } from "@/components/diet/weekly-nutrition-chart";
import { WeeklyShoppingList } from "@/components/diet/weekly-shopping-list";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { weeklyDietCache } from "@/lib/diet/weekly-diet-cache";
import { useUser } from "@clerk/nextjs";
import type {
  ShoppingListItem,
  WeeklyDietPlan,
  WeeklyNutritionStats,
} from "@/types/weekly-diet";
import type { MealType } from "@/types/recipe";

interface RecipePreview {
  id?: string;
  title?: string | null;
  thumbnail_url?: string | null;
  slug?: string | null;
}

interface DietPlanEntry {
  id?: string;
  plan_date: string;
  meal_type: MealType | string;
  recipe_id?: string | null;
  recipe_title: string;
  recipe_description?: string | null;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  sodium: number;
  recipe_thumbnail_url?: string | null;
  recipe?: RecipePreview | null;
  composition_summary?: Record<string, string[]> | null;
}

interface WeeklyDietState {
  metadata: WeeklyDietPlan;
  dailyPlans: DietPlanEntry[];
  shoppingList: ShoppingListItem[];
  nutritionStats: WeeklyNutritionStats[];
  weekStartDate?: string; // 주간 시작 날짜 추가
}

type WeeklyDietApiResponse =
  | ({
      exists: true;
    } & WeeklyDietState & {
      weekStartDate?: string; // API 응답에 포함된 weekStartDate
    })
  | {
      exists: false;
      message?: string;
      weekStartDate?: string;
      weekYear?: number;
      weekNumber?: number;
    };

export function WeeklyDietClient() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyDiet, setWeeklyDiet] = useState<WeeklyDietState | null>(null);
  const [weekType, setWeekType] = useState<"this" | "next">("this");
  const [showShoppingList, setShowShoppingList] = useState(false);

  const loadWeeklyDiet = useCallback(async (type: "this" | "next") => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      console.group("📅 주간 식단 조회");
      console.log("주차 타입:", type);
      console.log("사용자 ID:", user.id);

      // 1. 캐시 확인
      const cachedData = weeklyDietCache.getCachedWeeklyDiet(user.id, type);
      if (cachedData) {
        console.log("✅ 캐시된 데이터 사용");
        console.log("📊 캐시된 주간 식단 데이터:", {
          metadata: cachedData.metadata,
          dailyPlansCount: cachedData.dailyPlans?.length || 0,
          shoppingListCount: cachedData.shoppingList?.length || 0,
          nutritionStatsCount: cachedData.nutritionStats?.length || 0,
          cachedAt: cachedData.cachedAt,
        });

        setWeeklyDiet({
          metadata: cachedData.metadata,
          dailyPlans: cachedData.dailyPlans || [],
          shoppingList: cachedData.shoppingList || [],
          nutritionStats: cachedData.nutritionStats || [],
          weekStartDate: cachedData.weekStartDate,
        });
        console.groupEnd();
        return;
      }

      console.log("⚠️ 캐시 없음 - API 호출");

      // 2. 캐시가 없으면 API 호출
      const response = await fetch(`/api/diet/weekly/${type}`);

      console.log("응답 상태:", response.status, response.statusText);

      // 응답이 OK가 아니면 에러 처리
      if (!response.ok) {
        // 404는 주간 식단이 없는 정상 케이스
        if (response.status === 404) {
          console.log("⚠️ 주간 식단 없음 (정상 케이스)");
          console.groupEnd();
          setWeeklyDiet(null);
          return;
        }
        // 그 외의 에러는 에러 메시지 표시
        const errorText = await response.text();
        console.error("❌ 주간 식단 조회 실패:", response.status, errorText);
        console.groupEnd();
        setError(`주간 식단을 불러오는 데 실패했습니다 (${response.status})`);
        setWeeklyDiet(null);
        return;
      }

      const data: WeeklyDietApiResponse = await response.json();
      console.log("✅ API 응답 데이터:", data);

      if (data.exists) {
        console.log("📊 주간 식단 데이터:", {
          metadata: data.metadata,
          dailyPlansCount: data.dailyPlans?.length || 0,
          shoppingListCount: data.shoppingList?.length || 0,
          nutritionStatsCount: data.nutritionStats?.length || 0,
        });

        const weeklyDietData = {
          metadata: data.metadata,
          dailyPlans: data.dailyPlans || [],
          shoppingList: data.shoppingList || [],
          nutritionStats: data.nutritionStats || [],
          weekStartDate: data.weekStartDate,
        };

        // 캐시에 저장
        weeklyDietCache.setCachedWeeklyDiet(user.id, type, {
          metadata: data.metadata,
          dailyPlans: data.dailyPlans || [],
          shoppingList: data.shoppingList || [],
          nutritionStats: data.nutritionStats || [],
          weekStartDate: data.weekStartDate || "",
        });

        setWeeklyDiet(weeklyDietData);
      } else {
        console.log("⚠️ 주간 식단 없음");
        setWeeklyDiet(null);
      }

      console.groupEnd();
    } catch (err: any) {
      console.error("❌ 주간 식단 조회 실패:", err);
      console.error("에러 상세:", {
        message: err.message,
        stack: err.stack,
      });
      console.groupEnd();
      setError(err.message || "주간 식단을 불러오는 데 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 초기 로드 - 캐시 우선 확인
  useEffect(() => {
    if (user?.id) {
      loadWeeklyDiet(weekType);
    }
  }, [weekType, user?.id, loadWeeklyDiet]);

  const generateWeeklyDiet = async () => {
    if (generating) return;

    setGenerating(true);
    setError(null);

    try {
      console.group("🍱 주간 식단 생성 요청");
      console.log("주차:", weekType);

      const response = await fetch("/api/diet/weekly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekType }),
      });

      // 응답이 OK가 아니면 에러 처리
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 주간 식단 생성 실패:", response.status, errorText);
        console.groupEnd();
        throw new Error(`서버 오류: ${response.status} - 잠시 후 다시 시도해주세요`);
      }

      const data = await response.json();

      console.log("✅ 생성 완료:", data);
      console.groupEnd();

      // 캐시 무효화 (새로운 식단이 생성되었으므로)
      if (user?.id) {
        weeklyDietCache.clearCache(user.id, weekType);
        console.log("🗑️ 캐시 무효화:", weekType);
      }

      // 성공 후 다시 로드 (새로 생성된 데이터를 캐시에 저장)
      await loadWeeklyDiet(weekType);
    } catch (err: any) {
      console.error("❌ 주간 식단 생성 실패:", err);
      console.groupEnd();
      setError(err.message || "주간 식단을 생성하는 데 실패했습니다");
    } finally {
      setGenerating(false);
    }
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    if (direction === "next") {
      setWeekType(weekType === "this" ? "next" : "this");
    } else {
      setWeekType(weekType === "next" ? "this" : "next");
    }
  };

  const handleTogglePurchase = async (itemId: string, purchased: boolean) => {
    // TODO: API 호출하여 구매 상태 업데이트
    console.log(`재료 ${itemId} 구매 상태:`, purchased);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!weeklyDiet) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">
              {weekType === "this" ? "이번 주" : "다음 주"} 식단이 아직 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              7일간의 식단과 장보기 리스트를 자동으로 생성해보세요
            </p>
            <Button
              onClick={generateWeeklyDiet}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  식단 생성 중...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  주간 식단 생성
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={generateWeeklyDiet}
            disabled={generating}
            variant="outline"
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                식단 재생성
              </>
            )}
          </Button>
        </div>

        {/* 탭 */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">캘린더</TabsTrigger>
            <TabsTrigger value="shopping">장보기</TabsTrigger>
            <TabsTrigger value="nutrition">영양 통계</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <WeeklyDietCalendar
              weekYear={weeklyDiet?.metadata?.week_year ?? 0}
              weekNumber={weeklyDiet?.metadata?.week_number ?? 0}
              dailyPlans={weeklyDiet?.dailyPlans ?? []}
              weekStartDate={weeklyDiet?.weekStartDate}
              onWeekChange={handleWeekChange}
              onShowShoppingList={() => setShowShoppingList(true)}
            />
          </TabsContent>

          <TabsContent value="shopping">
            <WeeklyShoppingList
              items={
                weeklyDiet?.shoppingList?.map((item, index) => ({
                  ...item,
                  id: item.id || `temp-${index}-${item.ingredient_name}`,
                })) ?? []
              }
              onTogglePurchase={handleTogglePurchase}
            />
          </TabsContent>

          <TabsContent value="nutrition">
            <WeeklyNutritionChart stats={weeklyDiet?.nutritionStats ?? []} />
          </TabsContent>
        </Tabs>
      </div>

      {/* 장보기 리스트 다이얼로그 */}
      <Dialog open={showShoppingList} onOpenChange={setShowShoppingList}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>장보기 리스트</DialogTitle>
            <DialogDescription>
              이번 주 식단에 필요한 재료 목록입니다
            </DialogDescription>
          </DialogHeader>
          <WeeklyShoppingList
            items={
              weeklyDiet?.shoppingList?.map((item, index) => ({
                ...item,
                id: item.id || `temp-${index}-${item.ingredient_name}`,
              })) ?? []
            }
            onTogglePurchase={handleTogglePurchase}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

