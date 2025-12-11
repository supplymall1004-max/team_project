-- calorie_calculation_formulas 테이블 최적화 및 제약조건 설정

-- 1. 기존 정적 데이터 백업
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calorie_calculation_formulas'
    AND column_name = 'is_default'
  ) THEN
    CREATE TABLE IF NOT EXISTS calorie_calculation_formulas_backup AS
    SELECT * FROM calorie_calculation_formulas
    WHERE is_default = true;
    
    COMMENT ON TABLE calorie_calculation_formulas_backup IS '정적 칼로리 계산 공식 백업 (코드로 이동 전 백업용)';
    
    -- 2. 정적 데이터 제거
    DELETE FROM calorie_calculation_formulas
    WHERE is_default = true;
  END IF;
END $$;

-- 3. 테이블 구조 최적화
COMMENT ON TABLE calorie_calculation_formulas IS '사용자 커스텀 칼로리 계산 공식 테이블. 정적 공식 (Mifflin-St Jeor, Harris-Benedict 등)은 lib/health/calorie-formulas.ts에서 관리.';

ALTER TABLE calorie_calculation_formulas
DROP COLUMN IF EXISTS is_default;

ALTER TABLE calorie_calculation_formulas
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_calorie_formulas_user_id 
ON calorie_calculation_formulas(user_id);

CREATE INDEX IF NOT EXISTS idx_calorie_formulas_formula_type 
ON calorie_calculation_formulas(formula_type) WHERE formula_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calorie_formulas_gender 
ON calorie_calculation_formulas(gender) WHERE gender IS NOT NULL;

-- 5. RLS 비활성화
ALTER TABLE calorie_calculation_formulas DISABLE ROW LEVEL SECURITY;
