/**
 * @file app/api/admin/generate-recipe-metadata/route.ts
 * @description 레시피 메타데이터 자동 생성 API (관리자용)
 *
 * 주요 기능:
 * 1. 모든 레시피에 메타데이터 자동 생성
 * 2. 배치 처리로 성능 최적화
 *
 * @dependencies
 * - lib/recipes/metadata-generator.ts: generateMetadataForAllRecipes
 */

import { NextRequest, NextResponse } from "next/server";
import { generateMetadataForAllRecipes } from "@/lib/recipes/metadata-generator";

/**
 * 레시피 메타데이터 자동 생성
 * 
 * POST /api/admin/generate-recipe-metadata
 * 
 * 쿼리 파라미터:
 * - batchSize: number (기본값: 50)
 */
export async function POST(request: NextRequest) {
  console.group("📝 레시피 메타데이터 자동 생성 API");

  try {
    // 인증 확인 (관리자 권한 필요)
    // TODO: 실제 관리자 권한 체크 구현

    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 50;

    console.log(`배치 크기: ${batchSize}`);

    // 메타데이터 생성 실행
    const result = await generateMetadataForAllRecipes(batchSize);

    console.log("✅ 메타데이터 생성 완료:", {
      totalProcessed: result.totalProcessed,
      totalUpdated: result.totalUpdated,
      errors: result.errors.length,
    });

    console.groupEnd();

    return NextResponse.json({
      success: true,
      result: {
        totalProcessed: result.totalProcessed,
        totalUpdated: result.totalUpdated,
        errors: result.errors,
      },
      message: `메타데이터 생성 완료: ${result.totalUpdated}/${result.totalProcessed}개 업데이트`,
    });
  } catch (error) {
    console.error("❌ 메타데이터 생성 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

