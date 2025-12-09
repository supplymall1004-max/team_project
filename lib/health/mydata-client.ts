/**
 * @file lib/health/mydata-client.ts
 * @description 마이데이터 서비스 API 클라이언트
 * 
 * 핵심 기능:
 * 1. 공공 마이데이터 유통 시스템 API 연동
 * 2. 사용자 인증 및 동의 처리
 * 3. 토큰 관리 및 갱신 로직
 * 4. 건강정보 조회 (진료기록, 건강검진, 투약정보 등)
 */

/**
 * 마이데이터 API 설정
 */
const MYDATA_API_BASE_URL = process.env.MYDATA_API_BASE_URL || "https://api.mydata.go.kr";
const MYDATA_CLIENT_ID = process.env.MYDATA_CLIENT_ID || "";
const MYDATA_CLIENT_SECRET = process.env.MYDATA_CLIENT_SECRET || "";
const MYDATA_REDIRECT_URI = process.env.MYDATA_REDIRECT_URI || "";

/**
 * 마이데이터 API 엔드포인트
 */
const MYDATA_API_ENDPOINTS = {
  // 인증
  authorize: `${MYDATA_API_BASE_URL}/oauth/authorize`,
  token: `${MYDATA_API_BASE_URL}/oauth/token`,
  // 건강정보 조회
  healthRecords: `${MYDATA_API_BASE_URL}/health/records`,
  hospitalRecords: `${MYDATA_API_BASE_URL}/health/hospital-records`,
  medicationRecords: `${MYDATA_API_BASE_URL}/health/medication-records`,
  checkupRecords: `${MYDATA_API_BASE_URL}/health/checkup-records`,
};

/**
 * 마이데이터 액세스 토큰 정보
 */
export interface MyDataToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expires_at: Date;
}

/**
 * 마이데이터 연결 파라미터
 */
export interface MyDataConnectionParams {
  userId: string;
  authorizationCode?: string;
  refreshToken?: string;
}

/**
 * 마이데이터 API 응답 기본 구조
 */
interface MyDataApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 마이데이터 인증 URL 생성
 * 사용자를 마이데이터 인증 페이지로 리다이렉트하기 위한 URL 생성
 */
export function generateMyDataAuthUrl(state: string): string {
  console.group("[MyDataClient] 인증 URL 생성");
  
  if (!MYDATA_CLIENT_ID || !MYDATA_REDIRECT_URI) {
    console.error("❌ 마이데이터 API 설정이 완료되지 않았습니다.");
    console.groupEnd();
    throw new Error("마이데이터 API 설정이 필요합니다.");
  }

  const params = new URLSearchParams({
    client_id: MYDATA_CLIENT_ID,
    redirect_uri: MYDATA_REDIRECT_URI,
    response_type: "code",
    scope: "health_records hospital_records medication_records checkup_records",
    state: state,
  });

  const authUrl = `${MYDATA_API_ENDPOINTS.authorize}?${params.toString()}`;
  
  console.log("✅ 인증 URL 생성 완료");
  console.groupEnd();
  
  return authUrl;
}

/**
 * 마이데이터 액세스 토큰 발급
 * 인증 코드를 사용하여 액세스 토큰 발급
 */
export async function getMyDataAccessToken(
  authorizationCode: string
): Promise<MyDataToken> {
  console.group("[MyDataClient] 액세스 토큰 발급");

  if (!MYDATA_CLIENT_ID || !MYDATA_CLIENT_SECRET || !MYDATA_REDIRECT_URI) {
    console.error("❌ 마이데이터 API 설정이 완료되지 않았습니다.");
    console.groupEnd();
    throw new Error("마이데이터 API 설정이 필요합니다.");
  }

  try {
    const response = await fetch(MYDATA_API_ENDPOINTS.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: MYDATA_CLIENT_ID,
        client_secret: MYDATA_CLIENT_SECRET,
        redirect_uri: MYDATA_REDIRECT_URI,
        code: authorizationCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 토큰 발급 실패:", errorData);
      console.groupEnd();
      throw new Error(`토큰 발급 실패: ${errorData.error || response.statusText}`);
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const token: MyDataToken = {
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
 * 마이데이터 액세스 토큰 갱신
 * 리프레시 토큰을 사용하여 액세스 토큰 갱신
 */
export async function refreshMyDataAccessToken(
  refreshToken: string
): Promise<MyDataToken> {
  console.group("[MyDataClient] 액세스 토큰 갱신");

  if (!MYDATA_CLIENT_ID || !MYDATA_CLIENT_SECRET) {
    console.error("❌ 마이데이터 API 설정이 완료되지 않았습니다.");
    console.groupEnd();
    throw new Error("마이데이터 API 설정이 필요합니다.");
  }

  try {
    const response = await fetch(MYDATA_API_ENDPOINTS.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: MYDATA_CLIENT_ID,
        client_secret: MYDATA_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 토큰 갱신 실패:", errorData);
      console.groupEnd();
      throw new Error(`토큰 갱신 실패: ${errorData.error || response.statusText}`);
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const token: MyDataToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken, // 새 리프레시 토큰이 없으면 기존 것 사용
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
 * 마이데이터 API 요청 헬퍼 함수
 * 액세스 토큰을 포함한 API 요청
 */
async function makeMyDataApiRequest<T>(
  endpoint: string,
  accessToken: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`마이데이터 API 요청 실패: ${errorData.error || response.statusText}`);
  }

  return response.json();
}

/**
 * 병원 방문 기록 조회
 */
export async function fetchHospitalRecords(
  accessToken: string,
  params?: {
    startDate?: string;
    endDate?: string;
    hospitalName?: string;
  }
): Promise<any[]> {
  console.group("[MyDataClient] 병원 방문 기록 조회");

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("start_date", params.startDate);
    if (params?.endDate) queryParams.append("end_date", params.endDate);
    if (params?.hospitalName) queryParams.append("hospital_name", params.hospitalName);

    const url = `${MYDATA_API_ENDPOINTS.hospitalRecords}?${queryParams.toString()}`;
    const data = await makeMyDataApiRequest<MyDataApiResponse<any[]>>(url, accessToken);

    console.log(`✅ 병원 방문 기록 조회 완료: ${data.data?.length || 0}건`);
    console.groupEnd();

    return data.data || [];
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
  console.group("[MyDataClient] 약물 복용 기록 조회");

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("start_date", params.startDate);
    if (params?.endDate) queryParams.append("end_date", params.endDate);

    const url = `${MYDATA_API_ENDPOINTS.medicationRecords}?${queryParams.toString()}`;
    const data = await makeMyDataApiRequest<MyDataApiResponse<any[]>>(url, accessToken);

    console.log(`✅ 약물 복용 기록 조회 완료: ${data.data?.length || 0}건`);
    console.groupEnd();

    return data.data || [];
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
  console.group("[MyDataClient] 건강검진 기록 조회");

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("start_date", params.startDate);
    if (params?.endDate) queryParams.append("end_date", params.endDate);
    if (params?.checkupType) queryParams.append("checkup_type", params.checkupType);

    const url = `${MYDATA_API_ENDPOINTS.checkupRecords}?${queryParams.toString()}`;
    const data = await makeMyDataApiRequest<MyDataApiResponse<any[]>>(url, accessToken);

    console.log(`✅ 건강검진 기록 조회 완료: ${data.data?.length || 0}건`);
    console.groupEnd();

    return data.data || [];
  } catch (error) {
    console.error("❌ 건강검진 기록 조회 실패:", error);
    console.groupEnd();
    throw error;
  }
}

