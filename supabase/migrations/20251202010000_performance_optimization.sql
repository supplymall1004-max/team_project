-- ============================================================================
-- 성능 최적화 마이그레이션
-- 작성일: 2025-12-02
-- 설명: Phase 3 성능 최적화 - 추가 인덱스 및 쿼리 최적화
-- ============================================================================

-- ============================================================================
-- 1. 레시피 테이블 추가 인덱스
-- ============================================================================

-- 난이도별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON public.recipes(difficulty);

-- 조리 시간별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_time ON public.recipes(cooking_time_minutes);

-- 영양소 범위 검색 최적화 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_recipes_nutrition_range ON public.recipes(calories, protein, carbohydrates);

-- slug 검색 최적화 (이미 UNIQUE 인덱스가 있지만 명시적으로 추가)
CREATE INDEX IF NOT EXISTS idx_recipes_slug_search ON public.recipes(slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- 2. 식단 계획 테이블 추가 인덱스
-- ============================================================================

-- 식사 타입별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_diet_plans_meal_type ON public.diet_plans(meal_type);

-- 사용자별 식사 타입별 검색 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_meal_type ON public.diet_plans(user_id, meal_type);

-- 날짜 범위 검색 최적화 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_date_range ON public.diet_plans(user_id, plan_date DESC);

-- 통합 식단 검색 최적화
CREATE INDEX IF NOT EXISTS idx_diet_plans_unified_date ON public.diet_plans(is_unified, plan_date) WHERE is_unified = true;

-- ============================================================================
-- 3. 가족 구성원 테이블 추가 인덱스
-- ============================================================================

-- 사용자별 가족 구성원 검색 최적화 (이미 있지만 확인)
CREATE INDEX IF NOT EXISTS idx_family_members_user_relationship ON public.family_members(user_id, relationship);

-- 통합 식단 포함 여부 검색 최적화
CREATE INDEX IF NOT EXISTS idx_family_members_unified ON public.family_members(user_id, include_in_unified_diet) WHERE include_in_unified_diet = true;

-- ============================================================================
-- 4. 주간 식단 테이블 추가 인덱스
-- ============================================================================

-- 주간 식단 날짜 검색 최적화
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_date ON public.weekly_diet_plans(week_start_date DESC);

-- 사용자별 주간 식단 검색 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_date ON public.weekly_diet_plans(user_id, week_start_date DESC);

-- 가족 식단 검색 최적화
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_family ON public.weekly_diet_plans(user_id, is_family) WHERE is_family = true;

-- ============================================================================
-- 5. 주간 장보기 리스트 인덱스
-- ============================================================================

-- 카테고리별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_category ON public.weekly_shopping_lists(category);

-- 구매 상태별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_purchased ON public.weekly_shopping_lists(is_purchased) WHERE is_purchased = false;

-- ============================================================================
-- 6. 주간 영양 통계 인덱스
-- ============================================================================

-- 날짜별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_date ON public.weekly_nutrition_stats(date DESC);

-- 주간 식단별 날짜 검색 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_plan_date ON public.weekly_nutrition_stats(weekly_diet_plan_id, date);

-- ============================================================================
-- 7. 레시피 평가 인덱스
-- ============================================================================

-- 레시피별 평균 평점 계산 최적화
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON public.recipe_ratings(recipe_id, rating);

-- 사용자별 평가 조회 최적화
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user ON public.recipe_ratings(user_id, recipe_id);

-- ============================================================================
-- 8. 레시피 사용 기록 인덱스
-- ============================================================================

-- 사용자별 날짜별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_recipe_usage_history_user_date ON public.recipe_usage_history(user_id, used_date DESC);

-- 식사 타입별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_recipe_usage_history_meal_type ON public.recipe_usage_history(meal_type);

-- ============================================================================
-- 9. 즐겨찾기 식단 인덱스
-- ============================================================================

-- 사용자별 즐겨찾기 검색 최적화
CREATE INDEX IF NOT EXISTS idx_favorite_meals_user ON public.favorite_meals(user_id, created_at DESC);

-- 식사 타입별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_favorite_meals_meal_type ON public.favorite_meals(user_id, meal_type);

-- ============================================================================
-- 10. 관리자 콘텐츠 인덱스 (이미 있지만 확인)
-- ============================================================================

-- 업데이트 시간별 검색 최적화 (이미 존재)
-- CREATE INDEX IF NOT EXISTS idx_admin_copy_blocks_updated_at ON public.admin_copy_blocks(updated_at DESC);

-- ============================================================================
-- 11. 팝업 공지 인덱스
-- ============================================================================

-- 활성 팝업 검색 최적화
CREATE INDEX IF NOT EXISTS idx_popup_announcements_active ON public.popup_announcements(status, active_from, active_until) 
WHERE status = 'published';

-- 우선순위별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_popup_announcements_priority ON public.popup_announcements(priority DESC, active_from) 
WHERE status = 'published';

-- ============================================================================
-- 12. KCDC 알림 인덱스
-- ============================================================================

-- 활성 알림 검색 최적화
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active ON public.kcdc_alerts(is_active, published_at DESC) 
WHERE is_active = true;

-- 알림 타입별 검색 최적화
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_type ON public.kcdc_alerts(alert_type, published_at DESC);

-- ============================================================================
-- 13. 통계 및 분석 쿼리 최적화
-- ============================================================================

-- ANALYZE 실행으로 통계 정보 업데이트
ANALYZE public.recipes;
ANALYZE public.recipe_ingredients;
ANALYZE public.diet_plans;
ANALYZE public.weekly_diet_plans;
ANALYZE public.family_members;
ANALYZE public.user_health_profiles;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ 성능 최적화 인덱스가 성공적으로 생성되었습니다!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 생성된 인덱스:';
  RAISE NOTICE '  - 레시피 테이블: 5개 인덱스';
  RAISE NOTICE '  - 식단 계획 테이블: 4개 인덱스';
  RAISE NOTICE '  - 가족 구성원 테이블: 2개 인덱스';
  RAISE NOTICE '  - 주간 식단 테이블: 3개 인덱스';
  RAISE NOTICE '  - 주간 장보기 리스트: 2개 인덱스';
  RAISE NOTICE '  - 주간 영양 통계: 2개 인덱스';
  RAISE NOTICE '  - 레시피 평가: 2개 인덱스';
  RAISE NOTICE '  - 레시피 사용 기록: 2개 인덱스';
  RAISE NOTICE '  - 즐겨찾기 식단: 2개 인덱스';
  RAISE NOTICE '  - 팝업 공지: 2개 인덱스';
  RAISE NOTICE '  - KCDC 알림: 2개 인덱스';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Phase 3 성능 최적화 작업이 완료되었습니다!';
END $$;

