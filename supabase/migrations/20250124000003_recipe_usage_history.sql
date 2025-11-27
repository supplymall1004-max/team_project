-- 레시피 사용 이력 테이블 생성
-- 메뉴 중복 방지를 위한 사용 이력 추적

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.recipe_usage_history CASCADE;

CREATE TABLE public.recipe_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  recipe_title TEXT NOT NULL,
  recipe_url TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_recipe_usage_history_user_id 
  ON public.recipe_usage_history(user_id);
CREATE INDEX idx_recipe_usage_history_family_member_id 
  ON public.recipe_usage_history(family_member_id);
CREATE INDEX idx_recipe_usage_history_used_date 
  ON public.recipe_usage_history(used_date);
CREATE INDEX idx_recipe_usage_history_recipe_title 
  ON public.recipe_usage_history(recipe_title);

-- 복합 인덱스: 중복 체크 최적화
CREATE INDEX idx_recipe_usage_user_title_date 
  ON public.recipe_usage_history(user_id, recipe_title, used_date);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.recipe_usage_history DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.recipe_usage_history 
  TO anon, authenticated, service_role;

-- 자동 정리 함수 (90일 이상 된 이력 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_recipe_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.recipe_usage_history
  WHERE used_date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 참고: 매일 자동 정리는 Supabase pg_cron 사용 시 설정
-- SELECT cron.schedule('cleanup-recipe-history', '0 2 * * *', 'SELECT cleanup_old_recipe_history()');

