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
      console.error("[useClerkSupabaseClient] 환경 변수가 설정되지 않았습니다:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
    }

    if (!isAuthLoaded) {
      console.warn("[useClerkSupabaseClient] Clerk 인증이 아직 로드되지 않았습니다.");
    }

    return createClient(supabaseUrl, supabaseKey, {
      async accessToken() {
        if (!isAuthLoaded) {
          return null;
        }
        const token = await getToken();
        console.log("[useClerkSupabaseClient] 토큰 조회:", {
          hasToken: !!token,
          tokenLength: token?.length || 0,
        });
        return token ?? null;
      },
    });
  }, [getToken, isAuthLoaded]);

  return supabase;
}
