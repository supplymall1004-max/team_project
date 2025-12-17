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
  lon2: number,
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
    const isBrowser = typeof window !== "undefined";
    const hasGeolocation = isBrowser && !!navigator.geolocation;

    if (!hasGeolocation) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("⚠️ 브라우저가 위치 정보를 지원하지 않습니다.");
      }
      resolve(null);
      return;
    }

    // 모바일 기기 감지
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const openGroup = process.env.NODE_ENV !== "production";
    if (openGroup) {
      console.group("📍 위치 정보 요청");
      console.log("위치 권한을 확인/요청하는 중...");
      console.log(
        "📍 모바일 최적화 옵션: enableHighAccuracy=true, maximumAge=0",
      );
      console.log(`📱 모바일 기기: ${isMobile ? "예" : "아니오"}`);
    }

    const safeGroupEnd = (): void => {
      if (openGroup) console.groupEnd();
    };

    // Permissions API로 "이미 거부됨"이면 요청 자체를 하지 않음 (콘솔/팝업 스팸 방지)
    const maybeCheckPermission = async (): Promise<
      "granted" | "denied" | "prompt" | "unknown"
    > => {
      try {
        if (
          !("permissions" in navigator) ||
          typeof navigator.permissions.query !== "function"
        ) {
          return "unknown";
        }
        // TS lib.dom 타입에 따라 name이 좁혀질 수 있어 캐스팅 처리
        const status = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        return status.state ?? "unknown";
      } catch {
        return "unknown";
      }
    };

    void (async () => {
      const permissionState = await maybeCheckPermission();

      if (permissionState === "denied") {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "⚠️ 위치 권한이 이미 거부된 상태입니다. (브라우저 설정에서 허용으로 변경 필요)",
          );
        }
        safeGroupEnd();
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } =
            position.coords;
          if (openGroup) {
            console.log("✅ 사용자 위치 획득 성공");
            console.log(`📍 좌표: 위도 ${latitude}, 경도 ${longitude}`);
            console.log(`📍 위치 정확도: ±${Math.round(accuracy || 0)}m`);
            if (altitude !== null)
              console.log(`📍 고도: ${Math.round(altitude || 0)}m`);
            if (heading !== null)
              console.log(`📍 방향: ${Math.round(heading || 0)}°`);
            if (speed !== null)
              console.log(`📍 속도: ${Math.round(speed || 0)}m/s`);
          }
          safeGroupEnd();
          resolve({ lat: latitude, lon: longitude });
        },
        (error) => {
          // 권한 거부는 "사용자 선택"이므로 error로 찍지 않고, 개발 환경에서만 1줄로 안내
          if (error.code === error.PERMISSION_DENIED) {
            if (process.env.NODE_ENV !== "production") {
              console.warn(
                "ℹ️ 사용자가 위치 권한을 거부했습니다. (브라우저 설정에서 '위치: 허용'으로 변경 가능)",
              );
              console.warn(`사유: ${error.message}`);
            }
            safeGroupEnd();
            resolve(null);
            return;
          }

          // 그 외는 실제 장애 가능성이 있어 error 로그 유지 (단, 과도한 다중 라인 출력은 줄임)
          console.error("⚠️ 위치 정보 접근 실패", {
            code: error.code,
            message: error.message,
          });
          safeGroupEnd();
          resolve(null);
        },
        {
          enableHighAccuracy: true, // GPS 사용 (모바일에서 더 정확)
          timeout: 20000, // 타임아웃 증가 (20초) - 모바일 GPS 수신 시간 고려
          maximumAge: 0, // 캐시된 위치 사용 안 함 (항상 최신 위치)
        },
      );
    })();
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
