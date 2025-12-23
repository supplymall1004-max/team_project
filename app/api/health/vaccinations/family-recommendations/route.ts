/**
 * @file app/api/health/vaccinations/family-recommendations/route.ts
 * @description 가족 구성원별 예방접종 권장사항 조회 API
 * 
 * 가족 구성원의 나이를 기반으로 맞아야 할 예방접종을 추천합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { LifecycleVaccinationSchedule } from "@/types/health-data-integration";

interface FamilyMemberWithAge {
  id: string;
  name: string;
  birth_date: string | null;
  ageMonths: number | null;
  gender: string | null;
}

interface VaccinationRecommendation {
  familyMemberId: string;
  familyMemberName: string;
  ageMonths: number;
  ageYears: number;
  vaccinations: Array<{
    vaccine_name: string;
    vaccine_code: string | null;
    target_age_min_months: number;
    target_age_max_months: number | null;
    priority: "required" | "recommended" | "optional";
    dose_number: number;
    total_doses: number;
    description: string | null;
    gender_requirement: string | null;
  }>;
}

/**
 * 생년월일로 나이(개월) 계산
 */
function calculateAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  const days = today.getDate() - birth.getDate();
  
  let totalMonths = years * 12 + months;
  
  // 생일이 아직 지나지 않았으면 1개월 빼기
  if (days < 0) {
    totalMonths--;
  }
  
  return totalMonths;
}

/**
 * GET /api/health/vaccinations/family-recommendations
 * 가족 구성원별 예방접종 권장사항 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/vaccinations/family-recommendations");

    // 1. 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.log("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized", message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. Supabase 클라이언트 생성
    const supabase = await createClerkSupabaseClient();
    const serviceSupabase = getServiceRoleClient();

    // 3. 사용자 ID 조회
    const { data: userData } = await serviceSupabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (!userData) {
      console.log("❌ 사용자 조회 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "User not found", message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 4. 가족 구성원 조회 (본인 포함)
    const familyMembers: FamilyMemberWithAge[] = [];

    // 본인 정보 조회
    const { data: userProfile } = await serviceSupabase
      .from("user_health_profiles")
      .select("birth_date, gender")
      .eq("user_id", userId)
      .maybeSingle();

    if (userProfile?.birth_date) {
      const ageMonths = calculateAgeMonths(userProfile.birth_date);
      familyMembers.push({
        id: userId,
        name: "본인",
        birth_date: userProfile.birth_date,
        ageMonths,
        gender: userProfile.gender,
      });
    }

    // 가족 구성원 조회
    const { data: members } = await serviceSupabase
      .from("family_members")
      .select("id, name, birth_date, gender")
      .eq("user_id", userId);

    if (members) {
      for (const member of members) {
        if (member.birth_date) {
          const ageMonths = calculateAgeMonths(member.birth_date);
          familyMembers.push({
            id: member.id,
            name: member.name,
            birth_date: member.birth_date,
            ageMonths,
            gender: member.gender,
          });
        }
      }
    }

    console.log(`👨‍👩‍👧‍👦 가족 구성원 ${familyMembers.length}명 조회 완료`);

    // 5. 생애주기별 예방접종 마스터 데이터 조회
    const { data: masterSchedules, error: masterError } = await serviceSupabase
      .from("lifecycle_vaccination_schedules")
      .select("*")
      .eq("is_active", true)
      .order("target_age_min_months", { ascending: true });

    if (masterError) {
      console.error("❌ 예방접종 마스터 데이터 조회 실패:", masterError);
      console.groupEnd();
      return NextResponse.json(
        { error: "Failed to fetch vaccination schedules", message: masterError.message },
        { status: 500 }
      );
    }

    // 6. 각 가족 구성원별로 맞아야 할 예방접종 추천
    const recommendations: VaccinationRecommendation[] = [];

    for (const member of familyMembers) {
      if (!member.ageMonths) continue;

      const memberVaccinations: VaccinationRecommendation["vaccinations"] = [];

      for (const schedule of masterSchedules || []) {
        // 성별 필터링
        if (
          schedule.gender_requirement &&
          schedule.gender_requirement !== "all" &&
          schedule.gender_requirement !== member.gender
        ) {
          continue;
        }

        // 나이 범위 확인
        const minAge = schedule.target_age_min_months || 0;
        const maxAge = schedule.target_age_max_months || Infinity;

        if (member.ageMonths >= minAge && member.ageMonths <= maxAge) {
          // 이미 완료한 접종인지 확인
          const { data: completedRecords } = await serviceSupabase
            .from("user_vaccination_records")
            .select("dose_number")
            .eq("family_member_id", member.id)
            .eq("vaccine_name", schedule.vaccine_name)
            .eq("dose_number", schedule.dose_number)
            .not("completed_date", "is", null)
            .maybeSingle();

          if (!completedRecords) {
            memberVaccinations.push({
              vaccine_name: schedule.vaccine_name,
              vaccine_code: schedule.vaccine_code,
              target_age_min_months: schedule.target_age_min_months || 0,
              target_age_max_months: schedule.target_age_max_months,
              priority: schedule.priority,
              dose_number: schedule.dose_number,
              total_doses: schedule.total_doses,
              description: schedule.description,
              gender_requirement: schedule.gender_requirement,
            });
          }
        }
      }

      if (memberVaccinations.length > 0) {
        const ageYears = Math.floor(member.ageMonths / 12);
        recommendations.push({
          familyMemberId: member.id,
          familyMemberName: member.name,
          ageMonths: member.ageMonths,
          ageYears,
          vaccinations: memberVaccinations,
        });
      }
    }

    console.log(`✅ 예방접종 권장사항 조회 완료: ${recommendations.length}명의 가족 구성원`);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("❌ 예방접종 권장사항 조회 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Failed to fetch vaccination recommendations",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

