/**
 * @file public-server.ts
 * @description 서버 컴포넌트/액션에서 공개 데이터를 조회할 때 사용하는 Supabase 클라이언트.
 *
 * 인증이 필요하지 않은 공개 섹션(예: 레거시 아카이브)을 위해
 * anon key 기반 클라이언트를 별도로 생성해 재사용합니다.
 * 
 * 성능 최적화: 싱글톤 패턴으로 클라이언트 재사용
 */

import { createClient } from "@supabase/supabase-js";

let publicClient: ReturnType<typeof createClient> | null = null;

export function createPublicSupabaseServerClient() {
  // 싱글톤 패턴: 클라이언트 재사용으로 성능 최적화
  if (publicClient) {
    return publicClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = "[Supabase] 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.";
    console.error(errorMessage);
    
    // 개발 환경에서는 더미 클라이언트를 반환하여 페이지가 로드되도록 함
    // 프로덕션에서는 에러를 던짐
    if (process.env.NODE_ENV === "development") {
      // 더미 클라이언트 생성 (실제 쿼리는 실패하지만 페이지는 로드됨)
      publicClient = createClient(
        "https://placeholder.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
      );
      return publicClient;
    }
    throw new Error("Supabase 환경 변수가 누락되었습니다.");
  }

  publicClient = createClient(supabaseUrl, supabaseAnonKey);
  return publicClient;
}

