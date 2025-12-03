-- users 테이블에 MFA(2FA) 관련 컬럼 추가
-- Google Authenticator 등 TOTP 기반 2단계 인증 지원

-- 1. MFA 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS mfa_secret TEXT, -- TOTP 비밀 키 (암호화 권장)
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false, -- MFA 활성화 여부
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[]; -- 복구 코드 배열 (선택적)

-- 2. 인덱스 추가 (MFA 활성화된 사용자 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled
ON users(mfa_enabled)
WHERE mfa_enabled = true;

-- 3. 컬럼 추가 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('mfa_secret', 'mfa_enabled', 'mfa_backup_codes');

-- 4. PostgREST 스키마 reload
NOTIFY pgrst, 'reload schema';

























