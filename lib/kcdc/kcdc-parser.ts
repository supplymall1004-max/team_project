/**
 * @file lib/kcdc/kcdc-parser.ts
 * @description KCDC 공개 API/RSS 파싱 유틸리티 (캐싱 기능 포함)
 *
 * 핵심 기능:
 * 1. 질병관리청 공개 API에서 데이터 가져오기
 * 2. RSS/JSON 파싱
 * 3. 데이터 정규화 및 유효성 검사
 * 4. 데이터베이스 캐싱 (6시간 TTL)
 * 5. Next.js 서버 사이드 캐싱
 */

import { unstable_cache } from "next/cache";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { KcdcApiResponse, KcdcAlert, FluStage, KcdcSeverity, TargetAgeGroup } from "@/types/kcdc";

/**
 * KCDC API 설정 (공공데이터포털)
 */
const KCDC_API_KEY = process.env.KCDC_API_KEY || "";
const KCDC_API_BASE_URL = "http://apis.data.go.kr/1790387";

const KCDC_API_ENDPOINTS = {
  // 인플루엔자 유행 정보
  flu: `${KCDC_API_BASE_URL}/covid19/influenza`,
  // 예방접종 정보
  vaccination: `${KCDC_API_BASE_URL}/nip/vaccInfo`,
  // RSS (질병관리청 공지사항)
  rss: "https://www.kdca.go.kr/board/board.es?mid=a20501010000&bid=0015",
};

// 캐시 설정
const KCDC_CACHE_TTL_HOURS = 6; // 6시간 캐시
const CACHE_KEY_PREFIX = "kcdc-data";

/**
 * 캐시된 KCDC 데이터를 데이터베이스에서 조회
 */
async function getCachedKcdcData(): Promise<KcdcApiResponse | null> {
  console.log("🗄️ KCDC 캐시 데이터 확인 중...");

  try {
    const supabase = getServiceRoleClient();
    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() - KCDC_CACHE_TTL_HOURS);

    // 활성 상태이고 최근에 가져온 데이터 조회
    const { data: alerts, error } = await supabase
      .from("kcdc_alerts")
      .select("*")
      .eq("is_active", true)
      .gte("fetched_at", cacheExpiry.toISOString())
      .order("published_at", { ascending: false });

    if (error) {
      console.error("❌ KCDC 캐시 조회 실패:", error);
      return null;
    }

    if (!alerts || alerts.length === 0) {
      console.log("ℹ️ 유효한 KCDC 캐시 데이터 없음");
      return null;
    }

    // DB 데이터를 KcdcApiResponse 형식으로 변환
    const response: KcdcApiResponse = {
      flu: undefined,
      vaccinations: [],
      diseaseOutbreaks: [],
    };

    for (const alert of alerts) {
      if (alert.alert_type === "flu" && !response.flu) {
        response.flu = {
          stage: alert.flu_stage as FluStage,
          week: alert.flu_week || getISOWeekString(new Date()),
          description: alert.content,
          publishedAt: alert.published_at,
        };
      } else if (alert.alert_type === "vaccination") {
        response.vaccinations.push({
          name: alert.vaccine_name || alert.title,
          targetAgeGroup: alert.target_age_group as TargetAgeGroup,
          recommendedDate: alert.recommended_date || undefined,
          description: alert.content,
          publishedAt: alert.published_at,
        });
      } else if (alert.alert_type === "disease_outbreak") {
        response.diseaseOutbreaks.push({
          name: alert.title.replace(" 발생 알림", ""),
          severity: "warning" as const,
          description: alert.content,
          publishedAt: alert.published_at,
        });
      }
    }

    console.log(`✅ 캐시에서 ${alerts.length}개 알림 데이터 로드`);
    return response;

  } catch (error) {
    console.error("❌ KCDC 캐시 조회 중 오류:", error);
    return null;
  }
}

/**
 * KCDC 데이터를 데이터베이스에 캐시 저장
 */
async function saveKcdcDataToCache(response: KcdcApiResponse): Promise<void> {
  console.log("💾 KCDC 데이터 캐시 저장 중...");

  try {
    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();
    const alerts = parseKcdcResponseToAlerts(response);

    // 기존 캐시 데이터 비활성화 (중복 방지)
    await supabase
      .from("kcdc_alerts")
      .update({ is_active: false })
      .eq("is_active", true);

    // 새로운 데이터 저장
    const { error } = await supabase
      .from("kcdc_alerts")
      .insert(
        alerts.map(alert => ({
          ...alert,
          fetched_at: now,
          is_active: true,
        }))
      );

    if (error) {
      console.error("❌ KCDC 캐시 저장 실패:", error);
      throw error;
    }

    console.log(`✅ ${alerts.length}개 알림 데이터 캐시 저장 완료`);

  } catch (error) {
    console.error("❌ KCDC 캐시 저장 중 오류:", error);
    throw error;
  }
}

/**
 * KCDC 데이터 가져오기 (메인 함수) - 캐싱 기능 포함
 */
async function fetchKcdcDataInternal(): Promise<KcdcApiResponse> {
  console.group("🏥 KCDC 데이터 가져오기 (캐싱 적용)");

  try {
    // 1. 캐시 확인
    const cachedData = await getCachedKcdcData();
    if (cachedData) {
      console.log("✅ 캐시된 KCDC 데이터 사용");
      console.groupEnd();
      return cachedData;
    }

    console.log("ℹ️ 캐시 미스, API 호출 진행");

    // 2. API 키 확인
    if (!KCDC_API_KEY) {
      console.warn("⚠️ KCDC_API_KEY 미설정, 더미 데이터 사용 및 캐시");
      const response = await fetchKcdcDummyData();
      await saveKcdcDataToCache(response);
      console.groupEnd();
      return response;
    }

    // 3. 실제 API 호출
    console.log("📡 실제 KCDC API 호출");
    const response = await fetchKcdcRealApi();

    // 4. 캐시 저장
    await saveKcdcDataToCache(response);

    console.log("✅ KCDC 데이터 가져오기 및 캐시 저장 완료");
    console.groupEnd();

    return response;
  } catch (error) {
    console.error("❌ KCDC API 호출 실패:", error);

    // 5. API 실패 시 캐시된 데이터로 폴백 (Stale-While-Revalidate 패턴)
    const cachedData = await getCachedKcdcData();
    if (cachedData) {
      console.log("✅ 오래된 캐시 데이터로 폴백");
      console.groupEnd();
      return cachedData;
    }

    // 캐시도 없으면 더미 데이터 사용
    console.log("⚠️ 캐시 데이터 없음, 더미 데이터로 폴백");
    const fallbackResponse = await fetchKcdcDummyData();
    console.groupEnd();
    return fallbackResponse;
  }
}

/**
 * KCDC 데이터 가져오기 (메인 함수) - Next.js 캐싱 적용
 */
export const fetchKcdcData = unstable_cache(
  fetchKcdcDataInternal,
  [CACHE_KEY_PREFIX],
  {
    revalidate: KCDC_CACHE_TTL_HOURS * 60 * 60, // 6시간 (초 단위)
    tags: ["kcdc-data"],
  }
);

/**
 * 더미 KCDC 데이터 (실제 API 연동 전까지 사용)
 */
async function fetchKcdcDummyData(): Promise<KcdcApiResponse> {
  console.log("ℹ️ 더미 데이터 반환 (실제 API 미연동)");

  // 현재 날짜 기준 데이터 생성
  const now = new Date();
  const currentWeek = getISOWeek(now);

  return {
    flu: {
      stage: "주의",
      week: `${now.getFullYear()}-W${currentWeek.toString().padStart(2, "0")}`,
      description: "전국적으로 독감 환자가 증가하고 있습니다. 손씻기 등 개인 위생 수칙을 준수하시고, 고위험군은 예방접종을 권장합니다.",
      publishedAt: now.toISOString(),
    },
    vaccinations: [
      {
        name: "MMR (홍역·유행성이하선염·풍진)",
        targetAgeGroup: "영유아",
        recommendedDate: undefined,
        description: "생후 12개월 영유아는 MMR 백신 1차 접종을 받아야 합니다.",
        publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: "독감 (Flu)",
        targetAgeGroup: "전체",
        recommendedDate: undefined,
        description: "매년 10월~11월 독감 예방접종을 권장합니다.",
        publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    diseaseOutbreaks: [],
  };
}

/**
 * 실제 KCDC API 호출
 */
async function fetchKcdcRealApi(): Promise<KcdcApiResponse> {
  console.log("📡 공공데이터포털 API 호출 시작");

  const response: KcdcApiResponse = {
    flu: undefined,
    vaccinations: [],
    diseaseOutbreaks: [],
  };

  try {
    // 1. 인플루엔자 유행 정보 가져오기
    const fluData = await fetchFluData();
    if (fluData) {
      response.flu = fluData;
    }
  } catch (error) {
    console.error("⚠️ 독감 데이터 가져오기 실패:", error);
  }

  try {
    // 2. 예방접종 정보 가져오기
    const vaccinationData = await fetchVaccinationData();
    if (vaccinationData && vaccinationData.length > 0) {
      response.vaccinations = vaccinationData;
    }
  } catch (error) {
    console.error("⚠️ 예방접종 데이터 가져오기 실패:", error);
  }

  // 3. 최소 하나의 데이터라도 있으면 성공으로 간주
  if (response.flu || response.vaccinations.length > 0) {
    console.log("✅ KCDC API 데이터 가져오기 성공");
    return response;
  }

  // 모두 실패하면 에러 발생
  throw new Error("No data fetched from KCDC API");
}

/**
 * 독감 데이터 가져오기
 */
async function fetchFluData(): Promise<KcdcApiResponse["flu"] | undefined> {
  const url = new URL(KCDC_API_ENDPOINTS.flu);
  url.searchParams.append("serviceKey", KCDC_API_KEY);
  url.searchParams.append("numOfRows", "1");
  url.searchParams.append("pageNo", "1");
  url.searchParams.append("type", "json");

  console.log("🦠 독감 데이터 요청:", url.origin + url.pathname);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("독감 API 응답:", JSON.stringify(data).substring(0, 200));

  // API 응답 구조에 따라 파싱 (실제 구조는 API 문서 확인 필요)
  if (data.response?.body?.items) {
    const items = Array.isArray(data.response.body.items)
      ? data.response.body.items
      : [data.response.body.items];

    if (items.length > 0) {
      const latestItem = items[0];
      
      // 독감 경보 단계 매핑
      const stage = mapFluLevel(latestItem.level || latestItem.flag);
      const week = getISOWeekString(new Date());

      return {
        stage,
        week,
        description: latestItem.description || `전국 독감 ${stage} 단계입니다. 개인위생 수칙을 준수해주세요.`,
        publishedAt: latestItem.createDt || new Date().toISOString(),
      };
    }
  }

  return undefined;
}

/**
 * 예방접종 데이터 가져오기
 */
async function fetchVaccinationData(): Promise<KcdcApiResponse["vaccinations"]> {
  const url = new URL(KCDC_API_ENDPOINTS.vaccination);
  url.searchParams.append("serviceKey", KCDC_API_KEY);
  url.searchParams.append("numOfRows", "10");
  url.searchParams.append("pageNo", "1");
  url.searchParams.append("type", "json");

  console.log("💉 예방접종 데이터 요청:", url.origin + url.pathname);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("예방접종 API 응답:", JSON.stringify(data).substring(0, 200));

  const vaccinations: KcdcApiResponse["vaccinations"] = [];

  // API 응답 구조에 따라 파싱
  if (data.response?.body?.items) {
    const items = Array.isArray(data.response.body.items)
      ? data.response.body.items
      : [data.response.body.items];

    for (const item of items) {
      vaccinations.push({
        name: item.vaccNm || item.name || "알 수 없음",
        targetAgeGroup: mapAgeGroup(item.targetAge || item.age),
        recommendedDate: item.inoculDt || undefined,
        description: item.description || item.cont || `${item.vaccNm} 예방접종을 권장합니다.`,
        publishedAt: item.createDt || new Date().toISOString(),
      });
    }
  }

  return vaccinations;
}

/**
 * 독감 레벨을 경보 단계로 매핑
 */
function mapFluLevel(level?: string | number): FluStage {
  if (!level) return "관심";

  const levelStr = String(level).toLowerCase();

  if (levelStr.includes("심각") || levelStr.includes("4")) return "심각";
  if (levelStr.includes("경계") || levelStr.includes("3")) return "경계";
  if (levelStr.includes("주의") || levelStr.includes("2")) return "주의";
  
  return "관심";
}

/**
 * 연령 정보를 연령대로 매핑
 */
function mapAgeGroup(age?: string): TargetAgeGroup {
  if (!age) return "전체";

  const ageStr = String(age).toLowerCase();

  if (ageStr.includes("영유아") || ageStr.includes("12개월") || ageStr.includes("24개월")) {
    return "영유아";
  }
  if (ageStr.includes("청소년") || ageStr.includes("12세") || ageStr.includes("18세")) {
    return "청소년";
  }
  if (ageStr.includes("노인") || ageStr.includes("65세")) {
    return "노인";
  }
  if (ageStr.includes("성인")) {
    return "성인";
  }

  return "전체";
}

/**
 * ISO 주차 문자열 생성
 */
function getISOWeekString(date: Date): string {
  const week = getISOWeek(date);
  const year = date.getFullYear();
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

/**
 * KCDC 응답을 DB 저장 형식으로 변환
 */
export function parseKcdcResponseToAlerts(response: KcdcApiResponse): Omit<KcdcAlert, "id" | "created_at" | "updated_at" | "fetched_at">[] {
  const alerts: Omit<KcdcAlert, "id" | "created_at" | "updated_at" | "fetched_at">[] = [];

  // 독감 알림
  if (response.flu) {
    alerts.push({
      alert_type: "flu",
      title: `독감 ${response.flu.stage} 단계 발령`,
      content: response.flu.description,
      severity: mapFluStageToSeverity(response.flu.stage),
      flu_stage: response.flu.stage,
      flu_week: response.flu.week,
      source_url: KCDC_API_ENDPOINTS.flu,
      published_at: response.flu.publishedAt,
      is_active: true,
      priority: mapFluStageToPriority(response.flu.stage),
      expires_at: getExpirationDate(30), // 30일 후 만료
    });
  }

  // 예방접종 알림
  if (response.vaccinations) {
    for (const vaccine of response.vaccinations) {
      alerts.push({
        alert_type: "vaccination",
        title: `${vaccine.name} 예방접종 안내`,
        content: vaccine.description,
        severity: "info",
        vaccine_name: vaccine.name,
        target_age_group: vaccine.targetAgeGroup,
        recommended_date: vaccine.recommendedDate,
        source_url: KCDC_API_ENDPOINTS.vaccination,
        published_at: vaccine.publishedAt,
        is_active: true,
        priority: 5,
        expires_at: getExpirationDate(90), // 90일 후 만료
      });
    }
  }

  // 질병 발생 알림
  if (response.diseaseOutbreaks) {
    for (const outbreak of response.diseaseOutbreaks) {
      alerts.push({
        alert_type: "disease_outbreak",
        title: `${outbreak.name} 발생 알림`,
        content: outbreak.description,
        severity: outbreak.severity,
        source_url: KCDC_API_ENDPOINTS.rss,
        published_at: outbreak.publishedAt,
        is_active: true,
        priority: outbreak.severity === "critical" ? 20 : 10,
        expires_at: getExpirationDate(60), // 60일 후 만료
      });
    }
  }

  return alerts;
}

/**
 * 독감 단계를 심각도로 매핑
 */
function mapFluStageToSeverity(stage: FluStage): KcdcSeverity {
  switch (stage) {
    case "심각":
      return "critical";
    case "경계":
    case "주의":
      return "warning";
    case "관심":
    default:
      return "info";
  }
}

/**
 * 독감 단계를 우선순위로 매핑
 */
function mapFluStageToPriority(stage: FluStage): number {
  switch (stage) {
    case "심각":
      return 20;
    case "경계":
      return 15;
    case "주의":
      return 10;
    case "관심":
    default:
      return 5;
  }
}

/**
 * 만료 날짜 계산 (현재 + N일)
 */
function getExpirationDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * ISO 주차 번호 계산
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * 만료된 알림 확인
 */
export function isAlertExpired(alert: KcdcAlert): boolean {
  if (!alert.expires_at) return false;
  return new Date(alert.expires_at) < new Date();
}

/**
 * 사용자 나이에 맞는 알림 필터링
 */
export function filterAlertsByAge(alerts: KcdcAlert[], age?: number): KcdcAlert[] {
  if (age === undefined) return alerts;

  return alerts.filter((alert) => {
    if (alert.alert_type !== "vaccination") return true;
    if (!alert.target_age_group) return true;
    if (alert.target_age_group === "전체") return true;

    // 연령대별 필터링
    if (alert.target_age_group === "영유아" && age < 7) return true;
    if (alert.target_age_group === "청소년" && age >= 7 && age < 19) return true;
    if (alert.target_age_group === "성인" && age >= 19 && age < 65) return true;
    if (alert.target_age_group === "노인" && age >= 65) return true;

    return false;
  });
}

