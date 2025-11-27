/**
 * @file image-monitoring.ts
 * @description 이미지 로딩 모니터링 및 로깅 유틸리티
 *
 * 주요 기능:
 * 1. 이미지 로딩 로그 기록
 * 2. 성능 메트릭 수집
 * 3. 에러 패턴 분석
 * 4. 캐시 효율성 모니터링
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ImageLoadLogData {
  recipeTitle: string;
  imageUrl: string;
  finalImageUrl?: string;
  imageSource: 'pixabay' | 'unsplash' | 'fallback' | 'local' | 'unknown' | 'google-photos';
  loadStartTime: Date;
  loadEndTime?: Date;
  success: boolean;
  errorMessage?: string;
  errorCode?: 'timeout' | 'network' | 'validation' | 'unknown' | 'cors';
  retryCount: number;
  cacheHit: boolean;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
}

export interface ImagePerformanceMetrics {
  date: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgLoadTimeMs: number;
  medianLoadTimeMs: number;
  p95LoadTimeMs: number;
  cacheHitRate: number;
  timeoutErrors: number;
  networkErrors: number;
  validationErrors: number;
}

/**
 * 이미지 로딩 로그를 데이터베이스에 기록
 */
export async function logImageLoading(
  supabase: SupabaseClient,
  logData: ImageLoadLogData
): Promise<void> {
  try {
    // 데이터베이스 연결 상태 확인
    if (!supabase) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ImageMonitoring] Supabase 클라이언트가 없어 로깅을 건너뜁니다');
      }
      return;
    }

    // 로딩 시간 계산
    const loadDurationMs = logData.loadEndTime
      ? Math.round((logData.loadEndTime.getTime() - logData.loadStartTime.getTime()))
      : null;

    // 세션 ID 생성 (브라우저에서 유지되는 고유 ID)
    const sessionId = logData.sessionId || generateSessionId();

    const { error } = await supabase.rpc('log_image_loading', {
      p_recipe_title: logData.recipeTitle,
      p_image_url: logData.imageUrl,
      p_final_image_url: logData.finalImageUrl,
      p_image_source: logData.imageSource,
      p_load_start_time: logData.loadStartTime.toISOString(),
      p_load_end_time: logData.loadEndTime?.toISOString(),
      p_success: logData.success,
      p_error_message: logData.errorMessage,
      p_error_code: logData.errorCode,
      p_retry_count: logData.retryCount,
      p_cache_hit: logData.cacheHit,
      p_user_agent: logData.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : null),
      p_user_id: logData.userId,
      p_session_id: sessionId
    });

    if (error) {
      // 데이터베이스 연결 문제나 함수 미존재 시 경고만 출력하고 계속 진행
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ImageMonitoring] 로그 기록 실패 (무시됨):', {
          message: error?.message || 'Unknown error',
          code: error?.code || 'Unknown code',
          recipeTitle: logData.recipeTitle,
          success: logData.success
        });
      }
      // 프로덕션에서는 조용히 무시 (나중에 데이터베이스 연결 복구 시 로깅 재개)
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ImageMonitoring] 로그 기록 성공: ${logData.recipeTitle}`);
      }
    }
  } catch (error) {
    // 예외 발생 시에도 애플리케이션 중단하지 않음
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ImageMonitoring] 로그 기록 중 예외 발생 (무시됨):', error);
    }
  }
}

/**
 * 일별 성능 메트릭 계산 및 업데이트
 */
export async function updateDailyMetrics(
  supabase: SupabaseClient,
  targetDate?: Date
): Promise<void> {
  try {
    const date = targetDate || new Date();

    const { error } = await supabase.rpc('calculate_daily_image_metrics', {
      target_date: date.toISOString().split('T')[0] // YYYY-MM-DD 형식
    });

    if (error) {
      console.error('[ImageMonitoring] 일별 메트릭 계산 실패:', error);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ImageMonitoring] 일별 메트릭 계산 완료: ${date.toISOString().split('T')[0]}`);
      }
    }
  } catch (error) {
    console.error('[ImageMonitoring] 일별 메트릭 계산 중 예외 발생:', error);
  }
}

/**
 * 이미지 성능 메트릭 조회
 */
export async function getImagePerformanceMetrics(
  supabase: SupabaseClient,
  startDate: Date,
  endDate: Date
): Promise<ImagePerformanceMetrics[]> {
  try {

    const { data, error } = await supabase
      .from('image_performance_metrics')
      .select(`
        date,
        total_requests as totalRequests,
        success_count as successCount,
        failure_count as failureCount,
        success_rate as successRate,
        avg_load_time_ms as avgLoadTimeMs,
        median_load_time_ms as medianLoadTimeMs,
        p95_load_time_ms as p95LoadTimeMs,
        cache_hit_rate as cacheHitRate,
        timeout_errors as timeoutErrors,
        network_errors as networkErrors,
        validation_errors as validationErrors
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      console.error('[ImageMonitoring] 성능 메트릭 조회 실패:', error);
      return [];
    }

    return (data || []) as unknown as ImagePerformanceMetrics[];
  } catch (error) {
    console.error('[ImageMonitoring] 성능 메트릭 조회 중 예외 발생:', error);
    return [];
  }
}

/**
 * 이미지 로딩 에러 패턴 분석
 */
export async function getErrorPatterns(
  supabase: SupabaseClient,
  days: number = 7
): Promise<{
  errorCode: string;
  count: number;
  percentage: number;
  avgLoadTime: number;
}[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('image_loading_logs')
      .select('error_code, load_duration_ms')
      .eq('success', false)
      .gte('created_at', startDate.toISOString())
      .not('error_code', 'is', null);

    if (error) {
      console.error('[ImageMonitoring] 에러 패턴 분석 실패:', error);
      return [];
    }

    // 에러 코드별로 그룹화 및 통계 계산
    const errorStats = new Map<string, { count: number; totalLoadTime: number }>();

    data?.forEach((log) => {
      if (log.error_code) {
        const existing = errorStats.get(log.error_code) || { count: 0, totalLoadTime: 0 };
        errorStats.set(log.error_code, {
          count: existing.count + 1,
          totalLoadTime: existing.totalLoadTime + (log.load_duration_ms || 0)
        });
      }
    });

    const totalErrors = Array.from(errorStats.values()).reduce((sum, stat) => sum + stat.count, 0);

    return Array.from(errorStats.entries()).map(([errorCode, stats]) => ({
      errorCode,
      count: stats.count,
      percentage: totalErrors > 0 ? (stats.count / totalErrors) * 100 : 0,
      avgLoadTime: stats.count > 0 ? stats.totalLoadTime / stats.count : 0
    })).sort((a, b) => b.count - a.count);

  } catch (error) {
    console.error('[ImageMonitoring] 에러 패턴 분석 중 예외 발생:', error);
    return [];
  }
}

/**
 * 캐시 효율성 분석
 */
export async function getCacheEfficiency(
  supabase: SupabaseClient,
  days: number = 7
): Promise<{
  cacheHitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('image_loading_logs')
      .select('cache_hit')
      .gte('created_at', startDate.toISOString());

    if (error) {
      console.error('[ImageMonitoring] 캐시 효율성 분석 실패:', error);
      return {
        cacheHitRate: 0,
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    }

    const totalRequests = data?.length || 0;
    const cacheHits = data?.filter(log => log.cache_hit).length || 0;
    const cacheMisses = totalRequests - cacheHits;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    return {
      cacheHitRate,
      totalRequests,
      cacheHits,
      cacheMisses
    };

  } catch (error) {
    console.error('[ImageMonitoring] 캐시 효율성 분석 중 예외 발생:', error);
    return {
      cacheHitRate: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

/**
 * 세션 ID 생성 (브라우저별 고유 식별자)
 */
function generateSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  // localStorage에서 세션 ID 조회 또는 생성
  let sessionId = localStorage.getItem('image_monitoring_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('image_monitoring_session_id', sessionId);
  }

  return sessionId;
}

/**
 * 캐시 정리 실행 (수동)
 */
export async function executeCacheCleanup(
  supabase: SupabaseClient,
  cleanupType: 'manual' | 'emergency' = 'manual',
  triggeredBy: string = 'admin'
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {

    const { data, error } = await supabase.rpc('execute_cache_cleanup', {
      p_cleanup_type: cleanupType,
      p_triggered_by: triggeredBy
    });

    if (error) {
      console.error('[ImageMonitoring] 캐시 정리 실패:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error.message
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[ImageMonitoring] 캐시 정리 완료: ${data}개 레코드 삭제`);
    }

    return {
      success: true,
      deletedCount: data || 0
    };

  } catch (error) {
    console.error('[ImageMonitoring] 캐시 정리 중 예외 발생:', error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
