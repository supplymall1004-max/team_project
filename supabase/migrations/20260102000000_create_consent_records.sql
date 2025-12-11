-- Migration: create consent_records table
-- 개인정보 처리 동의 내역 저장 테이블
-- 동의 시간, 위치, 기기 정보 등을 저장

CREATE TABLE IF NOT EXISTS PUBLIC.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL, -- 'identity_verification', 'health_data_collection', 'data_sync' 등
  consent_content TEXT NOT NULL, -- 동의한 내용 (JSON 또는 텍스트)
  consent_status TEXT NOT NULL DEFAULT 'granted' CHECK (consent_status IN ('granted', 'withdrawn', 'expired')),
  consent_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT, -- 브라우저/기기 정보
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  location_country TEXT,
  location_region TEXT,
  location_city TEXT,
  verification_id UUID REFERENCES identity_verifications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE consent_records IS '개인정보 처리 동의 내역 저장 테이블';
COMMENT ON COLUMN consent_records.consent_type IS '동의 유형: identity_verification(신원확인), health_data_collection(건강정보 수집), data_sync(데이터 동기화)';
COMMENT ON COLUMN consent_records.consent_content IS '동의한 내용 (JSON 형식으로 저장)';
COMMENT ON COLUMN consent_records.consent_status IS '동의 상태: granted(동의), withdrawn(철회), expired(만료)';
COMMENT ON COLUMN consent_records.ip_address IS '동의 시 IP 주소';
COMMENT ON COLUMN consent_records.user_agent IS '브라우저/기기 정보 (User-Agent 헤더)';
COMMENT ON COLUMN consent_records.device_type IS '기기 유형: desktop, mobile, tablet';
COMMENT ON COLUMN consent_records.location_country IS '동의 시 국가';
COMMENT ON COLUMN consent_records.location_region IS '동의 시 지역/주';
COMMENT ON COLUMN consent_records.location_city IS '동의 시 도시';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_records_clerk_user ON public.consent_records (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_type ON public.consent_records (consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_consent_time ON public.consent_records (consent_time);
CREATE INDEX IF NOT EXISTS idx_consent_records_verification_id ON public.consent_records (verification_id);

-- Foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'consent_records'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_name = 'fk_consent_records_clerk_user'
        AND tc.table_name = 'consent_records'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      ALTER TABLE public.consent_records
        ADD CONSTRAINT fk_consent_records_clerk_user
        FOREIGN KEY (clerk_user_id)
        REFERENCES public.users (clerk_id)
        ON DELETE CASCADE;
    END IF;
  END IF;
END
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_consent_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_records_updated_at();

