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

// 클라이언트 사이드 Supabase 클라이언트는 더 이상 사용하지 않음
// 서버 사이드 API를 통해 업로드/삭제 처리

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
 * 서버 사이드 API를 통해 Service Role 클라이언트로 업로드 (RLS 우회)
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

    console.log("서버 API로 업로드 시작");

    // 3. 서버 사이드 API를 통해 업로드 (Service Role 클라이언트 사용)
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/popups/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `업로드 실패 (${response.status})`;
      console.error("upload_error", errorMessage);
      console.groupEnd();
      return {
        success: false,
        error: `이미지 업로드 실패: ${errorMessage}`,
      };
    }

    const result = await response.json();

    if (!result.success || !result.url) {
      console.error("upload_error", result.error || "알 수 없는 오류");
      console.groupEnd();
      return {
        success: false,
        error: result.error || "이미지 업로드 실패",
      };
    }

    console.log("upload_success", result.url);
    console.groupEnd();

    return {
      success: true,
      url: result.url,
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
 * 서버 사이드 API를 통해 Service Role 클라이언트로 삭제 (RLS 우회)
 */
export async function deletePopupImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.group("[DeleteImage]");
    console.log("imageUrl", imageUrl);

    // 서버 사이드 API를 통해 삭제
    const response = await fetch("/api/admin/popups/delete-image", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `삭제 실패 (${response.status})`;
      console.error("delete_error", errorMessage);
      console.groupEnd();
      return {
        success: false,
        error: `이미지 삭제 실패: ${errorMessage}`,
      };
    }

    const result = await response.json();

    if (!result.success) {
      console.error("delete_error", result.error || "알 수 없는 오류");
      console.groupEnd();
      return {
        success: false,
        error: result.error || "이미지 삭제 실패",
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

