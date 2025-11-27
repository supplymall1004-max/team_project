-- 레시피 영양 정보 컬럼 추가
-- AI 맞춤 식단 생성을 위한 영양소 데이터

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS calories DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS carbohydrates DECIMAL(8, 2), -- 탄수화물 (g)
ADD COLUMN IF NOT EXISTS protein DECIMAL(8, 2), -- 단백질 (g)
ADD COLUMN IF NOT EXISTS fat DECIMAL(8, 2), -- 지방 (g)
ADD COLUMN IF NOT EXISTS sodium DECIMAL(8, 2); -- 나트륨 (mg)

-- 인덱스 생성 (영양소 기반 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_recipes_calories ON public.recipes(calories);
CREATE INDEX IF NOT EXISTS idx_recipes_protein ON public.recipes(protein);
CREATE INDEX IF NOT EXISTS idx_recipes_carbohydrates ON public.recipes(carbohydrates);
