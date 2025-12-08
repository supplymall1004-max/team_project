-- 레시피 재료 테이블 생성 마이그레이션
-- RLS는 개발 단계에서 비활성화

-- 재료 카테고리 ENUM 타입
CREATE TYPE ingredient_category AS ENUM (
  '곡물',
  '채소',
  '과일',
  '육류',
  '해산물',
  '유제품',
  '조미료',
  '기타'
);

-- 레시피 재료 테이블
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL, -- 수량
  unit TEXT NOT NULL, -- 단위 (g, ml, 개, 큰술, 작은술 등)
  category ingredient_category DEFAULT '기타',
  is_optional BOOLEAN DEFAULT false, -- 선택 재료 여부
  preparation_note TEXT, -- 손질 방법 (예: "다진 것", "깍둑썰기")
  display_order INTEGER DEFAULT 0, -- 표시 순서
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients(ingredient_name);

-- 복합 인덱스 (레시피별 표시 순서)
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_order 
  ON recipe_ingredients(recipe_id, display_order);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_recipe_ingredients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_ingredients_updated_at
  BEFORE UPDATE ON recipe_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_ingredients_updated_at();

-- RLS 비활성화 (개발 환경)
ALTER TABLE recipe_ingredients DISABLE ROW LEVEL SECURITY;

-- 코멘트 추가
COMMENT ON TABLE recipe_ingredients IS '레시피별 재료 정보';
COMMENT ON COLUMN recipe_ingredients.quantity IS '재료 수량 (소수점 2자리)';
COMMENT ON COLUMN recipe_ingredients.unit IS '단위: g, ml, 개, 큰술, 작은술, 컵 등';
COMMENT ON COLUMN recipe_ingredients.category IS '재료 카테고리 (장보기 리스트 그룹화용)';
COMMENT ON COLUMN recipe_ingredients.is_optional IS '선택적 재료 여부';
COMMENT ON COLUMN recipe_ingredients.preparation_note IS '재료 손질 방법 (예: 다진 것, 깍둑썰기)';
COMMENT ON COLUMN recipe_ingredients.display_order IS '레시피 상세에서 표시 순서';

-- 샘플 데이터 추가 (기존 레시피에 재료 추가)
-- 김치찌개 레시피 재료
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '배추김치',
  300,
  'g',
  '채소'::ingredient_category,
  1
FROM recipes 
WHERE title = '김치찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '돼지고기',
  200,
  'g',
  '육류'::ingredient_category,
  2
FROM recipes 
WHERE title = '김치찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '두부',
  1,
  '모',
  '유제품'::ingredient_category,
  3
FROM recipes 
WHERE title = '김치찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '대파',
  1,
  '대',
  '채소'::ingredient_category,
  4
FROM recipes 
WHERE title = '김치찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '고춧가루',
  1,
  '큰술',
  '조미료'::ingredient_category,
  5
FROM recipes 
WHERE title = '김치찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '마늘',
  3,
  '쪽',
  '조미료'::ingredient_category,
  6
FROM recipes 
WHERE title = '김치찌개'
LIMIT 1;

-- 된장찌개 레시피 재료
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '된장',
  2,
  '큰술',
  '조미료'::ingredient_category,
  1
FROM recipes 
WHERE title = '된장찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '두부',
  0.5,
  '모',
  '유제품'::ingredient_category,
  2
FROM recipes 
WHERE title = '된장찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '감자',
  1,
  '개',
  '채소'::ingredient_category,
  3
FROM recipes 
WHERE title = '된장찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '애호박',
  0.5,
  '개',
  '채소'::ingredient_category,
  4
FROM recipes 
WHERE title = '된장찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '대파',
  0.5,
  '대',
  '채소'::ingredient_category,
  5
FROM recipes 
WHERE title = '된장찌개'
LIMIT 1;

INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, category, display_order)
SELECT 
  id,
  '멸치 육수',
  3,
  '컵',
  '기타'::ingredient_category,
  6
FROM recipes 
WHERE title = '된장찌개'
LIMIT 1;




















