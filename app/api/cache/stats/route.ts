/**
 * @file app/api/cache/stats/route.ts
 * @description 캐시 통계 조회 API (관리자용)
 *
 * 캐시 효율성 모니터링을 위한 통계 정보를 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { foodImageService } from '@/lib/food-image-service';

export async function GET(request: NextRequest) {
  try {
    console.log('[CacheStats] 캐시 통계 조회 요청');

    // 캐시 통계 조회
    const stats = await foodImageService.getCacheStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CacheStats] 캐시 통계 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '캐시 통계 조회에 실패했습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'cleanup') {
      console.log('[CacheStats] 수동 캐시 정리 요청');

      const result = await foodImageService.scheduledCacheCleanup();

      return NextResponse.json({
        success: true,
        data: result,
        message: '캐시 정리가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: '지원하지 않는 액션입니다.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[CacheStats] 캐시 정리 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '캐시 정리 중 오류가 발생했습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
