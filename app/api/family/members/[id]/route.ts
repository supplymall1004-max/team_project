/**
 * @file app/api/family/members/[id]/route.ts
 * @description 특정 가족 구성원 수정/삭제 API
 * 
 * PUT /api/family/members/[id] - 수정
 * DELETE /api/family/members/[id] - 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

/**
 * PUT /api/family/members/[id]
 * 가족 구성원 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("✏️ PUT /api/family/members/[id]");
    console.log("📍 API 라우트 호출됨");
    console.log("📍 요청 URL:", request.url);
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log("구성원 ID:", id);
    console.log("구성원 ID 타입:", typeof id);
    console.log("구성원 ID 길이:", id?.length);
    console.log("수정 데이터:", body);
    
    // ID 검증
    if (!id || id.trim() === "") {
      console.error("❌ 구성원 ID가 비어있습니다");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Invalid ID",
          message: "구성원 ID가 올바르지 않습니다."
        },
        { status: 400 }
      );
    }

    // 사용자 확인 및 자동 동기화
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "User not found",
          message: "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요."
        },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;
    const supabase = await createClerkSupabaseClient();

    // 권한 확인 (본인의 가족 구성원인지 체크)
    console.log("🔍 구성원 조회 중...");
    console.log("  - 구성원 ID:", id);
    console.log("  - 구성원 ID (UUID 형식 확인):", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? "올바른 UUID 형식" : "잘못된 UUID 형식");
    console.log("  - 사용자 ID:", supabaseUserId);
    
    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const trimmedId = String(id).trim();
    
    if (!uuidRegex.test(trimmedId)) {
      console.error("❌ 잘못된 UUID 형식");
      console.error("  - 입력된 ID:", id);
      console.error("  - 처리된 ID:", trimmedId);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Invalid ID",
          message: "구성원 ID 형식이 올바르지 않습니다.",
          details: "No suitable key or wrong key type"
        },
        { status: 400 }
      );
    }
    
    // UUID 비교 문제 해결: ID를 명시적으로 문자열로 변환하고 trim
    const memberId = trimmedId;
    console.log("  - 처리된 구성원 ID:", memberId);
    console.log("  - UUID 형식 검증 통과");
    
    // 권한 확인 (본인의 가족 구성원인지 체크)
    // .single() 대신 .maybeSingle() 사용하여 에러 방지
    const { data: existingMember, error: memberError } = await supabase
      .from("family_members")
      .select("id, name, user_id")
      .eq("id::text", memberId)
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    if (memberError) {
      console.error("❌ 구성원 조회 에러:", memberError);
      console.error("  - 에러 코드:", memberError.code);
      console.error("  - 에러 메시지:", memberError.message);
      console.error("  - 에러 상세:", memberError.details);
      console.error("  - 에러 힌트:", memberError.hint);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Database error",
          message: "데이터베이스 조회 중 오류가 발생했습니다.",
          details: memberError.message
        },
        { status: 500 }
      );
    }

    if (!existingMember) {
      console.error("❌ 권한 없음 또는 구성원 없음");
      console.error("  - 요청한 구성원 ID:", memberId);
      console.error("  - 사용자 ID:", supabaseUserId);
      
      // 디버깅: 해당 ID의 구성원이 다른 사용자 소유인지 확인
      const { data: otherMember, error: otherError } = await supabase
        .from("family_members")
        .select("id, user_id, name")
        .eq("id::text", memberId)
        .maybeSingle();
      
      if (otherError) {
        console.error("  - 다른 사용자 소유 확인 중 에러:", otherError);
      } else if (otherMember) {
        console.error("  - 해당 구성원은 다른 사용자 소유입니다");
        console.error("    - 소유자 ID:", otherMember.user_id);
        console.error("    - 구성원 이름:", otherMember.name);
      } else {
        console.error("  - 해당 ID의 구성원이 존재하지 않습니다");
      }
      
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Not found",
          message: "가족 구성원을 찾을 수 없습니다. 구성원이 삭제되었거나 권한이 없습니다.",
          details: otherMember ? "다른 사용자의 구성원입니다" : "구성원이 존재하지 않습니다"
        },
        { status: 404 }
      );
    }

    console.log("✅ 구성원 확인 완료:", existingMember.name);

    // 수정 데이터 준비 (include_in_unified_diet 컬럼이 없을 수 있으므로 조건부로 추가)
    const updateData: any = {
      name: body.name,
      birth_date: body.birth_date,
      gender: body.gender,
      relationship: body.relationship,
      diseases: body.diseases || [],
      allergies: body.allergies || [],
      height_cm: body.height_cm,
      weight_kg: body.weight_kg,
      activity_level: body.activity_level || "sedentary",
      dietary_preferences: body.dietary_preferences || [],
    };

    // include_in_unified_diet 컬럼이 존재하는 경우에만 추가
    if (body.include_in_unified_diet !== undefined) {
      updateData.include_in_unified_diet = body.include_in_unified_diet !== false;
    }

    console.log("수정할 데이터:", updateData);

    // 수정 (UUID 비교 문제 해결을 위해 처리된 ID 사용)
    const { data: updatedMember, error } = await supabase
      .from("family_members")
      .update(updateData)
      .eq("id::text", memberId)  // UUID를 text로 캐스팅하여 비교
      .select()
      .single();

    if (error) {
      console.error("❌ 수정 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "가족 구성원 수정 실패",
          message: error.message || "데이터베이스 오류가 발생했습니다.",
          details: error.details,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log(`✅ ${updatedMember.name} 수정 성공`);
    console.groupEnd();

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.error("❌ 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ 에러 메시지:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("❌ 스택 트레이스:", error.stack);
    }
    console.groupEnd();
    
    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/family/members/[id]
 * 가족 구성원 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.group("🗑️ DELETE /api/family/members/[id]");
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("구성원 ID:", id);
    console.log("구성원 ID 타입:", typeof id);
    console.log("구성원 ID 길이:", id?.length);

    // ID 검증
    if (!id || id.trim() === "") {
      console.error("❌ 구성원 ID가 비어있습니다");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Invalid ID",
          message: "구성원 ID가 올바르지 않습니다."
        },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const trimmedId = String(id).trim();
    
    if (!uuidRegex.test(trimmedId)) {
      console.error("❌ 잘못된 UUID 형식");
      console.error("  - 입력된 ID:", id);
      console.error("  - 처리된 ID:", trimmedId);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Invalid ID",
          message: "구성원 ID 형식이 올바르지 않습니다.",
          details: "No suitable key or wrong key type"
        },
        { status: 400 }
      );
    }

    // 사용자 확인 및 자동 동기화
    const userData = await ensureSupabaseUser();

    if (!userData) {
      console.error("❌ 사용자를 찾을 수 없거나 동기화 실패");
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "User not found",
          message: "사용자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요."
        },
        { status: 404 }
      );
    }

    const supabaseUserId = userData.id;
    const supabase = await createClerkSupabaseClient();

    // UUID 비교 문제 해결: ID를 명시적으로 문자열로 변환하고 trim
    const memberId = trimmedId;
    console.log("  - 처리된 구성원 ID:", memberId);
    console.log("  - UUID 형식 검증 통과");
    console.log("  - 사용자 ID:", supabaseUserId);
    
    // 삭제 전 구성원 존재 여부 및 권한 확인
    console.log("🔍 삭제할 구성원 확인 중...");
    const { data: existingMember, error: checkError } = await supabase
      .from("family_members")
      .select("id, name, user_id")
      .eq("id::text", memberId)  // UUID를 text로 캐스팅하여 비교
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    if (checkError) {
      console.error("❌ 구성원 확인 중 에러:", checkError);
      console.error("  - 에러 코드:", checkError.code);
      console.error("  - 에러 메시지:", checkError.message);
      console.error("  - 에러 상세:", checkError.details);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Database error",
          message: "데이터베이스 조회 중 오류가 발생했습니다.",
          details: checkError.message
        },
        { status: 500 }
      );
    }

    if (!existingMember) {
      console.error("❌ 권한 없음 또는 구성원 없음");
      console.error("  - 요청한 구성원 ID:", memberId);
      console.error("  - 사용자 ID:", supabaseUserId);
      
      // 디버깅: 해당 ID의 구성원이 다른 사용자 소유인지 확인
      const { data: otherMember, error: otherError } = await supabase
        .from("family_members")
        .select("id, user_id, name")
        .eq("id::text", memberId)
        .maybeSingle();
      
      if (otherError) {
        console.error("  - 다른 사용자 소유 확인 중 에러:", otherError);
      } else if (otherMember) {
        console.error("  - 해당 구성원은 다른 사용자 소유입니다");
        console.error("    - 소유자 ID:", otherMember.user_id);
        console.error("    - 구성원 이름:", otherMember.name);
      } else {
        console.error("  - 해당 ID의 구성원이 존재하지 않습니다");
      }
      
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Not found",
          message: "가족 구성원을 찾을 수 없습니다. 구성원이 삭제되었거나 권한이 없습니다.",
          details: otherMember ? "다른 사용자의 구성원입니다" : "구성원이 존재하지 않습니다"
        },
        { status: 404 }
      );
    }

    console.log("✅ 구성원 확인 완료:", existingMember.name);
    console.log("🗑️ 구성원 삭제 시작...");
    
    // 권한 확인 및 삭제
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id::text", memberId)  // UUID를 text로 캐스팅하여 비교
      .eq("user_id", supabaseUserId);

    if (error) {
      console.error("❌ 삭제 실패:", error);
      console.error("  - 에러 코드:", error.code);
      console.error("  - 에러 메시지:", error.message);
      console.error("  - 에러 상세:", error.details);
      console.error("  - 에러 힌트:", error.hint);
      console.groupEnd();
      return NextResponse.json(
        { 
          error: "Delete failed",
          message: "구성원 삭제 중 오류가 발생했습니다.",
          details: error.message
        },
        { status: 500 }
      );
    }

    console.log(`✅ 구성원 삭제 성공: ${existingMember.name}`);
    console.groupEnd();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    console.error("❌ 에러 타입:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("❌ 에러 메시지:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("❌ 스택 트레이스:", error.stack);
    }
    console.groupEnd();
    
    // 개발 환경에서는 자세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

