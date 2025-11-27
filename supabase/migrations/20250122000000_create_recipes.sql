-- 현대 레시피 북 (Section B) 스키마
-- 개발 환경: RLS 비활성화, anon/authenticated 접근 허용

-- 레시피 테이블
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT, -- 대표 이미지 (외부 링크)
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5), -- 1~5점 난이도
    cooking_time_minutes INTEGER NOT NULL, -- 조리 시간 (분 단위)
    servings INTEGER DEFAULT 1, -- 인분
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.recipes TO anon, authenticated, service_role;

-- 레시피 재료 테이블 (구조화된 데이터)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- 재료명
    quantity DECIMAL(10, 2), -- 수량
    unit TEXT, -- 단위 (g, ml, 개, 컵 등)
    notes TEXT, -- 추가 설명 (선택)
    order_index INTEGER NOT NULL DEFAULT 0, -- 표시 순서
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.recipe_ingredients TO anon, authenticated, service_role;

-- 레시피 단계 테이블
CREATE TABLE IF NOT EXISTS public.recipe_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    step_number INTEGER NOT NULL, -- 단계 번호 (1부터 시작)
    content TEXT NOT NULL, -- 단계 설명
    image_url TEXT, -- 단계별 이미지 (외부 링크, 선택)
    video_url TEXT, -- 단계별 영상 (외부 링크, 선택)
    timer_minutes INTEGER, -- 타이머 시간 (분, 선택)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(recipe_id, step_number)
);

ALTER TABLE public.recipe_steps DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.recipe_steps TO anon, authenticated, service_role;

-- 레시피 평가 테이블 (별점 0.5점 단위 허용)
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0 AND (rating * 2)::INTEGER = rating * 2), -- 0.5, 1.0, 1.5, ..., 5.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(recipe_id, user_id) -- 한 사용자는 한 레시피에 하나의 평가만
);

ALTER TABLE public.recipe_ratings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.recipe_ratings TO anon, authenticated, service_role;

-- 레시피 신고 테이블 (불량/저작권 침해 신고)
CREATE TABLE IF NOT EXISTS public.recipe_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate', 'copyright', 'spam', 'other')), -- 신고 유형
    reason TEXT NOT NULL, -- 신고 사유
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')), -- 신고 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.recipe_reports DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.recipe_reports TO anon, authenticated, service_role;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON public.recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON public.recipe_ratings(user_id);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- recipes 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- recipe_ratings 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_recipe_ratings_updated_at ON public.recipe_ratings;
CREATE TRIGGER update_recipe_ratings_updated_at
    BEFORE UPDATE ON public.recipe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- recipe_reports 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_recipe_reports_updated_at ON public.recipe_reports;
CREATE TRIGGER update_recipe_reports_updated_at
    BEFORE UPDATE ON public.recipe_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 평균 별점 계산을 위한 뷰 (성능 최적화)
CREATE OR REPLACE VIEW public.recipe_rating_stats AS
SELECT
    recipe_id,
    COUNT(*) as rating_count,
    ROUND(AVG(rating)::numeric, 1) as average_rating
FROM public.recipe_ratings
GROUP BY recipe_id;

