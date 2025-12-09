/**
 * @file lib/health/health-highway-client.ts
 * @description 건강정보고속도로 API 클라이언트
 * 
 * 핵심 기능:
 * 1. 보건복지부 건강정보고속도로 API 연동
 * 2. 진료기록, 건강검진 결과, 투약 정보 조회
 * 3. 사용자 인증 및 동의 처리
 */

/**
 * 건강정보고속도로 API 설정
 */
const HEALTH_HIGHWAY_API_BASE_URL = process.env.HEALTH_HIGHWAY_API_BASE_URL || "https://api.healthhighway.go.kr";
const HEALTH_HIGHWAY_API_KEY = process.env.HEALTH_HIGHWAY_API_KEY || "";
const HEALTH_HIGHWAY_CLIENT_ID = process.env.HEALTH_HIGHWAY_CLIENT_ID || "";
const HEALTH_HIGHWAY_CLIENT_SECRET = process.env.HEALTH_HIGHWAY_CLIENT_SECRET || "";

/**
 * 건강정보고속도로 API 엔드포인트
 */
const HEALTH_HIGHWAY_API_ENDPOINTS = {
  // 인증
  authorize: `${HEALTH_HIGHWAY_API_BASE_URL}/oauth/authorize`,
  token: `${HEALTH_HIGHWAY_API_BASE_URL}/oauth/token`,
  // 건강정보 조회
  healthRecords: `${HEALTH_HIGHWAY_API_BASE_URL}/v1/health/records`,
  hospitalRecords: `${HEALTH_HIGHWAY_API_BASE_URL}/v1/health/hospital-visits`,
  medicationRecords: `${HEALTH_HIGHWAY_API_BASE_URL}/v1/health/medications`,
  checkupRecords: `${HEALTH_HIGHWAY_API_BASE_URL}/v1/health/checkups`,
  vaccinationRecords: `${HEALTH_HIGHWAY_API_BASE_URL}/v1/health/vaccinations`,
};

/**
 * 건강정보고속도로 액세스 토큰 정보
 */
export interface HealthHighwayToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expires_at: Date;
}

/**
 * 건강정보고속도로 API 응답 기본 구조
 */
interface HealthHighwayApiResponse<T> {
  resultCode: string;
  resultMessage: string;
  data?: T;
}

/**
 * 건강정보고속도로 인증 URL 생성
 */
export function generateHealthHighwayAuthUrl(state: string): string {
  console.group("[HealthHighwayClient] 인증 URL 생성");

  if (!HEALTH_HIGHWAY_CLIENT_ID) {
    console.error("❌ 건강정보고속도로 API 설정이 완료되지 않았습니다.");
    console.groupEnd();
    throw new Error("건강정보고속도로 API 설정이 필요합니다.");
  }

  const params = new URLSearchParams({
    client_id: HEALTH_HIGHWAY_CLIENT_ID,
    response_type: "code",
    scope: "health_records hospital_records medication_records checkup_records vaccination_records",
    state: state,
  });

  const authUrl = `${HEALTH_HIGHWAY_API_ENDPOINTS.authorize}?${params.toString()}`;

  console.log("✅ 인증 URL 생성 완료");
  console.groupEnd();

  return authUrl;
}

/**
 * 건강정보고속도로 액세스 토큰 발급
 */
export async function getHealthHighwayAccessToken(
  authorizationCode: string,
  redirectUri: string
): Promise<HealthHighwayToken> {
  console.group("[HealthHighwayClient] 액세스 토큰 발급");

  if (!HEALTH_HIGHWAY_CLIENT_ID || !HEALTH_HIGHWAY_CLIENT_SECRET) {
    console.error("❌ 건강정보고속도로 API 설정이 완료되지 않았습니다.");
    console.groupEnd();
    throw new Error("건강정보고속도로 API 설정이 필요합니다.");
  }

  try {
    const response = await fetch(HEALTH_HIGHWAY_API_ENDPOINTS.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-API-KEY": HEALTH_HIGHWAY_API_KEY,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: HEALTH_HIGHWAY_CLIENT_ID,
        client_secret: HEALTH_HIGHWAY_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: authorizationCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 토큰 발급 실패:", errorData);
      console.groupEnd();
      throw new Error(`토큰 발급 실패: ${errorData.resultMessage || response.statusText}`);
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const token: HealthHighwayToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      expires_at: expiresAt,
    };

    console.log("✅ 액세스 토큰 발급 완료");
    console.groupEnd();

    return token;
  } catch (error) {
    console.error("❌ 토큰 발급 중 오류 발생:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강정보고속도로 액세스 토큰 갱신
 */
export async function refreshHealthHighwayAccessToken(
  refreshToken: string
): Promise<HealthHighwayToken> {
  console.group("[HealthHighwayClient] 액세스 토큰 갱신");

  if (!HEALTH_HIGHWAY_CLIENT_ID || !HEALTH_HIGHWAY_CLIENT_SECRET) {
    console.error("❌ 건강정보고속도로 API 설정이 완료되지 않았습니다.");
    console.groupEnd();
    throw new Error("건강정보고속도로 API 설정이 필요합니다.");
  }

  try {
    const response = await fetch(HEALTH_HIGHWAY_API_ENDPOINTS.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-API-KEY": HEALTH_HIGHWAY_API_KEY,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: HEALTH_HIGHWAY_CLIENT_ID,
        client_secret: HEALTH_HIGHWAY_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 토큰 갱신 실패:", errorData);
      console.groupEnd();
      throw new Error(`토큰 갱신 실패: ${errorData.resultMessage || response.statusText}`);
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const token: HealthHighwayToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      expires_at: expiresAt,
    };

    console.log("✅ 액세스 토큰 갱신 완료");
    console.groupEnd();

    return token;
  } catch (error) {
    console.error("❌ 토큰 갱신 중 오류 발생:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강정보고속도로 API 요청 헬퍼 함수
 */
async function makeHealthHighwayApiRequest<T>(
  endpoint: string,
  accessToken: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-API-KEY": HEALTH_HIGHWAY_API_KEY,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`건강정보고속도로 API 요청 실패: ${errorData.resultMessage || response.statusText}`);
  }

  const data = await response.json() as HealthHighwayApiResponse<T>;

  if (data.resultCode !== "00") {
    throw new Error(`건강정보고속도로 API 오류: ${data.resultMessage}`);
  }

  return data.data as T;
}

/**
 * 병원 방문 기록 조회
 */
export async function fetchHospitalRecords(
  accessToken: string,
  params?: {
    startDate?: string;
    endDate?: string;
    hospitalCode?: string;
  }
): Promise<any[]> {
  console.group("[HealthHighwayClient] 병원 방문 기록 조회");

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.hospitalCode) queryParams.append("hospitalCode", params.hospitalCode);

    const url = `${HEALTH_HIGHWAY_API_ENDPOINTS.hospitalRecords}?${queryParams.toString()}`;
    const data = await makeHealthHighwayApiRequest<any[]>(url, accessToken);

    console.log(`✅ 병원 방문 기록 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return data || [];
  } catch (error) {
    console.error("❌ 병원 방문 기록 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 약물 복용 기록 조회
 */
export async function fetchMedicationRecords(
  accessToken: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<any[]> {
  console.group("[HealthHighwayClient] 약물 복용 기록 조회");

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `${HEALTH_HIGHWAY_API_ENDPOINTS.medicationRecords}?${queryParams.toString()}`;
    const data = await makeHealthHighwayApiRequest<any[]>(url, accessToken);

    console.log(`✅ 약물 복용 기록 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return data || [];
  } catch (error) {
    console.error("❌ 약물 복용 기록 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 건강검진 기록 조회
 */
export async function fetchCheckupRecords(
  accessToken: string,
  params?: {
    startDate?: string;
    endDate?: string;
    checkupType?: string;
  }
): Promise<any[]> {
  console.group("[HealthHighwayClient] 건강검진 기록 조회");

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.checkupType) queryParams.append("checkupType", params.checkupType);

    const url = `${HEALTH_HIGHWAY_API_ENDPOINTS.checkupRecords}?${queryParams.toString()}`;
    const data = await makeHealthHighwayApiRequest<any[]>(url, accessToken);

    console.log(`✅ 건강검진 기록 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return data || [];
  } catch (error) {
    console.error("❌ 건강검진 기록 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 예방접종 기록 조회
 */
export async function fetchVaccinationRecords(
  accessToken: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<any[]> {
  console.group("[HealthHighwayClient] 예방접종 기록 조회");

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `${HEALTH_HIGHWAY_API_ENDPOINTS.vaccinationRecords}?${queryParams.toString()}`;
    const data = await makeHealthHighwayApiRequest<any[]>(url, accessToken);

    console.log(`✅ 예방접종 기록 조회 완료: ${data?.length || 0}건`);
    console.groupEnd();

    return data || [];
  } catch (error) {
    console.error("❌ 예방접종 기록 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

