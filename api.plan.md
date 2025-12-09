<!-- d17f5fe1-279e-434c-ac28-3c43df6580f0 cbbc561b-55b8-4bc3-a1a3-035d97ac8759 -->
# 질병관리청(KCDC) API 기반 프리미엄 기능 구현 계획

## 개요

기존 KCDC API 연동(독감, 예방접종)을 확장하여 사용자 건강 정보(`user_health_profiles`, `family_members`)와 결합한 개인 맞춤형 프리미엄 서비스를 제공합니다. 모든 기능은 프리미엄 구독자 전용으로 제공되며, 기존 건강 관리 시스템과 시너지를 만듭니다.

## ⚡ Phase 0: 성능 최적화 전략 (최우선) - 모든 기능 구현 전 필수

**목적**: 여러 공공 API 호출과 복잡한 계산으로 인한 응답 시간 지연 방지 및 사용자 경험 개선

### 0.1 현재 구현 상태 분석

#### ✅ 이미 구현된 최적화
- **브라우저 로컬 스토리지 캐싱**: `lib/cache/diet-plan-cache.ts`, `lib/diet/weekly-diet-cache.ts`
  - 식단 데이터 클라이언트 사이드 캐싱
  - TTL 기반 만료 관리
- **Next.js 서버 사이드 캐싱**: `lib/royal-recipes/queries.ts`
  - `unstable_cache` 활용 (1시간 revalidate)
- **데이터베이스 캐시 테이블**: `lib/diet/meal-kit-service.ts`
  - `meal_kit_products` 테이블 활용
  - 24시간 이내 동기화된 데이터만 조회
- **크론 잡 기반 사전 동기화**: `app/api/health/kcdc/refresh/route.ts`
  - KCDC 데이터 주기적 동기화 (매일 08:00 KST)

#### ❌ 개선이 필요한 부분
- **KCDC API 직접 호출**: `lib/kcdc/kcdc-parser.ts`
  - 캐싱 없이 매번 API 호출
  - 사용자 요청 시마다 외부 API 호출로 인한 지연
- **공공 API 호출 전 캐시 확인 로직 부재**
- **서버 사이드 캐싱 전략 불일치** (일부는 unstable_cache, 일부는 없음)
- **데이터베이스 캐시 테이블 활용 미흡**

### 0.2 통합 캐싱 전략 수립

#### 0.2.1 캐시 계층 구조

```
1. 브라우저 로컬 스토리지 (클라이언트 사이드)
   ↓ 캐시 미스
2. Next.js 서버 사이드 캐시 (unstable_cache)
   ↓ 캐시 미스
3. 데이터베이스 캐시 테이블 (Supabase)
   ↓ 캐시 미스 또는 만료
4. 외부 공공 API 호출
```

#### 0.2.2 캐시 TTL 전략

| 데이터 타입 | 캐시 위치 | TTL | 이유 |
|:---|:---|:---|:---|
| **KCDC 독감 정보** | DB 캐시 테이블 | 6시간 | 자주 변하지 않음 |
| **KCDC 예방접종 정보** | DB 캐시 테이블 | 24시간 | 거의 변하지 않음 |
| **식약처 영양정보** | DB 캐시 테이블 | 7일 | 거의 변하지 않음 |
| **가격 정보** | DB 캐시 테이블 | 6시간 | 하루에 2-3회 변동 |
| **날씨 정보** | DB 캐시 테이블 | 1시간 | 자주 변함 |
| **대기질 정보** | DB 캐시 테이블 | 1시간 | 자주 변함 |
| **건강검진 통계** | DB 캐시 테이블 | 24시간 | 거의 변하지 않음 |
| **위험 지수 계산 결과** | DB 캐시 테이블 | 1시간 | 사용자별, 시간별 변동 |
| **식단 추천 결과** | 브라우저 로컬 스토리지 | 24시간 | 사용자별, 날짜별 |

### 0.3 기존 기능 개선 체크리스트

#### 0.3.1 KCDC API 캐싱 개선 (`lib/kcdc/kcdc-parser.ts`)

- [ ] **데이터베이스 캐시 확인 로직 추가**
  - [ ] `fetchKcdcData()` 함수 수정
  - [ ] API 호출 전 `kcdc_alerts` 테이블에서 최신 데이터 확인
  - [ ] 캐시 유효성 검사 (fetched_at 기준 TTL 확인)
  - [ ] 캐시 히트 시 즉시 반환, 미스 시에만 API 호출

- [ ] **Next.js 서버 사이드 캐싱 추가**
  - [ ] `unstable_cache`로 `fetchKcdcData()` 함수 래핑
  - [ ] revalidate: 3600 (1시간)
  - [ ] tags: ["kcdc-data"] 추가

- [ ] **에러 핸들링 개선**
  - [ ] API 호출 실패 시 캐시된 데이터 폴백
  - [ ] 캐시 데이터가 오래되었어도 사용 (Stale-While-Revalidate 패턴)

#### 0.3.2 공공 API 클라이언트 통합 캐싱 유틸리티 생성

- [ ] **`lib/cache/public-api-cache.ts` 파일 생성**
  - [ ] 범용 공공 API 캐싱 유틸리티 함수 구현
  - [ ] 데이터베이스 캐시 테이블 확인 로직
  - [ ] 캐시 저장 로직
  - [ ] TTL 관리 로직
  - [ ] 캐시 무효화 로직

- [ ] **함수 시그니처 예시**:
```typescript
async function fetchWithCache<T>(
  cacheTable: string,
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T>
```

#### 0.3.3 식단 추천 시스템 성능 개선

- [ ] **식단 추천 결과 서버 사이드 캐싱 추가**
  - [ ] `lib/diet/recommendation.ts`에 서버 사이드 캐싱 적용
  - [ ] 사용자별, 날짜별 캐시 키 생성
  - [ ] 건강 프로필 변경 시 캐시 무효화

- [ ] **레시피 필터링 결과 캐싱**
  - [ ] 통합 필터링 결과 캐싱 (`lib/diet/integrated-filter.ts`)
  - [ ] 건강 프로필 해시 기반 캐시 키 생성
  - [ ] 레시피 데이터 변경 시 캐시 무효화

#### 0.3.4 데이터베이스 쿼리 최적화

- [ ] **인덱스 추가 (기존 테이블)**
  - [ ] `kcdc_alerts` 테이블: `fetched_at`, `is_active`, `alert_type` 복합 인덱스
  - [ ] `user_health_profiles` 테이블: `user_id` 인덱스 (이미 있을 수 있음)
  - [ ] `recipes` 테이블: `created_at`, `difficulty` 인덱스 확인 및 추가

- [ ] **쿼리 최적화**
  - [ ] N+1 쿼리 문제 해결 (가족 구성원별 조회 시)
  - [ ] 필요한 필드만 SELECT (전체 데이터 조회 방지)
  - [ ] JOIN 최소화 및 효율적인 JOIN 순서

#### 0.3.5 API 엔드포인트 응답 최적화

- [ ] **경량화된 응답 엔드포인트 추가**
  - [ ] `/api/health/summary` 엔드포인트 생성 (요약 데이터만)
  - [ ] `/api/health/detail` 엔드포인트 (상세 데이터, 필요시 호출)

- [ ] **페이지네이션 및 제한**
  - [ ] 모든 목록 조회 API에 `limit`, `offset` 파라미터 추가
  - [ ] 기본 limit 설정 (예: 20개)

- [ ] **병렬 처리**
  - [ ] 여러 API 호출 시 `Promise.all` 활용
  - [ ] 독립적인 데이터는 병렬 조회

### 0.4 신규 기능 구현 시 성능 최적화 체크리스트

#### 0.4.1 모든 공공 API 호출에 캐싱 적용

- [ ] **식약처 영양정보 API** (Phase 10.1)
  - [ ] `food_nutrition_cache` 테이블 활용
  - [ ] API 호출 전 캐시 확인 필수
  - [ ] 배치 조회 시 캐시 우선 활용

- [ ] **농수산물유통공사 가격 API** (Phase 10.2)
  - [ ] `food_price_cache` 테이블 활용
  - [ ] 크론 잡으로 주요 식자재 가격 사전 동기화
  - [ ] 사용자 요청 시 캐시된 데이터 반환

- [ ] **기상청 날씨 API** (Phase 10.3)
  - [ ] `weather_cache` 테이블 활용
  - [ ] 매시간 크론 잡으로 동기화
  - [ ] 지역별 캐시 관리

- [ ] **환경부 대기질 API** (Phase 10.4)
  - [ ] `air_quality_cache` 테이블 활용
  - [ ] 매시간 크론 잡으로 동기화
  - [ ] 지역별 캐시 관리

- [ ] **식약처 의약품 API** (Phase 10.5)
  - [ ] `medication_food_interactions` 테이블 활용
  - [ ] 의약품 정보는 거의 변하지 않으므로 장기 캐싱 (30일)

- [ ] **통계청 건강통계 API** (Phase 10.6)
  - [ ] `health_statistics_cache` 테이블 활용
  - [ ] 연도별 통계는 1년간 캐싱

#### 0.4.2 복잡한 계산 결과 캐싱

- [ ] **위험 지수 계산 결과 캐싱** (Phase 3)
  - [ ] `user_infection_risk_scores` 테이블 활용
  - [ ] 사용자별, 날짜별 캐시
  - [ ] TTL: 1시간 (expires_at 필드 활용)

- [ ] **건강검진 결과 해석 캐싱** (Phase 6)
  - [ ] 검진 결과 ID 기반 캐싱
  - [ ] 검진 결과는 변하지 않으므로 영구 캐싱 가능

- [ ] **식단 추천 결과 캐싱** (기존 기능 개선)
  - [ ] 사용자별, 날짜별, 건강 프로필 해시 기반 캐싱
  - [ ] 건강 프로필 변경 시 캐시 무효화

#### 0.4.3 크론 잡 스케줄 최적화

- [ ] **크론 잡 스케줄 설정**
  - [ ] 매일 06:00 KST: 식약처 영양정보 동기화 (자주 사용되는 식재료)
  - [ ] 매일 08:00 KST: KCDC 데이터 동기화 (기존)
  - [ ] 매일 09:00 KST: 가격 정보 동기화 (주요 식자재)
  - [ ] 매시간: 날씨/대기질 정보 동기화
  - [ ] 매주 일요일 00:00 KST: 통계청 건강통계 동기화

- [ ] **크론 잡 모니터링**
  - [ ] 동기화 실패 시 알림
  - [ ] 동기화 상태 대시보드 (관리자 페이지)

### 0.5 프론트엔드 성능 최적화

#### 0.5.1 점진적 로딩 (Progressive Loading)

- [ ] **캐시 우선 표시, 백그라운드 갱신 패턴**
  - [ ] 즉시 캐시된 데이터 표시
  - [ ] 백그라운드에서 최신 데이터 로드
  - [ ] 데이터 갱신 시 자동 업데이트

- [ ] **스켈레톤 UI 및 로딩 상태**
  - [ ] 각 섹션별 독립적 로딩 상태 관리
  - [ ] 스켈레톤 UI 컴포넌트 구현
  - [ ] 에러 발생 시 폴백 데이터 표시

#### 0.5.2 데이터 페칭 최적화

- [ ] **React Query 또는 SWR 도입 검토**
  - [ ] 서버 상태 관리 및 캐싱
  - [ ] 자동 재검증 (Stale-While-Revalidate)
  - [ ] 백그라운드 업데이트

- [ ] **필요한 데이터만 요청**
  - [ ] 페이지별 필요한 데이터만 조회
  - [ ] 무한 스크롤 또는 페이지네이션 적용

### 0.6 백그라운드 작업 처리

#### 0.6.1 무거운 작업 비동기 처리

- [ ] **통합 리포트 생성** (Phase 6 + Phase 10.1)
  - [ ] Job Queue 시스템 도입 검토 (Supabase Edge Functions 또는 외부 서비스)
  - [ ] 즉시 job_id 반환
  - [ ] 클라이언트는 polling 또는 webhook으로 결과 수신

- [ ] **식단 추천 생성** (기존 기능 개선)
  - [ ] 복잡한 필터링 및 계산은 백그라운드 처리
  - [ ] 진행 상태 표시

### 0.7 모니터링 및 성능 측정

- [ ] **성능 모니터링 도구 설정**
  - [ ] API 응답 시간 측정
  - [ ] 캐시 히트율 추적
  - [ ] 데이터베이스 쿼리 시간 측정

- [ ] **성능 지표 목표**
  - [ ] API 응답 시간: 평균 200ms 이하
  - [ ] 캐시 히트율: 80% 이상
  - [ ] 데이터베이스 쿼리 시간: 평균 100ms 이하

### 0.8 구현 우선순위

1. **즉시 적용** (기존 기능 개선)
   - KCDC API 캐싱 개선
   - 공공 API 캐싱 유틸리티 생성
   - 데이터베이스 인덱스 추가

2. **신규 기능 구현 시 필수**
   - 모든 공공 API 호출에 캐싱 적용
   - 복잡한 계산 결과 캐싱
   - 크론 잡 스케줄 설정

3. **점진적 개선**
   - 프론트엔드 최적화
   - 백그라운드 작업 처리
   - 성능 모니터링

## 페르소나 기반 기능 평가 및 우선순위

### 페르소나별 기능 관련도 분석

#### 페르소나 A: 전통/향토 요리 학습자
- **관련도**: 낮음 (대부분의 건강 관리 기능과 직접적 연관성 낮음)
- **관심 기능**: Phase 10.3 (날씨 API) - 계절별 전통 요리 추천 가능성
- **우선순위**: 낮음

#### 페르소나 B: 건강 관리 식단 사용자 ⭐ **핵심 타겟**
- **관련도**: 매우 높음 (모든 건강 관리 기능과 직접 연관)
- **핵심 요구사항**: 
  - 본인의 건강 상태(질병, 알레르기)와 목표에 맞는 맞춤형 식단 추천
  - 간편한 식자재 구매
- **관심 기능**:
  1. **Phase 10.5 (약물-식품 상호작용)**: 식단 추천 시 약물 상호작용 자동 체크 ⭐⭐⭐
  2. **Phase 10.1 (식약처 영양정보)**: 식단 영양소 정확도 검증 ⭐⭐⭐
  3. **Phase 9 (주기적 건강 관리)**: 건강 관리 서비스 통합 관리 ⭐⭐⭐
  4. **Phase 6 (건강검진 결과 해석)**: 검진 결과 기반 식단 추천 ⭐⭐
  5. **Phase 10.2 (가격 정보)**: 식단 예산 계산 및 구매 최적화 ⭐⭐
  6. **Phase 10.3 (날씨 API)**: 제철 식재료 기반 식단 추천 ⭐⭐
  7. **Phase 3 (감염병 위험 분석)**: 건강 상태 기반 위험 관리 ⭐
  8. **Phase 4 (예방접종)**: 가족 건강 관리 ⭐
  9. **Phase 5 (여행 위험도)**: 여행 시 건강 관리 ⭐

#### 페르소나 C: 일반 요리/창작자
- **관련도**: 낮음 (건강 관리 기능과 직접적 연관성 낮음)
- **관심 기능**: Phase 10.1 (영양정보) - 레시피 영양성분 검증
- **우선순위**: 낮음

### 페르소나 B의 추가 기능 요청 (신규 기능 추가)

페르소나 B의 피드백을 반영하여 다음 기능들을 추가합니다:

1. **건강검진 결과 기반 식단 추천 연동** (Phase 6 확장)
   - 건강검진 결과 해석 후 자동으로 식단 추천에 반영
   - 예: "콜레스테롤 수치가 높으시므로 저지방 식단 추천"

2. **일일 영양소 섭취량 추적 및 목표 달성률** (Phase 10.1 확장)
   - 식단 기반 일일 영양소 섭취량 실시간 추적
   - 질병별 권장량 대비 달성률 표시
   - 부족/과다 영양소 알림

3. **식단-건강검진 결과 통합 리포트** (Phase 6 + Phase 10.1 통합)
   - 건강검진 결과와 실제 섭취 영양소 비교 리포트
   - "검진 결과 나트륨 과다 → 실제 섭취량 분석 → 개선 방안 제시"

4. **약물 복용 시간 알림** (Phase 9 + Phase 10.5 통합)
   - 주기적 건강 관리 알림에 약물 복용 시간 포함
   - 식사 전/후 약물 복용 알림

5. **가족 구성원별 통합 건강 관리 대시보드** (Phase 7 확장)
   - 가족 구성원별 건강 상태 요약
   - 가족 구성원별 맞춤 식단 추천

## 구현 단계 (우선순위 재정렬)

### Phase 1: 데이터베이스 스키마 확장

#### 1.1 새 테이블 생성 (`supabase/migrations/YYYYMMDDHHmmss_create_kcdc_premium_tables.sql`)

**`user_infection_risk_scores`**: 사용자별 감염병 위험 지수 테이블

- `id`, `user_id` (FK → users), `family_member_id` (FK → family_members, NULL 가능)
- `risk_score` (INTEGER, 0-100), `risk_level` (TEXT: low/moderate/high/critical)
- `flu_stage` (TEXT), `flu_week` (TEXT), `region` (TEXT)
- `factors` (JSONB): 위험 요인 상세 (기저질환, 백신 접종 여부, 연령대 등)
- `recommendations` (JSONB): 구체적 행동 지침 배열
- `calculated_at` (TIMESTAMPTZ), `expires_at` (TIMESTAMPTZ)
- `created_at`, `updated_at`

**`user_vaccination_records`**: 사용자별 예방접종 기록 테이블

- `id`, `user_id` (FK → users), `family_member_id` (FK → family_members, NULL 가능)
- `vaccine_name` (TEXT), `vaccine_code` (TEXT), `target_age_group` (TEXT)
- `scheduled_date` (DATE), `completed_date` (DATE, NULL 가능)
- `dose_number` (INTEGER), `total_doses` (INTEGER)
- `vaccination_site` (TEXT, NULL), `vaccination_site_address` (TEXT, NULL)
- `reminder_enabled` (BOOLEAN), `reminder_days_before` (INTEGER, 기본값 7)
- `notes` (TEXT), `created_at`, `updated_at`

**`user_vaccination_schedules`**: 예방접종 일정 테이블

- `id`, `id`, `user_id` (FK → users), `family_member_id` (FK → family_members)
- `vaccine_name` (TEXT), `recommended_date` (DATE)
- `priority` (TEXT: required/recommended/optional)
- `status` (TEXT: pending/completed/skipped)
- `source` (TEXT: kcdc/user_input), `created_at`, `updated_at`

**`user_travel_risk_assessments`**: 여행 위험도 평가 테이블

- `id`, `user_id` (FK → users)
- `destination_country` (TEXT), `destination_region` (TEXT)
- `travel_start_date` (DATE), `travel_end_date` (DATE)
- `risk_level` (TEXT: low/moderate/high/critical)
- `disease_alerts` (JSONB): 해당 지역 감염병 경보 정보
- `prevention_checklist` (JSONB): 예방 물품/행동 체크리스트
- `vaccination_requirements` (JSONB): 필수/권장 백신 목록
- `created_at`, `updated_at`

**`user_health_checkup_records`**: 건강검진 기록 테이블

- `id`, `user_id` (FK → users), `family_member_id` (FK → family_members, NULL 가능)
- `checkup_type` (TEXT: national/cancer/special), `checkup_date` (DATE)
- `checkup_site` (TEXT), `checkup_site_address` (TEXT)
- `results` (JSONB): 검진 결과 데이터 (항목별 수치)
- `next_recommended_date` (DATE), `overdue_days` (INTEGER, NULL 가능)
- `created_at`, `updated_at`

**`user_health_checkup_recommendations`**: 건강검진 권장 일정 테이블

- `id`, `user_id` (FK → users), `family_member_id` (FK → family_members)
- `checkup_type` (TEXT), `checkup_name` (TEXT)
- `recommended_date` (DATE), `priority` (TEXT: high/medium/low)
- `overdue` (BOOLEAN), `last_checkup_date` (DATE, NULL 가능)
- `age_requirement` (TEXT), `gender_requirement` (TEXT)
- `created_at`, `updated_at`

**`kcdc_disease_outbreaks`**: 감염병 발생 정보 캐시 테이블 (확장)

- `id`, `disease_name` (TEXT), `disease_code` (TEXT)
- `region` (TEXT), `outbreak_date` (DATE)
- `case_count` (INTEGER), `severity` (TEXT)
- `alert_level` (TEXT), `description` (TEXT)
- `source_url` (TEXT), `fetched_at` (TIMESTAMPTZ)
- `is_active` (BOOLEAN), `created_at`, `updated_at`

**`kcdc_health_checkup_statistics`**: 건강검진 통계 캐시 테이블

- `id`, `checkup_type` (TEXT), `age_group` (TEXT)
- `gender` (TEXT), `year` (INTEGER)
- `average_values` (JSONB): 평균 수치 (콜레스테롤, 혈압 등)
- `normal_ranges` (JSONB): 정상 범위
- `fetched_at` (TIMESTAMPTZ), `created_at`, `updated_at`

#### 1.2 기존 테이블 확장

**`user_health_profiles` 테이블에 추가 필드**:

- `vaccination_history` (JSONB): 과거 접종 이력 요약
- `last_health_checkup_date` (DATE): 마지막 건강검진 일자
- `region` (TEXT): 거주 지역 (시/도 단위)

**`family_members` 테이블에 추가 필드**:

- `vaccination_history` (JSONB): 과거 접종 이력
- `last_health_checkup_date` (DATE)

### Phase 2: KCDC API 확장 및 데이터 동기화

#### 2.1 API 클라이언트 확장 (`lib/kcdc/kcdc-api-extended.ts`)

**새 API 엔드포인트 추가**:

- `fetchCovid19Data()`: 코로나19 확진자 현황 조회
- `fetchDiseaseOutbreaks()`: 법정 감염병 발생 현황 조회
- `fetchOverseasDiseaseAlerts()`: 해외 유입 감염병 정보 조회
- `fetchHealthCheckupStatistics()`: 국가건강검진 통계 조회
- `fetchHealthCheckupInstitutions()`: 건강검진 기관 정보 조회

**파일 구조**:

- `lib/kcdc/kcdc-api-extended.ts`: 확장 API 클라이언트
- `lib/kcdc/kcdc-parser-extended.ts`: 확장 데이터 파서
- `lib/kcdc/kcdc-sync-extended.ts`: 확장 동기화 로직

#### 2.2 동기화 API 엔드포인트

- `app/api/kcdc/sync/extended/route.ts`: 확장 데이터 동기화
  - `POST /api/kcdc/sync/extended`: 코로나19, 감염병 발생, 건강검진 통계 동기화
  - 크론 잡에서 호출 (매일 08:00 KST)

#### 2.3 크론 잡 설정

- `supabase/functions/sync-kcdc-extended/index.ts`: Edge Function 생성
- `supabase/migrations/YYYYMMDDHHmmss_setup_kcdc_extended_cron.sql`: 크론 잡 설정
  - 실행 주기: 매일 08:00 KST

### Phase 3: 개인 맞춤형 감염병 위험 분석 서비스 (프리미엄)

#### 3.1 위험 지수 계산 알고리즘 (`lib/kcdc/risk-calculator.ts`)

**`calculateInfectionRiskScore()` 함수**:

- 입력: 사용자 건강 프로필, 현재 독감 경보 단계, 지역별 코로나19 확진자 수
- 출력: 0-100 위험 지수, 위험 등급, 구체적 행동 지침

**계산 로직**:

1. 기본 위험 점수: 독감 경보 단계 기반 (관심=20, 주의=40, 경계=60, 심각=80)
2. 연령 가중치: 65세 이상 +20점, 5세 미만 +15점
3. 기저질환 가중치: 당뇨/고혈압/심장질환 등 각 +10점
4. 백신 접종 여부: 독감 백신 미접종 +15점, 코로나19 백신 미접종 +10점
5. 지역 위험도: 코로나19 확진자 수 기반 추가 점수 (최대 +20점)
6. 최종 점수 = 기본 점수 + 가중치 합계 (최대 100점)

**위험 등급 매핑**:

- 0-30: low (낮음) - 녹색
- 31-50: moderate (보통) - 노란색
- 51-70: high (높음) - 주황색
- 71-100: critical (매우 높음) - 빨간색

#### 3.2 행동 지침 생성 (`lib/kcdc/risk-recommendations.ts`)

**`generateRiskRecommendations()` 함수**:

- 위험 지수와 사용자 정보를 기반으로 구체적 행동 지침 생성
- 예시: "독감 경계 단계이며, 사용자님의 연령대는 예방접종 권장 기간입니다. 마스크 착용과 손 씻기를 철저히 하시고, XX 병원을 방문하십시오."

#### 3.3 API 엔드포인트

- `app/api/kcdc/risk/calculate/route.ts`: 위험 지수 계산 API
  - `POST /api/kcdc/risk/calculate`: 사용자별 위험 지수 계산
  - 프리미엄 사용자만 접근 가능 (`PremiumGate` 적용)
  - 요청: `{ family_member_id?: string }` (가족 구성원 선택 가능)
  - 응답: 위험 지수, 등급, 행동 지침, 추천 병원 목록

- `app/api/kcdc/risk/history/route.ts`: 위험 지수 이력 조회 API
  - `GET /api/kcdc/risk/history`: 과거 위험 지수 추이 조회
  - 차트 데이터 제공 (최근 30일)

#### 3.4 UI 컴포넌트

- `app/(dashboard)/health/infection-risk/page.tsx`: 감염병 위험 분석 페이지
  - 위험 지수 대시보드 (원형 게이지 차트)
  - 위험 등급 배지 및 색상 표시
  - 행동 지침 카드 리스트
  - 추천 병원 목록 (지도 연동, 향후 확장)
  - 가족 구성원별 탭 (전체/개인별)
  - 프리미엄 가드 적용

- `components/health/infection-risk-dashboard.tsx`: 위험 지수 대시보드 컴포넌트
  - 원형 게이지 차트 (recharts 사용)
  - 위험 요인 분석 카드
  - 행동 지침 카드

- `components/health/risk-recommendations-card.tsx`: 행동 지침 카드 컴포넌트
  - 우선순위별 지침 표시
  - 병원 추천 링크

### Phase 4: 스마트 예방접종 일정 관리 서비스 (프리미엄)

#### 4.1 접종 일정 생성 알고리즘 (`lib/kcdc/vaccination-scheduler.ts`)

**`generateVaccinationSchedule()` 함수**:

- 입력: 사용자/가족 구성원 연령, 과거 접종 이력, KCDC 예방접종 정보
- 출력: 향후 1년치 접종 일정 (필수/권장/선택)

**로직**:

1. KCDC 예방접종 정보에서 사용자 연령대에 해당하는 백신 조회
2. 과거 접종 이력과 비교하여 누락/미완료 백신 식별
3. 접종 간격 규칙 적용 (예: MMR 1차 후 4주 후 2차)
4. 권장 일정 생성 및 우선순위 부여

#### 4.2 알림 시스템

- 접종 일정 1주일 전 푸시 알림 (브라우저 알림 또는 앱 내 알림)
- `app/api/kcdc/vaccination/reminders/route.ts`: 알림 전송 API
  - 크론 잡에서 매일 09:00 KST에 실행
  - 접종 예정일이 7일 이내인 사용자에게 알림 전송

#### 4.3 병원 추천 시스템

- `lib/kcdc/vaccination-site-finder.ts`: 접종 가능 병원 찾기
  - 사용자 위치 또는 지정 지역 기반
  - 건강검진 기관 정보 활용
  - 운영 시간, 전화번호, 접종 가능 백신 정보 제공

#### 4.4 API 엔드포인트

- `app/api/kcdc/vaccination/schedule/route.ts`: 접종 일정 조회 API
  - `GET /api/kcdc/vaccination/schedule?family_member_id=...`: 접종 일정 조회
  - 프리미엄 사용자만 접근 가능

- `app/api/kcdc/vaccination/record/route.ts`: 접종 기록 관리 API
  - `POST /api/kcdc/vaccination/record`: 접종 완료 기록
  - `PUT /api/kcdc/vaccination/record/[id]`: 접종 기록 수정
  - `DELETE /api/kcdc/vaccination/record/[id]`: 접종 기록 삭제

- `app/api/kcdc/vaccination/sites/route.ts`: 접종 가능 병원 조회 API
  - `GET /api/kcdc/vaccination/sites?region=...&vaccine=...`: 병원 목록 조회

#### 4.5 UI 컴포넌트

- `app/(dashboard)/health/vaccination/page.tsx`: 예방접종 관리 페이지
  - 접종 일정 캘린더 뷰 (월별/주별)
  - 접종 기록 목록 (완료/예정/누락)
  - 접종 가능 병원 지도 (향후 확장)
  - 가족 구성원별 탭
  - 프리미엄 가드 적용

- `components/health/vaccination-calendar.tsx`: 접종 일정 캘린더 컴포넌트
  - 월별 캘린더 뷰
  - 접종 예정일 하이라이트
  - 접종 완료 체크 표시

- `components/health/vaccination-record-card.tsx`: 접종 기록 카드 컴포넌트
  - 백신명, 접종일, 접종 기관 정보
  - 다음 접종 일정 안내

### Phase 5: 여행 및 외출 위험 지역 경고 서비스 (프리미엄)

#### 5.1 여행지 위험도 평가 알고리즘 (`lib/kcdc/travel-risk-assessor.ts`)

**`assessTravelRisk()` 함수**:

- 입력: 목적지 국가/지역, 여행 기간, 사용자 건강 정보
- 출력: 위험 등급, 감염병 경보, 예방 물품 체크리스트, 필수 백신

**로직**:

1. 해외 유입 감염병 정보에서 목적지 국가 경보 조회
2. 해당 지역 법정 감염병 발생 현황 조회
3. 사용자 건강 상태 고려 (기저질환, 알레르기)
4. 위험 등급 산출 및 예방 가이드 생성

#### 5.2 실시간 외출 위험도 (`lib/kcdc/local-risk-assessor.ts`)

**`assessLocalRisk()` 함수**:

- 입력: 사용자 위치(시/구), 외출 예정 시간
- 출력: 실시간 위험도, 권고 사항

**로직**:

1. 해당 지역 코로나19 검사 현황(양성률) 조회
2. 법정 감염병 발생률 조회
3. 독감 경보 단계 반영
4. 실시간 권고 사항 생성

#### 5.3 API 엔드포인트

- `app/api/kcdc/travel/assess/route.ts`: 여행 위험도 평가 API
  - `POST /api/kcdc/travel/assess`: 여행지 위험도 평가
  - 프리미엄 사용자만 접근 가능
  - 요청: `{ destination_country, destination_region, travel_start_date, travel_end_date }`
  - 응답: 위험 등급, 감염병 경보, 예방 체크리스트, 필수 백신

- `app/api/kcdc/local/assess/route.ts`: 지역 외출 위험도 API
  - `POST /api/kcdc/local/assess`: 지역별 실시간 위험도
  - 요청: `{ region, date }`
  - 응답: 위험도, 권고 사항

#### 5.4 UI 컴포넌트

- `app/(dashboard)/health/travel-safety/page.tsx`: 여행 안전 페이지
  - 여행지 입력 폼
  - 위험도 평가 결과 카드
  - 감염병 경보 표시
  - 예방 물품 체크리스트
  - 필수 백신 안내
  - 프리미엄 가드 적용

- `components/health/travel-risk-card.tsx`: 여행 위험도 카드 컴포넌트
  - 위험 등급 배지
  - 경보 정보 리스트
  - 예방 가이드

- `components/health/local-risk-widget.tsx`: 실시간 지역 위험도 위젯
  - 홈페이지에 배치 가능한 위젯
  - 현재 위치 기반 위험도 표시

### Phase 6: 건강검진 최적화 및 결과 해석 서비스 (프리미엄)

#### 6.1 누락 검진 항목 체크 알고리즘 (`lib/kcdc/health-checkup-analyzer.ts`)

**`checkMissingCheckups()` 함수**:

- 입력: 사용자 연령, 성별, 마지막 검진일, 검진 기록
- 출력: 누락 검진 항목, 권장 검진 일정

**로직**:

1. 국가건강검진 통계에서 연령/성별별 권장 검진 주기 조회
2. 암 검진 통계에서 권장 주기 조회
3. 마지막 검진일과 비교하여 누락/지연 검진 식별
4. 우선순위 부여 (지연 기간이 긴 것부터)

#### 6.2 검진 결과 해석 알고리즘 (`lib/kcdc/checkup-result-interpreter.ts`)

**`interpretCheckupResults()` 함수**:

- 입력: 검진 결과 데이터, 사용자 연령/성별
- 출력: 검진 결과 해석 리포트 (비교 분석, 주의 사항)

**로직**:

1. 건강검진 통계에서 동일 연령/성별 평균 수치 조회
2. 사용자 수치와 비교하여 편차 계산
3. 정상 범위와 비교하여 위험도 판정
4. 쉬운 언어로 해석 리포트 생성

**`generateDietRecommendationsFromCheckup()` 함수** (신규 추가):

- 입력: 검진 결과 해석 리포트, 사용자 건강 프로필
- 출력: 검진 결과 기반 식단 추천 가이드

**로직**:

1. 검진 결과에서 이상 지표 식별 (예: 콜레스테롤 높음, 나트륨 과다)
2. 이상 지표별 식단 권장사항 생성
   - 콜레스테롤 높음 → 저지방 식단, 오메가3 함유 식재료 추천
   - 나트륨 과다 → 저나트륨 식단, 칼륨 함유 식재료 추천
   - 혈당 높음 → 저탄수화물 식단, 저GI 식재료 추천
3. 식단 추천 시스템에 자동 반영 (Phase 10.1 영양정보 API 연동)
4. 개선 목표 설정 및 추적 (예: "1개월 내 나트륨 섭취량 20% 감소 목표")

#### 6.3 API 엔드포인트

- `app/api/kcdc/checkup/recommendations/route.ts`: 검진 권장 일정 API
  - `GET /api/kcdc/checkup/recommendations`: 누락 검진 항목 및 권장 일정 조회
  - 프리미엄 사용자만 접근 가능

- `app/api/kcdc/checkup/interpret/route.ts`: 검진 결과 해석 API
  - `POST /api/kcdc/checkup/interpret`: 검진 결과 해석 리포트 생성
  - 프리미엄 사용자만 접근 가능
  - 요청: `{ checkup_type, results, checkup_date }`
  - 응답: 해석 리포트 (항목별 비교, 주의 사항, 권고 사항)

- `app/api/kcdc/checkup/diet-recommendations/route.ts`: 검진 결과 기반 식단 추천 API (신규)
  - `POST /api/kcdc/checkup/diet-recommendations`: 검진 결과 기반 식단 추천 가이드 생성
  - 프리미엄 사용자만 접근 가능
  - 요청: `{ checkup_result_id }`
  - 응답: 식단 권장사항, 추천 레시피 목록, 개선 목표

- `app/api/kcdc/checkup/record/route.ts`: 검진 기록 관리 API
  - `POST /api/kcdc/checkup/record`: 검진 기록 저장
  - `GET /api/kcdc/checkup/record`: 검진 기록 조회
  - `PUT /api/kcdc/checkup/record/[id]`: 검진 기록 수정

- `app/api/kcdc/checkup/institutions/route.ts`: 검진 기관 조회 API
  - `GET /api/kcdc/checkup/institutions?region=...&type=...`: 검진 기관 목록 조회

#### 6.4 UI 컴포넌트

- `app/(dashboard)/health/checkup/page.tsx`: 건강검진 관리 페이지
  - 누락 검진 항목 알림 카드
  - 검진 권장 일정 캘린더
  - 검진 기록 목록
  - 검진 결과 해석 리포트 뷰어
  - 검진 기관 찾기 (지도 연동, 향후 확장)
  - 프리미엄 가드 적용

- `components/health/checkup-recommendations-card.tsx`: 검진 권장 카드 컴포넌트
  - 누락 검진 항목 리스트
  - 지연 기간 표시
  - 예약 링크

- `components/health/checkup-result-interpreter.tsx`: 검진 결과 해석 컴포넌트
  - 항목별 비교 차트 (사용자 vs 평균)
  - 정상 범위 표시
  - 주의 사항 하이라이트
  - PDF 다운로드 기능

- `components/health/checkup-diet-recommendations.tsx`: 검진 결과 기반 식단 추천 컴포넌트 (신규)
  - 검진 결과 해석 후 자동 표시되는 식단 권장사항 카드
  - 이상 지표별 추천 레시피 목록
  - 개선 목표 설정 및 추적 기능
  - "이 식단으로 개선하기" 버튼 (식단 생성 페이지로 이동)

### Phase 7: 통합 대시보드 및 홈페이지 통합

#### 7.1 건강 인사이트 대시보드

- `app/(dashboard)/health/insights/page.tsx`: 통합 건강 인사이트 페이지
  - 감염병 위험 지수 요약 카드
  - 예방접종 일정 요약
  - 건강검진 권장 사항 요약
  - 주간 질병 트렌드 차트
  - 프리미엄 사용자만 접근 가능

#### 7.1.1 가족 구성원별 통합 건강 관리 대시보드 (신규 추가)

- `app/(dashboard)/health/family-dashboard/page.tsx`: 가족 구성원별 통합 건강 관리 대시보드
  - 가족 구성원별 건강 상태 요약 카드 (탭 또는 그리드 레이아웃)
  - 각 구성원별:
    - 감염병 위험 지수
    - 예방접종 일정 요약
    - 건강검진 권장 사항
    - 주기적 건강 관리 서비스 (구충제, 약물 복용 등)
    - 일일 영양소 섭취량 (식단 기반)
  - 가족 구성원별 맞춤 식단 추천 버튼
  - 가족 전체 건강 트렌드 차트 (최근 30일)
  - 프리미엄 사용자만 접근 가능

- `components/health/family-member-health-card.tsx`: 가족 구성원 건강 카드 컴포넌트 (신규)
  - 구성원별 건강 상태 요약 표시
  - 건강 지표 배지 (정상/주의/경고)
  - "상세 보기" 링크
  - "식단 추천" 버튼

#### 7.2 홈페이지 통합

- `components/home/health-insights-section.tsx`: 건강 인사이트 섹션
  - 감염병 위험 지수 위젯 (프리미엄 사용자만)
  - 예방접종 알림 위젯
  - 건강검진 권장 위젯
  - 프리미엄 가입 CTA

#### 7.3 주간 질병 트렌드 분석

- `lib/kcdc/weekly-trend-analyzer.ts`: 주간 질병 트렌드 분석
  - 현재 주차(`flu_week`) 기준 감염병 발생 현황 요약
  - 전주 대비 증가율 계산
  - 주요 위험군 식별

- `app/api/kcdc/trends/weekly/route.ts`: 주간 트렌드 API
  - `GET /api/kcdc/trends/weekly`: 주간 질병 트렌드 조회

### Phase 8: 관리자 페이지 확장

#### 8.1 KCDC 데이터 관리

- `app/admin/kcdc-data/page.tsx`: KCDC 데이터 관리 페이지
  - 동기화 상태 모니터링
  - 수동 동기화 트리거
  - 데이터 품질 리포트
  - 사용자별 위험 지수 통계

#### 8.2 프리미엄 기능 사용 통계

- 사용자별 기능 사용 횟수 추적
- 인기 기능 분석
- 개선 포인트 식별

### Phase 9: 통합 주기적 건강 관리 서비스 알림 시스템 (프리미엄)

#### 9.1 데이터베이스 스키마 확장

**`user_periodic_health_services`**: 주기적 건강 관리 서비스 테이블

- `id`, `user_id` (FK → users), `family_member_id` (FK → family_members, NULL 가능)
- `service_type` (TEXT: vaccination/checkup/deworming/disease_management/other)
- `service_name` (TEXT): 서비스명 (예: "독감 예방접종", "위암 검진", "구충제 복용")
- `cycle_type` (TEXT: daily/weekly/monthly/quarterly/yearly/custom)
- `cycle_days` (INTEGER): 주기 일수 (custom인 경우)
- `last_service_date` (DATE): 마지막 서비스 받은 날짜
- `next_service_date` (DATE): 다음 서비스 예정일
- `reminder_days_before` (INTEGER, 기본값 7): 알림 일수 전
- `reminder_enabled` (BOOLEAN, 기본값 true)
- `notes` (TEXT): 메모
- `is_active` (BOOLEAN, 기본값 true)
- `created_at`, `updated_at`

**`user_deworming_records`**: 구충제 복용 기록 테이블

- `id`, `user_id` (FK → users), `family_member_id` (FK → family_members, NULL 가능)
- `medication_name` (TEXT): 구충제명 (예: "알벤다졸", "메벤다졸")
- `dosage` (TEXT): 복용량 (예: "400mg")
- `taken_date` (DATE): 복용일
- `next_due_date` (DATE): 다음 복용 예정일
- `cycle_days` (INTEGER): 복용 주기 (일반적으로 90일 또는 180일)
- `prescribed_by` (TEXT, NULL): 처방 의사/기관
- `notes` (TEXT)
- `created_at`, `updated_at`

**`deworming_medications`**: 구충제 마스터 데이터 테이블

- `id`, `medication_name` (TEXT), `active_ingredient` (TEXT)
- `standard_dosage` (TEXT), `standard_cycle_days` (INTEGER)
- `target_parasites` (TEXT[]): 대상 기생충
- `age_group` (TEXT): 권장 연령대
- `contraindications` (TEXT[]): 금기 사항
- `created_at`, `updated_at`

**`user_periodic_service_reminders`**: 주기적 서비스 알림 로그 테이블

- `id`, `user_id` (FK → users)
- `service_id` (FK → user_periodic_health_services)
- `reminder_type` (TEXT: push/email/sms/in_app)
- `reminder_date` (DATE): 알림 전송일
- `service_due_date` (DATE): 서비스 예정일
- `status` (TEXT: sent/failed/dismissed)
- `created_at`

#### 9.2 주기 계산 알고리즘 (`lib/kcdc/periodic-service-scheduler.ts`)

**`calculateNextServiceDate()` 함수**:

- 입력: 서비스 타입, 마지막 서비스일, 주기 타입, 주기 일수
- 출력: 다음 서비스 예정일

**주기별 계산 로직**:

- `daily`: 마지막 서비스일 + 1일
- `weekly`: 마지막 서비스일 + 7일
- `monthly`: 마지막 서비스일 + 30일
- `quarterly`: 마지막 서비스일 + 90일
- `yearly`: 마지막 서비스일 + 365일
- `custom`: 마지막 서비스일 + cycle_days

**`generateServiceSchedule()` 함수**:

- 사용자/가족 구성원의 모든 주기적 서비스를 조회하여 향후 1년치 일정 생성
- 예방접종, 건강검진, 구충제 복용, 질병 관리 서비스 통합

#### 9.3 구충제 복용 관리 시스템

**구충제 추천 로직**:

- 사용자 연령대에 맞는 구충제 추천
- 표준 복용 주기(90일 또는 180일) 적용
- 반려동물 보유 시 추가 알림 옵션

#### 9.4 통합 알림 시스템

**`lib/kcdc/unified-reminder-service.ts`**: 통합 알림 서비스

- 모든 주기적 서비스의 알림을 통합 관리
- 알림 우선순위 설정 (건강검진 > 예방접종 > 구충제 > 기타)
- 중복 알림 방지 로직

**알림 전송 로직**:

1. 매일 09:00 KST에 크론 잡 실행
2. `next_service_date`가 `reminder_days_before` 일 이내인 서비스 조회
3. 사용자 알림 설정 확인 (브라우저 알림, 이메일, SMS)
4. 알림 전송 및 로그 기록

**약물 복용 시간 알림 로직** (Phase 10.5 연동, 신규 추가):

1. 사용자 복용 약물 정보 조회 (`user_medications` 테이블)
2. 약물별 복용 시간 확인 (아침/점심/저녁, 식전/식후)
3. 복용 시간 30분 전 알림 전송
4. 식단 추천 시 약물 복용 시간 고려하여 식사 시간 제안
   - 예: "와파린은 식후 복용하므로, 오늘 저녁 식사는 18:00에 드시고 19:00에 약물 복용하세요"

#### 9.5 API 엔드포인트

- `app/api/health/periodic-services/route.ts`: 주기적 서비스 관리 API
  - `GET /api/health/periodic-services`: 모든 주기적 서비스 조회
  - `POST /api/health/periodic-services`: 새 서비스 등록
  - `PUT /api/health/periodic-services/[id]`: 서비스 수정
  - `DELETE /api/health/periodic-services/[id]`: 서비스 삭제

- `app/api/health/periodic-services/schedule/route.ts`: 통합 일정 조회 API
  - `GET /api/health/periodic-services/schedule`: 향후 1년치 통합 일정 조회
  - 프리미엄 사용자만 접근 가능
  - 요청: `{ start_date?, end_date?, family_member_id? }`
  - 응답: 날짜별 서비스 목록 (예방접종, 건강검진, 구충제 등 통합)

- `app/api/health/deworming/route.ts`: 구충제 복용 관리 API
  - `GET /api/health/deworming`: 구충제 복용 기록 조회
  - `POST /api/health/deworming`: 구충제 복용 기록 추가
  - `PUT /api/health/deworming/[id]`: 복용 기록 수정
  - `DELETE /api/health/deworming/[id]`: 복용 기록 삭제

- `app/api/health/deworming/recommendations/route.ts`: 구충제 추천 API
  - `GET /api/health/deworming/recommendations`: 사용자 연령대 기반 구충제 추천
  - 프리미엄 사용자만 접근 가능

- `app/api/health/periodic-services/reminders/route.ts`: 알림 전송 API
  - `POST /api/health/periodic-services/reminders`: 수동 알림 전송 (크론 잡에서 호출)
  - 크론 잡에서 매일 09:00 KST에 실행

- `app/api/health/medications/reminders/route.ts`: 약물 복용 시간 알림 API (신규, Phase 10.5 연동)
  - `POST /api/health/medications/reminders`: 약물 복용 시간 알림 전송 (크론 잡에서 호출)
  - 크론 잡에서 매일 3회 실행 (아침 08:00, 점심 12:00, 저녁 18:00 KST)
  - 복용 시간 30분 전 알림 전송
  - 식단 추천과 연동하여 식사 시간 제안 포함

- `app/api/health/periodic-services/complete/route.ts`: 서비스 완료 처리 API
  - `POST /api/health/periodic-services/complete`: 서비스 완료 처리 및 다음 일정 자동 계산
  - 요청: `{ service_id, completed_date }`

#### 9.6 UI 컴포넌트

- `app/(dashboard)/health/periodic-services/page.tsx`: 주기적 건강 관리 통합 페이지
  - 통합 캘린더 뷰 (월별/주별/일별)
  - 서비스 타입별 필터 (예방접종/건강검진/구충제/기타)
  - 다가오는 서비스 알림 카드 (7일 이내)
  - 서비스 등록/수정/삭제 기능
  - 가족 구성원별 탭
  - 프리미엄 가드 적용

- `components/health/periodic-services-calendar.tsx`: 통합 캘린더 컴포넌트
  - 월별 캘린더 뷰 (FullCalendar 또는 react-big-calendar 사용)
  - 서비스 타입별 색상 구분 (예방접종=파란색, 건강검진=초록색, 구충제=주황색)
  - 서비스 클릭 시 상세 정보 모달
  - 완료 처리 버튼

- `components/health/upcoming-services-card.tsx`: 다가오는 서비스 카드 컴포넌트
  - 7일 이내 서비스 목록 표시
  - 우선순위별 정렬
  - 알림 설정 토글
  - 완료 처리 버튼

- `components/health/service-form.tsx`: 서비스 등록/수정 폼 컴포넌트
  - 서비스 타입 선택 (예방접종/건강검진/구충제/기타)
  - 서비스명 입력
  - 주기 설정 (일/주/월/분기/연/사용자 정의)
  - 마지막 서비스일 입력
  - 알림 설정 (알림 활성화, 알림 일수 전)

- `components/health/deworming-manager.tsx`: 구충제 복용 관리 컴포넌트
  - 구충제 추천 목록 (연령대 기반)
  - 복용 기록 목록
  - 다음 복용일 계산 및 표시
  - 복용 완료 처리 버튼

#### 9.7 홈페이지 통합

- `components/home/upcoming-health-services-widget.tsx`: 다가오는 건강 서비스 위젯
  - 홈페이지에 배치 가능한 위젯
  - 최근 3개 서비스 표시
  - "전체 보기" 링크
  - 프리미엄 사용자만 표시

- `components/health/medication-reminder-widget.tsx`: 약물 복용 시간 알림 위젯 (신규, Phase 10.5 연동)
  - 홈페이지에 배치 가능한 위젯
  - 오늘 복용할 약물 목록 및 복용 시간 표시
  - 식사 시간 제안 (식전/식후 약물 구분)
  - 복용 완료 체크 기능
  - 프리미엄 사용자만 표시

#### 9.8 알림 설정 확장

**`user_notification_settings` 테이블에 추가 필드**:

- `periodic_services_enabled` (BOOLEAN): 주기적 서비스 알림 활성화
- `periodic_services_reminder_days` (INTEGER, 기본값 7): 알림 일수 전
- `deworming_reminders_enabled` (BOOLEAN): 구충제 복용 알림 활성화

### Phase 10: 공공 API 연동 기반 통합 건강 관리 서비스 (프리미엄)

#### 10.1 식약처 식품 영양 정보 API 연동

**목적**: 건강 맞춤 식단의 영양성분 정확도 향상 및 검증

**데이터베이스 스키마**:
- `food_nutrition_cache`: 식약처 식품 영양성분 캐시 테이블
  - `id`, `food_code` (TEXT, Unique), `food_name` (TEXT)
  - `nutrition_data` (JSONB): 영양성분 상세 (칼로리, 탄수화물, 단백질, 지방, 나트륨, 비타민 등)
  - `category` (TEXT), `unit` (TEXT), `fetched_at` (TIMESTAMPTZ)
  - `created_at`, `updated_at`

**API 클라이언트** (`lib/mfds/nutrition-api-client.ts`):
- `fetchFoodNutrition()`: 식약처 식품 영양성분 조회
- `batchFetchNutrition()`: 여러 식재료 일괄 조회
- `searchFoodByName()`: 식품명으로 검색

**기능**:
- 레시피 업로드 시 식약처 DB에서 재료별 영양성분 자동 매칭
- 건강검진 결과 해석 시 실제 섭취 영양소와 권장량 비교
- 의료비 예측 시 영양 불균형으로 인한 질병 위험도 반영
- 일일 영양소 섭취량 정확한 추적 및 리포트 생성

**API 엔드포인트**:
- `app/api/mfds/nutrition/search/route.ts`: 식품 영양성분 검색 API
  - `GET /api/mfds/nutrition/search?food_name=...`: 식품명으로 영양성분 조회
  - 프리미엄 사용자만 접근 가능

- `app/api/mfds/nutrition/calculate/route.ts`: 레시피 영양성분 계산 API
  - `POST /api/mfds/nutrition/calculate`: 레시피 재료 기반 영양성분 자동 계산
  - 요청: `{ ingredients: [{ name, quantity, unit }] }`
  - 응답: 총 영양성분 (칼로리, 탄수화물, 단백질, 지방 등)

- `app/api/mfds/nutrition/daily-tracker/route.ts`: 일일 영양소 추적 API (신규)
  - `GET /api/mfds/nutrition/daily-tracker?date=...`: 특정 날짜의 영양소 섭취량 조회
  - `POST /api/mfds/nutrition/daily-tracker`: 식단 기반 영양소 섭취량 기록
  - 프리미엄 사용자만 접근 가능
  - 요청: `{ date, meal_type, recipe_id, nutrition_data }`
  - 응답: 일일 총 영양소 섭취량, 목표 달성률, 부족/과다 영양소 목록

- `app/api/mfds/nutrition/weekly-summary/route.ts`: 주간 영양소 요약 API (신규)
  - `GET /api/mfds/nutrition/weekly-summary?start_date=...`: 주간 영양소 섭취 요약
  - 프리미엄 사용자만 접근 가능
  - 응답: 주간 평균 섭취량, 목표 달성률, 추이 차트 데이터

**UI 컴포넌트**:
- `components/recipes/nutrition-verification.tsx`: 레시피 영양성분 검증 컴포넌트
  - 식약처 DB와 비교하여 영양성분 정확도 표시
  - 불일치 시 경고 및 수정 제안

- `components/health/nutrition-intake-tracker.tsx`: 일일 영양소 섭취량 추적 컴포넌트 (확장)
  - 식단 기반 일일 영양소 섭취량 실시간 계산
  - 질병별 권장량과 비교 차트
  - 목표 달성률 표시 (진행 바, 퍼센트)
  - 부족/과다 영양소 알림 배지
  - 주간/월간 영양소 섭취 추이 차트
  - 건강검진 결과와 연동하여 "실제 섭취량 vs 검진 결과" 비교 (Phase 6 연동)

#### 10.2 농수산물유통공사 가격 정보 API 연동

**목적**: 식자재 구매 최적화 및 예산 관리

**데이터베이스 스키마**:
- `food_price_cache`: 식자재 가격 정보 캐시 테이블
  - `id`, `food_name` (TEXT), `region` (TEXT)
  - `current_price` (NUMERIC), `unit` (TEXT)
  - `price_trend` (TEXT: up/down/stable), `price_change_rate` (NUMERIC)
  - `cheapest_region` (TEXT), `fetched_at` (TIMESTAMPTZ)
  - `created_at`, `updated_at`

**API 클라이언트** (`lib/atga/price-api-client.ts`):
- `fetchFoodPrice()`: 특정 식자재 가격 조회
- `fetchPriceTrend()`: 가격 변동 추이 조회
- `compareRegionalPrices()`: 지역별 가격 비교

**기능**:
- 주간 식단 생성 시 예상 구매 비용 계산
- 가격 변동 알림 (저렴한 시기 알림)
- 지역별 가격 비교 (이동 시 구매 장소 추천)
- 의료비 예측과 연계하여 "건강 식단으로 질병 예방 시 연간 절감액" 계산

**API 엔드포인트**:
- `app/api/atga/price/search/route.ts`: 식자재 가격 조회 API
  - `GET /api/atga/price/search?food_name=...&region=...`: 가격 정보 조회
  - 프리미엄 사용자만 접근 가능

- `app/api/atga/price/calculate-budget/route.ts`: 식단 예산 계산 API
  - `POST /api/atga/price/calculate-budget`: 주간 식단 기반 예상 구매 비용 계산
  - 요청: `{ weekly_diet_plan_id }`
  - 응답: 예상 비용, 가격 변동 알림, 절약 팁

**UI 컴포넌트**:
- `components/diet/budget-calculator.tsx`: 식단 예산 계산 컴포넌트
  - 주간 식단 생성 후 예상 구매 비용 표시
  - 가격 변동 알림 및 절약 팁

- `components/home/price-alert-widget.tsx`: 가격 알림 위젯
  - 홈페이지에 배치 가능한 위젯
  - "배추 가격이 저렴한 시기입니다" 알림

#### 10.3 기상청 날씨 API 연동

**목적**: 계절별 식재료 추천 및 날씨 기반 건강 관리

**데이터베이스 스키마**:
- `weather_cache`: 날씨 정보 캐시 테이블
  - `id`, `region` (TEXT), `date` (DATE)
  - `temperature` (NUMERIC), `humidity` (NUMERIC)
  - `weather_condition` (TEXT), `air_quality` (TEXT)
  - `seasonal_foods` (TEXT[]): 제철 식재료 목록
  - `fetched_at` (TIMESTAMPTZ), `created_at`, `updated_at`

**API 클라이언트** (`lib/kma/weather-api-client.ts`):
- `fetchCurrentWeather()`: 현재 날씨 정보 조회
- `fetchWeeklyForecast()`: 주간 날씨 예보 조회
- `getSeasonalFoods()`: 계절별 제철 식재료 추천

**기능**:
- 계절별 제철 식재료 자동 추천
- 날씨 기반 건강 관리 알림 (미세먼지, 폭염, 한파)
- 계절성 질병 예방 식단 추천 (여름: 식중독, 겨울: 감기)
- 감염병 위험 분석 시 날씨 정보 결합

**API 엔드포인트**:
- `app/api/kma/weather/current/route.ts`: 현재 날씨 조회 API
  - `GET /api/kma/weather/current?region=...`: 현재 날씨 정보 조회

- `app/api/kma/weather/seasonal-foods/route.ts`: 제철 식재료 추천 API
  - `GET /api/kma/weather/seasonal-foods?region=...`: 계절별 제철 식재료 조회
  - 프리미엄 사용자만 접근 가능

- `app/api/kma/weather/health-recommendations/route.ts`: 날씨 기반 건강 추천 API
  - `POST /api/kma/weather/health-recommendations`: 날씨 정보 기반 건강 관리 추천
  - 요청: `{ region, user_health_profile }`
  - 응답: 건강 관리 알림, 추천 레시피, 주의 사항

**UI 컴포넌트**:
- `components/home/weather-health-widget.tsx`: 날씨 건강 위젯
  - 홈페이지에 배치 가능한 위젯
  - 현재 날씨, 제철 식재료, 건강 관리 팁 표시

- `components/diet/seasonal-recommendations.tsx`: 계절별 추천 식재료 컴포넌트
  - 주간 식단 생성 시 제철 식재료 자동 반영
  - 계절별 레시피 추천

#### 10.4 환경부 대기질 정보 API 연동

**목적**: 호흡기 질환자 맞춤 관리

**데이터베이스 스키마**:
- `air_quality_cache`: 대기질 정보 캐시 테이블
  - `id`, `region` (TEXT), `date` (DATE)
  - `pm10` (NUMERIC), `pm25` (NUMERIC), `o3` (NUMERIC)
  - `air_quality_index` (INTEGER), `air_quality_level` (TEXT)
  - `fetched_at` (TIMESTAMPTZ), `created_at`, `updated_at`

**API 클라이언트** (`lib/me/air-quality-api-client.ts`):
- `fetchAirQuality()`: 실시간 대기질 정보 조회
- `fetchAirQualityForecast()`: 대기질 예보 조회

**기능**:
- 실시간 대기질 정보 제공
- 호흡기 질환 보유자에게 대기질 알림
- 대기질이 나쁜 날 실외 활동 자제 및 실내 요리 추천
- 감염병 위험 분석 시 대기질 정보 반영

**API 엔드포인트**:
- `app/api/me/air-quality/current/route.ts`: 현재 대기질 조회 API
  - `GET /api/me/air-quality/current?region=...`: 현재 대기질 정보 조회

- `app/api/me/air-quality/health-alerts/route.ts`: 건강 알림 API
  - `POST /api/me/air-quality/health-alerts`: 대기질 기반 건강 알림 생성
  - 요청: `{ region, user_health_profile }`
  - 응답: 알림 메시지, 추천 레시피, 주의 사항

**UI 컴포넌트**:
- `components/health/air-quality-alert.tsx`: 대기질 알림 컴포넌트
  - 호흡기 질환 보유자에게 대기질 경고 표시
  - 실내 요리 추천 레시피

#### 10.5 식약처 의약품 정보 API 연동

**목적**: 약물-식품 상호작용 경고

**데이터베이스 스키마**:
- `user_medications`: 사용자 복용 약물 테이블
  - `id`, `user_id` (FK → users), `family_member_id` (FK → family_members, NULL 가능)
  - `medication_name` (TEXT), `medication_code` (TEXT)
  - `dosage` (TEXT), `frequency` (TEXT)
  - `start_date` (DATE), `end_date` (DATE, NULL 가능)
  - `prescribed_by` (TEXT), `notes` (TEXT)
  - `created_at`, `updated_at`

- `medication_food_interactions`: 약물-식품 상호작용 마스터 테이블
  - `id`, `medication_code` (TEXT), `food_name` (TEXT)
  - `interaction_type` (TEXT: contraindication/warning/precaution)
  - `severity` (TEXT: high/medium/low)
  - `description` (TEXT), `alternative_foods` (TEXT[])
  - `created_at`, `updated_at`

**API 클라이언트** (`lib/mfds/medication-api-client.ts`):
- `fetchMedicationInfo()`: 의약품 정보 조회
- `fetchFoodInteractions()`: 약물-식품 상호작용 정보 조회
- `checkInteractions()`: 사용자 복용 약물과 식재료 상호작용 검사

**기능**:
- 사용자 복용 약물 정보 입력
- 약물과 상호작용하는 식재료 자동 필터링
- 식단 추천 시 약물 상호작용 경고 표시
- 주기적 건강 관리 알림에 약물 복용 시간 포함

**API 엔드포인트**:
- `app/api/mfds/medications/route.ts`: 복용 약물 관리 API
  - `GET /api/mfds/medications`: 복용 약물 목록 조회
  - `POST /api/mfds/medications`: 복용 약물 추가
  - `PUT /api/mfds/medications/[id]`: 복용 약물 수정
  - `DELETE /api/mfds/medications/[id]`: 복용 약물 삭제

- `app/api/mfds/medications/check-interactions/route.ts`: 상호작용 검사 API
  - `POST /api/mfds/medications/check-interactions`: 식재료와 약물 상호작용 검사
  - 요청: `{ medication_codes: [], ingredients: [] }`
  - 응답: 상호작용 정보, 경고 메시지, 대체 식재료

**UI 컴포넌트**:
- `components/health/medication-manager.tsx`: 복용 약물 관리 컴포넌트
  - 복용 약물 목록, 추가/수정/삭제 기능
  - 식약처 DB 연동 자동 완성

- `components/recipes/medication-warning.tsx`: 약물 상호작용 경고 컴포넌트
  - 레시피 상세 페이지에 약물 상호작용 경고 표시
  - "이 레시피는 와파린 복용 시 주의 필요" 경고

#### 10.6 통계청 생활 통계 API 연동

**목적**: 사용자 건강 상태 객관적 비교

**데이터베이스 스키마**:
- `health_statistics_cache`: 건강 통계 캐시 테이블
  - `id`, `age_group` (TEXT), `gender` (TEXT), `region` (TEXT)
  - `year` (INTEGER), `statistics_type` (TEXT)
  - `average_values` (JSONB): 평균 건강 지표
  - `fetched_at` (TIMESTAMPTZ), `created_at`, `updated_at`

**API 클라이언트** (`lib/kostat/health-statistics-api-client.ts`):
- `fetchHealthStatistics()`: 건강 통계 조회
- `compareUserHealth()`: 사용자 건강 상태와 평균 비교

**기능**:
- 동일 연령/성별/지역 평균 건강 지표와 비교
- 건강검진 결과 해석 시 "동년배 평균 대비 20% 높음" 표시
- 의료비 예측 시 "동일 연령대 평균 의료비 대비 예상 비용" 제공

**API 엔드포인트**:
- `app/api/kostat/health-statistics/compare/route.ts`: 건강 통계 비교 API
  - `POST /api/kostat/health-statistics/compare`: 사용자 건강 상태와 평균 비교
  - 요청: `{ age, gender, region, health_metrics }`
  - 응답: 비교 결과, 차이 분석, 개선 방향

**UI 컴포넌트**:
- `components/health/health-comparison-chart.tsx`: 건강 비교 차트 컴포넌트
  - 사용자 vs 평균 건강 지표 비교 차트
  - 개선 방향 제시

#### 10.7 통합 대시보드 및 시너지 효과

**통합 건강 관리 대시보드**:
- `app/(dashboard)/health/integrated-dashboard/page.tsx`: 통합 건강 관리 대시보드
  - 모든 공공 API 데이터 통합 표시
  - 날씨 + 대기질 + 감염병 위험 통합 분석
  - 식단 영양소 + 건강검진 결과 비교
  - 약물 상호작용 + 식단 추천 통합
  - 프리미엄 사용자만 접근 가능

**시너지 효과 예시**:
1. **감염병 위험 분석 + 날씨 + 대기질**: "미세먼지 '나쁨' + 독감 경계 단계 = 호흡기 위험 높음"
2. **식단 추천 + 가격 정보**: "이번 주 제철 식재료(배추, 무) 가격이 저렴합니다"
3. **건강검진 결과 + 영양소 섭취**: "콜레스테롤 수치가 높으시네요. 실제 섭취 영양소 분석 결과 나트륨 과다"
4. **약물 복용 + 식단 추천**: "와파린 복용 중이시므로 비타민 K 함유 식재료 제한된 식단 추천"

**식단-건강검진 결과 통합 리포트** (신규 추가, Phase 6 + Phase 10.1 통합):

- `app/api/health/integrated-report/route.ts`: 식단-건강검진 결과 통합 리포트 API
  - `POST /api/health/integrated-report`: 건강검진 결과와 실제 섭취 영양소 통합 리포트 생성
  - 프리미엄 사용자만 접근 가능
  - 요청: `{ checkup_result_id, start_date, end_date }` (검진 결과 ID와 분석 기간)
  - 응답: 통합 리포트 (검진 결과, 실제 섭취 영양소, 비교 분석, 개선 방안)

- `components/health/integrated-health-report.tsx`: 식단-건강검진 결과 통합 리포트 컴포넌트 (신규)
  - 건강검진 결과와 실제 섭취 영양소 비교 차트
  - 이상 지표별 원인 분석 (예: "콜레스테롤 높음 → 실제 섭취 나트륨 과다 확인")
  - 개선 방안 제시 (식단 권장사항, 레시피 추천)
  - PDF 다운로드 기능

## 환경 변수 설정

`.env.local`에 추가:
```bash
# KCDC 확장 API 설정
KCDC_EXTENDED_API_ENABLED=true
KCDC_COVID19_API_KEY=your-api-key-here
KCDC_DISEASE_OUTBREAK_API_KEY=your-api-key-here
KCDC_HEALTH_CHECKUP_API_KEY=your-api-key-here

# 알림 설정
VACCINATION_REMINDER_ENABLED=true
CHECKUP_REMINDER_ENABLED=true

# 식약처 API (Phase 10)
MFDS_API_KEY=your-api-key-here
MFDS_NUTRITION_API_ENABLED=true
MFDS_MEDICATION_API_ENABLED=true

# 농수산물유통공사 API (Phase 10)
ATGA_API_KEY=your-api-key-here
ATGA_PRICE_API_ENABLED=true

# 기상청 API (Phase 10)
KMA_API_KEY=your-api-key-here
KMA_WEATHER_API_ENABLED=true

# 환경부 API (Phase 10)
ME_API_KEY=your-api-key-here
ME_AIR_QUALITY_API_ENABLED=true

# 통계청 API (Phase 10)
KOSTAT_API_KEY=your-api-key-here
KOSTAT_HEALTH_STATISTICS_API_ENABLED=true
```

## 보안 및 프라이버시

- 모든 API는 인증 필수 (`useClerkSupabaseClient` 사용)
- 모든 기능은 프리미엄 사용자 전용 (`PremiumGate` 적용)
- 개인 건강 정보는 암호화 저장 (향후 확장)
- 위험 지수 및 검진 결과는 사용자 본인만 조회 가능
- 가족 구성원 정보는 해당 사용자만 접근 가능
- 약물 정보는 암호화 저장 (Phase 10 추가)

## 테스트 계획

1. **단위 테스트**: 각 알고리즘 함수 테스트 (위험 지수 계산, 일정 생성 등)
2. **통합 테스트**: API 엔드포인트 테스트
3. **E2E 테스트**: 사용자 시나리오 테스트 (Playwright)

   - 프리미엄 사용자 로그인 → 위험 지수 조회 → 예방접종 일정 확인 → 건강검진 권장 사항 확인
   - 프리미엄 사용자 로그인 → 날씨 확인 → 제철 식재료 반영된 식단 생성 → 가격 정보 확인 → 약물 상호작용 검사 (Phase 10 추가)

## 참고 파일

- 기존 KCDC API: `lib/kcdc/kcdc-parser.ts`
- 건강 프로필 API: `app/api/health/profile/route.ts`
- 프리미엄 가드: `components/premium/premium-gate.tsx`
- 크론 잡 설정: `supabase/functions/sync-kcdc-alerts/index.ts`

## 상세 구현 체크리스트 (페르소나 B 기준 우선순위)

### ⚡ Phase 0: 성능 최적화 전략 (최우선) - 모든 기능 구현 전 필수

**목적**: API 응답 시간 최적화 및 사용자 경험 개선

#### 0.1 기존 기능 개선 (즉시 적용)

- [ ] **0.1.1 KCDC API 캐싱 개선**
  - [ ] `lib/kcdc/kcdc-parser.ts` 파일 수정
  - [ ] `fetchKcdcData()` 함수에 데이터베이스 캐시 확인 로직 추가
  - [ ] `kcdc_alerts` 테이블에서 최신 데이터 확인 (fetched_at 기준 6시간 이내)
  - [ ] 캐시 히트 시 즉시 반환, 미스 시에만 API 호출
  - [ ] Next.js `unstable_cache`로 함수 래핑 (revalidate: 3600)
  - [ ] API 호출 실패 시 캐시된 데이터 폴백 로직 구현
  - [ ] 단위 테스트 작성

- [ ] **0.1.2 공공 API 캐싱 유틸리티 생성**
  - [ ] `lib/cache/public-api-cache.ts` 파일 생성
  - [ ] `fetchWithCache<T>()` 범용 함수 구현
  - [ ] 데이터베이스 캐시 테이블 확인 로직 구현
  - [ ] 캐시 저장 로직 구현
  - [ ] TTL 관리 로직 구현
  - [ ] 캐시 무효화 로직 구현
  - [ ] 에러 핸들링 및 폴백 로직 구현
  - [ ] 단위 테스트 작성

- [ ] **0.1.3 식단 추천 시스템 성능 개선**
  - [ ] `lib/diet/recommendation.ts`에 서버 사이드 캐싱 적용
  - [ ] 사용자별, 날짜별 캐시 키 생성 로직 구현
  - [ ] 건강 프로필 해시 기반 캐시 키 생성
  - [ ] 건강 프로필 변경 시 캐시 무효화 로직 구현
  - [ ] `lib/diet/integrated-filter.ts`에 필터링 결과 캐싱 추가
  - [ ] 레시피 데이터 변경 시 캐시 무효화 로직 구현

- [ ] **0.1.4 데이터베이스 쿼리 최적화**
  - [ ] `supabase/migrations/YYYYMMDDHHmmss_add_performance_indexes.sql` 마이그레이션 파일 생성
  - [ ] `kcdc_alerts` 테이블 인덱스 추가 (fetched_at, is_active, alert_type 복합 인덱스)
  - [ ] `user_health_profiles` 테이블 인덱스 확인 및 추가 (user_id)
  - [ ] `recipes` 테이블 인덱스 확인 및 추가 (created_at, difficulty)
  - [ ] N+1 쿼리 문제 해결 (가족 구성원별 조회 시 배치 쿼리로 변경)
  - [ ] 불필요한 SELECT 필드 제거 (필요한 필드만 조회)
  - [ ] JOIN 최적화 (효율적인 JOIN 순서, 인덱스 활용)

- [ ] **0.1.5 API 엔드포인트 응답 최적화**
  - [ ] `app/api/health/summary/route.ts` 파일 생성 (경량화된 요약 데이터)
  - [ ] `app/api/health/detail/route.ts` 파일 생성 (상세 데이터, 필요시 호출)
  - [ ] 모든 목록 조회 API에 `limit`, `offset` 파라미터 추가
  - [ ] 기본 limit 설정 (20개)
  - [ ] 병렬 처리 적용 (`Promise.all` 활용)

#### 0.2 신규 기능 구현 시 성능 최적화 (각 Phase별 필수 적용)

- [ ] **0.2.1 모든 공공 API 호출에 캐싱 적용**
  - [ ] 식약처 영양정보 API: `food_nutrition_cache` 테이블 활용, API 호출 전 캐시 확인 필수
  - [ ] 농수산물유통공사 가격 API: `food_price_cache` 테이블 활용, 크론 잡으로 사전 동기화
  - [ ] 기상청 날씨 API: `weather_cache` 테이블 활용, 매시간 크론 잡 동기화
  - [ ] 환경부 대기질 API: `air_quality_cache` 테이블 활용, 매시간 크론 잡 동기화
  - [ ] 식약처 의약품 API: `medication_food_interactions` 테이블 활용, 장기 캐싱 (30일)
  - [ ] 통계청 건강통계 API: `health_statistics_cache` 테이블 활용, 연도별 1년간 캐싱

- [ ] **0.2.2 복잡한 계산 결과 캐싱**
  - [ ] 위험 지수 계산 결과: `user_infection_risk_scores` 테이블 활용, 사용자별/날짜별 캐시, TTL 1시간
  - [ ] 건강검진 결과 해석: 검진 결과 ID 기반 영구 캐싱
  - [ ] 식단 추천 결과: 사용자별/날짜별/건강 프로필 해시 기반 캐싱

- [ ] **0.2.3 크론 잡 스케줄 설정**
  - [ ] `supabase/functions/sync-nutrition-data/index.ts` Edge Function 생성 (매일 06:00 KST)
  - [ ] `supabase/functions/sync-price-data/index.ts` Edge Function 생성 (매일 09:00 KST)
  - [ ] `supabase/functions/sync-weather-data/index.ts` Edge Function 생성 (매시간)
  - [ ] `supabase/functions/sync-air-quality/index.ts` Edge Function 생성 (매시간)
  - [ ] `supabase/functions/sync-health-statistics/index.ts` Edge Function 생성 (매주 일요일 00:00 KST)
  - [ ] 크론 잡 모니터링 및 알림 시스템 구현

#### 0.3 프론트엔드 성능 최적화

- [ ] **0.3.1 점진적 로딩 구현**
  - [ ] 캐시 우선 표시, 백그라운드 갱신 패턴 구현
  - [ ] 스켈레톤 UI 컴포넌트 생성 (`components/ui/skeleton.tsx`)
  - [ ] 각 섹션별 독립적 로딩 상태 관리
  - [ ] 에러 발생 시 폴백 데이터 표시 로직 구현

- [ ] **0.3.2 데이터 페칭 최적화**
  - [ ] React Query 또는 SWR 도입 검토 및 적용
  - [ ] 서버 상태 관리 및 캐싱 설정
  - [ ] 자동 재검증 (Stale-While-Revalidate) 설정
  - [ ] 페이지별 필요한 데이터만 요청하도록 최적화

#### 0.4 백그라운드 작업 처리

- [ ] **0.4.1 무거운 작업 비동기 처리**
  - [ ] Job Queue 시스템 도입 검토 (Supabase Edge Functions 또는 외부 서비스)
  - [ ] 통합 리포트 생성 API 수정 (즉시 job_id 반환)
  - [ ] 클라이언트 polling 또는 webhook으로 결과 수신 로직 구현
  - [ ] 식단 추천 생성 백그라운드 처리 로직 구현
  - [ ] 진행 상태 표시 UI 컴포넌트 구현

#### 0.5 모니터링 및 성능 측정

- [ ] **0.5.1 성능 모니터링 도구 설정**
  - [ ] API 응답 시간 측정 로직 구현
  - [ ] 캐시 히트율 추적 로직 구현
  - [ ] 데이터베이스 쿼리 시간 측정 로직 구현
  - [ ] 성능 지표 대시보드 구현 (관리자 페이지)

- [ ] **0.5.2 성능 지표 목표 설정**
  - [ ] API 응답 시간: 평균 200ms 이하 목표
  - [ ] 캐시 히트율: 80% 이상 목표
  - [ ] 데이터베이스 쿼리 시간: 평균 100ms 이하 목표

### 🔴 그룹 1: 인프라 구축 (Phase 1-2) - 필수 선행 작업

**목적**: 모든 프리미엄 기능의 기반이 되는 데이터베이스 스키마 및 API 동기화 시스템 구축

#### Phase 1: 데이터베이스 스키마 확장

- [ ] **1.1 마이그레이션 파일 생성**
  - [ ] `supabase/migrations/YYYYMMDDHHmmss_create_kcdc_premium_tables.sql` 파일 생성
  - [ ] `user_infection_risk_scores` 테이블 생성 (id, user_id, family_member_id, risk_score, risk_level, flu_stage, flu_week, region, factors, recommendations, calculated_at, expires_at)
  - [ ] `user_vaccination_records` 테이블 생성 (id, user_id, family_member_id, vaccine_name, vaccine_code, target_age_group, scheduled_date, completed_date, dose_number, total_doses, vaccination_site, vaccination_site_address, reminder_enabled, reminder_days_before, notes)
  - [ ] `user_vaccination_schedules` 테이블 생성 (id, user_id, family_member_id, vaccine_name, recommended_date, priority, status, source)
  - [ ] `user_travel_risk_assessments` 테이블 생성 (id, user_id, destination_country, destination_region, travel_start_date, travel_end_date, risk_level, disease_alerts, prevention_checklist, vaccination_requirements)
  - [ ] `user_health_checkup_records` 테이블 생성 (id, user_id, family_member_id, checkup_type, checkup_date, checkup_site, checkup_site_address, results, next_recommended_date, overdue_days)
  - [ ] `user_health_checkup_recommendations` 테이블 생성 (id, user_id, family_member_id, checkup_type, checkup_name, recommended_date, priority, overdue, last_checkup_date, age_requirement, gender_requirement)
  - [ ] `kcdc_disease_outbreaks` 테이블 생성 (id, disease_name, disease_code, region, outbreak_date, case_count, severity, alert_level, description, source_url, fetched_at, is_active)
  - [ ] `kcdc_health_checkup_statistics` 테이블 생성 (id, checkup_type, age_group, gender, year, average_values, normal_ranges, fetched_at)
  - [ ] 모든 테이블에 인덱스 추가 (user_id, family_member_id, created_at 등)
  - [ ] 외래 키 제약 조건 추가

- [ ] **1.2 기존 테이블 확장**
  - [ ] `user_health_profiles` 테이블에 `vaccination_history` (JSONB) 필드 추가
  - [ ] `user_health_profiles` 테이블에 `last_health_checkup_date` (DATE) 필드 추가
  - [ ] `user_health_profiles` 테이블에 `region` (TEXT) 필드 추가
  - [ ] `family_members` 테이블에 `vaccination_history` (JSONB) 필드 추가
  - [ ] `family_members` 테이블에 `last_health_checkup_date` (DATE) 필드 추가
  - [ ] 마이그레이션 파일 테스트 및 적용

#### Phase 2: KCDC API 확장 및 데이터 동기화

- [ ] **2.1 API 클라이언트 확장**
  - [ ] `lib/kcdc/kcdc-api-extended.ts` 파일 생성
  - [ ] `fetchCovid19Data()` 함수 구현 (코로나19 확진자 현황 조회)
  - [ ] `fetchDiseaseOutbreaks()` 함수 구현 (법정 감염병 발생 현황 조회)
  - [ ] `fetchOverseasDiseaseAlerts()` 함수 구현 (해외 유입 감염병 정보 조회)
  - [ ] `fetchHealthCheckupStatistics()` 함수 구현 (국가건강검진 통계 조회)
  - [ ] `fetchHealthCheckupInstitutions()` 함수 구현 (건강검진 기관 정보 조회)
  - [ ] `lib/kcdc/kcdc-parser-extended.ts` 파일 생성 (확장 데이터 파서)
  - [ ] `lib/kcdc/kcdc-sync-extended.ts` 파일 생성 (확장 동기화 로직)
  - [ ] 에러 핸들링 및 재시도 로직 구현
  - [ ] API 응답 타입 정의 (`types/kcdc-extended.ts`)

- [ ] **2.2 동기화 API 엔드포인트**
  - [ ] `app/api/kcdc/sync/extended/route.ts` 파일 생성
  - [ ] `POST /api/kcdc/sync/extended` 엔드포인트 구현
  - [ ] 코로나19 데이터 동기화 로직 구현
  - [ ] 감염병 발생 데이터 동기화 로직 구현
  - [ ] 건강검진 통계 데이터 동기화 로직 구현
  - [ ] CRON_SECRET 인증 로직 구현
  - [ ] 동기화 상태 로깅 및 에러 처리

- [ ] **2.3 크론 잡 설정**
  - [ ] `supabase/functions/sync-kcdc-extended/index.ts` Edge Function 생성
  - [ ] 크론 잡 스케줄 설정 (매일 08:00 KST)
  - [ ] `supabase/migrations/YYYYMMDDHHmmss_setup_kcdc_extended_cron.sql` 마이그레이션 파일 생성
  - [ ] 크론 잡 테스트 및 검증

### 🔴 그룹 2: 식단 추천 핵심 기능 (Phase 10.5 + Phase 10.1) - 함께 구현

**목적**: 식단 추천 시 약물 상호작용 자동 체크 및 영양소 정확도 검증

#### Phase 10.5: 식약처 의약품 정보 API 연동

- [ ] **10.5.1 데이터베이스 스키마**
  - [ ] `user_medications` 테이블 생성 (id, user_id, family_member_id, medication_name, medication_code, dosage, frequency, start_date, end_date, prescribed_by, notes)
  - [ ] `medication_food_interactions` 테이블 생성 (id, medication_code, food_name, interaction_type, severity, description, alternative_foods)
  - [ ] 인덱스 및 외래 키 제약 조건 추가

- [ ] **10.5.2 API 클라이언트**
  - [ ] `lib/mfds/medication-api-client.ts` 파일 생성
  - [ ] `fetchMedicationInfo()` 함수 구현 (의약품 정보 조회)
  - [ ] `fetchFoodInteractions()` 함수 구현 (약물-식품 상호작용 정보 조회)
  - [ ] `checkInteractions()` 함수 구현 (사용자 복용 약물과 식재료 상호작용 검사)
  - [ ] 에러 핸들링 및 캐싱 로직 구현

- [ ] **10.5.3 API 엔드포인트**
  - [ ] `app/api/mfds/medications/route.ts` 파일 생성
  - [ ] `GET /api/mfds/medications` 구현 (복용 약물 목록 조회)
  - [ ] `POST /api/mfds/medications` 구현 (복용 약물 추가)
  - [ ] `PUT /api/mfds/medications/[id]` 구현 (복용 약물 수정)
  - [ ] `DELETE /api/mfds/medications/[id]` 구현 (복용 약물 삭제)
  - [ ] `app/api/mfds/medications/check-interactions/route.ts` 파일 생성
  - [ ] `POST /api/mfds/medications/check-interactions` 구현 (상호작용 검사)
  - [ ] 프리미엄 가드 적용
  - [ ] 인증 및 권한 검사 구현

- [ ] **10.5.4 UI 컴포넌트**
  - [ ] `components/health/medication-manager.tsx` 컴포넌트 생성
  - [ ] 복용 약물 목록 표시 기능 구현
  - [ ] 복용 약물 추가/수정/삭제 폼 구현
  - [ ] 식약처 DB 연동 자동 완성 기능 구현
  - [ ] `components/recipes/medication-warning.tsx` 컴포넌트 생성
  - [ ] 레시피 상세 페이지에 약물 상호작용 경고 표시 기능 구현
  - [ ] 경고 메시지 스타일링 및 UX 개선

- [ ] **10.5.5 식단 추천 시스템 통합**
  - [ ] `lib/diet/integrated-filter.ts`에 약물 상호작용 필터링 로직 추가
  - [ ] 식단 추천 시 약물 상호작용 자동 체크 기능 구현
  - [ ] 상호작용하는 식재료 자동 제외 로직 구현
  - [ ] 대체 식재료 제안 기능 구현

#### Phase 10.1: 식약처 식품 영양 정보 API 연동

- [ ] **10.1.1 데이터베이스 스키마**
  - [ ] `food_nutrition_cache` 테이블 생성 (id, food_code, food_name, nutrition_data, category, unit, fetched_at)
  - [ ] `daily_nutrition_tracker` 테이블 생성 (id, user_id, family_member_id, date, meal_type, recipe_id, nutrition_data, created_at)
  - [ ] 인덱스 및 외래 키 제약 조건 추가

- [ ] **10.1.2 API 클라이언트**
  - [ ] `lib/mfds/nutrition-api-client.ts` 파일 생성
  - [ ] `fetchFoodNutrition()` 함수 구현 (식약처 식품 영양성분 조회)
  - [ ] `batchFetchNutrition()` 함수 구현 (여러 식재료 일괄 조회)
  - [ ] `searchFoodByName()` 함수 구현 (식품명으로 검색)
  - [ ] 캐싱 로직 구현 (food_nutrition_cache 테이블 활용)

- [ ] **10.1.3 API 엔드포인트**
  - [ ] `app/api/mfds/nutrition/search/route.ts` 파일 생성
  - [ ] `GET /api/mfds/nutrition/search` 구현 (식품 영양성분 검색)
  - [ ] `app/api/mfds/nutrition/calculate/route.ts` 파일 생성
  - [ ] `POST /api/mfds/nutrition/calculate` 구현 (레시피 영양성분 계산)
  - [ ] `app/api/mfds/nutrition/daily-tracker/route.ts` 파일 생성
  - [ ] `GET /api/mfds/nutrition/daily-tracker` 구현 (일일 영양소 섭취량 조회)
  - [ ] `POST /api/mfds/nutrition/daily-tracker` 구현 (일일 영양소 섭취량 기록)
  - [ ] `app/api/mfds/nutrition/weekly-summary/route.ts` 파일 생성
  - [ ] `GET /api/mfds/nutrition/weekly-summary` 구현 (주간 영양소 요약)
  - [ ] 프리미엄 가드 적용

- [ ] **10.1.4 UI 컴포넌트**
  - [ ] `components/recipes/nutrition-verification.tsx` 컴포넌트 생성
  - [ ] 식약처 DB와 비교하여 영양성분 정확도 표시 기능 구현
  - [ ] 불일치 시 경고 및 수정 제안 기능 구현
  - [ ] `components/health/nutrition-intake-tracker.tsx` 컴포넌트 생성/확장
  - [ ] 일일 영양소 섭취량 실시간 계산 기능 구현
  - [ ] 질병별 권장량과 비교 차트 구현
  - [ ] 목표 달성률 표시 (진행 바, 퍼센트) 구현
  - [ ] 부족/과다 영양소 알림 배지 구현
  - [ ] 주간/월간 영양소 섭취 추이 차트 구현

- [ ] **10.1.5 레시피 시스템 통합**
  - [ ] 레시피 업로드 시 식약처 DB에서 재료별 영양성분 자동 매칭 기능 구현
  - [ ] 영양성분 검증 로직 구현
  - [ ] 식단 추천 시스템에 영양소 정보 통합

### 🔴 그룹 3: 건강 관리 통합 (Phase 9 + Phase 10.5 약물 복용 알림) - 함께 구현

**목적**: 주기적 건강 관리 서비스 통합 및 약물 복용 시간 알림

#### Phase 9: 통합 주기적 건강 관리 서비스 알림 시스템

- [ ] **9.1 데이터베이스 스키마**
  - [ ] `user_periodic_health_services` 테이블 생성 (id, user_id, family_member_id, service_type, service_name, cycle_type, cycle_days, last_service_date, next_service_date, reminder_days_before, reminder_enabled, notes, is_active)
  - [ ] `user_deworming_records` 테이블 생성 (id, user_id, family_member_id, medication_name, dosage, taken_date, next_due_date, cycle_days, prescribed_by, notes)
  - [ ] `deworming_medications` 테이블 생성 (id, medication_name, active_ingredient, standard_dosage, standard_cycle_days, target_parasites, age_group, contraindications)
  - [ ] `user_periodic_service_reminders` 테이블 생성 (id, user_id, service_id, reminder_type, reminder_date, service_due_date, status)
  - [ ] `user_notification_settings` 테이블에 필드 추가 (periodic_services_enabled, periodic_services_reminder_days, deworming_reminders_enabled)
  - [ ] 인덱스 및 외래 키 제약 조건 추가

- [ ] **9.2 주기 계산 알고리즘**
  - [ ] `lib/kcdc/periodic-service-scheduler.ts` 파일 생성
  - [ ] `calculateNextServiceDate()` 함수 구현 (주기별 계산 로직: daily/weekly/monthly/quarterly/yearly/custom)
  - [ ] `generateServiceSchedule()` 함수 구현 (향후 1년치 일정 생성)
  - [ ] 구충제 추천 로직 구현 (연령대 기반)
  - [ ] 단위 테스트 작성

- [ ] **9.3 통합 알림 시스템**
  - [ ] `lib/kcdc/unified-reminder-service.ts` 파일 생성
  - [ ] 알림 우선순위 설정 로직 구현 (건강검진 > 예방접종 > 구충제 > 기타)
  - [ ] 중복 알림 방지 로직 구현
  - [ ] 알림 전송 로직 구현 (매일 09:00 KST 크론 잡)
  - [ ] 브라우저 알림, 이메일, SMS 알림 채널 구현

- [ ] **9.4 약물 복용 시간 알림 (Phase 10.5 연동)**
  - [ ] `app/api/health/medications/reminders/route.ts` 파일 생성
  - [ ] `POST /api/health/medications/reminders` 엔드포인트 구현
  - [ ] 약물별 복용 시간 확인 로직 구현 (아침/점심/저녁, 식전/식후)
  - [ ] 복용 시간 30분 전 알림 전송 로직 구현
  - [ ] 크론 잡 설정 (매일 3회: 08:00, 12:00, 18:00 KST)
  - [ ] 식단 추천 시 약물 복용 시간 고려하여 식사 시간 제안 로직 구현

- [ ] **9.5 API 엔드포인트**
  - [ ] `app/api/health/periodic-services/route.ts` 파일 생성
  - [ ] `GET /api/health/periodic-services` 구현 (모든 주기적 서비스 조회)
  - [ ] `POST /api/health/periodic-services` 구현 (새 서비스 등록)
  - [ ] `PUT /api/health/periodic-services/[id]` 구현 (서비스 수정)
  - [ ] `DELETE /api/health/periodic-services/[id]` 구현 (서비스 삭제)
  - [ ] `app/api/health/periodic-services/schedule/route.ts` 파일 생성
  - [ ] `GET /api/health/periodic-services/schedule` 구현 (통합 일정 조회)
  - [ ] `app/api/health/deworming/route.ts` 파일 생성
  - [ ] 구충제 복용 관리 API 구현 (GET, POST, PUT, DELETE)
  - [ ] `app/api/health/deworming/recommendations/route.ts` 파일 생성
  - [ ] `GET /api/health/deworming/recommendations` 구현 (구충제 추천)
  - [ ] `app/api/health/periodic-services/reminders/route.ts` 파일 생성
  - [ ] `POST /api/health/periodic-services/reminders` 구현 (알림 전송)
  - [ ] `app/api/health/periodic-services/complete/route.ts` 파일 생성
  - [ ] `POST /api/health/periodic-services/complete` 구현 (서비스 완료 처리)
  - [ ] 프리미엄 가드 적용

- [ ] **9.6 UI 컴포넌트**
  - [ ] `app/(dashboard)/health/periodic-services/page.tsx` 페이지 생성
  - [ ] 통합 캘린더 뷰 구현 (월별/주별/일별)
  - [ ] 서비스 타입별 필터 구현
  - [ ] 다가오는 서비스 알림 카드 구현 (7일 이내)
  - [ ] 서비스 등록/수정/삭제 폼 구현
  - [ ] 가족 구성원별 탭 구현
  - [ ] `components/health/periodic-services-calendar.tsx` 컴포넌트 생성
  - [ ] FullCalendar 또는 react-big-calendar 통합
  - [ ] 서비스 타입별 색상 구분 구현
  - [ ] 서비스 클릭 시 상세 정보 모달 구현
  - [ ] 완료 처리 버튼 구현
  - [ ] `components/health/upcoming-services-card.tsx` 컴포넌트 생성
  - [ ] `components/health/service-form.tsx` 컴포넌트 생성
  - [ ] `components/health/deworming-manager.tsx` 컴포넌트 생성
  - [ ] `components/home/upcoming-health-services-widget.tsx` 위젯 생성
  - [ ] `components/health/medication-reminder-widget.tsx` 위젯 생성 (약물 복용 시간 알림)

### 🟠 그룹 4: 검진-식단 연동 (Phase 6 + Phase 10.1 통합) - 함께 구현

**목적**: 건강검진 결과 기반 식단 추천 및 통합 리포트

#### Phase 6: 건강검진 최적화 및 결과 해석 서비스

- [ ] **6.1 누락 검진 항목 체크 알고리즘**
  - [ ] `lib/kcdc/health-checkup-analyzer.ts` 파일 생성
  - [ ] `checkMissingCheckups()` 함수 구현
  - [ ] 국가건강검진 통계 조회 로직 구현
  - [ ] 암 검진 통계 조회 로직 구현
  - [ ] 누락/지연 검진 식별 로직 구현
  - [ ] 우선순위 부여 로직 구현

- [ ] **6.2 검진 결과 해석 알고리즘**
  - [ ] `lib/kcdc/checkup-result-interpreter.ts` 파일 생성
  - [ ] `interpretCheckupResults()` 함수 구현
  - [ ] 동일 연령/성별 평균 수치 조회 로직 구현
  - [ ] 편차 계산 로직 구현
  - [ ] 위험도 판정 로직 구현
  - [ ] 쉬운 언어로 해석 리포트 생성 로직 구현
  - [ ] `generateDietRecommendationsFromCheckup()` 함수 구현 (검진 결과 기반 식단 추천)
  - [ ] 이상 지표별 식단 권장사항 생성 로직 구현
  - [ ] 식단 추천 시스템 자동 반영 로직 구현 (Phase 10.1 연동)
  - [ ] 개선 목표 설정 및 추적 로직 구현

- [ ] **6.3 API 엔드포인트**
  - [ ] `app/api/kcdc/checkup/recommendations/route.ts` 파일 생성
  - [ ] `GET /api/kcdc/checkup/recommendations` 구현 (누락 검진 항목 및 권장 일정 조회)
  - [ ] `app/api/kcdc/checkup/interpret/route.ts` 파일 생성
  - [ ] `POST /api/kcdc/checkup/interpret` 구현 (검진 결과 해석 리포트 생성)
  - [ ] `app/api/kcdc/checkup/diet-recommendations/route.ts` 파일 생성
  - [ ] `POST /api/kcdc/checkup/diet-recommendations` 구현 (검진 결과 기반 식단 추천 가이드 생성)
  - [ ] `app/api/kcdc/checkup/record/route.ts` 파일 생성
  - [ ] 검진 기록 관리 API 구현 (POST, GET, PUT)
  - [ ] `app/api/kcdc/checkup/institutions/route.ts` 파일 생성
  - [ ] `GET /api/kcdc/checkup/institutions` 구현 (검진 기관 목록 조회)
  - [ ] 프리미엄 가드 적용

- [ ] **6.4 UI 컴포넌트**
  - [ ] `app/(dashboard)/health/checkup/page.tsx` 페이지 생성
  - [ ] 누락 검진 항목 알림 카드 구현
  - [ ] 검진 권장 일정 캘린더 구현
  - [ ] 검진 기록 목록 구현
  - [ ] 검진 결과 해석 리포트 뷰어 구현
  - [ ] 검진 기관 찾기 기능 구현
  - [ ] `components/health/checkup-recommendations-card.tsx` 컴포넌트 생성
  - [ ] `components/health/checkup-result-interpreter.tsx` 컴포넌트 생성
  - [ ] 항목별 비교 차트 구현 (사용자 vs 평균)
  - [ ] 정상 범위 표시 기능 구현
  - [ ] 주의 사항 하이라이트 기능 구현
  - [ ] PDF 다운로드 기능 구현
  - [ ] `components/health/checkup-diet-recommendations.tsx` 컴포넌트 생성
  - [ ] 검진 결과 해석 후 자동 표시되는 식단 권장사항 카드 구현
  - [ ] 이상 지표별 추천 레시피 목록 구현
  - [ ] 개선 목표 설정 및 추적 기능 구현
  - [ ] "이 식단으로 개선하기" 버튼 구현 (식단 생성 페이지로 이동)

- [ ] **6.5 식단-건강검진 결과 통합 리포트 (Phase 10.1 연동)**
  - [ ] `app/api/health/integrated-report/route.ts` 파일 생성
  - [ ] `POST /api/health/integrated-report` 구현 (통합 리포트 생성)
  - [ ] 건강검진 결과와 실제 섭취 영양소 비교 분석 로직 구현
  - [ ] 이상 지표별 원인 분석 로직 구현
  - [ ] 개선 방안 제시 로직 구현
  - [ ] `components/health/integrated-health-report.tsx` 컴포넌트 생성
  - [ ] 비교 차트 구현
  - [ ] 원인 분석 표시 기능 구현
  - [ ] 개선 방안 제시 기능 구현
  - [ ] PDF 다운로드 기능 구현

### 🟠 그룹 5: 식단 최적화 (Phase 10.2 + Phase 10.3) - 함께 구현

**목적**: 식단 예산 계산 및 제철 식재료 기반 식단 추천

#### Phase 10.2: 농수산물유통공사 가격 정보 API 연동

- [ ] **10.2.1 데이터베이스 스키마**
  - [ ] `food_price_cache` 테이블 생성 (id, food_name, region, current_price, unit, price_trend, price_change_rate, cheapest_region, fetched_at)
  - [ ] 인덱스 추가

- [ ] **10.2.2 API 클라이언트**
  - [ ] `lib/atga/price-api-client.ts` 파일 생성
  - [ ] `fetchFoodPrice()` 함수 구현 (특정 식자재 가격 조회)
  - [ ] `fetchPriceTrend()` 함수 구현 (가격 변동 추이 조회)
  - [ ] `compareRegionalPrices()` 함수 구현 (지역별 가격 비교)
  - [ ] 캐싱 로직 구현

- [ ] **10.2.3 API 엔드포인트**
  - [ ] `app/api/atga/price/search/route.ts` 파일 생성
  - [ ] `GET /api/atga/price/search` 구현 (식자재 가격 조회)
  - [ ] `app/api/atga/price/calculate-budget/route.ts` 파일 생성
  - [ ] `POST /api/atga/price/calculate-budget` 구현 (식단 예산 계산)
  - [ ] 프리미엄 가드 적용

- [ ] **10.2.4 UI 컴포넌트**
  - [ ] `components/diet/budget-calculator.tsx` 컴포넌트 생성
  - [ ] 주간 식단 생성 후 예상 구매 비용 표시 기능 구현
  - [ ] 가격 변동 알림 및 절약 팁 표시 기능 구현
  - [ ] `components/home/price-alert-widget.tsx` 위젯 생성
  - [ ] 가격 알림 표시 기능 구현

#### Phase 10.3: 기상청 날씨 API 연동

- [ ] **10.3.1 데이터베이스 스키마**
  - [ ] `weather_cache` 테이블 생성 (id, region, date, temperature, humidity, weather_condition, air_quality, seasonal_foods, fetched_at)
  - [ ] 인덱스 추가

- [ ] **10.3.2 API 클라이언트**
  - [ ] `lib/kma/weather-api-client.ts` 파일 생성
  - [ ] `fetchCurrentWeather()` 함수 구현 (현재 날씨 정보 조회)
  - [ ] `fetchWeeklyForecast()` 함수 구현 (주간 날씨 예보 조회)
  - [ ] `getSeasonalFoods()` 함수 구현 (계절별 제철 식재료 추천)
  - [ ] 캐싱 로직 구현

- [ ] **10.3.3 API 엔드포인트**
  - [ ] `app/api/kma/weather/current/route.ts` 파일 생성
  - [ ] `GET /api/kma/weather/current` 구현 (현재 날씨 조회)
  - [ ] `app/api/kma/weather/seasonal-foods/route.ts` 파일 생성
  - [ ] `GET /api/kma/weather/seasonal-foods` 구현 (제철 식재료 추천)
  - [ ] `app/api/kma/weather/health-recommendations/route.ts` 파일 생성
  - [ ] `POST /api/kma/weather/health-recommendations` 구현 (날씨 기반 건강 추천)
  - [ ] 프리미엄 가드 적용

- [ ] **10.3.4 UI 컴포넌트**
  - [ ] `components/home/weather-health-widget.tsx` 위젯 생성
  - [ ] 현재 날씨, 제철 식재료, 건강 관리 팁 표시 기능 구현
  - [ ] `components/diet/seasonal-recommendations.tsx` 컴포넌트 생성
  - [ ] 주간 식단 생성 시 제철 식재료 자동 반영 기능 구현
  - [ ] 계절별 레시피 추천 기능 구현

- [ ] **10.3.5 식단 추천 시스템 통합**
  - [ ] 식단 추천 시 제철 식재료 우선 반영 로직 구현
  - [ ] 날씨 기반 건강 관리 알림 로직 구현
  - [ ] 계절성 질병 예방 식단 추천 로직 구현

### 🟠 그룹 6: 통합 대시보드 (Phase 7)

**목적**: 가족 건강 관리 통합 대시보드

- [ ] **7.1 건강 인사이트 대시보드**
  - [ ] `app/(dashboard)/health/insights/page.tsx` 페이지 생성
  - [ ] 감염병 위험 지수 요약 카드 구현
  - [ ] 예방접종 일정 요약 구현
  - [ ] 건강검진 권장 사항 요약 구현
  - [ ] 주간 질병 트렌드 차트 구현
  - [ ] 프리미엄 가드 적용

- [ ] **7.1.1 가족 구성원별 통합 건강 관리 대시보드**
  - [ ] `app/(dashboard)/health/family-dashboard/page.tsx` 페이지 생성
  - [ ] 가족 구성원별 건강 상태 요약 카드 구현 (탭 또는 그리드 레이아웃)
  - [ ] 각 구성원별 건강 지표 표시 구현
  - [ ] 가족 구성원별 맞춤 식단 추천 버튼 구현
  - [ ] 가족 전체 건강 트렌드 차트 구현 (최근 30일)
  - [ ] `components/health/family-member-health-card.tsx` 컴포넌트 생성
  - [ ] 구성원별 건강 상태 요약 표시 기능 구현
  - [ ] 건강 지표 배지 구현 (정상/주의/경고)
  - [ ] "상세 보기" 링크 구현
  - [ ] "식단 추천" 버튼 구현

- [ ] **7.2 홈페이지 통합**
  - [ ] `components/home/health-insights-section.tsx` 섹션 생성
  - [ ] 감염병 위험 지수 위젯 구현 (프리미엄 사용자만)
  - [ ] 예방접종 알림 위젯 구현
  - [ ] 건강검진 권장 위젯 구현
  - [ ] 프리미엄 가입 CTA 구현

- [ ] **7.3 주간 질병 트렌드 분석**
  - [ ] `lib/kcdc/weekly-trend-analyzer.ts` 파일 생성
  - [ ] 현재 주차 기준 감염병 발생 현황 요약 로직 구현
  - [ ] 전주 대비 증가율 계산 로직 구현
  - [ ] 주요 위험군 식별 로직 구현
  - [ ] `app/api/kcdc/trends/weekly/route.ts` 파일 생성
  - [ ] `GET /api/kcdc/trends/weekly` 구현 (주간 트렌드 조회)

### 🟡 그룹 7: 보조 건강 관리 기능

#### Phase 3: 개인 맞춤형 감염병 위험 분석 서비스

- [ ] **3.1 위험 지수 계산 알고리즘**
  - [ ] `lib/kcdc/risk-calculator.ts` 파일 생성
  - [ ] `calculateInfectionRiskScore()` 함수 구현
  - [ ] 기본 위험 점수 계산 로직 구현 (독감 경보 단계 기반)
  - [ ] 연령 가중치 계산 로직 구현
  - [ ] 기저질환 가중치 계산 로직 구현
  - [ ] 백신 접종 여부 가중치 계산 로직 구현
  - [ ] 지역 위험도 계산 로직 구현
  - [ ] 위험 등급 매핑 로직 구현
  - [ ] 단위 테스트 작성

- [ ] **3.2 행동 지침 생성**
  - [ ] `lib/kcdc/risk-recommendations.ts` 파일 생성
  - [ ] `generateRiskRecommendations()` 함수 구현
  - [ ] 구체적 행동 지침 생성 로직 구현

- [ ] **3.3 API 엔드포인트**
  - [ ] `app/api/kcdc/risk/calculate/route.ts` 파일 생성
  - [ ] `POST /api/kcdc/risk/calculate` 구현 (위험 지수 계산)
  - [ ] `app/api/kcdc/risk/history/route.ts` 파일 생성
  - [ ] `GET /api/kcdc/risk/history` 구현 (위험 지수 이력 조회)
  - [ ] 프리미엄 가드 적용

- [ ] **3.4 UI 컴포넌트**
  - [ ] `app/(dashboard)/health/infection-risk/page.tsx` 페이지 생성
  - [ ] 위험 지수 대시보드 구현 (원형 게이지 차트)
  - [ ] 위험 등급 배지 및 색상 표시 구현
  - [ ] 행동 지침 카드 리스트 구현
  - [ ] 추천 병원 목록 구현
  - [ ] 가족 구성원별 탭 구현
  - [ ] `components/health/infection-risk-dashboard.tsx` 컴포넌트 생성
  - [ ] `components/health/risk-recommendations-card.tsx` 컴포넌트 생성

#### Phase 4: 스마트 예방접종 일정 관리 서비스

- [ ] **4.1 접종 일정 생성 알고리즘**
  - [ ] `lib/kcdc/vaccination-scheduler.ts` 파일 생성
  - [ ] `generateVaccinationSchedule()` 함수 구현
  - [ ] KCDC 예방접종 정보 조회 로직 구현
  - [ ] 과거 접종 이력 비교 로직 구현
  - [ ] 접종 간격 규칙 적용 로직 구현
  - [ ] 권장 일정 생성 및 우선순위 부여 로직 구현

- [ ] **4.2 알림 시스템**
  - [ ] `app/api/kcdc/vaccination/reminders/route.ts` 파일 생성
  - [ ] 접종 일정 1주일 전 푸시 알림 로직 구현
  - [ ] 크론 잡 설정 (매일 09:00 KST)

- [ ] **4.3 병원 추천 시스템**
  - [ ] `lib/kcdc/vaccination-site-finder.ts` 파일 생성
  - [ ] 접종 가능 병원 찾기 로직 구현
  - [ ] 건강검진 기관 정보 활용 로직 구현

- [ ] **4.4 API 엔드포인트**
  - [ ] `app/api/kcdc/vaccination/schedule/route.ts` 파일 생성
  - [ ] `GET /api/kcdc/vaccination/schedule` 구현 (접종 일정 조회)
  - [ ] `app/api/kcdc/vaccination/record/route.ts` 파일 생성
  - [ ] 접종 기록 관리 API 구현 (POST, PUT, DELETE)
  - [ ] `app/api/kcdc/vaccination/sites/route.ts` 파일 생성
  - [ ] `GET /api/kcdc/vaccination/sites` 구현 (접종 가능 병원 조회)
  - [ ] 프리미엄 가드 적용

- [ ] **4.5 UI 컴포넌트**
  - [ ] `app/(dashboard)/health/vaccination/page.tsx` 페이지 생성
  - [ ] 접종 일정 캘린더 뷰 구현 (월별/주별)
  - [ ] 접종 기록 목록 구현 (완료/예정/누락)
  - [ ] 접종 가능 병원 지도 구현 (향후 확장)
  - [ ] 가족 구성원별 탭 구현
  - [ ] `components/health/vaccination-calendar.tsx` 컴포넌트 생성
  - [ ] `components/health/vaccination-record-card.tsx` 컴포넌트 생성

#### Phase 10.4: 환경부 대기질 정보 API 연동

- [ ] **10.4.1 데이터베이스 스키마**
  - [ ] `air_quality_cache` 테이블 생성 (id, region, date, pm10, pm25, o3, air_quality_index, air_quality_level, fetched_at)
  - [ ] 인덱스 추가

- [ ] **10.4.2 API 클라이언트**
  - [ ] `lib/me/air-quality-api-client.ts` 파일 생성
  - [ ] `fetchAirQuality()` 함수 구현 (실시간 대기질 정보 조회)
  - [ ] `fetchAirQualityForecast()` 함수 구현 (대기질 예보 조회)
  - [ ] 캐싱 로직 구현

- [ ] **10.4.3 API 엔드포인트**
  - [ ] `app/api/me/air-quality/current/route.ts` 파일 생성
  - [ ] `GET /api/me/air-quality/current` 구현 (현재 대기질 조회)
  - [ ] `app/api/me/air-quality/health-alerts/route.ts` 파일 생성
  - [ ] `POST /api/me/air-quality/health-alerts` 구현 (건강 알림 생성)

- [ ] **10.4.4 UI 컴포넌트**
  - [ ] `components/health/air-quality-alert.tsx` 컴포넌트 생성
  - [ ] 호흡기 질환 보유자에게 대기질 경고 표시 기능 구현
  - [ ] 실내 요리 추천 레시피 표시 기능 구현

- [ ] **10.4.5 감염병 위험 분석 통합**
  - [ ] 감염병 위험 분석 시 대기질 정보 반영 로직 구현

#### Phase 10.6: 통계청 생활 통계 API 연동

- [ ] **10.6.1 데이터베이스 스키마**
  - [ ] `health_statistics_cache` 테이블 생성 (id, age_group, gender, region, year, statistics_type, average_values, fetched_at)
  - [ ] 인덱스 추가

- [ ] **10.6.2 API 클라이언트**
  - [ ] `lib/kostat/health-statistics-api-client.ts` 파일 생성
  - [ ] `fetchHealthStatistics()` 함수 구현 (건강 통계 조회)
  - [ ] `compareUserHealth()` 함수 구현 (사용자 건강 상태와 평균 비교)
  - [ ] 캐싱 로직 구현

- [ ] **10.6.3 API 엔드포인트**
  - [ ] `app/api/kostat/health-statistics/compare/route.ts` 파일 생성
  - [ ] `POST /api/kostat/health-statistics/compare` 구현 (건강 통계 비교)

- [ ] **10.6.4 UI 컴포넌트**
  - [ ] `components/health/health-comparison-chart.tsx` 컴포넌트 생성
  - [ ] 사용자 vs 평균 건강 지표 비교 차트 구현
  - [ ] 개선 방향 제시 기능 구현

- [ ] **10.6.5 건강검진 결과 해석 통합**
  - [ ] 건강검진 결과 해석 시 통계청 데이터 활용 로직 구현

### 🟢 그룹 8: 선택적 기능

#### Phase 5: 여행 및 외출 위험 지역 경고 서비스

- [ ] **5.1 여행지 위험도 평가 알고리즘**
  - [ ] `lib/kcdc/travel-risk-assessor.ts` 파일 생성
  - [ ] `assessTravelRisk()` 함수 구현
  - [ ] 해외 유입 감염병 정보 조회 로직 구현
  - [ ] 법정 감염병 발생 현황 조회 로직 구현
  - [ ] 사용자 건강 상태 고려 로직 구현
  - [ ] 위험 등급 산출 및 예방 가이드 생성 로직 구현

- [ ] **5.2 실시간 외출 위험도**
  - [ ] `lib/kcdc/local-risk-assessor.ts` 파일 생성
  - [ ] `assessLocalRisk()` 함수 구현
  - [ ] 코로나19 검사 현황 조회 로직 구현
  - [ ] 법정 감염병 발생률 조회 로직 구현
  - [ ] 독감 경보 단계 반영 로직 구현
  - [ ] 실시간 권고 사항 생성 로직 구현

- [ ] **5.3 API 엔드포인트**
  - [ ] `app/api/kcdc/travel/assess/route.ts` 파일 생성
  - [ ] `POST /api/kcdc/travel/assess` 구현 (여행지 위험도 평가)
  - [ ] `app/api/kcdc/local/assess/route.ts` 파일 생성
  - [ ] `POST /api/kcdc/local/assess` 구현 (지역 외출 위험도)
  - [ ] 프리미엄 가드 적용

- [ ] **5.4 UI 컴포넌트**
  - [ ] `app/(dashboard)/health/travel-safety/page.tsx` 페이지 생성
  - [ ] 여행지 입력 폼 구현
  - [ ] 위험도 평가 결과 카드 구현
  - [ ] 감염병 경보 표시 기능 구현
  - [ ] 예방 물품 체크리스트 구현
  - [ ] 필수 백신 안내 기능 구현
  - [ ] `components/health/travel-risk-card.tsx` 컴포넌트 생성
  - [ ] `components/health/local-risk-widget.tsx` 위젯 생성

#### Phase 8: 관리자 페이지 확장

- [ ] **8.1 KCDC 데이터 관리**
  - [ ] `app/admin/kcdc-data/page.tsx` 페이지 생성
  - [ ] 동기화 상태 모니터링 기능 구현
  - [ ] 수동 동기화 트리거 기능 구현
  - [ ] 데이터 품질 리포트 기능 구현
  - [ ] 사용자별 위험 지수 통계 기능 구현

- [ ] **8.2 프리미엄 기능 사용 통계**
  - [ ] 사용자별 기능 사용 횟수 추적 로직 구현
  - [ ] 인기 기능 분석 기능 구현
  - [ ] 개선 포인트 식별 기능 구현

### 우선순위 요약

**페르소나 B (건강 관리 식단 사용자) 관점에서의 우선순위**:

0. **⚡ 성능 최적화** (Phase 0): 모든 기능 구현 전 필수 - API 응답 시간 최적화 및 사용자 경험 개선
1. **인프라 구축** (그룹 1: Phase 1-2): 모든 기능의 기반
2. **식단 추천 핵심 기능** (그룹 2: Phase 10.5, 10.1): 약물 상호작용 체크, 영양소 검증
3. **건강 관리 통합** (그룹 3: Phase 9 + 약물 복용 알림): 주기적 건강 관리 서비스 통합
4. **검진-식단 연동** (그룹 4: Phase 6 + Phase 10.1 통합): 검진 결과 기반 식단 추천
5. **식단 최적화** (그룹 5: Phase 10.2, 10.3): 예산 계산, 제철 식재료 추천
6. **통합 대시보드** (그룹 6: Phase 7): 가족 건강 관리 통합
7. **보조 건강 관리** (그룹 7: Phase 3, 4, 10.4, 10.6): 감염병 위험, 예방접종, 대기질, 통계 비교
8. **선택적 기능** (그룹 8: Phase 5, 8): 여행 위험도, 관리자 페이지

### 성능 최적화 목표

- **API 응답 시간**: 평균 200ms 이하
- **캐시 히트율**: 80% 이상
- **데이터베이스 쿼리 시간**: 평균 100ms 이하
- **사용자 경험**: 첫 화면 로딩 1초 이내, 상호작용 응답 200ms 이내

