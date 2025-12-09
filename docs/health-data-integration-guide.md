# 건강정보 자동 연동 가이드

## 개요

맛의 아카이브 프로젝트의 건강정보 자동 연동 기능은 마이데이터 서비스와 건강정보고속도로 API를 통해 사용자의 건강정보(병원기록, 약물복용, 건강검진 등)를 자동으로 가져올 수 있도록 지원합니다.

## 지원하는 데이터 소스

### 1. 마이데이터 서비스
- **제공 기관**: 행정안전부
- **제공 데이터**: 진료기록, 건강검진 결과, 투약 정보, 예방접종 이력
- **연동 방식**: OAuth 2.0 인증

### 2. 건강정보고속도로
- **제공 기관**: 보건복지부
- **제공 데이터**: 진료기록, 건강검진 결과, 투약 정보, 예방접종 이력
- **연동 방식**: OAuth 2.0 인증

## 사전 준비 사항

### 1. 마이데이터 서비스 신청

1. [공공 마이데이터 유통 시스템](https://www.mydata.go.kr) 접속
2. 개발자 등록 및 애플리케이션 등록
3. 건강정보 API 사용 신청
4. Client ID 및 Client Secret 발급
5. Redirect URI 등록 (예: `https://your-domain.com/api/health/mydata/callback`)

### 2. 건강정보고속도로 API 신청

1. [건강정보고속도로](https://www.healthhighway.go.kr) 접속
2. 개발자 등록 및 애플리케이션 등록
3. 건강정보 API 사용 신청
4. API Key, Client ID 및 Client Secret 발급
5. Redirect URI 등록 (예: `https://your-domain.com/api/health/health-highway/callback`)

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# 마이데이터 서비스 설정
MYDATA_API_BASE_URL=https://api.mydata.go.kr
MYDATA_CLIENT_ID=your_mydata_client_id_here
MYDATA_CLIENT_SECRET=your_mydata_client_secret_here
MYDATA_REDIRECT_URI=https://your-domain.com/api/health/mydata/callback

# 건강정보고속도로 설정
HEALTH_HIGHWAY_API_BASE_URL=https://api.healthhighway.go.kr
HEALTH_HIGHWAY_API_KEY=your_health_highway_api_key_here
HEALTH_HIGHWAY_CLIENT_ID=your_health_highway_client_id_here
HEALTH_HIGHWAY_CLIENT_SECRET=your_health_highway_client_secret_here
HEALTH_HIGHWAY_REDIRECT_URI=https://your-domain.com/api/health/health-highway/callback
```

## 사용자 동의 플로우

### 1. 데이터 소스 연결 시작

사용자가 건강정보 자동 연동을 시작하려면:

1. 건강정보 설정 페이지 접속 (`/health/data-sources`)
2. 연결할 데이터 소스 선택 (마이데이터 또는 건강정보고속도로)
3. "연결하기" 버튼 클릭
4. 해당 서비스의 인증 페이지로 리다이렉트

### 2. 사용자 인증 및 동의

1. 사용자가 해당 서비스에 로그인
2. 건강정보 제공 동의서 확인
3. 제공할 건강정보 범위 선택:
   - 병원 방문 기록
   - 약물 복용 기록
   - 건강검진 결과
   - 예방접종 이력
4. 동의 완료

### 3. 인증 코드 처리

1. 인증 완료 후 Redirect URI로 인증 코드 전달
2. 서버에서 인증 코드를 액세스 토큰으로 교환
3. 액세스 토큰 및 리프레시 토큰을 데이터베이스에 저장 (암호화)
4. 데이터 소스 연결 상태를 "connected"로 업데이트

## 데이터 동기화

### 자동 동기화

- **주기**: 매일 새벽 2시 (크론 잡)
- **범위**: 연결된 모든 데이터 소스
- **방식**: 증분 동기화 (마지막 동기화 이후 변경된 데이터만)

### 수동 동기화

사용자가 수동으로 동기화를 실행할 수 있습니다:

1. 건강정보 설정 페이지 접속
2. "지금 동기화" 버튼 클릭
3. 동기화 진행 상태 확인
4. 동기화 완료 후 결과 확인

## 데이터 보안

### 암호화

- 액세스 토큰 및 리프레시 토큰은 암호화하여 저장
- 민감한 건강정보는 데이터베이스 레벨 암호화 (향후 구현)

### 접근 제어

- 모든 건강정보는 사용자 본인만 조회 가능
- RLS (Row Level Security) 정책 적용 (프로덕션 환경)
- API 인증 필수

### 개인정보 보호

- 사용자 동의 없이 데이터 수집 불가
- 데이터 소스 연결 해제 시 관련 데이터 삭제 옵션 제공
- 개인정보 처리 방침 준수

## 동기화 로그

모든 동기화 작업은 `health_data_sync_logs` 테이블에 기록됩니다:

- 동기화 시간
- 동기화 유형 (전체/증분/수동)
- 동기화 상태 (성공/실패/부분 성공)
- 동기화된 레코드 수
- 오류 메시지 (실패 시)

## 문제 해결

### 토큰 만료 오류

- 리프레시 토큰을 사용하여 자동으로 토큰 갱신
- 토큰 갱신 실패 시 사용자에게 재연결 요청

### 동기화 실패

1. 동기화 로그 확인 (`/health/sync/logs`)
2. 오류 메시지 확인
3. 데이터 소스 연결 상태 확인
4. 필요 시 데이터 소스 재연결

### 데이터 불일치

- 수동 입력 데이터와 자동 동기화 데이터 구분 표시
- 데이터 소스별 출처 표시
- 사용자가 직접 수정 가능

## API 참조

### 데이터 소스 연결

```typescript
import { generateConnectionUrl } from "@/lib/health/health-data-sync-service";

// 연결 URL 생성
const authUrl = await generateConnectionUrl(
  userId,
  "mydata", // 또는 "health_highway"
  redirectUri
);
```

### 데이터 동기화

```typescript
import { syncHealthData } from "@/lib/health/health-data-sync-service";

// 건강정보 동기화 실행
const result = await syncHealthData({
  userId: "user-id",
  syncType: "manual",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
});
```

## 참고 자료

- [공공 마이데이터 유통 시스템](https://www.mydata.go.kr)
- [건강정보고속도로](https://www.healthhighway.go.kr)
- [개인정보 보호법](https://www.law.go.kr)

