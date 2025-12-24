-- ============================================================================
-- family_members 테이블 확장 - 반려동물 지원 추가
-- 작성일: 2025-12-24
-- 설명: family_members 테이블을 확장하여 반려동물도 가족 구성원으로 관리
--       기존 pets 테이블 대신 family_members에 통합하여 테이블 수 감소
-- ============================================================================

-- 1. family_members 테이블에 반려동물 관련 필드 추가
DO $$
BEGIN
  -- member_type 필드 추가 (human 또는 pet 구분)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'member_type'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN member_type TEXT DEFAULT 'human' 
      CHECK (member_type IN ('human', 'pet'));
    
    COMMENT ON COLUMN family_members.member_type IS '구성원 유형: human(사람), pet(반려동물)';
    RAISE NOTICE 'family_members.member_type 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.member_type 컬럼이 이미 존재합니다';
  END IF;

  -- pet_type 필드 추가 (반려동물 종류)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'pet_type'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN pet_type TEXT 
      CHECK (pet_type IN ('dog', 'cat', 'other'));
    
    COMMENT ON COLUMN family_members.pet_type IS '반려동물 종류: dog(강아지), cat(고양이), other(기타) - member_type이 pet일 때만 사용';
    RAISE NOTICE 'family_members.pet_type 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.pet_type 컬럼이 이미 존재합니다';
  END IF;

  -- breed 필드 추가 (견종/묘종)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'breed'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN breed TEXT;
    
    COMMENT ON COLUMN family_members.breed IS '견종/묘종 - member_type이 pet일 때만 사용';
    RAISE NOTICE 'family_members.breed 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.breed 컬럼이 이미 존재합니다';
  END IF;

  -- lifecycle_stage 필드 추가 (생애주기 단계)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'lifecycle_stage'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN lifecycle_stage TEXT;
    
    COMMENT ON COLUMN family_members.lifecycle_stage IS '생애주기 단계: 사람(human)의 경우 NULL, 반려동물(pet)의 경우 puppy/kitten, junior, adult, mature_adult, senior, geriatric (AVMA/AAHA 기준)';
    RAISE NOTICE 'family_members.lifecycle_stage 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.lifecycle_stage 컬럼이 이미 존재합니다';
  END IF;

  -- pet_metadata 필드 추가 (반려동물 추가 정보)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'pet_metadata'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN pet_metadata JSONB DEFAULT '{}'::jsonb;
    
    COMMENT ON COLUMN family_members.pet_metadata IS '반려동물 추가 정보 (색상, 특징 등) - member_type이 pet일 때만 사용';
    RAISE NOTICE 'family_members.pet_metadata 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.pet_metadata 컬럼이 이미 존재합니다';
  END IF;

  -- photo_url 필드 추가 (사진 URL)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE family_members 
      ADD COLUMN photo_url TEXT;
    
    COMMENT ON COLUMN family_members.photo_url IS '프로필 사진 URL - 사람과 반려동물 모두 사용 가능';
    RAISE NOTICE 'family_members.photo_url 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'family_members.photo_url 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- 2. 기존 데이터 업데이트 (모든 기존 레코드는 human으로 설정)
UPDATE family_members 
SET member_type = 'human' 
WHERE member_type IS NULL;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_family_members_member_type ON family_members(member_type);
CREATE INDEX IF NOT EXISTS idx_family_members_pet_type ON family_members(pet_type) WHERE pet_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_family_members_lifecycle_stage ON family_members(lifecycle_stage) WHERE lifecycle_stage IS NOT NULL;

-- 4. 코멘트 업데이트
COMMENT ON TABLE family_members IS '가족 구성원 테이블 - 사람(human)과 반려동물(pet) 모두 관리. users 삭제 시 CASCADE로 함께 삭제됨. 다른 테이블에서 참조 시 SET NULL 정책 적용.';

