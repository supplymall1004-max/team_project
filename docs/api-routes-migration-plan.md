# API Routes → Server Actions 마이그레이션 계획

> **작성일**: 2025-01-19  
> **목적**: API Routes 중 Server Actions로 전환 가능한 항목 식별 및 마이그레이션 계획 수립

---

## 📋 전환 가능성 기준

### ✅ Server Actions로 전환 가능한 경우

1. **인증된 사용자의 데이터 조회/수정**
   - GET 요청: 데이터 조회
   - POST/PUT/DELETE: 데이터 생성/수정/삭제
   - Clerk 인증만 필요한 경우

2. **단순한 CRUD 작업**
   - Supabase 데이터베이스 조작
   - 복잡한 비즈니스 로직이 없는 경우

3. **내부 로직 처리**
   - 외부 API 호출이 필요 없는 경우
   - 계산, 변환 등 순수 로직

### ❌ Server Actions로 전환 불가능한 경우

1. **웹훅 (Webhook)**
   - 외부 서비스에서 호출하는 엔드포인트
   - 예: `/api/health/data-sources/callback`

2. **크론 작업 (Cron Jobs)**
   - 스케줄러에서 호출하는 엔드포인트
   - 예: `/api/cron/generate-daily-diets`

3. **파일 업로드/다운로드**
   - 멀티파트 폼 데이터 처리
   - 예: `/api/admin/popups/upload-image`

4. **외부 API 프록시**
   - 네이버 API, KCDC API 등 외부 서비스 프록시
   - 예: `/api/health/medical-facilities/search`

5. **공개 엔드포인트**
   - 인증 없이 접근 가능한 API
   - 예: 일부 공개 데이터 조회

---

## 🔄 전환 우선순위

### 우선순위 1: 높음 (즉시 전환 권장)

#### 건강 관리 API
- ✅ `/api/health/profile` (GET, POST, PUT, DELETE)
  - **이유**: 단순 CRUD 작업, 인증된 사용자만 접근
  - **전환 후**: `actions/health/profile.ts`

- ✅ `/api/health/check` (GET)
  - **이유**: 단순 조회 작업
  - **전환 후**: `actions/health/check.ts`

- ✅ `/api/health/metrics` (GET)
  - **이유**: 건강 메트릭스 계산 및 조회
  - **전환 후**: `actions/health/metrics.ts`

- ✅ `/api/health/dashboard/summary` (GET)
  - **이유**: 대시보드 데이터 조회
  - **전환 후**: `actions/health/dashboard.ts`

#### 식단 관리 API
- ✅ `/api/diet/plan` (GET, POST)
  - **이유**: 식단 조회 및 생성
  - **전환 후**: `actions/diet/plan.ts`

- ✅ `/api/diet/notifications/check` (GET)
  - **이유**: 알림 확인
  - **전환 후**: `actions/diet/notifications.ts`

- ✅ `/api/diet/notifications/dismiss` (POST)
  - **이유**: 알림 해제
  - **전환 후**: `actions/diet/notifications.ts`

#### 가족 관리 API
- ✅ `/api/family/members` (GET, POST)
  - **이유**: 가족 구성원 조회 및 생성
  - **전환 후**: `actions/family/members.ts`

- ✅ `/api/family/members/[id]` (GET, PUT, DELETE)
  - **이유**: 가족 구성원 상세 조회/수정/삭제
  - **전환 후**: `actions/family/members.ts`

### 우선순위 2: 중간 (검토 후 전환)

#### 건강 관리 API
- ⚠️ `/api/health/meal-impact` (POST)
  - **이유**: 계산 로직이 복잡하지만 전환 가능
  - **전환 후**: `actions/health/meal-impact.ts`

- ⚠️ `/api/health/medications` (GET, POST)
  - **이유**: 약물 관리 CRUD
  - **전환 후**: `actions/health/medications.ts`

- ⚠️ `/api/health/vaccinations` (GET, POST)
  - **이유**: 예방주사 관리 CRUD
  - **전환 후**: `actions/health/vaccinations.ts`

#### 식단 관리 API
- ⚠️ `/api/diet/meal/breakfast/[date]` (GET, POST)
- ⚠️ `/api/diet/meal/lunch/[date]` (GET, POST)
- ⚠️ `/api/diet/meal/dinner/[date]` (GET, POST)
  - **이유**: 식사별 조회/생성, 동적 라우트 처리 필요
  - **전환 후**: `actions/diet/meals.ts`

### 우선순위 3: 낮음 (유지 권장)

#### 외부 API 프록시
- ❌ `/api/health/medical-facilities/search` (GET)
  - **이유**: 네이버 API 프록시, 외부 서비스 호출

- ❌ `/api/health/medical-facilities/geocode` (GET)
  - **이유**: 네이버 지오코딩 API 프록시

- ❌ `/api/health/kcdc/alerts` (GET)
  - **이유**: KCDC API 프록시

#### 웹훅/콜백
- ❌ `/api/health/data-sources/callback` (GET, POST)
  - **이유**: 외부 서비스에서 호출하는 콜백

- ❌ `/api/health/data-sources/auth-url` (GET)
  - **이유**: 외부 서비스 인증 URL 생성

#### 크론 작업
- ❌ `/api/cron/generate-daily-diets` (GET)
  - **이유**: 스케줄러에서 호출

- ❌ `/api/cron/cleanup-cache` (GET)
  - **이유**: 스케줄러에서 호출

#### 파일 업로드
- ❌ `/api/admin/popups/upload-image` (POST)
  - **이유**: 멀티파트 폼 데이터 처리

- ❌ `/api/admin/upload-recipe-images` (POST)
  - **이유**: 멀티파트 폼 데이터 처리

#### 관리자 API
- ❌ `/api/admin/*`
  - **이유**: 관리자 전용, 특별한 권한 체크 필요

---

## 📝 마이그레이션 가이드

### 1. Server Action 생성 패턴

```typescript
// actions/health/profile.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { ensureSupabaseUser } from '@/lib/supabase/ensure-user';

export async function getHealthProfile() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('인증이 필요합니다.');
  }

  const supabase = await createClerkSupabaseClient();
  const userData = await ensureSupabaseUser();
  
  if (!userData) {
    throw new Error('사용자 정보를 찾을 수 없습니다.');
  }

  const { data, error } = await supabase
    .from('user_health_profiles')
    .select('*')
    .eq('user_id', userData.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateHealthProfile(profileData: Partial<HealthProfile>) {
  // ... 구현
}
```

### 2. 클라이언트에서 사용

```typescript
// Before (API Route)
const response = await fetch('/api/health/profile');
const data = await response.json();

// After (Server Action)
import { getHealthProfile } from '@/actions/health/profile';
const data = await getHealthProfile();
```

### 3. 에러 처리

```typescript
// Server Action
export async function getHealthProfile() {
  try {
    // ... 로직
  } catch (error) {
    console.error('[getHealthProfile] 오류:', error);
    throw new Error('건강 프로필을 불러오는데 실패했습니다.');
  }
}

// Client Component
try {
  const profile = await getHealthProfile();
} catch (error) {
  toast.error(error.message);
}
```

---

## 🎯 마이그레이션 체크리스트

### Phase 1: 건강 관리 API (우선순위 1)
- [ ] `/api/health/profile` → `actions/health/profile.ts`
- [ ] `/api/health/check` → `actions/health/check.ts`
- [ ] `/api/health/metrics` → `actions/health/metrics.ts`
- [ ] `/api/health/dashboard/summary` → `actions/health/dashboard.ts`

### Phase 2: 식단 관리 API (우선순위 1)
- [ ] `/api/diet/plan` → `actions/diet/plan.ts`
- [ ] `/api/diet/notifications/check` → `actions/diet/notifications.ts`
- [ ] `/api/diet/notifications/dismiss` → `actions/diet/notifications.ts`

### Phase 3: 가족 관리 API (우선순위 1)
- [ ] `/api/family/members` → `actions/family/members.ts`
- [ ] `/api/family/members/[id]` → `actions/family/members.ts`

### Phase 4: 기타 API (우선순위 2)
- [ ] `/api/health/meal-impact` → `actions/health/meal-impact.ts`
- [ ] `/api/health/medications` → `actions/health/medications.ts`
- [ ] `/api/health/vaccinations` → `actions/health/vaccinations.ts`

---

## 📊 예상 효과

### 장점
1. **타입 안정성 향상**: Server Actions는 TypeScript 타입 추론이 더 명확함
2. **코드 간소화**: fetch 호출 불필요, 직접 함수 호출
3. **에러 처리 개선**: try-catch로 자연스러운 에러 처리
4. **성능 향상**: 불필요한 HTTP 오버헤드 제거
5. **개발 경험 향상**: 자동완성, 타입 체크 등 IDE 지원

### 주의사항
1. **점진적 마이그레이션**: 한 번에 모든 API를 전환하지 말고 단계적으로 진행
2. **기존 API 유지**: 마이그레이션 중에는 기존 API도 유지하여 호환성 보장
3. **테스트 필수**: 각 마이그레이션 후 충분한 테스트 수행

---

## 🔗 참고 자료

- [Next.js Server Actions 공식 문서](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [AGENTS.md - Server Actions vs API Routes](./AGENTS.md#server-actions-vs-api-routes)
