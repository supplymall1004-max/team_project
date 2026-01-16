-- 전문가 Q&A 시스템을 위한 커뮤니티 확장
-- users 테이블에 전문가 정보 추가
-- community_posts 테이블에 Q&A 기능 추가

-- users 테이블에 전문가 정보 추가
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_expert BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS expert_field TEXT, -- 'nutrition', 'pediatrics', 'cooking', 'fitness'
  ADD COLUMN IF NOT EXISTS expert_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expert_description TEXT,
  ADD COLUMN IF NOT EXISTS expert_credentials TEXT; -- 자격증, 경력 등

-- community_posts 테이블에 Q&A 기능 추가
ALTER TABLE community_posts 
  ADD COLUMN IF NOT EXISTS is_qa BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS best_answer_id UUID REFERENCES community_comments(id),
  ADD COLUMN IF NOT EXISTS answer_count INTEGER DEFAULT 0;

-- 전문가 인증 신청 테이블
CREATE TABLE IF NOT EXISTS expert_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  credentials TEXT NOT NULL,
  description TEXT,
  documents TEXT[], -- 증빙 서류 URL
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_experts ON users(is_expert) WHERE is_expert = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_posts_qa ON community_posts(is_qa) WHERE is_qa = TRUE;
CREATE INDEX IF NOT EXISTS idx_expert_verifications_status ON expert_verifications(status, created_at DESC);

-- RLS 비활성화 (개발)
ALTER TABLE expert_verifications DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE expert_verifications TO anon, authenticated, service_role;

COMMENT ON TABLE expert_verifications IS '전문가 인증 신청 및 승인 관리';
COMMENT ON COLUMN users.is_expert IS '전문가 여부';
COMMENT ON COLUMN users.expert_field IS '전문 분야 (nutrition, pediatrics, cooking, fitness)';
COMMENT ON COLUMN community_posts.is_qa IS 'Q&A 게시글 여부';
COMMENT ON COLUMN community_posts.best_answer_id IS '베스트 답변 댓글 ID';

