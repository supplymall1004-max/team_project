/**
 * @file components/family/individual-diet-tabs.tsx
 * @description 구성원별 식단 탭 컴포넌트
 *
 * 이 컴포넌트는 각 가족 구성원의 개인 식단을 탭으로 표시합니다.
 * - 사용자 본인 + 가족 구성원별 탭
 * - 각 탭에 해당 구성원의 식단 표시
 *
 * @dependencies
 * - DailyDietView 컴포넌트 (식단 표시)
 * - 가족 구성원 정보
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Users } from "lucide-react";
import { DailyDietView } from "@/components/diet/daily-diet-view";
import { calculateAge } from "@/lib/utils/age-calculator";
import { getHealthLabels, getAllergyLabels } from "@/lib/utils/health-labels";
import { DISEASE_LABELS as HEALTH_DISEASE_LABELS, ALLERGY_LABELS as HEALTH_ALLERGY_LABELS } from "@/types/health";
import { DISEASE_LABELS as FAMILY_DISEASE_LABELS, ALLERGY_LABELS as FAMILY_ALLERGY_LABELS } from "@/types/family";
import type { FamilyDietPlan, DailyDietPlan } from "@/types/recipe";
import type { FamilyMember } from "@/types/family";

interface IndividualDietTabsProps {
  familyDiet: FamilyDietPlan;
  familyMembers: FamilyMember[];
  userName: string;
  onOpenInclusionSettings?: (memberId?: string) => void;
}

export function IndividualDietTabs({
  familyDiet,
  familyMembers,
  userName,
  onOpenInclusionSettings,
}: IndividualDietTabsProps) {
  const [activeTab, setActiveTab] = useState("user");

  // 질병/알레르기 한글 변환 함수 (두 파일의 라벨 통합)
  const getDiseaseLabel = (disease: string): string => {
    // types/health.ts의 라벨 먼저 확인
    const healthLabel = HEALTH_DISEASE_LABELS[disease as keyof typeof HEALTH_DISEASE_LABELS];
    if (healthLabel) return healthLabel;
    
    // types/family.ts의 라벨 확인
    const familyLabel = FAMILY_DISEASE_LABELS[disease];
    if (familyLabel) return familyLabel;
    
    // 둘 다 없으면 원본 반환
    return disease;
  };

  const getAllergyLabel = (allergy: string): string => {
    // types/health.ts의 라벨 먼저 확인
    const healthLabel = HEALTH_ALLERGY_LABELS[allergy as keyof typeof HEALTH_ALLERGY_LABELS];
    if (healthLabel) return healthLabel;
    
    // types/family.ts의 라벨 확인 (peanuts/peanut 호환성 처리)
    const familyLabel = FAMILY_ALLERGY_LABELS[allergy] || FAMILY_ALLERGY_LABELS[allergy + 's'];
    if (familyLabel) return familyLabel;
    
    // 둘 다 없으면 원본 반환
    return allergy;
  };

  // 탭 구성원 목록 생성
  const tabMembers = [
    { id: "user", name: userName, isUser: true, age: null, diseases: [], allergies: [] },
    ...(Array.isArray(familyMembers) ? familyMembers.map(member => ({
      id: member.id,
      name: member.name,
      isUser: false,
      age: member.birth_date ? calculateAge(member.birth_date).years : null,
      diseases: Array.isArray(member.diseases) ? member.diseases : [],
      allergies: Array.isArray(member.allergies) ? member.allergies : [],
    })) : [])
  ];

  // 특정 구성원의 식단 데이터 가져오기
  const getMemberDiet = (memberId: string): DailyDietPlan | null => {
    return familyDiet.individualPlans[memberId] || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-orange-500" />
        <h2 className="text-xl font-semibold text-gray-900">
          개인별 맞춤 식단
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-1">
          {tabMembers.map((member) => (
            <TabsTrigger
              key={member.id}
              value={member.id}
              className="flex flex-col items-center gap-1 py-3 px-2 text-xs"
            >
              <div className="flex items-center gap-1">
                {member.isUser ? (
                  <User className="h-3 w-3" />
                ) : (
                  <Users className="h-3 w-3" />
                )}
                <span className="truncate max-w-[60px]">{member.name}</span>
              </div>
              {member.age && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {member.age}세
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabMembers.map((member) => {
          const memberDiet = getMemberDiet(member.id);

          return (
            <TabsContent key={member.id} value={member.id} className="mt-6">
              <div className="space-y-4">
                {/* 구성원 정보 헤더 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                        {member.name}님의 식단
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
                        {Array.isArray(member.diseases) && member.diseases.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-gray-900">질병:</span>
                            {member.diseases.map((disease, index) => (
                              <Badge key={index} variant="destructive" className="text-sm font-semibold px-3 py-1.5">
                                {getDiseaseLabel(disease)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {Array.isArray(member.allergies) && member.allergies.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-gray-900">알레르기:</span>
                            {member.allergies.map((allergy, index) => (
                              <Badge key={index} variant="outline" className="text-sm font-semibold px-3 py-1.5 border-2 border-orange-300 text-gray-900">
                                {getAllergyLabel(allergy)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {member.age && (
                        <Badge variant="default" className="text-sm font-semibold px-3 py-1">
                          {member.age}세
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenInclusionSettings?.(member.id)}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700 underline-offset-2 hover:underline transition-colors"
                      >
                        통합 식단 설정
                      </button>
                    </div>
                  </div>
                </div>

                {/* 식단 내용 */}
                {memberDiet ? (
                  <DailyDietView
                    diet={memberDiet}
                  />
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      식단이 없습니다
                    </h3>
                    <p className="text-gray-600">
                      이 구성원을 위한 식단이 아직 생성되지 않았습니다.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
