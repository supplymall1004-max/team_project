/**
 * @file actions/health/profile.ts
 * @description 건강 프로필 Server Actions
 *
 * 건강 프로필 조회, 생성, 수정을 위한 Server Actions입니다.
 * 기존 /api/health/profile API Route를 Server Actions로 마이그레이션했습니다.
 *
 * 주요 기능:
 * 1. 건강 프로필 조회 (getHealthProfile)
 * 2. 건강 프로필 생성 (createHealthProfile)
 * 3. 건강 프로필 수정 (updateHealthProfile)
 *
 * @dependencies
 * - @clerk/nextjs/server: auth
 * - @/lib/supabase/service-role: getServiceRoleClient
 * - @/lib/supabase/ensure-user: ensureSupabaseUser
 * - @/types/health: UserHealthProfile
 */

"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { UserHealthProfile } from "@/types/health";

/**
 * 건강 프로필 조회
 *
 * @returns 건강 프로필 데이터 또는 null (프로필이 없는 경우)
 * @throws 인증 실패 또는 데이터베이스 오류 시 에러 발생
 */
export async function getHealthProfile(): Promise<UserHealthProfile | null> {
  try {
    console.group("📋 [getHealthProfile] 건강 프로필 조회 시작");

    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패 - userId가 null");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    console.log("🔐 인증된 사용자 ID:", userId);

    // 사용자 확인 및 자동 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      throw new Error("사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.");
    }

    console.log("✅ 사용자 확인 완료:", userData.id);

    // Supabase 클라이언트 생성
    const supabase = getServiceRoleClient();

    // 건강 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (profileError) {
      console.error("❌ 건강 프로필 조회 실패:", profileError);
      console.groupEnd();
      throw new Error(`건강 프로필 조회 실패: ${profileError.message}`);
    }

    console.log("✅ 건강 프로필 조회 성공");
    console.groupEnd();

    return profile;
  } catch (error) {
    console.error("❌ [getHealthProfile] 서버 오류:", error);
    console.groupEnd();
    throw error instanceof Error
      ? error
      : new Error("건강 프로필을 불러오는데 실패했습니다.");
  }
}

/**
 * 건강 프로필 생성
 *
 * @param profileData - 생성할 건강 프로필 데이터
 * @returns 생성된 건강 프로필 데이터
 * @throws 인증 실패, 프로필 이미 존재, 또는 데이터베이스 오류 시 에러 발생
 */
export async function createHealthProfile(
  profileData: Partial<UserHealthProfile>,
): Promise<UserHealthProfile> {
  try {
    console.group("➕ [createHealthProfile] 건강 프로필 생성 시작");

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    console.log("요청 데이터:", profileData);

    // 사용자 확인 및 자동 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      throw new Error(
        "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
      );
    }

    console.log("✅ 사용자 확인 완료:", { id: userData.id, name: userData.name });

    const supabase = getServiceRoleClient();

    // 기존 프로필 확인
    const { data: existing } = await supabase
      .from("user_health_profiles")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle();

    if (existing) {
      console.warn("⚠️ 이미 프로필 존재 - updateHealthProfile을 사용하세요");
      console.groupEnd();
      throw new Error("이미 건강 프로필이 존재합니다. 수정 기능을 사용해주세요.");
    }

    // JSONB 컬럼 데이터 처리
    const diseases = Array.isArray(profileData.diseases)
      ? profileData.diseases
      : Array.isArray((profileData as any).diseases_jsonb)
        ? (profileData as any).diseases_jsonb
        : Array.isArray((profileData as any).diseases)
          ? (profileData as any).diseases.map((d: string) => ({
              code: d,
              custom_name: null,
            }))
          : [];

    const allergies = Array.isArray(profileData.allergies)
      ? profileData.allergies
      : Array.isArray((profileData as any).allergies_jsonb)
        ? (profileData as any).allergies_jsonb
        : Array.isArray((profileData as any).allergies)
          ? (profileData as any).allergies.map((a: string) => ({
              code: a,
              custom_name: null,
            }))
          : [];

    const preferred_ingredients = Array.isArray(profileData.preferred_ingredients)
      ? profileData.preferred_ingredients
      : Array.isArray((profileData as any).preferred_ingredients_jsonb)
        ? (profileData as any).preferred_ingredients_jsonb
        : [];

    const dietary_preferences = Array.isArray(profileData.dietary_preferences)
      ? profileData.dietary_preferences
      : Array.isArray((profileData as any).dietary_preferences_jsonb)
        ? (profileData as any).dietary_preferences_jsonb
        : [];

    // 프로필 생성
    const { data: newProfile, error } = await supabase
      .from("user_health_profiles")
      .insert({
        user_id: userData.id,
        diseases,
        allergies,
        preferred_ingredients,
        disliked_ingredients:
          Array.isArray(profileData.disliked_ingredients)
            ? profileData.disliked_ingredients
            : [],
        daily_calorie_goal: profileData.daily_calorie_goal || 0,
        dietary_preferences,
        height_cm: profileData.height_cm ?? null,
        weight_kg: profileData.weight_kg ?? null,
        age: profileData.age ?? null,
        gender: profileData.gender || null,
        activity_level: profileData.activity_level || "sedentary",
        premium_features: Array.isArray(profileData.premium_features)
          ? profileData.premium_features
          : [],
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 생성 실패:", error);
      console.groupEnd();
      throw new Error(`건강 프로필 생성 실패: ${error.message}`);
    }

    console.log("✅ 건강 프로필 생성 성공");
    console.groupEnd();

    return newProfile;
  } catch (error) {
    console.error("❌ [createHealthProfile] 서버 오류:", error);
    console.groupEnd();
    throw error instanceof Error
      ? error
      : new Error("건강 프로필 생성에 실패했습니다.");
  }
}

/**
 * 건강 프로필 수정 (upsert)
 *
 * @param profileData - 수정할 건강 프로필 데이터
 * @returns 수정된 건강 프로필 데이터
 * @throws 인증 실패 또는 데이터베이스 오류 시 에러 발생
 */
export async function updateHealthProfile(
  profileData: Partial<UserHealthProfile>,
): Promise<UserHealthProfile> {
  try {
    console.group("✏️ [updateHealthProfile] 건강 프로필 수정 시작");

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      throw new Error("인증이 필요합니다.");
    }

    console.log("수정 데이터:", profileData);

    // 사용자 확인 및 자동 동기화
    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      throw new Error(
        "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
      );
    }

    console.log("✅ 사용자 확인 완료:", { id: userData.id, name: userData.name });

    const supabase = getServiceRoleClient();

    // JSONB 컬럼 데이터 처리
    const diseases = Array.isArray(profileData.diseases)
      ? profileData.diseases
      : Array.isArray((profileData as any).diseases_jsonb)
        ? (profileData as any).diseases_jsonb
        : Array.isArray((profileData as any).diseases)
          ? (profileData as any).diseases.map((d: string) => ({
              code: d,
              custom_name: null,
            }))
          : undefined;

    const allergies = Array.isArray(profileData.allergies)
      ? profileData.allergies
      : Array.isArray((profileData as any).allergies_jsonb)
        ? (profileData as any).allergies_jsonb
        : Array.isArray((profileData as any).allergies)
          ? (profileData as any).allergies.map((a: string) => ({
              code: a,
              custom_name: null,
            }))
          : undefined;

    const preferred_ingredients = Array.isArray(profileData.preferred_ingredients)
      ? profileData.preferred_ingredients
      : Array.isArray((profileData as any).preferred_ingredients_jsonb)
        ? (profileData as any).preferred_ingredients_jsonb
        : undefined;

    const dietary_preferences = Array.isArray(profileData.dietary_preferences)
      ? profileData.dietary_preferences
      : Array.isArray((profileData as any).dietary_preferences_jsonb)
        ? (profileData as any).dietary_preferences_jsonb
        : undefined;

    // 업데이트 데이터 구성 (undefined인 경우 제외)
    const updateData: Record<string, any> = {
      user_id: userData.id,
    };

    if (diseases !== undefined) updateData.diseases = diseases;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (preferred_ingredients !== undefined)
      updateData.preferred_ingredients = preferred_ingredients;
    if (dietary_preferences !== undefined)
      updateData.dietary_preferences = dietary_preferences;
    if (profileData.disliked_ingredients !== undefined)
      updateData.disliked_ingredients = Array.isArray(profileData.disliked_ingredients)
        ? profileData.disliked_ingredients
        : [];
    if (profileData.daily_calorie_goal !== undefined)
      updateData.daily_calorie_goal = profileData.daily_calorie_goal;
    if (profileData.height_cm !== undefined) updateData.height_cm = profileData.height_cm ?? null;
    if (profileData.weight_kg !== undefined) updateData.weight_kg = profileData.weight_kg ?? null;
    if (profileData.age !== undefined) updateData.age = profileData.age ?? null;
    if (profileData.gender !== undefined) updateData.gender = profileData.gender || null;
    if (profileData.activity_level !== undefined)
      updateData.activity_level = profileData.activity_level || "sedentary";
    if (profileData.premium_features !== undefined)
      updateData.premium_features = Array.isArray(profileData.premium_features)
        ? profileData.premium_features
        : [];

    console.log("업데이트할 데이터:", JSON.stringify(updateData, null, 2));

    // 프로필 수정 (upsert 사용)
    const { data: updatedProfile, error } = await supabase
      .from("user_health_profiles")
      .upsert(updateData, {
        onConflict: "user_id",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 수정 실패:", error);
      console.groupEnd();
      throw new Error(`건강 프로필 수정 실패: ${error.message}`);
    }

    console.log("✅ 건강 프로필 수정 성공");
    console.groupEnd();

    return updatedProfile;
  } catch (error) {
    console.error("❌ [updateHealthProfile] 서버 오류:", error);
    console.groupEnd();
    throw error instanceof Error
      ? error
      : new Error("건강 프로필 수정에 실패했습니다.");
  }
}
