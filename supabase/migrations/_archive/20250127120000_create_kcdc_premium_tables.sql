-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 KCDC 프리미엄 테이블(Phase 1/9) 생성 파일입니다.
-- 현재 DB에는 KCDC 관련 테이블/알림 체계가 이미 최신 마이그레이션으로 구성되어 있어
-- 중복 적용 시 테이블/인덱스/트리거 충돌 위험이 큽니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250127120000_create_kcdc_premium_tables.sql';
END $$;
