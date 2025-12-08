import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자를 Supabase users 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 */
export async function POST() {
  try {
    console.group("🔄 POST /api/sync-user");

    // Clerk 인증 확인
    const authResult = await auth();
    const userId = authResult?.userId;

    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    console.log("✅ Clerk User ID:", userId);

    // Clerk에서 사용자 정보 가져오기 (재시도 로직 추가)
    const client = await clerkClient();
    let clerkUser = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !clerkUser) {
      try {
        clerkUser = await client.users.getUser(userId);
        if (!clerkUser && retryCount < maxRetries - 1) {
          console.log(`⏳ Clerk 사용자 정보 조회 재시도 (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 점진적 지연
          retryCount++;
        } else if (clerkUser) {
          break; // 성공적으로 가져왔으면 루프 종료
        }
      } catch (error) {
        console.error(`❌ Clerk 사용자 정보 조회 실패 (시도 ${retryCount + 1}):`, error);
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          retryCount++;
        } else {
          break;
        }
      }
    }

    // Supabase 클라이언트 초기화
    const supabase = getServiceRoleClient();

    // Clerk에서 사용자 정보를 찾을 수 없는 경우에도 기본 정보만으로 진행
    if (!clerkUser) {
      console.warn("⚠️ Clerk에서 사용자 정보를 찾을 수 없음 - 기본 정보만으로 진행");
      console.log("📝 기본 사용자 정보 생성:", userId);

      // 기본 사용자 이름 생성 (User + ID의 일부)
      const defaultUserName = `User_${userId.slice(-8)}`;

      // 먼저 기존 사용자 확인
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, clerk_id, name")
        .eq("clerk_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("❌ 사용자 확인 실패:", checkError);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to check user",
            details: checkError.message,
            success: false,
          },
          { status: 500 }
        );
      }

      let data;
      let error;

      if (existingUser) {
        // 기존 사용자가 있으면 업데이트
        console.log("📝 기존 사용자 업데이트 중...");
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({ name: defaultUserName })
          .eq("clerk_id", userId)
          .select()
          .single();
        
        data = updatedUser;
        error = updateError;
      } else {
        // 새 사용자 생성 (id는 자동 생성됨)
        console.log("➕ 새 사용자 생성 중...");
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            clerk_id: userId,
            name: defaultUserName,
          })
          .select()
          .single();
        
        data = newUser;
        error = insertError;
      }

      if (error) {
        console.error("❌ 기본 사용자 정보 저장 실패:", error);
        console.error("  - 에러 코드:", error.code);
        console.error("  - 에러 메시지:", error.message);
        console.error("  - 에러 상세:", error.details);
        console.error("  - 에러 힌트:", error.hint);
        console.groupEnd();
        return NextResponse.json(
          {
            error: "Failed to create default user",
            details: error.message,
            success: false,
          },
          { status: 500 }
        );
      }

      console.log("✅ 기본 사용자 생성 성공! Supabase User ID:", data.id);
      console.groupEnd();

      return NextResponse.json(
        {
          success: true,
          user: data,
          note: "Created with default info (Clerk user not found)",
        },
        { status: 200 }
      );
    }

    const userName = clerkUser.fullName ||
                    clerkUser.username ||
                    clerkUser.emailAddresses[0]?.emailAddress ||
                    "Unknown";

    console.log("👤 Clerk 사용자:", {
      id: clerkUser.id,
      name: userName,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    console.log("💾 Supabase에 동기화 중...");

    // 먼저 기존 사용자 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, clerk_id, name")
      .eq("clerk_id", clerkUser.id)
      .maybeSingle();

    if (checkError) {
      console.error("❌ 사용자 확인 실패:", checkError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to check user",
          details: checkError.message,
          success: false,
        },
        { status: 500 }
      );
    }

    let data;
    let error;

    if (existingUser) {
      // 기존 사용자가 있으면 업데이트
      console.log("📝 기존 사용자 업데이트 중...");
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ name: userName })
        .eq("clerk_id", clerkUser.id)
        .select()
        .single();
      
      data = updatedUser;
      error = updateError;
    } else {
      // 새 사용자 생성 (id는 자동 생성됨)
      console.log("➕ 새 사용자 생성 중...");
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_id: clerkUser.id,
          name: userName,
        })
        .select()
        .single();
      
      data = newUser;
      error = insertError;
    }

    if (error) {
      console.error("❌ Supabase 동기화 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Failed to sync user",
          details: error.message,
          success: false,
        },
        { status: 500 }
      );
    }

    console.log("✅ 사용자 동기화 성공! Supabase User ID:", data.id);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        user: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ 동기화 중 오류:", error);
    console.groupEnd();
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}
