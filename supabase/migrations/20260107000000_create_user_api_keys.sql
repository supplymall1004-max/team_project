-- ============================================================================
-- 사용자 API 키 관리 테이블
-- 작성일: 2026-01-07
-- 목적: 사용자가 발급받은 외부 API 키를 안전하게 저장 및 관리
-- ============================================================================

-- updated_at 자동 업데이트 함수 (없으면 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- user_api_keys 테이블 생성
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- API 종류 (예: 'gemini', 'naver_map', 'naver_geocoding', 'naver_search', 'pharmacy', 'food_safety', 'kcdc', 'weather')
  api_type TEXT NOT NULL,
  
  -- API 키 값 (암호화 권장, 현재는 평문 저장 - 향후 암호화 추가 가능)
  api_key TEXT NOT NULL,
  
  -- 추가 정보 (JSONB 형식으로 Client ID, Secret 등 저장)
  -- 예: {"client_id": "...", "client_secret": "..."}
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- 상태 (active, inactive)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- 마지막 사용 시간
  last_used_at TIMESTAMPTZ,
  
  -- 생성 및 수정 시간
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- 사용자별 API 타입은 유일해야 함 (한 사용자는 같은 API 타입의 키를 하나만 가질 수 있음)
  UNIQUE(user_id, api_type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_type ON user_api_keys(api_type);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_status ON user_api_keys(status);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (개발 환경)
ALTER TABLE user_api_keys DISABLE ROW LEVEL SECURITY;

-- 코멘트 추가
COMMENT ON TABLE user_api_keys IS '사용자가 발급받은 외부 API 키를 저장하는 테이블';
COMMENT ON COLUMN user_api_keys.api_type IS 'API 종류: gemini, naver_map, naver_geocoding, naver_search, pharmacy, food_safety, kcdc, weather';
COMMENT ON COLUMN user_api_keys.api_key IS 'API 키 값 (향후 암호화 권장)';
COMMENT ON COLUMN user_api_keys.metadata IS '추가 정보 (Client ID, Secret 등)';
COMMENT ON COLUMN user_api_keys.status IS '키 상태: active(활성), inactive(비활성)';
COMMENT ON COLUMN user_api_keys.last_used_at IS '마지막 사용 시간';

