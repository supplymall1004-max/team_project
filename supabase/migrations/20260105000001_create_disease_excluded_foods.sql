-- ============================================================================
-- 질병별 제외 음식 테이블 생성 (레거시)
-- 작성일: 2025-01-05
-- 설명: 질병별로 제외해야 할 음식 목록을 저장하는 테이블
-- 참고: disease_excluded_foods_extended와 병행 사용됨
-- ============================================================================

CREATE TABLE IF NOT EXISTS disease_excluded_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease TEXT NOT NULL,
    excluded_food_name TEXT NOT NULL,
    excluded_type TEXT NOT NULL CHECK (excluded_type IN ('ingredient', 'recipe_keyword')),
    reason TEXT,
    severity TEXT DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe')),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT disease_excluded_foods_unique UNIQUE(disease, excluded_food_name)
);

COMMENT ON TABLE disease_excluded_foods IS '질병별 제외 음식 테이블 (레거시)';
COMMENT ON COLUMN disease_excluded_foods.disease IS '질병명 (diabetes, hypertension, high_cholesterol, kidney_disease 등)';
COMMENT ON COLUMN disease_excluded_foods.excluded_food_name IS '제외할 음식명 (키워드)';
COMMENT ON COLUMN disease_excluded_foods.excluded_type IS '제외 유형: ingredient(재료), recipe_keyword(레시피 키워드)';
COMMENT ON COLUMN disease_excluded_foods.reason IS '제외 이유 (선택)';
COMMENT ON COLUMN disease_excluded_foods.severity IS '심각도: mild(경미), moderate(보통), severe(심각)';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_disease ON disease_excluded_foods(disease);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_name ON disease_excluded_foods(excluded_food_name);
CREATE INDEX IF NOT EXISTS idx_disease_excluded_foods_type ON disease_excluded_foods(excluded_type);

