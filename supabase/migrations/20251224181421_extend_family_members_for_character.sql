-- ============================================================================
-- family_members 테이블 확장 - 캐릭터창 인터페이스 지원 추가
-- 작성일: 2025-12-24
-- 설명: family_members 테이블을 확장하여 캐릭터창 인터페이스에 필요한 필드 추가
--       - avatar_type: 아바타 타입 (photo 또는 icon)
--       - health_score: 최근 계산된 건강 점수 (캐싱용)
--       - health_score_updated_at: 건강 점수 계산 시각
-- ============================================================================

-- 1. family_members 테이블에 캐릭터창 관련 필드 추가
DO $$
BEGIN
  -- avatar_type 필드 추가 (아바타 타입: photo 또는 icon)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'avatar_type'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN avatar_type TEXT DEFAULT 'icon' 
      CHECK (avatar_type IN ('photo', 'icon'));
    
    COMMENT ON COLUMN family_members.avatar_type IS '아바타 타입: photo(사진) 또는 icon(아이콘) - 기본값: icon';
    RAISE NOTICE 'family_members.avatar_type 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.avatar_type 컬럼이 이미 존재합니다';
  END IF;

  -- health_score 필드 추가 (최근 계산된 건강 점수 - 캐싱용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'health_score'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN health_score INTEGER 
      CHECK (health_score >= 0 AND health_score <= 100);
    
    COMMENT ON COLUMN family_members.health_score IS '최근 계산된 건강 점수 (0-100) - 캐싱용. NULL 허용';
    RAISE NOTICE 'family_members.health_score 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.health_score 컬럼이 이미 존재합니다';
  END IF;

  -- health_score_updated_at 필드 추가 (건강 점수 계산 시각)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'health_score_updated_at'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN health_score_updated_at TIMESTAMPTZ;
    
    COMMENT ON COLUMN family_members.health_score_updated_at IS '건강 점수 계산 시각 - 캐시 무효화 판단용';
    RAISE NOTICE 'family_members.health_score_updated_at 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.health_score_updated_at 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 2. 기존 데이터 업데이트 (avatar_type 기본값 설정)
UPDATE family_members 
SET avatar_type = 'icon' 
WHERE avatar_type IS NULL;

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_family_members_health_score 
  ON family_members(health_score) 
  WHERE health_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_family_members_health_score_updated_at 
  ON family_members(health_score_updated_at) 
  WHERE health_score_updated_at IS NOT NULL;

-- 4. RLS 비활성화 (개발 환경)
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;

-- 5. 코멘트 업데이트
COMMENT ON TABLE family_members IS '가족 구성원 테이블 - 사람(human)과 반려동물(pet) 모두 관리. 캐릭터창 인터페이스 지원을 위한 avatar_type, health_score 필드 포함.';

