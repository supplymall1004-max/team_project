/**
 * @file components/family/family-member-list.tsx
 * @description 가족 구성원 목록 컴포넌트
 */

"use client";

import { useEffect, useState } from "react";
import type { FamilyMember } from "@/types/family";
import { FamilyMemberCard } from "./family-member-card";
import { FamilyMemberForm } from "./family-member-form";
import { Plus, RotateCcw } from "lucide-react";

interface FamilyMemberListProps {
  members: FamilyMember[];
  maxMembers: number;
  currentPlan: string;
  onRefresh: () => void;
  onReset?: () => void;
}

export function FamilyMemberList({
  members,
  maxMembers,
  currentPlan,
  onRefresh,
  onReset,
}: FamilyMemberListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const isPlanLimitDisabled =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DISABLE_PLAN_LIMIT === "true";
  const canAddMore = isPlanLimitDisabled || members.length < maxMembers;
  const showPlanBanner = !isPlanLimitDisabled && !canAddMore;

  useEffect(() => {
    if (!isPlanLimitDisabled) return;
    console.group("[FamilyMemberLimit]");
    console.log("plan-limit-bypass-active", {
      members: members.length,
      maxMembers,
      currentPlan,
    });
    console.groupEnd();
  }, [isPlanLimitDisabled, members.length, maxMembers, currentPlan]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">가족 구성원 관리</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            현재 {members.length}명 / 최대 {maxMembers}명 ({currentPlan} 플랜)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              title="데이터베이스 초기화 후 다시 불러오기"
            >
              <RotateCcw className="h-5 w-5" />
              초기화
            </button>
          )}
          <button
            onClick={() => setIsFormOpen(true)}
            disabled={!canAddMore}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <Plus className="h-5 w-5" />
            구성원 추가
          </button>
        </div>
      </div>

      {/* 구독 업그레이드 안내 */}
      {showPlanBanner && (
        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ 구독 플랜 제한에 도달했습니다. 더 많은 가족 구성원을 추가하려면
            플랜을 업그레이드하세요.
          </p>
        </div>
      )}
      {isPlanLimitDisabled && (
        <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            개발 모드에서는 구독 플랜 제한이 적용되지 않습니다. 구성원을 자유롭게
            추가해 테스트하세요.
          </p>
        </div>
      )}

      {/* 구성원 그리드 */}
      {members.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            아직 등록된 가족 구성원이 없습니다
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="text-blue-600 hover:underline"
          >
            첫 번째 구성원 추가하기 →
          </button>
        </div>
      )}

      {/* 추가 폼 모달 */}
      {isFormOpen && (
        <FamilyMemberForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

