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
import { Users, Info, AlertTriangle, Flame, Apple, Droplet, Zap } from "lucide-react";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {syntheticTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isIncluded = tab.id === "all" ? true : includedMemberIds.includes(tab.id);
          const isToggleDisabled = tab.id === "all" || tab.role === "self";
          const isPrimaryLabel = tab.id === "all" || tab.role === "self";
          const tabNameClass = cn(
            "font-bold text-gray-900",
            isPrimaryLabel ? "text-base" : "text-sm",
          );
          const isToggling = togglingMemberIds.includes(tab.id);

          return (
            <div
              key={tab.id}
              role="button"
              tabIndex={0}
              onClick={() => handleTabSelect(tab.id)}
              onKeyDown={(event) => handleKeyActivate(event, () => handleTabSelect(tab.id))}
              className={cn(
                "group relative rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200",
                "hover:shadow-md",
                isActive
                  ? "border-orange-500 bg-white shadow-md ring-2 ring-orange-200"
                  : "border-gray-200 bg-white/80 hover:border-orange-300",
                isToggling && "opacity-60 pointer-events-none"
              )}
              aria-pressed={isActive}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={tabNameClass}>{tab.name}</p>
                  {tab.relationship && tab.relationship !== "self" && (
                    <p className="text-xs text-gray-500 mt-0.5">{tab.relationship}</p>
                  )}
                  {!('isAll' in tab && tab.isAll) && (
                    <p className={cn(
                      "text-[10px] mt-1.5 font-medium",
                      isIncluded ? "text-green-600" : "text-gray-400"
                    )}>
                      {isIncluded ? "✓ 총 칼로리에 포함" : "총 칼로리에서 제외"}
                    </p>
                  )}
                </div>
                {!('isAll' in tab && tab.isAll) && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    className="flex-shrink-0"
                  >
                    <Switch
                      checked={isIncluded}
                      onCheckedChange={(checked) => handleToggle(tab.id, checked)}
                      disabled={isToggleDisabled || isToggling}
                      aria-label={`${tab.name} 통합 식단 포함 여부`}
                      aria-busy={isToggling}
                    />
                  </div>
                )}
              </div>
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
    <Card className="border-orange-200/60 bg-gradient-to-br from-orange-50/50 to-amber-50/30 shadow-sm">
      <CardContent className="space-y-6 pt-6">
        {/* 헤더 섹션 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-orange-100 p-2">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  가족 식단 관리
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  토글을 조정해 식단에 포함된 구성원을 선택하세요
                </p>
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="text-sm font-semibold border-orange-300 text-orange-700 bg-orange-50 px-3 py-1.5"
          >
            포함 {includedCount}명
          </Badge>
        </div>

        {/* 구성원 탭 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {syntheticTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isIncluded = tab.id === "all" ? true : includedMemberIds.includes(tab.id);
            const isPrimaryLabel = tab.id === "all" || ('role' in tab && tab.role === "self");
            const tabNameClass = cn(
              "font-bold text-gray-900",
              isPrimaryLabel ? "text-base" : "text-sm",
            );
            const isToggling = togglingMemberIds.includes(tab.id);

            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => handleTabSelect(tab.id)}
                onKeyDown={(event) => handleKeyActivate(event, () => handleTabSelect(tab.id))}
                className={cn(
                  "group relative rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200",
                  "hover:shadow-md",
                  isActive
                    ? "border-orange-500 bg-white shadow-md ring-2 ring-orange-200"
                    : "border-gray-200 bg-white/80 hover:border-orange-300",
                  isToggling && "opacity-60 pointer-events-none"
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={tabNameClass}>{tab.name}</p>
                      {'role' in tab && tab.role === "self" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700">
                          본인
                        </Badge>
                      )}
                    </div>
                    {'relationship' in tab && tab.relationship && tab.relationship !== "self" && (
                      <p className="text-xs text-gray-500 mt-0.5">{tab.relationship}</p>
                    )}
                    {!('isAll' in tab && tab.isAll) && (
                      <p className={cn(
                        "text-[10px] mt-1.5 font-medium",
                        isIncluded ? "text-green-600" : "text-gray-400"
                      )}>
                        {isIncluded ? "✓ 총 칼로리에 포함" : "총 칼로리에서 제외"}
                      </p>
                    )}
                  </div>
                  {!('isAll' in tab && tab.isAll) && (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      className="flex-shrink-0"
                    >
                      <Switch
                        checked={isIncluded}
                        onCheckedChange={(checked) => handleToggle(tab.id, checked)}
                        disabled={('role' in tab && tab.role === "self") || isToggling}
                        aria-label={`${tab.name} 통합 식단 포함 여부`}
                        aria-busy={isToggling}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 영양소 정보 카드 */}
        <div className="rounded-2xl border-2 border-orange-200/60 bg-gradient-to-br from-white to-orange-50/30 p-5 shadow-sm">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="rounded-lg bg-orange-100 p-1.5">
                <Apple className="h-4 w-4 text-orange-600" />
              </div>
              <h5 className="text-base font-bold text-gray-900">
                총 영양소
              </h5>
            </div>
            <p className="text-xs text-gray-600 ml-9">
              {summaryDescription}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-orange-100" />
              ))}
            </div>
          ) : shouldShowNutrition ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NutritionStat 
                label="칼로리" 
                value={scaledTotals.calories} 
                unit="kcal" 
                icon={Flame}
                color="text-orange-600"
                bgColor="bg-orange-50"
              />
              <NutritionStat 
                label="탄수화물" 
                value={scaledTotals.carbohydrates} 
                unit="g" 
                icon={Zap}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <NutritionStat 
                label="단백질" 
                value={scaledTotals.protein} 
                unit="g" 
                icon={Droplet}
                color="text-green-600"
                bgColor="bg-green-50"
              />
              <NutritionStat 
                label="지방" 
                value={scaledTotals.fat} 
                unit="g" 
                icon={Apple}
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
            </div>
          ) : planExists ? (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800">영양소 계산 중입니다. 잠시만 기다려주세요.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm">
              <Info className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <p className="text-gray-700">아직 통합 식단이 생성되지 않았습니다.</p>
            </div>
          )}
        </div>

        {/* 특이 사항 카드 */}
        <div className={cn(
          "rounded-2xl border-2 p-5 shadow-sm",
          selectedFlags.length > 0 || detailNotes.length > 0
            ? "border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30"
            : "border-gray-200 bg-white/80"
        )}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className={cn(
              "rounded-lg p-1.5",
              selectedFlags.length > 0 || detailNotes.length > 0
                ? "bg-amber-100"
                : "bg-gray-100"
            )}>
              <AlertTriangle className={cn(
                "h-4 w-4",
                selectedFlags.length > 0 || detailNotes.length > 0
                  ? "text-amber-600"
                  : "text-gray-500"
              )} />
            </div>
            <h5 className="text-base font-bold text-gray-900">
              특이 사항 및 건강 정보
            </h5>
          </div>
          
          {selectedFlags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">건강 상태</p>
              <div className="flex flex-wrap gap-2">
                {selectedFlags.map((flag) => (
                  <Badge
                    key={`${flag.code}-${flag.type}`}
                    variant={flag.type === "disease" ? "destructive" : "secondary"}
                    className="rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                  >
                    {flag.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {detailNotes.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">주의 사항</p>
              <ul className="space-y-2">
                {detailNotes.map((note, index) => (
                  <li 
                    key={`${note}-${index}`}
                    className="flex items-start gap-2 text-sm text-gray-800 bg-white/60 rounded-lg p-3 border border-amber-100"
                  >
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <span className="flex-1">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                등록된 질병이나 알레르기 정보가 없습니다. 
                <span className="font-medium text-gray-700"> 건강 프로필을 업데이트</span>하면 개인별 맞춤 제약 정보를 확인할 수 있습니다.
              </p>
            </div>
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
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  bgColor?: string;
}

function NutritionStat({ label, value, unit, icon: Icon, color = "text-orange-600", bgColor = "bg-orange-50" }: NutritionStatProps) {
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
    <div className="group relative rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-orange-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={cn("rounded-lg p-1.5", bgColor)}>
            <Icon className={cn("h-3.5 w-3.5", color)} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {formattedValue}
        <span className="ml-1.5 text-sm font-medium text-gray-500">{unit}</span>
      </p>
    </div>
  );
}


