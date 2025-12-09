/**
 * @file lib/kcdc/risk-calculator.ts
 * @description 감염병 위험 지수 계산 로직
 * 
 * 사용자의 건강 정보(질병, 연령, 지역, 예방접종 이력)와 KCDC 감염병 발생 데이터를 결합하여
 * 개인별 감염병 위험 지수를 계산합니다.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  InfectionRiskScore,
  RiskLevel,
  DiseaseOutbreak,
} from "@/types/kcdc";
import type { UserHealthProfile } from "@/types/health";

/**
 * 위험 지수 계산 요청 파라미터
 */
export interface CalculateRiskScoreParams {
  userId: string;
  familyMemberId?: string;
  region?: string;
}

/**
 * 위험 지수 계산 결과
 */
export interface RiskScoreResult {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: {
    age?: number;
    diseases?: string[];
    vaccination_status?: Record<string, boolean>;
    region_risk?: number;
    flu_stage?: string;
    [key: string]: any;
  };
  recommendations: string[];
}

/**
 * 감염병 위험 지수 계산
 * 
 * @param params 계산 파라미터
 * @returns 위험 지수 계산 결과
 */
export async function calculateInfectionRiskScore(
  params: CalculateRiskScoreParams
): Promise<RiskScoreResult> {
  console.group("[RiskCalculator] 위험 지수 계산 시작");
  console.log("파라미터:", params);

  try {
    const supabase = getServiceRoleClient();

    // 1. 사용자 건강 프로필 조회
    const healthProfile = await getUserHealthProfile(
      supabase,
      params.userId,
      params.familyMemberId
    );

    if (!healthProfile) {
      console.warn("⚠️ 건강 프로필이 없습니다. 기본값 사용");
      return getDefaultRiskScore();
    }

    console.log("건강 프로필:", {
      age: healthProfile.age,
      diseases: healthProfile.diseases,
      region: healthProfile.region,
    });

    // 2. KCDC 감염병 발생 데이터 조회
    const outbreaks = await getDiseaseOutbreaks(
      supabase,
      params.region || healthProfile.region || undefined
    );

    console.log("감염병 발생 데이터:", outbreaks.length, "건");

    // 3. 독감 유행 정보 조회
    const fluInfo = await getFluInfo(supabase);

    // 4. 예방접종 이력 조회
    const vaccinationStatus = await getVaccinationStatus(
      supabase,
      params.userId,
      params.familyMemberId
    );

    // 5. 위험 지수 계산
    const riskScore = calculateRiskScore({
      age: healthProfile.age || undefined,
      diseases: healthProfile.diseases || [],
      region: params.region || healthProfile.region || undefined,
      outbreaks,
      fluInfo,
      vaccinationStatus,
    });

    // 6. 권장 사항 생성
    const recommendations = generateRecommendations({
      riskScore: riskScore.riskScore,
      riskLevel: riskScore.riskLevel,
      age: healthProfile.age || undefined,
      diseases: healthProfile.diseases || [],
      fluInfo,
      vaccinationStatus,
    });

    console.log("✅ 위험 지수 계산 완료:", riskScore);
    console.groupEnd();

    return {
      ...riskScore,
      recommendations,
    };
  } catch (error) {
    console.error("❌ 위험 지수 계산 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 사용자 건강 프로필 조회
 */
async function getUserHealthProfile(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  familyMemberId?: string
): Promise<UserHealthProfile | null> {
  if (familyMemberId) {
    // 가족 구성원 정보 조회
    const { data: member } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", familyMemberId)
      .eq("user_id", userId)
      .single();

    if (!member) return null;

    // 가족 구성원 정보를 UserHealthProfile 형식으로 변환
    return {
      id: member.id,
      user_id: userId,
      age: calculateAge(member.birth_date),
      gender: member.gender || null,
      height_cm: member.height_cm || null,
      weight_kg: member.weight_kg || null,
      activity_level: member.activity_level || null,
      daily_calorie_goal: 0,
      diseases: member.diseases || [],
      allergies: member.allergies || [],
      preferred_ingredients: [],
      disliked_ingredients: [],
      dietary_preferences: member.dietary_preferences || [],
      created_at: member.created_at,
      updated_at: member.updated_at,
    };
  }

  // 본인 건강 프로필 조회
  const { data: profile } = await supabase
    .from("user_health_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return profile as UserHealthProfile | null;
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
 * 감염병 발생 데이터 조회
 */
async function getDiseaseOutbreaks(
  supabase: ReturnType<typeof getServiceRoleClient>,
  region?: string
): Promise<DiseaseOutbreak[]> {
  let query = supabase
    .from("kcdc_disease_outbreaks")
    .select("*")
    .eq("is_active", true)
    .order("outbreak_date", { ascending: false })
    .limit(10);

  if (region) {
    query = query.eq("region", region);
  }

  const { data, error } = await query;

  if (error) {
    console.error("감염병 발생 데이터 조회 실패:", error);
    return [];
  }

  return (data || []) as DiseaseOutbreak[];
}

/**
 * 독감 유행 정보 조회
 */
async function getFluInfo(
  supabase: ReturnType<typeof getServiceRoleClient>
): Promise<{ stage?: string; week?: string } | null> {
  const { data } = await supabase
    .from("kcdc_alerts")
    .select("flu_stage, flu_week")
    .eq("alert_type", "flu")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    stage: data.flu_stage || undefined,
    week: data.flu_week || undefined,
  };
}

/**
 * 예방접종 이력 조회
 */
async function getVaccinationStatus(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
  familyMemberId?: string
): Promise<Record<string, boolean>> {
  let query = supabase
    .from("user_vaccination_records")
    .select("vaccine_name, completed_date")
    .eq("user_id", userId);

  if (familyMemberId) {
    query = query.eq("family_member_id", familyMemberId);
  } else {
    query = query.is("family_member_id", null);
  }

  const { data } = await query;

  if (!data) return {};

  const status: Record<string, boolean> = {};
  for (const record of data) {
    if (record.completed_date) {
      status[record.vaccine_name] = true;
    }
  }

  return status;
}

/**
 * 위험 지수 계산 알고리즘
 */
function calculateRiskScore(params: {
  age?: number;
  diseases: string[];
  region?: string;
  outbreaks: DiseaseOutbreak[];
  fluInfo?: { stage?: string; week?: string } | null;
  vaccinationStatus: Record<string, boolean>;
}): { riskScore: number; riskLevel: RiskLevel } {
  let riskScore = 0;

  // 1. 연령대 위험도 (0-30점)
  if (params.age !== undefined) {
    if (params.age < 5 || params.age >= 65) {
      riskScore += 30; // 고위험 연령대
    } else if (params.age < 19) {
      riskScore += 15; // 중위험 연령대
    } else {
      riskScore += 5; // 저위험 연령대
    }
  }

  // 2. 기저질환 위험도 (0-30점)
  const highRiskDiseases = [
    "diabetes",
    "hypertension",
    "kidney_disease",
    "cardiovascular_disease",
    "obesity",
  ];
  const hasHighRiskDisease = params.diseases.some((d) =>
    highRiskDiseases.includes(d)
  );
  if (hasHighRiskDisease) {
    riskScore += 30;
  } else if (params.diseases.length > 0) {
    riskScore += 15;
  }

  // 3. 지역 감염병 발생 위험도 (0-20점)
  if (params.outbreaks.length > 0) {
    const criticalOutbreaks = params.outbreaks.filter(
      (o) => o.severity === "critical"
    );
    const highOutbreaks = params.outbreaks.filter(
      (o) => o.severity === "high"
    );

    if (criticalOutbreaks.length > 0) {
      riskScore += 20;
    } else if (highOutbreaks.length > 0) {
      riskScore += 15;
    } else {
      riskScore += 10;
    }
  }

  // 4. 독감 유행 단계 위험도 (0-20점)
  if (params.fluInfo?.stage) {
    const fluStage = params.fluInfo.stage;
    if (fluStage === "심각") {
      riskScore += 20;
    } else if (fluStage === "경계") {
      riskScore += 15;
    } else if (fluStage === "주의") {
      riskScore += 10;
    } else {
      riskScore += 5;
    }
  }

  // 5. 예방접종 이력 보정 (-10점 ~ 0점)
  const hasFluVaccination = params.vaccinationStatus["독감"] || params.vaccinationStatus["Flu"];
  if (hasFluVaccination) {
    riskScore = Math.max(0, riskScore - 10);
  }

  // 위험 지수는 0-100 범위로 제한
  riskScore = Math.min(100, Math.max(0, riskScore));

  // 위험 등급 결정
  let riskLevel: RiskLevel;
  if (riskScore >= 70) {
    riskLevel = "critical";
  } else if (riskScore >= 50) {
    riskLevel = "high";
  } else if (riskScore >= 30) {
    riskLevel = "moderate";
  } else {
    riskLevel = "low";
  }

  return { riskScore, riskLevel };
}

/**
 * 권장 사항 생성
 */
function generateRecommendations(params: {
  riskScore: number;
  riskLevel: RiskLevel;
  age?: number;
  diseases: string[];
  fluInfo?: { stage?: string; week?: string } | null;
  vaccinationStatus: Record<string, boolean>;
}): string[] {
  const recommendations: string[] = [];

  // 고위험 연령대 권장사항
  if (params.age !== undefined && (params.age < 5 || params.age >= 65)) {
    recommendations.push("고위험 연령대이므로 외출 시 마스크 착용을 권장합니다.");
  }

  // 독감 예방접종 권장
  const hasFluVaccination = params.vaccinationStatus["독감"] || params.vaccinationStatus["Flu"];
  if (!hasFluVaccination && params.fluInfo?.stage) {
    recommendations.push("독감 예방접종을 받으시기 바랍니다.");
  }

  // 기저질환 보유자 권장사항
  if (params.diseases.length > 0) {
    recommendations.push("기저질환이 있으므로 정기적인 건강 관리가 필요합니다.");
  }

  // 위험 등급별 권장사항
  if (params.riskLevel === "critical") {
    recommendations.push("위험도가 매우 높습니다. 외출을 자제하고 의료진과 상담하시기 바랍니다.");
  } else if (params.riskLevel === "high") {
    recommendations.push("위험도가 높습니다. 사람이 많은 곳은 피하고 개인위생을 철저히 하세요.");
  } else if (params.riskLevel === "moderate") {
    recommendations.push("적절한 예방 조치를 취하시기 바랍니다.");
  } else {
    recommendations.push("현재 위험도는 낮지만 지속적인 예방 조치를 권장합니다.");
  }

  return recommendations;
}

/**
 * 기본 위험 지수 (건강 프로필이 없는 경우)
 */
function getDefaultRiskScore(): RiskScoreResult {
  return {
    riskScore: 30,
    riskLevel: "moderate",
    factors: {},
    recommendations: [
      "건강 프로필을 입력하시면 더 정확한 위험 지수를 확인할 수 있습니다.",
    ],
  };
}

/**
 * 위험 지수 저장
 */
export async function saveRiskScore(
  userId: string,
  familyMemberId: string | undefined,
  result: RiskScoreResult,
  fluStage?: string,
  fluWeek?: string,
  region?: string
): Promise<InfectionRiskScore> {
  console.group("[RiskCalculator] 위험 지수 저장");
  console.log("사용자 ID:", userId);
  console.log("결과:", result);

  try {
    const supabase = getServiceRoleClient();

    // 만료 시간 설정 (1시간 후)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { data, error } = await supabase
      .from("user_infection_risk_scores")
      .insert({
        user_id: userId,
        family_member_id: familyMemberId || null,
        risk_score: result.riskScore,
        risk_level: result.riskLevel,
        flu_stage: fluStage || null,
        flu_week: fluWeek || null,
        region: region || null,
        factors: result.factors,
        recommendations: result.recommendations,
        calculated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 위험 지수 저장 실패:", error);
      throw error;
    }

    console.log("✅ 위험 지수 저장 완료:", data.id);
    console.groupEnd();

    return data as InfectionRiskScore;
  } catch (error) {
    console.error("❌ 위험 지수 저장 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 최근 위험 지수 조회
 */
export async function getLatestRiskScore(
  userId: string,
  familyMemberId?: string
): Promise<InfectionRiskScore | null> {
  console.group("[RiskCalculator] 최근 위험 지수 조회");
  console.log("사용자 ID:", userId);
  console.log("가족 구성원 ID:", familyMemberId);

  try {
    const supabase = getServiceRoleClient();

    let query = supabase
      .from("user_infection_risk_scores")
      .select("*")
      .eq("user_id", userId)
      .order("calculated_at", { ascending: false })
      .limit(1);

    if (familyMemberId) {
      query = query.eq("family_member_id", familyMemberId);
    } else {
      query = query.is("family_member_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ 위험 지수 조회 실패:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("⚠️ 저장된 위험 지수가 없습니다.");
      console.groupEnd();
      return null;
    }

    const riskScore = data[0] as InfectionRiskScore;

    // 만료 확인
    if (riskScore.expires_at && new Date(riskScore.expires_at) < new Date()) {
      console.log("⚠️ 위험 지수가 만료되었습니다.");
      console.groupEnd();
      return null;
    }

    console.log("✅ 위험 지수 조회 완료:", riskScore.id);
    console.groupEnd();

    return riskScore;
  } catch (error) {
    console.error("❌ 위험 지수 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

