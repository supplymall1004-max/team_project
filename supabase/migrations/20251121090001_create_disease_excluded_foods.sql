-- 질병별 제외 음식 관리 테이블 생성
-- 각 질병별로 피해야 할 음식 목록을 저장하고 관리

-- 기존 테이블이 있으면 삭제 (개발 환경)
DROP TABLE IF EXISTS public.disease_excluded_foods CASCADE;

CREATE TABLE public.disease_excluded_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease TEXT NOT NULL, -- 질병명 (예: 'diabetes', 'hypertension')
  excluded_food_name TEXT NOT NULL, -- 제외할 음식/재료명
  excluded_type TEXT NOT NULL CHECK
    (excluded_type IN ('ingredient', 'recipe_keyword')), -- 제외 유형
  reason TEXT, -- 제외 이유 설명
  severity TEXT DEFAULT 'moderate' CHECK
    (severity IN ('mild', 'moderate', 'severe')), -- 제외 강도
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_disease_excluded_foods_disease ON public.disease_excluded_foods(disease);
CREATE INDEX idx_disease_excluded_foods_food_name ON public.disease_excluded_foods(excluded_food_name);
CREATE INDEX idx_disease_excluded_foods_type ON public.disease_excluded_foods(excluded_type);
CREATE INDEX idx_disease_excluded_foods_disease_food
  ON public.disease_excluded_foods(disease, excluded_food_name);

-- UNIQUE 제약조건 (동일한 질병에 동일한 음식이 중복되지 않도록)
ALTER TABLE public.disease_excluded_foods
  ADD CONSTRAINT unique_disease_excluded_food
  UNIQUE (disease, excluded_food_name);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.disease_excluded_foods DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.disease_excluded_foods TO anon, authenticated, service_role;

-- 초기 데이터 삽입
INSERT INTO public.disease_excluded_foods (disease, excluded_food_name, excluded_type, reason, severity) VALUES
-- 당뇨병 제외 음식
('diabetes', '설탕', 'ingredient', '고당류 음식, 혈당 급상승 유발', 'severe'),
('diabetes', '흰설탕', 'ingredient', '정제된 당분, 혈당 지수 높음', 'severe'),
('diabetes', '흑설탕', 'ingredient', '정제된 당분, 혈당 지수 높음', 'severe'),
('diabetes', '꿀', 'ingredient', '고당류, 과도한 칼로리', 'severe'),
('diabetes', '시럽', 'ingredient', '고당류 액체, 빠른 흡수', 'severe'),
('diabetes', '물엿', 'ingredient', '고당류, 혈당 조절 어려움', 'severe'),
('diabetes', '올리고당', 'ingredient', '고당류 첨가물', 'severe'),
('diabetes', '초콜릿', 'ingredient', '고당류 및 지방 함량 높음', 'severe'),
('diabetes', '케이크', 'recipe_keyword', '고당류 베이킹 제품', 'severe'),
('diabetes', '쿠키', 'recipe_keyword', '고당류 베이킹 제품', 'severe'),
('diabetes', '빵', 'recipe_keyword', '정제 탄수화물, 혈당 급상승', 'moderate'),
('diabetes', '과자', 'recipe_keyword', '고당류 스낵', 'severe'),
('diabetes', '사탕', 'recipe_keyword', '고당류', 'severe'),
('diabetes', '아이스크림', 'recipe_keyword', '고당류 및 지방', 'severe'),
('diabetes', '탄산음료', 'recipe_keyword', '고당류 음료', 'severe'),
('diabetes', '주스', 'recipe_keyword', '과도한 당분 함량', 'moderate'),
('diabetes', '쥬스', 'recipe_keyword', '과도한 당분 함량', 'moderate'),

-- 고혈압 제외 음식
('hypertension', '소금', 'ingredient', '나트륨 함량 높음, 혈압 상승', 'severe'),
('hypertension', '정제소금', 'ingredient', '고나트륨', 'severe'),
('hypertension', '바다소금', 'ingredient', '고나트륨', 'severe'),
('hypertension', '간장', 'ingredient', '고나트륨 조미료', 'severe'),
('hypertension', '진간장', 'ingredient', '고나트륨 조미료', 'severe'),
('hypertension', '양조간장', 'ingredient', '고나트륨 조미료', 'severe'),
('hypertension', '된장', 'ingredient', '고나트륨 발효식품', 'severe'),
('hypertension', '된장찌개', 'recipe_keyword', '고나트륨 국물 요리', 'moderate'),
('hypertension', '젓갈', 'ingredient', '고나트륨 발효식품', 'severe'),
('hypertension', '멸치젓', 'ingredient', '고나트륨 젓갈', 'severe'),
('hypertension', '새우젓', 'ingredient', '고나트륨 젓갈', 'severe'),
('hypertension', '라면', 'recipe_keyword', '고나트륨 즉석식품', 'severe'),
('hypertension', '컵라면', 'recipe_keyword', '고나트륨 즉석식품', 'severe'),
('hypertension', '햄', 'ingredient', '가공육, 고나트륨', 'severe'),
('hypertension', '베이컨', 'ingredient', '가공육, 고나트륨', 'severe'),
('hypertension', '소시지', 'ingredient', '가공육, 고나트륨', 'severe'),
('hypertension', '치즈', 'ingredient', '가공 유제품, 나트륨 함유', 'moderate'),
('hypertension', '피클', 'ingredient', '염장 식품, 고나트륨', 'severe'),
('hypertension', '올리브', 'ingredient', '염장 올리브, 고나트륨', 'severe'),
('hypertension', '김치', 'ingredient', '염장 채소, 나트륨 함량 높음', 'moderate'),

-- 기타 일반적인 건강 제외 음식
('general', '트랜스지방', 'ingredient', '동맥경화 유발, 심혈관 질환 위험', 'moderate'),
('general', '인공감미료', 'ingredient', '장 건강 및 대사에 부정적 영향', 'mild'),
('general', '방부제', 'ingredient', '장기 섭취 시 건강 위험', 'mild'),
('general', 'MSG', 'ingredient', '두통 및 알레르기 유발 가능성', 'moderate');
