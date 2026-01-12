/**
 * @file app/api/upload/home-background/route.ts
 * @description 홈페이지 배경 이미지 업로드 API
 *
 * 주요 기능:
 * 1. 사용자가 업로드한 이미지를 Supabase Storage에 저장
 * 2. 공개 URL 반환
 * 3. 파일 크기 및 타입 검증
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureSupabaseUser } from "@/lib/supabase/ensure-user";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    console.group("[API] POST /api/upload/home-background");
  }

  try {
    // 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ 인증 실패");
      }
      if (process.env.NODE_ENV === "development") {
        console.groupEnd();
      }
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    // Supabase 사용자 확인
    const supabaseUser = await ensureSupabaseUser();
    if (!supabaseUser) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ 사용자 조회 실패");
      }
      if (process.env.NODE_ENV === "development") {
        console.groupEnd();
      }
      return NextResponse.json(
        {
          error: "User not found",
          message: "사용자 정보를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ 파일 없음");
      }
      if (process.env.NODE_ENV === "development") {
        console.groupEnd();
      }
      return NextResponse.json(
        {
          error: "No file",
          message: "파일이 제공되지 않았습니다.",
        },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ 파일 크기 초과:", file.size);
      }
      if (process.env.NODE_ENV === "development") {
        console.groupEnd();
      }
      return NextResponse.json(
        {
          error: "File too large",
          message: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다.`,
        },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ 잘못된 파일 타입:", file.type);
      }
      if (process.env.NODE_ENV === "development") {
        console.groupEnd();
      }
      return NextResponse.json(
        {
          error: "Invalid file type",
          message: "지원되는 형식: JPG, PNG, WebP",
        },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log("✅ 파일 검증 통과:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    // Supabase Storage에 업로드
    const supabase = getServiceRoleClient();
    const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";

    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `home-background-${Date.now()}.${fileExt}`;
    const storagePath = `${supabaseUser.id}/home-background/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (process.env.NODE_ENV === "development") {
      console.log("📤 Storage 업로드 시작:", storagePath);
    }

    // 업로드 실행
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ 업로드 실패:", uploadError);
      }
      if (process.env.NODE_ENV === "development") {
        console.groupEnd();
      }
      return NextResponse.json(
        {
          error: "Upload failed",
          message: uploadError.message,
        },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

    if (process.env.NODE_ENV === "development") {
      console.log("✅ 업로드 성공:", publicUrl);
      if (process.env.NODE_ENV === "development") {
        console.groupEnd();
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ 서버 오류:", error);
      console.groupEnd();
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

