# KCDC 알림 동기화 크론 잡 설정 가이드

## 개요

질병관리청(KCDC) 공개 API에서 독감, 예방접종 정보를 매일 자동으로 동기화하기 위한 크론 잡 설정 가이드입니다.

## 실행 스케줄

- **실행 시간**: 매일 05:00 KST (UTC 20:00)
- **실행 주기**: 매일 1회
- **크론 표현식**: `0 20 * * *` (UTC 기준)

## 설정 방법

### 방법 1: pg_cron 확장 사용 (권장)

#### 1. 마이그레이션 실행

```bash
# 마이그레이션 파일 실행
supabase migration up
```

또는 Supabase Dashboard에서 직접 SQL 실행:

```sql
-- supabase/migrations/20251201000000_setup_kcdc_cron_job.sql 파일 내용 실행
```

#### 2. 환경 변수 설정

Supabase Dashboard > Settings > Database > Custom Config에서 다음 설정 추가:

```sql
-- Refresh API URL 설정
ALTER DATABASE postgres SET app.settings.kcdc_refresh_url = 'https://yourapp.com';

-- Cron Secret 설정
ALTER DATABASE postgres SET app.settings.cron_secret = 'your-secret-key-here';
```

또는 Supabase CLI 사용:

```bash
# 프로젝트 연결
supabase link --project-ref your-project-ref

# 환경 변수 설정
supabase db execute "
  ALTER DATABASE postgres SET app.settings.kcdc_refresh_url = 'https://yourapp.com';
  ALTER DATABASE postgres SET app.settings.cron_secret = 'your-secret-key-here';
"
```

#### 3. 크론 잡 확인

Supabase Dashboard > Database > Extensions에서 `pg_cron` 확장이 활성화되어 있는지 확인합니다.

크론 잡 목록 확인:

```sql
SELECT * FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily';
```

### 방법 2: Supabase Dashboard에서 수동 설정

1. Supabase Dashboard 접속
2. Edge Functions > `sync-kcdc-alerts` 선택
3. Settings > Cron Jobs 섹션
4. "Add Cron Job" 클릭
5. 다음 설정 입력:
   - **Schedule**: `0 20 * * *` (매일 UTC 20:00)
   - **Timezone**: UTC
   - **Enabled**: ✅

### 방법 3: Vercel Cron 사용 (대안)

Next.js 앱이 Vercel에 배포된 경우, `vercel.json`에 크론 설정을 추가할 수 있습니다:

```json
{
  "crons": [
    {
      "path": "/api/health/kcdc/refresh",
      "schedule": "0 5 * * *"
    }
  ]
}
```

**주의**: 이 방법은 Edge Function을 직접 호출하지 않고 Next.js API Route를 호출합니다.

## 환경 변수

### 필수 환경 변수

- `KCDC_API_KEY`: 공공데이터포털 API 키
- `CRON_SECRET`: 크론 잡 인증을 위한 시크릿 키
- `REFRESH_API_URL`: Refresh API 엔드포인트 URL (Edge Function용)

### 설정 위치

#### Next.js 앱 (`.env.local`)

```bash
KCDC_API_KEY=your-api-key
CRON_SECRET=your-secret-key
```

#### Supabase Edge Function (Supabase Dashboard)

1. Edge Functions > `sync-kcdc-alerts` 선택
2. Settings > Secrets 섹션
3. 다음 시크릿 추가:
   - `REFRESH_API_URL`: `https://yourapp.com/api/health/kcdc/refresh`
   - `CRON_SECRET`: `your-secret-key`

## 크론 잡 관리

### 크론 잡 목록 확인

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  nodename,
  nodeport,
  database,
  username,
  command
FROM cron.job
WHERE jobname = 'sync-kcdc-alerts-daily';
```

### 크론 잡 실행 이력 확인

```sql
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily'
)
ORDER BY start_time DESC
LIMIT 10;
```

### 크론 잡 비활성화

```sql
-- 크론 잡 비활성화
UPDATE cron.job 
SET active = false 
WHERE jobname = 'sync-kcdc-alerts-daily';
```

### 크론 잡 활성화

```sql
-- 크론 잡 활성화
UPDATE cron.job 
SET active = true 
WHERE jobname = 'sync-kcdc-alerts-daily';
```

### 크론 잡 삭제

```sql
-- 크론 잡 삭제
SELECT cron.unschedule('sync-kcdc-alerts-daily');
```

## 수동 실행

크론 잡을 수동으로 실행하려면:

### 방법 1: API 직접 호출

```bash
curl -X POST https://yourapp.com/api/health/kcdc/refresh \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### 방법 2: Edge Function 직접 호출

```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-kcdc-alerts \
  -H "Authorization: Bearer your-anon-key"
```

## 문제 해결

### 크론 잡이 실행되지 않는 경우

1. **pg_cron 확장 확인**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **크론 잡 상태 확인**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily';
   ```

3. **실행 이력 확인**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily')
   ORDER BY start_time DESC LIMIT 5;
   ```

4. **환경 변수 확인**
   ```sql
   SHOW app.settings.kcdc_refresh_url;
   SHOW app.settings.cron_secret;
   ```

### 에러 메시지 확인

크론 잡 실행 실패 시 `cron.job_run_details` 테이블의 `return_message` 컬럼에서 에러 메시지를 확인할 수 있습니다.

## 모니터링

### Supabase Dashboard

1. Edge Functions > `sync-kcdc-alerts` > Logs
2. Database > Extensions > pg_cron > Job History

### 로그 확인

```sql
-- 최근 실행 이력
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-kcdc-alerts-daily')
ORDER BY start_time DESC
LIMIT 10;
```

## 참고 자료

- [Supabase pg_cron 문서](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [KCDC API 설정 가이드](./KCDC_API_SETUP.md)
- [Edge Function README](../supabase/functions/sync-kcdc-alerts/README.md)












