/**
 * @file supabase/functions/cache-cleanup/index.ts
 * @description 이미지 캐시 정리 Edge Function
 *
 * 매일 자정에 실행되어 30일 이상 접근하지 않은 이미지 캐시를 정리합니다.
 * Supabase Cron 또는 외부 크론 서비스에서 호출됩니다.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CleanupResult {
  success: boolean
  deletedCount: number
  duration: number
  error?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const startTime = Date.now()

  try {
    // 환경변수에서 Supabase 설정 가져오기
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Supabase 클라이언트 생성 (서비스 롤 키 사용)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[CacheCleanup] 캐시 정리 시작')

    // 캐시 정리 실행
    const { data: deletedCount, error: cleanupError } = await supabase.rpc('execute_cache_cleanup', {
      p_cleanup_type: 'scheduled',
      p_triggered_by: 'system'
    })

    if (cleanupError) {
      console.error('[CacheCleanup] 캐시 정리 실패:', cleanupError)
      throw cleanupError
    }

    const duration = Date.now() - startTime
    const result: CleanupResult = {
      success: true,
      deletedCount: deletedCount || 0,
      duration
    }

    console.log(`[CacheCleanup] 캐시 정리 완료: ${deletedCount}개 레코드 삭제 (${duration}ms)`)

    // 일별 성능 메트릭 업데이트
    try {
      await supabase.rpc('calculate_daily_image_metrics')
      console.log('[CacheCleanup] 일별 성능 메트릭 업데이트 완료')
    } catch (metricsError) {
      console.warn('[CacheCleanup] 성능 메트릭 업데이트 실패:', metricsError)
      // 메트릭 업데이트 실패는 치명적이지 않으므로 계속 진행
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('[CacheCleanup] 캐시 정리 중 오류 발생:', error)

    const result: CleanupResult = {
      success: false,
      deletedCount: 0,
      duration,
      error: errorMessage
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
