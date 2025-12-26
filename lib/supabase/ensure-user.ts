/**
 * @file lib/supabase/ensure-user.ts
 * @description Clerk 사용자가 Supabase users 테이블에 존재하는지 확인하고, 없으면 자동으로 동기화
 * 
 * 이 함수는 API 라우트에서 사용자를 조회할 때 사용됩니다.
 * 사용자가 없으면 자동으로 동기화를 시도하여 "User not found" 에러를 방지합니다.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자가 Supabase users 테이블에 존재하는지 확인하고, 없으면 자동으로 동기화
 * 
 * @returns Supabase user ID와 name을 포함한 객체, 실패 시 null
 */
export async function ensureSupabaseUser(): Promise<{ id: string; name: string } | null> {
  try {
    // 개발 환경에서만 상세 로그 출력
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.group("🔍 ensureSupabaseUser");
    }
    
    // Clerk 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      if (isDev) {
        console.error("❌ 인증 실패");
        console.groupEnd();
      }
      return null;
    }

    if (isDev) {
      console.log("✅ Clerk User ID:", userId);
    }

    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = getServiceRoleClient();

    // 1. 먼저 사용자가 이미 존재하는지 확인
    if (isDev) {
      console.log("🔍 기존 사용자 조회 중...");
    }
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, name")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("❌ 사용자 조회 오류:", checkError);
      console.error("  - 에러 코드:", checkError.code);
      console.error("  - 에러 메시지:", checkError.message);
      console.error("  - 에러 상세:", checkError.details);
      console.error("  - 에러 힌트:", checkError.hint);
      
      // PGRST301 오류는 환경변수 문제일 가능성이 높음
      if (checkError.code === "PGRST301") {
        console.error("  ⚠️ PGRST301 오류 감지: 'No suitable key or wrong key type'");
        console.error("  → 가능한 원인:");
        console.error("     1. Vercel 환경변수 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않음");
        console.error("     2. SUPABASE_SERVICE_ROLE_KEY 값이 잘못됨 (anon key를 사용했거나 잘못된 키)");
        console.error("     3. Service Role Key가 만료되었거나 비활성화됨");
        console.error("  → 해결 방법:");
        console.error("     1. Vercel Dashboard → Settings → Environment Variables 확인");
        console.error("     2. Supabase Dashboard → Settings → API → service_role key 복사");
        console.error("     3. Vercel에 SUPABASE_SERVICE_ROLE_KEY로 설정 (앞뒤 공백 없이)");
        console.error("     4. 배포 재시도");
      }
      
      if (isDev) {
        console.groupEnd();
      }
      return null;
    }

    // 2. 이미 존재하면 반환
    if (existingUser) {
      if (isDev) {
        console.log("✅ 사용자가 이미 존재합니다. ID:", existingUser.id);
        console.groupEnd();
      }
      return existingUser;
    }

    // 3. 존재하지 않으면 Clerk에서 정보를 가져와서 동기화
    if (isDev) {
      console.log("📝 사용자가 없어서 동기화 중...");
    }
    
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser) {
      console.error("❌ Clerk에서 사용자 정보를 찾을 수 없음");
      if (isDev) {
        console.groupEnd();
      }
      return null;
    }

    const userName = clerkUser.fullName ||
                     clerkUser.firstName ||
                     clerkUser.username ||
                     clerkUser.emailAddresses[0]?.emailAddress ||
                     "사용자";

    if (isDev) {
      console.log("👤 Clerk 사용자 정보:", {
        id: clerkUser.id,
        name: userName,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      });
    }

    // 4. Supabase에 사용자 정보 동기화
    if (isDev) {
      console.log("💾 Supabase에 동기화 중...");
    }
    
    // 다시 한 번 확인 (동시성 문제 방지)
    const { data: doubleCheckUser, error: doubleCheckError } = await supabase
      .from("users")
      .select("id, name")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (doubleCheckError) {
      console.error("❌ 사용자 재확인 실패:", doubleCheckError);
      console.groupEnd();
      return null;
    }

    let upserted;
    let upsertError;

    if (doubleCheckUser) {
      // 기존 사용자가 있으면 업데이트
      if (isDev) {
        console.log("📝 기존 사용자 업데이트 중...");
      }
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ name: userName })
        .eq("clerk_id", userId)
        .select("id, name")
        .single();
      
      upserted = updatedUser;
      upsertError = updateError;
    } else {
      // 새 사용자 생성 (id는 자동 생성됨)
      if (isDev) {
        console.log("➕ 새 사용자 생성 중...");
      }
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_id: userId,
          name: userName,
        })
        .select("id, name")
        .single();
      
      upserted = newUser;
      upsertError = insertError;
    }

    if (upsertError) {
      console.error("❌ 사용자 동기화 실패:", upsertError);
      console.error("  - 에러 코드:", upsertError.code);
      console.error("  - 에러 메시지:", upsertError.message);
      console.error("  - 에러 상세:", upsertError.details);
      console.error("  - 에러 힌트:", upsertError.hint);
      console.error("  - 동기화 시도한 데이터:", { clerk_id: userId, name: userName });
      
      // 중복 키 에러인 경우 기존 사용자 재조회 시도
      if (upsertError.code === "23505") {
        if (isDev) {
          console.log("🔄 중복 키 에러 - 기존 사용자 재조회 시도...");
        }
        const { data: retryUser, error: retryError } = await supabase
          .from("users")
          .select("id, name")
          .eq("clerk_id", userId)
          .maybeSingle();
        
        if (!retryError && retryUser) {
          if (isDev) {
            console.log("✅ 기존 사용자 재조회 성공:", retryUser.id);
            console.groupEnd();
          }
          return retryUser;
        }
      }
      
      if (isDev) {
        console.groupEnd();
      }
      return null;
    }

    if (isDev) {
      console.log("✅ 사용자 동기화 성공! Supabase User ID:", upserted.id);
      console.groupEnd();
    }
    return upserted;
  } catch (error) {
    console.error("❌ ensureSupabaseUser 예외 발생:", error);
    console.error("  - 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("  - 에러 메시지:", error instanceof Error ? error.message : String(error));
    console.error("  - 에러 스택:", error instanceof Error ? error.stack : "스택 없음");
    if (process.env.NODE_ENV === "development") {
      console.groupEnd();
    }
    return null;
  }
}






























