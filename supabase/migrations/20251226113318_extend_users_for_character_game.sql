/**
 * @file supabase/migrations/20251226113318_extend_users_for_character_game.sql
 * @description 캐릭터창 게임화 시스템을 위한 사용자 테이블 확장 및 관련 테이블 생성
 * 
 * 주요 변경사항:
 * 1. users 테이블에 game_settings JSONB 필드 추가
 * 2. character_game_events 테이블 생성 (게임 이벤트 저장)
 * 3. baby_feeding_schedules 테이블 생성 (아기 분유 스케줄)
 * 4. character_positions 테이블 생성 (캐릭터 위치 정보)
 */

-- ============================================================================
-- 1. users 테이블 확장: 게임 설정 필드 추가
-- ============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS game_settings JSONB DEFAULT '{
  "characterGameEnabled": true,
  "autoWalkEnabled": true,
  "soundEnabled": true,
  "notificationEnabled": true,
  "gameTheme": "default"
}'::jsonb;

COMMENT ON COLUMN public.users.game_settings IS '캐릭터창 게임 설정 (게임 활성화, 자동 이동, 사운드, 알림 등)';

-- ============================================================================
-- 2. character_game_events 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.character_game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'medication',
    'baby_feeding',
    'health_checkup',
    'vaccination',
    'kcdc_alert',
    'lifecycle_event',
    'custom'
  )),
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'missed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  completed_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 0,
  experience_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_character_game_events_user_id 
  ON public.character_game_events(user_id);
CREATE INDEX IF NOT EXISTS idx_character_game_events_family_member_id 
  ON public.character_game_events(family_member_id);
CREATE INDEX IF NOT EXISTS idx_character_game_events_scheduled_time 
  ON public.character_game_events(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_character_game_events_status 
  ON public.character_game_events(status);
CREATE INDEX IF NOT EXISTS idx_character_game_events_event_type 
  ON public.character_game_events(event_type);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_character_game_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_character_game_events_updated_at
  BEFORE UPDATE ON public.character_game_events
  FOR EACH ROW
  EXECUTE FUNCTION update_character_game_events_updated_at();

COMMENT ON TABLE public.character_game_events IS '캐릭터창 게임 이벤트 (약물 복용, 분유 시간, 건강검진 등)';
COMMENT ON COLUMN public.character_game_events.event_data IS '이벤트별 상세 데이터 (JSON 형식)';
COMMENT ON COLUMN public.character_game_events.scheduled_time IS '이벤트 발생 예정 시간';
COMMENT ON COLUMN public.character_game_events.points_earned IS '이벤트 완료 시 획득한 포인트';
COMMENT ON COLUMN public.character_game_events.experience_earned IS '이벤트 완료 시 획득한 경험치';

-- ============================================================================
-- 3. baby_feeding_schedules 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.baby_feeding_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  feeding_interval_hours NUMERIC(4,2) NOT NULL DEFAULT 3.0 CHECK (feeding_interval_hours > 0),
  last_feeding_time TIMESTAMPTZ,
  next_feeding_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes_before INTEGER DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, family_member_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_baby_feeding_schedules_user_id 
  ON public.baby_feeding_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_feeding_schedules_family_member_id 
  ON public.baby_feeding_schedules(family_member_id);
CREATE INDEX IF NOT EXISTS idx_baby_feeding_schedules_next_feeding_time 
  ON public.baby_feeding_schedules(next_feeding_time) WHERE is_active = true;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_baby_feeding_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_baby_feeding_schedules_updated_at
  BEFORE UPDATE ON public.baby_feeding_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_baby_feeding_schedules_updated_at();

COMMENT ON TABLE public.baby_feeding_schedules IS '아기 분유 먹일 시간 스케줄';
COMMENT ON COLUMN public.baby_feeding_schedules.feeding_interval_hours IS '분유 먹일 시간 간격 (시간 단위, 예: 3.0 = 3시간마다)';
COMMENT ON COLUMN public.baby_feeding_schedules.next_feeding_time IS '다음 분유 먹일 시간 (자동 계산)';

-- ============================================================================
-- 4. character_positions 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.character_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  current_position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  target_position JSONB,
  activity_type TEXT CHECK (activity_type IN (
    'idle',
    'walking',
    'talking',
    'working',
    'eating',
    'sleeping',
    'playing'
  )),
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, family_member_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_character_positions_user_id 
  ON public.character_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_character_positions_family_member_id 
  ON public.character_positions(family_member_id);

COMMENT ON TABLE public.character_positions IS '캐릭터 위치 및 활동 상태 (Unity 게임 월드 좌표)';
COMMENT ON COLUMN public.character_positions.current_position IS '현재 위치 (x, y, z 좌표)';
COMMENT ON COLUMN public.character_positions.target_position IS '목표 위치 (이동 중인 경우)';
COMMENT ON COLUMN public.character_positions.activity_type IS '현재 활동 유형';

-- ============================================================================
-- 5. character_game_interactions 테이블 생성 (이벤트 상호작용 기록)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.character_game_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.character_game_events(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'medication_given',
    'feeding_given',
    'checkup_scheduled',
    'vaccination_scheduled',
    'dialogue_completed',
    'event_completed'
  )),
  interaction_data JSONB DEFAULT '{}'::jsonb,
  points_earned INTEGER DEFAULT 0,
  experience_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_character_game_interactions_user_id 
  ON public.character_game_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_character_game_interactions_family_member_id 
  ON public.character_game_interactions(family_member_id);
CREATE INDEX IF NOT EXISTS idx_character_game_interactions_event_id 
  ON public.character_game_interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_character_game_interactions_created_at 
  ON public.character_game_interactions(created_at DESC);

COMMENT ON TABLE public.character_game_interactions IS '캐릭터 게임 상호작용 기록 (약 주기, 분유 주기 등)';
COMMENT ON COLUMN public.character_game_interactions.interaction_data IS '상호작용 상세 데이터 (JSON 형식)';

-- ============================================================================
-- 6. RLS 비활성화 (개발 환경)
-- ============================================================================

ALTER TABLE public.character_game_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_feeding_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_game_interactions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. 권한 부여
-- ============================================================================

GRANT ALL ON TABLE public.character_game_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.baby_feeding_schedules TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.character_positions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.character_game_interactions TO anon, authenticated, service_role;

