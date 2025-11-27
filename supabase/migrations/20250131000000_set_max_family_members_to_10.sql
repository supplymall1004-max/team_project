-- 가족 구성원 최대 10명 제한 설정
-- 사용자당 최대 10명의 가족 구성원만 추가할 수 있도록 제약 조건 추가

-- 함수: 사용자별 가족 구성원 수 확인
CREATE OR REPLACE FUNCTION check_family_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
  max_members INTEGER := 10; -- 최대 10명
BEGIN
  -- 현재 사용자의 가족 구성원 수 확인
  SELECT COUNT(*) INTO member_count
  FROM public.family_members
  WHERE user_id = NEW.user_id;
  
  -- 최대 인원수 초과 시 에러 발생
  IF member_count >= max_members THEN
    RAISE EXCEPTION '가족 구성원은 최대 %명까지 추가할 수 있습니다. (현재: %명)', max_members, member_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (INSERT 전에 체크)
DROP TRIGGER IF EXISTS check_family_member_limit_trigger ON public.family_members;

CREATE TRIGGER check_family_member_limit_trigger
  BEFORE INSERT ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION check_family_member_limit();

-- 기존 데이터 확인 및 경고
DO $$
DECLARE
  user_record RECORD;
  member_count INTEGER;
  max_members INTEGER := 10;
BEGIN
  -- 10명을 초과하는 사용자 확인
  FOR user_record IN
    SELECT user_id, COUNT(*) as count
    FROM public.family_members
    GROUP BY user_id
    HAVING COUNT(*) > max_members
  LOOP
    RAISE WARNING '사용자 ID %는 현재 %명의 가족 구성원을 가지고 있습니다. (최대: %명)', 
      user_record.user_id, user_record.count, max_members;
  END LOOP;
END $$;

-- 인덱스 최적화 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_family_members_user_id_count 
ON public.family_members(user_id);

-- 주석 추가
COMMENT ON FUNCTION check_family_member_limit() IS 
'가족 구성원 추가 시 최대 10명 제한을 확인하는 트리거 함수';

COMMENT ON TRIGGER check_family_member_limit_trigger ON public.family_members IS 
'가족 구성원 추가 전 최대 10명 제한을 체크하는 트리거';

