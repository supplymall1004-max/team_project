# 음식 이미지 생성 파이프라인 에러 처리 가이드

## 개요

음식 이미지 생성 파이프라인에서 발생할 수 있는 다양한 에러 상황과 그에 대한 대응 방법을 정의합니다.

## 에러 유형 분류

### 1. Gemini API 관련 에러

#### 1.1 API 키 에러
**증상:**
```
GEMINI_API_KEY is not set. Please add it to your environment before generating images.
```

**원인:**
- 환경 변수 누락
- API 키 형식 오류 (Google AI 키는 `AIza`로 시작해야 함)

**해결 방법:**
```bash
# .env.local 파일에 추가
GEMINI_API_KEY=AIzaSyD_your_actual_key_here

# Edge Function 환경 변수에 설정
supabase secrets set GEMINI_API_KEY=your_key_here
```

#### 1.2 Quota 초과 에러
**증상:**
```
Request failed (429): Resource has been exhausted
```

**원인:**
- 일일/월간 API 호출 제한 초과
- Gemini API 무료 티어 제한

**해결 방법:**
1. **즉시 대응:** 다음 날까지 대기
2. **장기 해결:**
   - API 사용량 모니터링 강화
   - 유료 플랜으로 업그레이드 고려
   - 이미지 생성 빈도 조절

#### 1.3 네트워크/타임아웃 에러
**증상:**
```
Request failed (500): Internal server error
FetchError: network timeout
```

**해결 방법:**
- 자동 재시도 (현재 구현: 최대 3회)
- 다음 날 재시도 정책 적용
- 로그 확인 후 수동 재실행

### 2. Storage 관련 에러

#### 2.1 업로드 실패
**증상:**
```
Upload failed: Storage bucket not found
```

**원인:**
- 버킷 존재하지 않음
- 권한 부족
- 파일 크기 초과

**해결 방법:**
```sql
-- 버킷 존재 확인
SELECT id, name FROM storage.buckets WHERE id = 'food-images';

-- 권한 확인
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_name = 'objects' AND table_schema = 'storage';
```

#### 2.2 용량 초과
**증상:**
```
Upload failed: File size too large
```

**해결 방법:**
- 이미지 압축 품질 조정 (현재 90% → 80%)
- 썸네일 크기 조정 (현재 512px → 400px)

### 3. 데이터베이스 관련 에러

#### 3.1 연결 실패
**증상:**
```
Connection to database failed
```

**해결 방법:**
```bash
# Supabase 상태 확인
supabase status

# 데이터베이스 연결 테스트
supabase db test
```

#### 3.2 제약 조건 위반
**증상:**
```
duplicate key value violates unique constraint
```

**원인:**
- 동일 음식의 당일 중복 배치 생성 시도

**해결 방법:**
```sql
-- 기존 배치 확인
SELECT id, batch_date, status FROM food_image_batches
WHERE food_id = 'target_food_id' AND batch_date = CURRENT_DATE;

-- 강제 재생성 필요 시 기존 배치 삭제 (주의!)
DELETE FROM food_image_batches WHERE id = 'batch_id';
```

### 4. Edge Function 관련 에러

#### 4.1 환경 변수 누락
**증상:**
```
Environment variable not found: GEMINI_API_KEY
```

**해결 방법:**
```bash
# 환경 변수 설정
supabase secrets set GEMINI_API_KEY=your_key_here
supabase secrets set SUPABASE_URL=your_url_here
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key_here

# 설정된 변수 확인
supabase secrets list
```

#### 4.2 함수 타임아웃
**증상:**
```
Function execution timed out
```

**해결 방법:**
- 배치 크기 축소 (현재 1개 음식 → 1개로 유지)
- 함수 로직 최적화
- Supabase 플랜 업그레이드

## 재시도 및 복구 정책

### 자동 재시도
```typescript
// 현재 구현된 재시도 로직
const maxRetries = 3;
for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    // 작업 실행
    break;
  } catch (error) {
    if (attempt === maxRetries - 1) throw error;
    await wait(backoffDelay(attempt)); // 지수 백오프
  }
}
```

### 수동 재실행 절차

#### Case 1: 특정 음식 재생성
```bash
# Edge Function 직접 호출
curl -X POST "https://your-project.supabase.co/functions/v1/generate-food-images" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"targetFoodId": "specific_food_id", "forceRegenerate": true}'
```

#### Case 2: 실패한 배치 재처리
```sql
-- 실패한 배치 조회
SELECT fib.id, f.name, fib.error_reason
FROM food_image_batches fib
JOIN foods f ON fib.food_id = f.id
WHERE fib.status = 'failed' AND fib.batch_date >= CURRENT_DATE - INTERVAL '7 days';

-- 배치 상태 리셋 (주의: 기존 데이터 삭제되지 않음)
UPDATE food_image_batches SET status = 'pending', error_reason = NULL
WHERE id = 'failed_batch_id';
```

#### Case 3: 전체 시스템 재시작
```bash
# Supabase 서비스 재시작 (관리자 권한 필요)
supabase stop
supabase start

# 또는 특정 함수 재배포
supabase functions deploy generate-food-images
```

## 모니터링 및 알림

### 알림 트리거 조건
1. **심각**: 연속 3회 배치 실패
2. **경고**: 일일 성공률 < 80%
3. **정보**: 일일 생성 완료

### 로그 확인
```bash
# Edge Function 로그
supabase functions logs generate-food-images --limit 100

# 데이터베이스 작업 로그
SELECT created_at, event_type, details
FROM audit_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC;
```

## 예방 조치

### 1. 정기 점검
```sql
-- 일일 건강 점검 쿼리
SELECT
  (SELECT COUNT(*) FROM foods WHERE needs_images = true) as foods_needing_images,
  (SELECT COUNT(*) FROM food_image_batches WHERE status = 'failed' AND batch_date = CURRENT_DATE) as failed_today,
  (SELECT AVG(gemini_latency_ms) FROM food_image_batches WHERE batch_date = CURRENT_DATE) as avg_latency,
  (SELECT COUNT(*) FROM food_images WHERE created_at >= CURRENT_DATE) as images_created_today;
```

### 2. 용량 모니터링
```sql
-- Storage 용량 경고
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('foods', 'food_images', 'food_image_batches')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. 백업 전략
```sql
-- 중요 데이터 백업 스크립트
CREATE OR REPLACE FUNCTION backup_food_images()
RETURNS void AS $$
BEGIN
  -- food_images 테이블을 별도 스키마로 복사
  CREATE TABLE IF NOT EXISTS backup.food_images_YYYYMMDD
    AS SELECT * FROM food_images;

  -- 오래된 백업 정리 (30일 이상 된 것)
  -- EXECUTE 동적 SQL로 구현
END;
$$ LANGUAGE plpgsql;
```

## 긴급 상황 대응 플레이북

### 상황 1: Gemini API 완전 장애
1. **즉시**: 이미지 생성 중단
2. **모니터링**: API 상태 확인
3. **대안**: 다른 이미지 소스 사용 (Pixabay 등)
4. **커뮤니케이션**: 팀에 장애 알림

### 상황 2: Storage 용량 초과
1. **즉시**: 파일 정리 실행
2. **장기**: 용량 모니터링 강화
3. **예방**: 품질 기반 정리 정책 수립

### 상황 3: 데이터베이스 연결 실패
1. **확인**: Supabase 상태 페이지 확인
2. **대기**: 자동 복구 대기
3. **수동**: 서비스 재시작
4. **복구**: 마지막 백업에서 복원

## 연락처 및 에스컬레이션

- **1차 담당**: 개발팀 리드
- **2차 담당**: DevOps 팀
- **긴급 상황**: 프로젝트 매니저
- **외부 지원**: Supabase 지원팀

## 문서화 및 학습

모든 장애 상황 발생 시:
1. **증상 기록**: 어떤 에러가 발생했는지
2. **원인 분석**: 왜 발생했는지
3. **해결 과정**: 어떻게 해결했는지
4. **예방 조치**: 재발 방지를 위한 조치

이 문서를 지속적으로 업데이트하여 시스템 안정성을 높입니다.
