-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 건강정보 자동 연동(Phase 1) 스키마 확장 파일입니다.
-- 현재 DB에는 2025-12-07 통합 스키마 및 이후 마이그레이션에서
-- 관련 테이블/관계가 이미 정리되어 있어 중복 적용이 불필요합니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250201000000_create_health_data_integration_tables.sql';
END $$;
