-- ============================================
-- 추가 함수 및 트리거 (레시피 평가 평균, 주간 식단 통계, 사용자 구독 자동 생성)
-- ============================================

-- ============================================
-- 1. 레시피 평가 평균 점수 계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION calculate_recipe_average_rating(recipe_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT COALESCE(AVG(rating), 0) INTO avg_rating
    FROM recipe_ratings
    WHERE recipe_id = recipe_uuid;
    
    RETURN ROUND(avg_rating, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_recipe_average_rating(UUID) IS '레시피의 평균 평점을 계산하는 함수 (0~5점, 소수점 둘째 자리까지)';

-- ============================================
-- 2. 레시피 평가 개수 계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_recipe_rating_count(recipe_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    rating_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rating_count
    FROM recipe_ratings
    WHERE recipe_id = recipe_uuid;
    
    RETURN rating_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recipe_rating_count(UUID) IS '레시피의 평가 개수를 반환하는 함수';

-- ============================================
-- 3. 주간 식단 통계 자동 계산 함수
-- ============================================

CREATE OR REPLACE FUNCTION calculate_weekly_nutrition_stats(weekly_diet_plan_uuid UUID)
RETURNS VOID AS $$
DECLARE
    week_start DATE;
    week_end DATE;
    current_day DATE;
    day_num INTEGER;
    daily_calories NUMERIC;
    daily_carbs NUMERIC;
    daily_protein NUMERIC;
    daily_fat NUMERIC;
    daily_sodium NUMERIC;
    meal_count INTEGER;
    plan_user_id UUID;
BEGIN
    -- 주간 식단 계획의 시작일과 사용자 ID 가져오기
    SELECT week_start_date, user_id INTO week_start, plan_user_id
    FROM weekly_diet_plans
    WHERE id = weekly_diet_plan_uuid;
    
    IF week_start IS NULL THEN
        RAISE EXCEPTION '주간 식단 계획을 찾을 수 없습니다: %', weekly_diet_plan_uuid;
    END IF;
    
    week_end := week_start + INTERVAL '6 days';
    
    -- 기존 통계 삭제
    DELETE FROM weekly_nutrition_stats
    WHERE weekly_diet_plan_id = weekly_diet_plan_uuid;
    
    -- 일별 통계 계산 및 삽입
    current_day := week_start;
    day_num := 0;
    
    WHILE current_day <= week_end LOOP
        -- 해당 날짜의 식단에서 영양소 합계 계산
        SELECT 
            COALESCE(SUM(calories), 0),
            COALESCE(SUM(carbs_g), 0),
            COALESCE(SUM(protein_g), 0),
            COALESCE(SUM(fat_g), 0),
            COALESCE(SUM(sodium_mg), 0),
            COUNT(*)
        INTO 
            daily_calories,
            daily_carbs,
            daily_protein,
            daily_fat,
            daily_sodium,
            meal_count
        FROM diet_plans
        WHERE user_id = plan_user_id
        AND plan_date = current_day;
        
        -- 통계 삽입
        INSERT INTO weekly_nutrition_stats (
            weekly_diet_plan_id,
            day_of_week,
            date,
            total_calories,
            total_carbohydrates,
            total_protein,
            total_fat,
            total_sodium,
            meal_count
        ) VALUES (
            weekly_diet_plan_uuid,
            day_num,
            current_day,
            daily_calories,
            daily_carbs,
            daily_protein,
            daily_fat,
            daily_sodium,
            meal_count
        )
        ON CONFLICT DO NOTHING;
        
        current_day := current_day + INTERVAL '1 day';
        day_num := day_num + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_weekly_nutrition_stats(UUID) IS '주간 식단 계획의 일별 영양 통계를 자동으로 계산하고 저장하는 함수';

-- ============================================
-- 4. 사용자 생성 시 기본 구독 플랜 자동 생성 트리거 함수
-- ============================================

CREATE OR REPLACE FUNCTION create_default_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- 사용자 생성 시 자동으로 'free' 플랜 생성
    INSERT INTO user_subscriptions (
        user_id,
        subscription_plan,
        started_at,
        expires_at,
        is_active
    ) VALUES (
        NEW.id,
        'free',
        now(),
        NULL, -- 무료 플랜은 만료일 없음
        TRUE
    )
    ON CONFLICT (user_id) DO NOTHING; -- 이미 존재하면 무시
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_default_user_subscription() IS '사용자 생성 시 자동으로 기본 구독 플랜(free)을 생성하는 트리거 함수';

-- ============================================
-- 5. 사용자 생성 시 기본 구독 플랜 트리거 생성
-- ============================================

CREATE TRIGGER trigger_create_default_user_subscription
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_subscription();

-- ============================================
-- 6. 레시피 평가 변경 시 평균 점수 업데이트 트리거 함수 (선택사항)
-- ============================================

-- 참고: recipes 테이블에 average_rating 컬럼이 있다면 사용 가능
-- 현재는 함수로만 제공하고, 필요시 recipes 테이블에 컬럼 추가 후 트리거 활성화 가능

-- ============================================
-- 완료
-- ============================================

