-- 식단 계획 테이블 생성
-- 생성된 식단 정보 저장 (개인별 + 통합)

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.diet_plans CASCADE;

CREATE TABLE public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK 
    (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id TEXT,
  recipe_title TEXT NOT NULL,
  recipe_description TEXT,
  ingredients JSONB,
  instructions TEXT,
  calories INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  sodium_mg INTEGER,
  fiber_g DECIMAL(5,2),
  is_unified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_diet_plans_user_id ON public.diet_plans(user_id);
CREATE INDEX idx_diet_plans_family_member_id 
  ON public.diet_plans(family_member_id);
CREATE INDEX idx_diet_plans_plan_date ON public.diet_plans(plan_date);
CREATE INDEX idx_diet_plans_user_date ON public.diet_plans(user_id, plan_date);
CREATE INDEX idx_diet_plans_is_unified ON public.diet_plans(is_unified);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.diet_plans DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.diet_plans TO anon, authenticated, service_role;

