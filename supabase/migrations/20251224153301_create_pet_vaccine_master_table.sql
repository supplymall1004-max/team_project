-- ============================================================================
-- 반려동물 백신 마스터 데이터 테이블 생성
-- 작성일: 2025-12-24
-- 설명: AVMA/AAHA 기준 반려동물 백신 마스터 데이터 테이블
--       이 테이블은 마스터 데이터이므로 별도 테이블로 유지
-- ============================================================================

-- 반려동물 백신 마스터 데이터 테이블
CREATE TABLE IF NOT EXISTS pet_vaccine_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_name TEXT NOT NULL,
  vaccine_code TEXT NOT NULL UNIQUE,
  pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat', 'both')),
  lifecycle_stage TEXT,
  recommended_age_weeks INTEGER,
  recommended_age_months INTEGER,
  booster_interval_months INTEGER,
  is_required BOOLEAN DEFAULT false,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE pet_vaccine_master IS '반려동물 백신 마스터 데이터 테이블 - AVMA/AAHA 기준 백신 정보';
COMMENT ON COLUMN pet_vaccine_master.pet_type IS '대상 반려동물: dog(강아지), cat(고양이), both(공통)';
COMMENT ON COLUMN pet_vaccine_master.lifecycle_stage IS '권장 생애주기 단계: puppy, kitten, junior, adult, mature_adult, senior, geriatric';
COMMENT ON COLUMN pet_vaccine_master.booster_interval_months IS '추가 접종 주기 (개월 단위, 예: 12 = 1년마다)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_pet_vaccine_master_pet_type ON pet_vaccine_master(pet_type);
CREATE INDEX IF NOT EXISTS idx_pet_vaccine_master_lifecycle_stage ON pet_vaccine_master(lifecycle_stage) WHERE lifecycle_stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pet_vaccine_master_is_required ON pet_vaccine_master(is_required) WHERE is_required = true;

-- updated_at 트리거 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_pet_vaccine_master_updated_at'
  ) THEN
    CREATE TRIGGER update_pet_vaccine_master_updated_at
      BEFORE UPDATE ON pet_vaccine_master
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS 비활성화 (개발 환경)
ALTER TABLE pet_vaccine_master DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE pet_vaccine_master TO anon, authenticated, service_role;

