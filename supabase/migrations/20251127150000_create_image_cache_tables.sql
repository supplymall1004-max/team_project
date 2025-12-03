-- 이미지 캐시 통계 테이블 생성 마이그레이션
-- RLS는 개발 단계에서 비활성화

-- 이미지 사용 로그 테이블
CREATE TABLE IF NOT EXISTS image_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path TEXT NOT NULL, -- 이미지 경로 (예: /food/korean/kimchi.jpg)
  food_name TEXT, -- 음식명
  source_type TEXT, -- 이미지 출처 타입 (static, gemini, placeholder)
  access_count INTEGER DEFAULT 1, -- 접근 횟수
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_image_path ON image_usage_logs(image_path);
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_food_name ON image_usage_logs(food_name);
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_source_type ON image_usage_logs(source_type);
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_last_accessed ON image_usage_logs(last_accessed_at);

-- 이미지 캐시 통계 스냅샷 테이블 (일별 집계)
CREATE TABLE IF NOT EXISTS image_cache_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE, -- 통계 날짜
  total_images INTEGER DEFAULT 0, -- 총 이미지 수
  static_images INTEGER DEFAULT 0, -- 정적 이미지 수
  gemini_images INTEGER DEFAULT 0, -- Gemini 생성 이미지 수
  placeholder_images INTEGER DEFAULT 0, -- 플레이스홀더 이미지 수
  total_access_count INTEGER DEFAULT 0, -- 총 접근 횟수
  cache_hit_rate DECIMAL(5, 2), -- 캐시 히트율 (%)
  storage_size_mb DECIMAL(10, 2), -- 스토리지 사용량 (MB)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_image_cache_stats_date ON image_cache_stats(stat_date);

-- 이미지 캐시 정리 로그 테이블
CREATE TABLE IF NOT EXISTS image_cache_cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleanup_date TIMESTAMPTZ NOT NULL,
  images_removed INTEGER DEFAULT 0, -- 삭제된 이미지 수
  space_freed_mb DECIMAL(10, 2), -- 확보된 공간 (MB)
  cleanup_duration_ms INTEGER, -- 정리 소요 시간 (ms)
  cleanup_type TEXT, -- 정리 유형 (scheduled, manual, automatic)
  error_message TEXT, -- 에러 메시지 (실패 시)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_image_cache_cleanup_logs_date ON image_cache_cleanup_logs(cleanup_date);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_image_cache_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_cache_stats_updated_at
  BEFORE UPDATE ON image_cache_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_image_cache_stats_updated_at();

-- 이미지 사용 로그 집계 함수
CREATE OR REPLACE FUNCTION aggregate_image_usage_stats(target_date DATE)
RETURNS void AS $$
DECLARE
  total_count INTEGER;
  static_count INTEGER;
  gemini_count INTEGER;
  placeholder_count INTEGER;
  access_sum INTEGER;
BEGIN
  -- 해당 날짜의 통계 집계
  SELECT 
    COUNT(DISTINCT image_path),
    COUNT(DISTINCT CASE WHEN source_type = 'static' THEN image_path END),
    COUNT(DISTINCT CASE WHEN source_type = 'gemini' THEN image_path END),
    COUNT(DISTINCT CASE WHEN source_type = 'placeholder' THEN image_path END),
    COALESCE(SUM(access_count), 0)
  INTO 
    total_count,
    static_count,
    gemini_count,
    placeholder_count,
    access_sum
  FROM image_usage_logs
  WHERE DATE(last_accessed_at) = target_date;

  -- 통계 스냅샷 저장 (UPSERT)
  INSERT INTO image_cache_stats (
    stat_date,
    total_images,
    static_images,
    gemini_images,
    placeholder_images,
    total_access_count
  ) VALUES (
    target_date,
    total_count,
    static_count,
    gemini_count,
    placeholder_count,
    access_sum
  )
  ON CONFLICT (stat_date) DO UPDATE SET
    total_images = EXCLUDED.total_images,
    static_images = EXCLUDED.static_images,
    gemini_images = EXCLUDED.gemini_images,
    placeholder_images = EXCLUDED.placeholder_images,
    total_access_count = EXCLUDED.total_access_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- RLS 비활성화 (개발 환경)
ALTER TABLE image_usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_cache_cleanup_logs DISABLE ROW LEVEL SECURITY;

-- 코멘트 추가
COMMENT ON TABLE image_usage_logs IS '이미지 사용 로그 (접근 추적)';
COMMENT ON TABLE image_cache_stats IS '이미지 캐시 통계 스냅샷 (일별 집계)';
COMMENT ON TABLE image_cache_cleanup_logs IS '이미지 캐시 정리 로그';

COMMENT ON COLUMN image_usage_logs.source_type IS 'static: 정적 파일, gemini: AI 생성, placeholder: SVG 플레이스홀더';
COMMENT ON COLUMN image_cache_stats.cache_hit_rate IS '캐시 히트율 = (정적+Gemini) / 총 이미지 * 100';
COMMENT ON FUNCTION aggregate_image_usage_stats(DATE) IS '특정 날짜의 이미지 사용 통계 집계';

