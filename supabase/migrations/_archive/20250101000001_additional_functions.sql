-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 함수/트리거 묶음입니다.
-- 현재 DB에는 더 최신의 통합 마이그레이션으로 동일/유사 기능이 이미 포함되어 있어
-- 중복 적용 시 충돌(함수/트리거/뷰 이름 충돌) 가능성이 큽니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250101000001_additional_functions.sql';
END $$;
