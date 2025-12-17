-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 recipe_rating_stats 뷰 정의 파일입니다.
-- 현재 DB에는 최신 마이그레이션으로 뷰/인덱스가 이미 구성되어 있어 중복 적용이 불필요합니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250101000002_recipe_rating_stats_view.sql';
END $$;
