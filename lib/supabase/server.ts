import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Clerk + Supabase 네이티브 통합 클라이언트 (Server Component용)
 *
 * 2025년 4월부터 권장되는 방식:
 * - JWT 템플릿 불필요
 * - Clerk 토큰을 Supabase가 자동 검증
 * - auth().getToken()으로 현재 세션 토큰 사용
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClerkSupabaseClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = createClerkSupabaseClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export async function createClerkSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // 프로덕션에서는 에러를 던지지만, 개발 환경에서는 더미 클라이언트 반환
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Supabase URL or Anon Key is missing. Please check your environment variables."
      );
    }
    // 개발 환경에서는 더미 클라이언트 반환
    return createClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseKey || "placeholder-key"
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      try {
        const authResult = await auth();
        if (!authResult) {
          return null;
        }
        const token = await authResult.getToken();
        return token ?? null;
      } catch (error) {
        // 인증 오류 시 null 반환 (공개 데이터 접근)
        if (process.env.NODE_ENV === "development") {
          console.error("[Supabase] Token retrieval error:", error);
        }
        return null;
      }
    },
  });
}

/**
 * Re-export getServiceRoleClient from service-role.ts
 * Service Role 클라이언트는 RLS를 우회하며 서버 사이드 전용입니다.
 */
export { getServiceRoleClient } from "./service-role";
