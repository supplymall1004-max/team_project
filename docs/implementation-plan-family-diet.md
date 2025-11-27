# 가족 맞춤 식단 추천 기능 구현 계획서

> **목표**: 회원가입 시 입력한 건강 정보를 바탕으로 가족 구성원별 맞춤 식단을 추천하고, 매일 오전 5시에 팝업으로 제공하는 기능

**작성일**: 2025년 1월  
**참고 문서**: [PRD.md](./PRD.md), [TODO.md](./TODO.md)

---

## 📋 목차

1. [데이터베이스 스키마 설계](#1-데이터베이스-스키마-설계)
2. [API 엔드포인트 설계](#2-api-엔드포인트-설계)
3. [알고리즘 로직 상세 설계](#3-알고리즘-로직-상세-설계)
4. [UI/UX 컴포넌트 설계](#4-uiux-컴포넌트-설계)
5. [크론 작업 설계](#5-크론-작업-설계)
6. [단계별 구현 순서](#6-단계별-구현-순서)

---

## 1. 데이터베이스 스키마 설계

### 1.1. 가족 구성원 테이블 (`family_members`)

```sql
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL, -- 가족의 주 사용자
    name TEXT NOT NULL, -- 구성원 이름
    age INTEGER, -- 나이
    gender TEXT CHECK (gender IN ('male', 'female', 'other')), -- 성별
    relationship TEXT, -- 관계 (본인, 배우자, 자녀 등, 선택적)
    -- 건강 정보 (user_health_profiles와 유사한 구조)
    height_cm INTEGER,
    weight_kg DECIMAL(5, 2),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    daily_calorie_goal INTEGER DEFAULT 2000,
    diseases TEXT[] DEFAULT '{}', -- 질병 정보 배열
    allergies TEXT[] DEFAULT '{}', -- 알레르기 정보 배열
    preferred_ingredients TEXT[] DEFAULT '{}',
    disliked_ingredients TEXT[] DEFAULT '{}',
    is_child BOOLEAN DEFAULT FALSE, -- 어린이 여부 (0-18세 자동 판단)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_is_child ON public.family_members(is_child);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.family_members TO anon, authenticated, service_role;
```

**설명**:
- `user_id`: 가족의 주 사용자 (본인)
- `is_child`: 나이가 0-18세이면 자동으로 `TRUE`로 설정
- 각 구성원별로 독립적인 건강 정보 보관

### 1.2. 질병별 제외 음식 테이블 (`disease_excluded_foods`)

```sql
CREATE TABLE IF NOT EXISTS public.disease_excluded_foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease TEXT NOT NULL CHECK (disease IN ('diabetes', 'hypertension', 'high_cholesterol', 'kidney_disease')),
    excluded_food_name TEXT NOT NULL, -- 제외할 음식명 (키워드)
    excluded_food_type TEXT, -- 제외 유형: 'ingredient' (재료), 'recipe_keyword' (레시피 키워드)
    description TEXT, -- 설명 (선택적)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(disease, excluded_food_name) -- 질병별로 동일한 음식명은 중복 불가
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_disease ON public.disease_excluded_foods(disease);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_name ON public.disease_excluded_foods(excluded_food_name);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.disease_excluded_foods DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.disease_excluded_foods TO anon, authenticated, service_role;
```

**초기 데이터 예시**:
```sql
-- 당뇨 제외 음식
INSERT INTO public.disease_excluded_foods (disease, excluded_food_name, excluded_food_type, description) VALUES
('diabetes', '설탕', 'ingredient', '고당류 음식'),
('diabetes', '꿀', 'ingredient', '고당류 음식'),
('diabetes', '시럽', 'ingredient', '고당류 음식'),
('diabetes', '당', 'recipe_keyword', '당이 많이 들어간 레시피'),
('diabetes', '초콜릿', 'ingredient', '고당류 음식'),
('diabetes', '케이크', 'recipe_keyword', '고당류 디저트'),
('diabetes', '과자', 'recipe_keyword', '고당류 간식');

-- 고혈압 제외 음식
INSERT INTO public.disease_excluded_foods (disease, excluded_food_name, excluded_food_type, description) VALUES
('hypertension', '소금', 'ingredient', '고염분 음식'),
('hypertension', '간장', 'ingredient', '고염분 음식'),
('hypertension', '된장', 'ingredient', '고염분 음식'),
('hypertension', '젓갈', 'recipe_keyword', '고염분 음식'),
('hypertension', '라면', 'recipe_keyword', '고염분 음식'),
('hypertension', '햄', 'ingredient', '고염분 가공식품'),
('hypertension', '베이컨', 'ingredient', '고염분 가공식품');
```

### 1.3. 가족 식단 테이블 (`family_diet_plans`)

```sql
CREATE TABLE IF NOT EXISTS public.family_diet_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL, -- 가족의 주 사용자
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE, -- NULL이면 통합 식단
    plan_date DATE NOT NULL, -- 식단 날짜
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    -- 영양소 정보 (스냅샷)
    calories INTEGER,
    carbohydrates DECIMAL(10, 2),
    protein DECIMAL(10, 2),
    fat DECIMAL(10, 2),
    sodium DECIMAL(10, 2),
    is_unified BOOLEAN DEFAULT FALSE, -- 통합 식단 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, family_member_id, plan_date, meal_type) -- 구성원별, 날짜별, 식사 유형별 유일
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_family_diet_plans_user_id ON public.family_diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_family_diet_plans_family_member_id ON public.family_diet_plans(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_diet_plans_plan_date ON public.family_diet_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_family_diet_plans_is_unified ON public.family_diet_plans(is_unified);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.family_diet_plans DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.family_diet_plans TO anon, authenticated, service_role;
```

**설명**:
- `family_member_id`가 NULL이면 통합 식단
- `is_unified` 플래그로 통합 식단 여부 명시

### 1.4. 식단 알림 설정 테이블 (`diet_notification_settings`)

```sql
CREATE TABLE IF NOT EXISTS public.diet_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    enable_popup BOOLEAN DEFAULT TRUE, -- 웹사이트 내 팝업 활성화
    enable_browser_notification BOOLEAN DEFAULT FALSE, -- 브라우저 알림 활성화
    notification_time TIME DEFAULT '05:00:00', -- 알림 시간 (기본 오전 5시)
    last_notification_date DATE, -- 마지막 알림 날짜 (중복 방지)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_diet_notification_settings_user_id ON public.diet_notification_settings(user_id);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.diet_notification_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.diet_notification_settings TO anon, authenticated, service_role;
```

---

## 2. API 엔드포인트 설계

### 2.1. 가족 구성원 관리 API

#### `GET /api/family/members`
- **설명**: 현재 사용자의 가족 구성원 목록 조회
- **인증**: 필요 (Clerk)
- **응답**:
```typescript
{
  members: FamilyMember[]
}
```

#### `POST /api/family/members`
- **설명**: 가족 구성원 추가
- **인증**: 필요
- **요청 본문**:
```typescript
{
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  relationship?: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: ActivityLevel | null;
  daily_calorie_goal?: number;
  diseases?: Disease[];
  allergies?: Allergy[];
  preferred_ingredients?: string[];
  disliked_ingredients?: string[];
}
```
- **응답**: 생성된 구성원 정보

#### `PUT /api/family/members/[id]`
- **설명**: 가족 구성원 정보 수정
- **인증**: 필요
- **요청 본문**: POST와 동일

#### `DELETE /api/family/members/[id]`
- **설명**: 가족 구성원 삭제
- **인증**: 필요

### 2.2. 가족 식단 추천 API

#### `POST /api/family/diet/generate`
- **설명**: 가족 식단 생성 (수동 트리거)
- **인증**: 필요
- **요청 본문**:
```typescript
{
  date: string; // YYYY-MM-DD
  generateUnified?: boolean; // 통합 식단 생성 여부
}
```
- **응답**:
```typescript
{
  individualPlans: {
    [memberId: string]: DailyDietPlan
  };
  unifiedPlan?: DailyDietPlan;
}
```

#### `GET /api/family/diet/[date]`
- **설명**: 특정 날짜의 가족 식단 조회
- **인증**: 필요
- **쿼리 파라미터**: `?unified=true` (통합 식단 포함 여부)
- **응답**: 위와 동일

### 2.3. 식단 알림 API

#### `GET /api/diet/notifications/check`
- **설명**: 오늘 식단 알림 표시 여부 확인
- **인증**: 필요
- **응답**:
```typescript
{
  shouldShow: boolean;
  hasDietPlan: boolean;
  lastNotificationDate: string | null;
}
```

#### `POST /api/diet/notifications/dismiss`
- **설명**: 오늘 알림 닫기 (중복 방지)
- **인증**: 필요

#### `PUT /api/diet/notifications/settings`
- **설명**: 알림 설정 업데이트
- **인증**: 필요
- **요청 본문**:
```typescript
{
  enable_popup?: boolean;
  enable_browser_notification?: boolean;
  notification_time?: string; // HH:mm:ss
}
```

### 2.4. 크론 작업 API (서버 전용)

#### `POST /api/cron/generate-daily-diets`
- **설명**: 매일 오전 5시에 실행되는 크론 작업
- **인증**: 서버 사이드 전용 (API 키 또는 환경 변수)
- **동작**:
  1. 모든 활성 사용자 조회
  2. 각 사용자의 가족 구성원 조회
  3. 오늘 날짜의 식단 생성
  4. 데이터베이스에 저장

---

## 3. 알고리즘 로직 상세 설계

### 3.1. 질병별 제외 음식 필터링

**파일**: `lib/diet/family-recommendation.ts` (신규 생성)

```typescript
/**
 * 질병별 제외 음식 목록 조회
 */
async function getExcludedFoods(disease: Disease): Promise<string[]> {
  const supabase = createClerkSupabaseClient();
  const { data } = await supabase
    .from('disease_excluded_foods')
    .select('excluded_food_name')
    .eq('disease', disease);
  
  return data?.map(item => item.excluded_food_name) || [];
}

/**
 * 레시피가 질병별 제외 음식을 포함하는지 확인
 */
async function isRecipeExcludedForDisease(
  recipe: RecipeWithNutrition,
  diseases: Disease[],
  excludedFoodsMap: Map<Disease, string[]>
): Promise<boolean> {
  // 레시피 재료 조회
  const ingredients = await getRecipeIngredients(recipe.id);
  const recipeText = [
    recipe.title,
    recipe.description || '',
    ...ingredients.map(ing => ing.name)
  ].join(' ').toLowerCase();

  // 각 질병별로 제외 음식 확인
  for (const disease of diseases) {
    const excludedFoods = excludedFoodsMap.get(disease) || [];
    for (const food of excludedFoods) {
      if (recipeText.includes(food.toLowerCase())) {
        console.log(`[FamilyDiet] 레시피 제외: ${recipe.title} (${disease}: ${food})`);
        return true;
      }
    }
  }

  return false;
}
```

### 3.2. 어린이 식단 추천 로직

```typescript
/**
 * 어린이 식단 추천 (0-18세)
 * 탄단지 비율: 탄수화물 50%, 단백질 20%, 지방 30%
 */
function recommendChildDiet(
  recipes: RecipeWithNutrition[],
  childProfile: FamilyMember,
  date: string
): DailyDietPlan {
  const targetRatios = {
    carbohydrates: 0.50, // 50%
    protein: 0.20,       // 20%
    fat: 0.30            // 30%
  };

  // 일일 칼로리 목표
  const dailyCalories = childProfile.daily_calorie_goal || 1800; // 어린이 기본 칼로리

  // 식사별 목표 칼로리
  const mealCalories = {
    breakfast: dailyCalories * 0.25, // 25%
    lunch: dailyCalories * 0.35,     // 35%
    dinner: dailyCalories * 0.30,    // 30%
    snack: dailyCalories * 0.10      // 10%
  };

  // 호환되는 레시피 필터링
  const compatibleRecipes = recipes.filter(recipe => 
    isRecipeCompatibleForChild(recipe, childProfile)
  );

  // 각 식사별로 영양소 비율을 고려한 레시피 선택
  const recommendations = selectRecipesByNutritionRatio(
    compatibleRecipes,
    mealCalories,
    targetRatios
  );

  return {
    date,
    breakfast: recommendations.breakfast,
    lunch: recommendations.lunch,
    dinner: recommendations.dinner,
    snack: recommendations.snack,
    totalNutrition: calculateTotalNutrition(recommendations)
  };
}

/**
 * 영양소 비율을 고려한 레시피 선택
 */
function selectRecipesByNutritionRatio(
  recipes: RecipeWithNutrition[],
  mealCalories: Record<MealType, number>,
  targetRatios: { carbohydrates: number; protein: number; fat: number }
): Record<MealType, RecipeWithNutrition | null> {
  // 구현 로직:
  // 1. 각 식사별로 칼로리 범위에 맞는 레시피 필터링
  // 2. 영양소 비율이 목표에 가까운 레시피에 높은 점수 부여
  // 3. 최고 점수 레시피 선택
}
```

### 3.3. 복합 가족 식단 생성 로직

```typescript
/**
 * 복합 가족 식단 생성
 * - 각 구성원별 개인 식단 생성
 * - 통합 식단 생성 (모든 구성원의 제약 조건을 만족)
 */
async function generateFamilyDiet(
  userId: string,
  date: string,
  options: { generateUnified: boolean } = { generateUnified: true }
): Promise<{
  individualPlans: Record<string, DailyDietPlan>;
  unifiedPlan?: DailyDietPlan;
}> {
  // 1. 가족 구성원 조회
  const familyMembers = await getFamilyMembers(userId);
  
  // 2. 레시피 목록 조회
  const recipes = await getRecipesWithNutrition();
  
  // 3. 질병별 제외 음식 목록 조회 (캐싱)
  const excludedFoodsMap = await buildExcludedFoodsMap(familyMembers);
  
  // 4. 각 구성원별 개인 식단 생성
  const individualPlans: Record<string, DailyDietPlan> = {};
  
  for (const member of familyMembers) {
    if (member.is_child) {
      // 어린이 식단
      individualPlans[member.id] = recommendChildDiet(recipes, member, date);
    } else {
      // 일반 식단 (기존 로직 활용)
      individualPlans[member.id] = await recommendDailyDietForMember(
        recipes,
        member,
        date,
        excludedFoodsMap
      );
    }
  }
  
  // 5. 통합 식단 생성 (옵션)
  let unifiedPlan: DailyDietPlan | undefined;
  if (options.generateUnified) {
    unifiedPlan = await generateUnifiedDiet(
      recipes,
      familyMembers,
      date,
      excludedFoodsMap
    );
  }
  
  return { individualPlans, unifiedPlan };
}

/**
 * 통합 식단 생성 (모든 구성원의 제약 조건을 만족하는 레시피만)
 */
async function generateUnifiedDiet(
  recipes: RecipeWithNutrition[],
  familyMembers: FamilyMember[],
  date: string,
  excludedFoodsMap: Map<Disease, string[]>
): Promise<DailyDietPlan> {
  // 모든 구성원의 제약 조건을 통과하는 레시피만 필터링
  const unifiedCompatibleRecipes = recipes.filter(recipe => {
    for (const member of familyMembers) {
      if (!isRecipeCompatibleForMember(recipe, member, excludedFoodsMap)) {
        return false;
      }
    }
    return true;
  });
  
  // 통합 식단은 평균 칼로리 목표 사용
  const avgCalorieGoal = familyMembers.reduce(
    (sum, m) => sum + (m.daily_calorie_goal || 2000),
    0
  ) / familyMembers.length;
  
  // 일반 식단 추천 로직 사용 (평균 칼로리 목표)
  const healthProfile: UserHealthProfile = {
    daily_calorie_goal: avgCalorieGoal,
    diseases: [],
    allergies: [],
    preferred_ingredients: [],
    disliked_ingredients: []
  };
  
  return await recommendDailyDiet(
    unifiedCompatibleRecipes,
    healthProfile,
    date
  );
}
```

---

## 4. UI/UX 컴포넌트 설계

### 4.1. 가족 구성원 관리 페이지

**경로**: `/health/family`

**컴포넌트 구조**:
```
app/health/family/
  page.tsx (서버 컴포넌트)
  components/
    family-member-list.tsx (가족 구성원 목록)
    family-member-form.tsx (추가/수정 폼)
    family-member-card.tsx (구성원 카드)
```

**주요 기능**:
- 가족 구성원 목록 표시 (카드 형식)
- "구성원 추가" 버튼
- 각 구성원 카드에 "수정", "삭제" 버튼
- 나이 입력 시 자동으로 `is_child` 판단 (0-18세)

### 4.2. 식단 알림 팝업 컴포넌트

**컴포넌트**: `components/diet/diet-notification-popup.tsx`

**기능**:
- 웹사이트 내 모달 팝업
- 오늘의 식단 표시 (아침/점심/저녁)
- "닫기" 버튼 (오늘 하루 보지 않기)
- "식단 보기" 버튼 (상세 페이지로 이동)

**트리거 조건**:
- 사용자 로그인 상태
- 오전 5시 이후
- 오늘 식단이 생성되어 있음
- 오늘 알림을 아직 보지 않음

### 4.3. 가족 식단 표시 페이지

**경로**: `/health/family/diet/[date]`

**컴포넌트 구조**:
```
app/health/family/diet/[date]/
  page.tsx
  components/
    family-diet-view.tsx (메인 뷰)
    individual-diet-tabs.tsx (구성원별 탭)
    unified-diet-section.tsx (통합 식단 섹션)
    diet-meal-card.tsx (식사 카드)
```

**주요 기능**:
- 구성원별 탭으로 개인 식단 표시
- 통합 식단 섹션 (별도 표시)
- 각 식사별 레시피 카드 (이미지, 제목, 영양 정보)
- "레시피 보기" 링크

### 4.4. 알림 설정 페이지

**경로**: `/health/family/notifications`

**기능**:
- 팝업 알림 활성화/비활성화 토글
- 브라우저 알림 권한 요청 및 활성화/비활성화
- 알림 시간 설정 (기본: 오전 5시)

---

## 5. 크론 작업 설계

### 5.1. Supabase Edge Functions 사용 (권장)

**파일**: `supabase/functions/generate-daily-diets/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // API 키 검증 (환경 변수)
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 오늘 날짜
  const today = new Date().toISOString().split("T")[0];

  // 모든 활성 사용자 조회
  const { data: users } = await supabase
    .from("users")
    .select("id");

  if (!users) {
    return new Response(JSON.stringify({ error: "No users found" }), {
      status: 500,
    });
  }

  // 각 사용자별로 식단 생성
  for (const user of users) {
    try {
      // 가족 구성원 조회
      const { data: members } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", user.id);

      if (!members || members.length === 0) {
        // 가족 구성원이 없으면 본인 건강 정보로 식단 생성 (기존 로직)
        await generateUserDiet(user.id, today);
      } else {
        // 가족 식단 생성
        await generateFamilyDietForUser(user.id, today, members);
      }
    } catch (error) {
      console.error(`Error generating diet for user ${user.id}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ message: "Daily diets generated successfully" }),
    { status: 200 }
  );
});
```

### 5.2. 크론 스케줄 설정

**Supabase Dashboard** 또는 **외부 크론 서비스** (예: GitHub Actions, Vercel Cron) 사용

**스케줄**: 매일 오전 5시 (KST)
- GitHub Actions: `0 20 * * *` (UTC 20:00 = KST 05:00)
- Vercel Cron: `0 5 * * *` (KST 기준)

### 5.3. 대안: Next.js API Route + 외부 크론

**파일**: `app/api/cron/generate-daily-diets/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // API 키 검증
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 식단 생성 로직 실행
  // ...
  
  return NextResponse.json({ message: "Success" });
}
```

---

## 6. 단계별 구현 순서

### Phase 1: 데이터베이스 스키마 구축 (1-2일)

1. ✅ 마이그레이션 파일 생성
   - `supabase/migrations/YYYYMMDDHHmmss_create_family_diet_tables.sql`
   - 가족 구성원 테이블
   - 질병별 제외 음식 테이블
   - 가족 식단 테이블
   - 식단 알림 설정 테이블

2. ✅ 초기 데이터 삽입
   - 당뇨 제외 음식 목록
   - 고혈압 제외 음식 목록

3. ✅ 마이그레이션 실행 및 테스트

### Phase 2: 타입 정의 및 유틸리티 함수 (1일)

1. ✅ `types/family.ts` 생성
   - `FamilyMember` 인터페이스
   - `FamilyDietPlan` 인터페이스

2. ✅ `lib/diet/family-queries.ts` 생성
   - 가족 구성원 CRUD 함수
   - 가족 식단 조회 함수

### Phase 3: 알고리즘 로직 구현 (2-3일)

1. ✅ `lib/diet/family-recommendation.ts` 생성
   - 질병별 제외 음식 필터링 함수
   - 어린이 식단 추천 함수
   - 복합 가족 식단 생성 함수

2. ✅ 기존 `lib/diet/recommendation.ts` 확장
   - 가족 구성원용 호환성 검사 함수 추가

3. ✅ 테스트 및 디버깅

### Phase 4: API 엔드포인트 구현 (2일)

1. ✅ `app/api/family/members/route.ts` (GET, POST)
2. ✅ `app/api/family/members/[id]/route.ts` (PUT, DELETE)
3. ✅ `app/api/family/diet/generate/route.ts` (POST)
4. ✅ `app/api/family/diet/[date]/route.ts` (GET)
5. ✅ `app/api/diet/notifications/check/route.ts` (GET)
6. ✅ `app/api/diet/notifications/settings/route.ts` (PUT)

### Phase 5: UI 컴포넌트 구현 (3-4일)

1. ✅ 가족 구성원 관리 페이지
   - 목록 표시
   - 추가/수정 폼
   - 삭제 기능

2. ✅ 식단 알림 팝업 컴포넌트
   - 모달 컴포넌트
   - 식단 카드 표시
   - 닫기 기능

3. ✅ 가족 식단 표시 페이지
   - 구성원별 탭
   - 통합 식단 섹션
   - 레시피 카드

4. ✅ 알림 설정 페이지

### Phase 6: 크론 작업 구현 (1-2일)

1. ✅ Supabase Edge Function 또는 Next.js API Route 생성
2. ✅ 크론 스케줄 설정
3. ✅ 테스트 (수동 트리거)

### Phase 7: 통합 테스트 및 최적화 (2일)

1. ✅ 전체 플로우 테스트
2. ✅ 성능 최적화
3. ✅ 에러 처리 개선
4. ✅ 로그 추가

---

## 7. 주요 고려사항

### 7.1. 성능 최적화

- **캐싱**: 질병별 제외 음식 목록은 자주 변경되지 않으므로 캐싱
- **배치 처리**: 크론 작업 시 사용자별로 순차 처리 (병렬 처리 시 리소스 고려)
- **인덱스**: 데이터베이스 인덱스 최적화

### 7.2. 에러 처리

- 가족 구성원이 없을 때: 본인 건강 정보로 식단 생성 (기존 로직)
- 레시피가 부족할 때: 최소한의 필터링만 적용하여 추천
- 크론 작업 실패: 로그 기록 및 재시도 메커니즘

### 7.3. 보안

- 크론 작업 API 키 검증 필수
- 가족 구성원 정보는 본인만 조회/수정 가능
- 건강 정보 암호화 (Post-MVP)

### 7.4. 사용자 경험

- 팝업 알림은 사용자가 설정으로 비활성화 가능
- 브라우저 알림은 권한 요청 후 사용
- 식단이 없을 때 안내 메시지 표시

---

## 8. 테스트 체크리스트

### 8.1. 기능 테스트

- [ ] 가족 구성원 추가/수정/삭제
- [ ] 개인 식단 생성 (당뇨, 고혈압, 어린이 각각)
- [ ] 통합 식단 생성 (복합 가족)
- [ ] 질병별 제외 음식 필터링 동작 확인
- [ ] 어린이 식단 영양소 비율 확인
- [ ] 팝업 알림 표시/숨김
- [ ] 크론 작업 정상 실행

### 8.2. 엣지 케이스

- [ ] 가족 구성원이 없을 때
- [ ] 레시피가 부족할 때
- [ ] 모든 구성원이 다른 질병을 가질 때
- [ ] 브라우저 알림 권한 거부 시

---

**마지막 업데이트**: 2025년 1월  
**예상 개발 기간**: 약 2주 (단계별로 진행)

