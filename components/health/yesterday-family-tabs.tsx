/**
 * @file components/health/yesterday-family-tabs.tsx
 * @description 어제 AI 식단 가족 탭 요약 컴포넌트
 *
 * 본 컴포넌트는 홈 섹션에서 가족 구성원별 토글과 영양 합계를 표시합니다.
 */

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Users, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NutritionInfo } from "@/types/health";
import type { FamilyMemberTabPayload } from "@/lib/diet/family-summary";

type FamilyTab = FamilyMemberTabPayload | {
  id: string;
  name: string;
  description?: string;
  isAll: boolean;
};

interface FamilyDietHeaderTabsProps {
  members: FamilyMemberTabPayload[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onToggleMember: (memberId: string, include: boolean) => void;
  includedMemberIds: string[];
  perServingTotals: NutritionInfo | null;
  scaledTotals: NutritionInfo | null;
  planExists: boolean;
  isLoading?: boolean;
  togglingMemberIds?: string[];
}

export function FamilyDietHeaderTabs({
  members,
  activeTab,
  onTabChange,
  onToggleMember,
  includedMemberIds,
  perServingTotals,
  scaledTotals,
  planExists,
  isLoading = false,
  togglingMemberIds = [],
}: FamilyDietHeaderTabsProps) {
  console.groupCollapsed("[FamilyDietHeaderTabs] 렌더링");
  console.log("받은 members:", members);
  console.log("members 개수:", members?.length ?? 0);
  console.log("members 타입:", Array.isArray(members) ? "배열" : typeof members);
  console.groupEnd();

  const syntheticTabs = [
    {
      id: "all",
      name: "전체",
      isAll: true,
      relationship: "전체",
      role: "member" as const,
    },
    ...(Array.isArray(members) ? members : []),
  ];

  console.groupCollapsed("[FamilyDietHeaderTabs] syntheticTabs");
  console.log("syntheticTabs:", syntheticTabs);
  console.log("syntheticTabs 개수:", syntheticTabs.length);
  console.groupEnd();

  const includeGroupLabel = "[FamilyDietHeaderTabs]";
  const includedCount = includedMemberIds.length;
  const perPersonCalories = perServingTotals?.calories ?? null;
  const totalCalories = scaledTotals?.calories ?? null;

  const handleTabSelect = (nextTabId: string) => {
    console.groupCollapsed(`${includeGroupLabel} 탭 변경`);
    console.log("다음 탭:", nextTabId);
    console.groupEnd();
    onTabChange(nextTabId);
  };

  const handleToggle = (memberId: string, shouldInclude: boolean) => {
    console.groupCollapsed(`${includeGroupLabel} 멤버 토글`);
    console.log("멤버 ID:", memberId, "포함 여부:", shouldInclude);
    console.groupEnd();
    onToggleMember(memberId, shouldInclude);
  };

  const handleKeyActivate = (event: React.KeyboardEvent<HTMLDivElement>, callback: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {syntheticTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isIncluded = tab.id === "all" ? true : includedMemberIds.includes(tab.id);
          const isToggleDisabled = tab.id === "all" || tab.role === "self";
          const isPrimaryLabel = tab.id === "all" || tab.role === "self";
          const tabNameClass = cn(
            "font-semibold text-gray-900",
            isPrimaryLabel ? "text-base" : "text-sm",
          );

          return (
            <div
              key={tab.id}
              role="button"
              tabIndex={0}
              onClick={() => handleTabSelect(tab.id)}
              onKeyDown={(event) => handleKeyActivate(event, () => handleTabSelect(tab.id))}
              className={cn(
                "min-w-[160px] rounded-2xl border px-4 py-3 text-left transition",
                isActive
                  ? "border-orange-400 bg-white shadow-sm"
                  : "border-transparent bg-white/70 hover:border-orange-200",
              )}
              aria-pressed={isActive}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className={tabNameClass}>{tab.name}</p>
                  {tab.relationship && tab.relationship !== "self" && (
                    <p className="text-xs text-gray-500">{tab.relationship}</p>
                  )}
                </div>
                {!('isAll' in tab && tab.isAll) && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Switch
                      checked={isIncluded}
                      onCheckedChange={(checked) => handleToggle(tab.id, checked)}
                      disabled={isToggleDisabled || togglingMemberIds.includes(tab.id)}
                      aria-label={`${tab.name} 통합 식단 포함 여부`}
                      aria-busy={togglingMemberIds.includes(tab.id)}
                    />
                  </div>
                )}
              </div>
              {!('isAll' in tab && tab.isAll) && (
                <p className="mt-2 text-xs text-gray-500">
                  {isIncluded ? "총괄 칼로리에 포함" : "총괄 칼로리에서 제외"}
                </p>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

interface YesterdayFamilyTabsProps {
  members: FamilyMemberTabPayload[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onToggleMember: (memberId: string, include: boolean) => void;
  includedMemberIds: string[];
  perServingTotals: NutritionInfo | null;
  scaledTotals: NutritionInfo | null;
  exclusionNotes: string[];
  planExists: boolean;
  isLoading?: boolean;
  togglingMemberIds?: string[];
}

export function YesterdayFamilyTabs({
  members,
  activeTab,
  onTabChange,
  onToggleMember,
  includedMemberIds,
  perServingTotals,
  scaledTotals,
  exclusionNotes,
  planExists,
  isLoading = false,
  togglingMemberIds = [],
}: YesterdayFamilyTabsProps) {
  const syntheticTabs: FamilyTab[] = [
    {
      id: "all",
      name: "전체",
      description: "모든 구성원",
      isAll: true,
    },
    ...members,
  ];

  const selectedMember =
    activeTab === "all" ? null : members.find((member) => member.id === activeTab) ?? null;

  const detailNotes =
    (selectedMember?.notes && selectedMember.notes.length > 0
      ? selectedMember.notes
      : exclusionNotes) ?? [];
  const selectedFlags = selectedMember?.healthFlags ?? [];

  const includeGroupLabel = "[YesterdayFamilyTabs]";
  const includedCount = includedMemberIds.length;
  const summaryDescription =
    perServingTotals && includedCount > 0
      ? `1인 기준 ${Math.round(perServingTotals.calories ?? 0)}kcal • ${includedCount}명 포함`
      : "포함 인원을 선택하면 총합이 계산됩니다.";

  const handleTabSelect = (nextTabId: string) => {
    console.groupCollapsed(`${includeGroupLabel} 탭 변경`);
    console.log("다음 탭:", nextTabId);
    console.groupEnd();
    onTabChange(nextTabId);
  };

  const handleToggle = (memberId: string, shouldInclude: boolean) => {
    console.groupCollapsed(`${includeGroupLabel} 멤버 토글`);
    console.log("멤버 ID:", memberId, "포함 여부:", shouldInclude);
    console.groupEnd();
    onToggleMember(memberId, shouldInclude);
  };

  const handleKeyActivate = (event: React.KeyboardEvent<HTMLDivElement>, callback: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  };

  // 영양소 표시 로직 개선: 통합 식단이 없어도 개별 식단 합계로 계산
  const shouldShowNutrition = scaledTotals !== null && scaledTotals !== undefined;

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              <h4 className="text-base font-semibold text-gray-900">
                가족 포함 여부
              </h4>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              토글을 조정해 어제 식단에 포함된 구성원을 확인하세요.
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-orange-700">
            포함 {includedCount}명
          </Badge>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {syntheticTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isIncluded = tab.id === "all" ? true : includedMemberIds.includes(tab.id);
            const isPrimaryLabel = tab.id === "all" || ('role' in tab && tab.role === "self");
          const tabNameClass = cn(
            "font-semibold text-gray-900",
            isPrimaryLabel ? "text-base" : "text-sm",
          );

            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => handleTabSelect(tab.id)}
                onKeyDown={(event) => handleKeyActivate(event, () => handleKeyActivate(event, () => handleTabSelect(tab.id)))}
                className={cn(
                  "min-w-[140px] rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-orange-400 bg-white shadow-sm"
                    : "border-transparent bg-white/70 hover:border-orange-200",
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={tabNameClass}>{tab.name}</p>
                    {'relationship' in tab && tab.relationship && tab.relationship !== "self" && (
                      <p className="text-xs text-gray-500">{tab.relationship}</p>
                    )}
                    {'role' in tab && tab.role === "self" && (
                      <Badge variant="outline" className="mt-1 text-[10px] text-gray-500">
                        본인
                      </Badge>
                    )}
                  </div>
                  {!('isAll' in tab && tab.isAll) && (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <Switch
                        checked={isIncluded}
                        onCheckedChange={(checked) => handleToggle(tab.id, checked)}
                        disabled={('role' in tab && tab.role === "self") || togglingMemberIds.includes(tab.id)}
                        aria-label={`${tab.name} 통합 식단 포함 여부`}
                        aria-busy={togglingMemberIds.includes(tab.id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white/80 p-4">
          <p className="text-sm font-medium text-orange-900">
            총 영양소 (선택 인원 기준)
          </p>
          <p className="text-xs text-orange-700">{summaryDescription}</p>

          {isLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div className="h-6 animate-pulse rounded bg-orange-100" />
              <div className="h-6 animate-pulse rounded bg-orange-100" />
              <div className="h-6 animate-pulse rounded bg-orange-100" />
              <div className="h-6 animate-pulse rounded bg-orange-100" />
            </div>
          ) : shouldShowNutrition ? (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <NutritionStat label="칼로리" value={scaledTotals.calories} unit="kcal" />
              <NutritionStat label="탄수화물" value={scaledTotals.carbohydrates} unit="g" />
              <NutritionStat label="단백질" value={scaledTotals.protein} unit="g" />
              <NutritionStat label="지방" value={scaledTotals.fat} unit="g" />
            </div>
          ) : planExists ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              영양소 계산 중...
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              아직 어제의 통합 식단이 생성되지 않았습니다.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white/70 p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-900">특이 사항</p>
          </div>
          {selectedFlags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedFlags.map((flag) => (
                <Badge
                  key={`${flag.code}-${flag.type}`}
                  variant={flag.type === "disease" ? "destructive" : "secondary"}
                  className="rounded-full px-3 py-1 text-xs"
                >
                  {flag.label}
                </Badge>
              ))}
            </div>
          )}
          {detailNotes.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {detailNotes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              등록된 질병이나 알레르기 정보가 없습니다. 건강 프로필을 업데이트하면 개인별 제약 정보를 확인할 수 있어요.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface NutritionStatProps {
  label: string;
  value: number | null | undefined;
  unit: string;
}

function NutritionStat({ label, value, unit }: NutritionStatProps) {
  // 칼로리는 정수로 표시, 나머지는 소수점 첫째 자리까지 표시
  const isCalories = unit === "kcal";
  const formattedValue =
    value === null || value === undefined
      ? "0"
      : Number(value).toLocaleString("ko-KR", {
          maximumFractionDigits: isCalories ? 0 : 1,
          minimumFractionDigits: 0,
        });

  return (
    <div className="rounded-xl border border-orange-100 bg-white px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {formattedValue}
        <span className="ml-1 text-xs font-medium text-gray-500">{unit}</span>
      </p>
    </div>
  );
}


