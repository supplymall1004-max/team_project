-- 관계성 수정 마이그레이션
-- 작성일: 2025-12-20
-- 목적: 중복 Foreign Key 제약조건 제거, 잘못된 CASCADE 정책 수정, 누락된 제약조건 추가

-- ============================================================================
-- 1. 중복 Foreign Key 제약조건 제거
-- ============================================================================

-- calorie_calculation_formulas 테이블의 user_id에 중복된 Foreign Key 제약조건 제거
-- calorie_formulas_user_id_fkey 제약조건 제거 (calorie_calculation_formulas_user_id_fkey 유지)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calorie_formulas_user_id_fkey'
    AND conrelid = 'calorie_calculation_formulas'::regclass
  ) THEN
    ALTER TABLE calorie_calculation_formulas
    DROP CONSTRAINT calorie_formulas_user_id_fkey;
    
    RAISE NOTICE '중복 Foreign Key 제약조건 제거: calorie_formulas_user_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- 2. 잘못된 CASCADE 정책 수정
-- ============================================================================

-- payment_transactions.subscription_id는 결제 내역이므로 구독이 삭제되어도 유지되어야 함
-- ON DELETE CASCADE → ON DELETE SET NULL로 변경
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_transactions_subscription_id_fkey'
    AND conrelid = 'payment_transactions'::regclass
  ) THEN
    -- 기존 제약조건 삭제
    ALTER TABLE payment_transactions
    DROP CONSTRAINT payment_transactions_subscription_id_fkey;
    
    -- 올바른 정책으로 재생성
    ALTER TABLE payment_transactions
    ADD CONSTRAINT payment_transactions_subscription_id_fkey
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'payment_transactions.subscription_id CASCADE 정책 수정: CASCADE → SET NULL';
  END IF;
END $$;

-- ============================================================================
-- 3. 코멘트 업데이트
-- ============================================================================

COMMENT ON CONSTRAINT payment_transactions_subscription_id_fkey ON payment_transactions IS 
'결제 내역의 구독 참조. 구독이 삭제되어도 결제 내역은 유지되므로 ON DELETE SET NULL 정책 적용.';

-- ============================================================================
-- 4. 검증 쿼리 (마이그레이션 후 실행하여 확인)
-- ============================================================================

-- 중복 제약조건 확인 (결과가 없어야 함)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT tc.table_name, kcu.column_name, COUNT(*) as cnt
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'calorie_calculation_formulas'
      AND kcu.column_name = 'user_id'
    GROUP BY tc.table_name, kcu.column_name
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING '중복 Foreign Key 제약조건이 여전히 존재합니다: calorie_calculation_formulas.user_id';
  ELSE
    RAISE NOTICE '검증 완료: 중복 Foreign Key 제약조건 없음';
  END IF;
END $$;

-- payment_transactions.subscription_id 정책 확인
DO $$
DECLARE
  delete_rule TEXT;
BEGIN
  SELECT rc.delete_rule INTO delete_rule
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
  WHERE tc.constraint_name = 'payment_transactions_subscription_id_fkey'
    AND tc.table_schema = 'public';
  
  IF delete_rule = 'SET NULL' THEN
    RAISE NOTICE '검증 완료: payment_transactions.subscription_id 정책이 SET NULL로 설정됨';
  ELSE
    RAISE WARNING 'payment_transactions.subscription_id 정책이 예상과 다릅니다: %', delete_rule;
  END IF;
END $$;
