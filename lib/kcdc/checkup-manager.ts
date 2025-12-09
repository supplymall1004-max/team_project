/**
 * @file lib/kcdc/checkup-manager.ts
 * @description 건강검진 기록 및 권장 일정 관리 로직
 * 
 * 건강검진 기록을 관리하고, 연령대별 권장 검진 일정을 추적합니다.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  HealthCheckupRecord,
  HealthCheckupRecommendation,
  CheckupType,
  CheckupPriority,
} from "@/types/kcdc";

/**
 * 건강검진 기록 생성 파라미터
 */
export interface CreateCheckupRecordParams {
  userId: string;
  familyMemberId?: string;
  checkupType: CheckupType;
  checkupDate: string; // YYYY-MM-DD
  checkupSite?: string;
  checkupSiteAddress?: string;
  results?: Record<string, any>;
  nextRecommendedDate?: string; // YYYY-MM-DD
  notes?: string;
}

/**
 * 건강검진 기록 생성
 */
export async function createCheckupRecord(
  params: CreateCheckupRecordParams
): Promise<HealthCheckupRecord> {
  console.group("[CheckupManager] 건강검진 기록 생성");
  console.log("파라미터:", params);

  try {
    const supabase = getServiceRoleClient();

    // 다음 권장일 계산 (없는 경우)
    let nextRecommendedDate = params.nextRecommendedDate;
    if (!nextRecommendedDate) {
      nextRecommendedDate = calculateNextRecommendedDate(
        params.checkupType,
        params.checkupDate
      );
    }

    const { data, error } = await supabase
      .from("user_health_checkup_records")
      .insert({
        user_id: params.userId,
        family_member_id: params.familyMemberId || null,
        checkup_type: params.checkupType,
        checkup_date: params.checkupDate,
        checkup_site: params.checkupSite || null,
        checkup_site_address: params.checkupSiteAddress || null,
        results: params.results || {},
        next_recommended_date: nextRecommendedDate || null,
        overdue_days: null, // 새로 생성된 기록은 연체 없음
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 건강검진 기록 생성 실패:", error);
      throw error;
    }

    console.log("✅ 건강검진 기록 생성 완료:", data.id);
    console.groupEnd();

    return data as HealthCheckupRecord;
  } catch (error) {
    console.error("❌ 건강검진 기록 생성 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강검진 기록 조회
 */
export async function getCheckupRecords(
  userId: string,
  familyMemberId?: string
): Promise<HealthCheckupRecord[]> {
  console.group("[CheckupManager] 건강검진 기록 조회");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from("user_health_checkup_records")
      .select("*")
      .eq("user_id", userId)
      .order("checkup_date", { ascending: false });

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 건강검진 기록 조회 실패:", error);
      throw error;
    }

    console.log(`✅ 건강검진 기록 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return (data || []) as HealthCheckupRecord[];
  } catch (error) {
    console.error("❌ 건강검진 기록 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강검진 기록 수정
 */
export async function updateCheckupRecord(
  recordId: string,
  userId: string,
  updates: Partial<CreateCheckupRecordParams>
): Promise<HealthCheckupRecord> {
  console.group("[CheckupManager] 건강검진 기록 수정");
  console.log("기록 ID:", recordId);
  console.log("업데이트 내용:", updates);

  try {
    const supabase = getServiceRoleClient();

    // 본인 소유 확인
    const { data: existing } = await supabase
      .from("user_health_checkup_records")
      .select("user_id")
      .eq("id", recordId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("Unauthorized: 이 기록을 수정할 권한이 없습니다.");
    }

    const updateData: Record<string, any> = {};
    if (updates.checkupType !== undefined) updateData.checkup_type = updates.checkupType;
    if (updates.checkupDate !== undefined) updateData.checkup_date = updates.checkupDate;
    if (updates.checkupSite !== undefined) updateData.checkup_site = updates.checkupSite;
    if (updates.checkupSiteAddress !== undefined) updateData.checkup_site_address = updates.checkupSiteAddress;
    if (updates.results !== undefined) updateData.results = updates.results;
    if (updates.nextRecommendedDate !== undefined) updateData.next_recommended_date = updates.nextRecommendedDate;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from("user_health_checkup_records")
      .update(updateData)
      .eq("id", recordId)
      .select()
      .single();

    if (error) {
      console.error("❌ 건강검진 기록 수정 실패:", error);
      throw error;
    }

    console.log("✅ 건강검진 기록 수정 완료:", data.id);
    console.groupEnd();

    return data as HealthCheckupRecord;
  } catch (error) {
    console.error("❌ 건강검진 기록 수정 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강검진 기록 삭제
 */
export async function deleteCheckupRecord(
  recordId: string,
  userId: string
): Promise<void> {
  console.group("[CheckupManager] 건강검진 기록 삭제");
  console.log("기록 ID:", recordId);

  try {
    const supabase = getServiceRoleClient();

    // 본인 소유 확인
    const { data: existing } = await supabase
      .from("user_health_checkup_records")
      .select("user_id")
      .eq("id", recordId)
      .single();

    if (!existing || existing.user_id !== userId) {
      throw new Error("Unauthorized: 이 기록을 삭제할 권한이 없습니다.");
    }

    const { error } = await supabase
      .from("user_health_checkup_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error("❌ 건강검진 기록 삭제 실패:", error);
      throw error;
    }

    console.log("✅ 건강검진 기록 삭제 완료");
    console.groupEnd();
  } catch (error) {
    console.error("❌ 건강검진 기록 삭제 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 다음 권장일 계산
 */
function calculateNextRecommendedDate(
  checkupType: CheckupType,
  checkupDate: string
): string {
  const date = new Date(checkupDate);
  
  switch (checkupType) {
    case "national":
      // 국가건강검진: 2년마다
      date.setFullYear(date.getFullYear() + 2);
      break;
    case "cancer":
      // 암검진: 1년마다
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "special":
      // 특수검진: 6개월마다
      date.setMonth(date.getMonth() + 6);
      break;
    default:
      // 기본: 1년마다
      date.setFullYear(date.getFullYear() + 1);
  }

  return date.toISOString().split("T")[0];
}

/**
 * 건강검진 권장 일정 생성
 */
export async function createCheckupRecommendation(
  userId: string,
  familyMemberId: string,
  checkupType: string,
  checkupName: string,
  recommendedDate: string,
  priority: CheckupPriority,
  lastCheckupDate?: string,
  ageRequirement?: string,
  genderRequirement?: string
): Promise<HealthCheckupRecommendation> {
  console.group("[CheckupManager] 건강검진 권장 일정 생성");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    // 연체 여부 확인
    const today = new Date();
    const recommended = new Date(recommendedDate);
    const overdue = recommended < today;

    const { data, error } = await supabase
      .from("user_health_checkup_recommendations")
      .insert({
        user_id: userId,
        family_member_id: familyMemberId,
        checkup_type: checkupType,
        checkup_name: checkupName,
        recommended_date: recommendedDate,
        priority,
        overdue,
        last_checkup_date: lastCheckupDate || null,
        age_requirement: ageRequirement || null,
        gender_requirement: genderRequirement || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 건강검진 권장 일정 생성 실패:", error);
      throw error;
    }

    console.log("✅ 건강검진 권장 일정 생성 완료:", data.id);
    console.groupEnd();

    return data as HealthCheckupRecommendation;
  } catch (error) {
    console.error("❌ 건강검진 권장 일정 생성 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강검진 권장 일정 조회
 */
export async function getCheckupRecommendations(
  userId: string,
  familyMemberId?: string,
  overdueOnly?: boolean
): Promise<HealthCheckupRecommendation[]> {
  console.group("[CheckupManager] 건강검진 권장 일정 조회");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId);
  console.log("연체만:", overdueOnly);

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from("user_health_checkup_recommendations")
      .select("*")
      .eq("user_id", userId)
      .order("recommended_date", { ascending: true });

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    }

    if (overdueOnly) {
      query = query.eq("overdue", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 건강검진 권장 일정 조회 실패:", error);
      throw error;
    }

    console.log(`✅ 건강검진 권장 일정 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return (data || []) as HealthCheckupRecommendation[];
  } catch (error) {
    console.error("❌ 건강검진 권장 일정 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강검진 권장 일정 동기화
 * 
 * 사용자 및 가족 구성원의 연령대와 성별에 맞는 건강검진 권장 일정을 생성합니다.
 */
export async function syncCheckupRecommendations(
  userId: string,
  familyMemberIds?: string[]
): Promise<HealthCheckupRecommendation[]> {
  console.group("[CheckupManager] 건강검진 권장 일정 동기화");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID 목록:", familyMemberIds);

  try {
    const supabase = getServiceRoleClient();

    // 1. 사용자 및 가족 구성원 정보 조회
    const members = await getFamilyMembersWithAgeAndGender(
      supabase,
      userId,
      familyMemberIds
    );

    const createdRecommendations: HealthCheckupRecommendation[] = [];

    // 2. 각 구성원별로 권장 일정 생성
    for (const member of members) {
      const recommendations = generateCheckupRecommendationsForMember(member);

      for (const rec of recommendations) {
        // 이미 일정이 있는지 확인
        const existing = await checkExistingRecommendation(
          supabase,
          userId,
          member.id,
          rec.checkupName
        );

        if (existing) {
          console.log(`⏭️ 이미 일정이 존재합니다: ${rec.checkupName} (${member.name})`);
          continue;
        }

        // 일정 생성
        const schedule = await createCheckupRecommendation(
          userId,
          member.id,
          rec.checkupType,
          rec.checkupName,
          rec.recommendedDate,
          rec.priority,
          rec.lastCheckupDate,
          rec.ageRequirement,
          rec.genderRequirement
        );

        createdRecommendations.push(schedule);
      }
    }

    console.log(`✅ 건강검진 권장 일정 동기화 완료: ${createdRecommendations.length}건 생성`);
    console.groupEnd();

    return createdRecommendations;
  } catch (error) {
    console.error("❌ 건강검진 권장 일정 동기화 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 가족 구성원 정보 조회 (나이, 성별 포함)
 */
async function getFamilyMembersWithAgeAndGender(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  familyMemberIds?: string[]
): Promise<
  Array<{
    id: string;
    name: string;
    age: number | null;
    gender: string | null;
  }>
> {
  const members: Array<{
    id: string;
    name: string;
    age: number | null;
    gender: string | null;
  }> = [];

  // 본인 정보 조회
  const { data: profile } = await supabase
    .from("user_health_profiles")
    .select("age, gender")
    .eq("user_id", userId)
    .single();

  if (profile) {
    members.push({
      id: userId,
      name: "본인",
      age: profile.age,
      gender: profile.gender,
    });
  }

  // 가족 구성원 정보 조회
  let query = supabase
    .from("family_members")
    .select("id, name, birth_date, gender")
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
        gender: member.gender,
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
 * 구성원별 건강검진 권장 일정 생성
 */
function generateCheckupRecommendationsForMember(member: {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
}): Array<{
  checkupType: string;
  checkupName: string;
  recommendedDate: string;
  priority: CheckupPriority;
  lastCheckupDate?: string;
  ageRequirement?: string;
  genderRequirement?: string;
}> {
  const recommendations: Array<{
    checkupType: string;
    checkupName: string;
    recommendedDate: string;
    priority: CheckupPriority;
    lastCheckupDate?: string;
    ageRequirement?: string;
    genderRequirement?: string;
  }> = [];

  if (member.age === null) {
    return recommendations;
  }

  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  // 국가건강검진 (40세 이상, 2년마다)
  if (member.age >= 40) {
    recommendations.push({
      checkupType: "national",
      checkupName: "국가건강검진",
      recommendedDate: nextYear.toISOString().split("T")[0],
      priority: "high",
      ageRequirement: "40세 이상",
    });
  }

  // 암검진
  // 위암 (40세 이상, 2년마다)
  if (member.age >= 40) {
    recommendations.push({
      checkupType: "cancer",
      checkupName: "위암 검진",
      recommendedDate: nextYear.toISOString().split("T")[0],
      priority: "high",
      ageRequirement: "40세 이상",
    });
  }

  // 대장암 (50세 이상, 1년마다)
  if (member.age >= 50) {
    recommendations.push({
      checkupType: "cancer",
      checkupName: "대장암 검진",
      recommendedDate: nextYear.toISOString().split("T")[0],
      priority: "high",
      ageRequirement: "50세 이상",
    });
  }

  // 성별별 검진
  if (member.gender === "female") {
    // 유방암 (40세 이상, 2년마다)
    if (member.age >= 40) {
      recommendations.push({
        checkupType: "cancer",
        checkupName: "유방암 검진",
        recommendedDate: nextYear.toISOString().split("T")[0],
        priority: "high",
        ageRequirement: "40세 이상",
        genderRequirement: "여성",
      });
    }

    // 자궁경부암 (20세 이상, 3년마다)
    if (member.age >= 20) {
      const next3Years = new Date(today);
      next3Years.setFullYear(next3Years.getFullYear() + 3);
      recommendations.push({
        checkupType: "cancer",
        checkupName: "자궁경부암 검진",
        recommendedDate: next3Years.toISOString().split("T")[0],
        priority: "high",
        ageRequirement: "20세 이상",
        genderRequirement: "여성",
      });
    }
  } else if (member.gender === "male") {
    // 전립선암 (50세 이상, 1년마다)
    if (member.age >= 50) {
      recommendations.push({
        checkupType: "cancer",
        checkupName: "전립선암 검진",
        recommendedDate: nextYear.toISOString().split("T")[0],
        priority: "medium",
        ageRequirement: "50세 이상",
        genderRequirement: "남성",
      });
    }
  }

  // 간암 (40세 이상, 6개월마다)
  if (member.age >= 40) {
    const next6Months = new Date(today);
    next6Months.setMonth(next6Months.getMonth() + 6);
    recommendations.push({
      checkupType: "cancer",
      checkupName: "간암 검진",
      recommendedDate: next6Months.toISOString().split("T")[0],
      priority: "medium",
      ageRequirement: "40세 이상",
    });
  }

  return recommendations;
}

/**
 * 기존 권장 일정 확인
 */
async function checkExistingRecommendation(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  familyMemberId: string,
  checkupName: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_health_checkup_recommendations")
    .select("id")
    .eq("user_id", userId)
    .eq("family_member_id", familyMemberId)
    .eq("checkup_name", checkupName)
    .limit(1);

  return (data?.length || 0) > 0;
}

