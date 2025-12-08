-- KCDC 알림 동기화 크론 잡 설정
-- 작성일: 2025-12-01
-- 설명: 매일 05:00 KST에 KCDC 데이터를 자동으로 동기화하는 크론 잡 생성

-- =============================================
-- 1. pg_cron 확장 활성화
-- =============================================
-- 주의: Supabase에서는 pg_cron이 이미 활성화되어 있을 수 있습니다.
-- 이미 활성화되어 있으면 에러가 발생하지만 무시해도 됩니다.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================
-- 2. 기존 크론 잡 삭제 (있는 경우)
-- =============================================
-- 같은 이름의 크론 잡이 이미 있으면 삭제
DO $$
BEGIN
  -- 기존 크론 잡 삭제 시도
  PERFORM cron.unschedule('sync-kcdc-alerts-daily');
EXCEPTION
  WHEN OTHERS THEN
    -- 크론 잡이 없으면 무시
    NULL;
END $$;

-- =============================================
-- 3. KCDC 동기화 함수 생성
-- =============================================
-- Edge Function을 호출하는 PostgreSQL 함수
-- 주의: Supabase에서는 pg_net 확장이 필요할 수 있습니다.
-- pg_net이 없으면 Supabase Dashboard에서 수동 설정을 권장합니다.

-- pg_net 확장 확인 및 활성화 시도
DO $$
BEGIN
  -- pg_net 확장이 있으면 사용
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE '✅ pg_net 확장이 활성화되어 있습니다.';
  ELSE
    RAISE NOTICE '⚠️ pg_net 확장이 없습니다. Supabase Dashboard에서 수동 설정을 권장합니다.';
  END IF;
END $$;

-- KCDC 동기화 함수 생성 (pg_net 사용)
CREATE OR REPLACE FUNCTION sync_kcdc_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  refresh_url TEXT;
  cron_secret TEXT;
  response_status INTEGER;
BEGIN
  -- 환경 변수에서 URL과 Secret 가져오기
  refresh_url := current_setting('app.settings.kcdc_refresh_url', true);
  cron_secret := current_setting('app.settings.cron_secret', true);
  
  IF refresh_url IS NULL OR cron_secret IS NULL THEN
    RAISE EXCEPTION '환경 변수가 설정되지 않았습니다. app.settings.kcdc_refresh_url과 app.settings.cron_secret을 설정하세요.';
  END IF;
  
  -- HTTP 요청 (pg_net 사용)
  -- 주의: pg_net이 없으면 이 부분은 실행되지 않습니다.
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    SELECT status INTO response_status
    FROM net.http_post(
      url := refresh_url || '/api/health/kcdc/refresh',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || cron_secret
      ),
      body := '{}'::jsonb
    );
    
    RAISE NOTICE 'KCDC 동기화 요청 전송 완료. 응답 상태: %', response_status;
  ELSE
    RAISE WARNING 'pg_net 확장이 없어 HTTP 요청을 보낼 수 없습니다.';
  END IF;
END;
$$;

-- =============================================
-- 4. 크론 잡 생성 (pg_net이 있는 경우)
-- =============================================
-- pg_net 확장이 있는 경우에만 크론 잡 생성
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    -- 기존 크론 잡이 있으면 삭제
    PERFORM cron.unschedule('sync-kcdc-alerts-daily')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily');
    
    -- 새 크론 잡 생성
    PERFORM cron.schedule(
      'sync-kcdc-alerts-daily',
      '0 20 * * *',  -- 매일 UTC 20:00 (KST 05:00)
      'SELECT sync_kcdc_alerts();'
    );
    
    RAISE NOTICE '✅ 크론 잡이 성공적으로 생성되었습니다.';
  ELSE
    RAISE NOTICE '⚠️ pg_net 확장이 없어 크론 잡을 생성하지 않았습니다.';
    RAISE NOTICE '   Supabase Dashboard에서 Edge Function 크론 스케줄을 수동으로 설정하세요.';
  END IF;
END $$;

-- =============================================
-- 5. 크론 잡 설정 확인
-- =============================================
-- 크론 잡이 제대로 등록되었는지 확인
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'sync-kcdc-alerts-daily';
  
  IF job_count > 0 THEN
    RAISE NOTICE '✅ KCDC 동기화 크론 잡이 성공적으로 등록되었습니다.';
    RAISE NOTICE '   - 크론 잡 이름: sync-kcdc-alerts-daily';
    RAISE NOTICE '   - 실행 스케줄: 매일 05:00 KST (UTC 20:00)';
  ELSE
    RAISE WARNING '⚠️ 크론 잡 등록에 실패했습니다.';
  END IF;
END $$;

-- =============================================
-- 6. 환경 변수 설정 안내
-- =============================================
-- 주의: 다음 설정은 Supabase Dashboard에서 수동으로 설정해야 합니다.
-- 또는 Supabase CLI를 사용하여 설정할 수 있습니다:
--
-- ALTER DATABASE postgres SET app.settings.kcdc_refresh_url = 'https://yourapp.com';
-- ALTER DATABASE postgres SET app.settings.cron_secret = 'your-secret-key';
--
-- 또는 Supabase Dashboard > Settings > Database > Custom Config에서 설정

-- =============================================
-- 7. 크론 잡 관리 함수
-- =============================================

-- 크론 잡 상태 확인 함수
CREATE OR REPLACE FUNCTION check_kcdc_cron_status()
RETURNS TABLE(
  job_exists BOOLEAN,
  job_active BOOLEAN,
  schedule TEXT,
  last_run_time TIMESTAMPTZ,
  last_run_status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS(SELECT 1 FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily') AS job_exists,
    COALESCE((SELECT active FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily'), false) AS job_active,
    COALESCE((SELECT schedule::TEXT FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily'), 'N/A') AS schedule,
    (SELECT MAX(start_time) FROM cron.job_run_details 
     WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily')) AS last_run_time,
    (SELECT status FROM cron.job_run_details 
     WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily')
     ORDER BY start_time DESC LIMIT 1) AS last_run_status;
END;
$$;

COMMENT ON FUNCTION check_kcdc_cron_status() IS 'KCDC 동기화 크론 잡 상태를 확인하는 함수';

COMMENT ON EXTENSION pg_cron IS 'KCDC 알림 동기화 크론 잡을 위한 확장';

