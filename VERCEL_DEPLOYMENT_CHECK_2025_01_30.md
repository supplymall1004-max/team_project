# 🚀 Vercel 배포 검사 보고서

**검사 일시**: 2025-01-30  
**빌드 상태**: ⚠️ 거의 성공 (일부 페이지 타임아웃)  
**배포 준비 상태**: ✅ 타입 오류 해결 완료

---

## ✅ 해결된 문제들

### 1. 모듈 누락 오류
- **문제**: `@/lib/supabase/auth` 모듈을 찾을 수 없음
- **해결**: `lib/supabase/auth.ts` 파일 생성하여 `ensureSupabaseUser` 함수 re-export

### 2. 타입 오류들
- **문제**: `initializeCharacterGame` 반환 타입에 `lifecycleEventsCreated` 누락
- **해결**: 반환 타입에 `lifecycleEventsCreated: number` 추가

- **문제**: `LifecycleEventData` 타입에 `message` 속성 없음
- **해결**: `eventData.message` 참조 제거, `dialogue_message`만 사용

- **문제**: Unity WebGL 타입 선언 누락
- **해결**: `types/unity.d.ts` 파일 생성하여 `window.createUnityInstance` 타입 선언

- **문제**: Three.js `Mesh` 타입 가드 누락
- **해결**: `child.type === "Mesh"` → `child instanceof Mesh`로 변경

- **문제**: `BeautifulCharacter` 컴포넌트의 `gender` prop 기본값 오류
- **해결**: `gender = "child"` → `gender = "male"`로 변경

- **문제**: React Three Fiber `hemisphereLight` prop 오류
- **해결**: `skyColor`, `groundColor` prop → `args` 배열로 변경

- **문제**: `SSAO` 컴포넌트의 `color` prop 타입 오류
- **해결**: `color` prop 제거 (기본값 사용)

- **문제**: `MODEL_CREDITS` 배열이 Server Component에서 사용 불가
- **해결**: `model-credits-data.ts` 파일로 분리하여 Server/Client 모두에서 사용 가능하도록 수정

---

## ⚠️ 알려진 문제

### 1. 빌드 타임아웃
다음 페이지들이 빌드 타임에 60초 이상 소요되어 타임아웃 발생:
- `/archive/recipes`
- `/recipes`

**원인 추정**:
- 빌드 타임에 데이터베이스 쿼리 실행
- 외부 API 호출
- 대량의 데이터 처리

**해결 방법**:
1. 해당 페이지를 동적 렌더링으로 변경 (`export const dynamic = 'force-dynamic'`)
2. 빌드 타임 데이터 fetching 제거
3. ISR(Incremental Static Regeneration) 사용

### 2. Clerk 프로덕션 키 경고
프로덕션 환경에서 개발 키(`pk_test_`)를 사용 중입니다.

**해결 방법**:
Vercel Dashboard → Settings → Environment Variables에서:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`를 `pk_live_...`로 변경
- `CLERK_SECRET_KEY`를 `sk_live_...`로 변경

---

## 📋 필수 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 **반드시** 설정해야 합니다:

### 1. Clerk 인증 (필수)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (프로덕션) 또는 pk_test_... (개발)
CLERK_SECRET_KEY=sk_live_... (프로덕션) 또는 sk_test_... (개발)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### 2. Supabase (필수)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xlbhrgvnfioxtvocwban.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

### 3. Cron Job (필수)
```bash
CRON_SECRET=your_random_secret_here
```

---

## ✅ 수정된 파일 목록

1. `lib/supabase/auth.ts` - 새로 생성 (ensureSupabaseUser re-export)
2. `lib/game/character-game-initializer.ts` - 반환 타입에 `lifecycleEventsCreated` 추가
3. `components/game/lifecycle-event-popup.tsx` - `eventData.message` 참조 제거
4. `types/unity.d.ts` - 새로 생성 (Unity WebGL 타입 선언)
5. `components/game/threejs/apartment-viewer.tsx` - `Mesh` 타입 가드 추가
6. `components/game/threejs/beautiful-character.tsx` - `gender` 기본값 수정
7. `components/game/threejs/beautiful-room.tsx` - `gender` prop 수정, `position` 타입 수정
8. `components/game/threejs/game-scene.tsx` - `hemisphereLight` args 수정
9. `components/game/threejs/post-processing.tsx` - `SSAO` color prop 제거
10. `lib/game/character-dialogue.ts` - `data.message` 참조 제거
11. `components/game/threejs/model-credits-data.ts` - 새로 생성 (데이터 분리)
12. `components/game/threejs/model-credits.tsx` - 데이터 import로 변경
13. `app/game/models/credits/page.tsx` - import 경로 수정

---

## 🚀 배포 전 확인 사항

1. **환경 변수 설정 확인**
   - [ ] 모든 필수 환경 변수가 Vercel에 설정되어 있는지 확인
   - [ ] 프로덕션 키(`pk_live_`, `sk_live_`) 사용 확인

2. **빌드 타임아웃 해결**
   - [ ] `/archive/recipes` 페이지 동적 렌더링으로 변경
   - [ ] `/recipes` 페이지 동적 렌더링으로 변경

3. **Clerk 설정**
   - [ ] Clerk Dashboard에서 Allowed Origins에 Vercel 도메인 추가
   - [ ] Redirect URLs 설정 확인

4. **Supabase 설정**
   - [ ] 모든 마이그레이션 적용 확인
   - [ ] RLS 정책 확인 (개발 중에는 비활성화 가능)

---

## 📝 다음 단계

1. 빌드 타임아웃 문제 해결 (동적 렌더링 적용)
2. 프로덕션 키로 환경 변수 업데이트
3. Vercel에 배포
4. 배포 후 기능 테스트

