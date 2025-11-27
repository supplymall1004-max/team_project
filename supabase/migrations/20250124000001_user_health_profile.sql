-- 사용자 건강 프로필 테이블 생성
-- 사용자 본인의 상세 건강 정보 저장

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.user_health_profiles CASCADE;

CREATE TABLE public.user_health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  diseases TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  preferred_ingredients TEXT[] DEFAULT '{}',
  disliked_ingredients TEXT[] DEFAULT '{}',
  daily_calorie_goal INTEGER,
  dietary_preferences TEXT[] DEFAULT '{}',
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT CHECK (activity_level IN 
    ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_user_health_profiles_user_id 
  ON public.user_health_profiles(user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_health_profiles_updated_at
  BEFORE UPDATE ON public.user_health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.user_health_profiles DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.user_health_profiles 
  TO anon, authenticated, service_role;

