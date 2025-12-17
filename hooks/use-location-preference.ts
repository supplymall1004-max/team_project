/**
 * @file use-location-preference.ts
 * @description "위치 사용" 앱 내부 토글 상태를 로컬에 저장/조회하는 훅
 *
 * 목적:
 * - 모바일/웹에서 "설정에서 위치 사용 ON/OFF" UX를 제공하되,
 *   OS(설정 앱)의 권한 토글을 직접 변경할 수는 없으므로(보안 정책),
 *   우리 앱 내부에서 "위치 기능을 사용할지"를 별도로 관리합니다.
 *
 * 핵심 구현:
 * - localStorage에 boolean 값을 저장 (key: LOCATION_PREFERENCE_STORAGE_KEY)
 * - SSR/테스트 환경에서도 안전하도록 try/catch와 typeof window 가드 사용
 *
 * @dependencies
 * - React (useEffect, useMemo, useState, useCallback)
 */

import { useCallback, useEffect, useMemo, useState } from "react";

const LOCATION_PREFERENCE_STORAGE_KEY = "app.location.enabled.v1";

interface LocationPreferenceState {
  /** 앱 내부 토글: 위치 기능을 사용할지 여부 */
  isLocationEnabled: boolean;
  /** 로컬 저장소 로드가 완료되었는지 */
  isLoaded: boolean;
}

interface UseLocationPreferenceResult extends LocationPreferenceState {
  setIsLocationEnabled: (next: boolean) => void;
}

function safeReadBooleanFromLocalStorage(key: string): boolean | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  } catch (error) {
    console.error("[useLocationPreference] localStorage read failed:", error);
    return null;
  }
}

function safeWriteBooleanToLocalStorage(key: string, value: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value ? "true" : "false");
  } catch (error) {
    console.error("[useLocationPreference] localStorage write failed:", error);
  }
}

export function useLocationPreference(): UseLocationPreferenceResult {
  const initial = useMemo<LocationPreferenceState>(() => {
    const stored = safeReadBooleanFromLocalStorage(LOCATION_PREFERENCE_STORAGE_KEY);
    return {
      isLocationEnabled: stored ?? false,
      isLoaded: false,
    };
  }, []);

  const [state, setState] = useState<LocationPreferenceState>(initial);

  useEffect(() => {
    const stored = safeReadBooleanFromLocalStorage(LOCATION_PREFERENCE_STORAGE_KEY);
    setState({
      isLocationEnabled: stored ?? false,
      isLoaded: true,
    });
  }, []);

  const setIsLocationEnabled = useCallback((next: boolean) => {
    console.group("[location] preference toggle");
    console.log("next:", next);
    console.log("time:", new Date().toISOString());
    console.groupEnd();

    setState((prev) => ({ ...prev, isLocationEnabled: next }));
    safeWriteBooleanToLocalStorage(LOCATION_PREFERENCE_STORAGE_KEY, next);
  }, []);

  return {
    isLocationEnabled: state.isLocationEnabled,
    isLoaded: state.isLoaded,
    setIsLocationEnabled,
  };
}

