/**
 * @file use-home-customization.ts
 * @description 홈페이지 커스텀 설정 관리 훅
 *
 * 주요 기능:
 * 1. localStorage에서 커스텀 설정 로드/저장
 * 2. Supabase 동기화 (로그인 사용자)
 * 3. 테마 모드 및 배경 설정 관리
 * 4. 섹션 순서 관리
 * 5. SSR 안전성 보장
 *
 * @dependencies
 * - React (useEffect, useMemo, useState, useCallback)
 * - types/home-customization.ts
 * - @clerk/nextjs (useAuth)
 * - lib/supabase/clerk-client.ts
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import type {
  HomeCustomization,
  ThemeMode,
  BackgroundType,
} from "@/types/home-customization";
import { DEFAULT_HOME_CUSTOMIZATION } from "@/types/home-customization";

const HOME_CUSTOMIZATION_STORAGE_KEY = "app.home-customization.v1";

/**
 * localStorage에서 커스텀 설정을 안전하게 읽기
 */
function safeReadCustomizationFromLocalStorage(): HomeCustomization | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(HOME_CUSTOMIZATION_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as HomeCustomization;
    // 기본값 검증
    if (!parsed.theme || !parsed.sectionOrder || !Array.isArray(parsed.sectionOrder)) {
      return null;
    }
    return parsed;
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.error("[useHomeCustomization] localStorage read failed:", error);
    }
    return null;
  }
}

/**
 * localStorage에 커스텀 설정을 안전하게 저장
 */
function safeWriteCustomizationToLocalStorage(customization: HomeCustomization): void {
  try {
    if (typeof window === "undefined") return;
    const updated = {
      ...customization,
      lastUpdated: new Date().toISOString(),
    };
    window.localStorage.setItem(HOME_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(updated));
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.groupCollapsed("[useHomeCustomization] 커스텀 설정 저장");
      console.log("테마 모드:", updated.theme.mode);
      console.log("배경 타입:", updated.theme.backgroundType);
      console.log("섹션 순서:", updated.sectionOrder);
      console.groupEnd();
    }
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.error("[useHomeCustomization] localStorage write failed:", error);
    }
  }
}

interface UseHomeCustomizationResult {
  /** 현재 커스텀 설정 */
  customization: HomeCustomization;
  /** 로드 완료 여부 */
  isLoaded: boolean;
  /** 테마 모드 업데이트 */
  updateThemeMode: (mode: ThemeMode) => void;
  /** 배경 타입 업데이트 */
  updateBackgroundType: (type: BackgroundType) => void;
  /** 배경 이미지 URL 업데이트 */
  updateBackgroundImage: (url: string | undefined) => void;
  /** 배경 색상 업데이트 */
  updateBackgroundColor: (color: string | undefined) => void;
  /** 커스텀 그라데이션 업데이트 */
  updateCustomGradient: (gradient: string | undefined) => void;
  /** 섹션 순서 업데이트 */
  updateSectionOrder: (order: string[]) => void;
  /** 카드 스타일 업데이트 */
  updateCardStyle: (style: Partial<HomeCustomization["cardStyle"]>) => void;
  /** 기본값으로 복원 */
  resetToDefault: () => void;
}

/**
 * 홈페이지 커스텀 설정 관리 훅
 */
export function useHomeCustomization(): UseHomeCustomizationResult {
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const supabase = useClerkSupabaseClient();

  // Hydration 오류 방지: 초기 상태는 항상 서버와 동일하게 설정
  const initial = useMemo<HomeCustomization>(() => {
    return DEFAULT_HOME_CUSTOMIZATION;
  }, []);

  const [customization, setCustomization] = useState<HomeCustomization>(initial);
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorage에서 로드 및 Supabase 동기화
  useEffect(() => {
    const loadCustomization = async () => {
      // localStorage에서 로드
      const stored = safeReadCustomizationFromLocalStorage();
      let merged: HomeCustomization = DEFAULT_HOME_CUSTOMIZATION;

      if (stored) {
        // 기본값과 병합 (새로운 필드가 추가된 경우 대비)
        merged = {
          ...DEFAULT_HOME_CUSTOMIZATION,
          ...stored,
          theme: {
            ...DEFAULT_HOME_CUSTOMIZATION.theme,
            ...stored.theme,
          },
          sectionOrder: stored.sectionOrder || DEFAULT_HOME_CUSTOMIZATION.sectionOrder,
        };
      }

      // 로그인 사용자인 경우 Supabase에서 동기화
      if (isAuthLoaded && userId && supabase) {
        try {
          if (process.env.NODE_ENV === "development") {
            console.groupCollapsed("[useHomeCustomization] Supabase에서 설정 로드");
          }
          
          // 현재 사용자의 Supabase user_id 조회
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, home_customization")
            .eq("clerk_id", userId)
            .maybeSingle();

          // userError가 실제 에러인지 확인 (빈 객체가 아닌 경우만 에러로 처리)
          // Supabase의 maybeSingle()은 데이터가 없을 때 error를 빈 객체 {}로 반환할 수 있음
          const hasRealError = userError && 
            typeof userError === 'object' && 
            Object.keys(userError).length > 0 &&
            (userError.message || userError.code || userError.hint);
          
          // 실제 에러가 있는 경우에만 처리
          if (hasRealError) {
            // 개발 환경에서만 에러 로그 출력
            if (process.env.NODE_ENV === "development") {
              console.error("❌ 사용자 조회 실패:", userError);
              console.groupEnd();
            }
            setCustomization(merged);
            setIsLoaded(true);
            return;
          }
          
          // userError가 빈 객체이거나 없는 경우는 정상 (데이터가 없을 수 있음)

          if (userData?.home_customization) {
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Supabase에서 설정 발견:", userData.home_customization);
            }
            // Supabase 데이터와 localStorage 데이터 병합 (Supabase 우선)
            const supabaseCustomization = userData.home_customization as HomeCustomization;
            merged = {
              ...DEFAULT_HOME_CUSTOMIZATION,
              ...supabaseCustomization,
              theme: {
                ...DEFAULT_HOME_CUSTOMIZATION.theme,
                ...supabaseCustomization.theme,
              },
              sectionOrder: supabaseCustomization.sectionOrder || DEFAULT_HOME_CUSTOMIZATION.sectionOrder,
            };
            // localStorage에도 저장 (동기화)
            safeWriteCustomizationToLocalStorage(merged);
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("ℹ️ Supabase에 설정 없음, localStorage 사용");
            }
          }
          if (process.env.NODE_ENV === "development") {
            console.groupEnd();
          }
        } catch (error) {
          // 개발 환경에서만 에러 로그 출력
          if (process.env.NODE_ENV === "development") {
            console.error("❌ Supabase 동기화 실패:", error);
          }
          // 에러가 발생해도 localStorage 데이터는 사용
        }
      }

      setCustomization(merged);
      setIsLoaded(true);
    };

    loadCustomization();
  }, [isAuthLoaded, userId, supabase]);

  // 상태 변경 시 localStorage에 저장 및 Supabase 동기화
  useEffect(() => {
    if (!isLoaded) return;

    // localStorage에 저장
    safeWriteCustomizationToLocalStorage(customization);

      // 로그인 사용자인 경우 Supabase에 동기화
      if (userId && supabase) {
        const syncToSupabase = async () => {
        try {
          if (process.env.NODE_ENV === "development") {
            console.groupCollapsed("[useHomeCustomization] Supabase에 설정 저장");
          }
          
          // 현재 사용자의 Supabase user_id 조회
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", userId)
            .maybeSingle();

          // userError가 실제 에러인지 확인 (빈 객체가 아닌 경우만 에러로 처리)
          const hasRealError = userError && 
            typeof userError === 'object' && 
            Object.keys(userError).length > 0 &&
            (userError.message || userError.code || userError.hint);
          
          // 실제 에러가 있는 경우에만 처리
          if (hasRealError) {
            if (process.env.NODE_ENV === "development") {
              console.error("❌ 사용자 조회 실패:", userError);
              console.groupEnd();
            }
            return;
          }
          
          // userError가 빈 객체이거나 없는 경우는 정상 (데이터가 없을 수 있음)

          // userData가 없으면 조용히 반환 (사용자가 아직 생성되지 않았을 수 있음)
          if (!userData) {
            if (process.env.NODE_ENV === "development") {
              console.log("ℹ️ 사용자 데이터 없음 (정상일 수 있음)");
              console.groupEnd();
            }
            return;
          }

          // home_customization 필드 업데이트
          const { error: updateError } = await supabase
            .from("users")
            .update({
              home_customization: customization,
            })
            .eq("id", userData.id);

          if (updateError) {
            // 개발 환경에서만 에러 로그 출력
            if (process.env.NODE_ENV === "development") {
              console.error("❌ Supabase 업데이트 실패:", updateError);
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Supabase 동기화 완료");
            }
          }
          if (process.env.NODE_ENV === "development") {
            console.groupEnd();
          }
        } catch (error) {
          // 개발 환경에서만 에러 로그 출력
          if (process.env.NODE_ENV === "development") {
            console.error("❌ Supabase 동기화 중 오류:", error);
          }
        }
      };

      // 디바운싱: 500ms 후에 동기화 (빈번한 업데이트 방지)
      const timeoutId = setTimeout(syncToSupabase, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [customization, isLoaded, userId, supabase]);

  /**
   * 테마 모드 업데이트
   */
  const updateThemeMode = useCallback((mode: ThemeMode) => {
    setCustomization((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        mode,
      },
    }));
  }, []);

  /**
   * 배경 타입 업데이트
   */
  const updateBackgroundType = useCallback((type: BackgroundType) => {
    setCustomization((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        backgroundType: type,
      },
    }));
  }, []);

  /**
   * 배경 이미지 URL 업데이트
   */
  const updateBackgroundImage = useCallback((url: string | undefined) => {
    setCustomization((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        backgroundImageUrl: url,
      },
    }));
  }, []);

  /**
   * 배경 색상 업데이트
   */
  const updateBackgroundColor = useCallback((color: string | undefined) => {
    setCustomization((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        backgroundColor: color,
      },
    }));
  }, []);

  /**
   * 커스텀 그라데이션 업데이트
   */
  const updateCustomGradient = useCallback((gradient: string | undefined) => {
    setCustomization((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        customGradient: gradient,
      },
    }));
  }, []);

  /**
   * 섹션 순서 업데이트
   */
  const updateSectionOrder = useCallback((order: string[]) => {
    setCustomization((prev) => ({
      ...prev,
      sectionOrder: order,
    }));
  }, []);

  /**
   * 카드 스타일 업데이트
   */
  const updateCardStyle = useCallback((style: Partial<HomeCustomization["cardStyle"]>) => {
    setCustomization((prev) => ({
      ...prev,
      cardStyle: {
        ...prev.cardStyle,
        ...style,
      },
    }));
  }, []);

  /**
   * 기본값으로 복원
   */
  const resetToDefault = useCallback(async () => {
    setCustomization(DEFAULT_HOME_CUSTOMIZATION);
    
    // localStorage 초기화
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(HOME_CUSTOMIZATION_STORAGE_KEY);
    }

    // Supabase도 초기화
    if (userId && supabase) {
      try {
        if (process.env.NODE_ENV === "development") {
          console.group("[useHomeCustomization] Supabase 기본값으로 복원");
        }
        
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", userId)
          .maybeSingle();

        // userError가 실제 에러인지 확인 (빈 객체가 아닌 경우만 에러로 처리)
        const hasRealError = userError && 
          typeof userError === 'object' && 
          Object.keys(userError).length > 0 &&
          (userError.message || userError.code || userError.hint);
        
        // 실제 에러가 있는 경우에만 처리
        if (hasRealError) {
          if (process.env.NODE_ENV === "development") {
            console.error("❌ 사용자 조회 실패:", userError);
            console.groupEnd();
          }
          return;
        }
        
        // userError가 빈 객체이거나 없는 경우는 정상 (데이터가 없을 수 있음)

        // userData가 없으면 조용히 반환 (사용자가 아직 생성되지 않았을 수 있음)
        if (!userData) {
          if (process.env.NODE_ENV === "development") {
            console.log("ℹ️ 사용자 데이터 없음 (정상일 수 있음)");
            console.groupEnd();
          }
          return;
        }

        const { error: updateError } = await supabase
          .from("users")
          .update({
            home_customization: null,
          })
          .eq("id", userData.id);

        if (updateError) {
          // 개발 환경에서만 에러 로그 출력
          if (process.env.NODE_ENV === "development") {
            console.error("❌ Supabase 초기화 실패:", updateError);
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log("✅ Supabase 초기화 완료");
          }
        }
        if (process.env.NODE_ENV === "development") {
          console.groupEnd();
        }
      } catch (error) {
        // 개발 환경에서만 에러 로그 출력
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Supabase 초기화 중 오류:", error);
        }
      }
    }
  }, [userId, supabase]);

  return {
    customization,
    isLoaded,
    updateThemeMode,
    updateBackgroundType,
    updateBackgroundImage,
    updateBackgroundColor,
    updateCustomGradient,
    updateSectionOrder,
    updateCardStyle,
    resetToDefault,
  };
}

