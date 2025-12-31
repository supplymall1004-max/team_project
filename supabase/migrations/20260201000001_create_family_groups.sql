-- 가족 그룹 및 초대 코드 시스템 마이그레이션
-- RLS는 개발 단계에서 비활성화

-- 가족 그룹 테이블
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL, -- 예: 'FAM-7291'
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT, -- 가족 그룹 이름 (선택사항)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 가족 그룹 멤버 테이블
CREATE TABLE IF NOT EXISTS family_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_group_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_groups_admin_user_id ON family_groups(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_family_group_members_family_group_id ON family_group_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_group_members_user_id ON family_group_members(user_id);

-- 초대 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_family_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- 6자리 랜덤 코드 생성 (FAM-XXXX 형식)
    code := 'FAM-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- 중복 확인
    SELECT EXISTS(SELECT 1 FROM family_groups WHERE invite_code = code) INTO exists_check;
    
    -- 중복이 없으면 반환
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

