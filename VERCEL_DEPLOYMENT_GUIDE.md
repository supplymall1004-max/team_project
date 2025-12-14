# Vercel 배포 가이드

## 오류 해결

**오류**: `Error: unknown or unexpected option: -r`

**원인**: Vercel CLI에는 `-r` 옵션이 존재하지 않습니다.

**해결**: 아래의 올바른 명령어를 사용하세요.

## 올바른 배포 명령어

### 1. 프로덕션 배포 (권장)

```bash
# 방법 1: 직접 명령어 실행
vercel --prod

# 방법 2: npm 스크립트 사용
pnpm run deploy
```

### 2. 프리뷰 배포 (테스트용)

```bash
# 방법 1: 직접 명령어 실행
vercel

# 방법 2: npm 스크립트 사용
pnpm run deploy:preview
```

### 3. 확인 없이 자동 배포

```bash
# 프로덕션 배포 (확인 없이)
vercel --prod --yes

# 프리뷰 배포 (확인 없이)
vercel --yes
```

## 배포 전 확인 사항

### 1. 로그인 확인

```bash
vercel whoami
```

로그인되어 있지 않다면:

```bash
vercel login
```

### 2. 프로젝트 연결 확인

프로젝트가 Vercel에 연결되어 있지 않다면:

```bash
vercel link
```

### 3. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

#### 필수 환경 변수

**Clerk 인증:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STORAGE_BUCKET`

**Cron Job:**
- `CRON_SECRET` (랜덤 문자열)

#### 선택적 환경 변수

- `GEMINI_API_KEY` (이미지 생성 기능 사용 시)
- `NOTION_API_KEY` (Notion 연동 시)
- `NOTION_DATABASE_ID` (Notion 연동 시)

## 배포 단계

### 1단계: 빌드 테스트

```bash
pnpm build
```

빌드가 성공하는지 확인하세요.

### 2단계: 배포 실행

```bash
# 프로덕션 배포
pnpm run deploy

# 또는 직접 실행
vercel --prod
```

### 3단계: 배포 확인

배포가 완료되면 Vercel이 배포 URL을 제공합니다. 해당 URL로 접속하여 정상 작동하는지 확인하세요.

## 문제 해결

### 배포 실패 시

1. **빌드 로그 확인**:
   ```bash
   vercel logs [deployment-url]
   ```

2. **로컬 빌드 테스트**:
   ```bash
   pnpm build
   ```

3. **환경 변수 확인**:
   - Vercel 대시보드에서 모든 필수 환경 변수가 설정되어 있는지 확인

### 자주 발생하는 오류

1. **"Build failed"**: 
   - 로컬에서 `pnpm build` 실행하여 오류 확인
   - 환경 변수 누락 확인

2. **"Environment variable not found"**:
   - Vercel 대시보드에서 환경 변수 설정 확인
   - 프로덕션/프리뷰 환경 모두 설정되어 있는지 확인

3. **"Project not found"**:
   - `vercel link` 실행하여 프로젝트 연결

## 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)

