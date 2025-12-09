/**
 * @file lib/health/lifecycle-vaccination-scheduler.ts
 * @description 생애주기별 예방주사 일정 생성 및 관리 로직
 * 
 * 생애주기별 예방주사 마스터 데이터를 기반으로 개인별 맞춤 일정 생성
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { LifecycleVaccinationSchedule } from "@/types/health-data-integration";

/**
 * 생애주기별 예방주사 일정 생성 파라미터
 */
export interface CreateLifecycleScheduleParams {
  familyMemberId: string;
  birthDate: string;
  gender?: "male" | "female";
}

/**
 * 생애주기별 예방주사 일정 생성 결과
 */
export interface LifecycleScheduleResult {
  schedules: Array<{
    vaccine_name: string;
    vaccine_code: string | null;
    recommended_date: string;
    priority: "required" | "recommended" | "optional";
    dose_number: number;
    total_doses: number;
    interval_days: number | null;
    source: string;
  }>;
  totalSchedules: number;
}

/**
 * 생애주기별 예방주사 일정 생성
 * 출생일과 현재 연령을 기준으로 모든 생애주기별 예방주사 일정을 계산하여 생성
 */
export async function createLifecycleVaccinationSchedules(
  params: CreateLifecycleScheduleParams
): Promise<LifecycleScheduleResult> {
  console.group("[LifecycleVaccinationScheduler] 생애주기별 예방주사 일정 생성");

  const supabase = getServiceRoleClient();
  const result: LifecycleScheduleResult = {
    schedules: [],
    totalSchedules: 0,
  };

  try {
    // 가족 구성원 정보 조회
    const { data: familyMember, error: memberError } = await supabase
      .from("family_members")
      .select("id, name, birth_date, gender, user_id")
      .eq("id", params.familyMemberId)
      .single();

    if (memberError || !familyMember) {
      console.error("❌ 가족 구성원 조회 실패:", memberError);
      console.groupEnd();
      throw new Error("가족 구성원을 찾을 수 없습니다.");
    }

    const birthDate = new Date(params.birthDate);
    const today = new Date();
    const currentAgeMonths = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const memberGender = params.gender || familyMember.gender;

    console.log(`👶 구성원: ${familyMember.name}, 현재 연령: ${Math.floor(currentAgeMonths / 12)}세 ${currentAgeMonths % 12}개월`);

    // 생애주기별 예방주사 마스터 데이터 조회
    const { data: masterSchedules, error: masterError } = await supabase
      .from("lifecycle_vaccination_schedules")
      .select("*")
      .eq("is_active", true)
      .order("target_age_min_months", { ascending: true });

    if (masterError) {
      console.error("❌ 마스터 데이터 조회 실패:", masterError);
      console.groupEnd();
      throw new Error("예방주사 마스터 데이터 조회에 실패했습니다.");
    }

    // 기존 예방주사 기록 조회 (중복 방지)
    const { data: existingRecords, error: recordsError } = await supabase
      .from("user_vaccination_records")
      .select("vaccine_name, vaccine_code, dose_number, completed_date")
      .eq("family_member_id", params.familyMemberId);

    if (recordsError) {
      console.warn("⚠️ 기존 예방주사 기록 조회 실패:", recordsError);
    }

    // 완료된 예방주사 맵 생성
    const completedVaccinations = new Map<string, Set<number>>();
    existingRecords?.forEach(record => {
      const key = `${record.vaccine_name}_${record.vaccine_code || ''}`;
      if (!completedVaccinations.has(key)) {
        completedVaccinations.set(key, new Set());
      }
      if (record.completed_date) {
        completedVaccinations.get(key)?.add(record.dose_number);
      }
    });

    // 각 마스터 일정에 대해 개인별 일정 생성
    for (const master of masterSchedules || []) {
      // 성별 필터링
      if (master.gender_requirement && master.gender_requirement !== "all" && master.gender_requirement !== memberGender) {
        continue;
      }

      // 현재 연령이 대상 연령 범위 내인지 확인
      const minAge = master.target_age_min_months || 0;
      const maxAge = master.target_age_max_months || Infinity;

      if (currentAgeMonths < minAge || currentAgeMonths > maxAge) {
        continue;
      }

      // 완료된 접종인지 확인
      const vaccineKey = `${master.vaccine_name}_${master.vaccine_code || ''}`;
      const completedDoses = completedVaccinations.get(vaccineKey) || new Set();

      if (completedDoses.has(master.dose_number)) {
        console.log(`✅ ${master.vaccine_name} ${master.dose_number}차 완료됨 - 건너뜀`);
        continue;
      }

      // 접종 예정일 계산
      let recommendedDate: Date;

      if (master.dose_number === 1) {
        // 1차 접종: 생후 최소 연령부터 시작
        recommendedDate = new Date(birthDate);
        recommendedDate.setMonth(recommendedDate.getMonth() + minAge);
      } else {
        // 2차 이상: 이전 접종일로부터 간격 계산
        // 이전 차수 완료 기록 찾기
        const prevDose = master.dose_number - 1;
        const prevCompletedDate = existingRecords?.find(
          r => r.vaccine_name === master.vaccine_name &&
               r.dose_number === prevDose &&
               r.completed_date
        )?.completed_date;

        if (prevCompletedDate && master.interval_days) {
          recommendedDate = new Date(prevCompletedDate);
          recommendedDate.setDate(recommendedDate.getDate() + master.interval_days);
        } else {
          // 이전 접종 기록이 없으면 최소 연령 기준으로 계산
          recommendedDate = new Date(birthDate);
          recommendedDate.setMonth(recommendedDate.getMonth() + minAge);
        }
      }

      // 미래 일정만 포함 (과거 일정은 의미 없음)
      if (recommendedDate <= today) {
        console.log(`⏰ ${master.vaccine_name} ${master.dose_number}차 예정일이 과거 - 건너뜀`);
        continue;
      }

      // 일정 추가
      result.schedules.push({
        vaccine_name: master.vaccine_name,
        vaccine_code: master.vaccine_code,
        recommended_date: recommendedDate.toISOString().split('T')[0],
        priority: master.priority,
        dose_number: master.dose_number,
        total_doses: master.total_doses,
        interval_days: master.interval_days,
        source: master.source,
      });
    }

    // 우선순위 및 날짜순으로 정렬
    result.schedules.sort((a, b) => {
      // 우선순위: required > recommended > optional
      const priorityOrder = { required: 3, recommended: 2, optional: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 날짜순
      return new Date(a.recommended_date).getTime() - new Date(b.recommended_date).getTime();
    });

    result.totalSchedules = result.schedules.length;

    console.log(`✅ 생애주기별 예방주사 일정 생성 완료: ${result.totalSchedules}건`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 생애주기별 예방주사 일정 생성 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 생애주기별 예방주사 일정 데이터베이스 저장
 */
export async function saveLifecycleVaccinationSchedules(
  userId: string,
  familyMemberId: string,
  schedules: LifecycleScheduleResult["schedules"]
): Promise<{ saved: number; errors: number }> {
  console.group("[LifecycleVaccinationScheduler] 생애주기별 예방주사 일정 저장");

  const supabase = getServiceRoleClient();
  let saved = 0;
  let errors = 0;

  for (const schedule of schedules) {
    try {
      // 중복 확인 (family_member_id, vaccine_name, dose_number 기준)
      const { data: existing } = await supabase
        .from("user_vaccination_schedules")
        .select("id")
        .eq("family_member_id", familyMemberId)
        .eq("vaccine_name", schedule.vaccine_name)
        .eq("dose_number", schedule.dose_number)
        .maybeSingle();

      if (existing) {
        console.log(`📝 ${schedule.vaccine_name} ${schedule.dose_number}차 일정이 이미 존재 - 업데이트`);
        // 기존 일정 업데이트
        const { error: updateError } = await supabase
          .from("user_vaccination_schedules")
          .update({
            recommended_date: schedule.recommended_date,
            priority: schedule.priority,
            source: schedule.source,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error(`❌ 일정 업데이트 실패:`, updateError);
          errors++;
        } else {
          saved++;
        }
      } else {
        // 새 일정 생성
        const { error: insertError } = await supabase
          .from("user_vaccination_schedules")
          .insert({
            user_id: userId,
            family_member_id: familyMemberId,
            vaccine_name: schedule.vaccine_name,
            vaccine_code: schedule.vaccine_code,
            recommended_date: schedule.recommended_date,
            priority: schedule.priority,
            status: "pending",
            source: "lifecycle",
          });

        if (insertError) {
          console.error(`❌ 일정 저장 실패:`, insertError);
          errors++;
        } else {
          saved++;
        }
      }
    } catch (error) {
      console.error(`❌ 일정 처리 중 오류:`, error);
      errors++;
    }
  }

  console.log(`✅ 생애주기별 예방주사 일정 저장 완료: ${saved}건 저장, ${errors}건 실패`);
  console.groupEnd();

  return { saved, errors };
}

/**
 * 생애주기별 예방주사 마스터 데이터 초기화
 * KCDC 표준 예방주사 일정을 기반으로 마스터 데이터 생성
 */
export async function initializeLifecycleVaccinationMasterData(): Promise<void> {
  console.group("[LifecycleVaccinationScheduler] 생애주기별 예방주사 마스터 데이터 초기화");

  const supabase = getServiceRoleClient();

  // KCDC 표준 생애주기별 예방접종 일정
  const masterData: Partial<LifecycleVaccinationSchedule>[] = [
    // 영유아 필수 예방접종
    { vaccine_name: "B형 간염", vaccine_code: "HepB", target_age_min_months: 0, target_age_max_months: 1, priority: "required", dose_number: 1, total_doses: 3, interval_days: 30, gender_requirement: "all", description: "출생 직후 접종 시작", source: "kcdc", is_active: true },
    { vaccine_name: "B형 간염", vaccine_code: "HepB", target_age_min_months: 1, target_age_max_months: 2, priority: "required", dose_number: 2, total_doses: 3, interval_days: 30, gender_requirement: "all", description: "생후 1개월", source: "kcdc", is_active: true },
    { vaccine_name: "B형 간염", vaccine_code: "HepB", target_age_min_months: 2, target_age_max_months: 6, priority: "required", dose_number: 3, total_doses: 3, interval_days: 120, gender_requirement: "all", description: "생후 6개월", source: "kcdc", is_active: true },

    { vaccine_name: "결핵(BCG)", vaccine_code: "BCG", target_age_min_months: 0, target_age_max_months: 1, priority: "required", dose_number: 1, total_doses: 1, interval_days: null, gender_requirement: "all", description: "출생 직후 접종", source: "kcdc", is_active: true },

    { vaccine_name: "디프테리아·파상풍·백일해", vaccine_code: "DTaP", target_age_min_months: 2, target_age_max_months: 3, priority: "required", dose_number: 1, total_doses: 4, interval_days: 30, gender_requirement: "all", description: "생후 2개월", source: "kcdc", is_active: true },
    { vaccine_name: "디프테리아·파상풍·백일해", vaccine_code: "DTaP", target_age_min_months: 4, target_age_max_months: 5, priority: "required", dose_number: 2, total_doses: 4, interval_days: 30, gender_requirement: "all", description: "생후 4개월", source: "kcdc", is_active: true },
    { vaccine_name: "디프테리아·파상풍·백일해", vaccine_code: "DTaP", target_age_min_months: 6, target_age_max_months: 7, priority: "required", dose_number: 3, total_doses: 4, interval_days: 180, gender_requirement: "all", description: "생후 6개월", source: "kcdc", is_active: true },
    { vaccine_name: "디프테리아·파상풍·백일해", vaccine_code: "DTaP", target_age_min_months: 15, target_age_max_months: 18, priority: "required", dose_number: 4, total_doses: 4, interval_days: null, gender_requirement: "all", description: "생후 15-18개월", source: "kcdc", is_active: true },

    { vaccine_name: "폴리오", vaccine_code: "IPV", target_age_min_months: 2, target_age_max_months: 3, priority: "required", dose_number: 1, total_doses: 4, interval_days: 30, gender_requirement: "all", description: "생후 2개월", source: "kcdc", is_active: true },
    { vaccine_name: "폴리오", vaccine_code: "IPV", target_age_min_months: 4, target_age_max_months: 5, priority: "required", dose_number: 2, total_doses: 4, interval_days: 30, gender_requirement: "all", description: "생후 4개월", source: "kcdc", is_active: true },
    { vaccine_name: "폴리오", vaccine_code: "IPV", target_age_min_months: 6, target_age_max_months: 7, priority: "required", dose_number: 3, total_doses: 4, interval_days: 180, gender_requirement: "all", description: "생후 6개월", source: "kcdc", is_active: true },
    { vaccine_name: "폴리오", vaccine_code: "IPV", target_age_min_months: 15, target_age_max_months: 18, priority: "required", dose_number: 4, total_doses: 4, interval_days: null, gender_requirement: "all", description: "생후 15-18개월", source: "kcdc", is_active: true },

    { vaccine_name: "디프테리아·파상풍·백일해·폴리오", vaccine_code: "DTaP-IPV", target_age_min_months: 2, target_age_max_months: 3, priority: "recommended", dose_number: 1, total_doses: 3, interval_days: 60, gender_requirement: "all", description: "생후 2개월 (복합백신)", source: "kcdc", is_active: true },
    { vaccine_name: "디프테리아·파상풍·백일해·폴리오", vaccine_code: "DTaP-IPV", target_age_min_months: 4, target_age_max_months: 5, priority: "recommended", dose_number: 2, total_doses: 3, interval_days: 60, gender_requirement: "all", description: "생후 4개월 (복합백신)", source: "kcdc", is_active: true },
    { vaccine_name: "디프테리아·파상풍·백일해·폴리오", vaccine_code: "DTaP-IPV", target_age_min_months: 6, target_age_max_months: 7, priority: "recommended", dose_number: 3, total_doses: 3, interval_days: null, gender_requirement: "all", description: "생후 6개월 (복합백신)", source: "kcdc", is_active: true },

    // MMR 및 기타 영유아 예방접종
    { vaccine_name: "홍역·유행성이하선염·풍진", vaccine_code: "MMR", target_age_min_months: 12, target_age_max_months: 15, priority: "required", dose_number: 1, total_doses: 2, interval_days: 365, gender_requirement: "all", description: "생후 12-15개월", source: "kcdc", is_active: true },
    { vaccine_name: "홍역·유행성이하선염·풍진", vaccine_code: "MMR", target_age_min_months: 24, target_age_max_months: 27, priority: "required", dose_number: 2, total_doses: 2, interval_days: null, gender_requirement: "all", description: "생후 4-6세", source: "kcdc", is_active: true },

    // 수두, 일본뇌염 등
    { vaccine_name: "수두", vaccine_code: "VAR", target_age_min_months: 12, target_age_max_months: 15, priority: "required", dose_number: 1, total_doses: 2, interval_days: 90, gender_requirement: "all", description: "생후 12-15개월", source: "kcdc", is_active: true },
    { vaccine_name: "수두", vaccine_code: "VAR", target_age_min_months: 15, target_age_max_months: 18, priority: "required", dose_number: 2, total_doses: 2, interval_days: null, gender_requirement: "all", description: "생후 4-6세", source: "kcdc", is_active: true },

    // 성인 예방접종 (일부만 포함)
    { vaccine_name: "파상풍·디프테리아", vaccine_code: "Td", target_age_min_months: 216, target_age_max_months: Infinity, priority: "recommended", dose_number: 1, total_doses: 1, interval_days: null, gender_requirement: "all", description: "만 11-12세 또는 성인", source: "kcdc", is_active: true },

    { vaccine_name: "인플루엔자", vaccine_code: "Flu", target_age_min_months: 72, target_age_max_months: Infinity, priority: "recommended", dose_number: 1, total_doses: 1, interval_days: 365, gender_requirement: "all", description: "매년 10월-11월", source: "kcdc", is_active: true },
  ];

  for (const data of masterData) {
    try {
      const { error } = await supabase
        .from("lifecycle_vaccination_schedules")
        .upsert(data, {
          onConflict: "vaccine_name,target_age_min_months,target_age_max_months,dose_number",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`❌ 마스터 데이터 저장 실패 (${data.vaccine_name}):`, error);
      }
    } catch (error) {
      console.error(`❌ 마스터 데이터 처리 중 오류:`, error);
    }
  }

  console.log("✅ 생애주기별 예방주사 마스터 데이터 초기화 완료");
  console.groupEnd();
}

