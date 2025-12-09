/**
 * @file lib/health/hospital-records-sync.ts
 * @description 병원 방문 기록 동기화 로직
 * 
 * 마이데이터/건강정보고속도로에서 병원 방문 기록을 조회하여 데이터베이스에 저장
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { HospitalRecord } from "@/types/health-data-integration";

/**
 * 병원 방문 기록 정규화
 * API 응답을 데이터베이스 스키마에 맞게 변환
 */
function normalizeHospitalRecord(
  rawRecord: any,
  userId: string,
  familyMemberId: string | null,
  dataSourceId: string | null,
  isAutoSynced: boolean
): Partial<HospitalRecord> {
  return {
    user_id: userId,
    family_member_id: familyMemberId || null,
    visit_date: rawRecord.visit_date || rawRecord.visitDate || rawRecord.date,
    hospital_name: rawRecord.hospital_name || rawRecord.hospitalName || rawRecord.hospital || "",
    hospital_code: rawRecord.hospital_code || rawRecord.hospitalCode || null,
    department: rawRecord.department || rawRecord.dept || null,
    diagnosis: Array.isArray(rawRecord.diagnosis)
      ? rawRecord.diagnosis
      : rawRecord.diagnosis_name
      ? [rawRecord.diagnosis_name]
      : [],
    diagnosis_codes: Array.isArray(rawRecord.diagnosis_codes)
      ? rawRecord.diagnosis_codes
      : rawRecord.diagnosis_code
      ? [rawRecord.diagnosis_code]
      : [],
    prescribed_medications: Array.isArray(rawRecord.prescribed_medications)
      ? rawRecord.prescribed_medications
      : rawRecord.medications
      ? rawRecord.medications
      : [],
    treatment_summary: rawRecord.treatment_summary || rawRecord.treatmentSummary || rawRecord.summary || null,
    data_source_id: dataSourceId,
    is_auto_synced: isAutoSynced,
    notes: rawRecord.notes || null,
  };
}

/**
 * 병원 방문 기록 저장
 */
export async function saveHospitalRecords(
  records: Partial<HospitalRecord>[],
  userId: string
): Promise<{ saved: number; errors: number }> {
  console.group("[HospitalRecordsSync] 병원 방문 기록 저장");

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
      // 중복 확인 (visit_date, hospital_name, user_id 기준)
      const { data: existing } = await supabase
        .from("hospital_records")
        .select("id")
        .eq("user_id", userId)
        .eq("visit_date", record.visit_date)
        .eq("hospital_name", record.hospital_name)
        .maybeSingle();

      if (existing) {
        // 기존 기록 업데이트
        const { error: updateError } = await supabase
          .from("hospital_records")
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
          .from("hospital_records")
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

  console.log(`✅ 병원 방문 기록 저장 완료: ${saved}건 저장, ${errors}건 실패`);
  console.groupEnd();

  return { saved, errors };
}

/**
 * 병원 방문 기록 동기화
 * API에서 데이터를 가져와서 정규화하고 저장
 */
export async function syncHospitalRecords(
  rawRecords: any[],
  userId: string,
  familyMemberId: string | null,
  dataSourceId: string | null
): Promise<{ saved: number; errors: number }> {
  console.group("[HospitalRecordsSync] 병원 방문 기록 동기화");

  const normalizedRecords = rawRecords.map((record) =>
    normalizeHospitalRecord(record, userId, familyMemberId, dataSourceId, true)
  );

  const result = await saveHospitalRecords(normalizedRecords, userId);

  console.groupEnd();
  return result;
}

