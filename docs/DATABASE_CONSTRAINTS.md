# 데이터베이스 제약조건 설명서

이 문서는 `supabase/migrations/20250101000000_complete_schema.sql`에 설정된 모든 제약조건을 설명합니다.

---

## 1. CASCADE 제약조건 (외래키 삭제 정책)

CASCADE 제약조건은 부모 테이블의 레코드가 삭제될 때 자식 테이블의 관련 레코드를 자동으로 삭제하는 정책입니다.

### 1.1. ON DELETE CASCADE (자식 레코드 자동 삭제)

**설정된 테이블:**

```sql
-- 사용자 관련
user_health_profiles.user_id → users.id ON DELETE CASCADE
family_members.user_id → users.id ON DELETE CASCADE
subscriptions.user_id → users.id ON DELETE CASCADE
user_subscriptions.user_id → users.id ON DELETE CASCADE
diet_notification_settings.user_id → users.id ON DELETE CASCADE
diet_plans.user_id → users.id ON DELETE CASCADE
weekly_diet_plans.user_id → users.id ON DELETE CASCADE
recipe_usage_history.user_id → users.id ON DELETE CASCADE
recipe_reports.user_id → users.id ON DELETE CASCADE
payment_transactions.user_id → users.id ON DELETE CASCADE
promo_code_uses.user_id → users.id ON DELETE CASCADE
favorite_meals.user_id → users.id ON DELETE CASCADE

-- 레시피 관련
recipe_ingredients.recipe_id → recipes.id ON DELETE CASCADE
recipe_steps.recipe_id → recipes.id ON DELETE CASCADE
recipe_ratings.recipe_id → recipes.id ON DELETE CASCADE
recipe_ratings.user_id → users.id ON DELETE CASCADE
recipe_reports.recipe_id → recipes.id ON DELETE CASCADE

-- 식단 관련
weekly_shopping_lists.weekly_diet_plan_id → weekly_diet_plans.id ON DELETE CASCADE
weekly_nutrition_stats.weekly_diet_plan_id → weekly_diet_plans.id ON DELETE CASCADE

-- 건강 관리 관련
allergy_derived_ingredients.allergy_code → allergies.code ON DELETE CASCADE
disease_excluded_foods_extended.disease_code → diseases.code ON DELETE CASCADE
emergency_procedures.allergy_code → allergies.code ON DELETE CASCADE

-- 결제 관련
promo_code_uses.promo_code_id → promo_codes.id ON DELETE CASCADE
```

**설명:**
- 사용자가 삭제되면 해당 사용자의 건강 프로필, 가족 구성원, 구독 정보, 식단 계획 등 모든 관련 데이터가 자동으로 삭제됩니다.
- 레시피가 삭제되면 해당 레시피의 재료, 단계, 평가, 신고가 모두 삭제됩니다.
- 주간 식단 계획이 삭제되면 장보기 리스트와 영양 통계가 함께 삭제됩니다.
- 알레르기나 질병이 삭제되면 관련 파생 재료, 제외 음식, 응급조치 정보가 삭제됩니다.

### 1.2. ON DELETE SET NULL (외래키 NULL 설정)

**설정된 테이블:**

```sql
-- 사용자 삭제 시 NULL로 설정
recipes.user_id → users.id ON DELETE SET NULL
diet_plans.family_member_id → family_members.id ON DELETE SET NULL
recipe_usage_history.family_member_id → family_members.id ON DELETE SET NULL
favorite_meals.recipe_id → recipes.id ON DELETE SET NULL

-- 기타
legacy_videos.master_id → legacy_masters.id ON DELETE SET NULL
legacy_documents.video_id → legacy_videos.id ON DELETE SET NULL
payment_transactions.subscription_id → subscriptions.id ON DELETE SET NULL
promo_code_uses.subscription_id → subscriptions.id ON DELETE SET NULL
promo_codes.created_by → users.id ON DELETE SET NULL
meal_kits.created_by → users.id ON DELETE SET NULL
```

**설명:**
- 사용자가 삭제되어도 레시피는 유지되지만 작성자 정보는 NULL로 설정됩니다.
- 가족 구성원이 삭제되면 식단 계획의 가족 구성원 ID만 NULL로 설정되고 식단은 유지됩니다.
- 레시피가 삭제되어도 즐겨찾기는 유지되지만 레시피 ID는 NULL로 설정됩니다.

---

## 2. UNIQUE 제약조건 (고유값 제약)

UNIQUE 제약조건은 특정 컬럼 또는 컬럼 조합의 값이 중복되지 않도록 보장합니다.

### 2.1. 단일 컬럼 UNIQUE

```sql
-- 사용자 관련
users.clerk_id UNIQUE
user_health_profiles.user_id UNIQUE
user_subscriptions.user_id UNIQUE
diet_notification_settings.user_id UNIQUE

-- 레시피 관련
recipes.slug UNIQUE
legacy_videos.slug UNIQUE
royal_recipes_posts.slug UNIQUE
foodsafety_recipes_cache.rcp_seq UNIQUE

-- 건강 관리 관련
diseases.code UNIQUE
allergies.code UNIQUE
calorie_calculation_formulas.formula_name UNIQUE

-- 결제 관련
promo_codes.code UNIQUE
payment_transactions.pg_transaction_id UNIQUE
meal_kit_products.coupang_product_id UNIQUE

-- 기타
image_cache_stats.stat_date UNIQUE
```

**설명:**
- `users.clerk_id`: 각 Clerk 사용자 ID는 고유해야 합니다.
- `recipes.slug`: 레시피 URL 슬러그는 중복될 수 없습니다.
- `diseases.code`, `allergies.code`: 질병/알레르기 코드는 고유해야 합니다.
- `promo_codes.code`: 프로모션 코드는 중복될 수 없습니다.

### 2.2. 복합 컬럼 UNIQUE (여러 컬럼 조합)

```sql
-- 주간 식단 계획
weekly_diet_plans(user_id, week_year, week_number) UNIQUE

-- 프로모션 코드 사용
promo_code_uses(promo_code_id, user_id) UNIQUE

-- 레시피 평가
recipe_ratings(recipe_id, user_id) UNIQUE

-- 즐겨찾기 식사
favorite_meals(user_id, recipe_id) UNIQUE

-- 관리자 카피 블록
admin_copy_blocks(slug, locale) UNIQUE
```

**설명:**
- `weekly_diet_plans(user_id, week_year, week_number)`: 한 사용자는 같은 주차에 하나의 주간 식단만 가질 수 있습니다.
- `recipe_ratings(recipe_id, user_id)`: 한 사용자는 같은 레시피에 하나의 평가만 할 수 있습니다.
- `favorite_meals(user_id, recipe_id)`: 한 사용자는 같은 레시피를 즐겨찾기에 한 번만 추가할 수 있습니다.
- `admin_copy_blocks(slug, locale)`: 같은 슬롯과 로케일 조합은 하나만 존재할 수 있습니다.

---

## 3. INDEX (인덱스)

인덱스는 데이터베이스 쿼리 성능을 향상시키기 위해 자주 검색되는 컬럼에 생성됩니다.

### 3.1. 사용자 관련 인덱스

```sql
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_user_health_profiles_user_id ON user_health_profiles(user_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_birth_date ON family_members(birth_date);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
```

**설명:**
- `idx_users_clerk_id`: Clerk ID로 사용자 조회 시 성능 향상
- `idx_family_members_birth_date`: 가족 구성원의 생년월일로 나이 계산 및 어린이 필터링 시 성능 향상
- `idx_subscriptions_status`: 활성 구독자 조회 시 성능 향상

### 3.2. 레시피 관련 인덱스

```sql
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_title ON recipes(title);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(name);
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user_id ON recipe_ratings(user_id);
CREATE INDEX idx_recipe_ratings_rating ON recipe_ratings(rating);
CREATE INDEX idx_recipe_reports_recipe_id ON recipe_reports(recipe_id);
CREATE INDEX idx_recipe_reports_user_id ON recipe_reports(user_id);
CREATE INDEX idx_recipe_reports_status ON recipe_reports(status);
CREATE INDEX idx_recipe_usage_history_user_id ON recipe_usage_history(user_id);
CREATE INDEX idx_recipe_usage_history_used_date ON recipe_usage_history(used_date);
```

**설명:**
- `idx_recipes_title`: 레시피 제목 검색 시 성능 향상
- `idx_recipes_created_at`: 최신 레시피 조회 시 성능 향상
- `idx_recipes_difficulty`: 난이도별 필터링 시 성능 향상
- `idx_recipe_ingredients_name`: 재료명으로 레시피 검색 시 성능 향상
- `idx_recipe_ratings_rating`: 평점별 정렬 시 성능 향상
- `idx_recipe_usage_history_used_date`: 날짜별 사용 이력 조회 시 성능 향상

### 3.3. 식단 관련 인덱스

```sql
CREATE INDEX idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX idx_diet_plans_family_member_id ON diet_plans(family_member_id);
CREATE INDEX idx_diet_plans_plan_date ON diet_plans(plan_date);
CREATE INDEX idx_diet_plans_meal_type ON diet_plans(meal_type);
CREATE INDEX idx_weekly_diet_plans_user_id ON weekly_diet_plans(user_id);
CREATE INDEX idx_weekly_diet_plans_week ON weekly_diet_plans(week_year, week_number);
CREATE INDEX idx_weekly_diet_plans_week_start_date ON weekly_diet_plans(week_start_date);
CREATE INDEX idx_weekly_shopping_lists_weekly_diet_plan_id ON weekly_shopping_lists(weekly_diet_plan_id);
CREATE INDEX idx_weekly_nutrition_stats_weekly_diet_plan_id ON weekly_nutrition_stats(weekly_diet_plan_id);
CREATE INDEX idx_weekly_nutrition_stats_date ON weekly_nutrition_stats(date);
CREATE INDEX idx_diet_notification_settings_user_id ON diet_notification_settings(user_id);
```

**설명:**
- `idx_diet_plans_plan_date`: 특정 날짜의 식단 조회 시 성능 향상
- `idx_diet_plans_meal_type`: 식사 타입별 필터링 시 성능 향상
- `idx_weekly_diet_plans_week`: 주차별 주간 식단 조회 시 성능 향상
- `idx_weekly_nutrition_stats_date`: 날짜별 영양 통계 조회 시 성능 향상

### 3.4. 건강 관리 관련 인덱스

```sql
CREATE INDEX idx_diseases_code ON diseases(code);
CREATE INDEX idx_allergies_code ON allergies(code);
CREATE INDEX idx_allergy_derived_ingredients_allergy_code ON allergy_derived_ingredients(allergy_code);
CREATE INDEX idx_disease_excluded_foods_extended_disease_code ON disease_excluded_foods_extended(disease_code);
CREATE INDEX idx_emergency_procedures_allergy_code ON emergency_procedures(allergy_code);
CREATE INDEX idx_calorie_calculation_formulas_formula_name ON calorie_calculation_formulas(formula_name);
```

**설명:**
- `idx_diseases_code`, `idx_allergies_code`: 질병/알레르기 코드로 조회 시 성능 향상
- `idx_allergy_derived_ingredients_allergy_code`: 알레르기별 파생 재료 조회 시 성능 향상
- `idx_disease_excluded_foods_extended_disease_code`: 질병별 제외 음식 조회 시 성능 향상

### 3.5. 레거시 관련 인덱스

```sql
CREATE INDEX idx_legacy_videos_master_id ON legacy_videos(master_id);
CREATE INDEX idx_legacy_videos_slug ON legacy_videos(slug);
CREATE INDEX idx_legacy_videos_era ON legacy_videos(era);
CREATE INDEX idx_legacy_videos_region ON legacy_videos(region);
CREATE INDEX idx_legacy_documents_video_id ON legacy_documents(video_id);
CREATE INDEX idx_royal_recipes_posts_slug ON royal_recipes_posts(slug);
CREATE INDEX idx_royal_recipes_posts_era ON royal_recipes_posts(era);
CREATE INDEX idx_royal_recipes_posts_published ON royal_recipes_posts(published);
```

**설명:**
- `idx_legacy_videos_era`, `idx_legacy_videos_region`: 시대/지역별 필터링 시 성능 향상
- `idx_royal_recipes_posts_published`: 발행된 포스트만 조회 시 성능 향상

### 3.6. 결제 관련 인덱스

```sql
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_pg_transaction_id ON payment_transactions(pg_transaction_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_code_uses_promo_code_id ON promo_code_uses(promo_code_id);
CREATE INDEX idx_promo_code_uses_user_id ON promo_code_uses(user_id);
```

**설명:**
- `idx_payment_transactions_status`: 거래 상태별 조회 시 성능 향상
- `idx_payment_transactions_pg_transaction_id`: PG사 거래 ID로 조회 시 성능 향상
- `idx_promo_codes_code`: 프로모션 코드로 조회 시 성능 향상

### 3.7. 관리자 관련 인덱스

```sql
CREATE INDEX idx_admin_copy_blocks_slug ON admin_copy_blocks(slug);
CREATE INDEX idx_admin_copy_blocks_slug_locale ON admin_copy_blocks(slug, locale);
CREATE INDEX idx_popup_announcements_status ON popup_announcements(status);
CREATE INDEX idx_popup_announcements_active_from ON popup_announcements(active_from);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_triggered_at ON notification_logs(triggered_at);
CREATE INDEX idx_admin_security_audit_user_id ON admin_security_audit(user_id);
CREATE INDEX idx_admin_security_audit_action ON admin_security_audit(action);
CREATE INDEX idx_admin_security_audit_created_at ON admin_security_audit(created_at);
```

**설명:**
- `idx_popup_announcements_status`: 공지 상태별 조회 시 성능 향상
- `idx_popup_announcements_active_from`: 활성화 기간별 조회 시 성능 향상
- `idx_notification_logs_triggered_at`: 알림 발생 시간별 조회 시 성능 향상
- `idx_admin_security_audit_action`: 보안 액션별 조회 시 성능 향상

---

## 4. CHECK 제약조건 (값 범위 제한)

CHECK 제약조건은 컬럼에 입력될 수 있는 값을 제한합니다.

### 4.1. 열거형 값 제한 (ENUM 대신 CHECK 사용)

```sql
-- 알레르기 심각도
allergies.severity_level CHECK (severity_level IN ('high', 'medium', 'low'))

-- 구독 상태
subscriptions.status CHECK (status IN ('active', 'inactive', 'cancelled', 'paused'))

-- 사용자 구독 플랜
user_subscriptions.subscription_plan CHECK (subscription_plan IN ('free', 'single', 'premium', 'enterprise'))

-- 성별
user_health_profiles.gender CHECK (gender IN ('male', 'female', 'other'))
family_members.gender CHECK (gender IN ('male', 'female', 'other'))
calorie_calculation_formulas.gender CHECK (gender IN ('male', 'female', 'all'))

-- 활동 수준
user_health_profiles.activity_level CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'))
family_members.activity_level CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'))

-- 식사 타입
diet_plans.meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
recipe_usage_history.meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
favorite_meals.meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))

-- 레시피 난이도
recipes.difficulty CHECK (difficulty BETWEEN 1 AND 5)

-- 레시피 평가 점수
recipe_ratings.rating CHECK (rating >= 0 AND rating <= 5)

-- 레시피 신고 유형
recipe_reports.report_type CHECK (report_type IN ('inappropriate', 'copyright', 'spam', 'other'))

-- 레시피 신고 상태
recipe_reports.status CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed'))

-- 프로모션 코드 할인 유형
promo_codes.discount_type CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial'))

-- 결제 거래 상태
payment_transactions.status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))

-- 결제 거래 유형
payment_transactions.transaction_type CHECK (transaction_type IN ('subscription', 'one_time', 'refund'))

-- 질병관리청 알림 심각도
kcdc_alerts.severity CHECK (severity IN ('info', 'warning', 'critical'))

-- 팝업 공지 상태
popup_announcements.status CHECK (status IN ('draft', 'published', 'archived'))

-- 팝업 공지 표시 유형
popup_announcements.display_type CHECK (display_type IN ('modal', 'checkpoint'))

-- 질병 제외 식품 심각도
disease_excluded_foods_extended.severity CHECK (severity IN ('high', 'medium', 'low'))

-- 주간 영양 통계 요일
weekly_nutrition_stats.day_of_week CHECK (day_of_week BETWEEN 0 AND 6)

-- 이미지 사용 로그 소스 타입
image_usage_logs.source_type CHECK (source_type IN ('static', 'gemini', 'placeholder'))

-- 관리자 보안 감사 액션
admin_security_audit.action CHECK (action IN ('password-change', 'mfa-enable', 'mfa-disable', 'session-revoke', 'admin-access'))

-- 알림 로그 타입
notification_logs.type CHECK (type IN ('kcdc', 'diet-popup', 'system'))

-- 알림 로그 상태
notification_logs.status CHECK (status IN ('success', 'failed', 'pending'))

-- 밀키트 상품 동기화 상태
meal_kit_products.sync_status CHECK (sync_status IN ('success', 'failed', 'pending'))

-- 시대 (레거시)
legacy_videos.era CHECK (era IN ('goryeo', 'joseon', 'three_kingdoms'))
royal_recipes_posts.era CHECK (era IN ('goryeo', 'joseon', 'three_kingdoms'))
legacy_documents.era CHECK (era IN ('goryeo', 'joseon', 'three_kingdoms'))
```

**설명:**
- `severity_level`: 알레르기 심각도는 'high', 'medium', 'low' 중 하나만 허용
- `status`: 구독/결제/공지 상태는 미리 정의된 값만 허용
- `gender`: 성별은 'male', 'female', 'other' 중 하나만 허용
- `activity_level`: 활동 수준은 5단계 중 하나만 허용
- `meal_type`: 식사 타입은 'breakfast', 'lunch', 'dinner', 'snack' 중 하나만 허용
- `difficulty`: 레시피 난이도는 1~5 사이의 정수만 허용
- `rating`: 레시피 평가 점수는 0~5 사이의 값만 허용
- `day_of_week`: 요일은 0(일요일)~6(토요일) 사이의 정수만 허용

---

## 5. 트리거 (Trigger)

트리거는 특정 이벤트 발생 시 자동으로 실행되는 함수입니다.

### 5.1. updated_at 자동 업데이트 트리거

**함수:**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**설명:**
- 레코드가 업데이트될 때마다 `updated_at` 컬럼을 현재 시간으로 자동 업데이트합니다.
- 다음 테이블에 적용됩니다:
  - `diseases`, `allergies`, `user_health_profiles`, `family_members`
  - `subscriptions`, `user_subscriptions`, `recipes`, `recipe_ingredients`
  - `weekly_diet_plans`, `recipe_reports`, `emergency_procedures`
  - `admin_copy_blocks`, `kcdc_alerts`, `meal_kits`, `royal_recipes_posts`
  - `diet_notification_settings`, `calorie_calculation_formulas`
  - `payment_transactions`, `meal_kit_products`, `popup_announcements`
  - `disease_excluded_foods_extended`, `image_cache_stats`
  - `recipe_ratings`, `favorite_meals`, `foodsafety_recipes_cache`

### 5.2. 가족 구성원 제한 트리거

**함수:**

```sql
CREATE OR REPLACE FUNCTION check_family_member_limit()
RETURNS TRIGGER AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO member_count
    FROM family_members
    WHERE user_id = NEW.user_id;
    
    IF member_count >= 10 THEN
        RAISE EXCEPTION '사용자당 최대 10명의 가족 구성원만 등록할 수 있습니다.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**설명:**
- 사용자당 최대 10명의 가족 구성원만 등록할 수 있도록 제한합니다.
- `family_members` 테이블에 INSERT 시 자동으로 실행됩니다.

---

## 6. RLS (Row Level Security) 비활성화

**설명:**
- MVP 개발 환경을 위해 모든 테이블의 RLS를 비활성화했습니다.
- 프로덕션 배포 전에는 적절한 RLS 정책을 설정해야 합니다.

**비활성화된 테이블:**
- 모든 테이블 (총 47개)

---

## 요약

### CASCADE 제약조건
- **ON DELETE CASCADE**: 30개 외래키 관계
- **ON DELETE SET NULL**: 11개 외래키 관계

### UNIQUE 제약조건
- **단일 컬럼 UNIQUE**: 15개
- **복합 컬럼 UNIQUE**: 5개

### INDEX
- **총 70개 인덱스** 생성
- 자주 검색되는 컬럼, 외래키, 날짜 필드에 인덱스 적용

### CHECK 제약조건
- **총 30개 CHECK 제약조건**
- 열거형 값, 범위 값, 상태 값 제한

### 트리거
- **updated_at 자동 업데이트**: 24개 테이블
- **가족 구성원 제한**: 1개 트리거

---

이 문서는 데이터베이스 스키마의 제약조건을 이해하는 데 도움이 됩니다.



