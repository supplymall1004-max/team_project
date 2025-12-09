# 🔐 환경 변수 설정 가이드

맛의 아카이브 프로젝트를 시작하기 위해 필요한 환경 변수를 설정하는 방법을 안내합니다.

---

## 📋 필수 설정 항목

### 1. Supabase 설정 (최우선)

**Supabase는 데이터베이스, 인증, 파일 저장소를 모두 제공하는 백엔드 서비스입니다.**

#### 1.1. Supabase 프로젝트 생성

1. [Supabase 웹사이트](https://supabase.com)에 접속
2. 회원가입 또는 로그인
3. "New Project" 버튼 클릭
4. 프로젝트 정보 입력:
   - **Project Name**: `flavor-archive` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (반드시 기록해두세요!)
   - **Region**: 가장 가까운 지역 선택 (예: Northeast Asia (Seoul))
5. 프로젝트 생성 완료 대기 (약 2분)

#### 1.2. Supabase API 키 확인

1. 프로젝트 대시보드에서 **Settings** (⚙️ 아이콘) 클릭
2. **API** 메뉴 선택
3. 다음 정보를 복사:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co` 형식
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식 (⚠️ 절대 공개하지 마세요!)

#### 1.3. .env.local 파일에 입력

`.env.local.example` 파일을 복사하여 `.env.local` 파일을 만들고, 위에서 복사한 값을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2. Supabase Storage 버킷 생성

레시피 이미지와 영상을 저장하기 위한 저장소를 설정합니다.

1. Supabase 대시보드에서 **Storage** 메뉴 클릭
2. **Create a new bucket** 버튼 클릭
3. 다음 버킷들을 생성:
   - **버킷 이름**: `recipe-images`
     - **Public bucket**: ✅ 체크 (이미지 공개)
   - **버킷 이름**: `legacy-videos`
     - **Public bucket**: ✅ 체크 (영상 공개)
   - **버킷 이름**: `user-uploads`
     - **Public bucket**: ❌ 체크 해제 (사용자 업로드 파일은 비공개)

---

## 🔧 건강정보 자동 연동 설정 (선택)

건강정보 자동 연동 기능을 사용하려면 다음 설정이 필요합니다.

### 마이데이터 서비스 설정

1. [공공 마이데이터 유통 시스템](https://www.mydata.go.kr) 접속
2. 개발자 등록 및 애플리케이션 등록
3. 건강정보 API 사용 신청
4. Client ID 및 Client Secret 발급
5. `.env.local` 파일에 입력:

```env
MYDATA_API_BASE_URL=https://api.mydata.go.kr
MYDATA_CLIENT_ID=your_mydata_client_id_here
MYDATA_CLIENT_SECRET=your_mydata_client_secret_here
MYDATA_REDIRECT_URI=https://your-domain.com/api/health/mydata/callback
```

### 건강정보고속도로 설정

1. [건강정보고속도로](https://www.healthhighway.go.kr) 접속
2. 개발자 등록 및 애플리케이션 등록
3. 건강정보 API 사용 신청
4. API Key, Client ID 및 Client Secret 발급
5. `.env.local` 파일에 입력:

```env
HEALTH_HIGHWAY_API_BASE_URL=https://api.healthhighway.go.kr
HEALTH_HIGHWAY_API_KEY=your_health_highway_api_key_here
HEALTH_HIGHWAY_CLIENT_ID=your_health_highway_client_id_here
HEALTH_HIGHWAY_CLIENT_SECRET=your_health_highway_client_secret_here
HEALTH_HIGHWAY_REDIRECT_URI=https://your-domain.com/api/health/health-highway/callback
```

**자세한 설정 방법은 [health-data-integration-guide.md](./health-data-integration-guide.md) 문서를 참고하세요.**

---

## 🔧 선택적 설정 항목

### 3. 소셜 로그인 설정 (선택)

Google 또는 Kakao 로그인을 사용하려면 설정이 필요합니다.

#### 3.1. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** > **사용자 인증 정보** 이동
4. **OAuth 2.0 클라이언트 ID 만들기** 클릭
5. 애플리케이션 유형: **웹 애플리케이션**
6. 승인된 리디렉션 URI 추가:
   - `https://[프로젝트ID].supabase.co/auth/v1/callback`
7. Client ID와 Client Secret 복사
8. `.env.local` 파일에 입력:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```
9. Supabase 대시보드에서 **Authentication** > **Providers** > **Google** 활성화 및 키 입력

#### 3.2. Kakao OAuth 설정

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 등록
3. **카카오 로그인** 활성화
4. Redirect URI 등록:
   - `https://[프로젝트ID].supabase.co/auth/v1/callback`
5. REST API 키와 Client Secret 복사
6. `.env.local` 파일에 입력:
   ```env
   KAKAO_CLIENT_ID=your_kakao_client_id_here
   KAKAO_CLIENT_SECRET=your_kakao_client_secret_here
   ```
7. Supabase 대시보드에서 **Authentication** > **Providers** > **Kakao** 활성화 및 키 입력

---

### 4. 식자재 마켓플레이스 API 설정 (선택, C-5 기능)

식자재 구매 연동 기능을 사용하려면 외부 마켓플레이스 API가 필요합니다.

#### 4.1. 쿠팡 파트너스 API (예시)

1. [쿠팡 파트너스](https://partners.coupang.com) 접속
2. 회원가입 및 승인 대기
3. API 키 발급
4. `.env.local` 파일에 입력:
   ```env
   MARKETPLACE_API_KEY=your_coupang_api_key_here
   MARKETPLACE_API_SECRET=your_coupang_api_secret_here
   MARKETPLACE_API_URL=https://api-gateway.coupang.com
   ```

#### 4.2. 네이버 쇼핑 API (예시)

1. [네이버 개발자 센터](https://developers.naver.com) 접속
2. 애플리케이션 등록
3. 쇼핑 API 사용 신청
4. Client ID와 Client Secret 발급
5. `.env.local` 파일에 입력:
   ```env
   MARKETPLACE_API_KEY=your_naver_client_id_here
   MARKETPLACE_API_SECRET=your_naver_client_secret_here
   MARKETPLACE_API_URL=https://openapi.naver.com
   ```

---

### 5. 이메일 서비스 설정 (선택)

비밀번호 재설정, 알림 등에 사용됩니다.

#### 5.1. Resend (추천, 무료 플랜 제공)

1. [Resend](https://resend.com) 접속 및 회원가입
2. API Key 발급
3. `.env.local` 파일에 입력:
   ```env
   EMAIL_SERVICE_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```

#### 5.2. SendGrid (대안)

1. [SendGrid](https://sendgrid.com) 접속 및 회원가입
2. API Key 생성
3. `.env.local` 파일에 입력:
   ```env
   EMAIL_SERVICE_API_KEY=SG.xxxxxxxxxxxxx
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```

---

### 6. 보안 키 생성

건강 정보 암호화 및 세션 관리를 위한 키를 생성합니다.

#### 6.1. Node.js로 키 생성

터미널에서 다음 명령어 실행:

```bash
# 세션 암호화 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 건강 정보 암호화 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

생성된 키를 `.env.local` 파일에 입력:

```env
SESSION_SECRET=생성된_32바이트_16진수_문자열
HEALTH_DATA_ENCRYPTION_KEY=생성된_32바이트_16진수_문자열
```

---

### 7. 모니터링 도구 설정 (선택)

에러 추적을 위한 Sentry 설정:

1. [Sentry](https://sentry.io) 접속 및 회원가입
2. 프로젝트 생성 (Next.js 선택)
3. DSN (Data Source Name) 복사
4. `.env.local` 파일에 입력:
   ```env
   SENTRY_DSN=https://xxxxxxxxxxxxx@xxxxxxxxxxxxx.ingest.sentry.io/xxxxxxxxxxxxx
   ```

---

## ✅ 설정 완료 확인

모든 설정이 완료되었는지 확인하세요:

### 필수 항목 체크리스트

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정됨
- [ ] Supabase Storage 버킷 3개 생성됨 (recipe-images, legacy-videos, user-uploads)
- [ ] `SESSION_SECRET` 생성 및 설정됨
- [ ] `HEALTH_DATA_ENCRYPTION_KEY` 생성 및 설정됨

### 선택 항목 체크리스트

- [ ] 소셜 로그인 설정 (Google/Kakao)
- [ ] 식자재 마켓플레이스 API 설정
- [ ] 이메일 서비스 설정
- [ ] 모니터링 도구 설정 (Sentry)

---

## 🚨 주의사항

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요**
   - 이미 `.gitignore`에 포함되어 있어야 합니다
   - 실수로 커밋했다면 즉시 키를 재발급하세요

2. **프로덕션 환경에서는 환경 변수를 안전하게 관리하세요**
   - Vercel: 프로젝트 설정 > Environment Variables
   - AWS: Secrets Manager
   - 기타: 환경 변수 관리 서비스 사용

3. **`SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용**
   - 클라이언트 코드에 포함하지 마세요
   - 관리자 권한이 필요한 작업에만 사용

4. **건강 정보 암호화 키는 안전하게 보관**
   - 분실 시 복구 불가능
   - 프로덕션 환경에서는 별도 보관소에 백업

---

## 🆘 문제 해결

### Supabase 연결 실패

- URL과 키가 정확한지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 네트워크 연결 확인

### Storage 업로드 실패

- 버킷이 생성되었는지 확인
- 버킷 권한 설정 확인 (Public/Private)
- RLS 정책 확인

### 환경 변수가 읽히지 않음

- 파일 이름이 정확히 `.env.local`인지 확인 (앞에 점 포함)
- Next.js 서버 재시작
- 변수 이름이 `NEXT_PUBLIC_`로 시작하는지 확인 (클라이언트에서 사용 시)

---

**작성일**: 2025년 1월  
**버전**: V1.0  
**참고 문서**: [development-plan.md](./development-plan.md), [checklist.md](./checklist.md)

