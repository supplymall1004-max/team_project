/**
 * @file app/api/admin/popups/delete-image/route.ts
 * @description 관리자 팝업 이미지 삭제 API
 *
 * DELETE /api/admin/popups/delete-image
 * Service Role 클라이언트를 사용하여 RLS를 우회하고 이미지 삭제
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * DELETE /api/admin/popups/delete-image
 * 팝업 이미지 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("🗑️ [AdminPopups][DeleteImage]");
    
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.error("❌ 인증 실패");
      console.groupEnd();
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 요청 본문에서 이미지 URL 가져오기
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("❌ 이미지 URL이 없음");
      console.groupEnd();
      return NextResponse.json(
        { error: "이미지 URL이 필요합니다." },
        { status: 400 }
      );
    }

    console.log("삭제할 이미지 URL:", imageUrl);

    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/popup-images/");
    
    if (pathParts.length < 2) {
      console.error("❌ 잘못된 URL 형식:", imageUrl);
      console.groupEnd();
      return NextResponse.json(
        { error: "잘못된 이미지 URL입니다." },
        { status: 400 }
      );
    }

    const filePath = pathParts[1];
    console.log("삭제할 파일 경로:", filePath);

    // Service Role 클라이언트로 삭제 (RLS 우회)
    const supabase = getServiceRoleClient();

    const { error } = await supabase.storage
      .from("popup-images")
      .remove([filePath]);

    if (error) {
      console.error("❌ 삭제 실패:", {
        message: error.message,
      });
      console.groupEnd();
      return NextResponse.json(
        { error: `이미지 삭제 실패: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("✅ 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}

