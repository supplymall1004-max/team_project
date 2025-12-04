# Supabase 마이그레이션 가이드

## 개요

이 디렉토리에는 **맛의 아카이브** 프로젝트의 모든 데이터베이스 마이그레이션 파일들이 있습니다.

## 마이그레이션 파일 구조

### 통합 마이그레이션 파일 (순서대로 실행)

1. **`000_integrated_01_base_schema.sql`** - 기본 스키마 (사용자, 스토리지)
2. **`000_integrated_02_recipes.sql`** - 레시피 관련 테이블
3. **`000_integrated_03_health.sql`** - 건강 관련 테이블
4. **`000_integrated_04_diet.sql`** - 식단 관련 테이블
5. **`000_integrated_05_payment_premium.sql`** - 결제 및 프리미엄 기능
6. **`000_integrated_06_admin_legacy.sql`** - 관리자 콘솔 및 레거시 아카이브

### 초기 데이터 파일

- **`20251130000000_insert_homepage_default_content.sql`** - 홈페이지 기본 콘텐츠
- **`sample_data_v1.sql`** - 개발 및 테스트용 샘플 데이터 (선택사항)

## 사용 방법

### 1. 신규 프로젝트 설정 (권장)

```bash
# Supabase CLI 사용
supabase db reset

# 또는 수동으로 순서대로 실행
psql -f supabase/migrations/000_integrated_01_base_schema.sql
psql -f supabase/migrations/000_integrated_02_recipes.sql
psql -f supabase/migrations/000_integrated_03_health.sql
psql -f supabase/migrations/000_integrated_04_diet.sql
psql -f supabase/migrations/000_integrated_05_payment_premium.sql
psql -f supabase/migrations/000_integrated_06_admin_legacy.sql

# 초기 데이터 삽입
psql -f supabase/migrations/20251130000000_insert_homepage_default_content.sql

# 샘플 데이터 추가 (선택사항)
psql -f supabase/migrations/sample_data_v1.sql
```

### 2. Supabase Dashboard에서 수동 실행

1. Supabase Dashboard → SQL Editor 접속
2. 파일을 순서대로 복사하여 실행
3. 초기 데이터 및 샘플 데이터 실행

## 데이터베이스 스키마 개요

### 주요 테이블 그룹

#### 1. 기본 스키마 (`000_integrated_01_base_schema.sql`)
- `users` - Clerk 인증 연동 사용자 정보
- Storage 버킷: `uploads`, `popup-images`
- 공통 함수: `update_updated_at_column()`

#### 2. 레시피 시스템 (`000_integrated_02_recipes.sql`)
- `recipes` - 레시피 기본 정보
- `recipe_ingredients` - 레시피 재료 (카테고리 포함)
- `recipe_steps` - 조리 단계
- `recipe_ratings` - 레시피 평가
- `recipe_reports` - 레시피 신고
- `royal_recipes_posts` - 궁중 레시피 블로그
- `recipe_usage_history` - 레시피 사용 이력

#### 3. 건강 관리 (`000_integrated_03_health.sql`)
- `user_health_profiles` - 사용자 건강 프로필
- `family_members` - 가족 구성원 정보 (최대 10명 제한)
- `diseases` - 질병 마스터 데이터
- `disease_excluded_foods` - 질병별 제외 음식 (레거시)
- `disease_excluded_foods_extended` - 질병별 제외 음식 (확장)
- `allergies` - 알레르기 마스터 데이터
- `allergy_derived_ingredients` - 알레르기 파생 재료
- `emergency_procedures` - 응급조치 정보
- `calorie_calculation_formulas` - 칼로리 계산 공식

#### 4. 식단 관리 (`000_integrated_04_diet.sql`)
- `diet_plans` - 일일 식단 계획 (개인별 + 통합)
- `weekly_diet_plans` - 주간 식단 메타데이터
- `weekly_shopping_lists` - 주간 장보기 리스트
- `weekly_nutrition_stats` - 주간 영양 통계
- `diet_notification_settings` - 식단 알림 설정

#### 5. 결제 및 프리미엄 (`000_integrated_05_payment_premium.sql`)
- `user_subscriptions` - 사용자 구독 관리
- `subscriptions` - 구독 정보 (결제 시스템)
- `payment_transactions` - 결제 내역
- `promo_codes` - 프로모션 코드
- `promo_code_uses` - 프로모션 사용 내역
- `favorite_meals` - 즐겨찾기 식단
- `meal_kits` - 수동 등록 밀키트 제품
- `meal_kit_products` - 쿠팡 API 제품 캐시

#### 6. 관리자 및 레거시 (`000_integrated_06_admin_legacy.sql`)
- `admin_copy_blocks` - 페이지 문구 관리
- `popup_announcements` - 팝업 공지 관리
- `notification_logs` - 알림 로그
- `admin_security_audit` - 보안 감사 로그
- `kcdc_alerts` - 질병관리청(KCDC) 알림
- `legacy_masters` - 레거시 명인 정보
- `legacy_videos` - 레거시 비디오
- `legacy_documents` - 레거시 문서
- `legacy_replacement_guides` - 대체 재료 가이드
- `image_usage_logs` - 이미지 사용 로그
- `image_cache_stats` - 이미지 캐시 통계
- `image_cache_cleanup_logs` - 이미지 캐시 정리 로그

## 개발 환경 설정

### RLS (Row Level Security)
- **개발 환경**: 모든 테이블에서 RLS 비활성화 (`DISABLE ROW LEVEL SECURITY`)
- **프로덕션 환경**: 적절한 RLS 정책 적용 필요

### 권한 설정
모든 테이블에 다음 권한이 부여됩니다:
- `anon` - 익명 사용자
- `authenticated` - 인증된 사용자
- `service_role` - 서비스 역할

## 주요 제약조건 및 규칙

### 가족 구성원 제한
- 사용자당 최대 10명의 가족 구성원만 등록 가능
- `check_family_member_limit()` 함수로 자동 검증

### 식단 알림 설정
- 사용자당 하나의 알림 설정만 가능
- `diet_notification_settings_user_id_unique` 제약조건

### 구독 시스템
- 구독 상태: `active`, `inactive`, `cancelled`, `paused`
- 결제 상태: `pending`, `completed`, `failed`, `refunded`

### 기본 구독 자동 생성
- 사용자 생성 시 자동으로 `free` 플랜 구독 생성
- `create_default_subscription()` 트리거 함수

## 샘플 데이터 내용

### 포함된 샘플 데이터 (`sample_data_v1.sql`)
- **질병**: 당뇨, 고혈압, 고지혈증, 통풍, 신장병, 비만 (6개)
- **알레르기**: 땅콩, 우유, 달걀, 생선 등 주요 8대 알레르기 (8개)
- **레시피**: 밥류, 반찬류, 국/찌개류 (10개)
- **칼로리 계산 공식**: Harris-Benedict, Mifflin-St Jeor (4개)
- **프로모션 코드**: 런칭 할인, 테스트 할인 (3개)
- **KCDC 알림**: 독감 주의보, 예방접종 안내 (2개)
- **레거시 데이터**: 명인, 비디오 (2개)
- **팝업 공지**: 서비스 오픈, 신규 레시피 (2개)

## 마이그레이션 버전 관리

- **v1.0** (2025-12-02): 통합 마이그레이션 파일로 정리
  - 기존 개별 마이그레이션 파일들을 6개의 통합 파일로 재구성
  - 중복 제거 및 최적화
  - 샘플 데이터 분리

## 문제 해결

### 마이그레이션 실패 시
1. Supabase CLI가 최신 버전인지 확인
2. 데이터베이스 연결 상태 확인
3. 파일을 순서대로 실행했는지 확인

### 권한 오류 시
```sql
-- 수동 권한 부여
GRANT ALL ON TABLE table_name TO anon, authenticated, service_role;
```

### 제약조건 충돌 시
```sql
-- 기존 데이터 확인
SELECT * FROM table_name WHERE conflict_condition;

-- 충돌 데이터 삭제 또는 수정 후 재실행
```

### RLS 관련 오류 시
```sql
-- 개발 환경에서 RLS 비활성화
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

## 다음 단계

마이그레이션 완료 후:
1. **API Routes** 또는 **Server Actions** 구현
2. **프론트엔드 컴포넌트** 개발
3. **인증 로직** 구현 (Clerk)
4. **실시간 기능** 추가 (Supabase Realtime)

---

**문의**: 마이그레이션 관련 문의사항은 개발팀에 문의해주세요.
