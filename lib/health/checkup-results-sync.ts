/**
 * @file lib/health/checkup-results-sync.ts
 * @description 건강검진 결과 동기화 로직
 * 
 * 건강정보고속도로에서 건강검진 결과를 조회하여 user_health_checkup_records 테이블에 저장
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { HealthCheckupRecord } from "@/types/kcdc";

/**
 * 건강검진 결과 정규화
 */
function normalizeCheckupRecord(
  rawRecord: any,
  userId: string,
  familyMemberId: string | null,
  dataSourceId: string | null,
  isAutoSynced: boolean
): Partial<HealthCheckupRecord> {
  return {
    user_id: userId,
    family_member_id: familyMemberId || null,
    checkup_type: rawRecord.checkup_type || rawRecord.checkupType || "national",
    checkup_date: rawRecord.checkup_date || rawRecord.checkupDate || rawRecord.date || "",
    checkup_site: rawRecord.checkup_site || rawRecord.checkupSite || rawRecord.site || null,
    checkup_site_address: rawRecord.checkup_site_address || rawRecord.checkupSiteAddress || null,
    results: rawRecord.results || rawRecord.result || {},
    next_recommended_date: rawRecord.next_recommended_date || rawRecord.nextRecommendedDate || null,
    overdue_days: rawRecord.overdue_days || rawRecord.overdueDays || null,
  };
}

/**
 * 건강검진 결과 저장
 */
export async function saveCheckupRecords(
  records: Partial<HealthCheckupRecord>[],
  userId: string
): Promise<{ saved: number; errors: number }> {
  console.group("[CheckupResultsSync] 건강검진 결과 저장");

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
      // 중복 확인 (checkup_type, checkup_date, user_id 기준)
      const { data: existing } = await supabase
        .from("user_health_checkup_records")
        .select("id")
        .eq("user_id", userId)
        .eq("checkup_type", record.checkup_type)
        .eq("checkup_date", record.checkup_date)
        .maybeSingle();

      if (existing) {
        // 기존 기록 업데이트
        const { error: updateError } = await supabase
          .from("user_health_checkup_records")
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
          .from("user_health_checkup_records")
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

  console.log(`✅ 건강검진 결과 저장 완료: ${saved}건 저장, ${errors}건 실패`);
  console.groupEnd();

  return { saved, errors };
}

/**
 * 건강검진 결과 동기화
 */
export async function syncCheckupRecords(
  rawRecords: any[],
  userId: string,
  familyMemberId: string | null,
  dataSourceId: string | null
): Promise<{ saved: number; errors: number }> {
  console.group("[CheckupResultsSync] 건강검진 결과 동기화");

  const normalizedRecords = rawRecords.map((record) =>
    normalizeCheckupRecord(record, userId, familyMemberId, dataSourceId, true)
  );

  const result = await saveCheckupRecords(normalizedRecords, userId);

  console.groupEnd();
  return result;
}

