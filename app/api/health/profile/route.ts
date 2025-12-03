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

/**
 * GET /api/health/profile
 * 건강 프로필 조회
 */
export async function GET() {
  try {
    console.group("📋 GET /api/health/profile");

    const { userId } = await auth();
    console.log("🔐 인증된 사용자 ID:", userId);

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    console.log("🔗 Supabase 클라이언트 생성됨");

    // 데이터베이스 연결 및 테이블 존재 테스트
    try {
      // users 테이블 테스트
      const { data: usersTest, error: usersError } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      console.log("🧪 users 테이블 테스트:", { usersTest, usersError });

      // user_health_profiles 테이블 존재 확인
      const { data: healthTest, error: healthError } = await supabase
        .from("user_health_profiles")
        .select("id")
        .limit(1);

      console.log("🧪 user_health_profiles 테이블 테스트:", { healthTest, healthError });

    } catch (testErr) {
      console.warn("⚠️ 데이터베이스 테스트 실패:", testErr);
    }

    // 사용자의 Supabase user_id 조회
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
    console.groupEnd();

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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

    const supabase = getServiceRoleClient();

    // 사용자의 Supabase user_id 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

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
    const { data: newProfile, error } = await supabase
      .from("user_health_profiles")
      .insert({
        user_id: supabaseUserId,
        diseases: body.diseases || [],
        allergies: body.allergies || [],
        preferred_ingredients: body.preferred_ingredients || [],
        disliked_ingredients: body.disliked_ingredients || [],
        daily_calorie_goal: body.daily_calorie_goal,
        dietary_preferences: body.dietary_preferences || [],
        height_cm: body.height_cm,
        weight_kg: body.weight_kg,
        age: body.age,
        gender: body.gender,
        activity_level: body.activity_level || "sedentary",
        premium_features: body.premium_features || [],
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
    console.groupEnd();

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };

    return NextResponse.json(errorResponse, { status: 500 });
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

    const supabase = getServiceRoleClient();

    // 사용자의 Supabase user_id 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

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

    // 프로필 수정 (upsert 사용)
    const { data: updatedProfile, error } = await supabase
      .from("user_health_profiles")
      .upsert({
        user_id: supabaseUserId,
        diseases: body.diseases,
        allergies: body.allergies,
        preferred_ingredients: body.preferred_ingredients,
        disliked_ingredients: body.disliked_ingredients,
        daily_calorie_goal: body.daily_calorie_goal,
        dietary_preferences: body.dietary_preferences,
        height_cm: body.height_cm,
        weight_kg: body.weight_kg,
        age: body.age,
        gender: body.gender,
        activity_level: body.activity_level,
        premium_features: body.premium_features,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 수정 실패:", error);
      console.groupEnd();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ 건강 프로필 수정 성공");
    console.groupEnd();

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();

    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    const errorResponse = {
      error: "Internal server error",
      ...(isDevelopment && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

