"use client";

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Client Component용)
 *
 * 2025년 4월부터 권장되는 방식:
 * - JWT 템플릿 불필요
 * - useAuth().getToken()으로 현재 세션 토큰 사용
 * - React Hook으로 제공되어 Client Component에서 사용
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
 *
 * export default function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   async function fetchData() {
 *     const { data } = await supabase.from('table').select('*');
 *     return data;
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { getToken, isLoaded: isAuthLoaded } = useAuth();

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      const errorMessage = "[useClerkSupabaseClient] Supabase 환경 변수가 설정되지 않았습니다. " +
        "Vercel Dashboard → Settings → Environment Variables에서 " +
        "NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.";
      
      console.error(errorMessage, {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        nodeEnv: process.env.NODE_ENV,
      });
      
      // 프로덕션에서는 더미 클라이언트를 반환하여 앱이 크래시하지 않도록 함
      // (실제 쿼리는 실패하지만, ErrorBoundary가 에러를 잡을 수 있음)
      if (process.env.NODE_ENV === "production") {
        console.warn("[useClerkSupabaseClient] 프로덕션 환경에서 더미 클라이언트를 반환합니다. 환경변수를 확인해주세요.");
        return createClient(
          "https://placeholder.supabase.co",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
      }
      
      // 개발 환경에서는 에러를 throw하여 개발자가 문제를 인지할 수 있도록 함
      throw new Error(errorMessage);
    }

    if (!isAuthLoaded) {
      // 경고를 로그 레벨로 변경 (에러가 아님)
      if (process.env.NODE_ENV === "development") {
        console.log("[useClerkSupabaseClient] Clerk 인증 로딩 중...");
      }
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        if (!isAuthLoaded) {
          return null;
        }
        const token = await getToken();
        // 개발 환경에서만 토큰 조회 로그 출력 (너무 자주 실행되므로 조건부로만)
        if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
          // 첫 번째 토큰 조회 시에만 로그 출력 (콘솔 스팸 방지)
          const logKey = "__supabase_token_logged__";
          if (!(window as any)[logKey]) {
            console.log("[useClerkSupabaseClient] 토큰 조회 성공:", {
              hasToken: !!token,
              tokenLength: token?.length || 0,
            });
            (window as any)[logKey] = true;
          }
        }
        return token ?? null;
      },
    });
  }, [getToken, isAuthLoaded]);

  return supabase;
}
