-- ============================================================================
-- 테스트 데이터 v1.0
-- 작성일: 2025-12-02
-- 설명: Phase 2 데이터 완성 - 테스트 데이터 생성
--       추가 레시피, 가족 구성원, 식단 계획 샘플 데이터
-- ============================================================================

-- ============================================================================
-- 1. 추가 레시피 및 재료 데이터
-- ============================================================================

-- 기존 사용자 ID 가져오기 (없으면 첫 번째 사용자 사용)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- 기존 사용자 중 하나 선택
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '사용자가 없습니다. 먼저 사용자를 생성해주세요.';
  END IF;

  -- 추가 레시피 5개 생성
  INSERT INTO recipes (
    user_id, slug, title, description, difficulty, cooking_time_minutes,
    servings, calories, carbohydrates, protein, fat, sodium
  ) VALUES
  (
    test_user_id,
    'bulgogi',
    '불고기',
    '한국의 대표적인 고기 요리로, 얇게 썬 쇠고기를 양념에 재워 구운 요리입니다.',
    3,
    30,
    4,
    350.0,
    15.0,
    25.0,
    20.0,
    1200.0
  ),
  (
    test_user_id,
    'bibimbap',
    '비빔밥',
    '밥 위에 여러 나물과 고기를 올리고 고추장을 넣어 비벼 먹는 한국의 대표 음식입니다.',
    2,
    20,
    2,
    450.0,
    60.0,
    15.0,
    12.0,
    800.0
  ),
  (
    test_user_id,
    'samgyetang',
    '삼계탕',
    '여름 보양식으로 유명한 닭고기와 인삼을 넣고 끓인 국물 요리입니다.',
    3,
    90,
    2,
    550.0,
    5.0,
    45.0,
    25.0,
    1500.0
  ),
  (
    test_user_id,
    'japchae',
    '잡채',
    '당면과 각종 채소를 볶아 만든 한국의 대표적인 잔치 음식입니다.',
    2,
    25,
    4,
    280.0,
    45.0,
    8.0,
    8.0,
    600.0
  ),
  (
    test_user_id,
    'galbi-jjim',
    '갈비찜',
    '소갈비를 양념에 재워 부드럽게 끓인 한국의 대표적인 찜 요리입니다.',
    4,
    120,
    4,
    420.0,
    10.0,
    30.0,
    22.0,
    1100.0
  )
  ON CONFLICT (slug) DO NOTHING;

  -- 불고기 재료
  INSERT INTO recipe_ingredients (
    recipe_id, name, ingredient_name, quantity, unit, category, display_order
  )
  SELECT 
    r.id,
    '쇠고기',
    '쇠고기',
    500,
    'g',
    '육류'::ingredient_category,
    1
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    '양파',
    '양파',
    1,
    '개',
    '채소'::ingredient_category,
    2
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    '대파',
    '대파',
    2,
    '대',
    '채소'::ingredient_category,
    3
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    '설탕',
    '설탕',
    2,
    '큰술',
    '조미료'::ingredient_category,
    4
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    '간장',
    '간장',
    3,
    '큰술',
    '조미료'::ingredient_category,
    5
  FROM recipes r WHERE r.slug = 'bulgogi';

  -- 비빔밥 재료
  INSERT INTO recipe_ingredients (
    recipe_id, name, ingredient_name, quantity, unit, category, display_order
  )
  SELECT 
    r.id,
    '밥',
    '밥',
    2,
    '공기',
    '곡물'::ingredient_category,
    1
  FROM recipes r WHERE r.slug = 'bibimbap'
  UNION ALL
  SELECT 
    r.id,
    '시금치',
    '시금치',
    100,
    'g',
    '채소'::ingredient_category,
    2
  FROM recipes r WHERE r.slug = 'bibimbap'
  UNION ALL
  SELECT 
    r.id,
    '콩나물',
    '콩나물',
    150,
    'g',
    '채소'::ingredient_category,
    3
  FROM recipes r WHERE r.slug = 'bibimbap'
  UNION ALL
  SELECT 
    r.id,
    '고추장',
    '고추장',
    2,
    '큰술',
    '조미료'::ingredient_category,
    4
  FROM recipes r WHERE r.slug = 'bibimbap'
  UNION ALL
  SELECT 
    r.id,
    '달걀',
    '달걀',
    2,
    '개',
    '기타'::ingredient_category,
    5
  FROM recipes r WHERE r.slug = 'bibimbap';

  -- 삼계탕 재료
  INSERT INTO recipe_ingredients (
    recipe_id, name, ingredient_name, quantity, unit, category, display_order
  )
  SELECT 
    r.id,
    '닭',
    '닭',
    1,
    '마리',
    '육류'::ingredient_category,
    1
  FROM recipes r WHERE r.slug = 'samgyetang'
  UNION ALL
  SELECT 
    r.id,
    '인삼',
    '인삼',
    1,
    '뿌리',
    '기타'::ingredient_category,
    2
  FROM recipes r WHERE r.slug = 'samgyetang'
  UNION ALL
  SELECT 
    r.id,
    '대추',
    '대추',
    5,
    '개',
    '과일'::ingredient_category,
    3
  FROM recipes r WHERE r.slug = 'samgyetang'
  UNION ALL
  SELECT 
    r.id,
    '마늘',
    '마늘',
    10,
    '쪽',
    '채소'::ingredient_category,
    4
  FROM recipes r WHERE r.slug = 'samgyetang'
  UNION ALL
  SELECT 
    r.id,
    '찹쌀',
    '찹쌀',
    100,
    'g',
    '곡물'::ingredient_category,
    5
  FROM recipes r WHERE r.slug = 'samgyetang';

  -- 잡채 재료
  INSERT INTO recipe_ingredients (
    recipe_id, name, ingredient_name, quantity, unit, category, display_order
  )
  SELECT 
    r.id,
    '당면',
    '당면',
    200,
    'g',
    '기타'::ingredient_category,
    1
  FROM recipes r WHERE r.slug = 'japchae'
  UNION ALL
  SELECT 
    r.id,
    '시금치',
    '시금치',
    100,
    'g',
    '채소'::ingredient_category,
    2
  FROM recipes r WHERE r.slug = 'japchae'
  UNION ALL
  SELECT 
    r.id,
    '당근',
    '당근',
    1,
    '개',
    '채소'::ingredient_category,
    3
  FROM recipes r WHERE r.slug = 'japchae'
  UNION ALL
  SELECT 
    r.id,
    '버섯',
    '버섯',
    100,
    'g',
    '채소'::ingredient_category,
    4
  FROM recipes r WHERE r.slug = 'japchae'
  UNION ALL
  SELECT 
    r.id,
    '간장',
    '간장',
    3,
    '큰술',
    '조미료'::ingredient_category,
    5
  FROM recipes r WHERE r.slug = 'japchae';

  -- 갈비찜 재료
  INSERT INTO recipe_ingredients (
    recipe_id, name, ingredient_name, quantity, unit, category, display_order
  )
  SELECT 
    r.id,
    '소갈비',
    '소갈비',
    800,
    'g',
    '육류'::ingredient_category,
    1
  FROM recipes r WHERE r.slug = 'galbi-jjim'
  UNION ALL
  SELECT 
    r.id,
    '무',
    '무',
    200,
    'g',
    '채소'::ingredient_category,
    2
  FROM recipes r WHERE r.slug = 'galbi-jjim'
  UNION ALL
  SELECT 
    r.id,
    '당근',
    '당근',
    1,
    '개',
    '채소'::ingredient_category,
    3
  FROM recipes r WHERE r.slug = 'galbi-jjim'
  UNION ALL
  SELECT 
    r.id,
    '대추',
    '대추',
    5,
    '개',
    '과일'::ingredient_category,
    4
  FROM recipes r WHERE r.slug = 'galbi-jjim'
  UNION ALL
  SELECT 
    r.id,
    '간장',
    '간장',
    5,
    '큰술',
    '조미료'::ingredient_category,
    5
  FROM recipes r WHERE r.slug = 'galbi-jjim';

  -- 레시피 단계 추가 (불고기 예시)
  INSERT INTO recipe_steps (recipe_id, step_number, content)
  SELECT 
    r.id,
    1,
    '쇠고기를 얇게 썰어 준비합니다.'
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    2,
    '양파와 대파를 썰어 준비합니다.'
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    3,
    '간장, 설탕, 다진 마늘, 생강즙을 섞어 양념장을 만듭니다.'
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    4,
    '쇠고기를 양념장에 30분 이상 재웁니다.'
  FROM recipes r WHERE r.slug = 'bulgogi'
  UNION ALL
  SELECT 
    r.id,
    5,
    '팬에 기름을 두르고 고기를 볶습니다.'
  FROM recipes r WHERE r.slug = 'bulgogi'
  ON CONFLICT (recipe_id, step_number) DO NOTHING;

END $$;

-- ============================================================================
-- 2. 가족 구성원 샘플 데이터
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- 기존 사용자 중 하나 선택
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '사용자가 없습니다. 먼저 사용자를 생성해주세요.';
  END IF;

  -- 가족 구성원 3명 추가
  INSERT INTO family_members (
    user_id, name, birth_date, gender, relationship,
    height_cm, weight_kg, activity_level, include_in_unified_diet
  ) VALUES
  (
    test_user_id,
    '김아빠',
    '1975-05-15',
    'male',
    '부',
    175,
    75.0,
    'moderate',
    true
  ),
  (
    test_user_id,
    '김엄마',
    '1978-08-22',
    'female',
    '모',
    162,
    58.0,
    'light',
    true
  ),
  (
    test_user_id,
    '김아들',
    '2010-03-10',
    'male',
    '자녀',
    145,
    38.0,
    'active',
    true
  )
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================================
-- 3. 식단 계획 샘플 데이터
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID;
  family_member_1_id UUID;
  family_member_2_id UUID;
  recipe_1_id UUID;
  recipe_2_id UUID;
  recipe_3_id UUID;
  week_start_date DATE;
  weekly_plan_id UUID;
BEGIN
  -- 기존 사용자 중 하나 선택
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '사용자가 없습니다. 먼저 사용자를 생성해주세요.';
  END IF;

  -- 가족 구성원 ID 가져오기
  SELECT id INTO family_member_1_id FROM family_members WHERE user_id = test_user_id LIMIT 1 OFFSET 0;
  SELECT id INTO family_member_2_id FROM family_members WHERE user_id = test_user_id LIMIT 1 OFFSET 1;

  -- 레시피 ID 가져오기
  SELECT id INTO recipe_1_id FROM recipes WHERE slug = 'bulgogi' LIMIT 1;
  SELECT id INTO recipe_2_id FROM recipes WHERE slug = 'bibimbap' LIMIT 1;
  SELECT id INTO recipe_3_id FROM recipes WHERE slug = 'samgyetang' LIMIT 1;

  -- 이번 주 월요일 날짜 계산
  week_start_date := DATE_TRUNC('week', CURRENT_DATE)::DATE;

  -- 주간 식단 메타데이터 생성
  INSERT INTO weekly_diet_plans (
    user_id, week_start_date, week_year, week_number, is_family, total_recipes_count
  ) VALUES (
    test_user_id,
    week_start_date,
    EXTRACT(YEAR FROM week_start_date)::INTEGER,
    EXTRACT(WEEK FROM week_start_date)::INTEGER,
    true,
    21  -- 3끼 x 7일 = 21끼
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO weekly_plan_id;

  -- 주간 식단 메타데이터가 없으면 생성
  IF weekly_plan_id IS NULL THEN
    SELECT id INTO weekly_plan_id FROM weekly_diet_plans 
    WHERE user_id = test_user_id AND week_start_date = week_start_date;
  END IF;

  -- 일일 식단 계획 생성 (월요일부터 일요일까지)
  FOR i IN 0..6 LOOP
    DECLARE
      plan_date DATE;
    BEGIN
      plan_date := week_start_date + (i || ' days')::INTERVAL;

      -- 아침 식단 (개인)
      INSERT INTO diet_plans (
        user_id, family_member_id, plan_date, meal_type,
        recipe_id, recipe_title, recipe_description,
        calories, protein_g, carbs_g, fat_g, sodium_mg,
        is_unified
      ) VALUES (
        test_user_id,
        NULL,
        plan_date,
        'breakfast',
        recipe_1_id,
        '불고기',
        '한국의 대표적인 고기 요리',
        350,
        25.0,
        15.0,
        20.0,
        1200,
        false
      );

      -- 점심 식단 (개인)
      INSERT INTO diet_plans (
        user_id, family_member_id, plan_date, meal_type,
        recipe_id, recipe_title, recipe_description,
        calories, protein_g, carbs_g, fat_g, sodium_mg,
        is_unified
      ) VALUES (
        test_user_id,
        NULL,
        plan_date,
        'lunch',
        recipe_2_id,
        '비빔밥',
        '밥 위에 여러 나물과 고기를 올리고 고추장을 넣어 비벼 먹는 한국의 대표 음식',
        450,
        15.0,
        60.0,
        12.0,
        800,
        false
      );

      -- 저녁 식단 (통합 - 가족 구성원 포함)
      INSERT INTO diet_plans (
        user_id, family_member_id, plan_date, meal_type,
        recipe_id, recipe_title, recipe_description,
        calories, protein_g, carbs_g, fat_g, sodium_mg,
        is_unified
      ) VALUES (
        test_user_id,
        NULL,
        plan_date,
        'dinner',
        recipe_3_id,
        '삼계탕',
        '여름 보양식으로 유명한 닭고기와 인삼을 넣고 끓인 국물 요리',
        550,
        45.0,
        5.0,
        25.0,
        1500,
        true
      );

      -- 가족 구성원별 개인 식단 (아침)
      IF family_member_1_id IS NOT NULL THEN
        INSERT INTO diet_plans (
          user_id, family_member_id, plan_date, meal_type,
          recipe_id, recipe_title, recipe_description,
          calories, protein_g, carbs_g, fat_g, sodium_mg,
          is_unified
        ) VALUES (
          test_user_id,
          family_member_1_id,
          plan_date,
          'breakfast',
          recipe_1_id,
          '불고기',
          '한국의 대표적인 고기 요리',
          350,
          25.0,
          15.0,
          20.0,
          1200,
          false
        );
      END IF;

    END;
  END LOOP;

  -- 주간 장보기 리스트 생성
  IF weekly_plan_id IS NOT NULL THEN
    INSERT INTO weekly_shopping_lists (
      weekly_diet_plan_id, ingredient_name, total_quantity, unit, category, recipes_using
    ) VALUES
    (
      weekly_plan_id,
      '쇠고기',
      2.0,
      'kg',
      '육류',
      '["불고기", "갈비찜"]'::jsonb
    ),
    (
      weekly_plan_id,
      '밥',
      5.0,
      '공기',
      '곡물',
      '["비빔밥"]'::jsonb
    ),
    (
      weekly_plan_id,
      '닭',
      2.0,
      '마리',
      '육류',
      '["삼계탕"]'::jsonb
    ),
    (
      weekly_plan_id,
      '시금치',
      500.0,
      'g',
      '채소',
      '["비빔밥", "잡채"]'::jsonb
    ),
    (
      weekly_plan_id,
      '간장',
      1.0,
      '병',
      '조미료',
      '["불고기", "잡채", "갈비찜"]'::jsonb
    );
  END IF;

  -- 주간 영양 통계 생성 (월요일부터 일요일까지)
  IF weekly_plan_id IS NOT NULL THEN
    FOR i IN 0..6 LOOP
      DECLARE
        stat_date DATE;
      BEGIN
        stat_date := week_start_date + (i || ' days')::INTERVAL;

        INSERT INTO weekly_nutrition_stats (
          weekly_diet_plan_id, day_of_week, date,
          total_calories, total_carbohydrates, total_protein, total_fat, total_sodium,
          meal_count
        ) VALUES (
          weekly_plan_id,
          i,
          stat_date,
          1350.0,  -- 아침 + 점심 + 저녁
          80.0,
          85.0,
          57.0,
          3500.0,
          3
        );
      END;
    END LOOP;
  END IF;

END $$;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ 테스트 데이터가 성공적으로 생성되었습니다!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 생성된 테스트 데이터:';
  RAISE NOTICE '  - 추가 레시피: 5개 (불고기, 비빔밥, 삼계탕, 잡채, 갈비찜)';
  RAISE NOTICE '  - 레시피 재료: 25개';
  RAISE NOTICE '  - 레시피 단계: 5개 (불고기)';
  RAISE NOTICE '  - 가족 구성원: 3명';
  RAISE NOTICE '  - 식단 계획: 7일치 (아침, 점심, 저녁)';
  RAISE NOTICE '  - 주간 장보기 리스트: 5개 항목';
  RAISE NOTICE '  - 주간 영양 통계: 7일치';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Phase 2 데이터 완성 작업이 완료되었습니다!';
END $$;

