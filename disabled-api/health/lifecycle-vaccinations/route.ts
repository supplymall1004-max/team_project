/**
 * @file app/api/health/lifecycle-vaccinations/route.ts
 * @description 생애주기별 예방주사 일정 관리 API
 *
 * GET /api/health/lifecycle-vaccinations - 생애주기별 예방주사 일정 조회
 * POST /api/health/lifecycle-vaccinations/generate - 생애주기별 예방주사 일정 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  createLifecycleVaccinationSchedules,
  saveLifecycleVaccinationSchedules,
  initializeLifecycleVaccinationMasterData,
} from "@/lib/health/lifecycle-vaccination-scheduler";

/**
 * GET /api/health/lifecycle-vaccinations
 * 생애주기별 예방주사 마스터 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/lifecycle-vaccinations");

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active_only") === "true";
    const targetAgeMonths = searchParams.get("target_age_months");

    // 3. 생애주기별 예방주사 마스터 데이터 조회
    const supabase = getServiceRoleClient();
    let query = supabase
      .from("lifecycle_vaccination_schedules")
      .select("*")
      .order("target_age_min_months", { ascending: true });

    if (activeOnly !== false) {
      query = query.eq("is_active", true);
    }

    if (targetAgeMonths) {
      const ageMonths = parseInt(targetAgeMonths);
      query = query
        .lte("target_age_min_months", ageMonths)
        .or(`target_age_max_months.is.null,target_age_max_months.gte.${ageMonths}`);
    }

    const { data: schedules, error } = await query;

    if (error) {
      console.error("❌ 생애주기별 예방주사 데이터 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to fetch lifecycle vaccination schedules",
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ 생애주기별 예방주사 데이터 조회 완료: ${schedules?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: schedules || [],
      count: schedules?.length || 0,
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/lifecycle-vaccinations/generate
 * 생애주기별 예방주사 일정 생성
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/health/lifecycle-vaccinations/generate");

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { family_member_id, initialize_master_data } = body;

    if (!family_member_id) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "가족 구성원 ID는 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 3. 마스터 데이터 초기화 (선택)
    if (initialize_master_data) {
      console.log("📚 생애주기별 예방주사 마스터 데이터 초기화 중...");
      await initializeLifecycleVaccinationMasterData();
    }

    // 4. 가족 구성원 정보 조회
    const supabase = getServiceRoleClient();
    const { data: familyMember, error: memberError } = await supabase
      .from("family_members")
      .select("id, name, birth_date, gender")
      .eq("id", family_member_id)
      .eq("user_id", premiumCheck.userId)
      .single();

    if (memberError || !familyMember) {
      console.error("❌ 가족 구성원 조회 실패:", memberError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Family member not found",
          message: "가족 구성원을 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    if (!familyMember.birth_date) {
      console.error("❌ 생년월일 정보 없음");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Birth date required",
          message: "생년월일 정보가 필요합니다.",
        },
        { status: 400 }
      );
    }

    // 5. 생애주기별 예방주사 일정 생성
    const result = await createLifecycleVaccinationSchedules({
      familyMemberId: family_member_id,
      birthDate: familyMember.birth_date,
      gender: familyMember.gender,
    });

    // 6. 데이터베이스에 저장
    const saveResult = await saveLifecycleVaccinationSchedules(
      premiumCheck.userId,
      family_member_id,
      result.schedules
    );

    console.log(`✅ 생애주기별 예방주사 일정 생성 완료: ${result.totalSchedules}건 생성, ${saveResult.saved}건 저장`);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        data: result.schedules,
        total_schedules: result.totalSchedules,
        saved: saveResult.saved,
        errors: saveResult.errors,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

