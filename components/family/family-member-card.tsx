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
import { Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { FamilyMemberForm } from "./family-member-form";
import { FamilyMemberIdentityVerification } from "@/components/health/family-member-identity-verification";
import { FamilyMemberHealthSyncButton } from "@/components/health/family-member-health-sync-button";

interface FamilyMemberCardProps {
  member: FamilyMember;
  onRefresh: () => void;
}

export function FamilyMemberCard({ member, onRefresh }: FamilyMemberCardProps) {
  const { getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHealthSection, setShowHealthSection] = useState(false);

  const { years, isChild } = calculateAge(member.birth_date);
  const healthSummary = getHealthSummary(member.diseases, member.allergies);

  const handleDelete = async () => {
    if (!confirm(`정말 ${member.name}님을 삭제하시겠습니까?`)) return;

    setIsDeleting(true);
    let groupOpened = false;
    
    try {
      console.group("🗑️ 가족 구성원 삭제");
      groupOpened = true;
      
      console.log("구성원 ID:", member.id);
      console.log("구성원 이름:", member.name);
      
      const token = await getToken();
      if (!token) {
        throw new Error("인증 토큰을 가져올 수 없습니다.");
      }
      
      const response = await fetch(`/api/family/members/${member.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("응답 상태:", response.status, response.statusText);
      console.log("응답 헤더:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorData: Record<string, unknown> = {};
        
        try {
          const responseText = await response.text();
          console.log("응답 본문 (원본):", responseText);
          console.log("응답 본문 길이:", responseText.length);
          console.log("Content-Type:", contentType);
          
          if (contentType?.includes("application/json") && responseText.trim()) {
            try {
              errorData = JSON.parse(responseText) as Record<string, unknown>;
              console.log("파싱된 에러 데이터:", errorData);
            } catch (jsonError) {
              console.error("JSON 파싱 실패:", jsonError);
              errorData = { message: responseText || "삭제 실패" };
            }
          } else if (responseText.trim()) {
            errorData = { message: responseText };
          } else {
            // 상태 코드에 따른 기본 메시지
            const statusMessages: Record<number, string> = {
              400: "잘못된 요청입니다.",
              401: "인증이 필요합니다.",
              403: "권한이 없습니다.",
              404: "가족 구성원을 찾을 수 없습니다.",
              500: "서버 오류가 발생했습니다.",
            };
            errorData = { 
              message: statusMessages[response.status] || "삭제에 실패했습니다.",
              error: `HTTP ${response.status}`,
              status: response.status,
              statusText: response.statusText
            };
          }
        } catch (parseError) {
          console.error("응답 파싱 실패:", parseError);
          errorData = { 
            message: "삭제에 실패했습니다.",
            error: "응답 파싱 오류",
            parseError: parseError instanceof Error ? parseError.message : String(parseError)
          };
        }
        
        console.error("❌ 삭제 실패:");
        console.error("  - 상태 코드:", response.status);
        console.error("  - 상태 텍스트:", response.statusText);
        console.error("  - 에러 데이터:", JSON.stringify(errorData, null, 2));
        console.error("  - 요청 URL:", `/api/family/members/${member.id}`);
        console.error("  - 구성원 ID:", member.id);
        console.error("  - 구성원 ID 타입:", typeof member.id);
        
        const errorMessage = 
          (typeof errorData.message === "string" ? errorData.message : null) ||
          (typeof errorData.error === "string" ? errorData.error : null) ||
          (typeof errorData.details === "string" ? errorData.details : null) ||
          `삭제에 실패했습니다. (상태 코드: ${response.status})`;
        
        throw new Error(errorMessage);
      }

      console.log("✅ 삭제 성공");
      onRefresh();
    } catch (error) {
      console.error("❌ 삭제 실패 (catch 블록):");
      console.error("  - 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("  - 에러 메시지:", error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error("  - 스택 트레이스:", error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : "삭제에 실패했습니다.";
      alert(errorMessage);
    } finally {
      if (groupOpened) {
        console.groupEnd();
      }
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

        {/* 건강 정보 관리 섹션 */}
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            onClick={() => setShowHealthSection(!showHealthSection)}
            className="flex w-full items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <span>건강 정보 관리</span>
            {showHealthSection ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {showHealthSection && (
            <div className="mt-4 space-y-4">
              {/* 펫인 경우 신원확인 불필요 */}
              {member.relationship !== "pet" && (
                <FamilyMemberIdentityVerification
                  member={member}
                  onVerified={() => {
                    // 신원확인 완료 후 새로고침
                    onRefresh();
                  }}
                />
              )}
              <FamilyMemberHealthSyncButton
                member={member}
                onSyncComplete={() => {
                  // 동기화 완료 후 새로고침
                  onRefresh();
                }}
              />
            </div>
          )}
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

