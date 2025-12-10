"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Clerk 사용자를 Supabase DB에 자동으로 동기화하는 훅
 *
 * 사용자가 로그인한 상태에서 이 훅을 사용하면
 * 자동으로 /api/sync-user를 호출하여 Supabase users 테이블에 사용자 정보를 저장합니다.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useSyncUser } from '@/hooks/use-sync-user';
 *
 * export default function Layout({ children }) {
 *   useSyncUser();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useSyncUser() {
  const { isLoaded, userId } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    // 이미 동기화했거나, 로딩 중이거나, 로그인하지 않은 경우 무시
    if (syncedRef.current || !isLoaded || !userId) {
      return;
    }

    // 동기화 실행 - 비동기로 처리하여 블로킹 방지
    const syncUser = async () => {
      try {
        console.groupCollapsed("[Auth] 사용자 동기화 시도");
        console.log("timestamp:", new Date().toISOString());

        const response = await fetch("/api/sync-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }).catch((fetchError) => {
          // 네트워크 에러 처리
          console.error("❌ 네트워크 에러:", fetchError);
          throw new Error(`네트워크 연결 실패: ${fetchError.message}`);
        });

        if (!response.ok) {
          // 에러 응답 처리
          const errorText = await response.text().catch(() => "응답 본문을 읽을 수 없습니다");
          console.error("❌ 사용자 동기화 실패:", response.status, errorText);

          // 404 에러의 경우 (새로운 계정에서 Clerk 정보가 아직 준비되지 않음)
          if (response.status === 404) {
            console.warn("⚠️ Clerk 사용자 정보가 아직 준비되지 않음 - 잠시 후 재시도");
            // 2초 후 재시도
            setTimeout(() => {
              if (!syncedRef.current) {
                console.log("🔄 사용자 동기화 재시도");
                syncUser();
              }
            }, 2000);
            return;
          }
          // 5xx 서버 에러인 경우에도 재시도 시도
          if (response.status >= 500) {
            console.warn("⚠️ 서버 에러(5xx) 추정 - 재시도 시도");
            setTimeout(() => {
              if (!syncedRef.current) {
                console.log("🔄 사용자 동기화 재시도(서버에러)");
                syncUser();
              }
            }, 2000);
            return;
          }
          this; // noop to keep patch context valid
          console.groupEnd();
          return;
        }

        // 응답이 JSON인지 확인
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json().catch((jsonError) => {
            console.error("❌ JSON 파싱 실패:", jsonError);
            return { success: false };
          });
          if (data.success) {
            syncedRef.current = true;
            console.log("✅ 사용자 동기화 성공");
          } else {
            console.error("❌ 사용자 동기화 응답 실패:", data);
          }
        } else {
          // JSON이 아닌 경우에도 성공으로 처리 (200 OK)
          syncedRef.current = true;
          console.log("✅ 사용자 동기화 성공 (비JSON 응답)");
        }
        console.groupEnd();
      } catch (error) {
        // 네트워크 오류나 기타 예외 처리
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
        console.error("❌ 사용자 동기화 중 예외 발생:", errorMessage);
        console.error("❌ 전체 에러 객체:", error);
        console.groupEnd();
        // 에러가 발생해도 페이지 로딩을 방해하지 않음
      }
    };

    // requestIdleCallback을 사용하여 브라우저가 유휴 상태일 때 실행
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      requestIdleCallback(syncUser, { timeout: 2000 });
    } else {
      // 폴백: 약간의 지연 후 실행
      setTimeout(syncUser, 100);
    }
  }, [isLoaded, userId]);
}
