/**
 * @file lib/kcdc/travel-risk-assessor.ts
 * @description 여행 위험도 평가 로직
 * 
 * 여행 목적지의 감염병 발생 현황을 조회하고,
 * 사용자 건강 정보를 기반으로 여행 위험도를 평가합니다.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  TravelRiskAssessment,
  RiskLevel,
  DiseaseOutbreak,
} from "@/types/kcdc";
import type { UserHealthProfile } from "@/types/health";

/**
 * 여행 위험도 평가 요청 파라미터
 */
export interface AssessTravelRiskParams {
  userId: string;
  destinationCountry: string;
  destinationRegion?: string;
  travelStartDate: string; // YYYY-MM-DD
  travelEndDate: string; // YYYY-MM-DD
}

/**
 * 여행 위험도 평가 결과
 */
export interface TravelRiskResult {
  riskLevel: RiskLevel;
  diseaseAlerts: Array<{
    disease_name: string;
    severity: string;
    description: string;
  }>;
  preventionChecklist: string[];
  vaccinationRequirements: Array<{
    vaccine_name: string;
    required: boolean;
    recommended_date?: string;
  }>;
}

/**
 * 여행 위험도 평가
 */
export async function assessTravelRisk(
  params: AssessTravelRiskParams
): Promise<TravelRiskResult> {
  console.group("[TravelRiskAssessor] 여행 위험도 평가 시작");
  console.log("파라미터:", params);

  try {
    const supabase = getServiceRoleClient();

    // 1. 사용자 건강 프로필 조회
    const healthProfile = await getUserHealthProfile(supabase, params.userId);

    // 2. 목적지 감염병 발생 데이터 조회
    const outbreaks = await getDestinationOutbreaks(
      supabase,
      params.destinationCountry,
      params.destinationRegion
    );

    console.log("감염병 발생 데이터:", outbreaks.length, "건");

    // 3. 위험도 계산
    const riskLevel = calculateTravelRiskLevel({
      outbreaks,
      healthProfile,
      destinationCountry: params.destinationCountry,
    });

    // 4. 질병 경보 정보 생성
    const diseaseAlerts = generateDiseaseAlerts(outbreaks);

    // 5. 예방 체크리스트 생성
    const preventionChecklist = generatePreventionChecklist({
      riskLevel,
      outbreaks,
      destinationCountry: params.destinationCountry,
    });

    // 6. 백신 요구사항 생성
    const vaccinationRequirements = generateVaccinationRequirements({
      destinationCountry: params.destinationCountry,
      outbreaks,
      healthProfile,
    });

    const result: TravelRiskResult = {
      riskLevel,
      diseaseAlerts,
      preventionChecklist,
      vaccinationRequirements,
    };

    console.log("✅ 여행 위험도 평가 완료:", result);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 여행 위험도 평가 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 사용자 건강 프로필 조회
 */
async function getUserHealthProfile(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string
): Promise<UserHealthProfile | null> {
  const { data: profile } = await supabase
    .from("user_health_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return profile as UserHealthProfile | null;
}

/**
 * 목적지 감염병 발생 데이터 조회
 */
async function getDestinationOutbreaks(
  supabase: ReturnType<typeof getServiceRoleClient>,
  country: string,
  region?: string
): Promise<DiseaseOutbreak[]> {
  let query = supabase
    .from("kcdc_disease_outbreaks")
    .select("*")
    .eq("is_active", true)
    .ilike("region", `%${country}%`)
    .order("outbreak_date", { ascending: false })
    .limit(20);

  if (region) {
    query = query.ilike("region", `%${region}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("감염병 발생 데이터 조회 실패:", error);
    return [];
  }

  return (data || []) as DiseaseOutbreak[];
}

/**
 * 여행 위험도 계산
 */
function calculateTravelRiskLevel(params: {
  outbreaks: DiseaseOutbreak[];
  healthProfile: UserHealthProfile | null;
  destinationCountry: string;
}): RiskLevel {
  let riskScore = 0;

  // 1. 감염병 발생 위험도 (0-50점)
  const criticalOutbreaks = params.outbreaks.filter(
    (o) => o.severity === "critical"
  );
  const highOutbreaks = params.outbreaks.filter((o) => o.severity === "high");
  const moderateOutbreaks = params.outbreaks.filter(
    (o) => o.severity === "moderate"
  );

  if (criticalOutbreaks.length > 0) {
    riskScore += 50;
  } else if (highOutbreaks.length > 0) {
    riskScore += 35;
  } else if (moderateOutbreaks.length > 0) {
    riskScore += 20;
  } else if (params.outbreaks.length > 0) {
    riskScore += 10;
  }

  // 2. 사용자 건강 상태 위험도 (0-30점)
  if (params.healthProfile) {
    const highRiskDiseases = [
      "diabetes",
      "hypertension",
      "kidney_disease",
      "cardiovascular_disease",
      "obesity",
    ];
    const hasHighRiskDisease = (params.healthProfile.diseases || []).some(
      (d) => highRiskDiseases.includes(d)
    );

    if (hasHighRiskDisease) {
      riskScore += 30;
    } else if ((params.healthProfile.diseases || []).length > 0) {
      riskScore += 15;
    }

    // 고위험 연령대
    if (
      params.healthProfile.age !== null &&
      (params.healthProfile.age < 5 || params.healthProfile.age >= 65)
    ) {
      riskScore += 20;
    }
  }

  // 3. 목적지 국가 위험도 (0-20점)
  // 특정 국가는 기본적으로 높은 위험도 (실제로는 외부 API 또는 데이터베이스에서 조회)
  const highRiskCountries = [
    "아프리카",
    "동남아시아",
    "남아메리카",
    "중동",
  ];
  const isHighRiskCountry = highRiskCountries.some((country) =>
    params.destinationCountry.includes(country)
  );

  if (isHighRiskCountry) {
    riskScore += 20;
  }

  // 위험 등급 결정
  if (riskScore >= 70) {
    return "critical";
  } else if (riskScore >= 50) {
    return "high";
  } else if (riskScore >= 30) {
    return "moderate";
  } else {
    return "low";
  }
}

/**
 * 질병 경보 정보 생성
 */
function generateDiseaseAlerts(
  outbreaks: DiseaseOutbreak[]
): Array<{
  disease_name: string;
  severity: string;
  description: string;
}> {
  const alerts: Array<{
    disease_name: string;
    severity: string;
    description: string;
  }> = [];

  for (const outbreak of outbreaks) {
    alerts.push({
      disease_name: outbreak.disease_name,
      severity: outbreak.severity || "moderate",
      description:
        outbreak.description ||
        `${outbreak.disease_name}이(가) 해당 지역에서 발생하고 있습니다.`,
    });
  }

  return alerts;
}

/**
 * 예방 체크리스트 생성
 */
function generatePreventionChecklist(params: {
  riskLevel: RiskLevel;
  outbreaks: DiseaseOutbreak[];
  destinationCountry: string;
}): string[] {
  const checklist: string[] = [];

  // 기본 체크리스트
  checklist.push("손씻기용 손소독제 준비");
  checklist.push("마스크 준비 (충분한 수량)");
  checklist.push("개인용 수건 및 위생용품 준비");

  // 위험도별 체크리스트
  if (params.riskLevel === "critical" || params.riskLevel === "high") {
    checklist.push("의료용 마스크(N95 등) 준비");
    checklist.push("응급 처치 키트 준비");
    checklist.push("해외여행자 보험 가입 확인");
    checklist.push("현지 의료기관 연락처 확인");
  }

  // 질병별 체크리스트
  const diseaseNames = params.outbreaks.map((o) => o.disease_name.toLowerCase());
  if (diseaseNames.some((d) => d.includes("말라리아"))) {
    checklist.push("모기 기피제 준비");
    checklist.push("모기장 준비");
  }
  if (diseaseNames.some((d) => d.includes("콜레라") || d.includes("장티푸스"))) {
    checklist.push("생수 준비 (수돗물 섭취 금지)");
    checklist.push("익힌 음식만 섭취");
  }

  return checklist;
}

/**
 * 백신 요구사항 생성
 */
function generateVaccinationRequirements(params: {
  destinationCountry: string;
  outbreaks: DiseaseOutbreak[];
  healthProfile: UserHealthProfile | null;
}): Array<{
  vaccine_name: string;
  required: boolean;
  recommended_date?: string;
}> {
  const requirements: Array<{
    vaccine_name: string;
    required: boolean;
    recommended_date?: string;
  }> = [];

  // 기본 백신 (대부분의 국가에서 권장)
  requirements.push({
    vaccine_name: "A형 간염",
    required: false,
  });
  requirements.push({
    vaccine_name: "B형 간염",
    required: false,
  });
  requirements.push({
    vaccine_name: "파상풍",
    required: false,
  });

  // 질병별 필수 백신
  const diseaseNames = params.outbreaks.map((o) => o.disease_name.toLowerCase());
  
  if (diseaseNames.some((d) => d.includes("황열"))) {
    requirements.push({
      vaccine_name: "황열",
      required: true,
    });
  }
  if (diseaseNames.some((d) => d.includes("뇌염"))) {
    requirements.push({
      vaccine_name: "일본뇌염",
      required: true,
    });
  }
  if (diseaseNames.some((d) => d.includes("장티푸스"))) {
    requirements.push({
      vaccine_name: "장티푸스",
      required: true,
    });
  }

  // 특정 국가별 필수 백신
  const highRiskCountries = ["아프리카", "동남아시아", "남아메리카"];
  const isHighRiskCountry = highRiskCountries.some((country) =>
    params.destinationCountry.includes(country)
  );

  if (isHighRiskCountry) {
    requirements.push({
      vaccine_name: "황열",
      required: true,
    });
    requirements.push({
      vaccine_name: "A형 간염",
      required: true,
    });
  }

  // 권장 접종일 계산 (여행 시작일 2주 전)
  const travelDate = new Date();
  travelDate.setDate(travelDate.getDate() + 14);
  const recommendedDate = travelDate.toISOString().split("T")[0];

  // 모든 필수 백신에 권장일 추가
  return requirements.map((req) => ({
    ...req,
    recommended_date: req.required ? recommendedDate : undefined,
  }));
}

/**
 * 여행 위험도 평가 저장
 */
export async function saveTravelRiskAssessment(
  userId: string,
  params: AssessTravelRiskParams,
  result: TravelRiskResult
): Promise<TravelRiskAssessment> {
  console.group("[TravelRiskAssessor] 여행 위험도 평가 저장");
  console.log("사용자 ID:", userId);
  console.log("결과:", result);

  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("user_travel_risk_assessments")
      .insert({
        user_id: userId,
        destination_country: params.destinationCountry,
        destination_region: params.destinationRegion || null,
        travel_start_date: params.travelStartDate,
        travel_end_date: params.travelEndDate,
        risk_level: result.riskLevel,
        disease_alerts: result.diseaseAlerts,
        prevention_checklist: result.preventionChecklist,
        vaccination_requirements: result.vaccinationRequirements,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ 여행 위험도 평가 저장 실패:", error);
      throw error;
    }

    console.log("✅ 여행 위험도 평가 저장 완료:", data.id);
    console.groupEnd();

    return data as TravelRiskAssessment;
  } catch (error) {
    console.error("❌ 여행 위험도 평가 저장 오류:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 여행 위험도 평가 이력 조회
 */
export async function getTravelRiskAssessments(
  userId: string
): Promise<TravelRiskAssessment[]> {
  console.group("[TravelRiskAssessor] 여행 위험도 평가 이력 조회");
  console.log("사용자 ID:", userId);

  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("user_travel_risk_assessments")
      .select("*")
      .eq("user_id", userId)
      .order("travel_start_date", { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ 여행 위험도 평가 이력 조회 실패:", error);
      throw error;
    }

    console.log(`✅ 여행 위험도 평가 이력 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return (data || []) as TravelRiskAssessment[];
  } catch (error) {
    console.error("❌ 여행 위험도 평가 이력 조회 오류:", error);
    console.groupEnd();
    throw error;
  }
}

