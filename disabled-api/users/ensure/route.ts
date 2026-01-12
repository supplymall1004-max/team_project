/**
 * @file app/api/users/ensure/route.ts
 * @description 사용자가 users 테이블에 존재하는지 확인하고, 없으면 생성
 * 
 * 이 API는 건강 정보 입력 등 사용자 데이터가 필요한 작업 전에 호출됩니다.
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST() {
  console.group("🔍 POST /api/users/ensure");
  
  try {
    // Clerk 인증 확인
    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ 
        error: "Unauthorized",
        message: "로그인이 필요합니다." 
      }, { status: 401 });
    }

    console.log("✅ Clerk User ID:", userId);

    // Clerk 사용자 정보 가져오기
    console.log("📋 Clerk 사용자 정보 가져오는 중...");
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      console.error("❌ Clerk 사용자 정보를 가져올 수 없음");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "User information not found",
          message: "Clerk에서 사용자 정보를 가져올 수 없습니다." 
        },
        { status: 404 }
      );
    }

    console.log("✅ Clerk User Name:", clerkUser.fullName || clerkUser.firstName);
    console.log("✅ Clerk User Email:", clerkUser.primaryEmailAddress?.emailAddress);

    // Service Role 클라이언트 사용 (RLS 우회)
    console.log("🔑 Service Role 클라이언트 생성 중...");
    
    let supabase;
    try {
      supabase = getServiceRoleClient();
      console.log("✅ Service Role 클라이언트 생성 성공");
    } catch (clientError) {
      console.error("❌ Service Role 클라이언트 생성 실패:", clientError);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Configuration error",
          message: "데이터베이스 연결 설정에 문제가 있습니다.",
          details: clientError instanceof Error ? clientError.message : String(clientError)
        },
        { status: 500 }
      );
    }

    // 1. 먼저 사용자가 이미 존재하는지 확인
    console.log("🔍 기존 사용자 조회 중... (clerk_id:", userId, ")");
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .maybeSingle();

    console.log("조회 결과:", { existingUser, checkError });

    if (checkError) {
      console.error("❌ 사용자 조회 오류:", checkError);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Failed to check user existence",
          message: "사용자 정보 조회 중 오류가 발생했습니다.",
          details: checkError.message,
          code: checkError.code
        },
        { status: 500 }
      );
    }

    // 2. 이미 존재하면 해당 ID 반환
    if (existingUser) {
      console.log("✅ 사용자가 이미 존재합니다. ID:", existingUser.id);
      console.groupEnd();
      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        created: false,
      });
    }

    // 3. 존재하지 않으면 새로 생성
    console.log("📝 새 사용자 생성 중...");
    
    const userName = clerkUser.fullName || 
                     clerkUser.firstName || 
                     clerkUser.username || 
                     "사용자";

    console.log("생성할 사용자 정보:", { clerk_id: userId, name: userName });

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        clerk_id: userId,
        name: userName,
      })
      .select("id")
      .single();

    console.log("생성 결과:", { newUser, createError });

    if (createError || !newUser) {
      console.error("❌ 사용자 생성 실패:", createError);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Failed to create user",
          message: "사용자 정보 생성에 실패했습니다.",
          details: createError?.message,
          code: createError?.code,
          hint: createError?.hint
        },
        { status: 500 }
      );
    }

    console.log("✅ 사용자 생성 성공! ID:", newUser.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      created: true,
    });

  } catch (error) {
    console.error("❌ 예상치 못한 서버 오류:", error);
    
    // 스택 트레이스 출력
    if (error instanceof Error) {
      console.error("Error Stack:", error.stack);
    }
    
    console.groupEnd();
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: "서버에서 예상치 못한 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error 
          ? error.stack 
          : undefined
      },
      { status: 500 }
    );
  }
}

