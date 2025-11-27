-- 가족 건강 스키마 생성
-- 가족 구성원 테이블 및 질병별 제외 음식 테이블

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.family_members CASCADE;

-- 가족 구성원 테이블
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relationship TEXT NOT NULL,
  diseases TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  height_cm INTEGER,
  weight_kg DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN
    ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_preferences TEXT[] DEFAULT '{}',
  include_in_unified_diet BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX idx_family_members_birth_date ON public.family_members(birth_date);
CREATE INDEX idx_family_members_include_in_unified_diet ON public.family_members(include_in_unified_diet);

-- updated_at 트리거
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.family_members TO anon, authenticated, service_role;

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.disease_excluded_foods CASCADE;

-- 질병별 제외 음식 테이블
CREATE TABLE public.disease_excluded_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease TEXT NOT NULL,
  excluded_food_type TEXT NOT NULL CHECK 
    (excluded_food_type IN ('ingredient', 'recipe_keyword')),
  food_name TEXT NOT NULL,
  reason TEXT,
  severity TEXT DEFAULT 'high' CHECK 
    (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_disease_excluded_foods_disease 
  ON public.disease_excluded_foods(disease);
CREATE INDEX idx_disease_excluded_foods_food_name 
  ON public.disease_excluded_foods(food_name);

-- RLS 비활성화
ALTER TABLE public.disease_excluded_foods DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.disease_excluded_foods 
  TO anon, authenticated, service_role;

-- 초기 데이터 삽입: 당뇨병 (diabetes)
INSERT INTO public.disease_excluded_foods 
  (disease, excluded_food_type, food_name, reason, severity)
VALUES
  ('diabetes', 'ingredient', '설탕', '혈당 상승의 주요 원인', 'high'),
  ('diabetes', 'ingredient', '꿀', '당분 함량 높음', 'high'),
  ('diabetes', 'ingredient', '시럽', '당분 농축', 'high'),
  ('diabetes', 'ingredient', '사탕', '순수 당분', 'high'),
  ('diabetes', 'ingredient', '초콜릿', '당분과 지방 과다', 'high'),
  ('diabetes', 'ingredient', '케이크', '당분과 정제 탄수화물', 'high'),
  ('diabetes', 'ingredient', '쿠키', '당분과 정제 탄수화물', 'high'),
  ('diabetes', 'ingredient', '빙과류', '당분과 칼로리 과다', 'high'),
  ('diabetes', 'ingredient', '탄산음료', '액상 당분 빠른 흡수', 'high'),
  ('diabetes', 'ingredient', '과일주스', '농축 당분', 'medium'),
  ('diabetes', 'ingredient', '흰빵', '정제 탄수화물', 'medium'),
  ('diabetes', 'ingredient', '흰쌀', '정제 탄수화물', 'medium'),
  ('diabetes', 'ingredient', '떡', '정제 탄수화물과 당분', 'medium'),
  ('diabetes', 'recipe_keyword', '튀김', '기름과 칼로리 높음', 'medium'),
  ('diabetes', 'recipe_keyword', '달달한', '당분 함량 높음', 'high'),
  ('diabetes', 'recipe_keyword', '달콤한', '당분 함량 높음', 'high'),
  ('diabetes', 'recipe_keyword', '단맛', '당분 함량 높음', 'high'),
  ('diabetes', 'recipe_keyword', '디저트', '당분과 지방 과다', 'high'),
  ('diabetes', 'ingredient', '과자', '당분과 정제 탄수화물', 'high'),
  ('diabetes', 'ingredient', '젤리', '순수 당분', 'high'),
  ('diabetes', 'ingredient', '캔디', '순수 당분', 'high'),
  ('diabetes', 'ingredient', '파이', '당분과 지방 과다', 'high'),
  ('diabetes', 'ingredient', '도넛', '당분과 기름', 'high'),
  ('diabetes', 'ingredient', '팬케이크', '정제 탄수화물과 시럽', 'medium'),
  ('diabetes', 'ingredient', '와플', '정제 탄수화물과 시럽', 'medium'),
  ('diabetes', 'ingredient', '아이스크림', '당분과 지방 과다', 'high'),
  ('diabetes', 'ingredient', '푸딩', '당분 함량 높음', 'medium'),
  ('diabetes', 'ingredient', '요거트 (가당)', '첨가당 높음', 'medium'),
  ('diabetes', 'ingredient', '시리얼 (가당)', '당분과 정제 탄수화물', 'medium'),
  ('diabetes', 'ingredient', '에너지바', '숨은 당분', 'medium'),
  ('diabetes', 'ingredient', '그래놀라', '당분 함량 높음', 'medium'),
  ('diabetes', 'ingredient', '콜라', '액상 당분', 'high'),
  ('diabetes', 'ingredient', '사이다', '액상 당분', 'high'),
  ('diabetes', 'ingredient', '스포츠음료', '당분 함량 높음', 'medium'),
  ('diabetes', 'ingredient', '에너지드링크', '당분과 카페인', 'medium');

-- 초기 데이터 삽입: 고혈압 (hypertension)
INSERT INTO public.disease_excluded_foods 
  (disease, excluded_food_type, food_name, reason, severity)
VALUES
  ('hypertension', 'ingredient', '소금', '나트륨 과다 섭취', 'high'),
  ('hypertension', 'ingredient', '간장', '나트륨 함량 높음', 'high'),
  ('hypertension', 'ingredient', '된장', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '고추장', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '쌈장', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'recipe_keyword', '짠맛', '나트륨 과다', 'high'),
  ('hypertension', 'recipe_keyword', '짜게', '나트륨 과다', 'high'),
  ('hypertension', 'ingredient', '햄', '가공 식품, 나트륨 높음', 'high'),
  ('hypertension', 'ingredient', '소시지', '가공 식품, 나트륨 높음', 'high'),
  ('hypertension', 'ingredient', '베이컨', '가공 육류, 나트륨 높음', 'high'),
  ('hypertension', 'ingredient', '스팸', '가공 육류, 나트륨 높음', 'high'),
  ('hypertension', 'ingredient', '치즈', '나트륨과 지방 높음', 'medium'),
  ('hypertension', 'ingredient', '피클', '소금 절임', 'high'),
  ('hypertension', 'ingredient', '김치', '소금 절임', 'medium'),
  ('hypertension', 'ingredient', '젓갈', '소금 농축', 'high'),
  ('hypertension', 'ingredient', '멸치', '나트륨 높음', 'medium'),
  ('hypertension', 'ingredient', '라면', '나트륨 과다', 'high'),
  ('hypertension', 'ingredient', '통조림', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '냉동식품', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'recipe_keyword', '국물', '나트륨 농축', 'medium'),
  ('hypertension', 'recipe_keyword', '찌개', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'recipe_keyword', '조림', '간장 사용', 'medium'),
  ('hypertension', 'ingredient', '장아찌', '소금 절임', 'high'),
  ('hypertension', 'ingredient', '마요네즈', '나트륨과 지방 높음', 'medium'),
  ('hypertension', 'ingredient', '케첩', '나트륨과 당분', 'medium'),
  ('hypertension', 'ingredient', '머스타드', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '굴소스', '나트륨 함량 높음', 'high'),
  ('hypertension', 'ingredient', '칠리소스', '나트륨과 당분', 'medium'),
  ('hypertension', 'ingredient', '타바스코', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '후추', '나트륨 함량 (과다 사용 시)', 'low'),
  ('hypertension', 'ingredient', '조미료', '나트륨 함량 높음', 'high'),
  ('hypertension', 'ingredient', '치킨', '나트륨과 기름', 'medium'),
  ('hypertension', 'ingredient', '피자', '나트륨과 지방 과다', 'medium'),
  ('hypertension', 'ingredient', '햄버거', '나트륨과 지방 과다', 'medium'),
  ('hypertension', 'ingredient', '샌드위치 (가공육)', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '스낵', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '과자', '나트륨과 당분', 'low'),
  ('hypertension', 'ingredient', '감자칩', '나트륨과 지방', 'medium'),
  ('hypertension', 'ingredient', '새우깡', '나트륨 함량 높음', 'medium'),
  ('hypertension', 'ingredient', '포테이토칩', '나트륨과 지방', 'medium');

-- 초기 데이터 삽입: 통풍 (gout)
INSERT INTO public.disease_excluded_foods 
  (disease, excluded_food_type, food_name, reason, severity)
VALUES
  ('gout', 'ingredient', '등푸른생선', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '고등어', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '꽁치', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '청어', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '정어리', '퓨린 함량 매우 높음', 'high'),
  ('gout', 'ingredient', '멸치', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '새우', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '조개', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '내장', '퓨린 함량 매우 높음', 'high'),
  ('gout', 'ingredient', '간', '퓨린 함량 매우 높음', 'high'),
  ('gout', 'ingredient', '소간', '퓨린 함량 매우 높음', 'high'),
  ('gout', 'ingredient', '닭간', '퓨린 함량 매우 높음', 'high'),
  ('gout', 'ingredient', '곱창', '퓨린 함량 높음', 'high'),
  ('gout', 'ingredient', '육류', '퓨린 함량 높음', 'medium'),
  ('gout', 'ingredient', '소고기', '퓨린 함량 중간', 'medium'),
  ('gout', 'ingredient', '돼지고기', '퓨린 함량 중간', 'medium'),
  ('gout', 'ingredient', '양고기', '퓨린 함량 높음', 'medium'),
  ('gout', 'recipe_keyword', '맥주', '알코올과 퓨린', 'high'),
  ('gout', 'recipe_keyword', '술', '알코올 금지', 'high'),
  ('gout', 'ingredient', '맥주', '알코올과 퓨린', 'high'),
  ('gout', 'ingredient', '소주', '알코올', 'high'),
  ('gout', 'ingredient', '와인', '알코올', 'medium'),
  ('gout', 'ingredient', '버섯', '퓨린 함량 중간', 'low'),
  ('gout', 'ingredient', '시금치', '퓨린 함량 중간', 'low'),
  ('gout', 'ingredient', '아스파라거스', '퓨린 함량 중간', 'low'),
  ('gout', 'ingredient', '콜리플라워', '퓨린 함량 중간', 'low'),
  ('gout', 'ingredient', '베이컨', '가공 육류', 'medium'),
  ('gout', 'ingredient', '육수', '퓨린 농축', 'medium'),
  ('gout', 'recipe_keyword', '탕', '육수 사용', 'medium'),
  ('gout', 'recipe_keyword', '찜', '육류 농축', 'medium');

-- 초기 데이터 삽입: 신장질환 (kidney_disease)
INSERT INTO public.disease_excluded_foods 
  (disease, excluded_food_type, food_name, reason, severity)
VALUES
  ('kidney_disease', 'ingredient', '소금', '나트륨 제한', 'high'),
  ('kidney_disease', 'ingredient', '간장', '나트륨 높음', 'high'),
  ('kidney_disease', 'ingredient', '된장', '나트륨 높음', 'high'),
  ('kidney_disease', 'ingredient', '바나나', '칼륨 높음', 'high'),
  ('kidney_disease', 'ingredient', '오렌지', '칼륨 높음', 'high'),
  ('kidney_disease', 'ingredient', '토마토', '칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '감자', '칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '고구마', '칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '시금치', '칼륨과 인 높음', 'medium'),
  ('kidney_disease', 'ingredient', '우유', '인과 칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '치즈', '인과 나트륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '요거트', '인과 칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '콩', '인과 칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '견과류', '인과 칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '현미', '인 함량 높음', 'low'),
  ('kidney_disease', 'ingredient', '통곡물', '인 함량 높음', 'low'),
  ('kidney_disease', 'recipe_keyword', '국물', '나트륨과 칼륨 농축', 'medium'),
  ('kidney_disease', 'ingredient', '햄', '가공 식품, 인 높음', 'high'),
  ('kidney_disease', 'ingredient', '소시지', '가공 식품, 인 높음', 'high'),
  ('kidney_disease', 'ingredient', '베이컨', '가공 육류, 인과 나트륨', 'high'),
  ('kidney_disease', 'ingredient', '통조림', '나트륨과 인 높음', 'medium'),
  ('kidney_disease', 'ingredient', '인스턴트식품', '나트륨과 인 높음', 'high'),
  ('kidney_disease', 'ingredient', '콜라', '인 함량 높음', 'medium'),
  ('kidney_disease', 'ingredient', '초콜릿', '인과 칼륨 높음', 'medium'),
  ('kidney_disease', 'ingredient', '아보카도', '칼륨 매우 높음', 'high');

-- 초기 데이터 삽입: 고지혈증 (hyperlipidemia)
INSERT INTO public.disease_excluded_foods 
  (disease, excluded_food_type, food_name, reason, severity)
VALUES
  ('hyperlipidemia', 'ingredient', '버터', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'ingredient', '마가린', '트랜스지방', 'high'),
  ('hyperlipidemia', 'ingredient', '쇼트닝', '트랜스지방', 'high'),
  ('hyperlipidemia', 'ingredient', '팜유', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'ingredient', '코코넛오일', '포화지방 높음', 'medium'),
  ('hyperlipidemia', 'ingredient', '삼겹살', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'ingredient', '갈비', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'ingredient', '베이컨', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'ingredient', '소시지', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'recipe_keyword', '튀김', '기름 과다', 'high'),
  ('hyperlipidemia', 'recipe_keyword', '볶음', '기름 사용', 'medium'),
  ('hyperlipidemia', 'ingredient', '치킨', '기름 과다', 'high'),
  ('hyperlipidemia', 'ingredient', '도넛', '트랜스지방', 'high'),
  ('hyperlipidemia', 'ingredient', '크루아상', '버터 과다', 'high'),
  ('hyperlipidemia', 'ingredient', '크림', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'ingredient', '휘핑크림', '포화지방 높음', 'high'),
  ('hyperlipidemia', 'ingredient', '아이스크림', '포화지방과 당분', 'medium'),
  ('hyperlipidemia', 'ingredient', '케이크', '포화지방과 당분', 'medium'),
  ('hyperlipidemia', 'ingredient', '쿠키', '포화지방과 당분', 'medium'),
  ('hyperlipidemia', 'ingredient', '과자', '트랜스지방', 'medium'),
  ('hyperlipidemia', 'ingredient', '라면', '포화지방과 나트륨', 'medium'),
  ('hyperlipidemia', 'ingredient', '피자', '포화지방 과다', 'medium'),
  ('hyperlipidemia', 'ingredient', '햄버거', '포화지방 과다', 'medium'),
  ('hyperlipidemia', 'ingredient', '치즈', '포화지방 높음', 'medium'),
  ('hyperlipidemia', 'ingredient', '마요네즈', '지방 높음', 'medium'),
  ('hyperlipidemia', 'ingredient', '감자튀김', '기름 과다', 'high'),
  ('hyperlipidemia', 'ingredient', '새우튀김', '기름 과다', 'high'),
  ('hyperlipidemia', 'ingredient', '돈까스', '기름 과다', 'high'),
  ('hyperlipidemia', 'ingredient', '탕수육', '기름과 당분', 'high'),
  ('hyperlipidemia', 'ingredient', '양념치킨', '기름과 당분', 'high');

-- 초기 데이터 삽입: 비만 (obesity)
INSERT INTO public.disease_excluded_foods 
  (disease, excluded_food_type, food_name, reason, severity)
VALUES
  ('obesity', 'ingredient', '설탕', '빈 칼로리', 'high'),
  ('obesity', 'recipe_keyword', '튀김', '칼로리 과다', 'high'),
  ('obesity', 'ingredient', '패스트푸드', '칼로리와 지방 과다', 'high'),
  ('obesity', 'ingredient', '치킨', '칼로리와 기름', 'high'),
  ('obesity', 'ingredient', '피자', '칼로리 과다', 'high'),
  ('obesity', 'ingredient', '햄버거', '칼로리 과다', 'high'),
  ('obesity', 'ingredient', '라면', '칼로리와 나트륨', 'medium'),
  ('obesity', 'ingredient', '과자', '빈 칼로리', 'medium'),
  ('obesity', 'ingredient', '아이스크림', '칼로리와 당분', 'high'),
  ('obesity', 'ingredient', '케이크', '칼로리와 당분', 'high'),
  ('obesity', 'ingredient', '쿠키', '칼로리와 당분', 'medium'),
  ('obesity', 'ingredient', '도넛', '칼로리와 당분', 'high'),
  ('obesity', 'ingredient', '탄산음료', '빈 칼로리', 'high'),
  ('obesity', 'ingredient', '주스', '당분 농축', 'medium'),
  ('obesity', 'ingredient', '빵', '정제 탄수화물', 'medium'),
  ('obesity', 'ingredient', '버터', '칼로리와 지방', 'high'),
  ('obesity', 'ingredient', '마요네즈', '칼로리와 지방', 'high'),
  ('obesity', 'ingredient', '삼겹살', '칼로리와 지방', 'high'),
  ('obesity', 'ingredient', '갈비', '칼로리와 지방', 'high'),
  ('obesity', 'ingredient', '감자튀김', '칼로리와 기름', 'high'),
  ('obesity', 'recipe_keyword', '달달한', '당분 과다', 'high'),
  ('obesity', 'recipe_keyword', '기름진', '지방 과다', 'high'),
  ('obesity', 'ingredient', '초콜릿', '칼로리와 당분', 'medium'),
  ('obesity', 'ingredient', '사탕', '빈 칼로리', 'medium'),
  ('obesity', 'ingredient', '에너지바', '칼로리 높음', 'low'),
  ('obesity', 'ingredient', '그래놀라', '당분과 칼로리', 'low');

