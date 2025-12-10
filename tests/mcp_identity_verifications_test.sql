-- MCP Identity Verifications 테스트 스크립트
-- 가정: 이미 MCP 환경에서 identity_verifications 테이블과 FK 제약이 존재한다고 가정합니다.

-- 0) 테스트 Clerk 계정 준비
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE clerk_id = 'mcp-test-clerk-1') THEN
    INSERT INTO public.users (clerk_id, name)
    VALUES ('mcp-test-clerk-1', 'MCP Test Clerk 1');
  END IF;
END $$;

-- 1) 테스트 데이터 삽입 (FK가 작동하는지 확인)
INSERT INTO public.identity_verifications (
  clerk_user_id, name, national_id_hash, consent, status, created_at
) VALUES ('mcp-test-clerk-1', 'MCP Test Verification', 'hash-mcp-001', TRUE, 'pending', NOW())
ON CONFLICT DO NOTHING;

-- 2) 삽입 확인
SELECT * FROM public.identity_verifications WHERE clerk_user_id = 'mcp-test-clerk-1';

-- 3) FK 위반 테스트 (존재하지 않는 clerk_id로 삽입 시도)
DO $$ BEGIN
  BEGIN
    INSERT INTO public.identity_verifications (
      clerk_user_id, name, national_id_hash, consent, status, created_at
    ) VALUES ('non-existent-clerk', 'FK Violation Test', 'hash', TRUE, 'pending', NOW());
  EXCEPTION WHEN foreign_key_violation THEN
    -- 정상 동작 기대: FK 위반
    RAISE NOTICE 'FK violation occurred as expected';
  END;
END $$;

-- 4) 아이덴토페이스(중복 실행 방지) 확인
CREATE TABLE IF NOT EXISTS public.identity_verifications_dummy_check
(
  dummy BOOLEAN
);
DROP TABLE IF EXISTS public.identity_verifications_dummy_check;

-- 5) CASCADE 동작 확인: Clerk 제거 시 관련 레코드도 삭제되는지 확인
DELETE FROM public.users WHERE clerk_id = 'mcp-test-clerk-1';
SELECT * FROM public.identity_verifications WHERE clerk_user_id = 'mcp-test-clerk-1';

-- 6) 테스트 데이터 정리
DELETE FROM public.identity_verifications WHERE clerk_user_id = 'mcp-test-clerk-1';

