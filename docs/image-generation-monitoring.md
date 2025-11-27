# 음식 이미지 생성 모니터링 대시보드

## 개요

음식 이미지 생성 파이프라인의 성능과 상태를 모니터링하기 위한 SQL 쿼리와 대시보드 지표를 정의합니다.

## 핵심 메트릭

### 1. 일일 생성 현황
```sql
-- 최근 7일간 일일 생성 통계
SELECT
  DATE(batch_date) as date,
  COUNT(*) as total_batches,
  COUNT(*) FILTER (WHERE status = 'success') as success_batches,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_batches,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_batches,
  SUM(image_count) as total_images,
  ROUND(AVG(gemini_latency_ms), 2) as avg_latency_ms
FROM food_image_batches
WHERE batch_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(batch_date)
ORDER BY date DESC;
```

### 2. 성공률 추이
```sql
-- 시간별 성공률 (최근 30일)
SELECT
  DATE_TRUNC('day', batch_date) as day,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'success')::decimal /
    COUNT(*)::decimal * 100, 2
  ) as success_rate_percent,
  COUNT(*) as total_batches,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count
FROM food_image_batches
WHERE batch_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', batch_date)
ORDER BY day DESC;
```

### 3. 평균 처리 시간
```sql
-- 배치별 평균 처리 시간 (성공한 배치만)
SELECT
  DATE(batch_date) as date,
  ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 2) as avg_processing_seconds,
  ROUND(AVG(gemini_latency_ms) / 1000, 2) as avg_gemini_seconds,
  COUNT(*) as batch_count,
  MIN(EXTRACT(EPOCH FROM (completed_at - started_at))) as min_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_seconds
FROM food_image_batches
WHERE status = 'success'
  AND completed_at IS NOT NULL
  AND batch_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(batch_date)
ORDER BY date DESC;
```

### 4. 실패 원인 분석
```sql
-- 실패 사유별 빈도 (최근 30일)
SELECT
  CASE
    WHEN error_reason ILIKE '%quota%' THEN 'Gemini Quota 초과'
    WHEN error_reason ILIKE '%timeout%' THEN '타임아웃'
    WHEN error_reason ILIKE '%network%' THEN '네트워크 오류'
    WHEN error_reason ILIKE '%storage%' THEN 'Storage 오류'
    WHEN error_reason ILIKE '%rate limit%' THEN 'Rate Limit'
    ELSE '기타 오류'
  END as error_category,
  COUNT(*) as error_count,
  STRING_AGG(DISTINCT LEFT(error_reason, 100), '; ') as sample_errors
FROM food_image_batches
WHERE status = 'failed'
  AND batch_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY error_category
ORDER BY error_count DESC;
```

## 음식별 성능 분석

### 5. 음식별 생성 통계
```sql
-- 음식별 최근 30일 생성 현황
SELECT
  f.name as food_name,
  f.category,
  COUNT(fib.id) as total_batches,
  COUNT(fib.id) FILTER (WHERE fib.status = 'success') as success_batches,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (fib.completed_at - fib.started_at))), 1
  ) as avg_processing_seconds,
  MAX(fib.batch_date) as last_generated_date,
  f.total_generated_images
FROM foods f
LEFT JOIN food_image_batches fib ON f.id = fib.food_id
  AND fib.batch_date >= CURRENT_DATE - INTERVAL '30 days'
WHERE f.needs_images = true
GROUP BY f.id, f.name, f.category, f.total_generated_images
ORDER BY total_batches DESC, f.image_priority DESC;
```

### 6. 카테고리별 성능
```sql
-- 카테고리별 성공률 및 처리 시간
SELECT
  f.category,
  COUNT(fib.id) as total_batches,
  ROUND(
    COUNT(fib.id) FILTER (WHERE fib.status = 'success')::decimal /
    COUNT(fib.id)::decimal * 100, 2
  ) as success_rate_percent,
  ROUND(AVG(EXTRACT(EPOCH FROM (fib.completed_at - fib.started_at))), 2) as avg_seconds,
  ROUND(AVG(fib.gemini_latency_ms) / 1000, 2) as avg_gemini_seconds
FROM foods f
JOIN food_image_batches fib ON f.id = fib.food_id
WHERE fib.batch_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY f.category
ORDER BY success_rate_percent DESC;
```

## Storage 비용 모니터링

### 7. 월별 저장 용량 추이
```sql
-- 월별 이미지 파일 용량 합계
SELECT
  DATE_TRUNC('month', fi.created_at) as month,
  COUNT(*) as total_images,
  SUM(fi.file_size_bytes) as total_bytes,
  ROUND(SUM(fi.file_size_bytes) / 1024 / 1024, 2) as total_mb,
  ROUND(AVG(fi.file_size_bytes) / 1024, 2) as avg_kb_per_image,
  COUNT(*) FILTER (WHERE fi.quality_score >= 80) as high_quality_count
FROM food_images fi
WHERE fi.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', fi.created_at)
ORDER BY month DESC;
```

### 8. 품질 점수 분포
```sql
-- 이미지 품질 점수 분포
SELECT
  CASE
    WHEN quality_score >= 90 THEN '90-100 (최상)'
    WHEN quality_score >= 80 THEN '80-89 (상)'
    WHEN quality_score >= 70 THEN '70-79 (중)'
    WHEN quality_score >= 60 THEN '60-69 (하)'
    ELSE '0-59 (최하)'
  END as quality_range,
  COUNT(*) as image_count,
  ROUND(AVG(quality_score), 2) as avg_score,
  MIN(quality_score) as min_score,
  MAX(quality_score) as max_score
FROM food_images
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY quality_range
ORDER BY quality_range DESC;
```

## 실시간 모니터링

### 9. 현재 진행 중인 배치
```sql
-- 진행 중이거나 최근에 완료된 배치
SELECT
  fib.id as batch_id,
  f.name as food_name,
  fib.status,
  fib.started_at,
  fib.completed_at,
  EXTRACT(EPOCH FROM (NOW() - fib.started_at)) / 60 as elapsed_minutes,
  fib.prompt_count,
  fib.image_count,
  LEFT(fib.error_reason, 100) as error_preview
FROM food_image_batches fib
JOIN foods f ON fib.food_id = f.id
WHERE fib.batch_date = CURRENT_DATE
  AND (fib.status IN ('pending', 'success', 'failed')
       OR fib.started_at >= NOW() - INTERVAL '1 hour')
ORDER BY fib.started_at DESC;
```

### 10. 시스템 상태 개요
```sql
-- 대시보드용 종합 현황
WITH stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'success' AND batch_date = CURRENT_DATE) as today_success,
    COUNT(*) FILTER (WHERE status = 'failed' AND batch_date = CURRENT_DATE) as today_failed,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_batches,
    ROUND(AVG(gemini_latency_ms), 0) as avg_latency_ms,
    COUNT(*) FILTER (WHERE batch_date >= CURRENT_DATE - INTERVAL '7 days') as week_total
  FROM food_image_batches
  WHERE batch_date >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  today_success,
  today_failed,
  pending_batches,
  week_total,
  ROUND(today_success::decimal / GREATEST(today_success + today_failed, 1) * 100, 1) as today_success_rate,
  avg_latency_ms
FROM stats;
```

## 알림 기준

### 경고 조건
- 일일 성공률 < 80%
- 평균 처리 시간 > 300초 (5분)
- Gemini API 레이턴시 > 10000ms (10초)
- 3회 연속 배치 실패

### 심각 조건
- 일일 성공률 < 50%
- Gemini API 완전 실패 (모든 배치 실패)
- Storage 업로드 실패율 > 20%

## 대시보드 구현

이 쿼리들을 기반으로 Supabase Dashboard나 별도 모니터링 대시보드에서 그래프와 차트로 시각화할 수 있습니다.

### 추천 차트
1. 일일 성공률 추이 (선 그래프)
2. 카테고리별 성공률 (막대 그래프)
3. 처리 시간 분포 (박스 플롯)
4. Storage 사용량 추이 (면적 그래프)
5. 품질 점수 히스토그램 (히스토그램)
