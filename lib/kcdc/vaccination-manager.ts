/**
 * @file lib/kcdc/vaccination-manager.ts
 * @description 예방접종 기록 및 일정 관리 로직
 * 
 * 사용자 및 가족 구성원의 예방접종 기록을 관리하고,
 * KCDC 권장 일정에 따라 예방접종 일정을 자동 생성합니다.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  VaccinationRecord,
  VaccinationSchedule,
  VaccinationPriority,
  VaccinationScheduleStatus,
  VaccinationScheduleSource,
} from "@/types/kcdc";
import { fetchKcdcData } from "./kcdc-parser";

/**
 * 예방접종 기록 생성 파라미터
 */
export interface CreateVaccinationRecordParams {
  userId: string;
  familyMemberId?: string;
  vaccineName: string;
  vaccineCode?: string;
  targetAgeGroup?: string;
  scheduledDate?: string;
  completedDate?: string;
  doseNumber: number;
  totalDoses: number;
  vaccinationSite?: string;
  vaccinationSiteAddress?: string;
  reminderEnabled?: boolean;
  reminderDaysBefore?: number;
  notes?: string;
}

/**
 * 예방접종 일정 생성 파라미터
 */
export interface CreateVaccinationScheduleParams {
  userId: string;
  familyMemberId: string;
  vaccineName: string;
  recommendedDate: string;
  priority: VaccinationPriority;
  source: VaccinationScheduleSource;
}

/**
 * 예방접종 기록 생성
 */
export async function createVaccinationRecord(
  params: CreateVaccinationRecordParams
): Promise<VaccinationRecord> {
  console.group("[VaccinationManager] 예방접종 기록 생성");
  console.log("파라미터:", params);

  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("user_vaccination_records")
      .insert({
        user_id: params.userId,
        family_member_id: params.familyMemberId || null,
        vaccine_name: params.vaccineName,
        vaccine_code: params.vaccineCode || null,
        target_age_group: params.targetAgeGroup || null,
        scheduled_date: params.scheduledDate || null,
        completed_date: params.completedDate || null,
        dose_number: params.doseNumber,
        total_doses: params.totalDoses,
        vaccination_site: params.vaccinationSite || null,
        vaccination_site_address: params.vaccinationSiteAddress || null,
        reminder_enabled: params.reminderEnabled ?? true,
        reminder_days_before: params.reminderDaysBefore ?? 7,
        notes: params.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 예방접종 기록 생성 실패:", error);
      throw error;
    }

    console.log("✅ 예방접종 기록 생성 완료:", data.id);
    console.groupEnd();

    return data as VaccinationRecord;
  } catch (error) {
    console.error("❌ 예방접종 기록 생성 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 예방접종 기록 조회
 */
export async function getVaccinationRecords(
  userId: string,
  familyMemberId?: string
): Promise<VaccinationRecord[]> {
  console.group("[VaccinationManager] 예방접종 기록 조회");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from("user_vaccination_records")
      .select("*")
      .eq("user_id", userId)
      .order("completed_date", { ascending: false })
      .order("scheduled_date", { ascending: false });

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 예방접종 기록 조회 실패:", error);
      throw error;
    }

    console.log(`✅ 예방접종 기록 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return (data || []) as VaccinationRecord[];
  } catch (error) {
    console.error("❌ 예방접종 기록 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 예방접종 기록 수정
 */
export async function updateVaccinationRecord(
  recordId: string,
  userId: string,
  updates: Partial<CreateVaccinationRecordParams>
): Promise<VaccinationRecord> {
  console.group("[VaccinationManager] 예방접종 기록 수정");
  console.log("기록 ID:", recordId);
  console.log("업데이트 내용:", updates);

  try {
    const supabase = getServiceRoleClient();

    // 본인 소유 확인
    const { data: existing } = await supabase
      .from("user_vaccination_records")
      .select("user_id")
      .eq("id", recordId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("Unauthorized: 이 기록을 수정할 권한이 없습니다.");
    }

    const updateData: Record<string, any> = {};
    if (updates.vaccineName !== undefined) updateData.vaccine_name = updates.vaccineName;
    if (updates.vaccineCode !== undefined) updateData.vaccine_code = updates.vaccineCode;
    if (updates.targetAgeGroup !== undefined) updateData.target_age_group = updates.targetAgeGroup;
    if (updates.scheduledDate !== undefined) updateData.scheduled_date = updates.scheduledDate;
    if (updates.completedDate !== undefined) updateData.completed_date = updates.completedDate;
    if (updates.doseNumber !== undefined) updateData.dose_number = updates.doseNumber;
    if (updates.totalDoses !== undefined) updateData.total_doses = updates.totalDoses;
    if (updates.vaccinationSite !== undefined) updateData.vaccination_site = updates.vaccinationSite;
    if (updates.vaccinationSiteAddress !== undefined) updateData.vaccination_site_address = updates.vaccinationSiteAddress;
    if (updates.reminderEnabled !== undefined) updateData.reminder_enabled = updates.reminderEnabled;
    if (updates.reminderDaysBefore !== undefined) updateData.reminder_days_before = updates.reminderDaysBefore;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from("user_vaccination_records")
      .update(updateData)
      .eq("id", recordId)
      .select()
      .single();

    if (error) {
      console.error("❌ 예방접종 기록 수정 실패:", error);
      throw error;
    }

    console.log("✅ 예방접종 기록 수정 완료:", data.id);
    console.groupEnd();

    return data as VaccinationRecord;
  } catch (error) {
    console.error("❌ 예방접종 기록 수정 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 예방접종 기록 삭제
 */
export async function deleteVaccinationRecord(
  recordId: string,
  userId: string
): Promise<void> {
  console.group("[VaccinationManager] 예방접종 기록 삭제");
  console.log("기록 ID:", recordId);

  try {
    const supabase = getServiceRoleClient();

    // 본인 소유 확인
    const { data: existing } = await supabase
      .from("user_vaccination_records")
      .select("user_id")
      .eq("id", recordId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("Unauthorized: 이 기록을 삭제할 권한이 없습니다.");
    }

    const { error } = await supabase
      .from("user_vaccination_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error("❌ 예방접종 기록 삭제 실패:", error);
      throw error;
    }

    console.log("✅ 예방접종 기록 삭제 완료");
    console.groupEnd();
  } catch (error) {
    console.error("❌ 예방접종 기록 삭제 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 예방접종 일정 생성
 */
export async function createVaccinationSchedule(
  params: CreateVaccinationScheduleParams
): Promise<VaccinationSchedule> {
  console.group("[VaccinationManager] 예방접종 일정 생성");
  console.log("파라미터:", params);

  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("user_vaccination_schedules")
      .insert({
        user_id: params.userId,
        family_member_id: params.familyMemberId,
        vaccine_name: params.vaccineName,
        recommended_date: params.recommendedDate,
        priority: params.priority,
        status: "pending",
        source: params.source,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 예방접종 일정 생성 실패:", error);
      throw error;
    }

    console.log("✅ 예방접종 일정 생성 완료:", data.id);
    console.groupEnd();

    return data as VaccinationSchedule;
  } catch (error) {
    console.error("❌ 예방접종 일정 생성 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 예방접종 일정 조회
 */
export async function getVaccinationSchedules(
  userId: string,
  familyMemberId?: string,
  status?: VaccinationScheduleStatus
): Promise<VaccinationSchedule[]> {
  console.group("[VaccinationManager] 예방접종 일정 조회");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId);
  console.log("상태:", status);

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from("user_vaccination_schedules")
      .select("*")
      .eq("user_id", userId)
      .order("recommended_date", { ascending: true });

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 예방접종 일정 조회 실패:", error);
      throw error;
    }

    console.log(`✅ 예방접종 일정 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return (data || []) as VaccinationSchedule[];
  } catch (error) {
    console.error("❌ 예방접종 일정 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 예방접종 일정 상태 업데이트
 */
export async function updateVaccinationScheduleStatus(
  scheduleId: string,
  userId: string,
  status: VaccinationScheduleStatus
): Promise<VaccinationSchedule> {
  console.group("[VaccinationManager] 예방접종 일정 상태 업데이트");
  console.log("일정 ID:", scheduleId);
  console.log("새 상태:", status);

  try {
    const supabase = getServiceRoleClient();

    // 본인 소유 확인
    const { data: existing } = await supabase
      .from("user_vaccination_schedules")
      .select("user_id")
      .eq("id", scheduleId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("Unauthorized: 이 일정을 수정할 권한이 없습니다.");
    }

    const { data, error } = await supabase
      .from("user_vaccination_schedules")
      .update({ status })
      .eq("id", scheduleId)
      .select()
      .single();

    if (error) {
      console.error("❌ 예방접종 일정 상태 업데이트 실패:", error);
      throw error;
    }

    console.log("✅ 예방접종 일정 상태 업데이트 완료:", data.id);
    console.groupEnd();

    return data as VaccinationSchedule;
  } catch (error) {
    console.error("❌ 예방접종 일정 상태 업데이트 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * KCDC 예방접종 일정 동기화
 * 
 * KCDC API에서 예방접종 정보를 가져와 사용자 및 가족 구성원의 연령대에 맞는 일정을 생성합니다.
 */
export async function syncKcdcVaccinationSchedules(
  userId: string,
  familyMemberIds?: string[]
): Promise<VaccinationSchedule[]> {
  console.group("[VaccinationManager] KCDC 예방접종 일정 동기화");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID 목록:", familyMemberIds);

  try {
    // 1. KCDC 데이터 가져오기
    const kcdcData = await fetchKcdcData();
    const vaccinations = kcdcData.vaccinations || [];

    if (vaccinations.length === 0) {
      console.log("⚠️ KCDC 예방접종 데이터가 없습니다.");
      console.groupEnd();
      return [];
    }

    console.log(`📊 KCDC 예방접종 데이터: ${vaccinations.length}건`);

    const supabase = getServiceRoleClient();

    // 2. 사용자 및 가족 구성원 정보 조회
    const members = await getFamilyMembersWithAge(supabase, userId, familyMemberIds);

    const createdSchedules: VaccinationSchedule[] = [];

    // 3. 각 구성원별로 예방접종 일정 생성
    for (const member of members) {
      for (const vaccine of vaccinations) {
        // 연령대 매칭 확인
        if (!isAgeGroupMatch(member.age, vaccine.targetAgeGroup)) {
          continue;
        }

        // 이미 일정이 있는지 확인
        const existing = await checkExistingSchedule(
          supabase,
          userId,
          member.id,
          vaccine.name
        );

        if (existing) {
          console.log(`⏭️ 이미 일정이 존재합니다: ${vaccine.name} (${member.name})`);
          continue;
        }

        // 일정 생성
        const schedule = await createVaccinationSchedule({
          userId,
          familyMemberId: member.id,
          vaccineName: vaccine.name,
          recommendedDate: vaccine.recommendedDate || new Date().toISOString().split("T")[0],
          priority: determinePriority(vaccine.targetAgeGroup),
          source: "kcdc",
        });

        createdSchedules.push(schedule);
      }
    }

    console.log(`✅ 예방접종 일정 동기화 완료: ${createdSchedules.length}건 생성`);
    console.groupEnd();

    return createdSchedules;
  } catch (error) {
    console.error("❌ KCDC 예방접종 일정 동기화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 가족 구성원 정보 조회 (나이 포함)
 */
async function getFamilyMembersWithAge(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  familyMemberIds?: string[]
): Promise<Array<{ id: string; name: string; age: number | null }>> {
  const members: Array<{ id: string; name: string; age: number | null }> = [];

  // 본인 정보 조회
  const { data: profile } = await supabase
    .from("user_health_profiles")
    .select("age")
    .eq("user_id", userId)
    .single();

  if (profile) {
    members.push({
      id: userId, // 본인은 user_id 사용
      name: "본인",
      age: profile.age,
    });
  }

  // 가족 구성원 정보 조회
  let query = supabase
    .from("family_members")
    .select("id, name, birth_date")
    .eq("user_id", userId);

  if (familyMemberIds && familyMemberIds.length > 0) {
    query = query.in("id", familyMemberIds);
  }

  const { data: familyMembers } = await query;

  if (familyMembers) {
    for (const member of familyMembers) {
      const age = member.birth_date ? calculateAge(member.birth_date) : null;
      members.push({
        id: member.id,
        name: member.name,
        age,
      });
    }
  }

  return members;
}

/**
 * 생년월일로 나이 계산
 */
function calculateAge(birthDate: string): number | null {
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

/**
 * 연령대 매칭 확인
 */
function isAgeGroupMatch(
  age: number | null,
  targetAgeGroup?: string
): boolean {
  if (!age || !targetAgeGroup) return false;
  if (targetAgeGroup === "전체") return true;

  if (targetAgeGroup === "영유아" && age < 7) return true;
  if (targetAgeGroup === "청소년" && age >= 7 && age < 19) return true;
  if (targetAgeGroup === "성인" && age >= 19 && age < 65) return true;
  if (targetAgeGroup === "노인" && age >= 65) return true;

  return false;
}

/**
 * 기존 일정 확인
 */
async function checkExistingSchedule(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  familyMemberId: string,
  vaccineName: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_vaccination_schedules")
    .select("id")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId)
    .eq("vaccine_name", vaccineName)
    .eq("status", "pending")
    .limit(1);

  return (data?.length || 0) > 0;
}

/**
 * 우선순위 결정
 */
function determinePriority(targetAgeGroup?: string): VaccinationPriority {
  if (!targetAgeGroup) return "recommended";
  if (targetAgeGroup === "영유아" || targetAgeGroup === "노인") {
    return "required";
  }
  return "recommended";
}

