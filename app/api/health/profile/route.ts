/**
 * @file app/api/health/profile/route.ts
 * @description 건강 프로필 API
 * 
 * GET /api/health/profile - 조회
 * POST /api/health/profile - 생성
 * PUT /api/health/profile - 수정
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import type { UserHealthProfile } from "@/types/health";

/**
 * GET /api/health/profile
 * 건강 프로필 조회
 */
export async function GET() {
  try {
    console.group("📋 GET /api/health/profile");

    // 인증 확인
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
      console.log("🔐 인증된 사용자 ID:", userId);
    } catch (authError) {
      console.error("❌ 인증 오류:", authError);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Authentication failed",
          message: authError instanceof Error ? authError.message : "인증 중 오류가 발생했습니다."
        },
        { status: 401 }
      );
    }

    if (!userId) {
      console.error("❌ 인증 실패 - userId가 null");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Supabase 클라이언트 생성
    let supabase;
    try {
      supabase = getServiceRoleClient();
      console.log("🔗 Supabase 클라이언트 생성됨");
    } catch (clientError) {
      console.error("❌ Supabase 클라이언트 생성 실패:", clientError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: clientError instanceof Error ? clientError.message : "데이터베이스 연결에 실패했습니다."
        },
        { status: 500 }
      );
    }

    // 사용자의 Supabase user_id 조회 (불필요한 테스트 쿼리 제거)
    console.log("👤 사용자 조회 시작");
    console.log("Clerk User ID:", userId);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    console.log("👤 사용자 조회 결과:", { data: userData, error: userError });

    if (userError) {
      console.error("❌ 사용자 조회 실패:", userError);
      console.groupEnd();
      return NextResponse.json({
        error: "User lookup failed",
        details: userError.message,
        code: userError.code
      }, { status: 500 });
    }

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;

    // 건강 프로필 조회
    console.log("🔍 건강 프로필 조회 시작");
    console.log("user_id:", supabaseUserId);

    const { data: profile, error: profileError } = await supabase
      .from("user_health_profiles")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    console.log("🔍 건강 프로필 조회 결과:", { data: profile, error: profileError });

    if (profileError) {
      console.error("❌ 건강 프로필 조회 실패:", profileError);
      console.groupEnd();
      return NextResponse.json({
        error: "Failed to fetch health profile",
        details: profileError.message,
        code: profileError.code
      }, { status: 500 });
    }

    console.log("✅ 건강 프로필 조회 성공");
    console.log("📋 프로필 데이터:", profile);
    console.groupEnd();

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.error("❌ 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("❌ 에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    
    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      }),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/health/profile
 * 건강 프로필 생성
 */
export async function POST(request: NextRequest) {
  try {
    console.group("➕ POST /api/health/profile");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("요청 데이터:", body);

    // 사용자 확인 및 자동 동기화
    console.log("👤 사용자 확인 및 동기화 시작...");
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.error("  - Clerk User ID:", userId);
      console.error("  - ensureSupabaseUser가 null을 반환했습니다.");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "User not found",
          message: "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
          details: "Clerk 사용자가 Supabase users 테이블에 동기화되지 않았습니다. 페이지를 새로고침하거나 다시 로그인해주세요."
        },
        { status: 404 }
      );
    }

    console.log("✅ 사용자 확인 완료:", { id: userData.id, name: userData.name });

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 기존 프로필 확인
    const { data: existing } = await supabase
      .from("user_health_profiles")
      .select("id")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    if (existing) {
      console.warn("⚠️ 이미 프로필 존재 - PUT을 사용하세요");
      console.groupEnd();
      return NextResponse.json(
        { error: "Profile already exists. Use PUT to update." },
        { status: 409 }
      );
    }

    // 프로필 생성
    // JSONB 컬럼만 사용 (TEXT[] 컬럼 제거됨)
    const diseases = Array.isArray(body.diseases_jsonb) 
      ? body.diseases_jsonb 
      : (Array.isArray(body.diseases) 
          ? body.diseases.map((d: string) => ({ code: d, custom_name: null })) 
          : []);
    
    const allergies = Array.isArray(body.allergies_jsonb) 
      ? body.allergies_jsonb 
      : (Array.isArray(body.allergies) 
          ? body.allergies.map((a: string) => ({ code: a, custom_name: null })) 
          : []);
    
    const preferred_ingredients = Array.isArray(body.preferred_ingredients_jsonb) 
      ? body.preferred_ingredients_jsonb 
      : (Array.isArray(body.preferred_ingredients) ? body.preferred_ingredients : []);
    
    const dietary_preferences = Array.isArray(body.dietary_preferences_jsonb) 
      ? body.dietary_preferences_jsonb 
      : (Array.isArray(body.dietary_preferences) ? body.dietary_preferences : []);

    const { data: newProfile, error } = await supabase
      .from("user_health_profiles")
      .insert({
        user_id: supabaseUserId,
        diseases: diseases, // JSONB 컬럼
        allergies: allergies, // JSONB 컬럼
        preferred_ingredients: preferred_ingredients, // JSONB 컬럼
        disliked_ingredients: Array.isArray(body.disliked_ingredients) ? body.disliked_ingredients : [],
        daily_calorie_goal: body.daily_calorie_goal,
        dietary_preferences: dietary_preferences, // JSONB 컬럼
        height_cm: body.height_cm,
        weight_kg: body.weight_kg,
        age: body.age,
        gender: body.gender,
        activity_level: body.activity_level || "sedentary",
        premium_features: Array.isArray(body.premium_features) ? body.premium_features : [],
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 생성 실패:", error);
      console.groupEnd();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ 건강 프로필 생성 성공");
    console.groupEnd();

    return NextResponse.json({ profile: newProfile }, { status: 201 });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.error("  - 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("  - 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("  - 에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    
    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      }),
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
}

/**
 * PUT /api/health/profile
 * 건강 프로필 수정
 */
export async function PUT(request: NextRequest) {
  try {
    console.group("✏️ PUT /api/health/profile");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("수정 데이터:", body);

    // 사용자 확인 및 자동 동기화
    console.log("👤 사용자 확인 및 동기화 시작...");
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.error("  - Clerk User ID:", userId);
      console.error("  - ensureSupabaseUser가 null을 반환했습니다.");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "User not found",
          message: "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.",
          details: "Clerk 사용자가 Supabase users 테이블에 동기화되지 않았습니다. 페이지를 새로고침하거나 다시 로그인해주세요."
        },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;

    // 충돌 검사 (질병과 특수 식단 간)
    const { checkDietConflicts } = await import("@/lib/health/diet-conflict-manager");

    // 임시 프로필 생성 (충돌 검사용)
    const tempProfile: UserHealthProfile = {
      id: "",
      user_id: supabaseUserId,
      age: body.age ?? null,
      birth_date: body.birth_date || null,
      gender: body.gender || null,
      height_cm: body.height_cm ?? null,
      weight_kg: body.weight_kg ?? null,
      activity_level: body.activity_level || "sedentary",
      daily_calorie_goal: body.daily_calorie_goal ?? 2000,
      diseases: Array.isArray(body.diseases_jsonb)
        ? body.diseases_jsonb
        : Array.isArray(body.diseases)
        ? body.diseases.map((d: string) => ({ code: d, custom_name: null }))
        : [],
      allergies: Array.isArray(body.allergies_jsonb)
        ? body.allergies_jsonb
        : Array.isArray(body.allergies)
        ? body.allergies.map((a: string) => ({ code: a, custom_name: null }))
        : [],
      preferred_ingredients: Array.isArray(body.preferred_ingredients_jsonb)
        ? body.preferred_ingredients_jsonb
        : Array.isArray(body.preferred_ingredients)
        ? body.preferred_ingredients
        : [],
      disliked_ingredients: Array.isArray(body.disliked_ingredients) ? body.disliked_ingredients : [],
      dietary_preferences: Array.isArray(body.dietary_preferences_jsonb)
        ? body.dietary_preferences_jsonb
        : Array.isArray(body.dietary_preferences)
        ? body.dietary_preferences
        : [],
      premium_features: Array.isArray(body.premium_features) ? body.premium_features : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const conflictResult = checkDietConflicts(tempProfile);

    // 절대 금지 조합이 있으면 거부
    if (conflictResult.blockedOptions.length > 0) {
      console.error("❌ 충돌 검사 실패: 절대 금지 조합 발견", {
        blockedOptions: conflictResult.blockedOptions,
        conflicts: conflictResult.conflicts,
      });
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Diet conflict detected",
          message: "선택하신 질병과 식단 조합은 의학적으로 권장되지 않습니다.",
          details: conflictResult.conflicts
            .filter((c) => c.severity === "absolute")
            .map((c) => ({
              disease: c.diseaseCode,
              dietType: c.dietType,
              reason: c.reason,
              medicalSource: c.medicalSource,
            })),
          conflicts: conflictResult,
        },
        { status: 400 }
      );
    }

    console.log("✅ 사용자 확인 완료:", { id: userData.id, name: userData.name });
    const supabase = getServiceRoleClient();

    // 프로필 수정 (upsert 사용 - user_id 기준으로 충돌 처리)
    // JSONB 컬럼만 사용 (TEXT[] 컬럼 제거됨)
    const diseases = Array.isArray(body.diseases_jsonb) 
      ? body.diseases_jsonb 
      : (Array.isArray(body.diseases) 
          ? body.diseases.map((d: string) => ({ code: d, custom_name: null })) 
          : []);
    
    const allergies = Array.isArray(body.allergies_jsonb) 
      ? body.allergies_jsonb 
      : (Array.isArray(body.allergies) 
          ? body.allergies.map((a: string) => ({ code: a, custom_name: null })) 
          : []);
    
    const preferred_ingredients = Array.isArray(body.preferred_ingredients_jsonb) 
      ? body.preferred_ingredients_jsonb 
      : (Array.isArray(body.preferred_ingredients) ? body.preferred_ingredients : []);
    
    const dietary_preferences = Array.isArray(body.dietary_preferences_jsonb) 
      ? body.dietary_preferences_jsonb 
      : (Array.isArray(body.dietary_preferences) ? body.dietary_preferences : []);
    
    const updateData: any = {
      user_id: supabaseUserId,
      diseases: diseases, // JSONB 컬럼
      allergies: allergies, // JSONB 컬럼
      preferred_ingredients: preferred_ingredients, // JSONB 컬럼
      disliked_ingredients: Array.isArray(body.disliked_ingredients) ? body.disliked_ingredients : [],
      daily_calorie_goal: body.daily_calorie_goal ?? null,
      dietary_preferences: dietary_preferences, // JSONB 컬럼
      height_cm: body.height_cm ?? null,
      weight_kg: body.weight_kg ?? null,
      age: body.age ?? null,
      gender: body.gender || null,
      activity_level: body.activity_level || "sedentary",
      premium_features: Array.isArray(body.premium_features) ? body.premium_features : [],
      birth_date: body.birth_date || null, // 생년월일 추가
    };

    console.log("업데이트할 데이터:", JSON.stringify(updateData, null, 2));

    const { data: updatedProfile, error } = await supabase
      .from("user_health_profiles")
      .upsert(updateData, {
        onConflict: "user_id", // user_id 기준으로 upsert
      })
      .select()
      .single();

    // 경고가 있는 경우 경고 메시지와 함께 성공 응답
    const responseData: any = {
      success: true,
      profile: updatedProfile,
    };

    if (conflictResult.warnings.length > 0) {
      responseData.warnings = conflictResult.warnings.map((w) => ({
        disease: w.diseaseCode,
        dietType: w.dietType,
        reason: w.reason,
        medicalSource: w.medicalSource,
        alternativeSuggestion: w.alternativeSuggestion,
      }));
      console.log("⚠️ 경고 메시지 포함:", responseData.warnings);
    }

    if (error) {
      console.error("❌ 수정 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.error("  - 전체 에러 객체:", JSON.stringify(error, null, 2));
      console.error("  - 시도한 데이터:", JSON.stringify(updateData, null, 2));
      console.error("  - 사용자 ID:", supabaseUserId);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "건강 프로필 저장 실패",
          message: error.message || "데이터베이스 오류가 발생했습니다.",
          details: error.details,
          code: error.code,
          hint: error.hint,
          ...(process.env.NODE_ENV === "development" && {
            attemptedData: updateData,
            userId: supabaseUserId
          })
        },
        { status: 500 }
      );
    }

    console.log("✅ 건강 프로필 수정 성공");
    console.groupEnd();

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.error("  - 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("  - 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("  - 에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    
    try {
      console.groupEnd();
    } catch {
      // groupEnd 실패 무시
    }

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
      }),
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        "Content-Type": "application/json",
      }
    });
  }
}

