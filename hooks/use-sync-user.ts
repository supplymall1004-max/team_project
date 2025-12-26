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
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    // 이미 동기화했거나, 로딩 중이거나, 로그인하지 않은 경우 무시
    if (syncedRef.current || !isLoaded || !userId) {
      return;
    }

    // 재시도 카운터 리셋
    retryCountRef.current = 0;

    // 동기화 실행 - 비동기로 처리하여 블로킹 방지
    const syncUser = async (isRetry = false) => {
      try {
        console.groupCollapsed(`[Auth] 사용자 동기화 시도${isRetry ? ` (재시도 ${retryCountRef.current}/${maxRetries})` : ""}`);
        console.log("timestamp:", new Date().toISOString());

        // 타임아웃을 위한 AbortController 생성 (30초)
        const abortController = new AbortController();
        let timeoutId: NodeJS.Timeout | null = null;
        let response: Response | null = null;
        
        try {
          timeoutId = setTimeout(() => {
            abortController.abort();
          }, 30000);

          response = await fetch("/api/sync-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: abortController.signal,
          });

          // 성공적으로 응답을 받았으면 타임아웃 정리
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        } catch (fetchError) {
          // 타임아웃 정리
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          // AbortError (타임아웃)인 경우 재시도
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current += 1;
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
              console.warn(`⚠️ 요청 타임아웃 - ${delay}ms 후 재시도 (${retryCountRef.current}/${maxRetries})`);
              setTimeout(() => {
                if (!syncedRef.current) {
                  syncUser(true);
                }
              }, delay);
              console.groupEnd();
              return;
            } else {
              console.error("❌ 요청 타임아웃: 최대 재시도 횟수 초과");
              // 무한 로딩 방지를 위해 동기화 완료로 표시
              syncedRef.current = true;
              retryCountRef.current = 0;
              console.warn("⚠️ 타임아웃으로 재시도를 중단합니다 (무한 로딩 방지)");
              console.groupEnd();
              return;
            }
          }

          // 네트워크 에러 처리
          console.error("❌ 네트워크 에러:", fetchError);
          
          // 재시도 가능한 경우 재시도
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000); // 지수 백오프, 최대 5초
            console.warn(`⚠️ 네트워크 연결 실패 - ${delay}ms 후 재시도 (${retryCountRef.current}/${maxRetries})`);
            
            setTimeout(() => {
              if (!syncedRef.current) {
                syncUser(true);
              }
            }, delay);
            console.groupEnd();
            return;
          } else {
            // 최대 재시도 횟수 초과
            console.error("❌ 네트워크 연결 실패: 최대 재시도 횟수 초과");
            // 무한 로딩 방지를 위해 동기화 완료로 표시
            syncedRef.current = true;
            retryCountRef.current = 0;
            console.warn("⚠️ 네트워크 오류로 재시도를 중단합니다 (무한 로딩 방지)");
            console.groupEnd();
            return;
          }
        }

        // response가 없으면 종료
        if (!response) {
          console.groupEnd();
          return;
        }

        if (!response.ok) {
          // 에러 응답 처리
          const errorText = await response.text().catch(() => "응답 본문을 읽을 수 없습니다");
          
          // HTML 응답인 경우 (404 페이지 등) 요약만 표시
          const isHtmlResponse = errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html");
          const errorSummary = isHtmlResponse 
            ? `HTML 응답 (${errorText.length} bytes) - API 라우트를 찾을 수 없습니다`
            : errorText.substring(0, 200); // 긴 텍스트는 처음 200자만
          
          console.error("❌ 사용자 동기화 실패:", response.status, errorSummary);

          // 404 에러의 경우 (API 라우트가 존재하지 않거나 Next.js가 인식하지 못함)
          if (response.status === 404) {
            console.error("❌ /api/sync-user 엔드포인트를 찾을 수 없습니다.");
            console.error("   - 파일이 존재하는지 확인: app/api/sync-user/route.ts");
            console.error("   - Next.js 개발 서버를 재시작해보세요");
            console.error("   - .next 폴더를 삭제하고 다시 빌드해보세요");
            
            // 404는 API가 존재하지 않는 것이므로 재시도하지 않음
            syncedRef.current = true;
            retryCountRef.current = 0;
            console.warn("⚠️ API 라우트를 찾을 수 없어 동기화를 중단합니다");
            console.groupEnd();
            return;
          }
          
          // 5xx 서버 에러인 경우에도 재시도 시도
          if (response.status >= 500) {
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current += 1;
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
              console.warn(`⚠️ 서버 에러(5xx) - ${delay}ms 후 재시도 (${retryCountRef.current}/${maxRetries})`);
              setTimeout(() => {
                if (!syncedRef.current) {
                  syncUser(true);
                }
              }, delay);
              console.groupEnd();
              return;
            } else {
              console.error("❌ 서버 에러: 최대 재시도 횟수 초과");
              // 무한 로딩 방지를 위해 동기화 완료로 표시
              syncedRef.current = true;
              retryCountRef.current = 0;
              console.warn("⚠️ 서버 에러로 재시도를 중단합니다 (무한 로딩 방지)");
              console.groupEnd();
              return;
            }
          }
          
          // 기타 에러 (401, 403 등)는 재시도하지 않음
          console.error("❌ 사용자 동기화 실패 (재시도 불가):", response.status);
          // 무한 로딩 방지를 위해 동기화 완료로 표시
          syncedRef.current = true;
          retryCountRef.current = 0;
          console.warn("⚠️ 사용자 동기화 실패했지만 재시도를 중단합니다 (무한 로딩 방지)");
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
            retryCountRef.current = 0; // 성공 시 재시도 카운터 리셋
            console.log("✅ 사용자 동기화 성공");
          } else {
            console.error("❌ 사용자 동기화 응답 실패:", data);
            // 실패해도 더 이상 재시도하지 않도록 설정 (무한 로딩 방지)
            syncedRef.current = true;
            retryCountRef.current = 0;
            console.warn("⚠️ 사용자 동기화 실패했지만 재시도를 중단합니다 (무한 로딩 방지)");
          }
        } else {
          // JSON이 아닌 경우에도 성공으로 처리 (200 OK)
          syncedRef.current = true;
          retryCountRef.current = 0; // 성공 시 재시도 카운터 리셋
          console.log("✅ 사용자 동기화 성공 (비JSON 응답)");
        }
        console.groupEnd();
      } catch (error) {
        // 네트워크 오류나 기타 예외 처리
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
        
        // AbortError는 이미 위에서 처리했으므로 여기서는 다른 에러만 처리
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("❌ 사용자 동기화 중 예외 발생:", errorMessage);
          console.error("❌ 전체 에러 객체:", error);
        }
        
        // 무한 로딩 방지를 위해 동기화 완료로 표시 (에러가 발생해도)
        syncedRef.current = true;
        retryCountRef.current = 0;
        console.warn("⚠️ 예외 발생으로 재시도를 중단합니다 (무한 로딩 방지)");
        
        console.groupEnd();
        // 에러가 발생해도 페이지 로딩을 방해하지 않음
      }
    };

    // 새 기기/비로그인 사용자의 경우 즉시 실행하지 않고 약간의 지연 후 실행
    // 이렇게 하면 페이지 로딩을 방해하지 않음
    const delay = userId ? 100 : 500; // 로그인 사용자는 빠르게, 비로그인은 약간 지연
    
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      requestIdleCallback(() => syncUser(), { timeout: 2000 });
    } else {
      // 폴백: 약간의 지연 후 실행
      setTimeout(() => syncUser(), delay);
    }
  }, [isLoaded, userId]);
}
