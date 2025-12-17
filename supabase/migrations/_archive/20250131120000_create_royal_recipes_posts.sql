-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 궁중 레시피 블로그 테이블 생성 파일입니다.
-- 현재 프로젝트에서는 통합 스키마/최신 마이그레이션 흐름을 기준으로 DB를 관리하며,
-- 이 파일의 중복 적용은 충돌/중복 테이블 위험이 있습니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250131120000_create_royal_recipes_posts.sql';
END $$;
