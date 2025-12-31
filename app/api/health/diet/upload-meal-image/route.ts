/**
 * @file app/api/health/diet/upload-meal-image/route.ts
 * @description 식사 사진 업로드 API (레거시 - 클라이언트 사이드로 전환됨)
 *
 * ⚠️ 이 API는 더 이상 사용되지 않습니다.
 * 식사 사진은 클라이언트에서 직접 IndexedDB에 저장됩니다.
 * 
 * 이 파일은 하위 호환성을 위해 유지되지만, 실제로는 사용되지 않습니다.
 * 대신 components/health/diet/meal-photo-upload.tsx를 사용하세요.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "이 API는 더 이상 사용되지 않습니다. 클라이언트에서 직접 IndexedDB에 저장하세요.",
      deprecated: true,
    },
    { status: 410 } // Gone
  );
}

