# KCDC API 설정 가이드

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# KCDC (질병관리청) API
KCDC_API_KEY=c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca
```

## API 엔드포인트

공공데이터포털 (`apis.data.go.kr`)를 통해 다음 데이터를 가져옵니다:

### 1. 인플루엔자 유행 정보
- **엔드포인트**: `http://apis.data.go.kr/1790387/covid19/influenza`
- **데이터**: 독감 경보 단계, 유행 주차

### 2. 예방접종 정보
- **엔드포인트**: `http://apis.data.go.kr/1790387/nip/vaccInfo`
- **데이터**: 백신명, 대상 연령, 접종 일정

## 데이터 동기화

### 자동 동기화 (크론 잡)

```bash
# 1. Edge Function 배포
npx supabase functions deploy sync-kcdc-alerts

# 2. 환경 변수 설정
npx supabase secrets set KCDC_API_KEY=c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca
npx supabase secrets set REFRESH_API_URL=https://yourapp.com/api/health/kcdc/refresh
npx supabase secrets set CRON_SECRET=your-secret-key
```

### 수동 동기화

```bash
# API 호출 (로컬)
curl -X POST http://localhost:3000/api/health/kcdc/refresh \
  -H "Authorization: Bearer your-cron-secret"

# API 호출 (프로덕션)
curl -X POST https://yourapp.com/api/health/kcdc/refresh \
  -H "Authorization: Bearer your-cron-secret"
```

## API 응답 구조

### 독감 데이터

```json
{
  "response": {
    "body": {
      "items": {
        "level": "2",
        "flag": "주의",
        "description": "전국 독감 주의 단계",
        "createDt": "2025-11-27T09:00:00"
      }
    }
  }
}
```

### 예방접종 데이터

```json
{
  "response": {
    "body": {
      "items": [
        {
          "vaccNm": "MMR",
          "targetAge": "영유아",
          "inoculDt": "2025-12-01",
          "description": "생후 12개월 MMR 백신 1차 접종",
          "createDt": "2025-11-20T10:00:00"
        }
      ]
    }
  }
}
```

## 폴백 전략

API 호출 실패 시 자동으로 더미 데이터로 폴백됩니다:
- 독감: "주의" 단계 안내
- 예방접종: MMR, 독감 기본 안내

## 테스트

```bash
# 로컬 테스트
pnpm dev

# 알림 확인
# 브라우저에서 앱 접속 후 3초 대기
# KCDC 알림 팝업이 자동으로 표시됩니다
```

## 문제 해결

### API 키 오류
- `.env.local` 파일 확인
- 서버 재시작 (`pnpm dev`)

### API 응답 없음
- 공공데이터포털에서 API 키 활성화 확인
- 서비스 이용 신청 상태 확인
- 일일 호출 제한 확인

### 더미 데이터만 표시됨
- 콘솔 로그 확인 (`console.group: 🏥 KCDC 데이터 가져오기`)
- API 키가 올바른지 확인
- 네트워크 연결 확인




















