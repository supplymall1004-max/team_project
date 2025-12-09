/**
 * @file lib/health/medication-records-sync.ts
 * @description 약물 복용 기록 동기화 로직
 * 
 * 마이데이터/건강정보고속도로에서 약물 복용 기록을 조회하여 데이터베이스에 저장
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { MedicationRecord } from "@/types/health-data-integration";

/**
 * 약물 복용 기록 정규화
 */
function normalizeMedicationRecord(
  rawRecord: any,
  userId: string,
  familyMemberId: string | null,
  hospitalRecordId: string | null,
  dataSourceId: string | null,
  isAutoSynced: boolean
): Partial<MedicationRecord> {
  // 복용 시간 파싱 (문자열 또는 배열)
  let reminderTimes: string[] = [];
  if (rawRecord.reminder_times) {
    reminderTimes = Array.isArray(rawRecord.reminder_times)
      ? rawRecord.reminder_times
      : [rawRecord.reminder_times];
  } else if (rawRecord.times) {
    reminderTimes = Array.isArray(rawRecord.times) ? rawRecord.times : [rawRecord.times];
  }

  return {
    user_id: userId,
    family_member_id: familyMemberId || null,
    medication_name: rawRecord.medication_name || rawRecord.medicationName || rawRecord.name || "",
    medication_code: rawRecord.medication_code || rawRecord.medicationCode || null,
    active_ingredient: rawRecord.active_ingredient || rawRecord.activeIngredient || null,
    dosage: rawRecord.dosage || rawRecord.dose || "",
    frequency: rawRecord.frequency || rawRecord.freq || "",
    start_date: rawRecord.start_date || rawRecord.startDate || rawRecord.start || "",
    end_date: rawRecord.end_date || rawRecord.endDate || rawRecord.end || null,
    reminder_times: reminderTimes,
    reminder_enabled: rawRecord.reminder_enabled !== undefined ? rawRecord.reminder_enabled : true,
    hospital_record_id: hospitalRecordId,
    data_source_id: dataSourceId,
    is_auto_synced: isAutoSynced,
    notes: rawRecord.notes || null,
  };
}

/**
 * 약물 복용 기록 저장
 */
export async function saveMedicationRecords(
  records: Partial<MedicationRecord>[],
  userId: string
): Promise<{ saved: number; errors: number }> {
  console.group("[MedicationRecordsSync] 약물 복용 기록 저장");

  if (records.length === 0) {
    console.log("📋 저장할 기록이 없습니다.");
    console.groupEnd();
    return { saved: 0, errors: 0 };
  }

  const supabase = getServiceRoleClient();
  let saved = 0;
  let errors = 0;

  for (const record of records) {
    try {
      // 중복 확인 (medication_name, start_date, user_id 기준)
      const { data: existing } = await supabase
        .from("medication_records")
        .select("id")
        .eq("user_id", userId)
        .eq("medication_name", record.medication_name)
        .eq("start_date", record.start_date)
        .maybeSingle();

      if (existing) {
        // 기존 기록 업데이트
        const { error: updateError } = await supabase
          .from("medication_records")
          .update(record)
          .eq("id", existing.id);

        if (updateError) {
          console.error(`❌ 기록 업데이트 실패:`, updateError);
          errors++;
        } else {
          saved++;
        }
      } else {
        // 새 기록 생성
        const { error: insertError } = await supabase
          .from("medication_records")
          .insert(record);

        if (insertError) {
          console.error(`❌ 기록 저장 실패:`, insertError);
          errors++;
        } else {
          saved++;
        }
      }
    } catch (error) {
      console.error(`❌ 기록 처리 중 오류:`, error);
      errors++;
    }
  }

  console.log(`✅ 약물 복용 기록 저장 완료: ${saved}건 저장, ${errors}건 실패`);
  console.groupEnd();

  return { saved, errors };
}

/**
 * 약물 복용 기록 동기화
 */
export async function syncMedicationRecords(
  rawRecords: any[],
  userId: string,
  familyMemberId: string | null,
  hospitalRecordId: string | null,
  dataSourceId: string | null
): Promise<{ saved: number; errors: number }> {
  console.group("[MedicationRecordsSync] 약물 복용 기록 동기화");

  const normalizedRecords = rawRecords.map((record) =>
    normalizeMedicationRecord(record, userId, familyMemberId, hospitalRecordId, dataSourceId, true)
  );

  const result = await saveMedicationRecords(normalizedRecords, userId);

  console.groupEnd();
  return result;
}

