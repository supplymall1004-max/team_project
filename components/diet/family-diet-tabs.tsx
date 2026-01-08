/**
 * @file components/diet/family-diet-tabs.tsx
 * @description 가족 식단 탭 인터페이스 - 개인별 + 통합 식단 전환
 *
 * 이 컴포넌트는 가족 식단의 메인 탭 인터페이스를 제공합니다:
 * - 개인별 식단 탭과 통합 식단 탭 전환
 * - 각 탭에 맞는 컴포넌트 렌더링
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, User } from "lucide-react";
import type { FamilyDietPlan } from "@/types/recipe";
import type { FamilyMember } from "@/types/family";
import { IndividualDietTabs } from "@/components/family/individual-diet-tabs";
import { UnifiedDietSection } from "@/components/family/unified-diet-section";
import { FamilyDietComparison } from "@/components/family/family-diet-comparison";

interface FamilyDietTabsProps {
  familyDiet: FamilyDietPlan;
  familyMembers: FamilyMember[];
  userName: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
  onMemberIncludeChange?: (memberId: string, include: boolean) => void;
  includedCount?: number;
}

export function FamilyDietTabs({
  familyDiet,
  familyMembers,
  userName,
  onRegenerate,
  regenerating = false,
  onMemberIncludeChange,
  includedCount = Array.isArray(familyMembers) ? familyMembers.length : 0,
}: FamilyDietTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("individual");

  const focusUnifiedSection = () => {
    const section = document.getElementById("unified-diet-section");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOpenInclusionSettings = (memberId?: string) => {
    console.group("👪 통합 식단 설정 진입");
    if (memberId) {
      console.log("요청 구성원:", memberId);
    }
    console.groupEnd();
    setActiveTab("unified");
    setTimeout(focusUnifiedSection, 200);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            개인별 식단
            <Badge variant="secondary" className="ml-1">
              {(Array.isArray(familyMembers) ? familyMembers.length : 0) + 1}명
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            비교 뷰
          </TabsTrigger>
          <TabsTrigger value="unified" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            통합 식단
            {familyDiet.unifiedPlan && (
              <Badge variant="default" className="ml-1 bg-orange-500">
                생성됨
              </Badge>
            )}
            <Badge variant="outline" className="ml-1 text-xs">
              {includedCount}명
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* 개인별 식단 탭 */}
        <TabsContent value="individual" className="mt-6">
          <IndividualDietTabs
            familyDiet={familyDiet}
            familyMembers={familyMembers}
            userName={userName}
            onOpenInclusionSettings={handleOpenInclusionSettings}
          />
        </TabsContent>

        {/* 비교 뷰 탭 */}
        <TabsContent value="comparison" className="mt-6">
          <FamilyDietComparison
            familyDiet={familyDiet}
            familyMembers={familyMembers}
            userName={userName}
          />
        </TabsContent>

        {/* 통합 식단 탭 */}
        <TabsContent value="unified" className="mt-6">
          <UnifiedDietSection
            unifiedDiet={familyDiet.unifiedPlan}
            familyMembers={familyMembers}
            onRegenerate={onRegenerate}
            regenerating={regenerating}
            onToggleMember={onMemberIncludeChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

