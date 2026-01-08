/**
 * @file components/family/family-member-form.tsx
 * @description 가족 구성원 추가/수정 폼
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import type { FamilyMember } from "@/types/family";
import { X } from "lucide-react";
import { DiseaseSelector } from "@/components/health/disease-selector";
import { AllergySelector } from "@/components/health/allergy-selector";
import { SafetyWarning } from "@/components/health/safety-warning";

interface FamilyMemberFormProps {
  member?: FamilyMember;
  onClose: () => void;
  onSuccess: () => void;
}

export function FamilyMemberForm({
  member,
  onClose,
  onSuccess,
}: FamilyMemberFormProps) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: member?.name || "",
    birth_date: member?.birth_date || "",
    gender: member?.gender || "male",
    relationship: member?.relationship || "child",
    height_cm: member?.height_cm?.toString() || "",
    weight_kg: member?.weight_kg?.toString() || "",
    activity_level: member?.activity_level || "sedentary",
  });

  // DiseaseSelector와 AllergySelector용 상태 (형식: { code: string, custom_name: string | null }[])
  const [selectedDiseases, setSelectedDiseases] = useState<{ code: string; custom_name: string | null }[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<{ code: string; custom_name: string | null }[]>([]);

  // 기존 데이터를 새 형식으로 변환 (초기화)
  useEffect(() => {
    if (member) {
      // 기존 diseases (string[])를 selectedDiseases 형식으로 변환
      const diseases = Array.isArray(member.diseases) ? member.diseases : [];
      setSelectedDiseases(
        diseases.map((code) => ({
          code: typeof code === 'string' ? code : String(code),
          custom_name: null,
        }))
      );

      // 기존 allergies (string[])를 selectedAllergies 형식으로 변환
      const allergies = Array.isArray(member.allergies) ? member.allergies : [];
      setSelectedAllergies(
        allergies.map((code) => ({
          code: typeof code === 'string' ? code : String(code),
          custom_name: null,
        }))
      );
    } else {
      // 새 구성원인 경우 빈 배열로 초기화
      setSelectedDiseases([]);
      setSelectedAllergies([]);
    }
  }, [member]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.group("📝 가족 구성원 폼 제출");
      const token = await getToken();
      const url = member
        ? `/api/family/members/${member.id}`
        : "/api/family/members";
      const method = member ? "PUT" : "POST";

      // selectedDiseases와 selectedAllergies를 string[] 형식으로 변환 (API가 기대하는 형식)
      const diseasesArray = selectedDiseases.map((d) => d.code);
      const allergiesArray = selectedAllergies.map((a) => a.code);

      const requestData = {
        ...formData,
        diseases: diseasesArray,
        allergies: allergiesArray,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg
          ? parseFloat(formData.weight_kg)
          : null,
      };

      console.log("요청 URL:", url);
      console.log("요청 메서드:", method);
      console.log("구성원 객체:", member ? JSON.stringify(member, null, 2) : "없음 (새 구성원)");
      console.log("구성원 ID:", member?.id || "새 구성원");
      console.log("구성원 ID 타입:", typeof member?.id);
      console.log("요청 데이터:", requestData);
      console.log("토큰 존재 여부:", token ? "있음" : "없음");
      
      // 구성원 ID 검증
      if (member && !member.id) {
        console.error("❌ 구성원 ID가 없습니다!");
        console.error("  - member 객체:", member);
        throw new Error("구성원 ID가 없습니다. 페이지를 새로고침하고 다시 시도해주세요.");
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        });
      } catch (fetchError: any) {
        console.error("❌ 네트워크 에러:", fetchError);
        console.error("  - 에러 타입:", fetchError?.name);
        console.error("  - 에러 메시지:", fetchError?.message);
        console.groupEnd();
        throw new Error(`네트워크 오류: ${fetchError?.message || "요청을 전송할 수 없습니다"}`);
      }

      console.log("응답 상태:", response.status, response.statusText);
      console.log("응답 URL:", response.url);
      console.log("응답 헤더:", {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
        allHeaders: Object.fromEntries(response.headers.entries()),
      });

      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        // 에러 응답 처리
        console.log("❌ 에러 응답 받음");
        console.log("  - 상태 코드:", response.status);
        console.log("  - 상태 텍스트:", response.statusText);
        console.log("  - Content-Type:", contentType);
        console.log("  - 응답 URL:", response.url);
        
        let errorData: any = {};
        let responseText = "";
        
        try {
          responseText = await response.text();
          console.log("  - 응답 본문 길이:", responseText.length);
          console.log("  - 응답 본문 (전체):", responseText);
        } catch (textError) {
          console.error("  - 응답 본문 읽기 실패:", textError);
          responseText = "";
        }
        
        if (contentType?.includes("application/json") && responseText) {
          try {
            errorData = JSON.parse(responseText);
            console.log("  - 파싱된 JSON:", JSON.stringify(errorData, null, 2));
          } catch (parseError) {
            console.error("  - JSON 파싱 실패:", parseError);
            errorData = { 
              error: "응답 파싱 실패",
              rawResponse: responseText.substring(0, 200),
              parseError: parseError instanceof Error ? parseError.message : String(parseError)
            };
          }
        } else if (responseText) {
          errorData = { 
            error: responseText.substring(0, 200),
            rawResponse: responseText
          };
        } else {
          // 응답 본문이 없을 때 상태 코드 기반 메시지
          const statusMessages: Record<number, string> = {
            404: "요청한 리소스를 찾을 수 없습니다. 구성원이 삭제되었거나 권한이 없습니다.",
            401: "인증이 필요합니다. 로그인 상태를 확인해주세요.",
            403: "권한이 없습니다. 구독 플랜을 확인해주세요.",
            500: "서버 오류가 발생했습니다. 서버 로그를 확인해주세요.",
            502: "게이트웨이 오류가 발생했습니다.",
            503: "서비스를 사용할 수 없습니다.",
          };
          errorData = {
            error: statusMessages[response.status] || `저장 실패 (HTTP ${response.status})`,
            message: statusMessages[response.status] || `저장 실패 (HTTP ${response.status})`,
            status: response.status,
            statusText: response.statusText,
            url: response.url,
          };
        }
        
        console.error("❌ 최종 에러 데이터:", JSON.stringify(errorData, null, 2));
        console.error("❌ 요청 URL:", url);
        console.error("❌ 요청 메서드:", method);
        console.error("❌ 요청 데이터:", JSON.stringify(requestData, null, 2));
        console.groupEnd();
        
        // 더 명확한 에러 메시지 표시 (message 우선, 없으면 error 사용)
        const errorMessage = 
          (typeof errorData.message === "string" ? errorData.message : null) ||
          (typeof errorData.error === "string" ? errorData.error : null) ||
          (typeof errorData.details === "string" ? errorData.details : null) ||
          `저장 실패 (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      // 성공 응답 처리
      const responseText = await response.text();
      let result: any = {};
      
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ 성공 응답 JSON 파싱 실패:", parseError);
          result = { success: true };
        }
      }
      
      console.log("✅ 저장 성공:", result);
      console.groupEnd();

      onSuccess();
    } catch (error: any) {
      console.error("❌ 저장 실패:", error);
      console.groupEnd();
      alert(error.message || "저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {member ? "가족 구성원 수정" : "가족 구성원 추가"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="mb-1 block text-sm font-medium">이름 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          {/* 생년월일 */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              생년월일 *
            </label>
            <input
              type="date"
              required
              value={formData.birth_date}
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="mb-1 block text-sm font-medium">성별 *</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as any })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* 관계 */}
          <div>
            <label className="mb-1 block text-sm font-medium">관계 *</label>
            <select
              value={formData.relationship}
              onChange={(e) =>
                setFormData({ ...formData, relationship: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="spouse">배우자</option>
              <option value="child">자녀</option>
              <option value="parent">부모</option>
              <option value="sibling">형제/자매</option>
              <option value="grandparent">조부모</option>
              <option value="grandchild">손자/손녀</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* 신체 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">키 (cm)</label>
              <input
                type="number"
                min="50"
                max="250"
                value={formData.height_cm}
                onChange={(e) =>
                  setFormData({ ...formData, height_cm: e.target.value })
                }
                placeholder="예: 170"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">몸무게 (kg)</label>
              <input
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData({ ...formData, weight_kg: e.target.value })
                }
                placeholder="예: 65.5"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* 활동 수준 */}
          <div>
            <label className="mb-1 block text-sm font-medium">활동 수준</label>
            <select
              value={formData.activity_level}
              onChange={(e) =>
                setFormData({ ...formData, activity_level: e.target.value as any })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="sedentary">좌식 생활 (거의 운동 안 함)</option>
              <option value="light">가벼운 활동 (주 1-3회 가벼운 운동)</option>
              <option value="moderate">중간 활동 (주 3-5회 중간 강도 운동)</option>
              <option value="active">활발한 활동 (주 6회 이상 운동 또는 육체노동)</option>
              <option value="very_active">매우 활발한 활동 (하루 2회 이상 고강도 운동)</option>
            </select>
          </div>

          {/* 질병 정보 */}
          <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
            <h2 className="text-xl font-bold">질병 정보</h2>
            <p className="text-sm text-muted-foreground">
              보유하신 질병을 선택하면 해당 질병에 맞는 식단을 추천하고 칼로리를 조정합니다.
            </p>
            <DiseaseSelector
              selectedDiseases={selectedDiseases}
              onChange={(diseases) => {
                setSelectedDiseases(diseases);
              }}
            />
          </div>

          {/* 알레르기 정보 */}
          <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
            <h2 className="text-xl font-bold">알레르기 정보</h2>
            <p className="text-sm text-muted-foreground">
              알레르기가 있는 식재료를 선택하면 해당 식재료와 모든 파생 재료가 엄격하게 제외됩니다.
            </p>
            <AllergySelector
              selectedAllergies={selectedAllergies}
              onChange={(allergies) => setSelectedAllergies(allergies)}
            />

            {/* 안전 경고 표시 */}
            <SafetyWarning
              allergens={selectedAllergies.map(a => a.code)}
              severity={selectedAllergies.some(a => ['peanuts', 'crustacean'].includes(a.code)) ? 'critical' : 'safe'}
              showEmergencyInfo={true}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-6 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "저장 중..." : member ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

