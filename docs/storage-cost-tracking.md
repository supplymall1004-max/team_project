# Storage 비용 추적 및 최적화

## 개요

Supabase Storage 비용을 추적하고 최적화하기 위한 SQL 쿼리와 전략을 정의합니다.

## 비용 모델 이해

### Supabase Storage 비용 요소
- **저장 용량**: GB당 월간 비용
- **대역폭**: GB당 전송 비용
- **요청 수**: API 호출당 비용

### 예상 비용 (2025년 기준, 가정)
- 저장: $0.021/GB/월
- 대역폭: $0.09/GB
- 요청: $0.004/10,000회

## 비용 추적 쿼리

### 1. 월별 저장 용량 추이
```sql
-- food-images 버킷의 월별 용량 및 비용 추정
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_images,
  SUM(file_size_bytes) as total_bytes,
  ROUND(SUM(file_size_bytes) / 1024 / 1024 / 1024, 4) as total_gb,
  -- 썸네일 + 원본 = 2배 저장
  ROUND(SUM(file_size_bytes) / 1024 / 1024 / 1024 * 2, 4) as estimated_storage_gb,
  -- 대략적인 월간 비용 추정 ($0.021/GB)
  ROUND(SUM(file_size_bytes) / 1024 / 1024 / 1024 * 2 * 0.021, 4) as estimated_monthly_cost
FROM food_images
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### 2. 이미지 타입별 용량 분석
```sql
-- 원본 vs 썸네일 용량 비교
WITH image_types AS (
  SELECT
    CASE
      WHEN storage_path_original LIKE '%original%' THEN 'original'
      WHEN storage_path_thumbnail LIKE '%thumbnail%' THEN 'thumbnail'
      ELSE 'unknown'
    END as image_type,
    file_size_bytes,
    created_at
  FROM food_images
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  image_type,
  COUNT(*) as image_count,
  SUM(file_size_bytes) as total_bytes,
  ROUND(SUM(file_size_bytes) / 1024 / 1024, 2) as total_mb,
  ROUND(AVG(file_size_bytes) / 1024, 2) as avg_kb_per_image,
  MIN(file_size_bytes) as min_bytes,
  MAX(file_size_bytes) as max_bytes
FROM image_types
GROUP BY image_type
ORDER BY total_bytes DESC;
```

### 3. 오래된 이미지 정리 후보
```sql
-- 30일 이상 된 저품질 이미지 정리 대상
SELECT
  fi.id,
  f.name as food_name,
  fi.quality_score,
  fi.file_size_bytes,
  fi.created_at,
  fi.storage_path_original,
  fi.storage_path_thumbnail,
  -- 예상 절감 비용
  ROUND((fi.file_size_bytes * 2) / 1024 / 1024 / 1024 * 0.021, 6) as monthly_savings_if_deleted
FROM food_images fi
JOIN foods f ON fi.food_id = f.id
WHERE fi.created_at < CURRENT_DATE - INTERVAL '30 days'
  AND fi.quality_score < 70
ORDER BY fi.quality_score ASC, fi.created_at ASC
LIMIT 100;
```

### 4. 음식별 저장 비용
```sql
-- 음식별 저장 비용 분석
SELECT
  f.name as food_name,
  f.category,
  COUNT(fi.id) as image_count,
  SUM(fi.file_size_bytes) as total_bytes,
  ROUND(SUM(fi.file_size_bytes) / 1024 / 1024, 2) as total_mb,
  -- 실제 저장 (원본 + 썸네일)
  ROUND(SUM(fi.file_size_bytes) / 1024 / 1024 * 2, 2) as actual_storage_mb,
  -- 월간 비용 추정
  ROUND(SUM(fi.file_size_bytes) / 1024 / 1024 / 1024 * 2 * 0.021, 4) as estimated_monthly_cost,
  ROUND(AVG(fi.quality_score), 1) as avg_quality_score,
  MAX(fi.created_at) as latest_image_date
FROM foods f
LEFT JOIN food_images fi ON f.id = fi.food_id
GROUP BY f.id, f.name, f.category
ORDER BY actual_storage_mb DESC;
```

### 5. 일일 증가량 모니터링
```sql
-- 최근 7일간 일일 증가량
WITH daily_stats AS (
  SELECT
    DATE(created_at) as date,
    COUNT(*) as new_images,
    SUM(file_size_bytes) as new_bytes,
    ROUND(SUM(file_size_bytes) / 1024 / 1024, 2) as new_mb
  FROM food_images
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(created_at)
)
SELECT
  date,
  new_images,
  new_mb,
  -- 7일 평균
  ROUND(AVG(new_images) OVER (ORDER BY date ROWS 6 PRECEDING), 1) as avg_daily_images,
  ROUND(AVG(new_mb) OVER (ORDER BY date ROWS 6 PRECEDING), 2) as avg_daily_mb,
  -- 예측 월간 비용 (30일 × 일일 평균)
  ROUND(AVG(new_mb) OVER (ORDER BY date ROWS 6 PRECEDING) * 30 / 1024 * 0.021, 4) as predicted_monthly_cost
FROM daily_stats
ORDER BY date DESC;
```

## 비용 최적화 전략

### 1. 이미지 품질 기반 정리
```sql
-- 저품질 이미지 자동 식별 및 정리
CREATE OR REPLACE FUNCTION identify_low_quality_images(days_old int DEFAULT 30, min_score int DEFAULT 60)
RETURNS TABLE (
  image_id uuid,
  food_name text,
  quality_score integer,
  file_size_mb numeric,
  estimated_savings numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fi.id,
    f.name,
    fi.quality_score,
    ROUND(fi.file_size_bytes / 1024 / 1024, 2),
    ROUND((fi.file_size_bytes * 2) / 1024 / 1024 / 1024 * 0.021, 6)
  FROM food_images fi
  JOIN foods f ON fi.food_id = f.id
  WHERE fi.created_at < CURRENT_DATE - (days_old || ' days')::interval
    AND fi.quality_score < min_score
  ORDER BY fi.quality_score ASC, fi.created_at ASC;
END;
$$ LANGUAGE plpgsql;
```

### 2. 중복 이미지 검출
```sql
-- 체크섬 기반 중복 이미지 찾기
SELECT
  checksum,
  COUNT(*) as duplicate_count,
  STRING_AGG(fi.id::text, ', ') as image_ids,
  STRING_AGG(f.name, ', ') as food_names,
  MIN(fi.created_at) as first_created,
  MAX(fi.created_at) as last_created
FROM food_images fi
JOIN foods f ON fi.food_id = f.id
GROUP BY checksum
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, first_created ASC;
```

### 3. 저장 정책 자동화
```sql
-- 오래된 저품질 이미지 자동 삭제 (실행 주의!)
-- DELETE FROM food_images
-- WHERE id IN (
--   SELECT fi.id
--   FROM food_images fi
--   WHERE fi.created_at < CURRENT_DATE - INTERVAL '90 days'
--     AND fi.quality_score < 50
--     AND fi.id NOT IN (
--       SELECT DISTINCT batch_id
--       FROM food_image_batches
--       WHERE status = 'success'
--       ORDER BY batch_date DESC
--       LIMIT 10  -- 최근 10개 배치의 이미지는 보존
--     )
-- );
```

## 비용 예측 모델

### 월간 총 비용 계산
```sql
CREATE OR REPLACE FUNCTION calculate_monthly_storage_cost(
  target_month date DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS TABLE (
  month date,
  total_images bigint,
  storage_gb numeric,
  estimated_cost numeric,
  bandwidth_gb_estimate numeric,
  bandwidth_cost_estimate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT
      DATE_TRUNC('month', fi.created_at) as month,
      COUNT(*) as image_count,
      SUM(fi.file_size_bytes) as bytes_used
    FROM food_images fi
    WHERE DATE_TRUNC('month', fi.created_at) = target_month
    GROUP BY DATE_TRUNC('month', fi.created_at)
  )
  SELECT
    md.month,
    md.image_count,
    ROUND(md.bytes_used * 2 / 1024 / 1024 / 1024, 4) as storage_gb, -- 원본 + 썸네일
    ROUND(md.bytes_used * 2 / 1024 / 1024 / 1024 * 0.021, 4) as estimated_cost,
    -- 대역폭 추정: 이미지가 평균 10회 조회된다고 가정
    ROUND(md.bytes_used * 2 * 10 / 1024 / 1024 / 1024, 4) as bandwidth_gb_estimate,
    ROUND(md.bytes_used * 2 * 10 / 1024 / 1024 / 1024 * 0.09, 4) as bandwidth_cost_estimate
  FROM monthly_data md;
END;
$$ LANGUAGE plpgsql;
```

### 사용 예시
```sql
-- 이번 달 비용 예측
SELECT * FROM calculate_monthly_storage_cost();

-- 특정 월 비용 조회
SELECT * FROM calculate_monthly_storage_cost('2025-01-01'::date);
```

## 모니터링 알림

### 비용 임계치 설정
- 월간 저장 비용 > $5.00
- 일일 증가량 > 100MB
- 저품질 이미지 비율 > 30%

### 자동화 스크립트
```bash
#!/bin/bash
# 월말 비용 보고 스크립트

psql $DATABASE_URL -c "
SELECT
  DATE_TRUNC('month', CURRENT_DATE) as month,
  COUNT(*) as total_images,
  ROUND(SUM(file_size_bytes) / 1024 / 1024 / 1024 * 2, 4) as storage_gb,
  ROUND(SUM(file_size_bytes) / 1024 / 1024 / 1024 * 2 * 0.021, 4) as estimated_cost
FROM food_images
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
" > monthly_cost_report.txt
```

## 최적화 권장사항

1. **품질 기반 보존**: 품질 점수 70점 이상만 장기 보존
2. **중복 제거**: 동일 체크섬 이미지 정리
3. **압축 최적화**: WebP 품질을 80으로 유지하되 필요시 낮춤
4. **캐싱 활용**: CDN 캐시 헤더로 대역폭 비용 절감
5. **생성 제한**: 불필요한 이미지 생성 자제
