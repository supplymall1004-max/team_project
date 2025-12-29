/**
 * @file lib/mfds/recipe-image-utils.ts
 * @description 식약처 레시피 이미지 URL 유틸리티
 *
 * 주요 기능:
 * 1. 로컬 파일만 사용 (외부 URL 사용 안 함)
 * 2. 로컬 이미지 파일을 API 경로로 변환
 */

/**
 * 이미지 URL 생성 (로컬 파일만 사용)
 */
export function getRecipeImageUrl(
  originalUrl: string | null,
  localPath: string | null,
  rcpSeq: string,
  imageType: "main" | "mk" | "manual",
  stepNumber?: number
): string | null {
  // 로컬 경로가 있으면 API 경로로 변환
  if (localPath && localPath.trim()) {
    // 이미 /api/로 시작하는 경로면 그대로 사용
    if (localPath.startsWith("/api/")) {
      return localPath;
    }

    // /images/로 시작하는 경로면 파일명만 추출
    const filename = localPath.replace(/^\/images\//, "");
    return `/api/mfds-recipes/images/${filename}`;
  }

  // 로컬 경로가 없으면 기본 패턴으로 생성
  if (imageType === "main") {
    return `/api/mfds-recipes/images/${rcpSeq}_main.jpg`;
  }

  if (imageType === "mk") {
    return `/api/mfds-recipes/images/${rcpSeq}_mk.jpg`;
  }

  if (imageType === "manual" && stepNumber) {
    const stepNum = stepNumber.toString().padStart(2, "0");
    return `/api/mfds-recipes/images/${rcpSeq}_manual_${stepNum}.jpg`;
  }

  return null;
}

/**
 * 대표 이미지 URL 가져오기 (로컬 파일만 사용)
 */
export function getMainImageUrl(
  originalUrl: string | null,
  localPath: string | null,
  rcpSeq: string
): string | null {
  return getRecipeImageUrl(null, localPath, rcpSeq, "main");
}

/**
 * 만드는 법 이미지 URL 가져오기 (로컬 파일만 사용)
 */
export function getMkImageUrl(
  originalUrl: string | null,
  localPath: string | null,
  rcpSeq: string
): string | null {
  return getRecipeImageUrl(null, localPath, rcpSeq, "mk");
}

/**
 * 조리 단계 이미지 URL 가져오기 (로컬 파일만 사용)
 */
export function getManualImageUrl(
  originalUrl: string | null,
  localPath: string | null,
  rcpSeq: string,
  stepNumber: number
): string | null {
  return getRecipeImageUrl(
    null,
    localPath,
    rcpSeq,
    "manual",
    stepNumber
  );
}

