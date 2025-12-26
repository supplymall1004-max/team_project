import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Service Role 클라이언트
 *
 * RLS(Row Level Security)를 우회하여 모든 데이터에 접근할 수 있는 관리자 클라이언트
 * 주의: 서버 사이드에서만 사용해야 하며, 클라이언트에 노출되면 안됩니다.
 *
 * @example
 * ```ts
 * import { getServiceRoleClient } from '@/lib/supabase/service-role';
 *
 * export async function POST(req: Request) {
 *   const supabase = getServiceRoleClient();
 *   const { data, error } = await supabase
 *     .from('users')
 *     .insert({ ... });
 * }
 * ```
 */
export function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseServiceRoleKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
    
    const errorMessage = `Supabase 환경변수가 누락되었습니다: ${missingVars.join(", ")}. Vercel Dashboard → Settings → Environment Variables에서 확인해주세요.`;
    console.error("❌ [ServiceRoleClient]", errorMessage);
    throw new Error(errorMessage);
  }

  // Service Role Key 형식 검증 (일반적으로 "eyJ..."로 시작하는 JWT 토큰)
  if (!supabaseServiceRoleKey.startsWith("eyJ")) {
    console.warn(
      "⚠️ [ServiceRoleClient] SUPABASE_SERVICE_ROLE_KEY가 예상 형식이 아닙니다. " +
      "Service Role Key는 일반적으로 'eyJ'로 시작하는 JWT 토큰입니다. " +
      "Vercel 환경변수 값을 확인해주세요."
    );
  }

  // URL 형식 검증
  try {
    new URL(supabaseUrl);
  } catch (urlError) {
    console.error("❌ [ServiceRoleClient] NEXT_PUBLIC_SUPABASE_URL이 유효한 URL 형식이 아닙니다:", supabaseUrl);
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL이 유효한 URL 형식이 아닙니다: ${supabaseUrl}`
    );
  }

  // 개발 환경에서만 상세 로그 출력 (프로덕션 성능 최적화)
  if (process.env.NODE_ENV === "development") {
    console.log("✅ [ServiceRoleClient] Supabase Service Role 클라이언트 생성 완료");
    console.log("   - URL:", supabaseUrl);
    console.log("   - Service Role Key:", supabaseServiceRoleKey.substring(0, 20) + "...");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
