# 식약처 API 연결 테스트 방법

## 현재 설정 확인

### ✅ 환경 변수
- **변수명**: `FOOD_SAFETY_RECIPE_API_KEY`
- **값**: `4e7ac25e7b614d039a99` (설정됨)
- **파일**: `.env.local`

### ✅ 개선 사항
1. **타임아웃 증가**: 30초 → 60초
2. **재시도 로직 개선**: 더 많은 에러 타입에 대해 재시도
3. **에러 처리 개선**: AbortError, network 에러 등 처리

## 테스트 방법

### 방법 1: API 테스트 엔드포인트 사용 (권장)

브라우저에서 다음 URL로 접속:

```
http://localhost:3000/api/test/foodsafety
```

**예상 결과:**
- ✅ 성공: API 키가 유효하고 연결이 정상
- ❌ 실패: 에러 메시지 확인 필요

### 방법 2: 데이터 수집 스크립트 실행

```bash
pnpm tsx scripts/collect-mfds-recipes.ts
```

**예상 결과:**
- ✅ 성공: 레시피 파일이 `docs/mfds-recipes/recipes/`에 생성됨
- ❌ 실패: 에러 메시지 확인 필요

### 방법 3: 직접 API 호출 테스트

터미널에서:

```bash
# PowerShell
$apiKey = "4e7ac25e7b614d039a99"
$url = "http://openapi.foodsafetykorea.go.kr/api/$apiKey/COOKRCP01/json/1/5"
Invoke-WebRequest -Uri $url -Method GET
```

## 문제 해결 체크리스트

### 1. API 키 확인
- [ ] API 키가 `.env.local` 파일에 설정되어 있는가?
- [ ] API 키 앞뒤에 따옴표가 없는가?
- [ ] API 키가 공공데이터포털에서 발급받은 유효한 키인가?

### 2. 네트워크 확인
- [ ] 인터넷 연결이 정상인가?
- [ ] 방화벽이나 프록시가 API 호출을 차단하지 않는가?
- [ ] VPN을 사용 중인가? (일부 VPN은 공공 API 접근을 차단할 수 있음)

### 3. API 서비스 상태
- [ ] 공공데이터포털에서 서비스 상태 확인
- [ ] API 키 사용 승인이 완료되었는가?

## 필요한 정보

API 연결 문제를 해결하기 위해 다음 정보를 알려주세요:

1. **API 테스트 결과**
   - `http://localhost:3000/api/test/foodsafety` 접속 결과
   - 성공/실패 여부
   - 에러 메시지 (있는 경우)

2. **네트워크 환경**
   - 회사 네트워크/집 네트워크
   - VPN 사용 여부
   - 방화벽 설정

3. **에러 메시지**
   - 브라우저 콘솔 에러
   - 서버 로그 에러
   - 정확한 에러 메시지

## 다음 단계

1. **API 테스트 실행**: `http://localhost:3000/api/test/foodsafety`
2. **결과 확인**: 성공/실패 여부 확인
3. **에러 분석**: 실패 시 에러 메시지 분석
4. **추가 조치**: 필요시 추가 설정 조정

