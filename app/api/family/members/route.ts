/**
 * @file app/api/family/members/route.ts
 * @description 가족 구성원 관리 API
 * 
 * GET /api/family/members - 목록 조회
 * POST /api/family/members - 추가 (구독 제한 체크)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { canAddFamilyMember, SUBSCRIPTION_LIMITS } from "@/types/subscription";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * GET /api/family/members
 * 가족 구성원 목록 조회
 */
export async function GET() {
  try {
    console.group("👥 GET /api/family/members");
    console.log("📍 가족 구성원 목록 조회");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Service role 클라이언트 사용 (관리자 권한)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase 환경 변수 없음");
      console.groupEnd();
      return NextResponse.json({
        error: "Supabase configuration error"
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 사용자의 Supabase user_id 조회
    console.log("🔍 Clerk User ID로 조회:", userId);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .eq("clerk_id", userId)
      .single();

    if (userError) {
      console.error("❌ 사용자 조회 실패:", userError);
      console.error("❌ Clerk User ID:", userId);
      console.error("❌ 에러 코드:", userError.code);
      console.error("❌ 에러 메시지:", userError.message);

      // 디버깅을 위해 모든 사용자 목록 조회
      const { data: allUsers } = await supabase
        .from("users")
        .select("id, clerk_id, name")
        .limit(5);

      console.log("📋 존재하는 사용자들:", allUsers);

      console.groupEnd();
      return NextResponse.json({
        error: "User lookup failed",
        details: userError.message,
        code: userError.code,
        clerkUserId: userId,
        availableUsers: allUsers
      }, { status: 500 });
    }

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ 사용자 조회 성공:", userData);
    const supabaseUserId = userData.id;

    // 구독 정보 조회 (없으면 기본값 사용)
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("subscription_plan")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    const subscriptionPlan = subscription?.subscription_plan || "free";
    const maxMembers = SUBSCRIPTION_LIMITS[subscriptionPlan]?.maxFamilyMembers ?? 1;

    // 가족 구성원 조회
    const { data: members, error } = await supabase
      .from("family_members")
      .select("id, user_id, name, birth_date, gender, relationship, diseases, allergies, height_cm, weight_kg, activity_level, dietary_preferences, include_in_unified_diet, photo_url, member_type, created_at, updated_at")
      .eq("user_id", supabaseUserId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ 조회 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.error("  - 사용자 ID:", supabaseUserId);
      console.groupEnd();
      
      // 개발 환경에서는 더 자세한 정보 제공
      const isDevelopment = process.env.NODE_ENV === "development";
      return NextResponse.json(
        { 
          error: "Database error",
          message: "데이터베이스 조회 중 오류가 발생했습니다.",
          details: error.message,
          ...(isDevelopment && {
            code: error.code,
            hint: error.hint,
            userId: supabaseUserId
          })
        },
        { status: 500 }
      );
    }

    console.log(`✅ ${members?.length || 0}명 조회 성공, 구독 플랜: ${subscriptionPlan}, 최대 구성원: ${maxMembers}`);
    console.groupEnd();

    return NextResponse.json({
      members: members || [],
      subscription: {
        plan: subscriptionPlan,
        maxMembers: maxMembers,
      }
    });
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
      message: error instanceof Error ? error.message : "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
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
 * POST /api/family/members
 * 가족 구성원 추가 (구독 제한 체크)
 */
export async function POST(request: NextRequest) {
  try {
    console.group("➕ POST /api/family/members");

    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 요청 본문 파싱
    let body: any;
    try {
      body = await request.json();
      console.log("요청 데이터:", body);
    } catch (parseError) {
      console.error("❌ 요청 본문 파싱 실패:", parseError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Invalid request body",
          message: "요청 데이터 형식이 올바르지 않습니다.",
          details: parseError instanceof Error ? parseError.message : String(parseError)
        },
        { status: 400 }
      );
    }

    // 사용자 확인 및 자동 동기화
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "User not found",
          message: "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요."
        },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;
    
    // Service role 클라이언트 사용 (관리자 권한)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase 환경 변수 없음");
      console.groupEnd();
      return NextResponse.json({
        error: "Supabase configuration error",
        message: "서버 설정 오류가 발생했습니다."
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 구독 플랜 확인
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("subscription_plan")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    const subscriptionPlan = subscription?.subscription_plan || "free";

    // 현재 구성원 수 확인
    const { count } = await supabase
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", supabaseUserId);

    const currentCount = count || 0;
    const isDevelopment = process.env.NODE_ENV !== "production";
    const isPlanLimitDisabled =
      isDevelopment || process.env.NEXT_PUBLIC_DISABLE_PLAN_LIMIT === "true";

    // 구독 제한 체크
    if (!canAddFamilyMember(currentCount, subscriptionPlan) && !isPlanLimitDisabled) {
      console.warn(`⚠️ 구독 제한 초과 (현재: ${currentCount}명, 플랜: ${subscriptionPlan})`);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "구독 플랜 제한에 도달했습니다. 업그레이드를 고려해주세요.",
          currentCount,
          subscriptionPlan,
        },
        { status: 403 }
      );
    }
    if (!canAddFamilyMember(currentCount, subscriptionPlan) && isPlanLimitDisabled) {
      console.group("[FamilyMemberLimit]");
      console.warn("plan-limit-bypass-active", {
        currentCount,
        subscriptionPlan,
      });
      console.groupEnd();
    }

    // 가족 구성원 추가 데이터 준비 (NULL 값 명시적 처리)
    const memberData: any = {
      user_id: supabaseUserId,
      name: body.name,
      birth_date: body.birth_date,
      gender: body.gender || null,
      relationship: body.relationship,
      diseases: Array.isArray(body.diseases) ? body.diseases : [],
      allergies: Array.isArray(body.allergies) ? body.allergies : [],
      height_cm: body.height_cm != null ? parseInt(String(body.height_cm)) : null,
      weight_kg: body.weight_kg != null ? parseFloat(String(body.weight_kg)) : null,
      activity_level: body.activity_level || "sedentary",
      dietary_preferences: Array.isArray(body.dietary_preferences) ? body.dietary_preferences : [],
    };

    // include_in_unified_diet 컬럼이 존재하는 경우에만 추가
    if (body.include_in_unified_diet !== undefined) {
      memberData.include_in_unified_diet = body.include_in_unified_diet !== false;
    }

    console.log("추가할 데이터:", JSON.stringify(memberData, null, 2));
    console.log("데이터 타입 확인:", {
      user_id: typeof memberData.user_id,
      name: typeof memberData.name,
      birth_date: typeof memberData.birth_date,
      gender: typeof memberData.gender,
      relationship: typeof memberData.relationship,
      diseases: Array.isArray(memberData.diseases),
      allergies: Array.isArray(memberData.allergies),
      height_cm: typeof memberData.height_cm,
      weight_kg: typeof memberData.weight_kg,
      activity_level: typeof memberData.activity_level,
      dietary_preferences: Array.isArray(memberData.dietary_preferences),
    });

    const { data: newMember, error } = await supabase
      .from("family_members")
      .insert(memberData)
      .select()
      .single();

    if (error) {
      console.error("❌ 추가 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.error("  - 전체 에러 객체:", JSON.stringify(error, null, 2));
      console.error("  - 시도한 데이터:", JSON.stringify(memberData, null, 2));
      console.error("  - 사용자 ID:", supabaseUserId);
      console.groupEnd();
      
      // 트리거 함수 에러인 경우 특별 처리
      const isTriggerError = error.message?.includes('가족 구성원은 최대') || 
                            error.message?.includes('family_member_limit');
      
      return NextResponse.json(
        { 
          error: isTriggerError ? "Family member limit exceeded" : "가족 구성원 추가 실패",
          message: error.message || "데이터베이스 오류가 발생했습니다.",
          details: error.details,
          code: error.code,
          hint: error.hint,
          ...(process.env.NODE_ENV === "development" && {
            attemptedData: memberData,
            userId: supabaseUserId
          })
        },
        { status: isTriggerError ? 403 : 500 }
      );
    }

    console.log(`✅ ${newMember.name} 추가 성공`);
    console.groupEnd();

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.error("❌ 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ 에러 메시지:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("❌ 스택 트레이스:", error.stack);
    }
    console.groupEnd();
    
    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

