-- ============================================================================
-- notifications 테이블 확장 - 반려동물 건강 관리 카테고리 추가
-- 작성일: 2025-12-24
-- 설명: notifications 테이블의 type과 category에 반려동물 건강 관리 관련 값 추가
-- ============================================================================

-- 1. notifications 테이블 type 확장 (lifecycle_event, pet_healthcare 추가)
DO $$
BEGIN
  -- 기존 제약조건 삭제
  ALTER TABLE notifications 
    DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  -- 새로운 제약조건 추가 (반려동물 건강 관리 포함)
  ALTER TABLE notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN (
      'system', 'health', 'vaccination', 'medication', 'periodic_service',
      'lifecycle_event', 'pet_healthcare'
    ));
  
  RAISE NOTICE 'notifications.type 제약조건 확장 완료';
END $$;

-- 2. notifications 테이블 category 확장 (pet_healthcare 관련 카테고리 추가)
DO $$
BEGIN
  -- 기존 제약조건 삭제
  ALTER TABLE notifications 
    DROP CONSTRAINT IF EXISTS notifications_category_check;
  
  -- 새로운 제약조건 추가 (반려동물 건강 관리 카테고리 포함)
  ALTER TABLE notifications 
    ADD CONSTRAINT notifications_category_check 
    CHECK (category IN (
      'kcdc', 'diet-popup', 'system', 'scheduled', 'reminder', 'overdue', 
      'checkup', 'appointment', 'general',
      -- 생애주기 이벤트 카테고리
      'sensitive_health', 'education', 'military', 'career', 'milestone',
      'puberty', 'menopause', 'aging', 'family_formation', 'housing_finance',
      'legal_social', 'senior_retirement', 'lifestyle',
      -- 반려동물 건강 관리 카테고리
      'pet_healthcare', 'pet_vaccination', 'pet_weight', 'pet_checkup', 'pet_dental'
    ));
  
  RAISE NOTICE 'notifications.category 제약조건 확장 완료';
END $$;

-- 3. lifecycle_event_user_choices 테이블 확인 및 확장 (필요한 경우)
-- 주의: lifecycle_event_user_choices 테이블이 존재하지 않을 수 있으므로 조건부로 처리
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'lifecycle_event_user_choices'
  ) THEN
    -- pet_id 컬럼 추가 (nullable, family_members의 member_type='pet'인 레코드 참조)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'lifecycle_event_user_choices' 
      AND column_name = 'pet_id'
    ) THEN
      ALTER TABLE lifecycle_event_user_choices 
        ADD COLUMN pet_id UUID;
      
      RAISE NOTICE 'lifecycle_event_user_choices.pet_id 컬럼 추가 완료';
    ELSE
      RAISE NOTICE 'lifecycle_event_user_choices.pet_id 컬럼이 이미 존재합니다';
    END IF;
  ELSE
    RAISE NOTICE 'lifecycle_event_user_choices 테이블이 아직 존재하지 않습니다 (나중에 생성될 예정)';
  END IF;
END $$;

-- 4. 코멘트 업데이트
COMMENT ON COLUMN notifications.type IS '알림 타입: system, health, vaccination, medication, periodic_service, lifecycle_event, pet_healthcare';
COMMENT ON COLUMN notifications.category IS '세부 카테고리: kcdc, diet-popup, scheduled, reminder, overdue, checkup, appointment, general, pet_healthcare, pet_vaccination, pet_weight, pet_checkup, pet_dental';

