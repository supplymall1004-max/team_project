-- user_health_profiles 테이블 중복 컬럼 제거 및 제약조건 설정

-- 1. 기존 TEXT[] 데이터를 JSONB로 마이그레이션
-- diseases 컬럼이 TEXT[] 타입인 경우에만 변환
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'diseases'
    AND data_type = 'ARRAY'
  ) THEN
    UPDATE user_health_profiles
    SET diseases_jsonb = CASE
      WHEN diseases_jsonb IS NULL OR diseases_jsonb = '[]'::jsonb THEN
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('code', d, 'custom_name', null))
           FROM unnest(diseases::TEXT[]) AS d),
          '[]'::jsonb
        )
      ELSE diseases_jsonb
      END
    WHERE diseases IS NOT NULL AND array_length(diseases::TEXT[], 1) > 0;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'allergies'
    AND data_type = 'ARRAY'
  ) THEN
    UPDATE user_health_profiles
    SET allergies_jsonb = CASE
      WHEN allergies_jsonb IS NULL OR allergies_jsonb = '[]'::jsonb THEN
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('code', a, 'custom_name', null))
           FROM unnest(allergies::TEXT[]) AS a),
          '[]'::jsonb
        )
      ELSE allergies_jsonb
      END
    WHERE allergies IS NOT NULL AND array_length(allergies::TEXT[], 1) > 0;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'preferred_ingredients'
    AND data_type = 'ARRAY'
  ) THEN
    UPDATE user_health_profiles
    SET preferred_ingredients_jsonb = CASE
      WHEN preferred_ingredients_jsonb IS NULL OR preferred_ingredients_jsonb = '[]'::jsonb THEN
        COALESCE(
          (SELECT jsonb_agg(elem)
           FROM unnest(preferred_ingredients::TEXT[]) AS elem),
          '[]'::jsonb
        )
      ELSE preferred_ingredients_jsonb
      END
    WHERE preferred_ingredients IS NOT NULL AND array_length(preferred_ingredients::TEXT[], 1) > 0;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'dietary_preferences'
    AND data_type = 'ARRAY'
  ) THEN
    UPDATE user_health_profiles
    SET dietary_preferences_jsonb = CASE
      WHEN dietary_preferences_jsonb IS NULL OR dietary_preferences_jsonb = '[]'::jsonb THEN
        COALESCE(
          (SELECT jsonb_agg(elem)
           FROM unnest(dietary_preferences::TEXT[]) AS elem),
          '[]'::jsonb
        )
      ELSE dietary_preferences_jsonb
      END
    WHERE dietary_preferences IS NOT NULL AND array_length(dietary_preferences::TEXT[], 1) > 0;
  END IF;
END $$;

-- 2. JSONB 컬럼 이름 단순화
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS diseases_new JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'diseases_jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET diseases_new = COALESCE(diseases_jsonb, '[]'::jsonb);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'diseases'
    AND udt_name = 'jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET diseases_new = COALESCE(diseases, '[]'::jsonb);
  END IF;
END $$;

ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS allergies_new JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'allergies_jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET allergies_new = COALESCE(allergies_jsonb, '[]'::jsonb);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'allergies'
    AND udt_name = 'jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET allergies_new = COALESCE(allergies, '[]'::jsonb);
  END IF;
END $$;

ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS preferred_ingredients_new JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'preferred_ingredients_jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET preferred_ingredients_new = COALESCE(preferred_ingredients_jsonb, '[]'::jsonb);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'preferred_ingredients'
    AND udt_name = 'jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET preferred_ingredients_new = COALESCE(preferred_ingredients, '[]'::jsonb);
  END IF;
END $$;

ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS dietary_preferences_new JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'dietary_preferences_jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET dietary_preferences_new = COALESCE(dietary_preferences_jsonb, '[]'::jsonb);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_health_profiles'
    AND column_name = 'dietary_preferences'
    AND udt_name = 'jsonb'
  ) THEN
    UPDATE user_health_profiles
    SET dietary_preferences_new = COALESCE(dietary_preferences, '[]'::jsonb);
  END IF;
END $$;

-- 3. 기존 컬럼 삭제 및 새 컬럼 이름 변경
ALTER TABLE user_health_profiles
DROP COLUMN IF EXISTS diseases,
DROP COLUMN IF EXISTS allergies,
DROP COLUMN IF EXISTS preferred_ingredients,
DROP COLUMN IF EXISTS dietary_preferences,
DROP COLUMN IF EXISTS diseases_jsonb,
DROP COLUMN IF EXISTS allergies_jsonb,
DROP COLUMN IF EXISTS preferred_ingredients_jsonb,
DROP COLUMN IF EXISTS dietary_preferences_jsonb;

ALTER TABLE user_health_profiles
RENAME COLUMN diseases_new TO diseases;

ALTER TABLE user_health_profiles
RENAME COLUMN allergies_new TO allergies;

ALTER TABLE user_health_profiles
RENAME COLUMN preferred_ingredients_new TO preferred_ingredients;

ALTER TABLE user_health_profiles
RENAME COLUMN dietary_preferences_new TO dietary_preferences;

-- 4. 기본값 및 NOT NULL 설정
ALTER TABLE user_health_profiles
ALTER COLUMN diseases SET DEFAULT '[]'::jsonb,
ALTER COLUMN allergies SET DEFAULT '[]'::jsonb,
ALTER COLUMN preferred_ingredients SET DEFAULT '[]'::jsonb,
ALTER COLUMN dietary_preferences SET DEFAULT '[]'::jsonb;

UPDATE user_health_profiles
SET diseases = '[]'::jsonb WHERE diseases IS NULL;

UPDATE user_health_profiles
SET allergies = '[]'::jsonb WHERE allergies IS NULL;

UPDATE user_health_profiles
SET preferred_ingredients = '[]'::jsonb WHERE preferred_ingredients IS NULL;

UPDATE user_health_profiles
SET dietary_preferences = '[]'::jsonb WHERE dietary_preferences IS NULL;

ALTER TABLE user_health_profiles
ALTER COLUMN diseases SET NOT NULL,
ALTER COLUMN allergies SET NOT NULL,
ALTER COLUMN preferred_ingredients SET NOT NULL,
ALTER COLUMN dietary_preferences SET NOT NULL;

-- 5. 인덱스 재생성 (GIN 인덱스)
DROP INDEX IF EXISTS idx_user_health_profiles_diseases;
DROP INDEX IF EXISTS idx_user_health_profiles_allergies;
DROP INDEX IF EXISTS idx_user_health_profiles_dietary_preferences;

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_diseases 
ON user_health_profiles USING GIN (diseases);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_allergies 
ON user_health_profiles USING GIN (allergies);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_preferred_ingredients 
ON user_health_profiles USING GIN (preferred_ingredients);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_dietary_preferences 
ON user_health_profiles USING GIN (dietary_preferences);

-- 6. 외래키 및 UNIQUE 제약조건
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_health_profiles_user_id_fkey'
    AND conrelid = 'user_health_profiles'::regclass
  ) THEN
    ALTER TABLE user_health_profiles
    ADD CONSTRAINT user_health_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_health_profiles_user_id_unique'
    AND conrelid = 'user_health_profiles'::regclass
  ) THEN
    ALTER TABLE user_health_profiles
    ADD CONSTRAINT user_health_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 7. 인덱스 추가 (외래키 컬럼)
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id 
ON user_health_profiles(user_id);

-- 8. 코멘트
COMMENT ON COLUMN user_health_profiles.diseases IS '사용자 질병 목록 (JSONB 배열) - 형식: [{"code": "diabetes_type2", "custom_name": null}]';

COMMENT ON COLUMN user_health_profiles.allergies IS '사용자 알레르기 목록 (JSONB 배열) - 형식: [{"code": "peanuts", "custom_name": null}]';

COMMENT ON COLUMN user_health_profiles.preferred_ingredients IS '선호 식재료 목록 (JSONB 배열) - 형식: ["chicken", "broccoli"]';

COMMENT ON COLUMN user_health_profiles.dietary_preferences IS '프리미엄 식단 타입 (JSONB 배열) - 형식: ["bento", "fitness", "low_carb", "vegan"]';

-- 9. RLS 비활성화
ALTER TABLE user_health_profiles DISABLE ROW LEVEL SECURITY;
