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
    console.group("🔍 ensureSupabaseUser");
    
    // Clerk 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return null;
    }

    console.log("✅ Clerk User ID:", userId);

    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = getServiceRoleClient();

    // 1. 먼저 사용자가 이미 존재하는지 확인
    console.log("🔍 기존 사용자 조회 중...");
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, name")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("❌ 사용자 조회 오류:", checkError);
      console.groupEnd();
      return null;
    }

    // 2. 이미 존재하면 반환
    if (existingUser) {
      console.log("✅ 사용자가 이미 존재합니다. ID:", existingUser.id);
      console.groupEnd();
      return existingUser;
    }

    // 3. 존재하지 않으면 Clerk에서 정보를 가져와서 동기화
    console.log("📝 사용자가 없어서 동기화 중...");
    
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser) {
      console.error("❌ Clerk에서 사용자 정보를 찾을 수 없음");
      console.groupEnd();
      return null;
    }

    const userName = clerkUser.fullName ||
                     clerkUser.firstName ||
                     clerkUser.username ||
                     clerkUser.emailAddresses[0]?.emailAddress ||
                     "사용자";

    console.log("👤 Clerk 사용자 정보:", {
      id: clerkUser.id,
      name: userName,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    // 4. Supabase에 사용자 정보 동기화
    console.log("💾 Supabase에 동기화 중...");
    const { data: upserted, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: userId,
          name: userName,
        },
        { onConflict: "clerk_id" }
      )
      .select("id, name")
      .single();

    if (upsertError) {
      console.error("❌ 사용자 동기화 실패:", upsertError);
      console.groupEnd();
      return null;
    }

    console.log("✅ 사용자 동기화 성공! Supabase User ID:", upserted.id);
    console.groupEnd();
    return upserted;
  } catch (error) {
    console.error("❌ ensureSupabaseUser 오류:", error);
    console.groupEnd();
    return null;
  }
}






