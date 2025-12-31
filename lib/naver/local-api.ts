/**
 * @file local-api.ts
 * @description 네이버 로컬 검색 API 호출 함수
 *
 * 네이버 로컬 검색 API를 사용하여 장소를 검색합니다.
 * 서버 사이드에서만 호출하여 API 키를 보호합니다.
 *
 * 중요: 네이버 로컬 검색 API는 네이버 개발자 센터의 검색 API를 사용합니다.
 * - 엔드포인트: https://openapi.naver.com/v1/search/local.json
 * - 헤더: X-Naver-Client-Id, X-Naver-Client-Secret
 * - 네이버 클라우드 플랫폼(NCP) 키와는 다릅니다.
 *
 * 네이버 개발자 센터에서 로컬 검색 API 키를 발급받아야 합니다:
 * https://developers.naver.com/apps/#/register
 */

import type { NaverLocalSearchResponse } from "@/types/medical-facility";

/**
 * 네이버 로컬 검색 API 호출
 *
 * @param query 검색어
 * @param display 표시할 결과 수 (기본 10, 최대 100)
 * @param start 시작 위치 (기본 1)
 * @param lat 위도 (선택사항)
 * @param lon 경도 (선택사항)
 * @returns 네이버 로컬 검색 API 응답
 */
export async function searchLocal(
  query: string,
  options?: {
    display?: number;
    start?: number;
    lat?: number;
    lon?: number;
  }
): Promise<NaverLocalSearchResponse> {
  console.group("[Naver Local API] 장소 검색");
  console.log(`🔍 검색어: ${query}`);

  // 하이브리드 방식: 사용자 API 키 우선, 없으면 환경 변수
  const { getHybridNaverCredentials } = await import("@/lib/api-keys/get-user-api-key");
  const userCredentials = await getHybridNaverCredentials(
    "naver_search",
    "NAVER_SEARCH_CLIENT_ID",
    "NAVER_SEARCH_CLIENT_SECRET"
  );

  // 환경변수 읽기 및 공백 제거
  // 로컬 검색 API 전용 환경변수 우선 사용, 없으면 공통 환경변수 사용
  const rawClientId = userCredentials.clientId || process.env.NAVER_SEARCH_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const rawClientSecret = userCredentials.clientSecret || process.env.NAVER_SEARCH_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;

  // 환경변수 확인 및 상세 에러 메시지
  if (!rawClientId || rawClientId.trim() === "") {
    console.error("❌ 네이버 로컬 검색 API 키가 설정되지 않았습니다.");
    console.error("💡 설정 페이지에서 API 키를 입력하거나 .env.local 파일에 다음 중 하나를 추가해주세요:");
    console.error("   방법 1 (권장): 로컬 검색 API 전용 환경변수");
    console.error("   NAVER_SEARCH_CLIENT_ID=네이버_개발자_센터_Client_ID");
    console.error("   NAVER_SEARCH_CLIENT_SECRET=네이버_개발자_센터_Client_Secret");
    console.error("");
    console.error("   방법 2: 공통 환경변수 (지오코딩과 공유)");
    console.error("   NAVER_CLIENT_ID=네이버_개발자_센터_Client_ID");
    console.error("   NAVER_CLIENT_SECRET=네이버_개발자_센터_Client_Secret");
    console.error("");
    console.error("   ⚠️ 주의:");
    console.error("   - 값 앞뒤에 공백이나 따옴표가 없어야 합니다.");
    console.error("   - 네이버 개발자 센터에서 발급받은 키를 사용해야 합니다.");
    console.error("   - 네이버 클라우드 플랫폼(NCP) 키는 사용할 수 없습니다.");
    console.groupEnd();
    throw new Error(
      "네이버 로컬 검색 API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력하거나 NAVER_SEARCH_CLIENT_ID 또는 NAVER_CLIENT_ID를 .env.local 파일에 설정해주세요."
    );
  }

  if (!rawClientSecret || rawClientSecret.trim() === "") {
    console.error("❌ 네이버 로컬 검색 API Secret이 설정되지 않았습니다.");
    console.error("💡 설정 페이지에서 API 키를 입력하거나 .env.local 파일에 다음 중 하나를 추가해주세요:");
    console.error("   방법 1 (권장): 로컬 검색 API 전용 환경변수");
    console.error("   NAVER_SEARCH_CLIENT_SECRET=네이버_개발자_센터_Client_Secret");
    console.error("");
    console.error("   방법 2: 공통 환경변수 (지오코딩과 공유)");
    console.error("   NAVER_CLIENT_SECRET=네이버_개발자_센터_Client_Secret");
    console.error("");
    console.error("   ⚠️ 주의:");
    console.error("   - 값 앞뒤에 공백이나 따옴표가 없어야 합니다.");
    console.error("   - 네이버 개발자 센터에서 발급받은 키를 사용해야 합니다.");
    console.error("   - 네이버 클라우드 플랫폼(NCP) 키는 사용할 수 없습니다.");
    console.groupEnd();
    throw new Error(
      "네이버 로컬 검색 API Secret이 설정되지 않았습니다. 설정 페이지에서 API 키를 입력하거나 NAVER_SEARCH_CLIENT_SECRET 또는 NAVER_CLIENT_SECRET을 .env.local 파일에 설정해주세요."
    );
  }

  // 공백 제거 (앞뒤 공백 및 줄바꿈 문자 제거)
  const clientId = rawClientId.trim();
  const clientSecret = rawClientSecret.trim();

  // 환경변수 값 검증 (길이 및 형식 확인)
  if (clientId.length < 10) {
    console.warn("⚠️ Client ID가 너무 짧습니다. 올바른 값인지 확인해주세요.");
  }
  if (clientSecret.length < 10) {
    console.warn("⚠️ Client Secret이 너무 짧습니다. 올바른 값인지 확인해주세요.");
  }

  // 사용 중인 환경변수 이름 확인 (디버깅용)
  const usedEnvVar = process.env.NAVER_SEARCH_CLIENT_ID ? "NAVER_SEARCH_CLIENT_ID" : "NAVER_CLIENT_ID";
  console.log(`📝 사용 중인 환경변수: ${usedEnvVar}`);

  // 환경변수 값 일부 확인 (디버깅용, 보안을 위해 일부만 표시)
  console.log(
    `🔑 API 키 확인: Client ID=${clientId.substring(0, 4)}... (${clientId.length}자), Secret=${clientSecret.substring(0, 4)}... (${clientSecret.length}자)`
  );

  // NCP 키 형식 감지 (NCP 키는 보통 짧은 형식)
  // 네이버 개발자 센터 키는 보통 더 긴 형식입니다
  if (clientId.length < 15) {
    console.warn("⚠️ 경고: Client ID가 짧습니다. 네이버 개발자 센터의 로컬 검색 API 키인지 확인해주세요.");
    console.warn("   네이버 클라우드 플랫폼(NCP) 키는 로컬 검색 API에 사용할 수 없습니다.");
  }

  const display = options?.display ?? 10;
  const start = options?.start ?? 1;
  const lat = options?.lat;
  const lon = options?.lon;

  // API URL 구성
  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", String(start));
  
  // 좌표가 제공된 경우: 네이버 API에 좌표 전달
  // 참고: 네이버 로컬 검색 API는 lat/lon 파라미터를 지원하지만,
  // 검색어에 지역명이 포함되면 해당 지역만 검색됩니다.
  // 따라서 좌표 기반 검색을 위해서는 검색어에 지역명을 포함하지 않아야 합니다.
  if (lat === undefined || lon === undefined) {
    url.searchParams.set("sort", "random");
    console.log("📍 좌표 없음: random 정렬 사용");
  } else {
    // 좌표 전달 (네이버 API가 지원하는 경우 거리순 정렬)
    // 주의: 네이버 로컬 검색 API의 lat/lon 지원 여부는 공식 문서 확인 필요
    // 현재는 좌표를 전달하고, 클라이언트에서도 거리 계산하여 정렬
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    console.log(`📍 좌표 전달: 위도 ${lat}, 경도 ${lon}`);
    console.log(`📍 검색 모드: 좌표 기반 (거리순 정렬 시도)`);
    console.log(`⚠️ 참고: 검색어에 지역명이 포함되면 좌표가 무시될 수 있습니다.`);
  }

  try {
    console.log(`🌐 API 호출: ${url.toString()}`);
    
    // 네이버 로컬 검색 API 헤더 설정 (공식 문서 준수)
    // 참고: https://developers.naver.com/docs/serviceapi/search/local/local.md
    const headers: Record<string, string> = {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
      "Accept": "application/json", // JSON 응답 요청
    };

    console.log("📤 요청 헤더:", {
      "X-Naver-Client-Id": `${clientId.substring(0, 4)}...`,
      "X-Naver-Client-Secret": `${clientSecret.substring(0, 4)}...`,
      "Accept": "application/json",
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      // 캐시 방지 (디버깅용)
      cache: "no-store",
    });

    // Content-Type 확인
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      // 에러 응답 처리: 텍스트로 먼저 읽기
      let errorText = "";
      try {
        errorText = await response.text();
        console.error(`❌ API 호출 실패 (${response.status}):`, errorText.substring(0, 500));
      } catch (textError) {
        console.error(`❌ 응답 본문 읽기 실패:`, textError);
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      
      // 401 에러에 대한 상세 안내
      if (response.status === 401) {
        // 에러 응답 파싱 시도
        let errorData: { errorMessage?: string; errorCode?: string } = {};
        try {
          if (errorText) {
            const parsed = JSON.parse(errorText);
            errorData = parsed;
          }
        } catch {
          // JSON 파싱 실패 시 무시
        }

        console.error("🔐 401 인증 실패 - 상세 정보:");
        console.error(`   에러 코드: ${errorData.errorCode || "알 수 없음"}`);
        console.error(`   에러 메시지: ${errorData.errorMessage || errorText || "알 수 없음"}`);
        console.error("");
        console.error("🔍 가능한 원인:");
        console.error("   1. NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 값이 잘못되었습니다.");
        console.error("      - .env.local 파일에서 값 앞뒤 공백 확인");
        console.error("      - 따옴표나 특수문자 포함 여부 확인");
        console.error("   2. 네이버 개발자 센터에서 API 키가 비활성화되었습니다.");
        console.error("   3. 네이버 로컬 검색 API 서비스가 활성화되지 않았습니다.");
        console.error("   4. API 호출 IP가 허용 목록에 없습니다.");
        console.error("");
        console.error("💡 해결 방법:");
        console.error("   ⚠️ 중요: 네이버 로컬 검색 API는 네이버 개발자 센터의 검색 API를 사용합니다.");
        console.error("   네이버 클라우드 플랫폼(NCP) 키와는 다릅니다!");
        console.error("");
        console.error("   현재 설정된 키 정보:");
        console.error(`   - Client ID: ${clientId.substring(0, 4)}... (${clientId.length}자)`);
        console.error(`   - Client Secret: ${clientSecret.substring(0, 4)}... (${clientSecret.length}자)`);
        console.error("");
        if (clientId.length < 15) {
          console.error("   ⚠️ 경고: 현재 Client ID가 짧습니다. NCP 키일 가능성이 높습니다.");
          console.error("   NCP 키(pzm5qdxswb 등)는 로컬 검색 API에 사용할 수 없습니다!");
          console.error("");
        }
        console.error("   📋 단계별 가이드:");
        console.error("   1. 네이버 개발자 센터(https://developers.naver.com) 접속");
        console.error("   2. '내 애플리케이션' → 애플리케이션 등록 또는 기존 애플리케이션 선택");
        console.error("   3. 'API 설정' 탭에서 '검색' → '로컬 검색' API 활성화 확인");
        console.error("   4. '인증 정보' 탭에서 Client ID와 Client Secret 값 복사");
        console.error("      (헤더 이름: X-Naver-Client-Id, X-Naver-Client-Secret)");
        console.error("   5. .env.local 파일에 다음 형식으로 저장 (공백 없이):");
        console.error("      NAVER_CLIENT_ID=네이버_개발자_센터에서_복사한_Client_ID");
        console.error("      NAVER_CLIENT_SECRET=네이버_개발자_센터에서_복사한_Client_Secret");
        console.error("   6. 개발 서버 재시작 (pnpm dev)");
        console.error("   7. '서비스 환경'에서 IP 제한 설정 확인 (개발 환경에서는 모든 IP 허용 권장)");
        console.error("");
        console.error("   📌 참고:");
        console.error("   - 네이버 클라우드 플랫폼(NCP) 키는 지오코딩 API에만 사용됩니다.");
        console.error("   - 로컬 검색 API는 네이버 개발자 센터의 별도 키가 필요합니다.");
        console.error("   - 두 키는 서로 다른 서비스이므로 별도로 발급받아야 합니다.");
        console.groupEnd();
        
        const errorMsg = errorData.errorMessage 
          ? `네이버 로컬 검색 API 인증 실패 (401): ${errorData.errorMessage}`
          : `네이버 로컬 검색 API 인증 실패 (401): API 키를 확인해주세요.`;
        
        throw new Error(errorMsg);
      }
      
      console.groupEnd();
      throw new Error(`네이버 로컬 검색 API 호출 실패: ${response.status} ${errorText || ""}`);
    }

    // 성공 응답 처리: JSON 파싱
    let data: NaverLocalSearchResponse;
    try {
      if (contentType.includes("application/json")) {
        data = (await response.json()) as NaverLocalSearchResponse;
      } else {
        // JSON이 아닌 경우 텍스트로 읽고 파싱 시도
        const responseText = await response.text();
        console.warn("⚠️ Content-Type이 JSON이 아닙니다:", contentType);
        console.warn("응답 본문:", responseText.substring(0, 200));
        
        try {
          data = JSON.parse(responseText) as NaverLocalSearchResponse;
        } catch (parseError) {
          console.error("❌ JSON 파싱 실패:", parseError);
          throw new Error(
            `네이버 로컬 검색 API 응답 파싱 실패: 예상치 못한 응답 형식 (${contentType})`
          );
        }
      }
    } catch (parseError) {
      console.error("❌ 응답 파싱 오류:", parseError);
      console.groupEnd();
      throw new Error(
        `네이버 로컬 검색 API 응답을 파싱할 수 없습니다: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    console.log(`✅ 검색 결과: ${data.total}개 중 ${data.items.length}개 표시`);
    console.groupEnd();
    return data;
  } catch (error) {
    console.error("❌ 네이버 로컬 검색 API 오류:", error);
    console.groupEnd();
    throw error;
  }
}

