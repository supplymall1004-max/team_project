# KCDC 알림 동기화 Edge Function

## 개요

질병관리청(KCDC) 공개 API에서 독감, 예방접종, 질병 발생 정보를 가져와 Supabase 데이터베이스에 동기화하는 Edge Function입니다.

## 환경 변수

Edge Function 배포 시 다음 환경 변수를 설정해야 합니다:

- `REFRESH_API_URL`: Refresh API 엔드포인트 URL (예: `https://yourapp.com/api/health/kcdc/refresh`)
- `CRON_SECRET`: 크론 잡 인증을 위한 시크릿 키

## 크론 스케줄 설정

`supabase/config.toml` 파일에 다음과 같이 크론 스케줄을 설정합니다:

```toml
[functions.sync-kcdc-alerts]
verify_jwt = false

[functions.sync-kcdc-alerts.cron]
schedule = "0 5 * * *" # 매일 05:00 KST (UTC 20:00)
```

또는 Supabase Dashboard에서 Edge Function 설정 > Cron Jobs 섹션에서 스케줄을 설정할 수 있습니다.

## 로컬 테스트

```bash
# Edge Function 로컬 실행
supabase functions serve sync-kcdc-alerts --env-file ./supabase/.env.local

# 테스트 호출
curl -X POST http://localhost:54321/functions/v1/sync-kcdc-alerts
```

## 배포

```bash
# Edge Function 배포
supabase functions deploy sync-kcdc-alerts

# 환경 변수 설정
supabase secrets set REFRESH_API_URL=https://yourapp.com/api/health/kcdc/refresh
supabase secrets set CRON_SECRET=your-secret-key
```

## 모니터링

Edge Function 로그는 Supabase Dashboard의 Edge Functions > Logs 섹션에서 확인할 수 있습니다.

실패 시 Slack이나 다른 알림 채널로 알림을 보내도록 설정할 수 있습니다.
























