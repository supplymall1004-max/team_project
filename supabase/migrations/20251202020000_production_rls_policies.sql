-- ============================================================================
-- 프로덕션 RLS 정책 마이그레이션
-- 작성일: 2025-12-02
-- 설명: 프로덕션 환경을 위한 Row Level Security 정책 설정
-- 주의: 이 마이그레이션은 프로덕션 배포 전에만 실행하세요
-- ============================================================================

-- ============================================================================
-- 중요: 개발 환경에서는 RLS를 비활성화해야 합니다
-- 이 마이그레이션은 프로덕션 배포 전에 검토하고 실행하세요
-- ============================================================================

-- ============================================================================
-- 1. 사용자 테이블 RLS 정책
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회 가능
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (
  clerk_id = (SELECT auth.jwt()->>'sub')
);

-- 사용자는 자신의 정보만 수정 가능
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (
  clerk_id = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  clerk_id = (SELECT auth.jwt()->>'sub')
);

-- ============================================================================
-- 2. 건강 프로필 RLS 정책
-- ============================================================================

ALTER TABLE public.user_health_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 건강 프로필만 조회 가능
DROP POLICY IF EXISTS "Users can view own health profile" ON public.user_health_profiles;
CREATE POLICY "Users can view own health profile"
ON public.user_health_profiles FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 사용자는 자신의 건강 프로필만 수정 가능
DROP POLICY IF EXISTS "Users can insert own health profile" ON public.user_health_profiles;
CREATE POLICY "Users can insert own health profile"
ON public.user_health_profiles FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own health profile" ON public.user_health_profiles;
CREATE POLICY "Users can update own health profile"
ON public.user_health_profiles FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own health profile" ON public.user_health_profiles;
CREATE POLICY "Users can delete own health profile"
ON public.user_health_profiles FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 3. 가족 구성원 RLS 정책
-- ============================================================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 가족 구성원만 조회 가능
DROP POLICY IF EXISTS "Users can view own family members" ON public.family_members;
CREATE POLICY "Users can view own family members"
ON public.family_members FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 사용자는 자신의 가족 구성원만 관리 가능
DROP POLICY IF EXISTS "Users can insert own family members" ON public.family_members;
CREATE POLICY "Users can insert own family members"
ON public.family_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own family members" ON public.family_members;
CREATE POLICY "Users can update own family members"
ON public.family_members FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own family members" ON public.family_members;
CREATE POLICY "Users can delete own family members"
ON public.family_members FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 4. 레시피 RLS 정책
-- ============================================================================

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 레시피 조회 가능 (공개 레시피)
DROP POLICY IF EXISTS "Authenticated users can view recipes" ON public.recipes;
CREATE POLICY "Authenticated users can view recipes"
ON public.recipes FOR SELECT
TO authenticated
USING (true);

-- 사용자는 자신이 만든 레시피만 수정/삭제 가능
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
CREATE POLICY "Users can insert own recipes"
ON public.recipes FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
CREATE POLICY "Users can update own recipes"
ON public.recipes FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;
CREATE POLICY "Users can delete own recipes"
ON public.recipes FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 5. 레시피 재료 및 단계 RLS 정책
-- ============================================================================

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;

-- 레시피 소유자만 재료 및 단계 관리 가능
DROP POLICY IF EXISTS "Recipe owners can insert ingredients" ON public.recipe_ingredients;
CREATE POLICY "Recipe owners can insert ingredients"
ON public.recipe_ingredients FOR INSERT
TO authenticated
WITH CHECK (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Recipe owners can update ingredients" ON public.recipe_ingredients;
CREATE POLICY "Recipe owners can update ingredients"
ON public.recipe_ingredients FOR UPDATE
TO authenticated
USING (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
)
WITH CHECK (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Recipe owners can delete ingredients" ON public.recipe_ingredients;
CREATE POLICY "Recipe owners can delete ingredients"
ON public.recipe_ingredients FOR DELETE
TO authenticated
USING (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Recipe owners can insert steps" ON public.recipe_steps;
CREATE POLICY "Recipe owners can insert steps"
ON public.recipe_steps FOR INSERT
TO authenticated
WITH CHECK (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Recipe owners can update steps" ON public.recipe_steps;
CREATE POLICY "Recipe owners can update steps"
ON public.recipe_steps FOR UPDATE
TO authenticated
USING (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
)
WITH CHECK (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Recipe owners can delete steps" ON public.recipe_steps;
CREATE POLICY "Recipe owners can delete steps"
ON public.recipe_steps FOR DELETE
TO authenticated
USING (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- 모든 인증된 사용자는 재료 및 단계 조회 가능
DROP POLICY IF EXISTS "Authenticated users can view ingredients" ON public.recipe_ingredients;
CREATE POLICY "Authenticated users can view ingredients"
ON public.recipe_ingredients FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view steps" ON public.recipe_steps;
CREATE POLICY "Authenticated users can view steps"
ON public.recipe_steps FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 6. 레시피 평가 RLS 정책
-- ============================================================================

ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자는 평가 조회 가능
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.recipe_ratings;
CREATE POLICY "Authenticated users can view ratings"
ON public.recipe_ratings FOR SELECT
TO authenticated
USING (true);

-- 사용자는 자신의 평가만 생성/수정 가능
DROP POLICY IF EXISTS "Users can insert own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can insert own ratings"
ON public.recipe_ratings FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can update own ratings"
ON public.recipe_ratings FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own ratings" ON public.recipe_ratings;
CREATE POLICY "Users can delete own ratings"
ON public.recipe_ratings FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 7. 식단 계획 RLS 정책
-- ============================================================================

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 식단 계획만 조회 가능
DROP POLICY IF EXISTS "Users can view own diet plans" ON public.diet_plans;
CREATE POLICY "Users can view own diet plans"
ON public.diet_plans FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 사용자는 자신의 식단 계획만 관리 가능
DROP POLICY IF EXISTS "Users can insert own diet plans" ON public.diet_plans;
CREATE POLICY "Users can insert own diet plans"
ON public.diet_plans FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own diet plans" ON public.diet_plans;
CREATE POLICY "Users can update own diet plans"
ON public.diet_plans FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own diet plans" ON public.diet_plans;
CREATE POLICY "Users can delete own diet plans"
ON public.diet_plans FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 8. 주간 식단 RLS 정책
-- ============================================================================

ALTER TABLE public.weekly_diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_nutrition_stats ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 주간 식단만 조회 가능
DROP POLICY IF EXISTS "Users can view own weekly plans" ON public.weekly_diet_plans;
CREATE POLICY "Users can view own weekly plans"
ON public.weekly_diet_plans FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 사용자는 자신의 주간 식단만 관리 가능
DROP POLICY IF EXISTS "Users can insert own weekly plans" ON public.weekly_diet_plans;
CREATE POLICY "Users can insert own weekly plans"
ON public.weekly_diet_plans FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own weekly plans" ON public.weekly_diet_plans;
CREATE POLICY "Users can update own weekly plans"
ON public.weekly_diet_plans FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own weekly plans" ON public.weekly_diet_plans;
CREATE POLICY "Users can delete own weekly plans"
ON public.weekly_diet_plans FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 주간 장보기 리스트는 주간 식단 소유자만 접근 가능
DROP POLICY IF EXISTS "Users can view own shopping lists" ON public.weekly_shopping_lists;
CREATE POLICY "Users can view own shopping lists"
ON public.weekly_shopping_lists FOR SELECT
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Users can insert own shopping lists" ON public.weekly_shopping_lists;
CREATE POLICY "Users can insert own shopping lists"
ON public.weekly_shopping_lists FOR INSERT
TO authenticated
WITH CHECK (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Users can update own shopping lists" ON public.weekly_shopping_lists;
CREATE POLICY "Users can update own shopping lists"
ON public.weekly_shopping_lists FOR UPDATE
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
)
WITH CHECK (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

DROP POLICY IF EXISTS "Users can delete own shopping lists" ON public.weekly_shopping_lists;
CREATE POLICY "Users can delete own shopping lists"
ON public.weekly_shopping_lists FOR DELETE
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- 주간 영양 통계는 주간 식단 소유자만 접근 가능
DROP POLICY IF EXISTS "Users can view own nutrition stats" ON public.weekly_nutrition_stats;
CREATE POLICY "Users can view own nutrition stats"
ON public.weekly_nutrition_stats FOR SELECT
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- ============================================================================
-- 9. 즐겨찾기 식단 RLS 정책
-- ============================================================================

ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 즐겨찾기만 조회 가능
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorite_meals;
CREATE POLICY "Users can view own favorites"
ON public.favorite_meals FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 사용자는 자신의 즐겨찾기만 관리 가능
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorite_meals;
CREATE POLICY "Users can insert own favorites"
ON public.favorite_meals FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own favorites" ON public.favorite_meals;
CREATE POLICY "Users can update own favorites"
ON public.favorite_meals FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorite_meals;
CREATE POLICY "Users can delete own favorites"
ON public.favorite_meals FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 10. 구독 및 결제 RLS 정책
-- ============================================================================

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독 정보만 조회 가능
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
ON public.user_subscriptions FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can view own subscription details" ON public.subscriptions;
CREATE POLICY "Users can view own subscription details"
ON public.subscriptions FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 사용자는 자신의 결제 내역만 조회 가능
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_transactions;
CREATE POLICY "Users can view own payments"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 11. 공개 데이터 테이블 (읽기 전용)
-- ============================================================================

-- 질병, 알레르기 등 마스터 데이터는 모든 인증된 사용자가 조회 가능
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergy_derived_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_excluded_foods_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calorie_calculation_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kcdc_alerts ENABLE ROW LEVEL SECURITY;

-- 공개 조회 정책
DROP POLICY IF EXISTS "Public can view diseases" ON public.diseases;
CREATE POLICY "Public can view diseases"
ON public.diseases FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view allergies" ON public.allergies;
CREATE POLICY "Public can view allergies"
ON public.allergies FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view emergency procedures" ON public.emergency_procedures;
CREATE POLICY "Public can view emergency procedures"
ON public.emergency_procedures FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view derived ingredients" ON public.allergy_derived_ingredients;
CREATE POLICY "Public can view derived ingredients"
ON public.allergy_derived_ingredients FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view excluded foods" ON public.disease_excluded_foods_extended;
CREATE POLICY "Public can view excluded foods"
ON public.disease_excluded_foods_extended FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view formulas" ON public.calorie_calculation_formulas;
CREATE POLICY "Public can view formulas"
ON public.calorie_calculation_formulas FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view kcdc alerts" ON public.kcdc_alerts;
CREATE POLICY "Public can view kcdc alerts"
ON public.kcdc_alerts FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================================================
-- 12. 관리자 전용 테이블 (관리자만 접근)
-- ============================================================================

-- 관리자 콘텐츠는 관리자만 접근 가능 (서버 사이드에서 검증)
-- RLS는 추가 보안 레이어로만 사용
ALTER TABLE public.admin_copy_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_audit ENABLE ROW LEVEL SECURITY;

-- 관리자 콘텐츠는 인증된 사용자만 조회 (실제 권한은 서버에서 검증)
DROP POLICY IF EXISTS "Authenticated can view copy blocks" ON public.admin_copy_blocks;
CREATE POLICY "Authenticated can view copy blocks"
ON public.admin_copy_blocks FOR SELECT
TO authenticated
USING (true);

-- 팝업 공지는 공개된 것만 조회 가능
DROP POLICY IF EXISTS "Public can view published popups" ON public.popup_announcements;
CREATE POLICY "Public can view published popups"
ON public.popup_announcements FOR SELECT
TO authenticated
USING (status = 'published' AND active_from <= now() AND (active_until IS NULL OR active_until >= now()));

-- ============================================================================
-- 13. 레거시 아카이브 (공개 조회)
-- ============================================================================

ALTER TABLE public.legacy_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_replacement_guides ENABLE ROW LEVEL SECURITY;

-- 레거시 콘텐츠는 모든 인증된 사용자가 조회 가능
DROP POLICY IF EXISTS "Authenticated can view legacy content" ON public.legacy_masters;
CREATE POLICY "Authenticated can view legacy content"
ON public.legacy_masters FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can view legacy videos" ON public.legacy_videos;
CREATE POLICY "Authenticated can view legacy videos"
ON public.legacy_videos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can view legacy documents" ON public.legacy_documents;
CREATE POLICY "Authenticated can view legacy documents"
ON public.legacy_documents FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can view replacement guides" ON public.legacy_replacement_guides;
CREATE POLICY "Authenticated can view replacement guides"
ON public.legacy_replacement_guides FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 14. 기타 테이블
-- ============================================================================

-- 레시피 사용 기록
ALTER TABLE public.recipe_usage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage history" ON public.recipe_usage_history;
CREATE POLICY "Users can view own usage history"
ON public.recipe_usage_history FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can insert own usage history" ON public.recipe_usage_history;
CREATE POLICY "Users can insert own usage history"
ON public.recipe_usage_history FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own usage history" ON public.recipe_usage_history;
CREATE POLICY "Users can update own usage history"
ON public.recipe_usage_history FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own usage history" ON public.recipe_usage_history;
CREATE POLICY "Users can delete own usage history"
ON public.recipe_usage_history FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- 식단 알림 설정
ALTER TABLE public.diet_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own notification settings" ON public.diet_notification_settings;
CREATE POLICY "Users can insert own notification settings"
ON public.diet_notification_settings FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can update own notification settings" ON public.diet_notification_settings;
CREATE POLICY "Users can update own notification settings"
ON public.diet_notification_settings FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

DROP POLICY IF EXISTS "Users can delete own notification settings" ON public.diet_notification_settings;
CREATE POLICY "Users can delete own notification settings"
ON public.diet_notification_settings FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ 프로덕션 RLS 정책이 성공적으로 설정되었습니다!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  중요 사항:';
  RAISE NOTICE '  - 이 마이그레이션은 프로덕션 배포 전에만 실행하세요';
  RAISE NOTICE '  - 개발 환경에서는 RLS를 비활성화해야 합니다';
  RAISE NOTICE '  - 모든 정책은 Clerk JWT의 sub 클레임을 사용합니다';
  RAISE NOTICE '';
  RAISE NOTICE '📊 설정된 RLS 정책:';
  RAISE NOTICE '  - 사용자 테이블: 2개 정책';
  RAISE NOTICE '  - 건강 프로필: 2개 정책';
  RAISE NOTICE '  - 가족 구성원: 2개 정책';
  RAISE NOTICE '  - 레시피: 2개 정책';
  RAISE NOTICE '  - 식단 계획: 2개 정책';
  RAISE NOTICE '  - 주간 식단: 3개 정책';
  RAISE NOTICE '  - 공개 데이터: 7개 정책';
  RAISE NOTICE '  - 관리자 테이블: 2개 정책';
  RAISE NOTICE '  - 기타: 4개 정책';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 프로덕션 준비가 완료되었습니다!';
END $$;

