/**
 * @file lib/supabase/upload-image.ts
 * @description Supabase Storage에 이미지를 업로드하는 유틸리티 함수
 *
 * 주요 기능:
 * 1. 클라이언트 사이드에서 이미지 업로드
 * 2. 파일 크기 및 형식 검증
 * 3. 고유한 파일명 생성
 * 4. 공개 URL 반환
 */

import { supabase } from "@/lib/supabase/client";

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

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 팝업 이미지를 Supabase Storage에 업로드
 */
export async function uploadPopupImage(
  file: File,
  userId: string
): Promise<UploadImageResult> {
  try {
    console.group("[UploadImage]");
    console.log("file", file.name, file.type, file.size);
    console.log("userId", userId);

    // 1. 파일 타입 검증
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      console.error("invalid_file_type", file.type);
      console.groupEnd();
      return {
        success: false,
        error: `지원하지 않는 이미지 형식입니다. (${file.type})`,
      };
    }

    // 2. 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      console.error("file_too_large", file.size);
      console.groupEnd();
      return {
        success: false,
        error: `파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.`,
      };
    }

    // 3. 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log("uploading_to", filePath);

    // 4. Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from("popup-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("upload_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `이미지 업로드 실패: ${error.message}`,
      };
    }

    // 5. 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("popup-images").getPublicUrl(filePath);

    console.log("upload_success", publicUrl);
    console.groupEnd();

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("[UploadImage] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

/**
 * Storage에서 이미지 삭제
 */
export async function deletePopupImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.group("[DeleteImage]");
    console.log("imageUrl", imageUrl);

    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/popup-images/");
    if (pathParts.length < 2) {
      console.error("invalid_url", imageUrl);
      console.groupEnd();
      return {
        success: false,
        error: "잘못된 이미지 URL입니다.",
      };
    }

    const filePath = pathParts[1];
    console.log("deleting", filePath);

    // Supabase Storage에서 삭제
    const { error } = await supabase.storage
      .from("popup-images")
      .remove([filePath]);

    if (error) {
      console.error("delete_error", error);
      console.groupEnd();
      return {
        success: false,
        error: `이미지 삭제 실패: ${error.message}`,
      };
    }

    console.log("delete_success");
    console.groupEnd();

    return { success: true };
  } catch (error) {
    console.error("[DeleteImage] unexpected_error", error);
    console.groupEnd();

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다",
    };
  }
}

