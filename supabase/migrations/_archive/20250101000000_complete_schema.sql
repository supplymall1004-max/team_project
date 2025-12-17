-- ⚠️ DEPRECATED (비활성)
--
-- 이 파일은 "전체 DB DROP 후 재생성"을 수행하는 레거시 통합 스키마입니다.
-- 현재 프로젝트는 더 최신의 마이그레이션 체인(complete_schema_* / 2025-12-07 적용)을 사용 중이며,
-- 이 파일을 다시 실행하면 기존 데이터가 전부 삭제될 수 있어 매우 위험합니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.
-- 필요 시(정말 DB를 완전히 초기화해야 하는 상황) 별도 브랜치에서만 사용하세요.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250101000000_complete_schema.sql (contains destructive DROP).';
END $$;
