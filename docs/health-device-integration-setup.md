# 스마트 기기 연동 설정 가이드

## 개요

건강 관리 기능에서 Google Fit, Fitbit 등 스마트 기기와 연동하여 건강 데이터를 자동으로 가져올 수 있습니다.

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Google Fit 연동
GOOGLE_FIT_CLIENT_ID=your_google_fit_client_id_here
GOOGLE_FIT_CLIENT_SECRET=your_google_fit_client_secret_here
GOOGLE_FIT_REDIRECT_URI=http://localhost:3000/api/health/devices/google-fit/callback

# Fitbit 연동
FITBIT_CLIENT_ID=your_fitbit_client_id_here
FITBIT_CLIENT_SECRET=your_fitbit_client_secret_here
FITBIT_REDIRECT_URI=http://localhost:3000/api/health/devices/fitbit/callback
```

## Google Fit 연동 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "라이브러리"에서 "Fitness API" 활성화
4. "사용자 인증 정보" → "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI 추가:
   - 개발: `http://localhost:3000/api/health/devices/google-fit/callback`
   - 프로덕션: `https://your-domain.com/api/health/devices/google-fit/callback`
7. Client ID와 Client Secret 복사하여 환경 변수에 설정

### 2. 필요한 스코프

- `https://www.googleapis.com/auth/fitness.activity.read` - 활동량 데이터
- `https://www.googleapis.com/auth/fitness.heart_rate.read` - 심박수 데이터
- `https://www.googleapis.com/auth/fitness.body.read` - 체중 데이터

## Fitbit 연동 설정

### 1. Fitbit 개발자 계정 설정

1. [Fitbit 개발자 포털](https://dev.fitbit.com/) 접속
2. 계정 생성 및 로그인
3. "Register a New App" 클릭
4. 애플리케이션 정보 입력:
   - Application Name: 애플리케이션 이름
   - Description: 설명
   - Application Website: 웹사이트 URL
   - OAuth 2.0 Application Type: "Server"
   - Callback URL: 
     - 개발: `http://localhost:3000/api/health/devices/fitbit/callback`
     - 프로덕션: `https://your-domain.com/api/health/devices/fitbit/callback`
5. OAuth 2.0 Client ID와 Client Secret 복사하여 환경 변수에 설정

### 2. 필요한 스코프

- `activity` - 활동량 데이터
- `heartrate` - 심박수 데이터
- `sleep` - 수면 데이터
- `weight` - 체중 데이터

## Apple Health / Samsung Health 연동

파일 업로드 방식을 사용합니다. 별도의 API 키가 필요하지 않습니다.

### Apple Health 데이터 내보내기

1. iPhone의 건강 앱 열기
2. 프로필 탭 클릭
3. "데이터 내보내기" 선택
4. XML 또는 JSON 형식으로 내보내기
5. 웹사이트에서 파일 업로드

### Samsung Health 데이터 내보내기

1. Samsung Health 앱 열기
2. 설정 → 데이터 내보내기
3. CSV 또는 JSON 형식으로 내보내기
4. 웹사이트에서 파일 업로드

## 테스트

### 개발 환경 테스트

1. 환경 변수 설정 확인
2. 개발 서버 실행: `pnpm dev`
3. `/health/profile?tab=devices` 페이지 접속
4. 기기 연결 테스트
5. 데이터 동기화 테스트

### 프로덕션 배포 시 주의사항

1. 프로덕션 환경 변수 설정
2. OAuth 리디렉션 URI를 프로덕션 도메인으로 업데이트
3. HTTPS 사용 필수
4. 보안 정책 확인

## 문제 해결

### OAuth 인증 실패

- 리디렉션 URI가 정확히 일치하는지 확인
- Client ID와 Client Secret이 올바른지 확인
- 환경 변수가 제대로 로드되었는지 확인

### 데이터 동기화 실패

- 기기 연결 상태 확인
- API 스코프가 올바르게 설정되었는지 확인
- 토큰 만료 여부 확인 (자동 갱신됨)

### 파일 업로드 실패

- 파일 형식 확인 (CSV 또는 JSON)
- 파일 크기 확인 (너무 큰 파일은 제한될 수 있음)
- 파일 내용 형식 확인
