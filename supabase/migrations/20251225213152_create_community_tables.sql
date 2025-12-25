-- 커뮤니티 시스템 테이블 생성
-- 소셜 그룹 중심의 커뮤니티 시스템을 위한 테이블들
-- 생성일: 2025-12-25
-- 개발 환경: RLS 비활성화 (프로덕션 배포 전 활성화 필요)

-- =============================================
-- 1. 커뮤니티 그룹 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('health', 'pet', 'recipe', 'exercise', 'region')),
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  is_family_only BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE community_groups IS '커뮤니티 그룹 - 사용자들이 관심사별로 생성하는 소셜 그룹';
COMMENT ON COLUMN community_groups.category IS '그룹 카테고리: health(건강), pet(반려동물), recipe(레시피), exercise(운동), region(지역)';
COMMENT ON COLUMN community_groups.is_public IS '공개 그룹 여부 (true: 모든 사용자 조회 가능, false: 초대만 가능)';
COMMENT ON COLUMN community_groups.is_family_only IS '가족 내부 그룹 여부 (true: 가족 구성원만 참여 가능)';
COMMENT ON COLUMN community_groups.member_count IS '그룹 멤버 수 (자동 업데이트)';
COMMENT ON COLUMN community_groups.post_count IS '그룹 게시글 수 (자동 업데이트)';

-- =============================================
-- 2. 그룹 멤버 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

COMMENT ON TABLE group_members IS '그룹 멤버 - 그룹에 가입한 사용자 정보';
COMMENT ON COLUMN group_members.role IS '멤버 역할: owner(소유자), moderator(모더레이터), member(일반 멤버)';

-- =============================================
-- 3. 그룹 게시글 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'question', 'recipe', 'achievement', 'challenge')),
  images JSONB DEFAULT '[]'::jsonb,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE group_posts IS '그룹 게시글 - 그룹 내에서 작성된 게시글';
COMMENT ON COLUMN group_posts.post_type IS '게시글 타입: general(일반), question(질문), recipe(레시피), achievement(성과), challenge(챌린지)';
COMMENT ON COLUMN group_posts.images IS '이미지 URL 배열 (JSONB 형식)';
COMMENT ON COLUMN group_posts.is_pinned IS '고정글 여부 (모더레이터만 설정 가능)';

-- =============================================
-- 4. 게시글 댓글 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE post_comments IS '게시글 댓글 - 게시글에 대한 댓글 및 대댓글';
COMMENT ON COLUMN post_comments.parent_comment_id IS '대댓글인 경우 부모 댓글 ID (NULL이면 일반 댓글)';

-- =============================================
-- 5. 게시글/댓글 좋아요 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES group_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_post_or_comment CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 부분 인덱스를 사용한 UNIQUE 제약조건 (게시글 좋아요)
CREATE UNIQUE INDEX IF NOT EXISTS unique_post_like 
ON post_likes(post_id, user_id) 
WHERE post_id IS NOT NULL;

-- 부분 인덱스를 사용한 UNIQUE 제약조건 (댓글 좋아요)
CREATE UNIQUE INDEX IF NOT EXISTS unique_comment_like 
ON post_likes(comment_id, user_id) 
WHERE comment_id IS NOT NULL;

COMMENT ON TABLE post_likes IS '게시글/댓글 좋아요 - 사용자가 게시글 또는 댓글에 누른 좋아요';
COMMENT ON COLUMN post_likes.post_id IS '게시글 ID (댓글 좋아요인 경우 NULL)';
COMMENT ON COLUMN post_likes.comment_id IS '댓글 ID (게시글 좋아요인 경우 NULL)';

-- =============================================
-- 6. 사용자 팔로우 테이블
-- =============================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT check_no_self_follow CHECK (follower_id != following_id)
);

COMMENT ON TABLE user_follows IS '사용자 팔로우 - 사용자 간 팔로우 관계';
COMMENT ON COLUMN user_follows.follower_id IS '팔로우하는 사용자 ID';
COMMENT ON COLUMN user_follows.following_id IS '팔로우받는 사용자 ID';

-- =============================================
-- 7. 인덱스 생성
-- =============================================

-- community_groups 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_community_groups_owner_id ON community_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_community_groups_category ON community_groups(category);
CREATE INDEX IF NOT EXISTS idx_community_groups_is_public ON community_groups(is_public);
CREATE INDEX IF NOT EXISTS idx_community_groups_created_at ON community_groups(created_at DESC);

-- group_members 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON group_members(group_id, user_id);

-- group_posts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author_id ON group_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_post_type ON group_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_is_pinned ON group_posts(is_pinned) WHERE is_pinned = true;

-- post_comments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_comment_id ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- post_likes 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_likes_comment_id ON post_likes(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- user_follows 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- =============================================
-- 8. users 테이블 확장
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;

COMMENT ON COLUMN users.bio IS '사용자 소개글';
COMMENT ON COLUMN users.profile_image_url IS '프로필 이미지 URL';
COMMENT ON COLUMN users.follower_count IS '팔로워 수 (자동 업데이트)';
COMMENT ON COLUMN users.following_count IS '팔로잉 수 (자동 업데이트)';
COMMENT ON COLUMN users.post_count IS '작성한 게시글 수 (자동 업데이트)';

-- =============================================
-- 9. updated_at 자동 업데이트 트리거
-- =============================================

-- 트리거 함수가 이미 존재하는지 확인하고, 없으면 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- community_groups 테이블 트리거
DROP TRIGGER IF EXISTS update_community_groups_updated_at ON community_groups;
CREATE TRIGGER update_community_groups_updated_at
  BEFORE UPDATE ON community_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- group_posts 테이블 트리거
DROP TRIGGER IF EXISTS update_group_posts_updated_at ON group_posts;
CREATE TRIGGER update_group_posts_updated_at
  BEFORE UPDATE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- post_comments 테이블 트리거
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. 카운트 자동 업데이트 트리거 함수
-- =============================================

-- 그룹 멤버 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_groups
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_groups
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 그룹 게시글 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_groups
    SET post_count = post_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_groups
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 게시글 댓글 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 게시글 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE group_posts
      SET like_count = like_count + 1
      WHERE id = NEW.post_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE post_comments
      SET like_count = like_count + 1
      WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE group_posts
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = OLD.post_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE post_comments
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 사용자 팔로우 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 팔로우받는 사용자의 follower_count 증가
    UPDATE users
    SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;
    -- 팔로우하는 사용자의 following_count 증가
    UPDATE users
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 팔로우받는 사용자의 follower_count 감소
    UPDATE users
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE id = OLD.following_id;
    -- 팔로우하는 사용자의 following_count 감소
    UPDATE users
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 사용자 게시글 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET post_count = post_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_group_member_count ON group_members;
CREATE TRIGGER trigger_group_member_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

DROP TRIGGER IF EXISTS trigger_group_post_count ON group_posts;
CREATE TRIGGER trigger_group_post_count
  AFTER INSERT OR DELETE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_group_post_count();

DROP TRIGGER IF EXISTS trigger_post_comment_count ON post_comments;
CREATE TRIGGER trigger_post_comment_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

DROP TRIGGER IF EXISTS trigger_post_like_count ON post_likes;
CREATE TRIGGER trigger_post_like_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

DROP TRIGGER IF EXISTS trigger_user_follow_count ON user_follows;
CREATE TRIGGER trigger_user_follow_count
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_user_follow_count();

DROP TRIGGER IF EXISTS trigger_user_post_count ON group_posts;
CREATE TRIGGER trigger_user_post_count
  AFTER INSERT OR DELETE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_post_count();

-- =============================================
-- 11. RLS 비활성화 (개발 환경)
-- =============================================
ALTER TABLE community_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 12. Supabase Storage 버킷 생성
-- =============================================
-- 커뮤니티 이미지를 위한 Storage 버킷 생성
-- 개발 환경: RLS 정책은 별도 관리 (프로덕션 전 적용)

INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE storage.buckets IS '커뮤니티 이미지 저장소 - 게시글 이미지, 그룹 커버 이미지, 프로필 이미지 등';

-- =============================================
-- 13. 권한 부여
-- =============================================
GRANT ALL ON TABLE community_groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE group_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE group_posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE post_comments TO anon, authenticated, service_role;
GRANT ALL ON TABLE post_likes TO anon, authenticated, service_role;
GRANT ALL ON TABLE user_follows TO anon, authenticated, service_role;

