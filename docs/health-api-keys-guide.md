# 건강 관련 API 키 설정 가이드

이 문서는 새로 구현된 건강 관리 기능에서 사용하는 API 키 설정 방법을 안내합니다.

## 필수 API 키 (없어도 기본 기능 사용 가능)

현재 구현된 기능들은 대부분 **로컬 데이터베이스**를 사용하므로, API 키 없이도 기본 기능을 사용할 수 있습니다.

### 1. 식약처 의약품 안전나라 API (선택)

**사용 기능**: 약물 정보 조회, 약물 상호작용 데이터 보완

**필요 시점**: 
- 약물 정보를 자동으로 조회하고 싶을 때
- 식약처 공식 데이터로 약물 상호작용 정보를 보완하고 싶을 때

**발급 방법**:
1. [공공데이터포털(data.go.kr)](https://www.data.go.kr) 접속
2. 회원가입 및 로그인
3. 다음 중 하나로 검색:
   - **"의약품안전나라"** (가장 간단)
   - **"의약품"** + **"식약처"**
   - **"1471000"** (서비스 ID로 검색)
   - **"MdcinGrnIdntfcInfoService"** (서비스명으로 검색)
4. 검색 결과에서 **"의약품안전나라서비스01"** 또는 **"의약품안전나라서비스"** 선택
5. "활용신청" 클릭하여 API 키 발급
6. 발급받은 서비스 키를 환경 변수에 추가

**참고**: 
- 공공데이터포털에서 정확한 서비스명은 **"의약품안전나라서비스01"** 또는 **"의약품안전나라서비스"**입니다
- 서비스 ID: **1471000**
- 제공기관: **식품의약품안전처**

**환경 변수 설정**:
```env
# .env.local 파일에 추가
MFDS_API_KEY=your-api-key-from-data-go-kr
```

**참고**: 
- API 키가 없어도 약물 상호작용 체크 기능은 작동합니다 (로컬 데이터베이스 사용)
- API 키가 있으면 더 정확한 약물 정보를 조회할 수 있습니다

---

## 기존 건강 API 키 (이미 설정되어 있을 수 있음)

### 2. 건강정보고속도로 API (선택)

**사용 기능**: 건강검진 결과, 병원 기록 자동 연동

**환경 변수**:
```env
HEALTH_HIGHWAY_API_BASE_URL=https://api.healthhighway.go.kr
HEALTH_HIGHWAY_API_KEY=your-api-key-here
HEALTH_HIGHWAY_CLIENT_ID=your-client-id-here
HEALTH_HIGHWAY_CLIENT_SECRET=your-client-secret-here
HEALTH_HIGHWAY_REDIRECT_URI=https://your-domain.com/api/health/health-highway/callback
```

### 3. 마이데이터 API (선택)

**사용 기능**: 건강정보 자동 연동

**환경 변수**:
```env
MYDATA_API_BASE_URL=https://api.mydata.go.kr
MYDATA_CLIENT_ID=your-client-id-here
MYDATA_CLIENT_SECRET=your-client-secret-here
MYDATA_REDIRECT_URI=https://your-domain.com/api/health/mydata/callback
```

---

## API 키 없이 사용 가능한 기능

다음 기능들은 **API 키 없이도 완전히 작동**합니다:

✅ **통합 건강 대시보드**
- 건강 점수 계산
- 가족 구성원별 건강 현황
- 건강 알림 통합 표시

✅ **가족 건강 관리**
- 가족 구성원별 건강 상세 페이지
- 가족 건강 비교 분석

✅ **약물 상호작용 체크**
- 로컬 데이터베이스의 약물 상호작용 정보 사용
- 약물 추가 시 자동 검사

✅ **약물 복용 알림 시스템**
- 스마트 알림 스케줄링
- 복용 확인 시스템

---

## API 키 설정 우선순위

### 즉시 설정 필요 없음
현재 구현된 모든 기능은 API 키 없이도 작동합니다. 다음 상황에서만 설정하면 됩니다:

1. **식약처 API**: 약물 정보를 자동으로 조회하고 싶을 때
2. **건강정보고속도로 API**: 건강검진 결과를 자동으로 가져오고 싶을 때
3. **마이데이터 API**: 건강정보를 자동으로 연동하고 싶을 때

### 설정 방법 요약

1. `.env.local` 파일 생성 (프로젝트 루트)
2. 필요한 API 키만 추가
3. Next.js 서버 재시작

```env
# 예시: 식약처 API만 사용하는 경우
MFDS_API_KEY=your-api-key-here
```

---

## 문제 해결

### API 키가 없어도 오류가 발생하나요?

**아니요!** API 키가 없어도 다음처럼 안전하게 처리됩니다:

- 식약처 API: API 키가 없으면 약물 정보 조회 기능만 비활성화됩니다
- 건강정보고속도로/마이데이터: 수동 입력으로 대체 가능합니다

### API 키를 나중에 추가할 수 있나요?

**네!** 언제든지 `.env.local` 파일에 API 키를 추가하고 서버를 재시작하면 됩니다.

---

**작성일**: 2025년 12월 10일  
**버전**: V1.0

