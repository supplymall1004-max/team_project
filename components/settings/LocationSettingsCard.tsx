/**
 * @file LocationSettingsCard.tsx
 * @description 설정 화면에서 "위치 사용" 토글을 제공하는 카드 컴포넌트
 *
 * - 이 토글은 OS 설정(권한 토글)을 직접 변경하지 않습니다.
 * - 대신 "앱 내부에서 위치 기능을 사용할지"를 저장하고,
 *   ON 시 브라우저의 위치 권한 팝업을 띄우도록 트리거합니다.
 *
 * @dependencies
 * - components/location/LocationPermissionToggle
 */

"use client";

import { useCallback } from "react";

import { LocationPermissionToggle } from "@/components/location/LocationPermissionToggle";

/**
 * 설정 페이지에서 쓰는 래퍼:
 * - 토글 ON 시 권한 팝업을 띄우기 위해 "한 번" 현재 위치 요청을 수행합니다.
 * - 실제 위치 데이터는 여기서 저장하지 않고, 네이버지도에서 추적할 때 사용합니다.
 */
export function LocationSettingsCard() {
  const onEnableRequest = useCallback(async () => {
    try {
      console.group("📍 [settings] 위치 사용 ON → 권한 요청 트리거");
      console.log("time:", new Date().toISOString());

      if (!navigator.geolocation) {
        throw new Error("이 브라우저는 위치 정보를 지원하지 않습니다.");
      }

      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (error) => {
            // 권한 거부는 "사용자 선택"이므로 예외로 취급하지 않고 조용히 종료합니다.
            // (UI는 LocationPermissionToggle에서 permissions 상태를 기반으로 안내를 표시함)
            if (error.code === error.PERMISSION_DENIED) {
              console.warn(
                "ℹ️ [settings] 사용자가 위치 권한을 거부했습니다. (설정에서 허용으로 변경 가능)",
              );
              resolve();
              return;
            }

            // 그 외는 실제 오류 가능성이 있으므로 사용자 친화 메시지로 변환해 예외 처리합니다.
            if (error.code === error.POSITION_UNAVAILABLE) {
              reject(
                new Error(
                  "위치 정보를 사용할 수 없습니다. GPS 신호를 확인해주세요.",
                ),
              );
              return;
            }
            if (error.code === error.TIMEOUT) {
              reject(
                new Error(
                  "위치 요청이 시간 초과되었습니다. 다시 시도해주세요.",
                ),
              );
              return;
            }
            reject(new Error("위치 권한 요청 중 문제가 발생했습니다."));
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          },
        );
      });
    } finally {
      console.groupEnd();
    }
  }, []);

  return <LocationPermissionToggle onEnableRequest={onEnableRequest} />;
}
