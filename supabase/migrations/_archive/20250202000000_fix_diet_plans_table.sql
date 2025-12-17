-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 diet_plans 개선 마이그레이션입니다.
-- 현재 프로젝트는 2025-12-17 이후의 최신 식단/주간식단 보정 마이그레이션을 사용 중이며
-- 중복 적용은 혼란/충돌을 유발할 수 있습니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250202000000_fix_diet_plans_table.sql';
END $$;
