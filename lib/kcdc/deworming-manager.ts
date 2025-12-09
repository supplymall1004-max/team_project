/**
 * @file lib/kcdc/deworming-manager.ts
 * @description 구충제 복용 기록 관리 로직
 * 
 * 구충제 복용 기록을 관리하고 다음 복용 일정을 추적합니다.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  DewormingRecord,
  DewormingMedication,
} from "@/types/kcdc";

/**
 * 구충제 복용 기록 생성 파라미터
 */
export interface CreateDewormingRecordParams {
  userId: string;
  familyMemberId?: string | null;
  medicationName: string;
  dosage: string;
  takenDate: string;
  cycleDays?: number;
  prescribedBy?: string | null;
  notes?: string | null;
}

/**
 * 구충제 복용 기록 수정 파라미터
 */
export interface UpdateDewormingRecordParams {
  medicationName?: string;
  dosage?: string;
  takenDate?: string;
  nextDueDate?: string | null;
  cycleDays?: number;
  prescribedBy?: string | null;
  notes?: string | null;
}

/**
 * 다음 복용일 계산
 * 
 * @param takenDate 복용일
 * @param cycleDays 복용 주기 (일)
 * @returns 다음 복용 예정일
 */
function calculateNextDueDate(takenDate: string, cycleDays: number): string {
  const date = new Date(takenDate);
  date.setDate(date.getDate() + cycleDays);
  return date.toISOString().split("T")[0];
}

/**
 * 구충제 복용 기록 목록 조회
 * 
 * @param userId 사용자 ID
 * @param familyMemberId 가족 구성원 ID (선택사항)
 * @returns 구충제 복용 기록 목록
 */
export async function getDewormingRecords(
  userId: string,
  familyMemberId?: string | null
): Promise<DewormingRecord[]> {
  console.group("[DewormingManager] 복용 기록 조회");
  console.log("userId:", userId);
  console.log("familyMemberId:", familyMemberId);

  const supabase = getServiceRoleClient();

  let query = supabase
    .from("user_deworming_records")
    .select("*")
    .eq("user_id", userId)
    .order("taken_date", { ascending: false });

  if (familyMemberId) {
    query = query.eq("family_member_id", familyMemberId);
  } else {
    query = query.is("family_member_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ 조회 실패:", error);
    console.groupEnd();
    throw new Error(`구충제 복용 기록 조회 실패: ${error.message}`);
  }

  console.log("✅ 조회 성공:", data?.length || 0, "개");
  console.groupEnd();

  return (data || []) as DewormingRecord[];
}

/**
 * 구충제 복용 기록 생성
 * 
 * @param params 생성 파라미터
 * @returns 생성된 기록
 */
export async function createDewormingRecord(
  params: CreateDewormingRecordParams
): Promise<DewormingRecord> {
  console.group("[DewormingManager] 복용 기록 생성");
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  const cycleDays = params.cycleDays ?? 90;
  const nextDueDate = calculateNextDueDate(params.takenDate, cycleDays);

  const recordData = {
    user_id: params.userId,
    family_member_id: params.familyMemberId || null,
    medication_name: params.medicationName,
    dosage: params.dosage,
    taken_date: params.takenDate,
    next_due_date: nextDueDate,
    cycle_days: cycleDays,
    prescribed_by: params.prescribedBy || null,
    notes: params.notes || null,
  };

  const { data, error } = await supabase
    .from("user_deworming_records")
    .insert(recordData)
    .select()
    .single();

  if (error) {
    console.error("❌ 생성 실패:", error);
    console.groupEnd();
    throw new Error(`구충제 복용 기록 생성 실패: ${error.message}`);
  }

  console.log("✅ 생성 성공:", data.id);
  console.log("다음 복용일:", data.next_due_date);
  console.groupEnd();

  return data as DewormingRecord;
}

/**
 * 구충제 복용 기록 수정
 * 
 * @param recordId 기록 ID
 * @param userId 사용자 ID
 * @param params 수정 파라미터
 * @returns 수정된 기록
 */
export async function updateDewormingRecord(
  recordId: string,
  userId: string,
  params: UpdateDewormingRecordParams
): Promise<DewormingRecord> {
  console.group("[DewormingManager] 복용 기록 수정");
  console.log("recordId:", recordId);
  console.log("params:", params);

  const supabase = getServiceRoleClient();

  // 기존 기록 조회
  const { data: existingRecord, error: fetchError } = await supabase
    .from("user_deworming_records")
    .select("*")
    .eq("id", recordId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingRecord) {
    console.error("❌ 기록 조회 실패:", fetchError);
    console.groupEnd();
    throw new Error("기록을 찾을 수 없습니다.");
  }

  // 다음 복용일 재계산 (필요한 경우)
  let nextDueDate = params.nextDueDate;
  if (
    params.takenDate !== undefined ||
    params.cycleDays !== undefined
  ) {
    const takenDate =
      params.takenDate !== undefined
        ? params.takenDate
        : existingRecord.taken_date;
    const cycleDays =
      params.cycleDays !== undefined
        ? params.cycleDays
        : existingRecord.cycle_days;

    nextDueDate = calculateNextDueDate(takenDate, cycleDays);
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (params.medicationName !== undefined)
    updateData.medication_name = params.medicationName;
  if (params.dosage !== undefined) updateData.dosage = params.dosage;
  if (params.takenDate !== undefined)
    updateData.taken_date = params.takenDate;
  if (nextDueDate !== undefined) updateData.next_due_date = nextDueDate;
  if (params.cycleDays !== undefined)
    updateData.cycle_days = params.cycleDays;
  if (params.prescribedBy !== undefined)
    updateData.prescribed_by = params.prescribedBy;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from("user_deworming_records")
    .update(updateData)
    .eq("id", recordId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("❌ 수정 실패:", error);
    console.groupEnd();
    throw new Error(`구충제 복용 기록 수정 실패: ${error.message}`);
  }

  console.log("✅ 수정 성공:", data.id);
  console.groupEnd();

  return data as DewormingRecord;
}

/**
 * 구충제 복용 기록 삭제
 * 
 * @param recordId 기록 ID
 * @param userId 사용자 ID
 */
export async function deleteDewormingRecord(
  recordId: string,
  userId: string
): Promise<void> {
  console.group("[DewormingManager] 복용 기록 삭제");
  console.log("recordId:", recordId);

  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("user_deworming_records")
    .delete()
    .eq("id", recordId)
    .eq("user_id", userId);

  if (error) {
    console.error("❌ 삭제 실패:", error);
    console.groupEnd();
    throw new Error(`구충제 복용 기록 삭제 실패: ${error.message}`);
  }

  console.log("✅ 삭제 성공");
  console.groupEnd();
}

/**
 * 구충제 마스터 데이터 목록 조회
 * 
 * @param ageGroup 연령대 필터 (선택사항)
 * @returns 구충제 마스터 데이터 목록
 */
export async function getDewormingMedications(
  ageGroup?: string
): Promise<DewormingMedication[]> {
  console.group("[DewormingManager] 구충제 목록 조회");
  console.log("ageGroup:", ageGroup);

  const supabase = getServiceRoleClient();

  let query = supabase
    .from("deworming_medications")
    .select("*")
    .order("medication_name", { ascending: true });

  if (ageGroup) {
    query = query.or(`age_group.is.null,age_group.eq.${ageGroup}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ 조회 실패:", error);
    console.groupEnd();
    throw new Error(`구충제 목록 조회 실패: ${error.message}`);
  }

  console.log("✅ 조회 성공:", data?.length || 0, "개");
  console.groupEnd();

  return (data || []) as DewormingMedication[];
}

/**
 * 다음 복용 예정인 구충제 기록 조회
 * 
 * @param userId 사용자 ID
 * @param days 일수 (기본값: 30)
 * @returns 다음 복용 예정 기록 목록
 */
export async function getUpcomingDewormingRecords(
  userId: string,
  days: number = 30
): Promise<DewormingRecord[]> {
  console.group("[DewormingManager] 다음 복용 예정 기록 조회");
  console.log("userId:", userId);
  console.log("days:", days);

  const supabase = getServiceRoleClient();

  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  const endDateStr = endDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("user_deworming_records")
    .select("*")
    .eq("user_id", userId)
    .not("next_due_date", "is", null)
    .gte("next_due_date", today)
    .lte("next_due_date", endDateStr)
    .order("next_due_date", { ascending: true });

  if (error) {
    console.error("❌ 조회 실패:", error);
    console.groupEnd();
    throw new Error(`다음 복용 예정 기록 조회 실패: ${error.message}`);
  }

  console.log("✅ 조회 성공:", data?.length || 0, "개");
  console.groupEnd();

  return (data || []) as DewormingRecord[];
}

