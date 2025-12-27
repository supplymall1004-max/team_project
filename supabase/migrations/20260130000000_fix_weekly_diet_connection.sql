-- ============================================================================
-- 주간 식단과 일일 식단 연결 개선 마이그레이션
-- 작성일: 2026-01-30
-- 목적: 
-- 1. 기존 diet_plans의 weekly_diet_plan_id 업데이트 (연결 복구)
-- 2. 주간 식단과 일일 식단 간 관계성 강화
-- 3. 통합 식단 데이터 흐름 개선
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '▶ 주간 식단 연결 개선 마이그레이션 시작';
END $$;

-- ============================================================================
-- 1. 기존 diet_plans의 weekly_diet_plan_id 업데이트 (연결 복구)
-- ============================================================================

-- 주간 식단이 있는 경우, 해당 주간의 일일 식단에 weekly_diet_plan_id 연결
UPDATE diet_plans dp
SET weekly_diet_plan_id = wdp.id
FROM weekly_diet_plans wdp
WHERE dp.user_id = wdp.user_id
  AND dp.plan_date >= wdp.week_start_date
  AND dp.plan_date < wdp.week_start_date + INTERVAL '7 days'
  AND dp.family_member_id IS NULL
  AND dp.is_unified = false
  AND dp.weekly_diet_plan_id IS NULL;

-- 업데이트된 레코드 수 확인
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM diet_plans
  WHERE weekly_diet_plan_id IS NOT NULL;
  
  RAISE NOTICE '✅ weekly_diet_plan_id 연결 완료: %개 레코드', updated_count;
END $$;

-- ============================================================================
-- 2. 인덱스 최적화 (주간 식단 조회 성능 향상)
-- ============================================================================

-- diet_plans의 weekly_diet_plan_id 인덱스 (이미 존재할 수 있음)
CREATE INDEX IF NOT EXISTS idx_diet_plans_weekly_diet_plan_id 
ON diet_plans(weekly_diet_plan_id) 
WHERE weekly_diet_plan_id IS NOT NULL;

-- 복합 인덱스: user_id + plan_date (자주 함께 조회됨)
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_date 
ON diet_plans(user_id, plan_date);

-- 복합 인덱스: user_id + family_member_id + plan_date (가족 식단 조회용)
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_member_date 
ON diet_plans(user_id, family_member_id, plan_date) 
WHERE family_member_id IS NOT NULL;

-- 복합 인덱스: user_id + is_unified + plan_date (통합 식단 조회용)
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_unified_date 
ON diet_plans(user_id, is_unified, plan_date) 
WHERE is_unified = true;

-- 주간 식단 조회 최적화: user_id + week_year + week_number
CREATE INDEX IF NOT EXISTS idx_weekly_diet_plans_user_week_optimized 
ON weekly_diet_plans(user_id, week_year, week_number);

-- ============================================================================
-- 3. 통합 식단 데이터 흐름 개선을 위한 인덱스
-- ============================================================================

-- family_members의 include_in_unified_diet 인덱스
CREATE INDEX IF NOT EXISTS idx_family_members_unified_diet 
ON family_members(user_id, include_in_unified_diet) 
WHERE include_in_unified_diet = true;

-- ============================================================================
-- 4. 주간 식단과 일일 식단 연결 무결성 검증 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_weekly_diet_connection()
RETURNS TABLE(
  weekly_plan_id UUID,
  week_start_date DATE,
  expected_daily_plans INTEGER,
  actual_connected_plans INTEGER,
  missing_connections INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wdp.id,
    wdp.week_start_date,
    21 AS expected_daily_plans, -- 7일 * 3끼니 (아침, 점심, 저녁)
    COUNT(CASE WHEN dp.weekly_diet_plan_id IS NOT NULL THEN 1 END)::INTEGER AS actual_connected_plans,
    (21 - COUNT(CASE WHEN dp.weekly_diet_plan_id IS NOT NULL THEN 1 END))::INTEGER AS missing_connections
  FROM weekly_diet_plans wdp
  LEFT JOIN diet_plans dp ON dp.user_id = wdp.user_id 
    AND dp.plan_date >= wdp.week_start_date 
    AND dp.plan_date < wdp.week_start_date + INTERVAL '7 days'
    AND dp.family_member_id IS NULL
    AND dp.is_unified = false
  GROUP BY wdp.id, wdp.week_start_date
  HAVING COUNT(CASE WHEN dp.weekly_diet_plan_id IS NOT NULL THEN 1 END) < 21
  ORDER BY wdp.week_start_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. 주간 식단 삭제 시 일일 식단 처리 개선 (트리거)
-- ============================================================================

-- 주간 식단 삭제 시 일일 식단의 weekly_diet_plan_id를 NULL로 설정
CREATE OR REPLACE FUNCTION handle_weekly_diet_plan_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 주간 식단 삭제 시 관련 일일 식단의 weekly_diet_plan_id를 NULL로 설정
  UPDATE diet_plans
  SET weekly_diet_plan_id = NULL
  WHERE weekly_diet_plan_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_weekly_diet_plan_delete ON weekly_diet_plans;
CREATE TRIGGER trigger_weekly_diet_plan_delete
  AFTER DELETE ON weekly_diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION handle_weekly_diet_plan_delete();

-- ============================================================================
-- 6. 코멘트 업데이트 (관계 설명)
-- ============================================================================

COMMENT ON COLUMN diet_plans.weekly_diet_plan_id IS 
'주간 식단 계획 ID (선택적). 주간 식단 생성 시 일일 식단들을 그룹화하는 데 사용됩니다. 주간 식단 삭제 시 NULL로 설정됩니다.';

COMMENT ON COLUMN weekly_diet_plans.is_family IS 
'가족 식단 여부. true인 경우 가족 구성원을 고려한 식단입니다.';

COMMENT ON COLUMN family_members.include_in_unified_diet IS 
'통합 식단 포함 여부. true인 경우 해당 구성원의 건강 정보가 통합 식단 생성에 반영됩니다.';

-- ============================================================================
-- 7. 검증 쿼리 (마이그레이션 후 실행하여 확인)
-- ============================================================================

-- 주간 식단 연결 상태 확인
DO $$
DECLARE
  total_plans INTEGER;
  connected_plans INTEGER;
  disconnected_plans INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_plans FROM diet_plans;
  SELECT COUNT(*) INTO connected_plans FROM diet_plans WHERE weekly_diet_plan_id IS NOT NULL;
  SELECT COUNT(*) INTO disconnected_plans FROM diet_plans WHERE weekly_diet_plan_id IS NULL;
  
  RAISE NOTICE '📊 식단 연결 상태:';
  RAISE NOTICE '  - 전체 식단: %개', total_plans;
  RAISE NOTICE '  - 주간 식단 연결됨: %개', connected_plans;
  RAISE NOTICE '  - 주간 식단 미연결: %개', disconnected_plans;
END $$;

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ 주간 식단 연결 개선 마이그레이션 완료';
END $$;

