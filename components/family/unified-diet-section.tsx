/**
 * @file components/family/unified-diet-section.tsx
 * @description 통합 식단 섹션 컴포넌트
 *
 * 이 컴포넌트는 가족 전체가 함께 먹을 수 있는 통합 식단을 표시합니다.
 * - 모든 구성원의 제약 조건을 고려한 레시피 선택
 * - 구성원별 통합 식단 포함/제외 상태 표시
 *
 * @dependencies
 * - DailyDietView 컴포넌트 (식단 표시)
 * - 가족 구성원 정보 및 통합 식단 포함 상태
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Users, CheckCircle, XCircle, RefreshCw, Minus, Plus, ShoppingCart } from "lucide-react";
import { DailyDietView } from "@/components/diet/daily-diet-view";
import { calculateAge } from "@/lib/utils/age-calculator";
import type { DailyDietPlan } from "@/types/recipe";
import type { FamilyMember } from "@/types/family";

interface UnifiedDietSectionProps {
  unifiedDiet: DailyDietPlan | null;
  familyMembers: FamilyMember[];
  onRegenerate?: () => void;
  regenerating?: boolean;
  onToggleMember?: (memberId: string, include: boolean) => void;
}

export function UnifiedDietSection({
  unifiedDiet,
  familyMembers,
  onRegenerate,
  regenerating = false,
  onToggleMember,
}: UnifiedDietSectionProps) {
  const [togglingMembers, setTogglingMembers] = useState<Set<string>>(new Set());
  const [servingCount, setServingCount] = useState(() =>
    Math.max(1, familyMembers.filter((member) => member.include_in_unified_diet !== false).length || 1),
  );

  // 통합 식단에 포함되는 구성원들
  const includedMembers = familyMembers.filter(
    member => member.include_in_unified_diet !== false
  );

  const excludedMembers = familyMembers.filter(
    member => member.include_in_unified_diet === false
  );

  // 구성원 토글 함수
  const toggleMemberInclusion = async (memberId: string) => {
    if (togglingMembers.has(memberId)) return;

    setTogglingMembers(prev => new Set(prev).add(memberId));

    try {
      const response = await fetch(`/api/family/members/${memberId}/toggle-unified`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('토글 실패');
      }

      const result = await response.json();
      console.log(`${memberId} 통합 식단 포함 상태: ${result.include_in_unified_diet}`);
      onToggleMember?.(memberId, result.include_in_unified_diet);
      if (onRegenerate) {
        console.info("통합 식단 포함 상태가 변경되었습니다. 필요 시 식단을 재생성하세요.");
      }

    } catch (error) {
      console.error('토글 실패:', error);
    } finally {
      setTogglingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const count = familyMembers.filter((member) => member.include_in_unified_diet !== false).length || 1;
    setServingCount(Math.max(1, count));
  }, [familyMembers]);

  const adjustServingCount = (delta: number) => {
    setServingCount((prev) => Math.max(1, prev + delta));
  };

  const handleCartReflect = () => {
    console.group("🛒 장바구니 수량 반영");
    console.log("포함 구성원 수", familyMembers.filter((m) => m.include_in_unified_diet !== false).length);
    console.log("장바구니 수량", servingCount);
    console.groupEnd();
    alert(`장바구니 수량을 ${servingCount}인분 기준으로 설정했습니다.`);
  };

  return (
    <div className="space-y-6" id="unified-diet-section">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            가족 통합 식단
          </h2>
          <Badge variant="secondary" className="ml-2">
            {includedMembers.length}명 포함
          </Badge>
        </div>

        {onRegenerate && (
          <Button
            onClick={onRegenerate}
            disabled={regenerating}
            variant="outline"
            size="sm"
          >
            {regenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                식단 재생성
              </>
            )}
          </Button>
        )}
      </div>

      {/* 구성원 포함/제외 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">통합 식단 포함 구성원</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 포함된 구성원들 */}
            {includedMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  포함됨 ({includedMembers.length}명)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {includedMembers.map((member) => {
                    const { years: age } = calculateAge(member.birth_date);
                    const isToggling = togglingMembers.has(member.id);

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">{member.name}</p>
                            <p className="text-sm text-green-700">{age}세</p>
                          </div>
                        </div>
                        <Switch
                          checked={true}
                          onCheckedChange={() => toggleMemberInclusion(member.id)}
                          disabled={isToggling}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 제외된 구성원들 */}
            {excludedMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  제외됨 ({excludedMembers.length}명)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {excludedMembers.map((member) => {
                    const { years: age } = calculateAge(member.birth_date);
                    const isToggling = togglingMembers.has(member.id);

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-900">{member.name}</p>
                            <p className="text-sm text-red-700">{age}세</p>
                          </div>
                        </div>
                        <Switch
                          checked={false}
                          onCheckedChange={() => toggleMemberInclusion(member.id)}
                          disabled={isToggling}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {familyMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>가족 구성원이 없습니다.</p>
                <p className="text-sm mt-1">가족 관리 페이지에서 구성원을 추가해주세요.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 통합 식단 내용 */}
      {unifiedDiet ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🍽️ 가족 모두가 함께 먹을 수 있는 식단
              <Badge variant="default" className="bg-orange-500">
                통합 식단
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">
                고려된 제약 조건
              </h4>
              <div className="text-sm text-orange-800">
                <p>• 모든 포함된 구성원의 질병 및 알레르기 고려</p>
                <p>• 평균 칼로리 목표에 맞춘 영양 균형</p>
                <p>• 어린이 구성원이 있는 경우 성장기 영양 고려</p>
              </div>
            </div>

            <DailyDietView
              diet={unifiedDiet}
            />

            <div className="mt-6 rounded-xl border border-dashed border-orange-300 bg-orange-50/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-900">
                    장바구니 재료 수량 조정
                  </p>
                  <p className="text-xs text-orange-700">
                    통합 식단 포함 {includedMembers.length}명 기준 • 1인분을 단위로 조정할 수 있습니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustServingCount(-1)}
                    aria-label="수량 감소"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[48px] text-center text-xl font-bold text-orange-700">
                    {servingCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustServingCount(1)}
                    aria-label="수량 증가"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={handleCartReflect}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    장바구니 반영
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                통합 식단이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                가족 구성원을 통합 식단에 포함시키고 식단을 생성해보세요.
              </p>
              {onRegenerate && (
                <Button
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {regenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      🍽️ 통합 식단 생성하기
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
