-- 궁중 레시피 블로그 글 테이블
-- 개발 환경: RLS 비활성화, 관리자 권한으로만 접근

CREATE TABLE IF NOT EXISTS public.royal_recipes_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    era TEXT NOT NULL CHECK (era IN ('goryeo', 'joseon', 'three_kingdoms')),
    author_id TEXT NOT NULL, -- Clerk user ID
    slug TEXT NOT NULL UNIQUE,
    published BOOLEAN DEFAULT false NOT NULL,
    thumbnail_url TEXT,
    excerpt TEXT, -- 요약 텍스트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.royal_recipes_posts DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.royal_recipes_posts TO anon, authenticated, service_role;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_royal_recipes_posts_author_id ON public.royal_recipes_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_royal_recipes_posts_era ON public.royal_recipes_posts(era);
CREATE INDEX IF NOT EXISTS idx_royal_recipes_posts_published ON public.royal_recipes_posts(published);
CREATE INDEX IF NOT EXISTS idx_royal_recipes_posts_created_at ON public.royal_recipes_posts(created_at DESC);

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_royal_recipes_posts_updated_at ON public.royal_recipes_posts;
CREATE TRIGGER update_royal_recipes_posts_updated_at
    BEFORE UPDATE ON public.royal_recipes_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();








