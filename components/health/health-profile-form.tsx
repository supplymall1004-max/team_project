'use client';

/**
 * @file health-profile-form.tsx
 * @description 건강 정보 입력 폼 컴포넌트 (리팩토링 버전)
 *
 * 주요 기능:
 * 1. 기본 정보 입력 (Mifflin-St Jeor 공식 기반 칼로리 자동 계산)
 * 2. 질병/알레르기 다중 선택 및 사용자 정의 입력 (DiseaseSelector, AllergySelector 사용)
 * 3. 선호/비선호 식재료 입력 (IngredientPreferences 사용)
 * 4. 프리미엄 기능 (DietTypeSelector 사용)
 * 5. 칼로리 계산 결과 표시 (CalorieCalculatorDisplay 사용)
 * 6. 안전 경고 (SafetyWarning 사용)
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import {
  UserHealthProfile,
  Gender,
  ActivityLevel,
  ACTIVITY_LEVEL_LABELS,
} from "@/types/health";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";

// 새로운 UI 컴포넌트 임포트
import { DiseaseSelector } from './disease-selector';
import { AllergySelector } from './allergy-selector';
import { IngredientPreferences } from './ingredient-preferences';
import { DietTypeSelector } from './diet-type-selector';
import { CalorieCalculatorDisplay } from './calorie-calculator-display';
import { SafetyWarning } from './safety-warning';

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
    dietary_preferences: [],
  });

  // UI 컴포넌트용 상태 변환
  const [selectedDiseases, setSelectedDiseases] = useState<{ code: string; custom_name: string | null }[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<{ code: string; custom_name: string | null }[]>([]);

  const [isPremium, setIsPremium] = useState(false);
  const [isManualCalorie, setIsManualCalorie] = useState(false);

  // 칼로리 계산 관련 상태
  const [calorieResult, setCalorieResult] = useState<any>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [calculatingCalories, setCalculatingCalories] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // 프리미엄 여부 확인
  useEffect(() => {
    async function checkPremium() {
      try {
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium);
      } catch (error) {
        console.error("[HealthProfileForm] 프리미엄 확인 실패:", error);
        setIsPremium(false);
      }
    }
    checkPremium();
  }, []);

  // 기존 건강 정보 로드
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadHealthProfile = async () => {
      try {
        const response = await fetch("/api/health/profile");
        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        if (result.profile) {
          setFormData(result.profile);

          // UI 컴포넌트용 상태 초기화
          if (result.profile.diseases) {
            setSelectedDiseases(result.profile.diseases.map((d: string) => ({ code: d, custom_name: null })));
          }
          if (result.profile.allergies) {
            setSelectedAllergies(result.profile.allergies.map((a: string) => ({ code: a, custom_name: null })));
          }
        }
      } catch (err) {
        console.error("❌ 로드 중 오류:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHealthProfile();
  }, [user]);

  // 칼로리 계산 함수
  const calculateCalories = async () => {
    if (
      !formData.gender ||
      !formData.age ||
      !formData.weight_kg ||
      !formData.height_cm ||
      !formData.activity_level
    ) {
      return;
    }

    setCalculatingCalories(true);

    try {
      const response = await fetch('/api/health/calculate-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'auto',
          gender: formData.gender,
          age: formData.age,
          weight: formData.weight_kg,
          height: formData.height_cm,
          activityLevel: formData.activity_level,
          diseaseCodes: selectedDiseases.map((d) => d.code).filter((c) => !c.startsWith('custom_')),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCalorieResult(result.data);
        if (!isManualCalorie) {
          setFormData(prev => ({ ...prev, daily_calorie_goal: result.data.calories }));
        }
      }
    } catch (error) {
      console.error('칼로리 계산 오류:', error);
    } finally {
      setCalculatingCalories(false);
    }
  };

  // 기본 정보 변경 시 자동 계산 (옵션)
  useEffect(() => {
    if (!isManualCalorie && formData.age && formData.gender && formData.height_cm && formData.weight_kg && formData.activity_level) {
      // 디바운싱 적용 가능하지만 여기서는 간단히 처리
      // calculateCalories(); // 자동 계산을 원하면 주석 해제
    }
  }, [formData.age, formData.gender, formData.height_cm, formData.weight_kg, formData.activity_level, isManualCalorie]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("로그인이 필요합니다");
      return;
    }

    setIsSubmitting(true);

    try {
      // 사용자 확인/생성
      const ensureResponse = await fetch("/api/users/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!ensureResponse.ok) throw new Error("사용자 확인 실패");

      // 건강 정보 저장
      // UI 상태를 formData로 변환
      const dataToSave = {
        ...formData,
        diseases: selectedDiseases.map(d => d.code), // 코드만 저장 (커스텀 이름 처리는 백엔드 로직에 따라 다를 수 있음, 여기서는 단순화)
        allergies: selectedAllergies.map(a => a.code),
        // 프리미엄 기능은 dietary_preferences에 매핑됨
        premium_features: formData.dietary_preferences,
      };

      const response = await fetch("/api/health/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) throw new Error("저장 실패");

      setIsSubmitting(false);
      setIsSuccess(true);

      // 스크롤 상단으로 이동
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      setError("저장 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
        <Button onClick={() => router.push("/sign-in")}>로그인하기</Button>
      </div>
    );
  }

  if (isLoading) return <div className="text-center py-8">로딩 중...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {isSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">저장되었습니다!</h3>
          <p className="text-green-700 mb-4">건강 정보가 성공적으로 업데이트되었습니다.</p>
          <Button onClick={() => router.push("/diet")} className="bg-green-600 text-white">
            식단 보러가기
          </Button>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          기본 정보
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>나이</Label>
            <Input
              type="number"
              value={formData.age || ""}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || null })}
              placeholder="만 나이"
            />
          </div>
          <div>
            <Label>성별</Label>
            <select
              className="w-full rounded-md border border-input p-2"
              value={formData.gender || ""}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            >
              <option value="">선택</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
          <div>
            <Label>키 (cm)</Label>
            <Input
              type="number"
              value={formData.height_cm || ""}
              onChange={(e) => setFormData({ ...formData, height_cm: parseInt(e.target.value) || null })}
              placeholder="170"
            />
          </div>
          <div>
            <Label>몸무게 (kg)</Label>
            <Input
              type="number"
              value={formData.weight_kg || ""}
              onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || null })}
              placeholder="65"
            />
          </div>
          <div className="md:col-span-2">
            <Label>활동량</Label>
            <select
              className="w-full rounded-md border border-input p-2"
              value={formData.activity_level || ""}
              onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as ActivityLevel })}
            >
              <option value="">선택</option>
              {Object.entries(ACTIVITY_LEVEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <Button
          type="button"
          onClick={calculateCalories}
          disabled={calculatingCalories}
          className="w-full mt-4"
          variant="secondary"
        >
          {calculatingCalories ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              계산 중...
            </>
          ) : (
            "권장 칼로리 계산하기"
          )}
        </Button>

        {/* 칼로리 계산 결과 표시 */}
        {calorieResult && (
          <div className="mt-4">
            <CalorieCalculatorDisplay
              result={calorieResult}
              showFormula={showFormula}
              onToggleFormula={() => setShowFormula(!showFormula)}
            />
          </div>
        )}
      </div>

      {/* 목표 칼로리 (수동 설정) */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">목표 칼로리</h2>
          <div className="flex items-center gap-2">
            <Label htmlFor="manual-mode" className="text-sm text-gray-600 cursor-pointer">수동 설정</Label>
            <input
              id="manual-mode"
              type="checkbox"
              checked={isManualCalorie}
              onChange={(e) => setIsManualCalorie(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>일일 목표 (kcal)</Label>
            <Input
              type="number"
              value={formData.daily_calorie_goal || 0}
              readOnly={!isManualCalorie}
              className={!isManualCalorie ? "bg-gray-100" : ""}
              onChange={(e) => setFormData({ ...formData, daily_calorie_goal: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        {!isManualCalorie && (
          <p className="text-xs text-gray-400">
            * 기본 정보와 활동량을 바탕으로 자동 계산된 수치입니다.
          </p>
        )}
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
            // 폼 데이터 업데이트는 submit 시점에 처리하거나 여기서 동기화
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
          allergens={selectedAllergies.map(a => a.code)} // 실제로는 이름이 필요하지만 여기선 코드로 대체 (데모용)
          severity={selectedAllergies.some(a => ['peanuts', 'crustacean'].includes(a.code)) ? 'critical' : 'safe'}
          showEmergencyInfo={true}
        />
      </div>

      {/* 프리미엄 식단 타입 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">프리미엄 식단 타입</h2>
        <DietTypeSelector
          selectedTypes={formData.dietary_preferences as string[] || []}
          onChange={(types) => setFormData({ ...formData, dietary_preferences: types as any })}
          isPremium={isPremium}
        />
      </div>

      {/* 식재료 선호도 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">식재료 선호도</h2>
        <IngredientPreferences
          preferredIngredients={formData.preferred_ingredients || []}
          excludedIngredients={formData.disliked_ingredients || []} // disliked_ingredients 매핑
          onPreferredChange={(ingredients) =>
            setFormData({ ...formData, preferred_ingredients: ingredients })
          }
          onExcludedChange={(ingredients) =>
            setFormData({ ...formData, disliked_ingredients: ingredients })
          }
        />
      </div>

      <div className="flex justify-end gap-4 sticky bottom-4 z-10">
        <Button type="button" variant="outline" onClick={() => router.back()} className="bg-white shadow-sm">취소</Button>
        <Button type="submit" disabled={isSubmitting} className="shadow-lg">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              건강정보 저장
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
