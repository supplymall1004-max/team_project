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
  const [familySummary, setFamilySummary] = useState<FamilyDietSummary | null>(null);
  const [familySummaryLoading, setFamilySummaryLoading] = useState(false);
  const [activeFamilyTab, setActiveFamilyTab] = useState("all");
  const [includedMemberIds, setIncludedMemberIds] = useState<string[]>([]);
  const [summaryDate, setSummaryDate] = useState<string | null>(null);
  const [togglingMemberIds, setTogglingMemberIds] = useState<Set<string>>(new Set());

  const resetFamilySummaryState = useCallback(() => {
    setFamilySummary(null);
    setIncludedMemberIds([]);
    setActiveFamilyTab("all");
  }, []);

  const handleFamilyTabChange = (tabId: string) => {
    console.group("[FamilyDietTabs]");
    console.log("tab-change", { tabId });
    console.groupEnd();
    setActiveFamilyTab(tabId);
  };

  const loadFamilySummary = useCallback(
    async (dateString: string) => {
      console.group("[FamilyDietTabs]");
      console.log("summary-fetch-date", dateString);
      setSummaryDate(dateString);
      setFamilySummaryLoading(true);

      const syncUserIfNeeded = async () => {
        try {
          console.log("summary-sync-request");
          const response = await fetch("/api/sync-user", { method: "POST" });
          if (!response.ok) {
            console.error("summary-sync-failed", response.status);
          } else {
            console.log("summary-sync-success");
          }
        } catch (error) {
          console.error("summary-sync-error", error);
        }
      };

      try {
        let allowSyncRetry = true;

        while (true) {
          const response = await fetch(`/api/family/diet/${dateString}?scope=previous`);

          if (response.status === 404) {
            console.warn(
              allowSyncRetry ? "summary-fetch-404-retry" : "summary-fetch-404-final",
              dateString,
            );
            if (allowSyncRetry) {
              allowSyncRetry = false;
              await syncUserIfNeeded();
              continue;
            }
            resetFamilySummaryState();
            break;
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const payload = await response.json();
          console.log("[DietSectionClient] API 응답 payload:", payload);
          if (payload.summary) {
            const summary: FamilyDietSummary = payload.summary;
            console.log("[DietSectionClient] summary.memberTabs:", summary.memberTabs);
            console.log("[DietSectionClient] summary.memberTabs 개수:", summary.memberTabs?.length ?? 0);
            const nextIncludedIds = deriveIncludedMemberIds({
              memberTabs: summary.memberTabs,
              includedMemberIds: summary.includedMemberIds,
            });
            console.log("[DietSectionClient] 계산된 nextIncludedIds:", nextIncludedIds);
            setFamilySummary(summary);
            setIncludedMemberIds(nextIncludedIds);
            setActiveFamilyTab("all");
          } else {
            console.warn("[DietSectionClient] summary가 없습니다. payload:", payload);
            resetFamilySummaryState();
          }
          break;
        }
      } catch (error) {
        console.error("[FamilyDietTabs] summary-fetch-error", error);
        resetFamilySummaryState();
      } finally {
        setFamilySummaryLoading(false);
        console.groupEnd();
      }
    },
    [resetFamilySummaryState],
  );

  const handleFamilyToggle = async (memberId: string, include: boolean) => {
    console.group("[FamilyDietTabs]");
    console.log("toggle-request", { memberId, include });
    console.groupEnd();

    if (memberId === "self") {
      console.group("[FamilyDietTabs]");
      console.log("toggle-blocked", { reason: "self member is always included" });
      console.groupEnd();
      return;
    }

    setTogglingMemberIds((prev) => {
      const next = new Set(prev);
      next.add(memberId);
      return next;
    });

    try {
      const response = await fetch(`/api/family/members/${memberId}/toggle-unified`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
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

      console.group("[FamilyDietTabs]");
      console.log("toggle-success", { memberId, include: serverInclude });
      console.groupEnd();
    } catch (error) {
      console.error("[FamilyDietTabs] toggle-error", error);
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

  useEffect(() => {
    if (!isLoaded) return;

    const loadPreview = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // 건강 정보 확인
        const healthCheckRes = await fetch(`/api/health/check?userId=${user.id}`);
        const healthCheck = await healthCheckRes.json();

        if (!healthCheck.hasProfile) {
          setHasHealthProfile(false);
          setIsLoading(false);
          return;
        }

        setHasHealthProfile(true);

        // 전날의 식단 미리보기 (아침/점심/저녁만)
        // 전날 오후 8시에 생성된 식단을 계속 표시
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        console.log("[DietSection] 전날 식단 조회:", yesterdayStr);
        setSummaryDate(yesterdayStr);

        const res = await fetch(`/api/diet/plan?date=${yesterdayStr}`);
        const data = await res.json();

        console.log("[DietSection] 전날 식단 조회 결과:", data);

        if (res.ok && data.dietPlan) {
          setDietPlan(data.dietPlan);
        }

        await loadFamilySummary(yesterdayStr);
      } catch (err) {
        console.error("preview load error", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, [user, isLoaded, loadFamilySummary]);

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
      <div className="text-center py-8 text-muted-foreground">
        로딩 중...
      </div>
    );
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

  if (!hasHealthProfile) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          건강 정보를 입력하면 맞춤 식단을 추천해드립니다
        </p>
        <Button asChild>
          <Link href="/health/profile">건강 정보 입력하기</Link>
        </Button>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <p className="text-muted-foreground mb-4">
          어제 생성된 AI 추천 식단이 없습니다.<br />
          매일 오후 8시에 새로운 식단이 자동으로 생성됩니다.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            식단 생성을 기다리는 동안 건강 정보를 확인해보세요
          </p>
          <Button asChild variant="outline">
            <Link href="/health/profile">건강 정보 관리</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 건강 정보 관리 섹션 + 가족 탭 */}
      <div className="rounded-2xl border border-border/60 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">어제의 AI 맞춤 식단</h3>
            <p className="text-sm text-muted-foreground">
              매일 오후 8시에 자동 생성되는 개인 맞춤/가족 식단입니다
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/health/profile">건강 정보 관리</Link>
          </Button>
        </div>

        {familySummary && (() => {
          console.group("[DietSectionClient] 가족 구성원 데이터 확인");
          console.log("전체 memberTabs:", familySummary.memberTabs);
          console.log("memberTabs 개수:", familySummary.memberTabs?.length ?? 0);
          console.log("includedMemberIds:", includedMemberIds);
          console.groupEnd();
          return (
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
          );
        })()}
      </div>

      {/* 식단 카드 미리보기 (아침/점심/저녁/간식) */}
      <YesterdayFamilyTabs
        members={familySummary?.memberTabs || []}
        activeTab={activeFamilyTab}
        onTabChange={handleFamilyTabChange}
        onToggleMember={handleFamilyToggle}
        includedMemberIds={includedMemberIds}
        perServingTotals={familySummary?.nutrientTotals || null}
        scaledTotals={scaledSummaryTotals}
        exclusionNotes={familySummary?.exclusionNotes || []}
        planExists={familySummary?.planExists || false}
        isLoading={familySummaryLoading}
        togglingMemberIds={Array.from(togglingMemberIds)}
      />

      {/* 식단 카드 미리보기 (아침/점심/저녁/간식) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DietCard mealType="breakfast" dietPlan={dietPlan.breakfast} />
        <DietCard mealType="lunch" dietPlan={dietPlan.lunch} />
        <DietCard mealType="dinner" dietPlan={dietPlan.dinner} />
        <DietCard mealType="snack" dietPlan={dietPlan.snack} />
      </div>

      {/* 총 영양소 정보 */}
      {dietPlan.totalNutrition && (
        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">어제의 총 영양소</h3>
            <Link href="/diet">
              <Button variant="ghost" size="sm">
                전체 보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">칼로리</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition.calories || 0}kcal
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">탄수화물</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition.carbohydrates?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">단백질</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition.protein?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">지방</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition.fat?.toFixed(1) || 0}g
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">나트륨</p>
              <p className="text-xl font-bold">
                {dietPlan.totalNutrition.sodium?.toFixed(0) || 0}mg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 더보기 버튼 */}
      <div className="flex justify-center">
        <Button size="lg" asChild>
          <Link href="/diet">식단 전체 보기</Link>
        </Button>
      </div>
    </div>
  );
}

