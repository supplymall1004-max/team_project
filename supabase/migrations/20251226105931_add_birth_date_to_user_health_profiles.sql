-- user_health_profiles 테이블에 birth_date 컬럼 추가
-- 생애주기별 건강 알림을 위한 생년월일 정보 저장

DO $$
BEGIN
  -- birth_date 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_health_profiles'
    AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.user_health_profiles
      ADD COLUMN birth_date DATE;
    
    COMMENT ON COLUMN public.user_health_profiles.birth_date IS '사용자 생년월일 - 생애주기별 건강 알림을 위해 필요';
    
    RAISE NOTICE 'user_health_profiles.birth_date 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'user_health_profiles.birth_date 컬럼이 이미 존재합니다';
  END IF;
END $$;

