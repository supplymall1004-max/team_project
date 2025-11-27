/**
 * @file app/api/cron/cleanup-cache/route.ts
 * @description 캐시 정리 Cron Job
 *
 * 매일 자정에 자동으로 캐시를 정리합니다.
 * - 30일 이상 미접근 이미지 삭제
 * - LRU 기반 캐시 크기 제한 적용
 */

import { NextRequest, NextResponse } from 'next/server';
import { foodImageService } from '@/lib/food-image-service';

export async function GET(request: NextRequest) {
  try {
    console.log('[CacheCleanup] 자동 캐시 정리 시작');

    // 요청이 Supabase Cron에서 왔는지 검증
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SUPABASE_CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.warn('[CacheCleanup] 권한 없는 요청 거부');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 캐시 정리 실행
    const result = await foodImageService.scheduledCacheCleanup();

    console.log('[CacheCleanup] 자동 캐시 정리 완료:', result);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CacheCleanup] 캐시 정리 중 오류:', error);

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
