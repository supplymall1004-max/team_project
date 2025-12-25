# 데이터베이스 관계성 재설계 문서

> **작성일**: 2025-01-29  
> **목적**: 현재 서비스의 데이터 흐름 분석 및 DB 관계성 재설계  
> **대상**: 비개발자 초보자를 위한 쉬운 설명 포함

---

## 📋 목차

1. [현재 데이터 흐름 분석](#1-현재-데이터-흐름-분석)
2. [DB 관계성 재설계](#2-db-관계성-재설계)
3. [구현 및 적용](#3-구현-및-적용)
4. [SQL 마이그레이션](#4-sql-마이그레이션)
5. [프론트엔드 코드 수정](#5-프론트엔드-코드-수정)

---

## 1. 현재 데이터 흐름 분석

### 1.1. 사용자 인증 및 프로필 흐름

```
[사용자 로그인] 
  ↓
[Clerk 인증] 
  ↓
[SyncUserProvider가 자동으로 Supabase users 테이블에 동기화]
  ↓
[users 테이블에 레코드 생성/업데이트]
```

**관련 테이블:**
- `users`: 중앙 허브 테이블 (모든 사용자 관련 데이터의 부모)
- `user_health_profiles`: 사용자 건강 정보 (1:1 관계)

**UI 요소:**
- 로그인 폼 (`app/sign-in/page.tsx`)
- 건강 프로필 폼 (`components/health/health-profile-form.tsx`)

**데이터 저장 위치:**
- `users.clerk_id`: Clerk 사용자 ID
- `users.name`: 사용자 이름
- `user_health_profiles.*`: 건강 정보 (질병, 알레르기, 선호 재료 등)

---

### 1.2. 레시피 생성 흐름

```
[레시피 업로드 폼 입력]
  ↓
[제목, 설명, 난이도, 조리시간, 재료, 단계 입력]
  ↓
[createRecipe Server Action 호출]
  ↓
[recipes 테이블에 기본 정보 저장]
  ↓
[recipe_ingredients 테이블에 재료 정보 저장]
  ↓
[recipe_steps 테이블에 조리 단계 저장]
```

**관련 테이블:**
- `recipes`: 레시피 기본 정보
- `recipe_ingredients`: 레시피별 재료 목록
- `recipe_steps`: 레시피별 조리 단계

**UI 요소:**
- 레시피 업로드 폼 (`components/recipes/recipe-upload-form.tsx`)

**데이터 저장 위치:**
- `recipes.user_id`: 레시피 작성자 (users 테이블 참조)
- `recipes.title`, `recipes.description`: 레시피 기본 정보
- `recipe_ingredients.recipe_id`: 레시피 ID (recipes 테이블 참조)
- `recipe_steps.recipe_id`: 레시피 ID (recipes 테이블 참조)

---

### 1.3. 식단 생성 흐름

```
[식단 생성 요청]
  ↓
[사용자 건강 프로필 조회]
  ↓
[가족 구성원 정보 조회 (family_members)]
  ↓
[레시피 목록 조회 및 필터링]
  ↓
[식단 생성 알고리즘 실행]
  ↓
[diet_plans 테이블에 저장]
```

**관련 테이블:**
- `diet_plans`: 일일 식단 계획
- `family_members`: 가족 구성원 정보
- `recipes`: 레시피 정보

**UI 요소:**
- 식단 생성 API (`app/api/diet/personal/route.ts`)
- 가족 식단 생성 API (`app/api/family/diet/generate/route.ts`)

**데이터 저장 위치:**
- `diet_plans.user_id`: 사용자 ID (users 테이블 참조)
- `diet_plans.family_member_id`: 가족 구성원 ID (family_members 테이블 참조, NULL이면 본인)
- `diet_plans.recipe_id`: 레시피 ID (recipes 테이블 참조)

---

### 1.4. 건강 정보 관리 흐름

```
[건강 프로필 폼 입력]
  ↓
[질병, 알레르기, 선호 재료 선택]
  ↓
[PUT /api/health/profile 호출]
  ↓
[user_health_profiles 테이블에 저장/업데이트]
```

**관련 테이블:**
- `user_health_profiles`: 사용자 건강 프로필
- `diseases`: 질병 마스터 데이터
- `allergies`: 알레르기 마스터 데이터

**UI 요소:**
- 건강 프로필 폼 (`components/health/health-profile-form.tsx`)

**데이터 저장 위치:**
- `user_health_profiles.user_id`: 사용자 ID (users 테이블 참조, UNIQUE)
- `user_health_profiles.diseases_jsonb`: 질병 정보 (JSONB 배열)
- `user_health_profiles.allergies_jsonb`: 알레르기 정보 (JSONB 배열)

---

## 2. DB 관계성 재설계

### 2.1. 현재 관계 현황 요약

| 부모 테이블 | 자식 테이블 | 관계 | 외래 키 | 삭제 정책 | 상태 |
|------------|------------|------|---------|----------|------|
| `users` | `user_health_profiles` | 1:1 | `user_id` | CASCADE | ✅ 설정됨 |
| `users` | `family_members` | 1:N | `user_id` | CASCADE | ✅ 설정됨 |
| `users` | `recipes` | 1:N | `user_id` | SET NULL | ✅ 설정됨 |
| `users` | `diet_plans` | 1:N | `user_id` | CASCADE | ✅ 설정됨 |
| `users` | `notifications` | 1:N | `user_id` | CASCADE | ✅ 설정됨 |
| `users` | `subscriptions` | 1:N | `user_id` | CASCADE | ✅ 설정됨 |
| `recipes` | `recipe_ingredients` | 1:N | `recipe_id` | CASCADE | ✅ 설정됨 |
| `recipes` | `recipe_steps` | 1:N | `recipe_id` | CASCADE | ✅ 설정됨 |
| `recipes` | `recipe_ratings` | 1:N | `recipe_id` | CASCADE | ✅ 설정됨 |
| `recipes` | `recipe_reports` | 1:N | `recipe_id` | CASCADE | ✅ 설정됨 |
| `recipes` | `diet_plans` | 1:N | `recipe_id` | CASCADE | ✅ 설정됨 |
| `family_members` | `diet_plans` | 1:N | `family_member_id` | SET NULL | ✅ 설정됨 |
| `family_members` | `notifications` | 1:N | `family_member_id` | SET NULL | ✅ 설정됨 |
| `weekly_diet_plans` | `weekly_shopping_lists` | 1:N | `weekly_diet_plan_id` | CASCADE | ✅ 설정됨 |
| `weekly_diet_plans` | `weekly_nutrition_stats` | 1:N | `weekly_diet_plan_id` | CASCADE | ✅ 설정됨 |

---

### 2.2. 개선이 필요한 관계

#### 2.2.1. `diet_plans`와 `weekly_diet_plans` 간의 관계

**현재 상태:**
- `diet_plans`는 일일 식단 계획을 저장
- `weekly_diet_plans`는 주간 식단 메타데이터를 저장
- 두 테이블 간의 명시적인 관계가 없음

**개선 방안:**
- `diet_plans`에 `weekly_diet_plan_id` 컬럼 추가 (선택적)
- 주간 식단 생성 시 해당 주의 일일 식단들을 그룹화

**이유:**
- 주간 식단을 생성할 때 일일 식단들을 그룹화하여 관리할 수 있음
- 주간 식단 삭제 시 관련 일일 식단도 함께 삭제할 수 있음 (CASCADE)

---

#### 2.2.2. `favorite_meals`와 `recipes` 간의 관계

**현재 상태:**
- `favorite_meals.recipe_id`가 UUID 타입이지만 외래 키 제약조건이 없음

**개선 방안:**
- `favorite_meals.recipe_id`에 외래 키 제약조건 추가
- 레시피 삭제 시 즐겨찾기도 함께 삭제 (CASCADE)

---

#### 2.2.3. `recipe_usage_history`와 `recipes` 간의 관계

**현재 상태:**
- `recipe_usage_history.recipe_title`만 저장하고 `recipe_id`는 없음

**개선 방안:**
- `recipe_usage_history`에 `recipe_id` 컬럼 추가 (선택적)
- 레시피 ID로 직접 참조 가능하도록 개선

---

#### 2.2.4. `meal_kits`와 `users` 간의 관계

**현재 상태:**
- `meal_kits.created_by`가 UUID 타입이지만 외래 키 제약조건이 없음

**개선 방안:**
- `meal_kits.created_by`에 외래 키 제약조건 추가
- 관리자가 생성한 밀키트를 추적할 수 있음

---

## 3. 구현 및 적용

### 3.1. 새로운 관계 추가

다음과 같은 관계를 추가합니다:

1. **`diet_plans.weekly_diet_plan_id`** → `weekly_diet_plans.id` (선택적, SET NULL)
2. **`favorite_meals.recipe_id`** → `recipes.id` (CASCADE)
3. **`recipe_usage_history.recipe_id`** → `recipes.id` (선택적, SET NULL)
4. **`meal_kits.created_by`** → `users.id` (SET NULL)

---

## 4. SQL 마이그레이션

다음 SQL 쿼리를 Supabase SQL Editor에서 실행하세요:

```sql
-- ============================================================================
-- 데이터베이스 관계성 개선 마이그레이션
-- 작성일: 2025-01-29
-- 목적: 누락된 외래 키 관계 추가 및 기존 관계 개선
-- ============================================================================

-- ============================================================================
-- 1. diet_plans에 weekly_diet_plan_id 컬럼 추가 및 외래 키 설정
-- ============================================================================

-- 1-1. weekly_diet_plan_id 컬럼 추가 (이미 존재하지 않는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'diet_plans'
      AND column_name = 'weekly_diet_plan_id'
  ) THEN
    ALTER TABLE public.diet_plans
    ADD COLUMN weekly_diet_plan_id UUID;
    
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 1-2. 외래 키 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'diet_plans_weekly_diet_plan_id_fkey'
    AND conrelid = 'diet_plans'::regclass
  ) THEN
    ALTER TABLE public.diet_plans
    ADD CONSTRAINT diet_plans_weekly_diet_plan_id_fkey
    FOREIGN KEY (weekly_diet_plan_id) REFERENCES public.weekly_diet_plans(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 외래 키 제약조건 추가 완료';
  ELSE
    RAISE NOTICE 'diet_plans.weekly_diet_plan_id 외래 키 제약조건이 이미 존재합니다';
  END IF;
END $$;

-- 1-3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_diet_plans_weekly_diet_plan_id 
ON public.diet_plans(weekly_diet_plan_id) 
WHERE weekly_diet_plan_id IS NOT NULL;

-- ============================================================================
-- 2. favorite_meals에 recipe_id 외래 키 제약조건 추가
-- ============================================================================

DO $$
BEGIN
  -- recipe_id 컬럼이 존재하는지 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'favorite_meals'
      AND column_name = 'recipe_id'
  ) THEN
    -- 외래 키 제약조건 추가
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'favorite_meals_recipe_id_fkey'
      AND conrelid = 'favorite_meals'::regclass
    ) THEN
      ALTER TABLE public.favorite_meals
      ADD CONSTRAINT favorite_meals_recipe_id_fkey
      FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'favorite_meals.recipe_id 외래 키 제약조건 추가 완료';
    ELSE
      RAISE NOTICE 'favorite_meals.recipe_id 외래 키 제약조건이 이미 존재합니다';
    END IF;
  ELSE
    RAISE NOTICE 'favorite_meals.recipe_id 컬럼이 존재하지 않습니다';
  END IF;
END $$;

-- ============================================================================
-- 3. recipe_usage_history에 recipe_id 컬럼 추가 및 외래 키 설정
-- ============================================================================

-- 3-1. recipe_id 컬럼 추가 (이미 존재하지 않는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recipe_usage_history'
      AND column_name = 'recipe_id'
  ) THEN
    ALTER TABLE public.recipe_usage_history
    ADD COLUMN recipe_id UUID;
    
    RAISE NOTICE 'recipe_usage_history.recipe_id 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'recipe_usage_history.recipe_id 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 3-2. 외래 키 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recipe_usage_history_recipe_id_fkey'
    AND conrelid = 'recipe_usage_history'::regclass
  ) THEN
    ALTER TABLE public.recipe_usage_history
    ADD CONSTRAINT recipe_usage_history_recipe_id_fkey
    FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'recipe_usage_history.recipe_id 외래 키 제약조건 추가 완료';
  ELSE
    RAISE NOTICE 'recipe_usage_history.recipe_id 외래 키 제약조건이 이미 존재합니다';
  END IF;
END $$;

-- 3-3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_recipe_usage_history_recipe_id 
ON public.recipe_usage_history(recipe_id) 
WHERE recipe_id IS NOT NULL;

-- ============================================================================
-- 4. meal_kits에 created_by 외래 키 제약조건 추가
-- ============================================================================

DO $$
BEGIN
  -- created_by 컬럼이 존재하는지 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'meal_kits'
      AND column_name = 'created_by'
  ) THEN
    -- 외래 키 제약조건 추가
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'meal_kits_created_by_fkey'
      AND conrelid = 'meal_kits'::regclass
    ) THEN
      ALTER TABLE public.meal_kits
      ADD CONSTRAINT meal_kits_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'meal_kits.created_by 외래 키 제약조건 추가 완료';
    ELSE
      RAISE NOTICE 'meal_kits.created_by 외래 키 제약조건이 이미 존재합니다';
    END IF;
  ELSE
    RAISE NOTICE 'meal_kits.created_by 컬럼이 존재하지 않습니다';
  END IF;
END $$;

-- ============================================================================
-- 5. 코멘트 추가 (관계 설명)
-- ============================================================================

COMMENT ON COLUMN diet_plans.weekly_diet_plan_id IS 
'주간 식단 계획 ID (선택적). 주간 식단 생성 시 일일 식단들을 그룹화하는 데 사용됩니다. 주간 식단 삭제 시 NULL로 설정됩니다.';

COMMENT ON COLUMN recipe_usage_history.recipe_id IS 
'레시피 ID (선택적). 레시피 제목 대신 레시피 ID로 직접 참조할 수 있습니다. 레시피 삭제 시 NULL로 설정됩니다.';

COMMENT ON CONSTRAINT favorite_meals_recipe_id_fkey ON favorite_meals IS 
'즐겨찾기한 레시피 참조. 레시피 삭제 시 즐겨찾기도 함께 삭제됩니다 (CASCADE).';

COMMENT ON CONSTRAINT meal_kits_created_by_fkey ON meal_kits IS 
'밀키트 생성자 참조. 관리자가 생성한 밀키트를 추적할 수 있습니다. 사용자 삭제 시 NULL로 설정됩니다 (SET NULL).';

-- ============================================================================
-- 6. 검증 쿼리 (마이그레이션 후 실행하여 확인)
-- ============================================================================

-- 모든 외래 키 제약조건 확인
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('diet_plans', 'favorite_meals', 'recipe_usage_history', 'meal_kits')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
```

---

## 5. 프론트엔드 코드 수정

### 5.1. 식단 생성 시 weekly_diet_plan_id 연결

**파일**: `app/api/diet/personal/route.ts`

**수정 내용:**
주간 식단 생성 시 `diet_plans`에 `weekly_diet_plan_id`를 저장하도록 수정합니다.

```typescript
// 기존 코드 (수정 전)
function createDietPlanRecord(
  userId: string,
  planDate: string,
  mealType: string,
  recipe: RecipeDetailForDiet,
  isUnified: boolean
) {
  return {
    user_id: userId,
    family_member_id: null,
    plan_date: planDate,
    meal_type: mealType,
    recipe_id: recipeId,
    recipe_title: recipeTitle,
    // ... 기타 필드
  };
}

// 수정 후 코드
function createDietPlanRecord(
  userId: string,
  planDate: string,
  mealType: string,
  recipe: RecipeDetailForDiet,
  isUnified: boolean,
  weeklyDietPlanId?: string // 새로 추가된 매개변수
) {
  return {
    user_id: userId,
    family_member_id: null,
    plan_date: planDate,
    meal_type: mealType,
    recipe_id: recipeId,
    recipe_title: recipeTitle,
    weekly_diet_plan_id: weeklyDietPlanId || null, // 새로 추가된 필드
    // ... 기타 필드
  };
}
```

**이유:**
- 주간 식단 생성 시 일일 식단들을 그룹화하여 관리할 수 있음
- 주간 식단 삭제 시 관련 일일 식단도 함께 삭제할 수 있음

---

### 5.2. 레시피 사용 이력에 recipe_id 저장

**파일**: `lib/diet/recipe-history.ts`

**수정 내용:**
레시피 사용 이력 저장 시 `recipe_id`도 함께 저장하도록 수정합니다.

```typescript
// 기존 코드 (수정 전)
export async function trackRecipeUsage(
  userId: string,
  recipeTitle: string,
  options: {
    mealType?: MealType;
    usedDate?: string;
  }
) {
  await supabase
    .from('recipe_usage_history')
    .insert({
      user_id: userId,
      recipe_title: recipeTitle,
      meal_type: options.mealType,
      used_date: options.usedDate || new Date().toISOString().split('T')[0],
    });
}

// 수정 후 코드
export async function trackRecipeUsage(
  userId: string,
  recipeTitle: string,
  options: {
    mealType?: MealType;
    usedDate?: string;
    recipeId?: string; // 새로 추가된 옵션
  }
) {
  // recipe_id가 제공된 경우 레시피 ID로 조회 시도
  let recipeId = options.recipeId;
  
  if (!recipeId && recipeTitle) {
    // recipe_title로 레시피 ID 조회 시도
    const { data: recipe } = await supabase
      .from('recipes')
      .select('id')
      .eq('title', recipeTitle)
      .maybeSingle();
    
    recipeId = recipe?.id || null;
  }

  await supabase
    .from('recipe_usage_history')
    .insert({
      user_id: userId,
      recipe_id: recipeId, // 새로 추가된 필드
      recipe_title: recipeTitle,
      meal_type: options.mealType,
      used_date: options.usedDate || new Date().toISOString().split('T')[0],
    });
}
```

**이유:**
- 레시피 제목 대신 레시피 ID로 직접 참조할 수 있어 데이터 무결성 향상
- 레시피 삭제 시 사용 이력도 함께 관리할 수 있음

---

### 5.3. 에러 핸들링 개선

**파일**: `app/api/diet/personal/route.ts`

**수정 내용:**
데이터 저장 실패 시 더 자세한 에러 메시지를 제공하도록 개선합니다.

```typescript
// 기존 코드 (수정 전)
if (insertError) {
  console.error("❌ 저장 실패:", insertError);
  return NextResponse.json(
    { 
      error: "Failed to save diet plan",
      details: insertError.message,
      code: insertError.code
    },
    { status: 500 }
  );
}

// 수정 후 코드
if (insertError) {
  console.error("❌ 저장 실패:", insertError);
  console.error("❌ 저장 오류 상세:", {
    code: insertError.code,
    message: insertError.message,
    details: insertError.details,
    hint: insertError.hint,
  });
  
  // 외래 키 제약조건 위반 시 사용자 친화적인 메시지 제공
  let errorMessage = insertError.message;
  if (insertError.code === '23503') { // Foreign key violation
    if (insertError.message.includes('recipe_id')) {
      errorMessage = '선택한 레시피를 찾을 수 없습니다. 레시피가 삭제되었을 수 있습니다.';
    } else if (insertError.message.includes('user_id')) {
      errorMessage = '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
    } else if (insertError.message.includes('family_member_id')) {
      errorMessage = '가족 구성원 정보를 찾을 수 없습니다.';
    }
  }
  
  return NextResponse.json(
    { 
      error: "식단 저장 실패",
      message: errorMessage,
      details: insertError.details,
      code: insertError.code,
      hint: insertError.hint,
    },
    { status: 500 }
  );
}
```

**이유:**
- 외래 키 제약조건 위반 시 사용자 친화적인 메시지 제공
- 개발 환경에서 디버깅을 위한 상세 정보 제공

---

## 6. 변경 사항 요약

### 6.1. 데이터베이스 변경 사항

| 테이블 | 변경 내용 | 이유 |
|--------|----------|------|
| `diet_plans` | `weekly_diet_plan_id` 컬럼 추가 | 주간 식단과 일일 식단 연결 |
| `recipe_usage_history` | `recipe_id` 컬럼 추가 | 레시피 ID로 직접 참조 |
| `favorite_meals` | `recipe_id` 외래 키 제약조건 추가 | 데이터 무결성 보장 |
| `meal_kits` | `created_by` 외래 키 제약조건 추가 | 관리자 추적 가능 |

---

### 6.2. 코드 변경 사항

| 파일 | 변경 내용 | 이유 |
|------|----------|------|
| `app/api/diet/personal/route.ts` | `weekly_diet_plan_id` 저장 로직 추가 | 주간 식단과 일일 식단 연결 |
| `lib/diet/recipe-history.ts` | `recipe_id` 저장 로직 추가 | 레시피 ID로 직접 참조 |
| `app/api/diet/personal/route.ts` | 에러 핸들링 개선 | 사용자 친화적인 에러 메시지 |

---

## 7. 실행 순서

1. **Supabase SQL Editor에서 SQL 마이그레이션 실행**
   - 위의 SQL 쿼리를 복사하여 실행
   - 검증 쿼리로 외래 키 제약조건 확인

2. **프론트엔드 코드 수정**
   - `app/api/diet/personal/route.ts` 수정
   - `lib/diet/recipe-history.ts` 수정

3. **테스트**
   - 식단 생성 테스트
   - 레시피 사용 이력 저장 테스트
   - 에러 핸들링 테스트

---

## 8. 참고 사항

### 8.1. 외래 키 삭제 정책 설명

- **CASCADE**: 부모 레코드 삭제 시 자식 레코드도 함께 삭제
  - 예: `users` 삭제 시 `user_health_profiles`도 함께 삭제
- **SET NULL**: 부모 레코드 삭제 시 자식 레코드의 외래 키를 NULL로 설정
  - 예: `recipes` 삭제 시 `diet_plans.recipe_id`를 NULL로 설정

### 8.2. 데이터 무결성

외래 키 제약조건을 통해 다음을 보장합니다:
- 존재하지 않는 레코드를 참조할 수 없음
- 부모 레코드 삭제 시 자식 레코드도 적절히 처리됨
- 데이터 일관성 유지

---

## 9. 질문 및 답변

**Q: 왜 `diet_plans.weekly_diet_plan_id`가 선택적(선택 사항)인가요?**
A: 일일 식단은 주간 식단 없이도 생성할 수 있어야 하기 때문입니다. 주간 식단 생성 시에만 연결됩니다.

**Q: `recipe_usage_history.recipe_id`가 NULL일 수 있나요?**
A: 네, 기존 데이터나 레시피 제목만 있는 경우 NULL일 수 있습니다. 점진적으로 레시피 ID를 채워나갈 수 있습니다.

**Q: 외래 키 제약조건을 추가하면 기존 데이터에 영향을 주나요?**
A: 기존 데이터가 제약조건을 위반하지 않는 한 문제없습니다. 위반하는 경우 마이그레이션 전에 데이터를 정리해야 합니다.

---

**문서 작성 완료일**: 2025-01-29  
**다음 검토일**: 마이그레이션 실행 후

