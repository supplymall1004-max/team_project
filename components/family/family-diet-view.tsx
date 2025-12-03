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
import { RefreshCw, Calendar, Users } from "lucide-react";
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
  const [memberStates, setMemberStates] = useState<FamilyMember[]>(familyMembers);

  useEffect(() => {
    setMemberStates(familyMembers);
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

  // FamilyDietPlan 형식으로 변환
  const familyDietPlan: FamilyDietPlan = dietData ? {
    date: dietData.date,
    individualPlans: Object.fromEntries(
      Object.entries(dietData.plans).filter(([key]) => key !== 'unified')
    ),
    unifiedPlan: dietData.plans.unified || null,
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
  const hasDietData = dietData && Object.keys(dietData.plans).length > 0;

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
            <Button
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
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 액션 버튼 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
        <Button
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
        </Button>
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
