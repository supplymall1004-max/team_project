# Google OTP 2단계 인증 (2FA) 설정 가이드

이 가이드는 Google Authenticator를 사용한 2단계 인증(2FA/MFA)을 설정하는 방법을 설명합니다.

## 📱 준비물

### 1. 인증 앱 설치
스마트폰에 다음 앱 중 하나를 설치하세요:

- **Google Authenticator** (권장)
  - [Android](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
  - [iOS](https://apps.apple.com/app/google-authenticator/id388497605)

- **Microsoft Authenticator**
  - [Android](https://play.google.com/store/apps/details?id=com.azure.authenticator)
  - [iOS](https://apps.apple.com/app/microsoft-authenticator/id983156458)

- **Authy**
  - [Android](https://play.google.com/store/apps/details?id=com.authy.authy)
  - [iOS](https://apps.apple.com/app/authy/id494168017)

## 🚀 2FA 활성화 방법

### 1단계: 데이터베이스 마이그레이션 실행

Supabase SQL Editor에서 다음 마이그레이션을 실행하세요:

```bash
supabase/migrations/20251128000000_add_mfa_to_users.sql
```

또는 Supabase Dashboard → SQL Editor → New Query에서:

```sql
-- users 테이블에 MFA 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled
ON users(mfa_enabled)
WHERE mfa_enabled = true;

-- 스키마 reload
NOTIFY pgrst, 'reload schema';
```

### 2단계: 관리자 페이지에서 2FA 활성화

1. **관리자 페이지 접속**
   - `http://localhost:3001/admin/security` 이동

2. **"2FA 활성화" 버튼 클릭**
   - "보안 설정" 탭의 "2단계 인증 (2FA)" 섹션에서 버튼 클릭

3. **QR 코드 스캔**
   - 다이얼로그에 QR 코드가 표시됨
   - Google Authenticator 앱 열기
   - "+" 버튼 → "QR 코드 스캔" 선택
   - 화면의 QR 코드를 스캔

4. **인증 코드 입력**
   - 앱에 표시된 6자리 숫자 입력
   - "인증 코드 확인" 버튼 클릭

5. **복구 코드 저장**
   - 표시된 10개의 복구 코드를 안전한 곳에 보관
   - "복사" 버튼으로 클립보드에 복사 가능
   - ⚠️ **매우 중요**: 이 코드들은 인증 앱 분실 시 계정 복구에 필요합니다

## 🔑 인증 코드 사용 방법

### OTP 코드란?
- **6자리 숫자**: 예) `123456`
- **30초마다 변경**: 시간 기반 (Time-based OTP)
- **앱에서 자동 생성**: 별도로 받을 필요 없음

### 로그인 시 OTP 입력
1. 일반적인 방법으로 로그인 (이메일/비밀번호)
2. 2FA가 활성화된 경우 → OTP 코드 입력 화면 표시
3. Google Authenticator 앱 열기
4. "Team Project" 계정의 6자리 코드 확인
5. 코드 입력 (30초 내에 입력)

### 복구 코드 사용
- 인증 앱 분실 시 복구 코드 입력
- 복구 코드는 **1회용**입니다
- 사용된 코드는 자동으로 삭제됨

## 📋 주요 기능

### 구현된 기능
✅ QR 코드 생성  
✅ TOTP 기반 OTP 생성/검증  
✅ 복구 코드 10개 생성  
✅ MFA 활성화/비활성화  
✅ 로그인 시 OTP 검증  
✅ 복구 코드로 로그인  

### Server Actions
- `setupMFA()`: MFA 설정 시작 (QR 코드 생성)
- `verifyAndEnableMFA(token)`: OTP 검증 및 활성화
- `disableMFA()`: MFA 비활성화
- `getMFAStatus()`: MFA 상태 조회
- `verifyLoginOTP(clerkUserId, token)`: 로그인 시 OTP 검증
- `checkMFARequired(clerkUserId)`: MFA 필요 여부 확인

## 🔧 문제 해결

### QR 코드를 스캔할 수 없는 경우
1. 다이얼로그의 "비밀 키" 섹션 확인
2. Google Authenticator 앱에서 "+" → "수동 입력" 선택
3. 계정 이름: `Team Project (이메일)`
4. 비밀 키: 표시된 키 입력 (예: `JBSWY3DPEHPK3PXP`)
5. 시간 기반: ON

### 인증 코드가 계속 틀린 경우
- 스마트폰 시간이 자동 동기화되어 있는지 확인
- 설정 → 날짜 및 시간 → 자동 설정 ON
- 시간 차이가 1분 이상 나면 인증 실패 가능

### 인증 앱을 분실한 경우
- 복구 코드 사용
- 복구 코드도 없는 경우 → 관리자에게 문의

## 🔐 보안 권장사항

1. **복구 코드 보관**
   - 안전한 비밀번호 관리자에 저장
   - 종이에 인쇄하여 안전한 곳에 보관
   - 절대 온라인에 공개하지 않기

2. **정기적인 확인**
   - 인증 앱이 정상 작동하는지 주기적으로 확인
   - 새 기기로 변경 시 미리 재설정

3. **백업**
   - Google Authenticator 앱 백업 기능 사용
   - 또는 Authy 같은 클라우드 동기화 지원 앱 사용

## 📁 관련 파일

- `actions/admin/security/mfa.ts`: MFA Server Actions
- `actions/auth/verify-otp-login.ts`: 로그인 OTP 검증
- `components/admin/security/mfa-setup-panel.tsx`: MFA UI 컴포넌트
- `supabase/migrations/20251128000000_add_mfa_to_users.sql`: 데이터베이스 마이그레이션

## 🎯 다음 단계

로그인 페이지에서 MFA 검증을 통합하려면:

1. Clerk 로그인 후 `checkMFARequired(userId)` 호출
2. MFA가 필요한 경우 → OTP 입력 화면 표시
3. `verifyLoginOTP(userId, token)` 호출하여 검증
4. 성공 시 → 홈페이지로 리디렉션

예시 코드는 `actions/auth/verify-otp-login.ts` 참고





















