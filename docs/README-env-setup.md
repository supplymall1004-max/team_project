# 🔐 .env.local 파일 생성 가이드

## 📝 빠른 시작

1. **프로젝트 루트 디렉토리**에서 다음 명령어 실행:

```bash
# Windows (PowerShell)
Copy-Item env.example .env.local

# Mac/Linux
cp env.example .env.local
```

2. `.env.local` 파일을 열고 아래 항목들을 채워주세요.

---

## ⚠️ 필수 설정 항목 (반드시 입력 필요)

다음 항목들은 프로젝트 실행을 위해 **반드시** 설정해야 합니다:

### 1. Supabase 설정

**Supabase 프로젝트를 먼저 생성해야 합니다!**

1. [Supabase](https://supabase.com)에 접속하여 프로젝트 생성
2. 프로젝트 대시보드 > Settings > API에서 다음 정보 확인:
   - Project URL
   - anon public key
   - service_role key

3. `.env.local` 파일에 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=여기에_프로젝트_URL_입력
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key_입력
SUPABASE_SERVICE_ROLE_KEY=여기에_service_role_key_입력
```

**❓ Supabase 프로젝트를 만드는 방법이 궁금하신가요?**
→ [env-setup-guide.md](./env-setup-guide.md) 파일의 "1. Supabase 설정" 섹션을 참고하세요.

### 2. 보안 키 생성

터미널에서 다음 명령어를 실행하여 랜덤 키를 생성하세요:

```bash
# Node.js가 설치되어 있어야 합니다
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

생성된 키를 `.env.local` 파일에 입력:

```env
SESSION_SECRET=생성된_키_첫번째_복사
HEALTH_DATA_ENCRYPTION_KEY=생성된_키_두번째_복사
```

**💡 팁**: 위 명령어를 두 번 실행하여 각각 다른 키를 생성하세요.

### 3. 애플리케이션 URL 설정

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📋 선택적 설정 항목

다음 항목들은 기능에 따라 선택적으로 설정할 수 있습니다:

### 소셜 로그인 (Google/Kakao)
- Google OAuth 설정 방법: [env-setup-guide.md](./env-setup-guide.md) 참고
- Kakao OAuth 설정 방법: [env-setup-guide.md](./env-setup-guide.md) 참고

### 식자재 마켓플레이스 API (C-5 기능)
- 쿠팡 파트너스 API 또는 네이버 쇼핑 API 설정
- 자세한 방법: [env-setup-guide.md](./env-setup-guide.md) 참고

### 이메일 서비스
- Resend 또는 SendGrid 설정
- 자세한 방법: [env-setup-guide.md](./env-setup-guide.md) 참고

### 모니터링 도구 (Sentry)
- 에러 추적을 위한 Sentry 설정
- 자세한 방법: [env-setup-guide.md](./env-setup-guide.md) 참고

---

## ✅ 설정 완료 확인

다음 명령어로 필수 항목이 모두 설정되었는지 확인하세요:

```bash
# Windows (PowerShell)
Get-Content .env.local | Select-String "NEXT_PUBLIC_SUPABASE_URL|SESSION_SECRET|HEALTH_DATA_ENCRYPTION_KEY"

# Mac/Linux
grep -E "NEXT_PUBLIC_SUPABASE_URL|SESSION_SECRET|HEALTH_DATA_ENCRYPTION_KEY" .env.local
```

모든 항목에 `your_..._here`가 아닌 실제 값이 입력되어 있어야 합니다.

---

## 🆘 도움이 필요하신가요?

- **상세한 설정 가이드**: [env-setup-guide.md](./env-setup-guide.md) 참고
- **개발 계획서**: [development-plan.md](./development-plan.md) 참고
- **체크리스트**: [checklist.md](./checklist.md) 참고

---

## ⚠️ 중요 안내

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요!**
   - 이미 `.gitignore`에 포함되어 있어야 합니다
   - 실수로 커밋했다면 즉시 키를 재발급하세요

2. **모든 API 키는 보안이 중요합니다**
   - 외부에 노출되지 않도록 주의하세요
   - 특히 `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용하세요

3. **프로덕션 환경에서는 환경 변수를 안전하게 관리하세요**
   - Vercel: 프로젝트 설정 > Environment Variables
   - AWS: Secrets Manager
   - 기타: 환경 변수 관리 서비스 사용

---

**작성일**: 2025년 1월  
**버전**: V1.0

