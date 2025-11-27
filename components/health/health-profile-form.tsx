/**
 * @file health-profile-form.tsx
 * @description 건강 정보 입력 폼 컴포넌트
 *
 * 주요 기능:
 * 1. 기본 정보 입력
 * 2. 질병/알레르기 다중 선택
 * 3. 선호/비선호 식재료 입력
 * 4. 폼 검증 및 제출
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import {
  UserHealthProfile,
  Gender,
  ActivityLevel,
  Disease,
  Allergy,
  DISEASE_LABELS,
  ALLERGY_LABELS,
  ACTIVITY_LEVEL_LABELS,
} from "@/types/health";

export function HealthProfileForm() {
  const router = useRouter();
  const { user } = useUser();

  const [formData, setFormData] = useState<Partial<UserHealthProfile>>({
    age: null,
    gender: null,
    height_cm: null,
    weight_kg: null,
    activity_level: null,
    daily_calorie_goal: 2000,
    diseases: [],
    allergies: [],
    preferred_ingredients: [],
    disliked_ingredients: [],
  });

  const [preferredIngredient, setPreferredIngredient] = useState("");
  const [dislikedIngredient, setDislikedIngredient] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // 기존 건강 정보 로드
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadHealthProfile = async () => {
      try {
        console.group("[HealthProfile] 기존 정보 로드");
        console.log("Clerk User ID:", user.id);

        // API를 통해 건강 프로필 조회
        const response = await fetch("/api/health/profile");

        console.log("API 응답 상태:", response.status);

        if (!response.ok) {
          console.warn("⚠️ 건강 정보를 불러올 수 없습니다. 신규 사용자이거나 아직 입력하지 않은 것 같습니다.");
          console.groupEnd();
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        console.log("건강 프로필 조회 결과:", result);

        if (result.profile) {
          console.log("✅ 기존 건강 정보 로드 성공");
          setFormData(result.profile);
        } else {
          console.log("ℹ️ 건강 정보가 없습니다. 새로 입력해주세요.");
        }

        console.groupEnd();
      } catch (err) {
        console.error("❌ 로드 중 오류:", err);
        console.groupEnd();
      } finally {
        setIsLoading(false);
      }
    };

    loadHealthProfile();
  }, [user]);

  const handleToggleDisease = (disease: Disease) => {
    setFormData((prev) => {
      const diseases = prev.diseases || [];
      const newDiseases = diseases.includes(disease)
        ? diseases.filter((d) => d !== disease)
        : [...diseases, disease];
      return { ...prev, diseases: newDiseases };
    });
  };

  const handleToggleAllergy = (allergy: Allergy) => {
    setFormData((prev) => {
      const allergies = prev.allergies || [];
      const newAllergies = allergies.includes(allergy)
        ? allergies.filter((a) => a !== allergy)
        : [...allergies, allergy];
      return { ...prev, allergies: newAllergies };
    });
  };

  const handleAddPreferredIngredient = () => {
    if (preferredIngredient.trim()) {
      setFormData((prev) => ({
        ...prev,
        preferred_ingredients: [
          ...(prev.preferred_ingredients || []),
          preferredIngredient.trim(),
        ],
      }));
      setPreferredIngredient("");
    }
  };

  const handleRemovePreferredIngredient = (ingredient: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_ingredients: (prev.preferred_ingredients || []).filter(
        (i) => i !== ingredient
      ),
    }));
  };

  const handleAddDislikedIngredient = () => {
    if (dislikedIngredient.trim()) {
      setFormData((prev) => ({
        ...prev,
        disliked_ingredients: [
          ...(prev.disliked_ingredients || []),
          dislikedIngredient.trim(),
        ],
      }));
      setDislikedIngredient("");
    }
  };

  const handleRemoveDislikedIngredient = (ingredient: string) => {
    setFormData((prev) => ({
      ...prev,
      disliked_ingredients: (prev.disliked_ingredients || []).filter(
        (i) => i !== ingredient
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("로그인이 필요합니다");
      return;
    }

    console.group("[HealthProfile] 건강 정보 저장");
    console.log("Clerk User ID:", user.id);
    console.log("Clerk User Email:", user.primaryEmailAddress?.emailAddress);
    setIsSubmitting(true);

    try {
      // 1. 먼저 API를 통해 사용자 존재 확인 및 생성
      console.log("🔍 사용자 존재 확인 중...");
      console.log("API 호출: POST /api/users/ensure");
      
      const ensureResponse = await fetch("/api/users/ensure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 응답 상태:", ensureResponse.status, ensureResponse.statusText);
      console.log("📡 응답 헤더:", Object.fromEntries(ensureResponse.headers.entries()));

      if (!ensureResponse.ok) {
        let errorData;
        try {
          errorData = await ensureResponse.json();
        } catch (jsonError) {
          console.error("❌ 응답을 JSON으로 파싱할 수 없습니다:", jsonError);
          throw new Error(`서버 응답 오류 (상태 코드: ${ensureResponse.status})`);
        }
        
        console.error("❌ 사용자 확인/생성 실패 (상태 코드:", ensureResponse.status, ")");
        console.error("❌ 오류 데이터:", errorData);
        
        // 상세한 에러 메시지 생성
        let errorMessage = "사용자 정보를 확인할 수 없습니다.";
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.details) {
          errorMessage = errorData.details;
        }
        
        if (errorData.hint) {
          errorMessage += ` (힌트: ${errorData.hint})`;
        }
        
        throw new Error(errorMessage);
      }

      const ensureData = await ensureResponse.json();
      console.log("✅ 사용자 확인/생성 성공:", ensureData);

      if (!ensureData.userId) {
        console.error("❌ 응답에 userId가 없습니다:", ensureData);
        throw new Error("서버에서 사용자 ID를 반환하지 않았습니다.");
      }

      const supabaseUserId = ensureData.userId;
      console.log("✅ Supabase User ID:", supabaseUserId);

      if (ensureData.created) {
        console.log("📝 새 사용자가 생성되었습니다!");
      } else {
        console.log("ℹ️ 기존 사용자 정보를 사용합니다.");
      }

      // 2. 건강 정보 저장
      await saveHealthProfile(supabaseUserId);
    } catch (err) {
      console.error("❌ 저장 중 오류 발생:");
      console.error("  - Error Type:", err instanceof Error ? "Error" : typeof err);
      console.error("  - Error Value:", err);
      
      // 사용자 친화적인 오류 메시지
      let errorMessage = "건강 정보 저장에 실패했습니다.";
      
      if (err instanceof Error) {
        if (err.message.includes("사용자") || err.message.includes("User")) {
          errorMessage = "사용자 정보를 확인할 수 없습니다. 페이지를 새로고침하거나 로그아웃 후 다시 로그인해주세요.";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMessage = "네트워크 연결을 확인해주세요.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
      console.groupEnd();
    }
  };

  // 건강 정보 저장 헬퍼 함수
  const saveHealthProfile = async (supabaseUserId: string) => {
    try {
      console.log("💾 건강 정보 저장 중...");
      console.log("📋 Supabase User ID:", supabaseUserId);
      console.log("📋 저장할 데이터:", formData);

      const dataToSave = {
        age: formData.age || null,
        gender: formData.gender || null,
        height_cm: formData.height_cm || null,
        weight_kg: formData.weight_kg || null,
        activity_level: formData.activity_level || null,
        daily_calorie_goal: formData.daily_calorie_goal || 2000,
        diseases: formData.diseases || [],
        allergies: formData.allergies || [],
        preferred_ingredients: formData.preferred_ingredients || [],
        disliked_ingredients: formData.disliked_ingredients || [],
      };

      console.log("📤 API로 전송할 데이터:", dataToSave);

      // API를 통해 저장 (클라이언트에서 직접 Supabase 접근 대신)
      const response = await fetch("/api/health/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      console.log("📡 API 응답 상태:", response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error("❌ 응답을 JSON으로 파싱할 수 없습니다:", jsonError);
          console.error("📡 응답 텍스트 (디버깅용):", await response.text());
          throw new Error(`서버 응답 오류 (상태 코드: ${response.status})`);
        }

        console.error("❌ 건강 정보 저장 실패 (상태 코드:", response.status, ")");
        console.error("❌ 오류 데이터:", errorData);

        const errorMessage = errorData.error || errorData.message || "건강 정보 저장 중 오류가 발생했습니다.";
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("❌ 성공 응답을 JSON으로 파싱할 수 없습니다:", jsonError);
        console.error("📡 응답 텍스트 (디버깅용):", await response.text());
        throw new Error("서버에서 잘못된 응답을 받았습니다");
      }
      console.log("✅ 건강 정보 저장 성공!");
      console.log("✅ 저장된 데이터:", result);
      console.groupEnd();

      // 성공 상태 설정
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      console.error("❌ saveHealthProfile 오류:");
      console.error("  - Error Type:", typeof err);
      console.error("  - Error Object:", err);
      
      if (err instanceof Error) {
        console.error("  - Error Message:", err.message);
        console.error("  - Error Stack:", err.stack);
      }
      
      throw err; // 상위 catch로 전파
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <p className="text-muted-foreground mb-4">
          건강 정보를 입력하려면 로그인이 필요합니다
        </p>
        <Button onClick={() => router.push("/sign-in")}>로그인하기</Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {isSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <div className="mb-4">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              건강 정보가 성공적으로 저장되었습니다!
            </h3>
            <p className="text-green-700">
              이제 AI가 당신만을 위한 맞춤 식단을 큐레이션해드릴게요.
            </p>
          </div>
          <Button
            onClick={() => router.push("/diet")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            <Save className="h-5 w-5 mr-2" />
            AI 맞춤 식단 큐레이션 생성하기
          </Button>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">기본 정보</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="age">나이</Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="120"
              value={formData.age || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  age: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="gender">성별</Label>
            <select
              id="gender"
              value={formData.gender || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  gender: (e.target.value || null) as Gender | null,
                }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">선택 안함</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <Label htmlFor="height">키 (cm)</Label>
            <Input
              id="height"
              type="number"
              min="50"
              max="250"
              value={formData.height_cm || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  height_cm: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="weight">몸무게 (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="10"
              max="300"
              step="0.1"
              value={formData.weight_kg || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  weight_kg: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="activity">활동량</Label>
            <select
              id="activity"
              value={formData.activity_level || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  activity_level: (e.target.value || null) as ActivityLevel | null,
                }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">선택 안함</option>
              {Object.entries(ACTIVITY_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="calorieGoal">일일 칼로리 목표 (kcal)</Label>
            <Input
              id="calorieGoal"
              type="number"
              min="1000"
              max="5000"
              value={formData.daily_calorie_goal || 2000}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  daily_calorie_goal: parseInt(e.target.value) || 2000,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 질병 정보 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">질병 정보</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DISEASE_LABELS).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={
                formData.diseases?.includes(value as Disease)
                  ? "default"
                  : "outline"
              }
              onClick={() => handleToggleDisease(value as Disease)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* 알레르기 정보 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">알레르기 정보</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ALLERGY_LABELS).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={
                formData.allergies?.includes(value as Allergy)
                  ? "default"
                  : "outline"
              }
              onClick={() => handleToggleAllergy(value as Allergy)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* 선호 식재료 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">선호 식재료</h2>
        <div className="flex gap-2">
          <Input
            value={preferredIngredient}
            onChange={(e) => setPreferredIngredient(e.target.value)}
            placeholder="예: 닭고기, 브로콜리"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPreferredIngredient();
              }
            }}
          />
          <Button type="button" onClick={handleAddPreferredIngredient}>
            추가
          </Button>
        </div>
        {formData.preferred_ingredients && formData.preferred_ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.preferred_ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
              >
                {ingredient}
                <button
                  type="button"
                  onClick={() => handleRemovePreferredIngredient(ingredient)}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 비선호 식재료 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">비선호 식재료</h2>
        <div className="flex gap-2">
          <Input
            value={dislikedIngredient}
            onChange={(e) => setDislikedIngredient(e.target.value)}
            placeholder="예: 당근, 가지"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDislikedIngredient();
              }
            }}
          />
          <Button type="button" onClick={handleAddDislikedIngredient}>
            추가
          </Button>
        </div>
        {formData.disliked_ingredients && formData.disliked_ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.disliked_ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
              >
                {ingredient}
                <button
                  type="button"
                  onClick={() => handleRemoveDislikedIngredient(ingredient)}
                  className="hover:text-red-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "저장 중..." : "건강 정보 저장"}
        </Button>
      </div>
    </form>
  );
}

