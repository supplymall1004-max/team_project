-- 가족 구성원 통합 식단 포함 여부 컬럼 추가
-- 각 가족 구성원별로 통합 식단에 포함할지 여부를 제어할 수 있는 기능을 추가

-- include_in_unified_diet 컬럼 추가
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS include_in_unified_diet BOOLEAN DEFAULT true;

-- 기존 레코드 업데이트 (모두 포함으로 설정하여 기존 데이터 호환성 유지)
UPDATE public.family_members
SET include_in_unified_diet = true
WHERE include_in_unified_diet IS NULL;

-- 인덱스 추가 (필요시 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_family_members_include_in_unified_diet
ON public.family_members(include_in_unified_diet);

-- RLS 정책 확인 (개발 환경에서는 비활성화)
-- 프로덕션 환경에서는 적절한 RLS 정책이 필요함
-- ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
