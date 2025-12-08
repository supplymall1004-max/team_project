# 데이터베이스 스키마 분석 보고서

**작성일**: 2025-01-01  
**분석 대상**: Supabase 데이터베이스 스키마 vs 프로젝트 마이그레이션 파일

---

## 📋 목차

1. [주요 발견 사항](#주요-발견-사항)
2. [누락된 테이블](#누락된-테이블)
3. [누락된 필드](#누락된-필드)
4. [타입 불일치](#타입-불일치)
5. [권장 조치 사항](#권장-조치-사항)

---

## 🔍 주요 발견 사항

### 1. 레시피 시스템 마이그레이션 파일 누락 ⚠️

**문제점**: 
- `supabase/migrations/README.md`에는 `000_integrated_02_recipes.sql` 파일이 언급되어 있지만, 실제 파일이 존재하지 않습니다.
- 레시피 관련 테이블들이 통합 마이그레이션에 포함되지 않았습니다.

**영향받는 테이블**:
- `recipes`
- `recipe_ingredients`
- `recipe_steps`
- `recipe_ratings`
- `recipe_reports`
- `royal_recipes_posts`
- `recipe_usage_history`

**권장 조치**: `000_integrated_02_recipes.sql` 파일을 생성하여 레시피 관련 모든 테이블을 포함해야 합니다.

---

### 2. 식약처 레시피 캐시 테이블 누락 ⚠️

**문제점**:
- 사용자가 제공한 스키마에 `foodsafety_recipes_cache` 테이블이 있지만, 마이그레이션 파일에는 없습니다.

**스키마 정의**:
```sql
CREATE TABLE public.foodsafety_recipes_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rcp_seq text NOT NULL UNIQUE,
  rcp_nm text NOT NULL,
  rcp_pat2 text,
  rcp_way2 text,
  info_eng numeric,
  info_car numeric,
  info_pro numeric,
  info_fat numeric,
  info_na numeric,
  rcp_parts_dtls text,
  rcp_na_tip text,
  att_file_no_main text,
  att_file_no_mk text,
  hash_tag text,
  manual_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  cached_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT foodsafety_recipes_cache_pkey PRIMARY KEY (id)
);
```

**권장 조치**: 이 테이블을 생성하는 마이그레이션 파일을 추가해야 합니다.

---

### 3. Users 테이블의 notification_settings 필드

**현재 상태**: ✅ 정상
- `20251203000000_add_notification_settings.sql` 마이그레이션으로 추가됨
- 기본 스키마(`000_integrated_01_base_schema.sql`)에는 없지만, 추가 마이그레이션으로 처리됨

**권장 조치**: 기본 스키마에 포함시키거나, 마이그레이션 순서를 명확히 문서화

---

### 4. Diet Plans 테이블의 추가 영양소 필드

**현재 상태**: ✅ 정상
- `20251206010000_add_nutrition_fields_to_diet_plans.sql` 마이그레이션으로 추가됨
- 다음 필드들이 추가됨:
  - `potassium_mg` (INTEGER)
  - `phosphorus_mg` (INTEGER)
  - `gi_index` (DECIMAL(5,2))

**권장 조치**: 기본 스키마에 포함시키거나, 마이그레이션 순서를 명확히 문서화

---

### 5. Popup Announcements 테이블의 display_type 필드

**현재 상태**: ✅ 정상
- `20250101000000_add_popup_display_type.sql` 마이그레이션으로 추가됨
- `display_type` 필드가 추가됨 (기본값: 'modal', CHECK 제약조건: 'modal' | 'checkpoint')

**권장 조치**: 기본 스키마에 포함시키거나, 마이그레이션 순서를 명확히 문서화

---

### 6. Recipe Ingredients 테이블의 category 필드 타입

**문제점**: ⚠️
- 사용자가 제공한 스키마에서 `category USER-DEFINED DEFAULT '기타'::ingredient_category`로 표시됨
- 마이그레이션 파일에서 `ingredient_category` ENUM 타입이 생성되는지 확인 필요

**현재 사용 예시**:
- 샘플 데이터 파일에서 `'조미료'::ingredient_category` 형식으로 사용됨
- 하지만 ENUM 타입 생성 마이그레이션이 없음

**권장 조치**: `ingredient_category` ENUM 타입을 생성하는 마이그레이션 추가 필요

---

## 📊 누락된 테이블

### 1. `foodsafety_recipes_cache`
- **용도**: 식약처 API 레시피 캐시
- **우선순위**: 높음
- **권장 조치**: 마이그레이션 파일 생성 필요

---

## 🔧 누락된 필드

### 1. `recipes` 테이블
모든 필드는 마이그레이션에 포함되어 있는 것으로 확인됨. ✅

### 2. `diet_plans` 테이블
추가 필드들이 별도 마이그레이션으로 추가됨. ✅

### 3. `popup_announcements` 테이블
`display_type` 필드가 별도 마이그레이션으로 추가됨. ✅

### 4. `users` 테이블
`notification_settings` 필드가 별도 마이그레이션으로 추가됨. ✅

---

## 🔄 타입 불일치

### 1. `recipe_ingredients.category` 필드

**스키마**: `USER-DEFINED DEFAULT '기타'::ingredient_category`  
**코드**: TypeScript에서 `IngredientCategory` 타입으로 정의됨

**문제점**: ENUM 타입 생성 마이그레이션이 없음

**권장 조치**:
```sql
-- ENUM 타입 생성
CREATE TYPE ingredient_category AS ENUM (
  '곡물',
  '채소',
  '과일',
  '육류',
  '해산물',
  '유제품',
  '조미료',
  '기타'
);

-- recipe_ingredients 테이블에 적용
ALTER TABLE recipe_ingredients 
ALTER COLUMN category TYPE ingredient_category 
USING category::ingredient_category;
```

---

## ✅ 권장 조치 사항

### 즉시 조치 필요 (높은 우선순위)

1. **레시피 시스템 마이그레이션 파일 생성**
   - `supabase/migrations/000_integrated_02_recipes.sql` 파일 생성
   - 다음 테이블 포함:
     - `recipes`
     - `recipe_ingredients` (ENUM 타입 포함)
     - `recipe_steps`
     - `recipe_ratings`
     - `recipe_reports`
     - `royal_recipes_posts`
     - `recipe_usage_history`

2. **식약처 레시피 캐시 테이블 생성**
   - `supabase/migrations/YYYYMMDDHHmmss_create_foodsafety_recipes_cache.sql` 파일 생성

3. **Ingredient Category ENUM 타입 생성**
   - 레시피 마이그레이션 파일에 포함하거나 별도 마이그레이션으로 생성

### 개선 권장 (중간 우선순위)

1. **마이그레이션 순서 문서화**
   - 추가 마이그레이션 파일들의 실행 순서 명확화
   - README.md에 마이그레이션 실행 순서 추가

2. **기본 스키마 통합**
   - 추가 마이그레이션으로 추가된 필드들을 기본 스키마에 포함 검토
   - 또는 마이그레이션 의존성 명확히 문서화

### 선택 사항 (낮은 우선순위)

1. **타입 정의 파일 동기화**
   - TypeScript 타입 정의와 데이터베이스 스키마 일치 확인
   - 자동 타입 생성 도구 검토 (Supabase CLI)

---

## 📝 체크리스트

- [ ] `000_integrated_02_recipes.sql` 파일 생성
- [ ] `foodsafety_recipes_cache` 테이블 마이그레이션 생성
- [ ] `ingredient_category` ENUM 타입 마이그레이션 생성
- [ ] 마이그레이션 실행 순서 문서화
- [ ] TypeScript 타입 정의와 스키마 일치 확인
- [ ] 모든 마이그레이션 파일 테스트

---

## 🔗 관련 파일

- `supabase/migrations/README.md` - 마이그레이션 가이드
- `types/recipe.ts` - 레시피 타입 정의
- `types/health.ts` - 건강 관련 타입 정의
- `types/diet.ts` - 식단 관련 타입 정의

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-01-01

