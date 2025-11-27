# Vercel 배포 체크리스트 ✅

## ✅ 빌드 검증 완료
- [x] TypeScript 타입 에러 수정 완료
- [x] 빌드 성공 확인 (`pnpm build` 통과)
- [x] 경고는 있으나 빌드 차단 없음

## 🔐 필수 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

### Clerk 인증
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

### 선택적 환경 변수
```
GEMINI_API_KEY=AIzaSyD... (이미지 생성 기능 사용 시)
```

## 📋 배포 전 확인 사항

### 1. 데이터베이스 마이그레이션
- [ ] Supabase에서 모든 마이그레이션 적용 확인
- [ ] `food-images` Storage 버킷 생성 확인
- [ ] RLS 정책 설정 확인 (개발 중에는 비활성화 가능)

### 2. Clerk 설정
- [ ] Clerk 대시보드에서 프로덕션 키 확인
- [ ] Allowed Origins에 Vercel 도메인 추가
- [ ] Redirect URLs 설정 확인

### 3. Vercel 설정
- [ ] Build Command: `pnpm build` (기본값)
- [ ] Output Directory: `.next` (기본값)
- [ ] Install Command: `pnpm install` (기본값)
- [ ] Node.js Version: 20.x 이상

### 4. Cron Jobs
`vercel.json`에 정의된 Cron Job이 정상 작동하는지 확인:
- `/api/cron/generate-daily-diets` - 매일 오후 8시 실행

## ⚠️ 알려진 경고 (빌드 차단 없음)

다음 경고들은 빌드를 차단하지 않지만, 필요시 수정 가능:
- 사용하지 않는 변수들 (ESLint 경고)
- React Hook 의존성 배열 경고
- `/health/family/notifications` 페이지 동적 렌더링 경고

## 🚀 배포 후 확인 사항

1. **홈페이지 접속 확인**
   - [ ] 메인 페이지 로드 확인
   - [ ] Clerk 로그인/회원가입 동작 확인

2. **API 엔드포인트 확인**
   - [ ] `/api/sync-user` 동작 확인
   - [ ] `/api/health/check` 동작 확인

3. **데이터베이스 연결 확인**
   - [ ] Supabase 연결 확인
   - [ ] 사용자 동기화 확인

4. **이미지 최적화 확인**
   - [ ] Next.js Image 컴포넌트 동작 확인
   - [ ] Supabase Storage 이미지 로드 확인

## 📝 수정된 파일 목록

빌드 에러 수정을 위해 다음 파일들이 수정되었습니다:

1. `components/health/diet-card.tsx` - 타입 에러 수정
2. `lib/image-pipeline/database-operations.ts` - Supabase raw() 메서드 수정
3. `lib/image-pipeline/response-parser.ts` - aspectRatio 계산 추가
4. `lib/image-pipeline/storage-uploader.ts` - 중복 import 제거
5. `lib/image-pipeline/prompt-builder.ts` - FoodRecord 타입 수정
6. `tsconfig.json` - Supabase Edge Functions 제외

## 🔗 유용한 링크

- [Vercel 환경 변수 설정 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)

