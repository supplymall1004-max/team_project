-- 식단 계획에 구성품 요약 정보 추가
-- 밥/반찬/국/간식 등의 식사 구성품 명칭들을 JSONB로 저장

ALTER TABLE public.diet_plans
ADD COLUMN composition_summary JSONB;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_diet_plans_composition_summary ON public.diet_plans USING GIN(composition_summary);

-- 주석 추가
COMMENT ON COLUMN public.diet_plans.composition_summary IS '식사 구성품 요약 정보 (rice, sides, soup, snack 등)';
