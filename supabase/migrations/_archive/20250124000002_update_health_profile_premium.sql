-- ⚠️ DEPRECATED (비활성)
--
-- 레거시 user_health_profiles 프리미엄 컬럼(premium_features TEXT[]) 추가 마이그레이션입니다.
-- 현재 프로젝트는 JSONB 기반 건강 프로필 구조/최신 마이그레이션 체인을 사용 중이므로
-- 이 파일을 다시 적용할 필요가 없습니다.
--
-- 따라서 이 파일은 의도적으로 "실행되지 않도록" 비활성화했습니다.

DO $$
BEGIN
  RAISE NOTICE 'SKIP: deprecated legacy migration 20250124000002_update_health_profile_premium.sql';
END $$;
