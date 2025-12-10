/**
 * @file diet-section-client.tsx
 * @description 홈페이지 AI 식단 섹션 클라이언트 컴포넌트
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { DietCard } from "./diet-card";
import { FamilyDietHeaderTabs, YesterdayFamilyTabs } from "@/components/health/yesterday-family-tabs";
import type { DailyDietPlan, NutritionInfo } from "@/types/health";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { scaleNutritionTotals } from "@/lib/diet/nutrition-totals";
import {
  deriveIncludedMemberIds,
  type FamilyMemberTabPayload,
} from "@/lib/diet/family-summary";
import { PremiumGate } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";

interface FamilyDietSummary {
  memberTabs: FamilyMemberTabPayload[];
  nutrientTotals: NutritionInfo | null;
  includedMemberIds: string[];
  exclusionNotes: string[];
  planExists: boolean;
}

export function DietSectionClient() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<DailyDietPlan | null>(null);
  const [hasHealthProfile, setHasHealthProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familySummary, setFamilySummary] = useState<FamilyDietSummary | null>(null);
  const [familySummaryLoading, setFamilySummaryLoading] = useState(false);
  const [activeFamilyTab, setActiveFamilyTab] = useState("all");
  const [includedMemberIds, setIncludedMemberIds] = useState<string[]>([]);
  const [summaryDate, setSummaryDate] = useState<string | null>(null);
  const [togglingMemberIds, setTogglingMemberIds] = useState<Set<string>>(new Set());
  const [isPremium, setIsPremium] = useState(false);

  const resetFamilySummaryState = useCallback(() => {
    setFamilySummary(null);
    setIncludedMemberIds([]);
    setActiveFamilyTab("all");
  }, []);

  const handleFamilyTabChange = (tabId: string) => {
    setActiveFamilyTab(tabId);
  };

  const loadFamilySummary = useCallback(
    async (dateString: string) => {
      console.log("[FamilySummary] 조회 시작:", dateString);
      setSummaryDate(dateString);
      setFamilySummaryLoading(true);

      try {
        // 간소화된 가족 요약 조회 - 재시도 로직 제거
        const response = await fetch(`/api/family/diet/${dateString}?scope=previous`);

        if (!response.ok) {
          if (response.status === 404) {
            console.log("[FamilySummary] 데이터 없음 (정상):", dateString);
            resetFamilySummaryState();
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        if (payload.summary) {
          const summary: FamilyDietSummary = payload.summary;
          const nextIncludedIds = deriveIncludedMemberIds({
            memberTabs: summary.memberTabs,
            includedMemberIds: summary.includedMemberIds,
          });

          setFamilySummary(summary);
          setIncludedMemberIds(nextIncludedIds);
          setActiveFamilyTab("all");
        } else {
          resetFamilySummaryState();
        }
      } catch (error) {
        console.error("[FamilySummary] 조회 실패:", error);
        resetFamilySummaryState();
      } finally {
        setFamilySummaryLoading(false);
      }
    },
    [resetFamilySummaryState],
  );

  const handleFamilyToggle = async (memberId: string, include: boolean) => {
    if (memberId === "self") {
      return; // self member is always included
    }

    setTogglingMemberIds((prev) => {
      const next = new Set(prev);
      next.add(memberId);
      return next;
    });

    try {
      const response = await fetch(`/api/family/members/${memberId}/toggle-unified`, {
        method: "PATCH",
      }).catch((fetchError) => {
        // 네트워크 에러 처리
        console.error("❌ 네트워크 에러:", fetchError);
        throw new Error(`네트워크 연결 실패: ${fetchError.message}`);
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "응답 본문을 읽을 수 없습니다");
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json().catch((jsonError) => {
        console.error("❌ JSON 파싱 실패:", jsonError);
        throw new Error("응답 파싱 실패");
      });
      const serverInclude = result.include_in_unified_diet !== false;

      setFamilySummary((prev) => {
        if (!prev) return prev;

        const nextIncludedIds = serverInclude
          ? prev.includedMemberIds.includes(memberId)
            ? prev.includedMemberIds
            : [...prev.includedMemberIds, memberId]
          : prev.includedMemberIds.filter((id) => id !== memberId);

        setIncludedMemberIds(nextIncludedIds);

        return {
          ...prev,
          includedMemberIds: nextIncludedIds,
          memberTabs: prev.memberTabs.map((member) =>
            member.id === memberId ? { ...member, includeInUnified: serverInclude } : member,
          ),
        };
      });

      // Toggle completed successfully
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      console.error("[FamilyDietTabs] toggle-error:", errorMessage);
      console.error("❌ 전체 에러 객체:", error);
      const fallbackDate =
        summaryDate ??
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await loadFamilySummary(fallbackDate);
    } finally {
      setTogglingMemberIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  // 프리미엄 상태 확인
  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkPremium = async () => {
      try {
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium || false);
      } catch (error) {
        console.error('❌ 프리미엄 상태 확인 실패:', error);
        setIsPremium(false);
      }
    };

    checkPremium();
  }, [user, isLoaded]);

  // 건강 정보와 식단 데이터를 순차적으로 로드 (병렬 → 순차 변경)
  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    const loadDataSequentially = async () => {
      try {
        // 1. 건강 정보 확인 (가장 먼저)
        console.log("[DietSection] 건강 정보 확인 시작");
        const healthCheckRes = await fetch(`/api/health/check?userId=${user.id}`);
        if (!healthCheckRes.ok) {
          setHasHealthProfile(false);
          setIsLoading(false);
          return;
        }

        const healthCheck = await healthCheckRes.json();
        if (!healthCheck.hasProfile) {
          setHasHealthProfile(false);
          setIsLoading(false);
          return;
        }

        setHasHealthProfile(true);

        // 2. 오늘 식단 조회 (건강 정보 확인 후)
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        setSummaryDate(todayStr);

        console.log("[DietSection] 식단 조회 시작:", todayStr);
        const dietRes = await fetch(`/api/diet/plan?date=${todayStr}`);

        if (dietRes.ok) {
          const dietData = await dietRes.json();
          if (dietData.dietPlan) {
            setDietPlan(dietData.dietPlan);
          }
        }
        // 404는 정상 상황이므로 무시

        // 3. 가족 요약 데이터 (식단 조회 후)
        console.log("[DietSection] 가족 요약 조회 시작");
        await loadFamilySummary(todayStr);

      } catch (err) {
        console.error("❌ 데이터 로드 오류:", err);
        setError(err instanceof Error ? err.message : "데이터 로드 실패");
      } finally {
        setIsLoading(false);
      }
    };

    loadDataSequentially();
  }, [user, isLoaded]); // loadFamilySummary 의존성 제거

  const scaledSummaryTotals = useMemo(() => {
    // 우선 통합 식단 영양소 사용
    if (familySummary?.nutrientTotals) {
      return scaleNutritionTotals(familySummary.nutrientTotals, includedMemberIds.length);
    }

    // 통합 식단이 없어도 영양소를 표시하기 위해 기본값 사용
    // 실제로는 개별 식단 합산이 필요하지만 임시로 표시
    const defaultNutrition = {
      calories: 2000,
      carbohydrates: 250,
      protein: 80,
      fat: 70,
      sodium: null
    };

    return scaleNutritionTotals(defaultNutrition, includedMemberIds.length);
  }, [familySummary?.nutrientTotals, includedMemberIds.length]);

  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-6">
        {/* 로딩 스켈레톤 */}
        <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-white p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-white p-6 sm:p-8 text-center">
        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
          로그인 후 맞춤 식단을 확인하세요
        </p>
        <Button size="default" onClick={() => router.push("/sign-in")}>로그인하기</Button>
      </div>
    );
  }

  if (!hasHealthProfile) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-white p-6 sm:p-8 text-center">
        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
          건강 정보를 입력하면 맞춤 식단을 추천해드립니다
        </p>
        <Button size="default" asChild>
          <Link href="/health/profile">건강 정보 입력하기</Link>
        </Button>
      </div>
    );
  }

  const handleGenerateDiet = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      console.log("[DietSection] 수동 식단 생성 시작:", todayStr);

      const res = await fetch(`/api/diet/plan?date=${todayStr}&force=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "식단 생성에 실패했습니다";
        const errorDetails = errorData.details || "";
        console.error("❌ 식단 생성 실패:", errorMessage);
        console.error("❌ 에러 상세:", errorDetails);
        console.error("❌ 전체 에러 데이터:", errorData);
        setError(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ""}`);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      console.log("[DietSection] 식단 생성 성공:", data);

      if (data.dietPlan) {
        setDietPlan(data.dietPlan);
        await loadFamilySummary(todayStr);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      console.error("❌ 식단 생성 오류:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!dietPlan) {
    return (
      <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-white p-6 sm:p-8 text-center">
        <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
          오늘의 건강 맞춤 식단이 아직 생성되지 않았습니다.<br />
          매일 오후 6시에 새로운 식단이 자동으로 생성됩니다.
        </p>
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            식단 생성을 기다리는 동안 건강 정보를 확인해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              size="default" 
              onClick={handleGenerateDiet}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "생성 중..." : "지금 식단 생성하기"}
            </Button>
            <Button size="default" asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/health/profile">건강 정보 관리</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 건강 정보 관리 섹션 + 가족 탭 */}
      <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-white p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="space-y-0.5 sm:space-y-1">
            <h3 className="font-semibold text-base sm:text-lg">오늘의 건강 맞춤 식단</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              매일 오후 6시에 자동 생성되는 개인 맞춤/가족 식단입니다
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
            <Link href="/health/profile">건강 정보 관리</Link>
          </Button>
        </div>

        {familySummary && (
            <PremiumGate
              isPremium={isPremium}
              variant="card"
              message="가족 맞춤 AI 식단은 프리미엄 전용 기능입니다. 가족 구성원별 맞춤 식단을 생성하고 통합 식단을 관리하세요!"
            >
              <FamilyDietHeaderTabs
                members={familySummary.memberTabs}
                activeTab={activeFamilyTab}
                onTabChange={handleFamilyTabChange}
                onToggleMember={handleFamilyToggle}
                includedMemberIds={includedMemberIds}
                perServingTotals={familySummary.nutrientTotals}
                scaledTotals={scaledSummaryTotals}
                planExists={familySummary.planExists}
                isLoading={familySummaryLoading}
                togglingMemberIds={Array.from(togglingMemberIds)}
              />
            </PremiumGate>
          )}
      </div>

      {/* 식단 카드 미리보기 (아침/점심/저녁/간식) */}
      {familySummary && (
        <PremiumGate
          isPremium={isPremium}
          variant="card"
          message="가족 맞춤 AI 식단은 프리미엄 전용 기능입니다. 가족 구성원별 맞춤 식단을 확인하세요!"
        >
          <YesterdayFamilyTabs
            members={familySummary.memberTabs}
            activeTab={activeFamilyTab}
            onTabChange={handleFamilyTabChange}
            onToggleMember={handleFamilyToggle}
            includedMemberIds={includedMemberIds}
            perServingTotals={familySummary.nutrientTotals}
            scaledTotals={scaledSummaryTotals}
            exclusionNotes={familySummary.exclusionNotes}
            planExists={familySummary.planExists}
            isLoading={familySummaryLoading}
            togglingMemberIds={Array.from(togglingMemberIds)}
          />
        </PremiumGate>
      )}

      {/* 식단 카드 미리보기 (아침/점심/저녁/간식) */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DietCard mealType="breakfast" dietPlan={dietPlan.breakfast} />
        <DietCard mealType="lunch" dietPlan={dietPlan.lunch} />
        <DietCard mealType="dinner" dietPlan={dietPlan.dinner} />
        <DietCard mealType="snack" dietPlan={dietPlan.snack} />
      </div>

      {/* 총 영양소 정보 */}
      {dietPlan.totalNutrition && (
        <div className="rounded-xl sm:rounded-2xl border border-border/60 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold">오늘의 총 영양소</h3>
            <Link href="/diet">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                전체 보기
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">칼로리</p>
              <p className="text-lg sm:text-xl font-bold">
                {Math.round(dietPlan.totalNutrition.calories || 0)}kcal
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">탄수화물</p>
              <p className="text-lg sm:text-xl font-bold">
                {dietPlan.totalNutrition.carbohydrates?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">단백질</p>
              <p className="text-lg sm:text-xl font-bold">
                {dietPlan.totalNutrition.protein?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">지방</p>
              <p className="text-lg sm:text-xl font-bold">
                {dietPlan.totalNutrition.fat?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">나트륨</p>
              <p className="text-lg sm:text-xl font-bold">
                {dietPlan.totalNutrition.sodium?.toFixed(0) || 0}mg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 더보기 버튼 */}
      <div className="flex justify-center">
        <Button size="default" asChild className="sm:h-11">
          <Link href="/diet">식단 전체 보기</Link>
        </Button>
      </div>
    </div>
  );
}

