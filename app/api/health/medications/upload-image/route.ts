/**
 * @file app/api/health/medications/upload-image/route.ts
 * @description 약봉 사진 업로드 API
 *
 * 약물 영수증/처방전 사진을 업로드하고 Supabase Storage에 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const medicationId = formData.get("medicationId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 필요합니다" },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();
    
    // 사용자 ID 조회 (Clerk ID를 Supabase user_id로 변환)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다" },
        { status: 401 }
      );
    }

    const userId = userData.id;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일명 생성
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}.${fileExt}`;
    const filePath = `medication-images/${userId}/${medicationId || "new"}/${fileName}`;

    // Supabase Storage에 업로드
    const serviceSupabase = getServiceRoleClient();
    const { data, error } = await serviceSupabase.storage
      .from("uploads")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[MedicationImageUpload] 업로드 실패:", error);
      return NextResponse.json(
        { error: `이미지 업로드 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = serviceSupabase.storage.from("uploads").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("[MedicationImageUpload] 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}

