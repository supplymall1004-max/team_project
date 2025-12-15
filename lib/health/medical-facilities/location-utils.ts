/**
 * @file location-utils.ts
 * @description 위치 관련 유틸리티 함수
 *
 * 거리 계산, 좌표 변환 등 위치 관련 유틸리티 함수를 제공합니다.
 */

/**
 * 두 좌표 간의 거리를 계산 (Haversine 공식)
 *
 * @param lat1 첫 번째 위치의 위도
 * @param lon1 첫 번째 위치의 경도
 * @param lat2 두 번째 위치의 위도
 * @param lon2 두 번째 위치의 경도
 * @returns 거리 (km)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구 반경 (km)
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // 소수점 둘째 자리까지
}

/**
 * 각도를 라디안으로 변환
 *
 * @param degrees 각도
 * @returns 라디안
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 거리를 포맷팅하여 반환
 *
 * @param distance 거리 (km)
 * @returns 포맷팅된 거리 문자열
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * 사용자 위치를 가져옴 (Geolocation API)
 * 모바일에서 더 정확한 위치를 얻기 위해 최적화된 옵션 사용
 *
 * @returns 사용자 위치 좌표 또는 null
 */
export async function getUserLocation(): Promise<{
  lat: number;
  lon: number;
} | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      console.warn("⚠️ 브라우저가 위치 정보를 지원하지 않습니다.");
      resolve(null);
      return;
    }

    console.group("📍 위치 정보 요청");
    console.log("위치 권한을 요청하는 중...");
    console.log("📍 모바일 최적화 옵션: enableHighAccuracy=true, maximumAge=0");

    // 모바일 기기 감지
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log(`📱 모바일 기기: ${isMobile ? "예" : "아니오"}`);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
        console.log(`✅ 사용자 위치 획득 성공`);
        console.log(`📍 좌표: 위도 ${latitude}, 경도 ${longitude}`);
        console.log(`📍 위치 정확도: ±${Math.round(accuracy || 0)}m`);
        if (altitude !== null) {
          console.log(`📍 고도: ${Math.round(altitude || 0)}m`);
        }
        if (heading !== null) {
          console.log(`📍 방향: ${Math.round(heading || 0)}°`);
        }
        if (speed !== null) {
          console.log(`📍 속도: ${Math.round(speed || 0)}m/s`);
        }
        console.groupEnd();
        resolve({ lat: latitude, lon: longitude });
      },
      (error) => {
        console.error("⚠️ 위치 정보 접근 실패");
        console.error("에러 코드:", error.code);
        console.error("에러 메시지:", error.message);
        
        // 에러 코드에 따른 상세 설명
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error("❌ 사용자가 위치 권한을 거부했습니다.");
            console.error("💡 해결 방법:");
            console.error("   1. 브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭");
            console.error("   2. '위치' 권한을 '허용'으로 변경");
            console.error("   3. 페이지 새로고침");
            break;
          case error.POSITION_UNAVAILABLE:
            console.error("❌ 위치 정보를 사용할 수 없습니다.");
            console.error("💡 GPS나 네트워크 문제일 수 있습니다.");
            if (isMobile) {
              console.error("💡 모바일: GPS 설정을 확인하고 야외에서 시도해보세요.");
            }
            break;
          case error.TIMEOUT:
            console.error("❌ 위치 정보 요청 시간 초과 (20초)");
            console.error("💡 네트워크 연결을 확인하세요.");
            if (isMobile) {
              console.error("💡 모바일: GPS 신호가 약한 곳일 수 있습니다. 야외로 이동해보세요.");
            }
            break;
          default:
            console.error("❌ 알 수 없는 오류가 발생했습니다.");
        }
        
        console.groupEnd();
        resolve(null);
      },
      {
        enableHighAccuracy: true, // GPS 사용 (모바일에서 더 정확)
        timeout: 20000, // 타임아웃 증가 (20초) - 모바일 GPS 수신 시간 고려
        maximumAge: 0, // 캐시된 위치 사용 안 함 (항상 최신 위치)
      }
    );
  });
}

/**
 * 기본 위치 (서울시청) 반환
 *
 * @returns 기본 위치 좌표
 */
export function getDefaultLocation(): { lat: number; lon: number } {
  return {
    lat: 37.5665,
    lon: 126.978,
  };
}

