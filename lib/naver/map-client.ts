/**
 * @file map-client.ts
 * @description 네이버 지도 클라이언트 설정
 *
 * 네이버 지도 JavaScript API를 사용하기 위한 유틸리티 함수입니다.
 * 클라이언트 사이드에서만 사용됩니다.
 *
 * 참고: 네이버 클라우드 플랫폼에서 지도 API를 발급받아야 합니다.
 * - 공식 문서: https://api.ncloud-docs.com/docs/application-maps-dynamic
 * - NAVER Maps JavaScript API v3: https://navermaps.github.io/maps.js.ncp/docs/
 * - Maps 이용 신청: https://www.ncloud.com/product/applicationService/maps
 *
 * 중요: HTTP Referer 인증 방식을 사용하려면 Application 등록 시 Web 서비스 URL을 반드시 입력해야 합니다.
 * 참고: https://api.ncloud-docs.com/docs/application-maps-static
 *
 * 발급받은 Client ID를 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수에 설정하세요.
 */

/**
 * 네이버 지도 API 스크립트 URL 생성
 *
 * 네이버 클라우드 플랫폼에서 발급받은 Client ID를 사용합니다.
 * 참고: https://www.designkits.co.kr/blog/know-how/NAVER-MAP-API
 *
 * @returns 네이버 지도 API 스크립트 URL
 */
export function getNaverMapScriptUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId || clientId.trim() === "") {
    console.error("❌ NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.");
    console.error("💡 .env.local 파일에 다음을 추가해주세요:");
    console.error("   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=네이버_클라우드_플랫폼_Client_ID");
    console.error("   ⚠️ 주의: 값 앞뒤에 공백이나 따옴표가 없어야 합니다.");
    throw new Error(
      "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }

  // 공백 제거
  const trimmedClientId = clientId.trim();

  // 클라이언트 사이드에서만 현재 URL 확인 및 검증
  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;
    const currentUrl = window.location.href;
    
    console.group("🔍 네이버 맵 API 설정 확인");
    console.log("Client ID:", trimmedClientId);
    console.log("현재 Origin:", currentOrigin);
    console.log("현재 전체 URL:", currentUrl);
    console.log("스크립트 URL:", `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${trimmedClientId}`);
    
    // 등록된 URL 목록 (네이버 클라우드 플랫폼에 등록된 Web 서비스 URL)
    const registeredUrls = [
      "http://localhost:3000",
      "http://localhost:3000/",
      "http://192.168.0.7:3000",
      "https://team-project-eight-blue.vercel.app/",
      "https://team-project-eight-blue.vercel.app"
    ];
    
    const isRegistered = registeredUrls.some(url => {
      const normalizedUrl = url.replace(/\/$/, ""); // 끝의 슬래시 제거
      return currentOrigin === normalizedUrl || currentOrigin === url;
    });
    
    if (!isRegistered) {
      console.warn("⚠️ 현재 URL이 네이버 클라우드 플랫폼에 등록되지 않았을 수 있습니다!");
      console.warn("등록된 URL:", registeredUrls);
      console.warn("현재 URL:", currentOrigin);
      console.warn("");
      console.warn("💡 해결 방법:");
      console.warn("   1. 네이버 클라우드 플랫폼 콘솔 접속: https://console.ncloud.com/");
      console.warn("   2. AI·Application Service → Maps → Application 선택");
      console.warn("   3. 서비스환경 → Web 서비스 URL");
      console.warn(`   4. 다음 URL 추가: ${currentOrigin}`);
      console.warn(`   5. 또는 다음 URL 추가: ${currentOrigin}/`);
    } else {
      console.log("✅ 현재 URL이 등록된 목록에 포함되어 있습니다.");
    }
    
    console.groupEnd();
  }

  // NAVER Maps JavaScript API v3 URL (업데이트됨)
  // 공식 문서: https://navermaps.github.io/maps.js.ncp/docs/
  // 참고: https://api.ncloud-docs.com/docs/application-maps-dynamic
  // 중요 변경사항: ncpClientId → ncpKeyId로 파라미터 변경
  // 올바른 도메인은 oapi.map.naver.com 입니다 (openapi가 아님)
  return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${trimmedClientId}`;
}

/**
 * 네이버 지도 API가 로드되었는지 확인
 *
 * @returns 네이버 지도 API 로드 여부
 */
export function isNaverMapLoaded(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // 네이버 지도 API가 완전히 로드되었는지 확인
  const naver = (window as { naver?: any }).naver;
  return naver && naver.maps && naver.maps.Map && typeof naver.maps.Map === 'function';
}

/**
 * 네이버 좌표계를 WGS84 좌표계로 변환
 *
 * 네이버 로컬 검색 API는 KATEC 좌표계를 사용하며,
 * 이를 WGS84 좌표계로 변환해야 합니다.
 *
 * @param mapx 네이버 X 좌표 (문자열 또는 숫자) - 경도
 * @param mapy 네이버 Y 좌표 (문자열 또는 숫자) - 위도
 * @returns WGS84 좌표 (위도, 경도)
 */
export function convertNaverToWGS84(
  mapx: string | number,
  mapy: string | number
): { lat: number; lon: number } {
  const x = typeof mapx === "string" ? parseFloat(mapx) : mapx;
  const y = typeof mapy === "string" ? parseFloat(mapy) : mapy;

  // 네이버 로컬 검색 API는 KATEC 좌표계를 사용
  // KATEC 좌표계를 WGS84로 변환하는 공식
  // mapx는 경도(longitude), mapy는 위도(latitude)를 나타냄
  // 좌표는 10000000으로 나누어 실제 좌표로 변환
  const lon = x / 10000000;
  const lat = y / 10000000;

  return { lat, lon };
}

