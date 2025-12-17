-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 seed 데이터(질병/알레르기) 파일입니다.
-- 현재 프로젝트는 최신 seed/마스터 데이터 흐름을 사용 중이며,
-- 중복 실행 시 데이터가 쌓이거나(또는 코드 체계가 달라) 혼란이 생길 수 있습니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy seed migration 20250101000003_seed_diseases_allergies.sql';
END $$;
