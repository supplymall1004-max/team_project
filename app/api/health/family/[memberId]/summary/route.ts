/**
 * @file app/api/health/family/[memberId]/summary/route.ts
 * @description 가족 구성원별 건강 요약 API
 *
 * GET /api/health/family/[memberId]/summary - 가족 구성원 건강 요약 조회
 *
 * 반환 데이터:
 * - 구성원 기본 정보
 * - 건강 점수 및 상세 분석
 * - 최근 건강검진 결과
 * - 현재 복용 중인 약물
 * - 예방접종 이력
 * - 건강 트렌드 데이터
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { calculateHealthScore } from "@/lib/health/health-score-calculator";
import type { HealthCheckupRecord } from "@/types/kcdc";
import type { MedicationRecord, HospitalRecord } from "@/types/health-data-integration";

/**
 * GET /api/health/family/[memberId]/summary
 * 가족 구성원 건강 요약 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    console.group("[API] GET /api/health/family/[memberId]/summary");

    const { memberId } = await params;

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

    const supabase = getServiceRoleClient();

    // 2. 구성원 정보 조회
    let memberInfo: {
      id: string;
      name: string;
      relationship: string | null;
      birth_date: string | null;
      gender: string | null;
    } | null = null;

    if (memberId === premiumCheck.userId) {
      // 본인인 경우
      const { data: user } = await supabase
        .from("users")
        .select("id, name")
        .eq("id", memberId)
        .single();

      const { data: profile } = await supabase
        .from("user_health_profiles")
        .select("age, gender")
        .eq("user_id", memberId)
        .single();

      if (user) {
        memberInfo = {
          id: user.id,
          name: user.name || "본인",
          relationship: null,
          birth_date: null,
          gender: profile?.gender || null,
        };
      }
    } else {
      // 가족 구성원인 경우
      const { data: member } = await supabase
        .from("family_members")
        .select("id, name, relationship, birth_date, gender")
        .eq("id", memberId)
        .eq("user_id", premiumCheck.userId)
        .single();

      if (member) {
        memberInfo = {
          id: member.id,
          name: member.name,
          relationship: member.relationship,
          birth_date: member.birth_date,
          gender: member.gender,
        };
      }
    }

    if (!memberInfo) {
      console.log("❌ 구성원 정보를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Member not found",
          message: "구성원 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 3. 건강 점수 계산
    const healthScore = await calculateHealthScore(
      premiumCheck.userId,
      memberId === premiumCheck.userId ? null : memberId
    );

    // 4. 최근 건강검진 결과 조회
    let checkupQuery = supabase
      .from("user_health_checkup_records")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("checkup_date", { ascending: false })
      .limit(5);

    if (memberId !== premiumCheck.userId) {
      checkupQuery = checkupQuery.eq("family_member_id", memberId);
    } else {
      checkupQuery = checkupQuery.is("family_member_id", null);
    }

    const { data: checkups } = await checkupQuery;

    // 5. 현재 복용 중인 약물 조회
    const today = new Date().toISOString().split("T")[0];
    let medicationQuery = supabase
      .from("medication_records")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("start_date", { ascending: false });

    if (memberId !== premiumCheck.userId) {
      medicationQuery = medicationQuery.eq("family_member_id", memberId);
    } else {
      medicationQuery = medicationQuery.is("family_member_id", null);
    }

    const { data: medications } = await medicationQuery;

    // 6. 예방접종 이력 조회
    let vaccinationQuery = supabase
      .from("user_vaccination_records")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("completed_date", { ascending: false })
      .limit(10);

    if (memberId !== premiumCheck.userId) {
      vaccinationQuery = vaccinationQuery.eq("family_member_id", memberId);
    } else {
      vaccinationQuery = vaccinationQuery.is("family_member_id", null);
    }

    const { data: vaccinations } = await vaccinationQuery;

    // 7. 최근 병원 방문 기록 조회
    let hospitalQuery = supabase
      .from("hospital_records")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .order("visit_date", { ascending: false })
      .limit(10);

    if (memberId !== premiumCheck.userId) {
      hospitalQuery = hospitalQuery.eq("family_member_id", memberId);
    } else {
      hospitalQuery = hospitalQuery.is("family_member_id", null);
    }

    const { data: hospitalRecords } = await hospitalQuery;

    // 8. 예정된 예방접종 및 건강검진 조회
    let upcomingVaccinationQuery = supabase
      .from("user_vaccination_schedules")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .eq("status", "pending")
      .gte("recommended_date", today)
      .order("recommended_date", { ascending: true });

    if (memberId !== premiumCheck.userId) {
      upcomingVaccinationQuery = upcomingVaccinationQuery.eq("family_member_id", memberId);
    } else {
      upcomingVaccinationQuery = upcomingVaccinationQuery.is("family_member_id", null);
    }

    const { data: upcomingVaccinations } = await upcomingVaccinationQuery;

    let upcomingCheckupQuery = supabase
      .from("user_health_checkup_recommendations")
      .select("*")
      .eq("user_id", premiumCheck.userId)
      .gte("recommended_date", today)
      .order("recommended_date", { ascending: true });

    if (memberId !== premiumCheck.userId) {
      upcomingCheckupQuery = upcomingCheckupQuery.eq("family_member_id", memberId);
    } else {
      upcomingCheckupQuery = upcomingCheckupQuery.is("family_member_id", null);
    }

    const { data: upcomingCheckups } = await upcomingCheckupQuery;

    console.log("✅ 구성원 건강 요약 조회 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: {
        member: memberInfo,
        healthScore,
        checkups: (checkups || []) as HealthCheckupRecord[],
        medications: (medications || []) as MedicationRecord[],
        vaccinations: vaccinations || [],
        hospitalRecords: (hospitalRecords || []) as HospitalRecord[],
        upcomingVaccinations: upcomingVaccinations || [],
        upcomingCheckups: upcomingCheckups || [],
      },
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "구성원 건강 요약 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

