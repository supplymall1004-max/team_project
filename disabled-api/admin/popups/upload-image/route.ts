/**
 * @file app/api/admin/popups/upload-image/route.ts
 * @description 관리자 팝업 이미지 업로드 API
 *
 * POST /api/admin/popups/upload-image
 * Service Role 클라이언트를 사용하여 RLS를 우회하고 이미지 업로드
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

// 허용되는 이미지 MIME 타입
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/admin/popups/upload-image
 * 팝업 이미지 업로드
 */
export async function POST(request: NextRequest) {
  try {
    console.group("📤 [AdminPopups][UploadImage]");
    
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

    console.log("사용자 ID:", userId);

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("❌ 파일이 없음");
      console.groupEnd();
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    console.log("파일 정보:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // 파일 타입 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      console.error("❌ 지원하지 않는 파일 타입:", file.type);
      console.groupEnd();
      return NextResponse.json(
        { error: `지원하지 않는 이미지 형식입니다. (${file.type})` },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      console.error("❌ 파일 크기 초과:", file.size);
      console.groupEnd();
      return NextResponse.json(
        { error: `파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.` },
        { status: 400 }
      );
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log("업로드 경로:", filePath);

    // Service Role 클라이언트로 업로드 (RLS 우회)
    const supabase = getServiceRoleClient();

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("popup-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ 업로드 실패:", {
        message: error.message,
      });
      console.groupEnd();
      return NextResponse.json(
        { error: `이미지 업로드 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("popup-images").getPublicUrl(filePath);

    console.log("✅ 업로드 성공:", publicUrl);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      url: publicUrl,
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

