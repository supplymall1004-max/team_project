-- ============================================
-- 레시피 평가 통계 뷰 생성 (검색 API 지원)
-- ============================================

-- 기존 뷰 삭제 (있을 경우)
DROP VIEW IF EXISTS recipe_rating_stats CASCADE;

-- 레시피 평가 통계 뷰 생성
CREATE OR REPLACE VIEW recipe_rating_stats AS
SELECT 
    recipe_id,
    COUNT(*) as rating_count,
    ROUND(AVG(rating), 2) as average_rating,
    MIN(rating) as min_rating,
    MAX(rating) as max_rating
FROM recipe_ratings
GROUP BY recipe_id;

COMMENT ON VIEW recipe_rating_stats IS '레시피별 평가 통계 뷰 (평균 평점, 평가 개수)';

-- 인덱스 확인 (이미 생성되어 있어야 함)
-- CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);

-- ============================================
-- 완료
-- ============================================



