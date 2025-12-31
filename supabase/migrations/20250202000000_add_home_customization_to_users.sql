-- 홈페이지 커스텀 설정을 위한 users 테이블 확장
-- users 테이블에 home_customization JSONB 필드 추가

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS home_customization JSONB DEFAULT NULL;

-- 인덱스 생성 (JSONB 필드 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_users_home_customization 
ON users USING GIN (home_customization);

-- 주석 추가
COMMENT ON COLUMN users.home_customization IS '홈페이지 커스텀 설정 (테마, 배경, 섹션 순서 등)';

