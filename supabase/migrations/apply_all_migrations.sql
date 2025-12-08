-- ============================================
-- 통합 마이그레이션 스크립트
-- ============================================
-- 이 파일은 Phase 2, 3, 4의 모든 마이그레이션을 포함합니다.
-- 한 번에 실행하여 모든 테이블과 기능을 생성할 수 있습니다.
-- ============================================

-- ============================================
-- Phase 2: 주간 식단 추천 시스템
-- ============================================

-- 주간 식단 메타데이터 테이블
CREATE TABLE IF NOT EXISTS weekly_diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  is_family BOOLEAN DEFAULT false,
  total_recipes_count INTEGER DEFAULT 0,
  generation_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_id ON weekly_diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_week_start_date ON weekly_diet_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_week ON weekly_diet_plans(user_id, week_year, week_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_diet_plans_unique ON weekly_diet_plans(user_id, week_year, week_number);

-- 주간 장보기 리스트 테이블
CREATE TABLE IF NOT EXISTS weekly_shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  total_quantity DECIMAL(10, 2),
  unit TEXT,
  category TEXT,
  recipes_using JSONB DEFAULT '[]'::jsonb,
  is_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_plan_id ON weekly_shopping_lists(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_shopping_lists_category ON weekly_shopping_lists(category);

-- 주간 영양 통계 테이블
CREATE TABLE IF NOT EXISTS weekly_nutrition_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_diet_plan_id UUID NOT NULL REFERENCES weekly_diet_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  date DATE NOT NULL,
  total_calories DECIMAL(10, 2),
  total_carbohydrates DECIMAL(10, 2),
  total_protein DECIMAL(10, 2),
  total_fat DECIMAL(10, 2),
  total_sodium DECIMAL(10, 2),
  meal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_plan_id ON weekly_nutrition_stats(weekly_diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_nutrition_stats_date ON weekly_nutrition_stats(date);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_weekly_diet_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_weekly_diet_plans_updated_at ON weekly_diet_plans;
CREATE TRIGGER trigger_update_weekly_diet_plans_updated_at
  BEFORE UPDATE ON weekly_diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_diet_plans_updated_at();

ALTER TABLE weekly_diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE weekly_diet_plans IS '주간 식단 메타데이터 (7일치 식단 정보)';
COMMENT ON TABLE weekly_shopping_lists IS '주간 장보기 리스트 (식단 기반 재료 통합)';
COMMENT ON TABLE weekly_nutrition_stats IS '주간 영양 통계 (일별 영양소 합계)';

-- ============================================
-- Phase 3: KCDC (질병관리청) 알림 시스템
-- ============================================

-- KCDC 알림 테이블
CREATE TABLE IF NOT EXISTS kcdc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  flu_stage TEXT,
  flu_week TEXT,
  vaccine_name TEXT,
  target_age_group TEXT,
  recommended_date DATE,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_type ON kcdc_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active ON kcdc_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_published ON kcdc_alerts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_priority ON kcdc_alerts(priority DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active_priority ON kcdc_alerts(is_active, priority DESC, published_at DESC);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_kcdc_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kcdc_alerts_updated_at ON kcdc_alerts;
CREATE TRIGGER trigger_update_kcdc_alerts_updated_at
  BEFORE UPDATE ON kcdc_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_kcdc_alerts_updated_at();

-- 만료된 알림 자동 비활성화 함수
CREATE OR REPLACE FUNCTION deactivate_expired_kcdc_alerts()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE kcdc_alerts
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE kcdc_alerts DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE kcdc_alerts IS '질병관리청(KCDC) 공지 및 알림 데이터';
COMMENT ON COLUMN kcdc_alerts.alert_type IS '알림 유형: flu(독감), vaccination(예방접종), disease_outbreak(질병 발생)';
COMMENT ON COLUMN kcdc_alerts.severity IS '심각도: info(정보), warning(경고), critical(긴급)';

-- KCDC 샘플 데이터 (중복 방지)
INSERT INTO kcdc_alerts (
  alert_type, title, content, severity, flu_stage, flu_week,
  source_url, published_at, is_active, priority, expires_at
)
SELECT 
  'flu',
  '2025년 겨울 독감 주의보 발령',
  '전국적으로 독감 환자가 증가하고 있습니다. 손씻기 등 개인 위생 수칙을 준수하시고, 고위험군은 예방접종을 권장합니다.',
  'warning',
  '주의',
  '2025-W48',
  'https://www.kdca.go.kr',
  '2025-11-27 09:00:00+09',
  true,
  10,
  now() + interval '30 days'
WHERE NOT EXISTS (
  SELECT 1 FROM kcdc_alerts WHERE title = '2025년 겨울 독감 주의보 발령'
);

INSERT INTO kcdc_alerts (
  alert_type, title, content, severity, flu_stage, flu_week,
  source_url, published_at, is_active, priority, expires_at
)
SELECT 
  'vaccination',
  '영유아 필수 예방접종 안내',
  '생후 12개월 영유아는 MMR(홍역·유행성이하선염·풍진) 백신 1차 접종을 받아야 합니다.',
  'info',
  null,
  null,
  'https://www.kdca.go.kr',
  '2025-11-20 10:00:00+09',
  true,
  5,
  now() + interval '90 days'
WHERE NOT EXISTS (
  SELECT 1 FROM kcdc_alerts WHERE title = '영유아 필수 예방접종 안내'
);

-- ============================================
-- Phase 4: 레시피 재료 정보 DB 통합
-- ============================================

-- 재료 카테고리 컬럼 추가 (기존 recipe_ingredients 테이블에)
DO $$ 
BEGIN
  -- ENUM 타입 생성 (이미 있다면 건너뜀)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ingredient_category') THEN
    CREATE TYPE ingredient_category AS ENUM (
      '곡물', '채소', '과일', '육류', '해산물', '유제품', '조미료', '기타'
    );
  END IF;

  -- category 컬럼 추가 (이미 있다면 건너뜀)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipe_ingredients' AND column_name = 'category'
  ) THEN
    ALTER TABLE recipe_ingredients ADD COLUMN category ingredient_category DEFAULT '기타';
  END IF;

  -- is_optional 컬럼 추가 (이미 있다면 건너뜀)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipe_ingredients' AND column_name = 'is_optional'
  ) THEN
    ALTER TABLE recipe_ingredients ADD COLUMN is_optional BOOLEAN DEFAULT false;
  END IF;

  -- preparation_note 컬럼 추가 (이미 있다면 건너뜀)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipe_ingredients' AND column_name = 'preparation_note'
  ) THEN
    ALTER TABLE recipe_ingredients ADD COLUMN preparation_note TEXT;
  END IF;
END $$;

-- 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients(name);

COMMENT ON COLUMN recipe_ingredients.category IS '재료 카테고리 (장보기 리스트 그룹화용)';

-- 샘플 재료 데이터
-- 김치찌개 레시피 재료 추가
DO $$
DECLARE
  v_recipe_id UUID;
BEGIN
  -- 김치찌개 레시피 ID 찾기
  SELECT id INTO v_recipe_id FROM recipes WHERE title = '김치찌개' LIMIT 1;
  
  IF v_recipe_id IS NOT NULL THEN
    -- 기존 데이터가 없을 때만 삽입
    IF NOT EXISTS (SELECT 1 FROM recipe_ingredients WHERE recipe_id = v_recipe_id) THEN
      INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category, order_index) VALUES
        (v_recipe_id, '배추김치', 300, 'g', '채소'::ingredient_category, 1),
        (v_recipe_id, '돼지고기', 200, 'g', '육류'::ingredient_category, 2),
        (v_recipe_id, '두부', 1, '모', '유제품'::ingredient_category, 3),
        (v_recipe_id, '대파', 1, '대', '채소'::ingredient_category, 4),
        (v_recipe_id, '고춧가루', 1, '큰술', '조미료'::ingredient_category, 5),
        (v_recipe_id, '마늘', 3, '쪽', '조미료'::ingredient_category, 6);
    END IF;
  END IF;
END $$;

-- 된장찌개 레시피 재료 추가
DO $$
DECLARE
  v_recipe_id UUID;
BEGIN
  -- 된장찌개 레시피 ID 찾기
  SELECT id INTO v_recipe_id FROM recipes WHERE title = '된장찌개' LIMIT 1;
  
  IF v_recipe_id IS NOT NULL THEN
    -- 기존 데이터가 없을 때만 삽입
    IF NOT EXISTS (SELECT 1 FROM recipe_ingredients WHERE recipe_id = v_recipe_id) THEN
      INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, category, order_index) VALUES
        (v_recipe_id, '된장', 2, '큰술', '조미료'::ingredient_category, 1),
        (v_recipe_id, '두부', 0.5, '모', '유제품'::ingredient_category, 2),
        (v_recipe_id, '감자', 1, '개', '채소'::ingredient_category, 3),
        (v_recipe_id, '애호박', 0.5, '개', '채소'::ingredient_category, 4),
        (v_recipe_id, '대파', 0.5, '대', '채소'::ingredient_category, 5),
        (v_recipe_id, '멸치 육수', 3, '컵', '기타'::ingredient_category, 6);
    END IF;
  END IF;
END $$;

-- ============================================
-- 마이그레이션 완료
-- ============================================

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 모든 마이그레이션이 성공적으로 적용되었습니다!';
  RAISE NOTICE '📊 생성된 테이블:';
  RAISE NOTICE '  - weekly_diet_plans (주간 식단)';
  RAISE NOTICE '  - weekly_shopping_lists (장보기 리스트)';
  RAISE NOTICE '  - weekly_nutrition_stats (영양 통계)';
  RAISE NOTICE '  - kcdc_alerts (KCDC 알림)';
  RAISE NOTICE '  - recipe_ingredients (레시피 재료)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 이제 애플리케이션을 시작할 수 있습니다!';
END $$;

