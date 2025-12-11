-- 테이블 관계성 확립 및 제약조건 설정

-- 1. users 테이블 clerk_id UNIQUE 제약조건
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_clerk_id_unique'
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_clerk_id_unique UNIQUE (clerk_id);
  END IF;
END $$;

-- 2. user_health_profiles 관계
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

-- 3. family_members 관계
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'family_members_user_id_fkey'
    AND conrelid = 'family_members'::regclass
  ) THEN
    ALTER TABLE family_members
    ADD CONSTRAINT family_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. notifications 관계
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_user_id_fkey'
    AND conrelid = 'notifications'::regclass
  ) THEN
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_family_member_id_fkey'
    AND conrelid = 'notifications'::regclass
  ) THEN
    ALTER TABLE notifications
    ADD CONSTRAINT notifications_family_member_id_fkey
    FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. calorie_calculation_formulas 관계
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calorie_formulas_user_id_fkey'
    AND conrelid = 'calorie_calculation_formulas'::regclass
  ) THEN
    ALTER TABLE calorie_calculation_formulas
    ADD CONSTRAINT calorie_formulas_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. 주요 건강 관련 테이블 관계
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'health_data_sources'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'health_data_sources_user_id_fkey'
      AND conrelid = 'health_data_sources'::regclass
    ) THEN
      ALTER TABLE health_data_sources
      ADD CONSTRAINT health_data_sources_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'hospital_records'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'hospital_records_user_id_fkey'
      AND conrelid = 'hospital_records'::regclass
    ) THEN
      ALTER TABLE hospital_records
      ADD CONSTRAINT hospital_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'hospital_records_family_member_id_fkey'
      AND conrelid = 'hospital_records'::regclass
    ) THEN
      ALTER TABLE hospital_records
      ADD CONSTRAINT hospital_records_family_member_id_fkey
      FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'medication_records'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'medication_records_user_id_fkey'
      AND conrelid = 'medication_records'::regclass
    ) THEN
      ALTER TABLE medication_records
      ADD CONSTRAINT medication_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'medication_records_family_member_id_fkey'
      AND conrelid = 'medication_records'::regclass
    ) THEN
      ALTER TABLE medication_records
      ADD CONSTRAINT medication_records_family_member_id_fkey
      FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'disease_records'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'disease_records_user_id_fkey'
      AND conrelid = 'disease_records'::regclass
    ) THEN
      ALTER TABLE disease_records
      ADD CONSTRAINT disease_records_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'disease_records_family_member_id_fkey'
      AND conrelid = 'disease_records'::regclass
    ) THEN
      ALTER TABLE disease_records
      ADD CONSTRAINT disease_records_family_member_id_fkey
      FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 7. 레시피 관련 테이블 관계
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'recipes'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'recipes_user_id_fkey'
      AND conrelid = 'recipes'::regclass
    ) THEN
      ALTER TABLE recipes
      ADD CONSTRAINT recipes_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 8. 식단 관련 테이블 관계
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'diet_plans'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'diet_plans_user_id_fkey'
      AND conrelid = 'diet_plans'::regclass
    ) THEN
      ALTER TABLE diet_plans
      ADD CONSTRAINT diet_plans_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'diet_plans_family_member_id_fkey'
      AND conrelid = 'diet_plans'::regclass
    ) THEN
      ALTER TABLE diet_plans
      ADD CONSTRAINT diet_plans_family_member_id_fkey
      FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 9. 구독 및 결제 관련 테이블 관계
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'subscriptions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'subscriptions_user_id_fkey'
      AND conrelid = 'subscriptions'::regclass
    ) THEN
      ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'payment_transactions'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'payment_transactions_user_id_fkey'
      AND conrelid = 'payment_transactions'::regclass
    ) THEN
      ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'payment_transactions_subscription_id_fkey'
      AND conrelid = 'payment_transactions'::regclass
    ) THEN
      ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_subscription_id_fkey
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 10. 인덱스 최적화 (외래키 컬럼)
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id 
ON user_health_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id 
ON family_members(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_family_member_id 
ON notifications(family_member_id) WHERE family_member_id IS NOT NULL;

-- 11. 코멘트
COMMENT ON TABLE users IS '중앙 허브 테이블 - 모든 사용자 관련 테이블의 부모. CASCADE 삭제: user_health_profiles, family_members, notifications, subscriptions 등. SET NULL 삭제: recipes (레시피는 작성자 삭제 후에도 유지).';

COMMENT ON TABLE user_health_profiles IS '사용자 건강 프로필 - users와 1:1 관계 (UNIQUE 제약조건). users 삭제 시 CASCADE로 함께 삭제됨.';

COMMENT ON TABLE family_members IS '가족 구성원 정보 - users와 1:N 관계. users 삭제 시 CASCADE로 함께 삭제됨. 다른 테이블에서 참조 시 SET NULL 정책 적용.';

COMMENT ON TABLE notifications IS '통합 알림 로그 테이블. users 삭제 시 CASCADE로 함께 삭제됨. family_members 삭제 시 SET NULL 정책 적용.';
