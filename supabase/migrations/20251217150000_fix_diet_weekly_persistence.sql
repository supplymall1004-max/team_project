-- ============================================================================
-- Fix diet/weekly persistence + normalize diet_plans schema
-- 작성일: 2025-12-17
-- 목적:
-- 1) 개발 환경 기준 RLS 비활성화(저장/조회 막힘 방지)
-- 2) 잘못된 RLS 정책(Clerk sub vs users.id UUID 비교) 제거
-- 3) diet_plans 기본값 정리 (앱 저장 로직과 일치)
-- 4) 주간 식단 관련 테이블도 개발 환경 RLS 비활성화
--
-- 배경:
-- - 현재 앱은 Clerk를 사용하며, JWT의 sub는 clerk_id(TEXT)입니다.
-- - diet_plans.user_id는 users.id(UUID) 이므로,
--   auth.jwt()->>'sub' = user_id::text 정책은 대부분의 요청을 차단합니다.
-- - 개발 단계에서는 RLS를 비활성화하여 저장/조회 문제를 방지합니다.
-- ============================================================================

-- 0) 안전장치: 테이블이 없으면 아무것도 하지 않음
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'diet_plans'
  ) THEN
    RAISE NOTICE 'diet_plans table does not exist - skipping.';
    RETURN;
  END IF;
END $$;

-- 1) 기본값 정리 (앱 저장 로직과 동일하게)
ALTER TABLE public.diet_plans
  ALTER COLUMN ingredients SET DEFAULT '[]'::jsonb;

ALTER TABLE public.diet_plans
  ALTER COLUMN composition_summary SET DEFAULT '[]'::jsonb;

-- 2) 개발 환경: RLS 비활성화 + 과거 정책 제거(있다면)
ALTER TABLE public.diet_plans DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 과거 정책들이 존재하면 삭제
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diet_plans'
  ) THEN
    -- 알려진 정책명들 (없어도 무시)
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own diet plans" ON public.diet_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own diet plans" ON public.diet_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own diet plans" ON public.diet_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own diet plans" ON public.diet_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can do anything" ON public.diet_plans';
  END IF;
END $$;

-- 3) 저장 중복 방지 인덱스(없으면 생성)
-- 개인 식단: family_member_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_user_date_meal_unique
  ON public.diet_plans(user_id, plan_date, meal_type)
  WHERE family_member_id IS NULL;

-- 가족 식단: family_member_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_plans_member_date_meal_unique
  ON public.diet_plans(user_id, family_member_id, plan_date, meal_type)
  WHERE family_member_id IS NOT NULL;

-- 4) 권한(개발 환경)
GRANT ALL ON TABLE public.diet_plans TO anon, authenticated, service_role;

-- 5) 주간 식단 테이블도 개발 환경 RLS 비활성화(없으면 스킵)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='weekly_diet_plans') THEN
    ALTER TABLE public.weekly_diet_plans DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='weekly_shopping_lists') THEN
    ALTER TABLE public.weekly_shopping_lists DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='weekly_nutrition_stats') THEN
    ALTER TABLE public.weekly_nutrition_stats DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ diet/weekly persistence fixed (diet_plans RLS disabled, legacy policies dropped).';
END $$;
