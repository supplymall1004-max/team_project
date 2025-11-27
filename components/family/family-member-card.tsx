/**
 * @file components/family/family-member-card.tsx
 * @description 가족 구성원 카드 컴포넌트
 */

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { FamilyMember } from "@/types/family";
import { calculateAge } from "@/lib/utils/age-calculator";
import { getHealthSummary } from "@/lib/utils/health-labels";
import { ACTIVITY_LEVEL_LABELS } from "@/types/family";
import { Edit, Trash2 } from "lucide-react";
import { FamilyMemberForm } from "./family-member-form";

interface FamilyMemberCardProps {
  member: FamilyMember;
  onRefresh: () => void;
}

export function FamilyMemberCard({ member, onRefresh }: FamilyMemberCardProps) {
  const { getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { years, isChild } = calculateAge(member.birth_date);
  const healthSummary = getHealthSummary(member.diseases, member.allergies);

  const handleDelete = async () => {
    if (!confirm(`정말 ${member.name}님을 삭제하시겠습니까?`)) return;

    setIsDeleting(true);
    try {
      console.group("🗑️ 가족 구성원 삭제");
      console.log("구성원 ID:", member.id);
      console.log("구성원 이름:", member.name);
      
      const token = await getToken();
      const response = await fetch(`/api/family/members/${member.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("응답 상태:", response.status, response.statusText);

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorData: any = {};
        
        try {
          const responseText = await response.text();
          if (contentType?.includes("application/json") && responseText) {
            errorData = JSON.parse(responseText);
          } else {
            errorData = { message: responseText || "삭제 실패" };
          }
        } catch (parseError) {
          console.error("응답 파싱 실패:", parseError);
          errorData = { message: "삭제 실패" };
        }
        
        console.error("❌ 삭제 실패:", errorData);
        console.groupEnd();
        
        const errorMessage = errorData.message || errorData.error || "삭제에 실패했습니다.";
        throw new Error(errorMessage);
      }

      console.log("✅ 삭제 성공");
      console.groupEnd();
      onRefresh();
    } catch (error) {
      console.error("❌ 삭제 실패:", error);
      console.groupEnd();
      const errorMessage = error instanceof Error ? error.message : "삭제에 실패했습니다.";
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">{member.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {member.relationship} • {years}세
              {isChild && " (어린이)"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              기본 정보
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {member.gender === "male" ? "남성" :
               member.gender === "female" ? "여성" :
               member.gender === "other" ? "기타" : "성별 미입력"}
              {member.birth_date && ` • ${member.birth_date}`}
            </p>
          </div>

          {(member.height_cm || member.weight_kg) && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                신체 정보
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {member.height_cm ? `${member.height_cm}cm` : ""}
                {member.height_cm && member.weight_kg ? " • " : ""}
                {member.weight_kg ? `${member.weight_kg}kg` : ""}
              </p>
            </div>
          )}

          {member.activity_level && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                활동 수준
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {ACTIVITY_LEVEL_LABELS[member.activity_level] || member.activity_level}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              건강 상태
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {healthSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 수정 폼 모달 */}
      {isEditing && (
        <FamilyMemberForm
          member={member}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

