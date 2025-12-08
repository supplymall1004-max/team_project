-- KCDC (질병관리청) 알림 테이블 생성 마이그레이션
-- RLS는 개발 단계에서 비활성화

-- KCDC 알림 테이블
CREATE TABLE IF NOT EXISTS kcdc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'flu', 'vaccination', 'disease_outbreak'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  
  -- 독감 관련 필드
  flu_stage TEXT, -- '주의', '경계', '심각' 등
  flu_week TEXT, -- '2025-W01' 형식
  
  -- 예방접종 관련 필드
  vaccine_name TEXT, -- 'COVID-19', 'Flu', 'Hepatitis' 등
  target_age_group TEXT, -- '영유아', '청소년', '성인', '노인' 등
  recommended_date DATE, -- 권장 접종 날짜
  
  -- 메타데이터
  source_url TEXT, -- 원본 공지 URL
  published_at TIMESTAMPTZ, -- 원본 공지 발행 시간
  is_active BOOLEAN DEFAULT true, -- 알림 활성화 여부
  priority INTEGER DEFAULT 0, -- 우선순위 (높을수록 먼저 표시)
  
  -- 캐시 관리
  fetched_at TIMESTAMPTZ DEFAULT now(), -- 데이터 가져온 시간
  expires_at TIMESTAMPTZ, -- 캐시 만료 시간
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_type ON kcdc_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active ON kcdc_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_published ON kcdc_alerts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_priority ON kcdc_alerts(priority DESC, published_at DESC);

-- 복합 인덱스 (활성화 + 우선순위)
CREATE INDEX IF NOT EXISTS idx_kcdc_alerts_active_priority 
  ON kcdc_alerts(is_active, priority DESC, published_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_kcdc_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kcdc_alerts_updated_at
  BEFORE UPDATE ON kcdc_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_kcdc_alerts_updated_at();

-- 만료된 알림 자동 비활성화 함수
CREATE OR REPLACE FUNCTION deactivate_expired_kcdc_alerts()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE kcdc_alerts
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- RLS 비활성화 (개발 환경)
ALTER TABLE kcdc_alerts DISABLE ROW LEVEL SECURITY;

-- 코멘트 추가
COMMENT ON TABLE kcdc_alerts IS '질병관리청(KCDC) 공지 및 알림 데이터';
COMMENT ON COLUMN kcdc_alerts.alert_type IS '알림 유형: flu(독감), vaccination(예방접종), disease_outbreak(질병 발생)';
COMMENT ON COLUMN kcdc_alerts.severity IS '심각도: info(정보), warning(경고), critical(긴급)';
COMMENT ON COLUMN kcdc_alerts.flu_stage IS '독감 경보 단계: 주의, 경계, 심각';
COMMENT ON COLUMN kcdc_alerts.target_age_group IS '대상 연령대: 영유아, 청소년, 성인, 노인';
COMMENT ON COLUMN kcdc_alerts.priority IS '우선순위 (높을수록 먼저 표시)';
COMMENT ON COLUMN kcdc_alerts.expires_at IS '캐시 만료 시간 (이 시간 이후 is_active가 false로 변경됨)';

-- 초기 더미 데이터 (테스트용)
INSERT INTO kcdc_alerts (
  alert_type,
  title,
  content,
  severity,
  flu_stage,
  flu_week,
  source_url,
  published_at,
  is_active,
  priority,
  expires_at
) VALUES
(
  'flu',
  '2025년 겨울 독감 주의보 발령',
  '전국적으로 독감 환자가 증가하고 있습니다. 손씻기 등 개인 위생 수칙을 준수하시고, 고위험군은 예방접종을 권장합니다.',
  'warning',
  '주의',
  '2025-W48',
  'https://www.kdca.go.kr',
  '2025-11-27 09:00:00+09',
  true,
  10,
  now() + interval '30 days'
),
(
  'vaccination',
  '영유아 필수 예방접종 안내',
  '생후 12개월 영유아는 MMR(홍역·유행성이하선염·풍진) 백신 1차 접종을 받아야 합니다.',
  'info',
  null,
  null,
  'https://www.kdca.go.kr',
  '2025-11-20 10:00:00+09',
  true,
  5,
  now() + interval '90 days'
);

