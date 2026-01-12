/**
 * @file app/api/health/pets/[id]/vaccinations/route.ts
 * @description 반려동물 백신 기록 관리 API
 * 
 * GET /api/health/pets/[id]/vaccinations - 백신 기록 조회
 * POST /api/health/pets/[id]/vaccinations - 백신 기록 추가
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";
import { generatePetVaccineSchedules } from "@/lib/health/pet-vaccine-scheduler";
import { PetVaccinationRecord } from "@/types/pet";

/**
 * GET /api/health/pets/[id]/vaccinations
 * 반려동물 백신 기록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`🐾 GET /api/health/pets/${id}/vaccinations`);

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 반려동물 확인
    const { data: pet, error: petError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (petError || !pet) {
      console.error("❌ 반려동물 조회 실패:", petError);
      console.groupEnd();
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    // 백신 기록 조회 (user_vaccination_records 테이블 사용)
    const { data: records, error } = await supabase
      .from("user_vaccination_records")
      .select("*")
      .eq("user_id", supabaseUserId)
      .eq("family_member_id", id)
      .order("completed_date", { ascending: false, nullsFirst: false })
      .order("scheduled_date", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("❌ 백신 기록 조회 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    // 백신 마스터 데이터 조회
    const { data: vaccineMaster } = await supabase
      .from("pet_vaccine_master")
      .select("*")
      .eq("is_active", true)
      .or(`pet_type.eq.${pet.pet_type},pet_type.eq.both`);

    // 백신 일정 생성
    const scheduleResult = generatePetVaccineSchedules(
      pet.pet_type as 'dog' | 'cat' | 'other',
      pet.birth_date,
      (records || []) as PetVaccinationRecord[],
      (vaccineMaster || []) as any[]
    );

    console.log(`✅ 백신 기록 조회 완료: ${records?.length || 0}건`);
    console.groupEnd();

    return NextResponse.json({
      records: records || [],
      schedules: scheduleResult.schedules,
      nextVaccineDate: scheduleResult.nextVaccineDate?.toISOString(),
      daysUntilNext: scheduleResult.daysUntilNext,
      completedCount: scheduleResult.completedCount,
      pendingCount: scheduleResult.pendingCount,
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
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
 * POST /api/health/pets/[id]/vaccinations
 * 반려동물 백신 기록 추가
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.group(`➕ POST /api/health/pets/${id}/vaccinations`);

    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("요청 데이터:", body);

    const userData = await ensureSupabaseUser();
    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없음");
      console.groupEnd();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabaseUserId = userData.id;
    const supabase = getServiceRoleClient();

    // 반려동물 확인
    const { data: pet, error: petError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", id)
      .eq("user_id", supabaseUserId)
      .eq("member_type", "pet")
      .single();

    if (petError || !pet) {
      console.error("❌ 반려동물 조회 실패:", petError);
      console.groupEnd();
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    // 백신 기록 추가 (user_vaccination_records 테이블 사용)
    const { data: newRecord, error } = await supabase
      .from("user_vaccination_records")
      .insert({
        user_id: supabaseUserId,
        family_member_id: id,
        vaccine_name: body.vaccine_name,
        vaccine_code: body.vaccine_code || null,
        target_age_group: body.target_age_group || null,
        scheduled_date: body.scheduled_date || null,
        completed_date: body.completed_date || null,
        dose_number: body.dose_number || 1,
        total_doses: body.total_doses || 1,
        vaccination_site: body.vaccination_site || null,
        reminder_enabled: body.reminder_enabled !== false,
        reminder_days_before: body.reminder_days_before || 14,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 백신 기록 추가 실패:", error);
      console.groupEnd();
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    console.log("✅ 백신 기록 추가 완료:", { id: newRecord.id });
    console.groupEnd();

    return NextResponse.json({ record: newRecord }, { status: 201 });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
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

