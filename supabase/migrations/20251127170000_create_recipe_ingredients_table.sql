-- 레시피 재료 테이블 생성 마이그레이션
-- RLS는 개발 단계에서 비활성화

-- 재료 카테고리 ENUM 타입 (기존 타입이 있으면 삭제 후 재생성)
DROP TYPE IF EXISTS ingredient_category CASCADE;

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

-- 레시피 재료 테이블 (기존 테이블에 컬럼 추가)
-- 기존 recipe_ingredients 테이블이 있으므로 컬럼들만 추가
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS ingredient_name TEXT;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS category ingredient_category DEFAULT '기타';
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS preparation_note TEXT;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 기존 name 컬럼을 ingredient_name으로 복사 (데이터 마이그레이션)
UPDATE recipe_ingredients SET ingredient_name = name WHERE ingredient_name IS NULL AND name IS NOT NULL;

-- 기존 order_index를 display_order로 변경
ALTER TABLE recipe_ingredients RENAME COLUMN order_index TO display_order;

-- 인덱스 생성 (기존 인덱스 유지하면서 새 인덱스 추가)
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients(ingredient_name);

-- 복합 인덱스 (레시피별 표시 순서) - 기존 order_index 인덱스 재사용
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

-- 샘플 데이터 추가는 별도 마이그레이션에서 수행
-- 기존 데이터의 안전한 마이그레이션을 위해 샘플 데이터 추가 생략




















