/**
 * @file lib/health/disease-records-sync.ts
 * @description 질병 진단 기록 동기화 로직
 * 
 * 병원기록에서 진단명을 추출하여 질병 기록 생성 및 기존 user_health_profiles.diseases와 연동
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { DiseaseRecord } from "@/types/health-data-integration";

/**
 * 질병 진단 기록 정규화
 */
function normalizeDiseaseRecord(
  rawRecord: any,
  userId: string,
  familyMemberId: string | null,
  hospitalRecordId: string | null,
  dataSourceId: string | null,
  isAutoSynced: boolean
): Partial<DiseaseRecord> {
  return {
    user_id: userId,
    family_member_id: familyMemberId || null,
    disease_name: rawRecord.disease_name || rawRecord.diseaseName || rawRecord.name || "",
    disease_code: rawRecord.disease_code || rawRecord.diseaseCode || null,
    diagnosis_date: rawRecord.diagnosis_date || rawRecord.diagnosisDate || rawRecord.date || "",
    hospital_name: rawRecord.hospital_name || rawRecord.hospitalName || rawRecord.hospital || null,
    hospital_record_id: hospitalRecordId,
    status: rawRecord.status || "active",
    severity: rawRecord.severity || null,
    treatment_plan: rawRecord.treatment_plan || rawRecord.treatmentPlan || null,
    data_source_id: dataSourceId,
    is_auto_synced: isAutoSynced,
    notes: rawRecord.notes || null,
  };
}

/**
 * 병원 기록에서 질병 기록 추출
 */
export function extractDiseaseRecordsFromHospitalRecord(
  hospitalRecord: any,
  userId: string,
  familyMemberId: string | null,
  hospitalRecordId: string,
  dataSourceId: string | null
): Partial<DiseaseRecord>[] {
  const diseases: Partial<DiseaseRecord>[] = [];

  // 진단명 배열에서 질병 기록 생성
  const diagnoses = Array.isArray(hospitalRecord.diagnosis)
    ? hospitalRecord.diagnosis
    : hospitalRecord.diagnosis_name
    ? [hospitalRecord.diagnosis_name]
    : [];

  const diagnosisCodes = Array.isArray(hospitalRecord.diagnosis_codes)
    ? hospitalRecord.diagnosis_codes
    : hospitalRecord.diagnosis_code
    ? [hospitalRecord.diagnosis_code]
    : [];

  diagnoses.forEach((diagnosis: string, index: number) => {
    diseases.push(
      normalizeDiseaseRecord(
        {
          disease_name: diagnosis,
          disease_code: diagnosisCodes[index] || null,
          diagnosis_date: hospitalRecord.visit_date || hospitalRecord.visitDate,
          hospital_name: hospitalRecord.hospital_name || hospitalRecord.hospitalName,
        },
        userId,
        familyMemberId,
        hospitalRecordId,
        dataSourceId,
        true
      )
    );
  });

  return diseases;
}

/**
 * 질병 기록 저장
 */
export async function saveDiseaseRecords(
  records: Partial<DiseaseRecord>[],
  userId: string
): Promise<{ saved: number; errors: number }> {
  console.group("[DiseaseRecordsSync] 질병 진단 기록 저장");

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
      // 중복 확인 (disease_name, diagnosis_date, user_id 기준)
      const { data: existing } = await supabase
        .from("disease_records")
        .select("id")
        .eq("user_id", userId)
        .eq("disease_name", record.disease_name)
        .eq("diagnosis_date", record.diagnosis_date)
        .maybeSingle();

      if (existing) {
        // 기존 기록 업데이트
        const { error: updateError } = await supabase
          .from("disease_records")
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
          .from("disease_records")
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

  console.log(`✅ 질병 진단 기록 저장 완료: ${saved}건 저장, ${errors}건 실패`);
  console.groupEnd();

  return { saved, errors };
}

/**
 * 질병 기록 동기화
 */
export async function syncDiseaseRecords(
  rawRecords: any[],
  userId: string,
  familyMemberId: string | null,
  hospitalRecordId: string | null,
  dataSourceId: string | null
): Promise<{ saved: number; errors: number }> {
  console.group("[DiseaseRecordsSync] 질병 진단 기록 동기화");

  const normalizedRecords = rawRecords.map((record) =>
    normalizeDiseaseRecord(record, userId, familyMemberId, hospitalRecordId, dataSourceId, true)
  );

  const result = await saveDiseaseRecords(normalizedRecords, userId);

  console.groupEnd();
  return result;
}

/**
 * user_health_profiles.diseases와 동기화
 * disease_records의 활성 질병을 user_health_profiles에 반영
 */
export async function syncDiseasesToHealthProfile(userId: string): Promise<void> {
  console.group("[DiseaseRecordsSync] 건강 프로필 질병 정보 동기화");

  const supabase = getServiceRoleClient();

  // 활성 질병 기록 조회
  const { data: activeDiseases, error } = await supabase
    .from("disease_records")
    .select("disease_code, disease_name")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("❌ 질병 기록 조회 실패:", error);
    console.groupEnd();
    return;
  }

  // disease_code가 있는 경우 code 우선, 없으면 name 사용
  const diseaseCodes = activeDiseases
    ?.map((d) => d.disease_code || d.disease_name)
    .filter(Boolean) || [];

  // user_health_profiles 업데이트
  const { error: updateError } = await supabase
    .from("user_health_profiles")
    .update({
      diseases: diseaseCodes,
      diseases_jsonb: activeDiseases?.map((d) => ({
        code: d.disease_code || d.disease_name,
        custom_name: d.disease_code ? null : d.disease_name,
      })) || [],
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("❌ 건강 프로필 업데이트 실패:", updateError);
  } else {
    console.log(`✅ 건강 프로필 질병 정보 동기화 완료: ${diseaseCodes.length}개`);
  }

  console.groupEnd();
}

