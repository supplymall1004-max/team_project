-- 레거시 아카이브 (Section A) 스키마
-- 개발 환경: RLS 비활성화, anon/authenticated 접근 허용

CREATE TABLE IF NOT EXISTS public.legacy_masters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    bio TEXT
);

ALTER TABLE public.legacy_masters OWNER TO postgres;
ALTER TABLE public.legacy_masters DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_masters TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.legacy_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_id UUID REFERENCES public.legacy_masters(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    region TEXT NOT NULL,
    era TEXT NOT NULL,
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    premium_only BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.legacy_videos OWNER TO postgres;
ALTER TABLE public.legacy_videos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_videos TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.legacy_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES public.legacy_videos(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    region TEXT NOT NULL,
    era TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    source JSONB NOT NULL DEFAULT '{}'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.legacy_documents OWNER TO postgres;
ALTER TABLE public.legacy_documents DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_documents TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.legacy_replacement_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    traditional JSONB NOT NULL,
    modern JSONB NOT NULL,
    tips TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.legacy_replacement_guides OWNER TO postgres;
ALTER TABLE public.legacy_replacement_guides DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.legacy_replacement_guides TO anon, authenticated, service_role;

-- 샘플 데이터 삽입 (중복 삽입 방지를 위해 존재 여부 확인)
INSERT INTO public.legacy_masters (id, name, title, region, bio)
VALUES
    ('00000000-0000-0000-0000-000000000111', '김연자 명인', '안동 전통 장 명인', '경북 안동', '100년 장독대를 지켜온 장 명인'),
    ('00000000-0000-0000-0000-000000000222', '박정희 장인', '한정식 셰프', '전남 담양', '전라도 한정식 코스 전문가')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.legacy_videos (
    id,
    master_id,
    slug,
    title,
    description,
    duration_minutes,
    region,
    era,
    ingredients,
    thumbnail_url,
    video_url,
    premium_only,
    tags
) VALUES (
    '00000000-0000-0000-0000-000000000aaa',
    '00000000-0000-0000-0000-000000000111',
    'traditional-soybean-paste',
    '전통 장 담그기',
    '100년 간 이어온 장독대 비법과 대체 재료 활용 팁을 소개합니다.',
    32,
    '경북 안동',
    '조선 후기',
    ARRAY['된장','천일염','메주'],
    '/legacy/jang-thumbnail.jpg',
    'https://example.com/videos/jang.mp4',
    TRUE,
    ARRAY['발효','장류','명인']
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.legacy_videos (
    id,
    master_id,
    slug,
    title,
    description,
    duration_minutes,
    region,
    era,
    ingredients,
    thumbnail_url,
    video_url,
    premium_only,
    tags
) VALUES (
    '00000000-0000-0000-0000-000000000bbb',
    '00000000-0000-0000-0000-000000000222',
    'jeolla-hanjeongsik',
    '전라도 한정식 상차림',
    '산지 직송 식재료로 담아낸 전라도 한정식 코스 10가지를 소개합니다.',
    27,
    '전남 담양',
    '근현대',
    ARRAY['표고버섯','들기름','대파'],
    '/legacy/hanjeongsik-thumbnail.jpg',
    'https://example.com/videos/hanjeongsik.mp4',
    FALSE,
    ARRAY['한정식','코스요리']
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.legacy_documents (
    id,
    video_id,
    title,
    summary,
    region,
    era,
    ingredients,
    tools,
    source,
    steps
) VALUES (
    '00000000-0000-0000-0000-000000000ddd',
    '00000000-0000-0000-0000-000000000aaa',
    '안동 전통 된장 제조 기록',
    '메주 띄우기부터 장독 숙성까지 4계절에 걸친 장 담그기 프로세스를 문서화.',
    '경북 안동',
    '조선 후기',
    '[
      {"name":"안동 메주","description":"안동산 콩으로 띄운 메주","authenticityNotes":"동절기에 띄운 메주만 사용."},
      {"name":"천일염","description":"3년 이상 간수를 뺀 천일염","authenticityNotes":"염도가 낮아 발효가 안정적."}
    ]',
    '[
      {"name":"옹기 장독","usage":"장 숙성/보관","modernAlternatives":["스테인리스 발효통"]},
      {"name":"죽부인 체","usage":"콩 거르기","modernAlternatives":["스테인리스 체"]}
    ]',
    '{
      "author":"맛의 아카이브 리서치팀",
      "publishedAt":"2025-10-01",
      "reference":"경북문화재단-001"
    }',
    '[
      {"order":1,"content":"국내산 콩을 12시간 불린 뒤 삶아 으깬다."},
      {"order":2,"content":"짚으로 감싸 20일간 발효시켜 메주를 완성한다."},
      {"order":3,"content":"메주를 천일염 물에 담가서 발효시키고 장독에 옮긴다."}
    ]'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.legacy_replacement_guides (
    id,
    traditional,
    modern,
    tips
) VALUES (
    '00000000-0000-0000-0000-000000000eee',
    '{
      "name":"안동 메주",
      "description":"안동산 콩 + 전통 온돌방 숙성"
    }',
    '{
      "name":"국산 메주 블록",
      "availability":"전통 시장 / 온라인"
    }',
    ARRAY[
      '전통 메주보다 향이 약하므로 소금량을 5% 줄여 조절',
      '실내온도가 5℃ 낮으면 숙성 기간을 1.2배 늘린다'
    ]
) ON CONFLICT (id) DO NOTHING;

